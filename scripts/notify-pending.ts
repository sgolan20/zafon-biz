/**
 * Notifies the admin (Shahar) by email when new pending businesses have
 * been submitted since the last notification check.
 *
 * Designed to run alongside scripts/build-if-needed.ts in the same
 * GitHub Actions cron job (every 30 min). Idempotent — sends at most
 * one email per cron run, and only when at least one new pending
 * business appeared since the last successful email.
 *
 * State: stored in Firestore at meta/lastNotified as a Timestamp.
 *
 * Environment:
 *   RESEND_API_KEY        — Resend API key (if missing, script exits
 *                           quietly so it never breaks the deploy job)
 *   FIREBASE_SERVICE_ACCOUNT — service account JSON for admin SDK
 *   NOTIFICATION_EMAIL    — optional override; defaults to
 *                           sgolan20@gmail.com
 *   RESEND_FROM           — optional override; defaults to Resend's
 *                           sandbox sender "onboarding@resend.dev"
 *                           which works out of the box for the account
 *                           email (no domain verification needed).
 */

import {
  initializeApp,
  applicationDefault,
  cert,
  getApps,
} from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const PROJECT_ID = "zafon-biz";
const ADMIN_URL = "https://zafon-biz.web.app/admin/";
const NOTIFICATION_EMAIL =
  process.env.NOTIFICATION_EMAIL || "sgolan20@gmail.com";
const RESEND_FROM = process.env.RESEND_FROM || "onboarding@resend.dev";

function initFirebase() {
  if (getApps().length > 0) return;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(sa), projectId: PROJECT_ID });
  } else {
    initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hebrewCountLabel(n: number): string {
  if (n === 1) return "עסק חדש אחד";
  if (n === 2) return "שני עסקים חדשים";
  return `${n} עסקים חדשים`;
}

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(
      "⚠ RESEND_API_KEY not set — skipping notification check (safe no-op)",
    );
    return;
  }

  initFirebase();
  const db = getFirestore();

  // 1. Read last-notified timestamp (if any)
  const metaRef = db.collection("meta").doc("lastNotified");
  const metaDoc = await metaRef.get();
  const lastNotifiedAt = metaDoc.exists
    ? (metaDoc.data()?.timestamp as Timestamp | undefined)
    : undefined;

  console.log(
    `Last notified: ${lastNotifiedAt?.toDate().toISOString() ?? "never"}`,
  );

  // 2. First-run initialization: if there's no record of a previous
  //    notification, just set the watermark to "now" and exit. We don't
  //    want to blast an email with every historical pending business
  //    the first time this runs in CI.
  if (!lastNotifiedAt) {
    await metaRef.set({
      timestamp: Timestamp.now(),
      lastCount: 0,
      initialized: true,
    });
    console.log("✓ First run: watermark initialized, no email sent");
    return;
  }

  // 3. Query for new pending businesses created after lastNotifiedAt.
  //    This relies on the existing composite index
  //    (status ASC + createdAt DESC) in firestore.indexes.json.
  const snap = await db
    .collection("businesses")
    .where("status", "==", "pending")
    .where("createdAt", ">", lastNotifiedAt)
    .orderBy("createdAt", "desc")
    .get();

  if (snap.empty) {
    console.log("✓ No new pending businesses since last notification");
    return;
  }

  console.log(`Found ${snap.size} new pending businesses`);

  // 4. Build the email body
  type Biz = {
    name: string;
    category: string;
    town: string;
    contactName: string;
    phone: string;
    description: string;
    email?: string;
    website?: string;
  };
  const items: Biz[] = snap.docs.map((d) => {
    const data = d.data();
    return {
      name: (data.name as string) ?? "",
      category: (data.category as string) ?? "",
      town: (data.town as string) ?? "",
      contactName: (data.contactName as string) ?? "",
      phone: (data.phone as string) ?? "",
      description: (data.description as string) ?? "",
      email: data.email as string | undefined,
      website: data.website as string | undefined,
    };
  });

  const subject = `${hebrewCountLabel(items.length)} ממתינים לאישור - תומכים בצפון`;

  const cardsHtml = items
    .map(
      (b) => `
      <div style="background:#f5f5f4;border-radius:12px;padding:16px;margin-bottom:12px;">
        <h3 style="margin:0 0 8px;color:#1c1917;font-size:18px;">${escapeHtml(b.name)}</h3>
        <p style="margin:4px 0;color:#57534e;font-size:14px;line-height:1.6;">
          <strong>קטגוריה:</strong> ${escapeHtml(b.category)}<br>
          <strong>יישוב:</strong> ${escapeHtml(b.town)}<br>
          <strong>איש קשר:</strong> ${escapeHtml(b.contactName)} — ${escapeHtml(b.phone)}${b.email ? " — " + escapeHtml(b.email) : ""}
        </p>
        <p style="margin:8px 0 0;color:#44403c;font-size:13px;line-height:1.6;">
          ${escapeHtml(b.description).slice(0, 400)}${b.description.length > 400 ? "..." : ""}
        </p>
      </div>`,
    )
    .join("");

  const html = `
<div dir="rtl" style="font-family:-apple-system,system-ui,Arial,sans-serif;max-width:600px;margin:0 auto;padding:16px;">
  <h2 style="color:#0369a1;margin:0 0 12px;">נוספו ${hebrewCountLabel(items.length)} לאישור</h2>
  <p style="color:#57534e;margin:0 0 20px;">יש עסקים חדשים בתור האישור באתר "תומכים בצפון - קונים נכון":</p>
  ${cardsHtml}
  <p style="margin:28px 0 12px;text-align:center;">
    <a href="${ADMIN_URL}" style="display:inline-block;background:#0369a1;color:#ffffff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">
      לפאנל הניהול ← ${ADMIN_URL}
    </a>
  </p>
  <p style="color:#a8a29e;font-size:11px;text-align:center;margin-top:24px;">
    התראה אוטומטית מ-GitHub Actions. ${new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })}
  </p>
</div>`;

  // Plaintext fallback for email clients that prefer it
  const textLines: string[] = [];
  textLines.push(`נוספו ${hebrewCountLabel(items.length)} לאישור באתר תומכים בצפון.`);
  textLines.push("");
  for (const b of items) {
    textLines.push(`• ${b.name}`);
    textLines.push(`  קטגוריה: ${b.category}`);
    textLines.push(`  יישוב: ${b.town}`);
    textLines.push(`  איש קשר: ${b.contactName} — ${b.phone}`);
    textLines.push(`  תיאור: ${b.description.slice(0, 400)}${b.description.length > 400 ? "..." : ""}`);
    textLines.push("");
  }
  textLines.push(`לאישור: ${ADMIN_URL}`);
  const text = textLines.join("\n");

  // 5. Send via Resend
  console.log(`Sending email to ${NOTIFICATION_EMAIL} via Resend...`);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [NOTIFICATION_EMAIL],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { id?: string };
  console.log(`✓ Email sent (Resend ID: ${data.id ?? "unknown"})`);

  // 6. Update lastNotified watermark
  await metaRef.set({
    timestamp: Timestamp.now(),
    lastCount: items.length,
  });
  console.log("✓ lastNotified watermark updated");
}

main().catch((err) => {
  console.error("❌ notify-pending failed:", err);
  process.exit(1);
});
