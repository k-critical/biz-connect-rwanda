import { Globe, Mail, MessageCircle, Phone } from "lucide-react";
import type { BusinessProfile } from "@/server/services/directory-service";
import { displayHost, safeExternalUrl, telHref } from "@/lib/safe-links";
import { whatsappLink } from "@/lib/whatsapp";
import { ButtonLink } from "@/components/ui/button";

type Contact = BusinessProfile["business"]["contact"];

export function ContactCard({ name, contact }: { name: string; contact: Contact }) {
  const links = [
    { label: "Website", url: safeExternalUrl(contact.website) },
    { label: "Instagram", url: safeExternalUrl(contact.instagramUrl) },
    { label: "Facebook", url: safeExternalUrl(contact.facebookUrl) },
  ].filter((link): link is { label: string; url: string } => link.url !== null);
  const hasDirectContact = Boolean(contact.whatsapp || contact.phone || contact.email);

  return (
    <section
      aria-labelledby="contact-heading"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card"
    >
      <h2 id="contact-heading" className="text-xl font-bold">
        Contact {name}
      </h2>

      {hasDirectContact || links.length > 0 ? (
        <>
          <div className="flex flex-col gap-2">
            {contact.whatsapp && (
              <ButtonLink
                href={whatsappLink(contact.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                variant="success"
                className="w-full"
              >
                <MessageCircle aria-hidden /> Chat on WhatsApp
              </ButtonLink>
            )}
            {contact.phone && (
              <ButtonLink href={telHref(contact.phone)} variant="secondary" className="w-full">
                <Phone aria-hidden /> Call {contact.phone}
              </ButtonLink>
            )}
            {contact.email && (
              <ButtonLink href={`mailto:${contact.email}`} variant="secondary" className="w-full">
                <Mail aria-hidden /> Send an email
              </ButtonLink>
            )}
          </div>
          {links.length > 0 && (
            <ul className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
              {links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    <Globe className="size-4" aria-hidden />
                    {link.label}
                    <span className="font-normal text-ink-muted">{displayHost(link.url)}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm text-ink-muted">Tell them you found them on BizConnect Rwanda.</p>
        </>
      ) : (
        <p className="text-sm text-ink-muted">
          This business hasn&apos;t added contact details yet.
        </p>
      )}
    </section>
  );
}
