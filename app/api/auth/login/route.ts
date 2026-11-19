/** POST /api/auth/login — { email, password } → session cookie. */
import { clientIp, createSession, findUserByEmail, normalizeEmail, rateLimit, verifyPassword } from "@/lib/auth";
import { fail, json, readJson, sameOrigin } from "@/lib/api";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("בקשה לא חוקית", 403);
  const body = await readJson(req);
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) return fail("יש להזין אימייל וסיסמה");

  const okIp = await rateLimit(`login-ip:${clientIp(req)}`, 30, 900);
  const okEmail = await rateLimit(`login-email:${email}`, 10, 900);
  if (!okIp || !okEmail) return fail("יותר מדי ניסיונות. נסו שוב בעוד רבע שעה.", 429);

  const user = await findUserByEmail(email);
  if (user && !user.password_hash) {
    return fail(
      "לחשבון הזה עדיין אין סיסמה. לחצו על \"שכחתי סיסמה\" כדי לקבל קישור לקביעת סיסמה.",
      401,
    );
  }
  if (!user || !user.password_hash || !(await verifyPassword(password, user.password_hash))) {
    return fail("אימייל או סיסמה שגויים", 401);
  }

  await createSession(user.id);
  return json({ ok: true, role: user.role });
}
