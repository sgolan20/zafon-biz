/**
 * Idempotent town sync script.
 *
 * Reads SEED_TOWNS from lib/seed-data.ts and writes each one to
 * Firestore /towns/{slug}. Uses set({merge: true}) so:
 *   - Existing towns are updated harmlessly (region/border flag may change)
 *   - New towns are created
 *   - Towns NOT in seed-data are left untouched (no deletes)
 *
 * Uses the same slugify() as the original seed script so doc IDs match
 * existing entries instead of creating duplicates.
 *
 * Run from project root:
 *   GOOGLE_APPLICATION_CREDENTIALS=.secrets/sa-key.json npx tsx scripts/sync-towns.ts
 */

import {
  initializeApp,
  applicationDefault,
  getApps,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { SEED_TOWNS } from "../lib/seed-data";
import { slugify } from "../lib/utils";

if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault(),
    projectId: "zafon-biz",
  });
}

const db = getFirestore();

async function main() {
  console.log(`Syncing ${SEED_TOWNS.length} towns to Firestore...`);

  // First, find which towns are new vs existing
  const existing = await db.collection("towns").get();
  const existingIds = new Set(existing.docs.map((d) => d.id));

  let added = 0;
  let updated = 0;

  // Use a batch for efficiency, but split if > 500 ops (Firestore limit)
  const BATCH_SIZE = 400;
  let batch = db.batch();
  let opsInBatch = 0;

  for (const town of SEED_TOWNS) {
    const id = slugify(town.name);
    if (!id) {
      console.warn(`  ⚠ skipping town with empty slug: ${town.name}`);
      continue;
    }
    const ref = db.collection("towns").doc(id);
    batch.set(ref, town, { merge: true });
    opsInBatch++;

    if (existingIds.has(id)) {
      updated++;
    } else {
      console.log(`  + new: ${town.name} (${id}) [${town.region}]`);
      added++;
    }

    if (opsInBatch >= BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      opsInBatch = 0;
    }
  }

  if (opsInBatch > 0) {
    await batch.commit();
  }

  console.log(`\n✓ Sync complete:`);
  console.log(`  added:   ${added}`);
  console.log(`  updated: ${updated}`);
  console.log(`  total in seed: ${SEED_TOWNS.length}`);
  console.log(`  total in firestore before: ${existingIds.size}`);
}

main().catch((err) => {
  console.error("❌ sync failed:", err);
  process.exit(1);
});
