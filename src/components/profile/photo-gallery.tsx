"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type GalleryPhoto = {
  id: string;
  src: string;
  blurDataUrl: string;
  alt: string;
};

const blur = (photo: GalleryPhoto) =>
  photo.blurDataUrl
    ? ({ placeholder: "blur", blurDataURL: photo.blurDataUrl } as const)
    : ({ placeholder: "empty" } as const);

/**
 * Photos at the top of a profile: one large and up to four small on wider screens, a
 * swipeable row on phones. Any photo opens full screen.
 */
export function PhotoGallery({ photos, name }: { photos: GalleryPhoto[]; name: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const current = photos[index]!;
  const visible = photos.slice(0, 5);
  const hidden = photos.length - visible.length;

  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const step = (by: number) => setIndex((i) => (i + by + photos.length) % photos.length);

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "ArrowRight") step(1);
    if (event.key === "ArrowLeft") step(-1);
  }

  return (
    <>
      {/* One list: a row you can swipe on phones; on wider screens, one large photo and up
          to four small ones. */}
      <ul
        className={cn(
          "-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1",
          "sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0",
          visible.length === 1
            ? "sm:grid-cols-1"
            : "sm:h-[22rem] sm:grid-cols-4 sm:grid-rows-2 lg:h-[26rem]",
        )}
      >
        {photos.map((photo, i) => {
          const large = i === 0 || (visible.length === 2 && i === 1);
          return (
            <li
              key={photo.id}
              className={cn(
                "w-[85%] shrink-0 snap-center sm:w-auto",
                i >= visible.length && "sm:hidden",
                visible.length === 1 && "sm:aspect-[16/7]",
                visible.length > 1 && large && "sm:col-span-2 sm:row-span-2",
                visible.length === 3 && i > 0 && "sm:col-span-2",
                visible.length === 4 && i === 3 && "sm:col-span-2",
              )}
            >
              <button
                type="button"
                onClick={() => open(i)}
                className="group relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-surface-2 sm:aspect-auto sm:h-full"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes={
                    large
                      ? "(min-width: 1152px) 576px, (min-width: 640px) 50vw, 85vw"
                      : "(min-width: 1152px) 288px, (min-width: 640px) 25vw, 85vw"
                  }
                  preload={i === 0}
                  {...blur(photo)}
                  className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                />
                {i === visible.length - 1 && hidden > 0 && (
                  <span className="absolute inset-0 hidden items-center justify-center gap-2 bg-black/55 font-semibold text-white sm:flex">
                    <Images className="size-5" aria-hidden /> +{hidden} more
                  </span>
                )}
                <span className="sr-only">
                  Open photo {i + 1} of {photos.length} full screen
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <dialog
        ref={dialog}
        onKeyDown={onKeyDown}
        aria-label={`Photos of ${name}`}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-black/90"
      >
        <div className="flex h-full flex-col text-white">
          <div className="flex items-center justify-between gap-4 p-3 sm:p-4">
            <p className="text-sm" aria-live="polite">
              {index + 1} / {photos.length}
            </p>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            >
              <X className="size-6" aria-hidden />
              <span className="sr-only">Close photos</span>
            </button>
          </div>

          <div className="relative min-h-0 flex-1">
            <Image
              key={current.id}
              src={current.src}
              alt={current.alt}
              fill
              sizes="100vw"
              {...blur(current)}
              className="object-contain"
            />
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="absolute top-1/2 left-2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 sm:left-4"
                >
                  <ChevronLeft className="size-7" aria-hidden />
                  <span className="sr-only">Previous photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="absolute top-1/2 right-2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 hover:bg-black/70 sm:right-4"
                >
                  <ChevronRight className="size-7" aria-hidden />
                  <span className="sr-only">Next photo</span>
                </button>
              </>
            )}
          </div>

          <p className="mx-auto max-w-2xl p-4 text-center text-sm text-white/85">{current.alt}</p>
        </div>
      </dialog>
    </>
  );
}
