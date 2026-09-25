import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/server/auth/session";
import { getClaimContext } from "@/server/services/claim-service";
import { ReportForm } from "@/components/owner/report-form";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Report a listing", robots: { index: false } };

export default async function ReportPage({ params }: PageProps<"/b/[slug]/report">) {
  const { slug } = await params;
  const session = await getSession();
  const { business } = await getClaimContext(slug, null);
  if (!business) notFound();
  const returnTo = `/b/${business.slug}/report`;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href={`/b/${business.slug}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to {business.name}
      </Link>
      <h1 className="mt-6 text-3xl font-bold sm:text-4xl">Report {business.name}</h1>
      <p className="mt-3 text-ink-muted">
        Help us keep BizConnect Rwanda accurate. An admin reads every report. If this is your
        business,{" "}
        <Link
          href={`/b/${business.slug}/claim`}
          className="font-semibold text-primary hover:underline"
        >
          claim it
        </Link>{" "}
        instead, so you can fix the details yourself.
      </p>

      <div className="mt-8">
        {session ? (
          <ReportForm slug={business.slug} />
        ) : (
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-card">
            <p>Please sign in first, so we can tell real reports from spam.</p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={`/login?next=${encodeURIComponent(returnTo)}`}>Sign in</ButtonLink>
              <ButtonLink href="/register" variant="secondary">
                Create an account
              </ButtonLink>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
