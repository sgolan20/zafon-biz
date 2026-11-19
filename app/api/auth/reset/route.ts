/** POST /api/auth/reset — { token, password } → sets the password and logs in. */
import { clientIp, consumePasswordToken, createSession, findUserById, passwordProblem, rateLimit, setPassword } from "@/lib/auth";
import { fail, json, readJson, sameOrigin } from "@/lib/api";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("בקשה לא חוקית", 403);
  if (!(await rateLimit(`reset-ip:${clientIp(req)}`, 20, 3600))) {
    return fail("יותר מדי ניסיונות. נסו שוב מאוחר יותר.", 429);
  }
  const body = await readJson(req);
  const token = typeof body?.token === "string" ? body.token : "";
  const pwError = passwordProblem(body?.password);
  if (pwError) return fail(pwError);

  const userId = token ? await consumePasswordToken(token) : null;
  if (!userId) return fail("הקישור לא תקף או שכבר נוצל. בקשו קישור חדש.", 400);

  await setPassword(userId, body!.password as string);
  await createSession(userId);
  const user = await findUserById(userId);
  return json({ ok: true, role: user?.role ?? "owner" });
}
