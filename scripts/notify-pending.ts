/**
 * Notifies the admin (Shahar) about new pending businesses by opening a
 * GitHub Issue in the repo. GitHub automatically emails the repo owner
 * when a new issue is created, so this gives us "email notifications"
 * with zero third-party services and zero extra secrets — GITHUB_TOKEN
 * is provided automatically inside Actions.
 *
 * Designed to run alongside scripts/build-if-needed.ts in the same
 * GitHub Actions cron job (every 30 min). Idempotent — opens at most
 * one issue per cron run, and only when at least one new pending
 * business appeared since the last successful notification.
 *
 * State: stored in Firestore at meta/lastNotified as a Timestamp.
 *
 * Privacy: the zafon-biz repo is public, so the issue body contains
 * ONLY business name + town + category. Phone, email, contact name,
 * and full description stay in Firestore / the admin panel.
 *
 * Environment:
 *   GITHUB_TOKEN          — auto-provided by Actions. If missing, the
 *                           script exits quietly (safe no-op for local
 *                           runs and for the build job before the
 *                           permission is granted).
 *   GITHUB_REPOSITORY     — auto-provided by Actions as "owner/repo".
 *   FIREBASE_SERVICE_ACCOUNT — service account JSON for admin SDK
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

function initFirebase() {
  if (getApps().length > 0) return;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(sa), projectId: PROJECT_ID });
  } else {
    initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  }
}

function hebrewCountLabel(n: number): string {
  if (n === 1) return "עסק חדש אחד";
  if (n === 2) return "שני עסקים חדשים";
  return `${n} עסקים חדשים`;
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!token || !repo) {
    console.log(
      "⚠ GITHUB_TOKEN / GITHUB_REPOSITORY not set — skipping notification check (safe no-op outside Actions)",
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
  //    want to open an issue with every historical pending business
  //    the first time this runs in CI.
  if (!lastNotifiedAt) {
    await metaRef.set({
      timestamp: Timestamp.now(),
      lastCount: 0,
      initialized: true,
    });
    console.log("✓ First run: watermark initialized, no issue opened");
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

  // 4. Build the issue body — ONLY name + town + category (repo is public).
  type Biz = { name: string; category: string; town: string };
  const items: Biz[] = snap.docs.map((d) => {
    const data = d.data();
    return {
      name: (data.name as string) ?? "",
      category: (data.category as string) ?? "",
      town: (data.town as string) ?? "",
    };
  });

  const title = `🔔 ${hebrewCountLabel(items.length)} ממתינים לאישור`;

  const lines: string[] = [];
  lines.push(`נוספו ${hebrewCountLabel(items.length)} לאתר **תומכים בצפון - קונים נכון** וממתינים לאישור ידני.`);
  lines.push("");
  lines.push("| שם העסק | יישוב | קטגוריה |");
  lines.push("| --- | --- | --- |");
  for (const b of items) {
    lines.push(`| ${b.name} | ${b.town} | ${b.category} |`);
  }
  lines.push("");
  lines.push(`### 🔗 [לפאנל הניהול לאישור העסקים](${ADMIN_URL})`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(
    "_פרטי הקשר המלאים (טלפון, אימייל, תיאור) זמינים רק בפאנל הניהול — הריפו הזה ציבורי._",
  );
  lines.push(
    `_התראה אוטומטית מ-GitHub Actions · ${new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })}_`,
  );
  const body = lines.join("\n");

  // 5. Open the GitHub issue
  console.log(`Opening GitHub issue on ${repo}...`);
  const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      body,
      labels: ["pending-businesses"],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${errBody}`);
  }

  const data = (await res.json()) as { number?: number; html_url?: string };
  console.log(`✓ Issue opened: #${data.number} ${data.html_url}`);

  // 6. Update lastNotified watermark
  await metaRef.set({
    timestamp: Timestamp.now(),
    lastCount: items.length,
    lastIssueNumber: data.number ?? null,
  });
  console.log("✓ lastNotified watermark updated");
}

main().catch((err) => {
  console.error("❌ notify-pending failed:", err);
  process.exit(1);
});
