/**
 * Exports every business (all statuses) from Firestore to a CSV file.
 *
 * Output: businesses-export-YYYY-MM-DD.csv at the project root.
 * CSV is written with UTF-8 BOM so Excel opens Hebrew correctly.
 *
 *   npx tsx scripts/export-businesses-csv.ts
 */

import {
  initializeApp,
  applicationDefault,
  cert,
  getApps,
} from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

if (getApps().length === 0) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
      projectId: "zafon-biz",
    });
  } else {
    initializeApp({
      credential: applicationDefault(),
      projectId: "zafon-biz",
    });
  }
}

const db = getFirestore();

function toIso(value: unknown): string {
  if (!value) return "";
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return "";
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s: string;
  if (Array.isArray(v)) s = v.join("; ");
  else s = String(v);
  s = s.replace(/\r?\n/g, " ").trim();
  if (s.includes(",") || s.includes('"') || s.includes(";")) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function main() {
  console.log("→ Fetching all businesses from Firestore...");
  const snapshot = await db.collection("businesses").get();
  console.log(`  found ${snapshot.size} businesses`);

  const columns: Array<{ key: string; header: string; get: (d: FirebaseFirestore.DocumentData, id: string) => unknown }> = [
    { key: "id", header: "id", get: (_d, id) => id },
    { key: "status", header: "status", get: (d) => d.status },
    { key: "name", header: "name", get: (d) => d.name },
    { key: "slug", header: "slug", get: (d) => d.slug },
    { key: "category", header: "category", get: (d) => d.category },
    { key: "subCategory", header: "subCategory", get: (d) => d.subCategory },
    { key: "tags", header: "tags", get: (d) => d.tags },
    { key: "town", header: "town", get: (d) => d.town },
    { key: "region", header: "region", get: (d) => d.region },
    { key: "address", header: "address", get: (d) => d.address },
    { key: "contactName", header: "contactName", get: (d) => d.contactName },
    { key: "phone", header: "phone", get: (d) => d.phone },
    { key: "whatsapp", header: "whatsapp", get: (d) => d.whatsapp },
    { key: "email", header: "email", get: (d) => d.email },
    { key: "website", header: "website", get: (d) => d.website },
    { key: "facebook", header: "facebook", get: (d) => d.facebook },
    { key: "instagram", header: "instagram", get: (d) => d.instagram },
    { key: "openingHours", header: "openingHours", get: (d) => d.openingHours },
    { key: "shortDescription", header: "shortDescription", get: (d) => d.shortDescription },
    { key: "description", header: "description", get: (d) => d.description },
    { key: "createdAt", header: "createdAt", get: (d) => toIso(d.createdAt) },
    { key: "approvedAt", header: "approvedAt", get: (d) => toIso(d.approvedAt) },
    { key: "approvedBy", header: "approvedBy", get: (d) => d.approvedBy },
    { key: "shuffleSeed", header: "shuffleSeed", get: (d) => d.shuffleSeed },
  ];

  const header = columns.map((c) => c.header).join(",");
  const rows = snapshot.docs.map((doc) => {
    const data = doc.data();
    return columns.map((c) => csvEscape(c.get(data, doc.id))).join(",");
  });

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
  const outPath = join(ROOT, `businesses-export-${today}.csv`);

  // UTF-8 BOM so Excel auto-detects UTF-8 and Hebrew renders correctly.
  const BOM = "\uFEFF";
  writeFileSync(outPath, BOM + header + "\n" + rows.join("\n"), "utf8");

  const byStatus = snapshot.docs.reduce<Record<string, number>>((acc, doc) => {
    const s = doc.data().status ?? "unknown";
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`✓ wrote ${outPath}`);
  console.log(`  total: ${snapshot.size}`);
  for (const [s, n] of Object.entries(byStatus)) {
    console.log(`  ${s}: ${n}`);
  }
}

main().catch((err) => {
  console.error("❌ export failed:", err);
  process.exit(1);
});
