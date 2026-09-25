import { describe, expect, it } from "vitest";
import mediaLoader from "./image-loader";
import { isPublicMediaPath, photoFileKey, photoSrc, photoStorageKey } from "./media";

const BUSINESS = "0199b0f4-8d2a-7c3e-9a51-3f6f1f7e2a10";
const PHOTO = "8f0e2c9a-1b2c-4d3e-8f4a-5b6c7d8e9f01";

describe("photo addresses", () => {
  const key = photoStorageKey(BUSINESS, PHOTO);

  it("keeps stored files and public addresses in step", () => {
    expect(photoFileKey(key, "md")).toBe(`public/businesses/${BUSINESS}/${PHOTO}-md.webp`);
    expect(photoSrc(key)).toBe(`/media/businesses/${BUSINESS}/${PHOTO}`);
  });

  it("only allows stored photo files through /media", () => {
    expect(isPublicMediaPath(`businesses/${BUSINESS}/${PHOTO}-sm.webp`)).toBe(true);
    expect(isPublicMediaPath(`businesses/${BUSINESS}/${PHOTO}-xl.webp`)).toBe(false);
    expect(isPublicMediaPath(`businesses/${BUSINESS}/${PHOTO}-sm.png`)).toBe(false);
    expect(isPublicMediaPath(`claims/${PHOTO}.webp`)).toBe(false);
    expect(isPublicMediaPath(`../private/claims/${PHOTO}.pdf`)).toBe(false);
    expect(isPublicMediaPath(`businesses/${BUSINESS}/../../private/${PHOTO}-sm.webp`)).toBe(false);
  });
});

describe("image loader", () => {
  const src = `/media/businesses/${BUSINESS}/${PHOTO}`;

  it("picks the stored size that covers the requested width", () => {
    expect(mediaLoader({ src, width: 480 })).toBe(`${src}-sm.webp`);
    expect(mediaLoader({ src, width: 960 })).toBe(`${src}-md.webp`);
    expect(mediaLoader({ src, width: 1600 })).toBe(`${src}-lg.webp`);
  });

  it("leaves other images alone", () => {
    expect(mediaLoader({ src: "/icon.svg", width: 480 })).toBe("/icon.svg");
  });
});
