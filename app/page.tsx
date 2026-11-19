import { getApprovedBusinesses, getCategories, getTowns, toBusinessSummary } from "@/lib/db";
import { shuffleWithSeed, getTodayIsraelSeed } from "@/lib/shuffle";
import { Hero, HeroStats } from "@/components/Hero";
import { BusinessTypesShowcase } from "@/components/BusinessTypesShowcase";
import { BusinessGrid } from "@/components/BusinessGrid";
import { SupportBanner } from "@/components/SupportBanner";
import { JoinSection } from "@/components/JoinSection";

export const dynamic = "force-dynamic";

/**
 * Public home page - rendered on each request from D1.
 *
 * Only the first INITIAL_COUNT businesses are inlined; BusinessGrid
 * lazy-loads the rest from `/businesses.json` on hydration. Both share the
 * same daily shuffle (seed = today's date in Israel), so the order rotates
 * at midnight and no business sits at the top permanently.
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

  const categoryCounts: Record<string, number> = {};
  for (const b of businesses) {
    categoryCounts[b.category] = (categoryCounts[b.category] ?? 0) + 1;
  }

  // Towns that actually have businesses, most businesses first.
  const townCounts: Record<string, number> = {};
  for (const b of businesses) townCounts[b.town] = (townCounts[b.town] ?? 0) + 1;
  const activeTowns = Object.keys(townCounts).sort((a, b) => townCounts[b] - townCounts[a]);

  return (
    <>
      <Hero towns={activeTowns} />
      <HeroStats
        businessCount={businesses.length}
        townCount={towns.length}
        categoryCount={categories.length}
      />

      <BusinessTypesShowcase categoryCounts={categoryCounts} categoryTotal={categories.length} />

      <section id="businesses" className="container-page pt-16 sm:pt-20 pb-16 scroll-mt-4">
        <BusinessGrid
          initialBusinesses={initialBusinesses}
          totalCount={businesses.length}
          categories={categories}
          categoryCounts={categoryCounts}
          towns={towns}
        />
      </section>

      <SupportBanner />
      <div className="h-10" />
      <JoinSection />
    </>
  );
}
