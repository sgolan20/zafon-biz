/**
 * Regenerate slugs for all existing businesses using the new Latin
 * transliteration. Run this after updating slugify() if there are
 * already-seeded documents that have Hebrew slugs.
 */

import {
  initializeApp,
  applicationDefault,
  cert,
  getApps,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { slugify } from "../lib/utils";

const PROJECT_ID = "zafon-biz";

if (getApps().length === 0) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(sa), projectId: PROJECT_ID });
  } else {
    initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  }
}

async function main() {
  const db = getFirestore();
  const snap = await db.collection("businesses").get();

  console.log(`Found ${snap.size} businesses`);

  const batch = db.batch();
  let i = 0;
  const seenSlugs = new Set<string>();

  for (const doc of snap.docs) {
    const data = doc.data();
    const baseSlug = slugify(data.name);
    let finalSlug = baseSlug;
    let suffix = 0;
    while (seenSlugs.has(finalSlug) || finalSlug === "") {
      suffix++;
      finalSlug = baseSlug ? `${baseSlug}-${suffix}` : `business-${suffix}`;
    }
    seenSlugs.add(finalSlug);

    console.log(`  ${data.name} → ${finalSlug}`);
    batch.update(doc.ref, { slug: finalSlug });
    i++;
  }

  await batch.commit();
  console.log(`\n✓ Updated ${i} business slugs`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
