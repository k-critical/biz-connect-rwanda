import Image from "next/image";
import Link from "next/link";
import { MapPin, MessageCircle } from "lucide-react";
import { getCategory, type CategorySlug } from "@/config/categories";
import { whatsappLink } from "@/lib/whatsapp";
import { ImigongoPattern } from "@/components/brand/imigongo-pattern";
import { CategoryIcon } from "@/components/category-icon";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";

export type BusinessCardData = {
  slug: string;
  name: string;
  categorySlug: CategorySlug;
  tagline: string;
  location: string;
  photoUrl?: string | null;
  rating?: { value: number; count: number } | null;
  isOpenNow?: boolean | null;
  whatsappNumber?: string | null;
};

export function BusinessCard({ business }: { business: BusinessCardData }) {
  const category = getCategory(business.categorySlug);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-shadow hover:shadow-lift">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        {business.photoUrl ? (
          <Image
            src={business.photoUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-border">
            <ImigongoPattern className="absolute inset-0 opacity-50" />
            <span className="relative flex size-14 items-center justify-center rounded-full bg-surface text-ink-muted shadow-card">
              <CategoryIcon slug={business.categorySlug} className="size-6" />
            </span>
            <span className="sr-only">No photo yet</span>
          </div>
        )}
        {business.isOpenNow != null && (
          <Badge
            tone={business.isOpenNow ? "success" : "neutral"}
            className="absolute top-3 left-3"
          >
            {business.isOpenNow ? "Open now" : "Closed"}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 text-ink-muted">
            <CategoryIcon slug={business.categorySlug} className="size-4" />
            {category.name}
          </span>
          {business.rating && (
            <Rating value={business.rating.value} count={business.rating.count} />
          )}
        </div>
        <h3 className="text-lg leading-snug font-bold">
          <Link href={`/b/${business.slug}`} className="after:absolute after:inset-0">
            {business.name}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-ink-muted">{business.tagline}</p>
        <p className="mt-auto inline-flex items-center gap-1.5 pt-1 text-sm text-ink-subtle">
          <MapPin className="size-4 shrink-0" aria-hidden />
          {business.location}
        </p>
      </div>

      {business.whatsappNumber && (
        <div className="relative z-10 border-t border-border p-4 pt-3">
          <ButtonLink
            href={whatsappLink(business.whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
            variant="success"
            size="sm"
            className="w-full"
          >
            <MessageCircle aria-hidden />
            Chat on WhatsApp
            <span className="sr-only"> with {business.name} (opens WhatsApp)</span>
          </ButtonLink>
        </div>
      )}
    </article>
  );
}
