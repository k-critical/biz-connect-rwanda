import {
  BedDouble,
  Briefcase,
  Bus,
  Clapperboard,
  Drama,
  Scissors,
  ShoppingBag,
  Store,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { CategorySlug } from "@/config/categories";

const icons: Record<CategorySlug, LucideIcon> = {
  restaurants: UtensilsCrossed,
  hotels: BedDouble,
  shops: ShoppingBag,
  services: Briefcase,
  beauty: Scissors,
  entertainment: Drama,
  cinema: Clapperboard,
  transport: Bus,
  others: Store,
};

export function CategoryIcon({ slug, className }: { slug: CategorySlug; className?: string }) {
  const Icon = icons[slug];
  return <Icon className={className} aria-hidden />;
}
