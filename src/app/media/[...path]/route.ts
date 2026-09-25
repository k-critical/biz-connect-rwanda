import { isPublicMediaPath } from "@/lib/media";
import { storage } from "@/server/storage";

/** Serves uploaded business photos. Each file name is unique, so browsers may cache forever. */
export async function GET(_request: Request, { params }: RouteContext<"/media/[...path]">) {
  const path = (await params).path.join("/");
  if (!isPublicMediaPath(path)) return new Response("Not found", { status: 404 });

  const file = await storage.get(`public/${path}`);
  if (!file) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(file.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
