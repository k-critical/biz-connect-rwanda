import "server-only";
import sharp from "sharp";

/** Largest file accepted from a browser. Phones shrink photos before sending (see
 * src/components/owner/prepare-upload.ts), so most arrive well under this. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;

/** Widths of the stored versions: cards use `sm`, profile pages `md`, full screen `lg`. */
export const PHOTO_WIDTHS = { sm: 480, md: 960, lg: 1600 } as const;
export type PhotoSize = keyof typeof PHOTO_WIDTHS;

const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;
const MAX_INPUT_PIXELS = 50_000_000;

export type ImageRejection =
  "empty" | "too-large" | "not-an-image" | "unsupported-format" | "too-small";

export class ImageRejectedError extends Error {
  constructor(readonly reason: ImageRejection) {
    super(`Image rejected: ${reason}`);
  }
}

export const IMAGE_REJECTION_MESSAGES: Record<ImageRejection, string> = {
  empty: "Choose a photo to upload.",
  "too-large": "That file is too big. Photos can be up to 8 MB.",
  "not-an-image": "That file isn't a photo we can read. Use a JPEG, PNG or WebP image.",
  "unsupported-format": "Use a JPEG, PNG or WebP photo.",
  "too-small": `That photo is too small. Use one at least ${MIN_WIDTH} × ${MIN_HEIGHT} pixels.`,
};

/**
 * Checks what the file really is (by its content, not its name), then decodes it. Only JPEG,
 * PNG and WebP are accepted; anything else, including SVG, is refused.
 */
async function openImage(input: Buffer, maxBytes: number) {
  if (input.byteLength === 0) throw new ImageRejectedError("empty");
  if (input.byteLength > maxBytes) throw new ImageRejectedError("too-large");

  let format: string | undefined;
  try {
    ({ format } = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).metadata());
  } catch {
    throw new ImageRejectedError("not-an-image");
  }
  if (format !== "jpeg" && format !== "png" && format !== "webp") {
    throw new ImageRejectedError("unsupported-format");
  }
  // Turn the photo the right way up. Sharp drops EXIF data (camera, GPS location) on output.
  return sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" }).autoOrient();
}

export type ProcessedPhoto = {
  files: Record<PhotoSize, Buffer>;
  /** Size of the `lg` version. */
  width: number;
  height: number;
  blurDataUrl: string;
};

/** Re-encodes an uploaded photo as WebP in three sizes, plus a tiny blurred preview. */
export async function processPhoto(input: Buffer): Promise<ProcessedPhoto> {
  const image = await openImage(input, MAX_UPLOAD_BYTES);

  const encodeLarge = () =>
    image
      .clone()
      .resize({
        width: PHOTO_WIDTHS.lg,
        height: PHOTO_WIDTHS.lg,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });

  let lg: Awaited<ReturnType<typeof encodeLarge>>;
  try {
    lg = await encodeLarge();
  } catch {
    throw new ImageRejectedError("not-an-image");
  }
  if (lg.info.width < MIN_WIDTH || lg.info.height < MIN_HEIGHT) {
    throw new ImageRejectedError("too-small");
  }

  const resized = (width: number) =>
    image
      .clone()
      .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();

  const [sm, md, blur] = await Promise.all([
    resized(PHOTO_WIDTHS.sm),
    resized(PHOTO_WIDTHS.md),
    image.clone().resize({ width: 16, height: 16, fit: "inside" }).webp({ quality: 40 }).toBuffer(),
  ]);

  return {
    files: { sm, md, lg: lg.data },
    width: lg.info.width,
    height: lg.info.height,
    blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}`,
  };
}

export type ProcessedEvidence = { data: Buffer; extension: "webp" | "pdf"; type: string };

/**
 * A claim document: a PDF is kept as it is (only admins download it), a photo is re-encoded
 * so that nothing hidden in the original file survives.
 */
export async function processEvidence(input: Buffer): Promise<ProcessedEvidence> {
  if (input.byteLength === 0) throw new ImageRejectedError("empty");
  if (input.byteLength > MAX_EVIDENCE_BYTES) throw new ImageRejectedError("too-large");
  if (input.subarray(0, 5).toString("latin1") === "%PDF-") {
    return { data: input, extension: "pdf", type: "application/pdf" };
  }
  const image = await openImage(input, MAX_EVIDENCE_BYTES);
  const data = await image
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
  return { data, extension: "webp", type: "image/webp" };
}
