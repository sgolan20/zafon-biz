/**
 * Dumps every approved business to public/businesses.json as a slim
 * BusinessSummary[]. Runs as a prebuild step before `next build`.
 *
 * Why a separate file instead of inlining everything in the home page HTML:
 *
 * The home page only ships the first ~30 businesses inline (enough for
 * the visible-above-the-fold cards + SEO). The rest are lazy-loaded by
 * the BusinessGrid client component from /businesses.json after hydration.
 * At 99 businesses this is mildly wasteful (~30 KB JSON gzipped), but at
 * 3000 businesses it cuts the home page HTML by ~95% and lets the search
 * still operate on the full catalog.
 *
 * Cache header: configured in firebase.json so the JSON is no-cache (the
 * file changes on every deploy because of the daily shuffle reorder).
 *
 * Run from project root:
 *   GOOGLE_APPLICATION_CREDENTIALS=.secrets/sa-key.json npx tsx scripts/dump-businesses.ts
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getApprovedBusinesses, toBusinessSummary } from "../lib/firebase-admin";
import { shuffleWithSeed, getTodayIsraelSeed } from "../lib/shuffle";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_PATH = join(ROOT, "public", "businesses.json");

async function main() {
  console.log("→ Fetching approved businesses from Firestore...");
  const businesses = await getApprovedBusinesses();
  console.log(`  found ${businesses.length} approved businesses`);

  // Shuffle deterministically with today's Israel-local date so the
  // catalog rotates daily without giving any single business a permanent
  // top slot. The home page reads the same shuffled order from this file.
  const seed = getTodayIsraelSeed();
  const shuffled = shuffleWithSeed(businesses, seed);
  const summaries = shuffled.map(toBusinessSummary);

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(summaries));

  const sizeKb = (JSON.stringify(summaries).length / 1024).toFixed(1);
  console.log(`✓ wrote ${OUT_PATH} (${summaries.length} entries, ${sizeKb} KB raw)`);
}

main().catch((err) => {
  console.error("❌ dump-businesses failed:", err);
  process.exit(1);
});
