import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { ImageRejectedError, processEvidence, processPhoto } from "./process-image";

const solid = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: { r: 200, g: 65, b: 10 } } });

async function rejection(promise: Promise<unknown>) {
  try {
    await promise;
    return null;
  } catch (error) {
    return error instanceof ImageRejectedError ? error.reason : String(error);
  }
}

describe("processPhoto", () => {
  it("stores three WebP sizes and a blurred preview", async () => {
    const photo = await processPhoto(await solid(3000, 2000).jpeg().toBuffer());

    expect(photo.width).toBe(1600);
    expect(photo.height).toBe(1067);
    expect(photo.blurDataUrl).toMatch(/^data:image\/webp;base64,/);
    for (const [size, width] of [
      ["sm", 480],
      ["md", 960],
      ["lg", 1600],
    ] as const) {
      const meta = await sharp(photo.files[size]).metadata();
      expect(meta.format).toBe("webp");
      expect(meta.width).toBe(width);
    }
  });

  it("never enlarges a small photo", async () => {
    const photo = await processPhoto(await solid(800, 600).png().toBuffer());
    expect(photo.width).toBe(800);
    expect((await sharp(photo.files.md).metadata()).width).toBe(800);
  });

  it("turns photos the right way up and removes camera data such as location", async () => {
    // A portrait phone photo is often stored sideways with an "orientation" tag.
    const sideways = await solid(1200, 900)
      .jpeg()
      .withExif({ IFD0: { Make: "PhoneCo" }, IFD3: { GPSLatitudeRef: "S" } })
      .withMetadata({ orientation: 6 })
      .toBuffer();
    const original = await sharp(sideways).metadata();
    expect(original.orientation).toBe(6);
    expect(original.exif?.toString("latin1")).toContain("PhoneCo");

    const photo = await processPhoto(sideways);
    const meta = await sharp(photo.files.lg).metadata();
    expect([meta.width, meta.height]).toEqual([900, 1200]);
    expect(meta.exif).toBeUndefined();
    expect(meta.orientation).toBeUndefined();
  });

  it("refuses files that aren't JPEG, PNG or WebP photos", async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"/>');
    expect(await rejection(processPhoto(svg))).toBe("unsupported-format");
    expect(await rejection(processPhoto(await solid(900, 900).gif().toBuffer()))).toBe(
      "unsupported-format",
    );
    expect(await rejection(processPhoto(Buffer.from("MZ this is not an image")))).toBe(
      "not-an-image",
    );
    expect(await rejection(processPhoto(Buffer.alloc(0)))).toBe("empty");
  });

  it("refuses photos that are too small or too big", async () => {
    expect(await rejection(processPhoto(await solid(300, 200).jpeg().toBuffer()))).toBe(
      "too-small",
    );
    expect(await rejection(processPhoto(Buffer.alloc(9 * 1024 * 1024, 1)))).toBe("too-large");
  });

  it("refuses a damaged photo", async () => {
    const jpeg = await solid(1200, 900).jpeg().toBuffer();
    expect(await rejection(processPhoto(jpeg.subarray(0, jpeg.length / 3)))).toBe("not-an-image");
  });
});

describe("processEvidence", () => {
  it("keeps PDFs as they are", async () => {
    const pdf = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF");
    expect(await processEvidence(pdf)).toMatchObject({ extension: "pdf", data: pdf });
  });

  it("re-encodes photos", async () => {
    const result = await processEvidence(await solid(1000, 800).png().toBuffer());
    expect(result.extension).toBe("webp");
    expect((await sharp(result.data).metadata()).format).toBe("webp");
  });

  it("refuses anything else", async () => {
    expect(await rejection(processEvidence(Buffer.from("<html>hello</html>")))).toBe(
      "not-an-image",
    );
    expect(await rejection(processEvidence(Buffer.alloc(6 * 1024 * 1024, 1)))).toBe("too-large");
  });
});
