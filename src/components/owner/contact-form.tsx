"use client";

import dynamic from "next/dynamic";
import { LISTING_LIMITS } from "@/lib/listing-rules";
import { saveContactAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { FormMessage } from "./form-message";
import { useFormAction } from "./use-form-action";

const LocationPicker = dynamic(
  () => import("@/components/map/location-picker").then((m) => m.LocationPicker),
  { ssr: false, loading: () => <Skeleton className="h-80 w-full rounded-xl" /> },
);

export type ContactDefaults = {
  sector: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-5">
      <legend className="mb-1 font-display text-xl font-bold">{title}</legend>
      <p className="-mt-3 text-sm text-ink-muted">{description}</p>
      {children}
    </fieldset>
  );
}

export function ContactForm({
  mode,
  businessId,
  districtName,
  defaults,
}: {
  mode: "wizard" | "edit";
  businessId: string;
  districtName: string;
  defaults: ContactDefaults;
}) {
  const { state, pending, onSubmit, formRef, errorFor } = useFormAction(saveContactAction);
  const pin =
    defaults.latitude !== null && defaults.longitude !== null
      ? { lat: defaults.latitude, lng: defaults.longitude }
      : null;

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-10">
      <FormMessage state={state} />
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="mode" value={mode} />

      <Section
        title="How customers reach you"
        description="Add at least one. WhatsApp is how most customers get in touch."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="WhatsApp number"
            name="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0788 123 456"
            defaultValue={defaults.whatsapp ?? ""}
            error={errorFor("whatsapp")}
          />
          <TextField
            label="Phone number for calls"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="0788 123 456"
            hint="Leave empty if it's the same as WhatsApp and you prefer messages."
            defaultValue={defaults.phone ?? ""}
            error={errorFor("phone")}
          />
        </div>
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="hello@yourbusiness.rw"
          defaultValue={defaults.email ?? ""}
          error={errorFor("email")}
        />
      </Section>

      <Section
        title="Where to find you"
        description={`In ${districtName} district. You can change the district under “The basics”.`}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Sector"
            name="sector"
            maxLength={LISTING_LIMITS.sector}
            placeholder="e.g. Kimironko"
            defaultValue={defaults.sector ?? ""}
            error={errorFor("sector")}
          />
          <TextField
            label="Street or directions"
            name="address"
            maxLength={LISTING_LIMITS.address}
            placeholder="e.g. KG 11 Ave, opposite the bus park"
            defaultValue={defaults.address ?? ""}
            error={errorFor("address")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-ink">Pin on the map (recommended)</span>
          <LocationPicker defaultValue={pin} error={errorFor("latitude")} />
        </div>
      </Section>

      <Section title="Online (optional)" description="Only add pages you keep up to date.">
        <TextField
          label="Website"
          name="website"
          inputMode="url"
          placeholder="yourbusiness.rw"
          defaultValue={defaults.website ?? ""}
          error={errorFor("website")}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Facebook page"
            name="facebookUrl"
            inputMode="url"
            placeholder="facebook.com/yourbusiness"
            defaultValue={defaults.facebookUrl ?? ""}
            error={errorFor("facebookUrl")}
          />
          <TextField
            label="Instagram"
            name="instagramUrl"
            placeholder="@yourbusiness"
            defaultValue={defaults.instagramUrl ?? ""}
            error={errorFor("instagramUrl")}
          />
        </div>
      </Section>

      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <Button type="submit" size="lg" loading={pending}>
          {mode === "edit" ? "Save changes" : "Save and continue"}
        </Button>
      </div>
    </form>
  );
}
