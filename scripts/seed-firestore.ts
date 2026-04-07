/**
 * One-time seed script to populate Firestore with categories, towns, and
 * 5-10 dummy businesses for testing.
 *
 * Run from the project root:
 *   npx tsx scripts/seed-firestore.ts
 *
 * Uses Application Default Credentials from gcloud CLI. To re-seed, you
 * may need to delete existing collections from the Firebase Console first.
 */

import {
  initializeApp,
  applicationDefault,
  getApps,
} from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { SEED_CATEGORIES, SEED_TOWNS, SEED_DUMMY_BUSINESSES } from "../lib/seed-data";
import { slugify } from "../lib/utils";

if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault(),
    projectId: "zafon-biz",
  });
}

const db = getFirestore();

async function seedCategories() {
  console.log("\n📁 Seeding categories...");
  const batch = db.batch();
  for (const cat of SEED_CATEGORIES) {
    const id = slugify(cat.name);
    const ref = db.collection("categories").doc(id);
    batch.set(ref, cat);
    console.log(`  + ${cat.name}`);
  }
  await batch.commit();
  console.log(`✓ ${SEED_CATEGORIES.length} categories created`);
}

async function seedTowns() {
  console.log("\n🏘️  Seeding towns...");
  const batch = db.batch();
  for (const town of SEED_TOWNS) {
    const id = slugify(town.name);
    const ref = db.collection("towns").doc(id);
    batch.set(ref, town);
    console.log(`  + ${town.name} (${town.region})`);
  }
  await batch.commit();
  console.log(`✓ ${SEED_TOWNS.length} towns created`);
}

async function seedBusinesses() {
  console.log("\n🏪 Seeding dummy businesses (approved)...");
  const batch = db.batch();
  let count = 0;
  for (const biz of SEED_DUMMY_BUSINESSES) {
    const slug = `${slugify(biz.name)}-${count}`;
    const ref = db.collection("businesses").doc();
    batch.set(ref, {
      ...biz,
      slug,
      status: "approved",
      createdAt: FieldValue.serverTimestamp(),
      approvedAt: FieldValue.serverTimestamp(),
      approvedBy: "seed-script",
      shuffleSeed: Math.floor(Math.random() * 1_000_000_000),
    });
    console.log(`  + ${biz.name} (${biz.town})`);
    count++;
  }
  await batch.commit();
  console.log(`✓ ${count} dummy businesses created`);
}

async function main() {
  console.log("🌱 Starting Firestore seed for zafon-biz");
  try {
    await seedCategories();
    await seedTowns();
    await seedBusinesses();
    console.log("\n✅ Seed complete!");
  } catch (err) {
    console.error("\n❌ Seed failed:", err);
    process.exit(1);
  }
}

main();
