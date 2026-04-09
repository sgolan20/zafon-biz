import {
  getApprovedBusinesses,
  getCategories,
  getTowns,
  toBusinessSummary,
} from "@/lib/firebase-admin";
import { shuffleWithSeed, getTodayIsraelSeed } from "@/lib/shuffle";
import { Hero } from "@/components/Hero";
import { BusinessTypesShowcase } from "@/components/BusinessTypesShowcase";
import { BusinessGrid } from "@/components/BusinessGrid";
import { SupportBanner } from "@/components/SupportBanner";

/**
 * Public home page - statically generated.
 *
 * To keep the home page HTML small as the catalog grows past a few hundred
 * businesses, we only inline the first INITIAL_COUNT entries here. The
 * BusinessGrid client component lazy-loads the full catalog from
 * `/businesses.json` (written by scripts/dump-businesses.ts during the
 * prebuild step) on hydration. The inline batch is enough for:
 *   - First contentful paint with no fetch wait
 *   - Above-the-fold cards on a large desktop
 *   - SEO crawlers that don't run JS still see real business content
 *
 * The order is shuffled deterministically with today's Israel-local date,
 * so the daily rebuild rotates the catalog and no single business sits at
 * the top permanently. The inline batch and the JSON share the same shuffled
 * order so search results are consistent.
 */
const INITIAL_COUNT = 30;

export default async function HomePage() {
  const [businesses, categories, towns] = await Promise.all([
    getApprovedBusinesses(),
    getCategories(),
    getTowns(),
  ]);

  const seed = getTodayIsraelSeed();
  const shuffled = shuffleWithSeed(businesses, seed);
  const initialBusinesses = shuffled.slice(0, INITIAL_COUNT).map(toBusinessSummary);

  return (
    <>
      <Hero businessCount={businesses.length} />

      <BusinessTypesShowcase />

      <SupportBanner />

      <section id="businesses" className="container-page py-10 sm:py-14 scroll-mt-20">
        <BusinessGrid
          initialBusinesses={initialBusinesses}
          totalCount={businesses.length}
          categories={categories}
          towns={towns}
        />
      </section>
    </>
  );
}
