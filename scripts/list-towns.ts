/**
 * Lists all towns in Firestore with their IDs and names.
 * Used for debugging slug mismatches.
 */
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({ credential: applicationDefault(), projectId: "zafon-biz" });
}

const db = getFirestore();

async function main() {
  const snap = await db.collection("towns").get();
  console.log(`Total towns in Firestore: ${snap.size}\n`);
  const items = snap.docs
    .map((d) => ({ id: d.id, name: d.data().name as string, region: d.data().region as string }))
    .sort((a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name));
  for (const t of items) {
    console.log(`  ${t.region.padEnd(15)} | ${t.name.padEnd(25)} | id=${t.id}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
