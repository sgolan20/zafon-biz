import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Hebrew → Latin transliteration table.
 *
 * Used to generate URL-safe slugs from Hebrew business names. Firebase
 * Hosting doesn't reliably serve files with Unicode names (it can't match
 * percent-encoded URLs to NFC-encoded filenames), so we keep the URLs
 * Latin-only. The Hebrew name is still shown to users in the page content -
 * only the URL slug is transliterated.
 */
const HEBREW_TO_LATIN: Record<string, string> = {
  "א": "a", "ב": "b", "ג": "g", "ד": "d", "ה": "h",
  "ו": "v", "ז": "z", "ח": "ch", "ט": "t", "י": "y",
  "כ": "k", "ך": "k", "ל": "l", "מ": "m", "ם": "m",
  "נ": "n", "ן": "n", "ס": "s", "ע": "a", "פ": "p",
  "ף": "f", "צ": "tz", "ץ": "tz", "ק": "k", "ר": "r",
  "ש": "sh", "ת": "t",
};

function transliterateHebrew(input: string): string {
  let result = "";
  for (const char of input) {
    result += HEBREW_TO_LATIN[char] ?? char;
  }
  return result;
}

/**
 * Convert a business name into a URL-safe slug.
 * Hebrew is transliterated to Latin so the URL works on Firebase Hosting.
 * Returns an empty string if no usable characters remain.
 */
export function slugify(input: string): string {
  const transliterated = transliterateHebrew(input);
  return transliterated
    .trim()
    .toLowerCase()
    .replace(/['"״׳`]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-")
    .replace(/^\-|\-$/g, "");
}

/**
 * Format an Israeli phone number for display: 054-1234567 -> 054-123-4567
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Convert an Israeli phone (e.g. 054-1234567) into the international
 * format expected by wa.me (e.g. 972541234567).
 */
export function whatsappLink(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? `972${digits.slice(1)}` : digits;
  const base = `https://wa.me/${intl}`;
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`;
  }
  return base;
}

export function telLink(phone: string): string {
  return `tel:${phone.replace(/\s|-/g, "")}`;
}
