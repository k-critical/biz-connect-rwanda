import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { ROLE_LABELS, hasRole, type Role } from "@/lib/roles";
import { requireUser } from "@/server/auth/session";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

const memberSince = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "Africa/Kigali",
});

export default async function AccountPage() {
  const user = await requireUser("/account");
  const role = user.role as Role;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">Your account</p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Muraho, {user.name}</h1>
        </div>
        <SignOutButton />
      </header>

      <dl className="mt-8 grid gap-4 rounded-2xl border border-border bg-surface p-6 shadow-card sm:grid-cols-2">
        <div>
          <dt className="text-sm text-ink-muted">Email</dt>
          <dd className="mt-1 font-semibold break-all">{user.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-muted">Account type</dt>
          <dd className="mt-1">
            <Badge tone={role === "ADMIN" ? "primary" : role === "OWNER" ? "accent" : "neutral"}>
              {ROLE_LABELS[role] ?? role}
            </Badge>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-ink-muted">Member since</dt>
          <dd className="mt-1 font-semibold">{memberSince.format(new Date(user.createdAt))}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-muted">Email confirmed</dt>
          <dd className="mt-1 font-semibold">{user.emailVerified ? "Yes" : "Not yet"}</dd>
        </div>
      </dl>

      <section className="mt-8 rounded-2xl border border-dashed border-border p-6">
        <h2 className="text-xl font-bold">Your businesses</h2>
        <p className="mt-2 text-ink-muted">
          Soon you&apos;ll be able to list your business or claim an existing listing from here.
        </p>
      </section>

      {hasRole(role, "ADMIN") && (
        <div className="mt-8">
          <ButtonLink href="/admin" variant="secondary">
            <ShieldCheck aria-hidden /> Open admin tools
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
