/** Photo sizes stored for every upload; must match PHOTO_WIDTHS in src/server/images. */
export type MediaSize = "sm" | "md" | "lg";

/** A photo's address without the size, e.g. `/media/businesses/<id>/<photo>`. The image
 * loader (src/lib/image-loader.ts) adds the size that fits the screen. */
export function photoSrc(storageKey: string): string {
  return `/media/${storageKey}`;
}

export function photoUrl(storageKey: string, size: MediaSize): string {
  return `${photoSrc(storageKey)}-${size}.webp`;
}

export function photoStorageKey(businessId: string, photoId: string): string {
  return `businesses/${businessId}/${photoId}`;
}

export function photoFileKey(storageKey: string, size: MediaSize): string {
  return `public/${storageKey}-${size}.webp`;
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const PUBLIC_MEDIA_PATH = new RegExp(`^businesses/${UUID}/${UUID}-(sm|md|lg)\\.webp$`);

/** Only stored business photos can be requested through /media. */
export function isPublicMediaPath(path: string): boolean {
  return PUBLIC_MEDIA_PATH.test(path);
}
