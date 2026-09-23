import Link from "next/link";
import { categories } from "@/config/categories";
import { siteConfig } from "@/config/site";
import { Logo } from "@/components/brand/logo";
import { ImigongoPattern } from "@/components/brand/imigongo-pattern";

const columns = [
  {
    title: "Browse",
    links: categories.map((c) => ({ href: `/c/${c.slug}`, label: c.name })),
  },
  {
    title: "For businesses",
    links: [
      { href: "/list-your-business", label: "List your business" },
      { href: "/login", label: "Sign in" },
    ],
  },
  {
    title: "BizConnect",
    links: [
      { href: "/about", label: "About" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-surface-2">
      <ImigongoPattern className="h-4 text-primary" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_2fr]">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-xs text-sm text-ink-muted">{siteConfig.tagline}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="font-sans text-xs font-bold tracking-widest text-ink-muted uppercase">
                {column.title}
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-ink hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-5 text-sm text-ink-muted sm:px-6">
          © {new Date().getFullYear()} {siteConfig.name}
        </p>
      </div>
    </footer>
  );
}
