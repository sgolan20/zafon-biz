/** Small helpers shared by the Route Handlers under app/api. */
import "server-only";
import { getCurrentUser } from "./auth";
import type { SessionUser } from "./types";
import { businessFieldsSchema, normalizeUrl } from "./validation";
import type { BusinessFields } from "./db";

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function fail(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

/**
 * Blocks cross-site writes. The session cookie is SameSite=Lax already;
 * this also rejects requests whose Origin doesn't match the Host.
 */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin fetch from older browsers / curl
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

type Guard = { user: SessionUser; error?: undefined } | { user?: undefined; error: Response };

export async function requireUser(req: Request): Promise<Guard> {
  if (!sameOrigin(req)) return { error: fail("בקשה לא חוקית", 403) };
  const user = await getCurrentUser();
  if (!user) return { error: fail("צריך להתחבר מחדש", 401) };
  return { user };
}

export async function requireAdmin(req: Request): Promise<Guard> {
  const g = await requireUser(req);
  if (g.error) return g;
  if (g.user.role !== "admin") return { error: fail("אין הרשאה", 403) };
  return g;
}

/** Validates + normalizes the editable business fields from a request body. */
export function parseBusinessFields(
  body: unknown,
): { fields: BusinessFields; error?: undefined } | { fields?: undefined; error: string } {
  const parsed = businessFieldsSchema.safeParse(body);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "פרטים לא תקינים" };
  }
  const d = parsed.data;
  const opt = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined);
  const url = (v: string | undefined) => (v && v.trim() ? normalizeUrl(v) : undefined);
  return {
    fields: {
      name: d.name.trim(),
      description: d.description.trim(),
      category: d.category,
      town: d.town,
      contactName: d.contactName.trim(),
      phone: d.phone.trim(),
      address: opt(d.address),
      whatsapp: opt(d.whatsapp),
      email: opt(d.email)?.toLowerCase(),
      website: url(d.website),
      openingHours: opt(d.openingHours),
      facebook: url(d.facebook),
      instagram: url(d.instagram),
    },
  };
}
