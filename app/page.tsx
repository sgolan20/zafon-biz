import { getApprovedBusinesses, getCategories, getTowns } from "@/lib/firebase-admin";
import { shuffleWithSeed, getTodayIsraelSeed } from "@/lib/shuffle";
import { Hero } from "@/components/Hero";
import { BusinessGrid } from "@/components/BusinessGrid";

/**
 * Public home page - statically generated.
 *
 * The list of businesses is fetched from Firestore at build time and the
 * order is shuffled deterministically using today's Israel-local date as a
 * seed. This means:
 *   - Every visitor today sees the same order (good for trust + caching)
 *   - The order rotates daily so no business is permanently at the top
 *   - SEO crawlers see all businesses inline in the HTML
 *
 * Daily rebuild via GitHub Actions cron is what rotates the order each day.
 */
export default async function HomePage() {
  const [businesses, categories, towns] = await Promise.all([
    getApprovedBusinesses(),
    getCategories(),
    getTowns(),
  ]);

  const seed = getTodayIsraelSeed();
  const shuffled = shuffleWithSeed(businesses, seed);

  return (
    <>
      <Hero businessCount={businesses.length} />

      <section id="businesses" className="container-page py-10 sm:py-14 scroll-mt-20">
        <BusinessGrid businesses={shuffled} categories={categories} towns={towns} />
      </section>
    </>
  );
}
