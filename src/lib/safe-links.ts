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

/**
 * A `?next=` return path that stays on this site. Anything that could send someone to
 * another site after signing in (e.g. `//evil.example`) falls back to the default.
 */
export function safeNextPath(value: string | null | undefined, fallback = "/account"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  try {
    const url = new URL(value, "http://internal.invalid");
    if (url.origin !== "http://internal.invalid") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function displayHost(url: string): string {
  return new URL(url).host.replace(/^www\./, "");
}
