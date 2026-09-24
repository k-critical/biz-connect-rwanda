import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { hasRole, type Role } from "@/lib/roles";
import { auth } from "./auth";

export async function getSession(options: { fresh?: boolean } = {}) {
  return auth.api.getSession({
    headers: await headers(),
    query: options.fresh ? { disableCookieCache: true } : undefined,
  });
}

/** The signed-in user, or a redirect to the sign-in page that returns here afterwards. */
export async function requireUser(returnTo: string) {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return session.user;
}

/**
 * Like requireUser, but also checks the role, reading it fresh from the database so a
 * revoked role takes effect immediately. Pages a user isn't allowed to see answer 404,
 * so they don't reveal that they exist.
 */
export async function requireRole(role: Role, returnTo: string) {
  const session = await getSession({ fresh: true });
  if (!session) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  if (!hasRole(session.user.role, role)) notFound();
  return session.user;
}
