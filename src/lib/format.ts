const rwf = new Intl.NumberFormat("en-RW", {
  style: "currency",
  currency: "RWF",
  currencyDisplay: "code",
  maximumFractionDigits: 0,
});

export function formatRwf(amount: number): string {
  return rwf.format(amount);
}

export const PRICE_LEVELS = [
  { value: 1, label: "Budget" },
  { value: 2, label: "Mid-range" },
  { value: 3, label: "Upscale" },
] as const;

export function priceLevelLabel(level: number | null | undefined): string | null {
  return PRICE_LEVELS.find((p) => p.value === level)?.label ?? null;
}
