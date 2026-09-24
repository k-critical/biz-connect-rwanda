import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { requireRole } from "@/server/auth/session";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const admin = await requireRole("ADMIN", "/admin");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <p className="text-sm text-ink-muted">Signed in as {admin.email}</p>
      <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Admin</h1>
      <div className="mt-8">
        <EmptyState
          icon={ShieldCheck}
          title="Admin tools are on their way"
          description="Reviewing new listings, ownership claims and reports will live here."
        />
      </div>
    </div>
  );
}
