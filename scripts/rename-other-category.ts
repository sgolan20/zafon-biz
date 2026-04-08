/**
 * One-off migration: renames the catch-all category from
 * "שירותים מקצועיים אחרים" to just "אחר".
 *
 * Steps:
 *   1. Add the new "אחר" category doc (id = slugify("אחר"))
 *   2. Update any business with category="שירותים מקצועיים אחרים" → "אחר"
 *   3. Delete the old category doc
 *
 * Run from project root:
 *   GOOGLE_APPLICATION_CREDENTIALS=.secrets/sa-key.json npx tsx scripts/rename-other-category.ts
 */
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { slugify } from "../lib/utils";

if (getApps().length === 0) {
  initializeApp({ credential: applicationDefault(), projectId: "zafon-biz" });
}

const db = getFirestore();

const OLD_NAME = "שירותים מקצועיים אחרים";
const NEW_NAME = "אחר";

async function main() {
  // 1. Find the old category doc
  const allCategories = await db.collection("categories").get();
  const oldDoc = allCategories.docs.find((d) => d.data().name === OLD_NAME);

  // 2. Create the new category doc
  const newId = slugify(NEW_NAME);
  console.log(`Creating new category doc /categories/${newId} with name="${NEW_NAME}"`);
  await db
    .collection("categories")
    .doc(newId)
    .set({
      name: NEW_NAME,
      icon: oldDoc?.data().icon || "more-horizontal",
      order: oldDoc?.data().order ?? 20,
    });

  // 3. Find businesses using the old name and update them
  const affected = await db
    .collection("businesses")
    .where("category", "==", OLD_NAME)
    .get();
  console.log(`Found ${affected.size} businesses using old category name`);

  if (affected.size > 0) {
    const batch = db.batch();
    for (const doc of affected.docs) {
      console.log(`  - updating ${doc.id} (${doc.data().name})`);
      batch.update(doc.ref, { category: NEW_NAME });
    }
    await batch.commit();
  }

  // 4. Delete the old category doc
  if (oldDoc) {
    console.log(`Deleting old category doc /categories/${oldDoc.id}`);
    await oldDoc.ref.delete();
  } else {
    console.log("No old category doc found - nothing to delete");
  }

  console.log("\n✓ Done");
}

main().catch((e) => {
  console.error("❌ migration failed:", e);
  process.exit(1);
});
