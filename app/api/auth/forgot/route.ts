/**
 * POST /api/auth/forgot — { email } → emails a single-use set-password link.
 *
 * Always answers the same way, so it can't be used to discover which
 * emails have accounts.
 */
import { clientIp, createPasswordToken, findUserByEmail, normalizeEmail, rateLimit, RESET_TOKEN_HOURS } from "@/lib/auth";
import { fail, json, readJson, sameOrigin } from "@/lib/api";
import { passwordLink, sendPasswordEmail } from "@/lib/notify";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("בקשה לא חוקית", 403);
  const body = await readJson(req);
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  if (!email) return fail("יש להזין אימייל");

  const okIp = await rateLimit(`forgot-ip:${clientIp(req)}`, 10, 3600);
  const okEmail = await rateLimit(`forgot-email:${email}`, 3, 3600);
  if (!okIp || !okEmail) return fail("יותר מדי בקשות. נסו שוב בעוד שעה.", 429);

  const user = await findUserByEmail(email);
  if (user) {
    const token = await createPasswordToken(user.id, RESET_TOKEN_HOURS);
    await sendPasswordEmail(user.email, passwordLink(token));
  }
  return json({ ok: true });
}
