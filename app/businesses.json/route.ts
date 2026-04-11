import { getApprovedBusinesses, toBusinessSummary } from "@/lib/firebase-admin";
import { shuffleWithSeed, getTodayIsraelSeed } from "@/lib/shuffle";

/**
 * GET /businesses.json
 *
 * Slim JSON dump of every approved business (`BusinessSummary[]`) used by
 * BusinessGrid on the home page to lazy-load the full catalog after the
 * first paint. Inlining all 165+ entries in the initial HTML would make
 * the home page HTML unnecessarily large as the directory grows; this
 * route keeps the payload separate and cacheable.
 *
 * Implemented as a Route Handler (not a prebuild script) so both
 * environments work without a separate build step:
 *   - `next dev`:  handler runs at request time, reads live from Firestore.
 *   - `next build` (output: export): with force-static, Next.js prerenders
 *     the handler at build time and writes the result to `out/businesses.json`,
 *     which Firebase Hosting then serves as a static asset.
 *
 * The order is shuffled deterministically with today's Israel-local date
 * so the build rotates the listing daily. The home page reads the same
 * shuffled slice for its inline-first-30 batch so search results stay
 * consistent between the inline HTML and the lazy-loaded JSON.
 */
export const dynamic = "force-static";

export async function GET() {
  const businesses = await getApprovedBusinesses();
  const seed = getTodayIsraelSeed();
  const shuffled = shuffleWithSeed(businesses, seed);
  const summaries = shuffled.map(toBusinessSummary);
  return Response.json(summaries);
}
