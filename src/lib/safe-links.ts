/** Only http(s) links are ever rendered, so an owner can't slip in a `javascript:` URL. */
export function safeExternalUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function displayHost(url: string): string {
  return new URL(url).host.replace(/^www\./, "");
}
