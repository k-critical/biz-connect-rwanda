import Link from "next/link";
import { mainNav } from "@/config/site";
import { getSession } from "@/server/auth/session";
import { Logo } from "@/components/brand/logo";
import { SiteNav } from "./site-nav";

export async function SiteHeader() {
  const session = await getSession();
  const viewer = session ? { firstName: session.user.name.split(" ")[0] } : null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="rounded-lg" aria-label="BizConnect Rwanda, home">
          <Logo />
        </Link>
        <SiteNav items={mainNav} viewer={viewer} />
      </div>
    </header>
  );
}
