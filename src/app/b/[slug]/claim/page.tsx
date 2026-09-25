import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/server/auth/session";
import { getClaimContext } from "@/server/services/claim-service";
import { ClaimForm } from "@/components/owner/claim-form";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Claim a listing", robots: { index: false } };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  timeZone: "Africa/Kigali",
});

export default async function ClaimPage({ params }: PageProps<"/b/[slug]/claim">) {
  const { slug } = await params;
  const session = await getSession();
  const { business, state } = await getClaimContext(slug, session?.user.id ?? null);
  if (!business) notFound();

  const returnTo = `/b/${business.slug}/claim`;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href={`/b/${business.slug}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to {business.name}
      </Link>

      <h1 className="mt-6 text-3xl font-bold sm:text-4xl">Is {business.name} your business?</h1>
      <p className="mt-3 text-ink-muted">
        Ask to manage this listing in {business.district}. Once an admin confirms it&apos;s yours,
        you can update the hours, photos, menu and contact details yourself.
      </p>

      <div className="mt-8">
        {!session ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-card">
            <p>First, sign in or create a free account. It takes a minute.</p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={`/login?next=${encodeURIComponent(returnTo)}`}>Sign in</ButtonLink>
              <ButtonLink href="/register" variant="secondary">
                Create an account
              </ButtonLink>
            </div>
            <p className="text-sm text-ink-muted">
              After confirming your email, come back to this page to send your request.
            </p>
          </div>
        ) : state.kind === "owned-by-you" ? (
          <Alert tone="success">
            You already manage this listing.{" "}
            <Link href="/dashboard" className="font-semibold underline">
              Open your dashboard
            </Link>
          </Alert>
        ) : state.kind === "already-managed" ? (
          <Alert tone="info">
            Someone already manages this listing. If you think that&apos;s a mistake, contact the
            BizConnect team.
          </Alert>
        ) : state.kind === "pending" ? (
          <Alert tone="info">
            You asked to manage this listing on {dateFormat.format(state.since)}. An admin will
            check it and email you. You can follow it on your{" "}
            <Link href="/dashboard" className="font-semibold underline">
              dashboard
            </Link>
            .
          </Alert>
        ) : (
          <ClaimForm slug={business.slug} businessName={business.name} />
        )}
      </div>
    </div>
  );
}
