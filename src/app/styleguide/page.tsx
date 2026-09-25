import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowRight, MessageCircle, SearchX } from "lucide-react";
import { categories } from "@/config/categories";
import { BusinessCard, type BusinessCardData } from "@/components/business/business-card";
import { ImigongoPattern } from "@/components/brand/imigongo-pattern";
import { Logo, LogoMark } from "@/components/brand/logo";
import { CategoryIcon } from "@/components/category-icon";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { Rating } from "@/components/ui/rating";
import { Skeleton } from "@/components/ui/skeleton";
import { listingChecklist, type ListingStatus } from "@/lib/listing-status";
import { DetailsForm } from "@/components/owner/details-form";
import { HoursForm } from "@/components/owner/hours-form";
import { ListingChecklist } from "@/components/owner/listing-checklist";
import { PhotoManager } from "@/components/owner/photo-manager";
import { ShowcaseForm } from "@/components/owner/showcase-form";
import { StatusBadge } from "@/components/owner/status-badge";
import { WizardSteps } from "@/components/owner/wizard-steps";

export const metadata: Metadata = {
  title: "Style guide",
  robots: { index: false, follow: false },
};

const colorTokens = [
  { name: "bg", note: "Page background" },
  { name: "surface", note: "Cards, inputs" },
  { name: "surface-2", note: "Sunken areas, neutral badges" },
  { name: "border", note: "Dividers, card edges" },
  { name: "border-strong", note: "Input edges (3:1)" },
  { name: "ink", note: "Main text" },
  { name: "ink-muted", note: "Secondary text" },
  { name: "ink-subtle", note: "Captions, placeholders" },
  { name: "primary", note: "Main actions, links" },
  { name: "accent", note: "Highlights, stars" },
  { name: "success", note: "Open now, WhatsApp" },
  { name: "danger", note: "Errors, destructive actions" },
];

// Obviously fictional sample data, only ever shown on this page.
const demoBusinesses: BusinessCardData[] = [
  {
    slug: "demo-grill-house",
    name: "Demo Grill House",
    categorySlug: "restaurants",
    tagline: "Sample listing: brochettes, isombe and fresh juice, served until late.",
    location: "Nyamirambo, Kigali",
    rating: { value: 4.7, count: 128 },
    isOpenNow: true,
    whatsappNumber: "+250700000000",
  },
  {
    slug: "demo-lakeside-guesthouse",
    name: "Demo Lakeside Guesthouse",
    categorySlug: "hotels",
    tagline: "Sample listing: eight quiet rooms a short walk from the lake shore.",
    location: "Rubavu, Western Province",
    rating: { value: 4.2, count: 1 },
    isOpenNow: false,
  },
  {
    slug: "demo-tailor-studio",
    name: "Demo Tailor Studio With A Much Longer Name To Test Wrapping",
    categorySlug: "services",
    tagline:
      "Sample listing with a long description to check that the card clamps text to two lines instead of pushing the layout around.",
    location: "Huye, Southern Province",
  },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 border-t border-border py-10">
      <h2 className="text-2xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-bold">Style guide</h1>
      <p className="mt-2 max-w-2xl text-ink-muted">
        Every token and component in one place. Switch your system between light and dark mode to
        check both themes. This page is hidden in production.
      </p>

      <Section title="Brand">
        <div className="flex flex-wrap items-center gap-8">
          <Logo />
          <LogoMark className="size-12" />
          <ImigongoPattern className="h-8 w-48 text-primary" />
          <ImigongoPattern className="h-8 w-48 text-border" />
        </div>
      </Section>

      <Section title="Colours">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {colorTokens.map((token) => (
            <div key={token.name} className="overflow-hidden rounded-xl border border-border">
              <div className="h-16" style={{ background: `var(--${token.name})` }} />
              <div className="bg-surface p-3">
                <p className="font-mono text-sm font-semibold">{token.name}</p>
                <p className="text-xs text-ink-muted">{token.note}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="flex flex-col gap-3">
          <p className="font-display text-5xl font-bold">Display · Playfair Display</p>
          <p className="font-display text-3xl font-bold">Section heading</p>
          <p className="font-display text-xl font-bold">Card heading</p>
          <p className="max-w-prose text-base">
            Body text in DM Sans. Murakaza neza! Built for Kinyarwanda, French and English
            characters: é, è, à, ç, ô.
          </p>
          <p className="text-sm text-ink-muted">Secondary text, 14px.</p>
          <p className="text-xs font-bold tracking-widest text-ink-muted uppercase">
            Eyebrow label
          </p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="success">
            <MessageCircle aria-hidden /> WhatsApp
          </Button>
          <Button variant="danger">Reject</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">
            Large <ArrowRight aria-hidden />
          </Button>
          <Button disabled>Disabled</Button>
          <Button loading>Saving</Button>
          <ButtonLink href="/styleguide" variant="secondary">
            Link styled as a button
          </ButtonLink>
        </div>
      </Section>

      <Section title="Form fields">
        <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
          <TextField label="Business name" name="name" placeholder="e.g. Inzozi Café" required />
          <TextField
            label="WhatsApp number"
            name="whatsapp"
            type="tel"
            hint="Include the country code, e.g. +250 7XX XXX XXX."
            defaultValue="+250"
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            defaultValue="not-an-email"
            error="Enter an email address like name@example.com."
          />
          <TextField label="Disabled field" name="disabled" defaultValue="Can't edit" disabled />
          <SelectField label="Category" name="category" defaultValue="" required>
            <option value="" disabled>
              Choose a category
            </option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </SelectField>
          <TextAreaField
            label="Description"
            name="description"
            hint="What makes your business worth a visit? 2–3 sentences."
          />
        </div>
      </Section>

      <Section title="Badges and ratings">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Neutral</Badge>
          <Badge tone="primary">Featured</Badge>
          <Badge tone="accent">New</Badge>
          <Badge tone="success">Open now</Badge>
          <Badge tone="danger">Rejected</Badge>
          <Rating value={4.7} count={128} />
          <Rating value={5} count={1} />
          <Rating value={3.9} />
        </div>
      </Section>

      <Section title="Category icons">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <li
              key={c.slug}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-primary">
                <CategoryIcon slug={c.slug} className="size-5" />
              </span>
              <span className="text-sm font-semibold">{c.name}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Business cards">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {demoBusinesses.map((b) => (
            <BusinessCard key={b.slug} business={b} />
          ))}
        </div>
      </Section>

      <Section title="Loading and empty states">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
            <Skeleton className="aspect-[4/3] w-full" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <EmptyState
            icon={SearchX}
            title="No businesses match these filters"
            description="Try another category, or clear the filters to see everything nearby."
            action={<Button variant="secondary">Clear filters</Button>}
          />
        </div>
      </Section>
      <Section title="Owner tools">
        <p className="max-w-2xl text-sm text-ink-muted">
          The listing wizard and dashboard pieces, with sample data. Saving does nothing here: these
          forms need a signed-in owner.
        </p>
        <div className="flex flex-wrap gap-2">
          {(["DRAFT", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as ListingStatus[]).map(
            (status) => (
              <StatusBadge key={status} status={status} />
            ),
          )}
        </div>
        <div className="max-w-3xl">
          <WizardSteps current="hours" businessId="00000000-0000-0000-0000-000000000000" />
        </div>
        <div className="max-w-3xl">
          <ListingChecklist
            hrefBase="/styleguide"
            items={listingChecklist({
              whatsapp: "+250700000000",
              phone: null,
              email: null,
              latitude: null,
              hoursCount: 5,
              photoCount: 0,
              showcaseCount: 0,
            })}
          />
        </div>
        <div className="max-w-3xl">
          <DetailsForm
            mode="edit"
            businessId="00000000-0000-0000-0000-000000000000"
            districts={[
              {
                name: "Kigali City",
                districts: [
                  { slug: "gasabo", name: "Gasabo" },
                  { slug: "nyarugenge", name: "Nyarugenge" },
                ],
              },
            ]}
            defaults={{
              name: "Demo Grill House",
              tagline: "Sample listing: brochettes and fresh juice until late.",
              description: "Sample description for the style guide.",
              category: "restaurants",
              extraCategories: ["entertainment"],
              district: "gasabo",
              priceLevel: 2,
            }}
          />
        </div>
        <div className="max-w-3xl">
          <HoursForm
            mode="edit"
            businessId="00000000-0000-0000-0000-000000000000"
            defaults={[
              { dayOfWeek: 1, opensAt: 480, closesAt: 720 },
              { dayOfWeek: 1, opensAt: 840, closesAt: 1080 },
              { dayOfWeek: 5, opensAt: 1080, closesAt: 120 },
              { dayOfWeek: 6, opensAt: 0, closesAt: 1440 },
            ]}
          />
        </div>
        <PhotoManager businessId="00000000-0000-0000-0000-000000000000" photos={[]} />
        <div className="max-w-3xl">
          <ShowcaseForm
            businessId="00000000-0000-0000-0000-000000000000"
            examples="“Food”, “Drinks” or “Breakfast”"
            defaults={[
              {
                title: "Grill",
                items: [
                  { name: "Goat brochette", description: "With fries", priceRwf: 1500 },
                  { name: "Grilled tilapia", description: null, priceRwf: null },
                ],
              },
            ]}
          />
        </div>
      </Section>
    </div>
  );
}
