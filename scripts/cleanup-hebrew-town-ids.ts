/**
 * One-off cleanup: removes town docs whose ID is in Hebrew (legacy from
 * before slugify() got Hebrew→Latin transliteration). The Latin-ID
 * version of each town is the canonical one and remains untouched.
 *
 * Run from project root:
 *   GOOGLE_APPLICATION_CREDENTIALS=.secrets/sa-key.json npx tsx scripts/cleanup-hebrew-town-ids.ts
 */
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({ credential: applicationDefault(), projectId: "zafon-biz" });
}

const db = getFirestore();

function hasHebrew(s: string): boolean {
  return /[\u0590-\u05FF]/.test(s);
}

async function main() {
  const snap = await db.collection("towns").get();
  console.log(`Total towns before cleanup: ${snap.size}`);

  const hebrewIdDocs = snap.docs.filter((d) => hasHebrew(d.id));
  console.log(`Hebrew-ID docs to delete: ${hebrewIdDocs.length}`);

  if (hebrewIdDocs.length === 0) {
    console.log("Nothing to clean up.");
    return;
  }

  const batch = db.batch();
  for (const doc of hebrewIdDocs) {
    console.log(`  - ${doc.id}  (name: ${doc.data().name})`);
    batch.delete(doc.ref);
  }
  await batch.commit();

  const after = await db.collection("towns").get();
  console.log(`\n✓ Done. Total towns after cleanup: ${after.size}`);
}

main().catch((e) => {
  console.error("❌ cleanup failed:", e);
  process.exit(1);
});
