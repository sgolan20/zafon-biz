import { getApprovedBusinesses, toBusinessSummary } from "@/lib/db";
import { shuffleWithSeed, getTodayIsraelSeed } from "@/lib/shuffle";

/**
 * GET /businesses.json
 *
 * Slim JSON of every approved business (`BusinessSummary[]`), lazy-loaded by
 * BusinessGrid on the home page after first paint. Read live from D1 and
 * shuffled with today's Israel-local date so it matches the inline batch.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const businesses = await getApprovedBusinesses();
  const seed = getTodayIsraelSeed();
  const shuffled = shuffleWithSeed(businesses, seed);
  const summaries = shuffled.map(toBusinessSummary);
  return Response.json(summaries, {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
