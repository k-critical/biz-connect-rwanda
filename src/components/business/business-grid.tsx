import { BusinessCard, type BusinessCardData } from "./business-card";

export function BusinessGrid({ businesses }: { businesses: BusinessCardData[] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {businesses.map((business) => (
        <li key={business.slug} className="flex">
          <BusinessCard business={business} />
        </li>
      ))}
    </ul>
  );
}
