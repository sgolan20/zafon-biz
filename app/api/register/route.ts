/**
 * POST /api/register — public business registration.
 *
 * Logged-in owner  → the new business is attached to their account.
 * Anonymous visitor → must give an account email + password; a new owner
 *                     account is created (an existing email must log in first).
 * The business is saved as 'pending' until the admin approves it.
 */
import { clientIp, ensureOwnerUser, findUserByEmail, getCurrentUser, hashPassword, passwordProblem, rateLimit, createSession } from "@/lib/auth";
import { fail, json, parseBusinessFields, readJson, sameOrigin } from "@/lib/api";
import { insertBusiness } from "@/lib/db";
import { notifyNewSubmission } from "@/lib/notify";
import { slugify } from "@/lib/utils";
import { emailSchema } from "@/lib/validation";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("בקשה לא חוקית", 403);
  if (!(await rateLimit(`register:${clientIp(req)}`, 5, 3600))) {
    return fail("יותר מדי ניסיונות. נסו שוב בעוד שעה.", 429);
  }

  const body = await readJson(req);
  if (!body) return fail("בקשה לא תקינה");
  if (typeof body.website_url_confirm === "string" && body.website_url_confirm) {
    return fail("שגיאה בשליחה. אנא נסו שוב.");
  }

  const parsed = parseBusinessFields(body);
  if (!parsed.fields) return fail(parsed.error);
  const fields = parsed.fields;

  let ownerId: string;
  let newAccount = false;
  const current = await getCurrentUser();
  if (current) {
    ownerId = current.id;
  } else {
    const email = emailSchema.safeParse(body.accountEmail);
    if (!email.success) return fail("יש להזין אימייל תקין לחשבון");
    const pwError = passwordProblem(body.accountPassword);
    if (pwError) return fail(pwError);
    if (await findUserByEmail(email.data)) {
      return fail(
        "כבר קיים חשבון עם האימייל הזה. התחברו (או שחזרו סיסמה) ואז הוסיפו את העסק מהאזור האישי.",
        409,
      );
    }
    ownerId = await ensureOwnerUser(email.data, await hashPassword(body.accountPassword as string));
    newAccount = true;
    // Contact email defaults to the account email.
    if (!fields.email) fields.email = email.data.toLowerCase();
  }

  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 20);
  const slug = `${slugify(fields.name)}-${Date.now().toString(36)}`;
  await insertBusiness({ id, slug, ownerId, fields });

  if (newAccount) await createSession(ownerId);
  await notifyNewSubmission({ name: fields.name, town: fields.town, category: fields.category });

  return json({ ok: true, id });
}
