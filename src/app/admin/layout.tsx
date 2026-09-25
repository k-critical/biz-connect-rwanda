import type { Metadata } from "next";
import { requireRole } from "@/server/auth/session";
import { getAdminCounters } from "@/server/services/admin-service";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · BizConnect Rwanda" },
  robots: { index: false, follow: false },
};

// Every admin page checks the role again too; this layout only frames them.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireRole("ADMIN", "/admin");
  const counts = await getAdminCounters();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header>
        <p className="text-sm text-ink-muted">Admin · signed in as {admin.email}</p>
      </header>
      <AdminNav
        counts={{
          "/admin/listings": counts.pendingListings,
          "/admin/claims": counts.pendingClaims,
          "/admin/reports": counts.openReports,
        }}
      />
      <div>{children}</div>
    </div>
  );
}
