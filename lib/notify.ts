/**
 * Outgoing messages: password emails and new-submission alerts to the admin.
 *
 * Email goes through Cloudflare Email Service (the `EMAIL` send_email binding).
 * It needs a domain onboarded to Email Service and EMAIL_FROM set in
 * wrangler.jsonc. Until then `sendPasswordEmail` returns false and the
 * admin panel can copy a set-password link to send by hand.
 */
import "server-only";
import { getEnv } from "./db";

type Env = CloudflareEnv & {
  EMAIL?: SendEmail;
  ADMIN_EMAIL?: string;
};

export function siteUrl(): string {
  return (getEnv().SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function passwordLink(token: string): string {
  return `${siteUrl()}/reset-password/?token=${encodeURIComponent(token)}`;
}

export function emailEnabled(): boolean {
  const env = getEnv() as Env;
  return Boolean(env.EMAIL && env.EMAIL_FROM);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export async function sendPasswordEmail(to: string, link: string): Promise<boolean> {
  const env = getEnv() as Env;
  if (!env.EMAIL || !env.EMAIL_FROM) {
    console.warn("[email] disabled — no EMAIL binding / EMAIL_FROM; link not sent to", to);
    return false;
  }
  const subject = "קביעת סיסמה - תומכים בצפון";
  const text = `שלום,\n\nכדי לקבוע סיסמה לחשבון שלכם באתר "תומכים בצפון - קונים נכון" היכנסו לקישור:\n${link}\n\nהקישור תקף לזמן מוגבל ולשימוש אחד. אם לא ביקשתם - אפשר להתעלם מהמייל.`;
  const html = `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:16px;line-height:1.6">
<p>שלום,</p>
<p>כדי לקבוע סיסמה לחשבון שלכם באתר <b>תומכים בצפון - קונים נכון</b> לחצו על הכפתור:</p>
<p><a href="${escapeHtml(link)}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">קביעת סיסמה</a></p>
<p style="color:#666;font-size:13px">הקישור תקף לזמן מוגבל ולשימוש אחד. אם לא ביקשתם - אפשר להתעלם מהמייל.</p>
</div>`;
  try {
    await env.EMAIL.send({
      from: { name: "תומכים בצפון", email: env.EMAIL_FROM },
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch (err) {
    console.error("[email] send failed", err);
    return false;
  }
}

/**
 * Emails the admin when a new business registers (Cloudflare Email Service).
 * Until email is connected this is a no-op — pending businesses are shown
 * at the top of the admin panel either way.
 */
export async function notifyNewSubmission(b: {
  name: string;
  town: string;
  category: string;
}): Promise<void> {
  const env = getEnv() as Env;
  if (!env.EMAIL || !env.EMAIL_FROM || !env.ADMIN_EMAIL) return;
  try {
    await env.EMAIL.send({
      from: { name: "תומכים בצפון", email: env.EMAIL_FROM },
      to: env.ADMIN_EMAIL,
      subject: `עסק חדש ממתין לאישור: ${b.name}`,
      text: `${b.name} (${b.category}, ${b.town}) נרשם וממתין לאישור.\n\n${siteUrl()}/admin/`,
    });
  } catch (err) {
    console.error("[notify] admin email failed", err);
  }
}
