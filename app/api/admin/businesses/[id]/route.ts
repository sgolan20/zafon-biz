/**
 * Admin actions on one business.
 *
 * PATCH { status: 'approved' | 'rejected' | 'pending' }  → change status
 * PATCH { fields: {...} }                                → edit details; the
 *        business email also decides the owner account (created if needed)
 * DELETE                                                 → delete for good
 */
import { ensureOwnerUser } from "@/lib/auth";
import { fail, json, parseBusinessFields, readJson, requireAdmin } from "@/lib/api";
import { getBusinessById, getDb, updateBusinessFields } from "@/lib/db";
import { removeAllBusinessImages } from "@/lib/media";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const g = await requireAdmin(req);
  if (g.error) return g.error;
  const { id } = await params;
  const business = await getBusinessById(id);
  if (!business) return fail("העסק לא נמצא", 404);
  const body = await readJson(req);
  const db = getDb();

  if (body?.status !== undefined) {
    const status = body.status;
    if (status !== "approved" && status !== "rejected" && status !== "pending") {
      return fail("סטטוס לא חוקי");
    }
    if (status === "approved") {
      await db
        .prepare(
          "UPDATE businesses SET status = 'approved', approved_at = ?, approved_by = ? WHERE id = ?",
        )
        .bind(new Date().toISOString(), g.user.email, id)
        .run();
    } else {
      await db.prepare("UPDATE businesses SET status = ? WHERE id = ?").bind(status, id).run();
    }
    return json({ ok: true });
  }

  if (body?.fields !== undefined) {
    const parsed = parseBusinessFields(body.fields);
    if (!parsed.fields) return fail(parsed.error);
    await updateBusinessFields(id, parsed.fields);
    const ownerId = parsed.fields.email ? await ensureOwnerUser(parsed.fields.email) : null;
    await db.prepare("UPDATE businesses SET owner_id = ? WHERE id = ?").bind(ownerId, id).run();
    return json({ ok: true });
  }

  return fail("בקשה לא תקינה");
}

export async function DELETE(req: Request, { params }: Ctx) {
  const g = await requireAdmin(req);
  if (g.error) return g.error;
  const { id } = await params;
  await getDb().prepare("DELETE FROM businesses WHERE id = ?").bind(id).run();
  await removeAllBusinessImages(id);
  return json({ ok: true });
}
