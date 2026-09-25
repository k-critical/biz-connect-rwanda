import { hasRole } from "@/lib/roles";
import { getSession } from "@/server/auth/session";
import { getClaimEvidenceFile } from "@/server/services/admin-service";

/**
 * A claim's private proof, for admins only. Anyone else gets "not found". The file is never
 * cached by browsers or proxies, and is sandboxed so a crafted PDF can't run scripts here.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/admin/claims/[id]/evidence">,
) {
  const session = await getSession({ fresh: true });
  if (!session || !hasRole(session.user.role, "ADMIN")) {
    return new Response("Not found", { status: 404 });
  }
  const file = await getClaimEvidenceFile((await params).id);
  if (!file) return new Response("Not found", { status: 404 });

  const pdf = file.type === "application/pdf";
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.type,
      "Content-Length": String(file.data.byteLength),
      "Content-Disposition": pdf ? 'attachment; filename="claim-proof.pdf"' : "inline",
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
