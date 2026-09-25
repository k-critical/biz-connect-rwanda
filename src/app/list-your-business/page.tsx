import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Camera, Clock, MessageCircle, ShieldCheck } from "lucide-react";
import { getSession } from "@/server/auth/session";
import { getDistrictOptions } from "@/server/services/directory-service";
import { getOwnerDashboard } from "@/server/services/listing-service";
import { ImigongoPattern } from "@/components/brand/imigongo-pattern";
import { DetailsForm } from "@/components/owner/details-form";
import { StatusBadge } from "@/components/owner/status-badge";
import { WizardSteps } from "@/components/owner/wizard-steps";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "List your business",
  description:
    "Add your business to BizConnect Rwanda for free: your hours, photos, menu or products, and a WhatsApp button customers can tap.",
  alternates: { canonical: "/list-your-business" },
};

const BENEFITS = [
  {
    icon: MessageCircle,
    title: "Customers message you directly",
    text: "A WhatsApp and call button on your listing. No middleman, no commission.",
  },
  {
    icon: Camera,
    title: "Show what you offer",
    text: "Photos, your menu or products with prices, and a pin on the map.",
  },
  {
    icon: Clock,
    title: "Always up to date",
    text: "Change your hours or prices from your phone whenever you need to.",
  },
  {
    icon: ShieldCheck,
    title: "Checked by a person",
    text: "Every listing is reviewed before it goes live, so visitors can trust what they see.",
  },
];

export default async function ListYourBusinessPage() {
  const session = await getSession();

  if (!session) {
    return (
      <div>
        <section className="relative overflow-hidden border-b border-border bg-surface-2">
          <ImigongoPattern className="absolute -top-10 -right-24 h-72 w-96 text-border opacity-70" />
          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              Free to list
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-bold sm:text-5xl">
              Put your business where customers are looking
            </h1>
            <p className="mt-4 max-w-xl text-lg text-ink-muted">
              It takes about ten minutes. Create an account, add your details and a few photos, and
              we&apos;ll check the listing before it goes live.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/register" size="lg">
                Create a free account <ArrowRight aria-hidden />
              </ButtonLink>
              <ButtonLink
                href={`/login?next=${encodeURIComponent("/list-your-business")}`}
                size="lg"
                variant="secondary"
              >
                I already have an account
              </ButtonLink>
            </div>
          </div>
        </section>

        <section aria-labelledby="why-heading" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 id="why-heading" className="text-2xl font-bold sm:text-3xl">
            What you get
          </h2>
          <ul className="mt-8 grid gap-8 sm:grid-cols-2">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-sans text-lg font-bold">{title}</h3>
                  <p className="mt-1 text-ink-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-sm text-ink-muted">
            Already listed by someone else? Open your business&apos;s page and choose{" "}
            <span className="font-semibold text-ink">“Is this your business?”</span> to ask to
            manage it.{" "}
            <Link href="/explore" className="font-semibold text-primary hover:underline">
              Find it in the directory
            </Link>
            .
          </p>
        </section>
      </div>
    );
  }

  const [districts, { businesses }] = await Promise.all([
    getDistrictOptions(),
    getOwnerDashboard(session.user.id),
  ]);
  const drafts = businesses.filter((b) => b.status === "DRAFT" || b.status === "REJECTED");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <WizardSteps current="details" />

      <header className="mt-10">
        <h1 className="text-3xl font-bold sm:text-4xl">List your business</h1>
        <p className="mt-2 text-ink-muted">
          Start with the basics. Your draft is saved after each step, and nobody sees it until an
          admin approves it.
        </p>
      </header>

      {drafts.length > 0 && (
        <section
          aria-labelledby="drafts-heading"
          className="mt-8 rounded-2xl border border-border bg-surface-2 p-5"
        >
          <h2 id="drafts-heading" className="font-sans text-base font-bold">
            Continue where you left off
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {drafts.map((draft) => (
              <li key={draft.id}>
                <Link
                  href={`/list-your-business/${draft.id}/details`}
                  className="flex items-center justify-between gap-3 rounded-lg bg-surface px-4 py-3 font-semibold hover:shadow-card"
                >
                  <span className="truncate">{draft.name}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={draft.status} />
                    <ArrowRight className="size-4 text-ink-muted" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-muted">Or start a new listing below.</p>
        </section>
      )}

      <div className="mt-10">
        <DetailsForm mode="create" districts={districts} />
      </div>
    </div>
  );
}
