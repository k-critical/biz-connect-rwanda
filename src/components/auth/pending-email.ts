// Remembers the address someone just registered with, so "resend the link" can prefill it
// without putting the email in the URL. Private browsing may block storage; that's fine.
const KEY = "bizconnect:pending-email";

export function rememberPendingEmail(email: string) {
  try {
    sessionStorage.setItem(KEY, email);
  } catch {}
}

export function readPendingEmail(): string {
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}
