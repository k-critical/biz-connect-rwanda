import { MessageCircle, Phone } from "lucide-react";
import type { BusinessProfile } from "@/server/services/directory-service";
import { telHref } from "@/lib/safe-links";
import { whatsappLink } from "@/lib/whatsapp";
import { ButtonLink } from "@/components/ui/button";

export function MobileContactBar({ contact }: { contact: BusinessProfile["business"]["contact"] }) {
  if (!contact.whatsapp && !contact.phone) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-border bg-surface px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lift md:hidden">
      {contact.whatsapp && (
        <ButtonLink
          href={whatsappLink(contact.whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          variant="success"
          className="flex-1"
        >
          <MessageCircle aria-hidden /> WhatsApp
        </ButtonLink>
      )}
      {contact.phone && (
        <ButtonLink href={telHref(contact.phone)} variant="secondary" className="flex-1">
          <Phone aria-hidden /> Call
        </ButtonLink>
      )}
    </div>
  );
}
