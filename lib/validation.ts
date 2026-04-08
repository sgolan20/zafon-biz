/**
 * Zod schemas for the public registration form and admin operations.
 *
 * Mirrored (loosely) by the Firestore security rules in firestore.rules.
 * Keep both in sync when you change required fields or constraints.
 */

import { z } from "zod";

// Israeli phone: starts with 0, 9 or 10 digits total, with optional dashes/spaces.
const phoneRegex = /^0\d{1,2}[\-\s]?\d{3}[\-\s]?\d{4}$/;

/**
 * Lenient URL validator: accepts either a full URL ("https://gogo.com")
 * or just a domain ("gogo.com" / "instagram.com/me"). The submit handler
 * later prepends "https://" if missing — see normalizeUrl().
 */
function isUrlOrDomain(v: string): boolean {
  if (!v) return true;
  const candidate = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(candidate);
    // Require at least one dot in the hostname so that random words don't
    // sneak through (e.g. "asdf" → "https://asdf" parses but isn't a host).
    return u.hostname.includes(".") && u.hostname.length >= 4;
  } catch {
    return false;
  }
}

/**
 * Normalize a user-entered URL or domain to a full URL with protocol.
 * Used by the submit handler before writing to Firestore so that all
 * stored links are clickable.
 */
export function normalizeUrl(v: string): string {
  const trimmed = v.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const businessRegistrationSchema = z.object({
  name: z
    .string()
    .min(2, "שם העסק חייב להכיל לפחות 2 תווים")
    .max(80, "שם העסק יכול להכיל עד 80 תווים"),

  description: z
    .string()
    .min(20, "תיאור צריך להיות לפחות 20 תווים")
    .max(800, "תיאור יכול להכיל עד 800 תווים"),

  category: z.string().min(1, "יש לבחור קטגוריה"),

  town: z.string().min(1, "יש לבחור יישוב"),

  contactName: z
    .string()
    .min(2, "יש להזין שם איש קשר")
    .max(60, "שם ארוך מדי"),

  phone: z
    .string()
    .min(9, "מספר טלפון לא תקין")
    .regex(phoneRegex, "מספר טלפון ישראלי לא תקין (לדוגמה: 054-1234567)"),

  // Optional fields
  address: z.string().max(120).optional().or(z.literal("")),
  whatsapp: z
    .string()
    .regex(phoneRegex, "מספר וואטסאפ לא תקין")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("כתובת אימייל לא תקינה")
    .optional()
    .or(z.literal("")),
  website: z
    .string()
    .refine(isUrlOrDomain, "כתובת אתר לא תקינה")
    .optional()
    .or(z.literal("")),
  openingHours: z.string().max(200).optional().or(z.literal("")),
  facebook: z
    .string()
    .refine(isUrlOrDomain, "קישור פייסבוק לא תקין")
    .optional()
    .or(z.literal("")),
  instagram: z
    .string()
    .refine(isUrlOrDomain, "קישור אינסטגרם לא תקין")
    .optional()
    .or(z.literal("")),

  // Honeypot - bots tend to fill all fields. Real users won't see this.
  website_url_confirm: z.string().max(0, "שדה חייב להיות ריק").optional(),
});

export type BusinessRegistrationInput = z.infer<typeof businessRegistrationSchema>;
