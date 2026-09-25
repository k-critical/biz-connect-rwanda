const RWANDA = /^\+250[27]\d{8}$/;
const INTERNATIONAL = /^\+[1-9]\d{7,14}$/;

/**
 * Turns the ways people write Rwandan numbers ("0788 123 456", "788123456", "250788123456",
 * "+250 788-123-456") into one form: "+250788123456". Numbers from other countries must start
 * with "+" or "00". Returns null for anything that isn't a usable phone number.
 */
export function normalizePhone(input: string): string | null {
  const trimmed = input.replace(/[()]/g, "").trim();
  if (!trimmed || /[^\d\s+.-]/.test(trimmed) || trimmed.lastIndexOf("+") > 0) return null;

  const digits = trimmed.replace(/\D/g, "");
  let e164: string;
  if (trimmed.startsWith("+")) e164 = `+${digits}`;
  else if (digits.startsWith("00")) e164 = `+${digits.slice(2)}`;
  else if (digits.startsWith("250") && digits.length === 12) e164 = `+${digits}`;
  else if (digits.startsWith("0") && digits.length === 10) e164 = `+250${digits.slice(1)}`;
  else if (digits.length === 9) e164 = `+250${digits}`;
  else return null;

  if (e164.startsWith("+250")) return RWANDA.test(e164) ? e164 : null;
  return INTERNATIONAL.test(e164) ? e164 : null;
}

/** "+250788123456" → "+250 788 123 456"; other numbers are shown as stored. */
export function formatPhone(e164: string): string {
  return RWANDA.test(e164)
    ? `${e164.slice(0, 4)} ${e164.slice(4, 7)} ${e164.slice(7, 10)} ${e164.slice(10)}`
    : e164;
}
