/** POST /api/account/password — { currentPassword, newPassword } for a logged-in user. */
import { createSession, findUserById, passwordProblem, setPassword, verifyPassword } from "@/lib/auth";
import { fail, json, readJson, requireUser } from "@/lib/api";

export async function POST(req: Request) {
  const g = await requireUser(req);
  if (g.error) return g.error;
  const body = await readJson(req);
  const pwError = passwordProblem(body?.newPassword);
  if (pwError) return fail(pwError);

  const user = await findUserById(g.user.id);
  if (!user) return fail("משתמש לא נמצא", 404);
  if (user.password_hash) {
    const current = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    if (!(await verifyPassword(current, user.password_hash))) {
      return fail("הסיסמה הנוכחית שגויה", 401);
    }
  }
  await setPassword(user.id, body!.newPassword as string);
  await createSession(user.id); // setPassword signed out all sessions
  return json({ ok: true });
}
