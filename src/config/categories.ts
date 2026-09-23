export const categories = [
  { slug: "restaurants", name: "Restaurants & Cafés" },
  { slug: "hotels", name: "Hotels & Motels" },
  { slug: "shops", name: "Shops" },
  { slug: "services", name: "Services" },
  { slug: "beauty", name: "Beauty & Salons" },
  { slug: "entertainment", name: "Entertainment" },
  { slug: "cinema", name: "Cinema" },
  { slug: "transport", name: "Transport" },
  { slug: "others", name: "Other" },
] as const;

export type Category = (typeof categories)[number];
export type CategorySlug = Category["slug"];

export function getCategory(slug: CategorySlug): Category {
  const category = categories.find((c) => c.slug === slug);
  if (!category) throw new Error(`Unknown category: ${slug}`);
  return category;
}
