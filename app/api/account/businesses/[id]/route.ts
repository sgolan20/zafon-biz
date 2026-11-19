/** PUT /api/account/businesses/:id — an owner edits their own business. */
import { fail, json, parseBusinessFields, readJson, requireUser } from "@/lib/api";
import { getBusinessById, updateBusinessFields } from "@/lib/db";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireUser(req);
  if (g.error) return g.error;
  const { id } = await params;

  const business = await getBusinessById(id);
  if (!business || business.ownerId !== g.user.id) return fail("העסק לא נמצא", 404);

  const parsed = parseBusinessFields(await readJson(req));
  if (!parsed.fields) return fail(parsed.error);
  await updateBusinessFields(id, parsed.fields);
  return json({ ok: true });
}
