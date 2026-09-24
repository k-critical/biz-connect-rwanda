"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { CircleUserRound, Menu, X } from "lucide-react";
import type { NavItem } from "@/config/site";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav({
  items,
  viewer,
}: {
  items: NavItem[];
  viewer: { firstName: string } | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink aria-[current=page]:text-primary"
          >
            {item.label}
          </Link>
        ))}
        {viewer ? (
          <ButtonLink href="/account" variant="ghost" size="sm" className="ml-2">
            <CircleUserRound aria-hidden />
            {viewer.firstName}
            <span className="sr-only">, your account</span>
          </ButtonLink>
        ) : (
          <ButtonLink href="/login" variant="ghost" size="sm" className="ml-2">
            Sign in
          </ButtonLink>
        )}
        <ButtonLink href="/list-your-business" size="sm">
          List your business
        </ButtonLink>
      </nav>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex size-11 items-center justify-center rounded-lg text-ink hover:bg-surface-2 md:hidden"
      >
        {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-border bg-surface shadow-lift md:hidden"
      >
        <nav aria-label="Mobile" className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-3 text-base font-semibold text-ink hover:bg-surface-2",
                "aria-[current=page]:text-primary",
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-4">
            {viewer ? (
              <ButtonLink href="/account" variant="secondary" onClick={close}>
                <CircleUserRound aria-hidden />
                Your account
              </ButtonLink>
            ) : (
              <ButtonLink href="/login" variant="secondary" onClick={close}>
                Sign in
              </ButtonLink>
            )}
            <ButtonLink href="/list-your-business" onClick={close}>
              List your business
            </ButtonLink>
          </div>
        </nav>
      </div>
    </>
  );
}
