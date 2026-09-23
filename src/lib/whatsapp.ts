export const DEFAULT_WHATSAPP_GREETING = "Hello! I found you on BizConnect Rwanda.";

export function whatsappLink(phoneNumber: string, message = DEFAULT_WHATSAPP_GREETING): string {
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.length < 9) throw new Error(`Not a usable phone number: "${phoneNumber}"`);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
