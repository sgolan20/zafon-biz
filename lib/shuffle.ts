import seedrandom from "seedrandom";

/**
 * Deterministic Fisher-Yates shuffle. Given the same seed, it always
 * returns items in the same order. We use this for the daily-shuffle
 * fairness mechanism: every day all visitors see the same order, but
 * the order rotates daily so no business is permanently at the top.
 *
 * The seed should be `YYYY-MM-DD` for daily shuffling.
 */
export function shuffleWithSeed<T>(array: readonly T[], seed: string): T[] {
  const rng = seedrandom(seed);
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Returns today's date in Israel timezone (Asia/Jerusalem) as YYYY-MM-DD.
 * We use Israel time (not UTC) so the daily shuffle rotates at midnight
 * Israel-local, which is what visitors expect.
 */
export function getTodayIsraelSeed(): string {
  const israelDate = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Jerusalem",
  });
  // 'en-CA' produces YYYY-MM-DD format
  return israelDate;
}
