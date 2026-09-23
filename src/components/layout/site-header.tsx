import Link from "next/link";
import { mainNav } from "@/config/site";
import { Logo } from "@/components/brand/logo";
import { SiteNav } from "./site-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="rounded-lg" aria-label="BizConnect Rwanda, home">
          <Logo />
        </Link>
        <SiteNav items={mainNav} />
      </div>
    </header>
  );
}
