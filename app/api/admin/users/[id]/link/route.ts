/**
 * POST /api/admin/users/:id/link — admin creates a set-password link for a
 * user. Returns the link (to copy and send by WhatsApp) and, when email is
 * configured, also emails it.
 */
import { ADMIN_LINK_HOURS, createPasswordToken, findUserById } from "@/lib/auth";
import { fail, json, readJson, requireAdmin } from "@/lib/api";
import { emailEnabled, passwordLink, sendPasswordEmail } from "@/lib/notify";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin(req);
  if (g.error) return g.error;
  const { id } = await params;
  const user = await findUserById(id);
  if (!user) return fail("משתמש לא נמצא", 404);

  const body = await readJson(req);
  const token = await createPasswordToken(user.id, ADMIN_LINK_HOURS);
  const link = passwordLink(token);
  let emailed = false;
  if (body?.sendEmail === true && emailEnabled()) {
    emailed = await sendPasswordEmail(user.email, link);
  }
  return json({ ok: true, link, emailed, hours: ADMIN_LINK_HOURS });
}
