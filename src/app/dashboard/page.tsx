import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus, Store } from "lucide-react";
import { isCategorySlug } from "@/config/categories";
import { LISTING_STATUS } from "@/lib/listing-status";
import { photoSrc } from "@/lib/media";
import { requireUser } from "@/server/auth/session";
import { getOwnerDashboard } from "@/server/services/listing-service";
import { ImigongoPattern } from "@/components/brand/imigongo-pattern";
import { CategoryIcon } from "@/components/category-icon";
import { StatusBadge } from "@/components/owner/status-badge";
import { WithdrawClaimButton } from "@/components/owner/withdraw-claim-button";
import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: { absolute: "Your dashboard · BizConnect Rwanda" } };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Kigali",
});

const CLAIM_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  PENDING: { label: "Waiting for review", tone: "accent" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Not approved", tone: "danger" },
};

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const user = await requireUser("/dashboard");
  const [{ businesses, claims }, params] = await Promise.all([
    getOwnerDashboard(user.id),
    searchParams,
  ]);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">Dashboard</p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Your businesses</h1>
        </div>
        <ButtonLink href="/list-your-business">
          <Plus aria-hidden /> List a business
        </ButtonLink>
      </header>

      {params.deleted && <Alert tone="success">The listing and its photos were deleted.</Alert>}
      {params.claimed && (
        <Alert tone="success">
          Request sent. An admin will check it and may call you to confirm. We&apos;ll email you
          when it&apos;s decided.
        </Alert>
      )}

      {businesses.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No listings yet"
          description="List your business in about ten minutes, or find it in the directory and ask to manage it."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href="/list-your-business">List your business</ButtonLink>
              <ButtonLink href="/explore" variant="secondary">
                Find an existing listing
              </ButtonLink>
            </div>
          }
        />
      ) : (
        <ul className="grid gap-4">
          {businesses.map((b) => {
            const cover = b.photos[0];
            const category = b.categories[0]?.category.slug ?? "others";
            const continueSetup = b.status === "DRAFT";
            return (
              <li
                key={b.id}
                className="relative flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-card sm:flex-row sm:items-center"
              >
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:w-40">
                  {cover ? (
                    <Image
                      src={photoSrc(cover.storageKey)}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 160px, 90vw"
                      placeholder={cover.blurDataUrl ? "blur" : "empty"}
                      blurDataURL={cover.blurDataUrl || undefined}
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-border">
                      <ImigongoPattern className="absolute inset-0 opacity-50" />
                      <span className="relative flex size-11 items-center justify-center rounded-full bg-surface text-ink-muted">
                        <CategoryIcon
                          slug={isCategorySlug(category) ? category : "others"}
                          className="size-5"
                        />
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={b.status} />
                  </div>
                  <h2 className="font-sans text-lg font-bold">
                    <Link
                      href={
                        continueSetup ? `/list-your-business/${b.id}/details` : `/dashboard/${b.id}`
                      }
                      className="after:absolute after:inset-0"
                    >
                      {b.name}
                    </Link>
                  </h2>
                  <p className="text-sm text-ink-muted">
                    {b.district.name} · Updated {dateFormat.format(b.updatedAt)}
                  </p>
                  <p className="text-sm text-ink-muted">{LISTING_STATUS[b.status].help}</p>
                </div>
                <div className="relative z-10 flex shrink-0 flex-wrap gap-2 sm:flex-col">
                  {continueSetup && (
                    <ButtonLink href={`/list-your-business/${b.id}/details`} size="sm">
                      Continue setup
                    </ButtonLink>
                  )}
                  <ButtonLink
                    href={`/dashboard/${b.id}`}
                    size="sm"
                    variant={continueSetup ? "secondary" : "primary"}
                  >
                    Manage
                  </ButtonLink>
                  {b.status === "APPROVED" && (
                    <ButtonLink href={`/b/${b.slug}`} size="sm" variant="secondary">
                      View live
                    </ButtonLink>
                  )}
                  {b.status === "REJECTED" && (
                    <ButtonLink
                      href={`/list-your-business/${b.id}/review`}
                      size="sm"
                      variant="secondary"
                    >
                      Send again
                    </ButtonLink>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {claims.length > 0 && (
        <section aria-labelledby="claims-heading">
          <h2 id="claims-heading" className="text-2xl font-bold">
            Requests to manage a listing
          </h2>
          <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
            {claims.map((claim) => {
              const status = CLAIM_STATUS[claim.status] ?? CLAIM_STATUS.PENDING!;
              return (
                <li key={claim.id} className="flex flex-wrap items-center gap-3 px-4 py-4">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link
                      href={`/b/${claim.business.slug}`}
                      className="font-semibold hover:text-primary"
                    >
                      {claim.business.name}
                    </Link>
                    <p className="text-sm text-ink-muted">
                      Sent {dateFormat.format(claim.createdAt)}
                      {claim.decisionNote && ` · ${claim.decisionNote}`}
                    </p>
                  </div>
                  <Badge tone={status.tone}>{status.label}</Badge>
                  {claim.status === "PENDING" && (
                    <WithdrawClaimButton claimId={claim.id} name={claim.business.name} />
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
