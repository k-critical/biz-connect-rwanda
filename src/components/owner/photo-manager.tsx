"use client";

import Image from "next/image";
import { useId, useRef, useState, useTransition, type FormEvent } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2 } from "lucide-react";
import type { FormState } from "@/lib/form-state";
import { LISTING_LIMITS } from "@/lib/listing-rules";
import {
  deletePhotoAction,
  movePhotoAction,
  updatePhotoAltAction,
  uploadPhotoAction,
} from "@/app/dashboard/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { prepareImageForUpload } from "./prepare-upload";

export type ManagedPhoto = { id: string; src: string; blurDataUrl: string; alt: string };

const MAX_BYTES = 8 * 1024 * 1024;

type Notice = { tone: "success" | "error" | "info"; text: string };

export function PhotoManager({
  businessId,
  photos,
}: {
  businessId: string;
  photos: ManagedPhoto[];
}) {
  const inputId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [pending, startTransition] = useTransition();
  const remaining = LISTING_LIMITS.photos - photos.length;

  async function upload(files: File[]) {
    const accepted = files.slice(0, remaining);
    const messages: Notice[] = [];
    if (files.length > accepted.length) {
      messages.push({
        tone: "info",
        text: `Only ${remaining} more photo${remaining === 1 ? "" : "s"} fit, so ${files.length - accepted.length} were skipped.`,
      });
    }
    let added = 0;
    setUploading({ done: 0, total: accepted.length });
    for (const [index, original] of accepted.entries()) {
      const file = await prepareImageForUpload(original);
      if (file.size > MAX_BYTES) {
        messages.push({ tone: "error", text: `${original.name}: too big (over 8 MB).` });
      } else {
        const form = new FormData();
        form.set("businessId", businessId);
        form.set("photo", file);
        const result = await uploadPhotoAction(form).catch((): FormState => ({
          status: "error",
          message: "The upload didn't finish. Check your connection and try again.",
          fieldErrors: {},
        }));
        if (result.status === "error") {
          messages.push({ tone: "error", text: `${original.name}: ${result.message}` });
        } else added++;
      }
      setUploading({ done: index + 1, total: accepted.length });
    }
    if (added > 0) {
      messages.unshift({
        tone: "success",
        text: `${added} photo${added === 1 ? "" : "s"} added. Add a short description to each one below.`,
      });
    }
    setUploading(null);
    setNotices(messages);
    if (fileInput.current) fileInput.current.value = "";
  }

  function run(action: (form: FormData) => Promise<FormState>, form: FormData) {
    startTransition(async () => {
      const result = await action(form);
      setNotices(
        result.status === "idle"
          ? []
          : [{ tone: result.status === "error" ? "error" : "success", text: result.message }],
      );
    });
  }

  function photoForm(photoId: string, fields: Record<string, string>) {
    const form = new FormData();
    form.set("businessId", businessId);
    form.set("photoId", photoId);
    for (const [key, value] of Object.entries(fields)) form.set(key, value);
    return form;
  }

  function saveAlt(event: FormEvent<HTMLFormElement>, photoId: string) {
    event.preventDefault();
    const altText = String(new FormData(event.currentTarget).get("altText") ?? "");
    run(updatePhotoAltAction, photoForm(photoId, { altText }));
  }

  const busy = pending || uploading !== null;

  return (
    <div className="flex flex-col gap-6">
      <div aria-live="polite" className="flex flex-col gap-2">
        {uploading && (
          <Alert tone="info">
            Uploading photo {Math.min(uploading.done + 1, uploading.total)} of {uploading.total}…
            Keep this page open.
          </Alert>
        )}
        {notices.map((notice, index) => (
          <Alert key={index} tone={notice.tone}>
            {notice.text}
          </Alert>
        ))}
      </div>

      {remaining > 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border-strong bg-surface-2/50 p-6 text-center">
          <ImagePlus className="size-8 text-ink-muted" aria-hidden />
          <div>
            <p className="font-semibold">Add photos of your place, products or team</p>
            <p className="mt-1 text-sm text-ink-muted">
              JPEG, PNG or WebP, up to 8 MB each. {remaining} of {LISTING_LIMITS.photos} left.
              Bright, wide shots work best.
            </p>
          </div>
          <input
            ref={fileInput}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy}
            className="peer sr-only"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              if (files.length > 0) startTransition(() => upload(files));
            }}
          />
          <label
            htmlFor={inputId}
            aria-disabled={busy}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary hover:bg-primary-hover aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
          >
            <ImagePlus className="size-4" aria-hidden /> Choose photos
          </label>
        </div>
      ) : (
        <Alert tone="info">
          You&apos;ve reached {LISTING_LIMITS.photos} photos. Remove one to add another.
        </Alert>
      )}

      {photos.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-card"
            >
              <div className="relative aspect-[4/3] bg-surface-2">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                  placeholder={photo.blurDataUrl ? "blur" : "empty"}
                  blurDataURL={photo.blurDataUrl || undefined}
                  className="object-cover"
                />
                {index === 0 && (
                  <Badge tone="primary" className="absolute top-3 left-3">
                    <Star aria-hidden /> Cover photo
                  </Badge>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-3">
                <form
                  onSubmit={(event) => saveAlt(event, photo.id)}
                  className="flex flex-col gap-1.5"
                >
                  <label htmlFor={`alt-${photo.id}`} className="text-sm font-semibold">
                    What does it show?
                  </label>
                  <div className="flex gap-2">
                    <input
                      id={`alt-${photo.id}`}
                      name="altText"
                      defaultValue={photo.alt}
                      maxLength={LISTING_LIMITS.altText}
                      className="h-9 min-w-0 flex-1 rounded-lg border border-border-strong bg-surface px-3 text-sm"
                    />
                    <Button type="submit" variant="secondary" size="sm" disabled={busy}>
                      Save
                    </Button>
                  </div>
                </form>
                <div className="mt-auto flex flex-wrap gap-1">
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => run(movePhotoAction, photoForm(photo.id, { move: "cover" }))}
                    >
                      <Star aria-hidden /> Make cover
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy || index === 0}
                    aria-label={`Move photo ${index + 1} earlier`}
                    onClick={() => run(movePhotoAction, photoForm(photo.id, { move: "up" }))}
                  >
                    <ArrowUp aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy || index === photos.length - 1}
                    aria-label={`Move photo ${index + 1} later`}
                    onClick={() => run(movePhotoAction, photoForm(photo.id, { move: "down" }))}
                  >
                    <ArrowDown aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    className="ml-auto text-danger"
                    onClick={() => {
                      if (window.confirm("Remove this photo? This can't be undone.")) {
                        run(deletePhotoAction, photoForm(photo.id, {}));
                      }
                    }}
                  >
                    <Trash2 aria-hidden /> Remove
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
