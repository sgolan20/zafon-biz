/* eslint-disable @next/next/no-img-element -- small static brand PNGs, no optimisation needed */

/**
 * Brand wordmark: "תומכים בצפון" under a gold line of the Hermon ridge with
 * the sun at its peak (made with GPT Image 2.6 in Magnific).
 *
 * - `dark`  = for light backgrounds (green letters); default is white letters
 *             for the dark header/hero.
 * - `full`  = adds the "אינדקס עסקים מהצפון" tagline (footer, large uses).
 */
export function Logo({ dark = false, full = false }: { dark?: boolean; full?: boolean }) {
  const src = full
    ? dark
      ? "/brand/logo-full-dark.png"
      : "/brand/logo-full-light.png"
    : dark
      ? "/brand/logo-dark.png"
      : "/brand/logo-light.png";
  const [w, h] = full ? [953, 280] : [930, 240];

  return (
    <img
      src={src}
      alt="תומכים בצפון"
      width={w}
      height={h}
      className={`w-auto transition-opacity group-hover:opacity-90 ${
        full ? "h-[72px] sm:h-[84px]" : "h-[40px] sm:h-[50px]"
      }`}
    />
  );
}
