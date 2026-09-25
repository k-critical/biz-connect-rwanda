"use client";

import type { ImageLoaderProps } from "next/image";

/**
 * Uploaded photos are already stored as WebP in three widths (480, 960 and 1600 pixels), so
 * next/image picks one of those instead of resizing on every request.
 */
export default function mediaLoader({ src, width }: ImageLoaderProps): string {
  if (!src.startsWith("/media/")) return src;
  const size = width <= 480 ? "sm" : width <= 960 ? "md" : "lg";
  return `${src}-${size}.webp`;
}
