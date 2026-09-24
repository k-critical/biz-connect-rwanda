"use client";

import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

const PARAM_ORDER = ["q", "category", "district", "price", "open", "sort"];

/**
 * A GET form that navigates to a clean URL: empty fields and the default sort are left out.
 * Changing a dropdown or checkbox applies it straight away; the search box waits for Enter.
 * Without JavaScript it still works as an ordinary form.
 */
export function FilterForm({
  action,
  ...props
}: Omit<ComponentProps<"form">, "action" | "method" | "onSubmit" | "onChange"> & {
  action: string;
}) {
  const router = useRouter();

  return (
    <form
      {...props}
      action={action}
      method="get"
      // Stops the browser refilling old values when someone navigates back to the page.
      autoComplete="off"
      onChange={(event) => {
        const target = event.target;
        if (
          target instanceof HTMLSelectElement ||
          (target instanceof HTMLInputElement && target.type === "checkbox")
        ) {
          event.currentTarget.requestSubmit();
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const params = new URLSearchParams();
        for (const key of PARAM_ORDER) {
          const value = data.get(key);
          if (typeof value === "string" && value.trim() !== "") params.set(key, value.trim());
        }
        // A newly typed search should sort by best match, even if the dropdown (which only
        // offers "Best match" once there is a search) still shows the old choice.
        const sortSelect = event.currentTarget.elements.namedItem("sort");
        const offeredBestMatch =
          sortSelect instanceof HTMLSelectElement &&
          [...sortSelect.options].some((option) => option.value === "relevance");
        if (params.has("q") && !offeredBestMatch) params.delete("sort");
        if (params.get("sort") === (params.has("q") ? "relevance" : "recommended")) {
          params.delete("sort");
        }
        router.push(params.size > 0 ? `${action}?${params}` : action);
      }}
    />
  );
}
