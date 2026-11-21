/**
 * Business photos — for the business owner or the admin.
 *
 * POST   multipart { kind: "cover" | "logo", file }  → upload / replace
 * DELETE ?kind=cover|logo                            → remove
 *
 * The browser already shrinks the image to WebP before sending; the server
 * checks the real file type and size, and never trusts the client.
 */
import { fail, json, requireUser } from "@/lib/api";
import { getBusinessById, mediaUrl } from "@/lib/db";
import {
  IMAGE_KINDS,
  MAX_IMAGE_BYTES,
  removeBusinessImage,
  saveBusinessImage,
  sniffImageType,
  type ImageKind,
} from "@/lib/media";
import { rateLimit } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

async function authorize(req: Request, id: string) {
  const g = await requireUser(req);
  if (g.error) return { error: g.error };
  const business = await getBusinessById(id);
  if (!business) return { error: fail("העסק לא נמצא", 404) };
  if (g.user.role !== "admin" && business.ownerId !== g.user.id) {
    return { error: fail("העסק לא נמצא", 404) };
  }
  return { user: g.user };
}

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const auth = await authorize(req, id);
  if (auth.error) return auth.error;
  if (!(await rateLimit(`upload:${auth.user.id}`, 40, 3600))) {
    return fail("יותר מדי העלאות. נסו שוב בעוד שעה.", 429);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("בקשה לא תקינה");
  }
  const kind = form.get("kind");
  const file = form.get("file");
  if (typeof kind !== "string" || !IMAGE_KINDS.includes(kind as ImageKind)) {
    return fail("סוג תמונה לא תקין");
  }
  if (!(file instanceof File) || file.size === 0) return fail("לא נבחרה תמונה");
  if (file.size > MAX_IMAGE_BYTES) return fail("התמונה גדולה מדי (עד 6MB)");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImageType(bytes);
  if (!type) return fail("אפשר להעלות רק תמונות JPG, PNG או WebP");

  const key = await saveBusinessImage(id, kind as ImageKind, bytes, type);
  return json({ ok: true, url: mediaUrl(key) });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  const auth = await authorize(req, id);
  if (auth.error) return auth.error;
  const kind = new URL(req.url).searchParams.get("kind");
  if (!kind || !IMAGE_KINDS.includes(kind as ImageKind)) return fail("סוג תמונה לא תקין");
  await removeBusinessImage(id, kind as ImageKind);
  return json({ ok: true });
}
