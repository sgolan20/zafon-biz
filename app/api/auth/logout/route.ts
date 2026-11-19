/** POST /api/auth/logout */
import { destroySession } from "@/lib/auth";
import { fail, json, sameOrigin } from "@/lib/api";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("בקשה לא חוקית", 403);
  await destroySession();
  return json({ ok: true });
}
