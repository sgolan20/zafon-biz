/**
 * GET /media/<key> — serves a business photo from R2.
 *
 * Keys contain a random suffix and change on every upload, so responses can
 * be cached forever.
 */
import { getEnv } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await params;
  const key = parts.map(decodeURIComponent).join("/");
  if (!key.startsWith("businesses/") || key.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  const object = await getEnv().MEDIA.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("X-Content-Type-Options", "nosniff");
  if (req.headers.get("if-none-match") === object.httpEtag) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(object.body, { headers });
}
