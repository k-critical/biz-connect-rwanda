import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Flag, KeyRound, ListChecks, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { auditActionLabel } from "@/lib/audit";
import { requireRole } from "@/server/auth/session";
import { getAdminOverview } from "@/server/services/admin-service";
import { adminDate } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: { absolute: "Admin · BizConnect Rwanda" } };

function Tile({
  icon: Icon,
  label,
  value,
  href,
  urgent,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  href: string;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-card hover:shadow-lift"
    >
      <span className="flex items-center justify-between text-sm font-semibold text-ink-muted">
        <span className="inline-flex items-center gap-2">
          <Icon className="size-4" aria-hidden /> {label}
        </span>
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
      <span
        className={
          urgent && value > 0
            ? "font-display text-4xl font-bold text-primary"
            : "font-display text-4xl font-bold"
        }
      >
        {value}
      </span>
    </Link>
  );
}

export default async function AdminOverviewPage() {
  await requireRole("ADMIN", "/admin");
  const { counts, recent } = await getAdminOverview();

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-3xl font-bold sm:text-4xl">What needs you today</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          icon={ListChecks}
          label="Listings to review"
          value={counts.pendingListings}
          href="/admin/listings?status=PENDING"
          urgent
        />
        <Tile
          icon={KeyRound}
          label="Claims to check"
          value={counts.pendingClaims}
          href="/admin/claims?status=PENDING"
          urgent
        />
        <Tile
          icon={Flag}
          label="Open reports"
          value={counts.openReports}
          href="/admin/reports?status=OPEN"
          urgent
        />
        <Tile
          icon={Store}
          label="Live listings"
          value={counts.liveListings}
          href="/admin/listings?status=APPROVED"
        />
      </div>

      <section aria-labelledby="recent-heading">
        <div className="flex items-end justify-between gap-4">
          <h2 id="recent-heading" className="text-2xl font-bold">
            Recent admin activity
          </h2>
          <Link href="/admin/audit" className="text-sm font-semibold text-primary hover:underline">
            Full audit log
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-4 text-ink-muted">Nothing yet. Decisions you make will show here.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
            {recent.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3"
              >
                <span className="font-semibold">{entry.summary}</span>
                <span className="text-sm text-ink-muted">
                  {auditActionLabel(entry.action)} · {entry.actor?.name ?? "Former admin"} ·{" "}
                  {adminDate.format(entry.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
