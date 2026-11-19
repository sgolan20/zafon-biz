/**
 * One-off: dump every Firestore collection of the old Firebase project to
 * .migration/firestore.json (gitignored). Timestamps become ISO strings.
 *
 *   npx tsx scripts/migrate/export-firestore.ts
 *
 * Uses gcloud Application Default Credentials.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const app = initializeApp({ credential: applicationDefault(), projectId: "zafon-biz" });
const db = getFirestore(app);

function normalize(v: unknown): unknown {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (Array.isArray(v)) return v.map(normalize);
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, normalize(x)]));
  }
  return v;
}

async function main() {
  const cols = await db.listCollections();
  const out: Record<string, Record<string, unknown>[]> = {};
  for (const c of cols) {
    const snap = await c.get();
    out[c.id] = snap.docs.map((d) => ({ id: d.id, ...(normalize(d.data()) as object) }));
    console.log(`${c.id}: ${snap.size}`);
  }
  mkdirSync(".migration", { recursive: true });
  writeFileSync(".migration/firestore.json", JSON.stringify(out, null, 2));
}
main();
