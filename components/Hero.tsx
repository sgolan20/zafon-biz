import Image from "next/image";
import Link from "next/link";
import { MapPin, Search } from "lucide-react";
import { HeroVideo } from "./HeroVideo";

const POPULAR = ["תיירות ואירוח", "מסעדנות וקייטרינג", "טיפולים ובריאות", "חקלאות ומזון מקומי"];

/**
 * Full-bleed hero: looping aerial video of the Hula valley and Mount Hermon,
 * headline, and a search bar that submits to the directory below
 * (?q=…&town=… — BusinessGrid reads them on load).
 */
export function Hero({ towns }: { towns: string[] }) {
  return (
    <section className="relative min-h-[720px] sm:min-h-[780px] overflow-hidden bg-ink-deep">
      <Image
        src="/images/v2/hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <HeroVideo src="/images/v2/hero.mp4" poster="/images/v2/hero.jpg" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_left,rgba(14,32,24,0.9)_0%,rgba(14,32,24,0.6)_45%,rgba(14,32,24,0.15)_100%)] max-md:bg-[rgba(14,32,24,0.62)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[rgba(14,32,24,0.75)] to-transparent"
      />

      <div className="container-page relative z-10 pt-[150px] sm:pt-[170px] pb-28">
        <div className="max-w-[680px] flex flex-col gap-5 sm:gap-6">
          <span className="self-start inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-accent" />
            אינדקס עסקים מהגליל העליון, הגולן וקו העימות
          </span>

          <h1 className="text-[42px] sm:text-[56px] lg:text-[68px] leading-[1.03] font-black tracking-tight text-white">
            קונים מהצפון.
            <br />
            <span className="text-gold-text">מחזקים את הצפון.</span>
          </h1>

          <p className="text-lg sm:text-xl leading-relaxed text-[#ede8dd] max-w-[560px]">
            בעלי מקצוע, מסעדות, חקלאים, צימרים ויוצרים מקריית שמונה ויישובי הסביבה. כל הזמנה
            מהם היא תמיכה ישירה בכלכלה של האזור.
          </p>

          <form
            role="search"
            action="/#businesses"
            method="get"
            className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 rounded-2xl bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
          >
            <label className="flex flex-1 items-center gap-2.5 px-3.5 min-h-[52px]">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="sr-only">חיפוש עסק</span>
              <input
                type="search"
                name="q"
                placeholder="מה מחפשים? נגר, צימר, קייטרינג, יוגה..."
                className="flex-1 min-w-0 bg-transparent text-[17px] text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-2 px-3.5 min-h-[52px] sm:border-r border-t sm:border-t-0 border-border">
              <MapPin className="h-[18px] w-[18px] text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="sr-only">יישוב</span>
              <select
                name="town"
                defaultValue=""
                className="bg-transparent text-base text-foreground focus:outline-none max-w-[180px]"
              >
                <option value="">כל היישובים</option>
                {towns.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="min-h-[52px] rounded-xl bg-primary px-7 text-[17px] font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              חיפוש
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-[#d8d1c2]">פופולרי:</span>
            {POPULAR.map((c) => (
              <Link
                key={c}
                href={`/?cat=${encodeURIComponent(c)}#businesses`}
                className="rounded-full bg-white/15 px-3 py-1.5 text-sm text-white hover:bg-white/25 transition-colors"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** White stats card that overlaps the bottom edge of the hero. */
export function HeroStats({
  businessCount,
  townCount,
  categoryCount,
}: {
  businessCount: number;
  townCount: number;
  categoryCount: number;
}) {
  const items = [
    { value: businessCount, label: "עסקים פעילים באינדקס" },
    { value: townCount, label: "יישובים בצפון" },
    { value: categoryCount, label: "תחומי עיסוק" },
  ];
  return (
    <section className="container-page relative z-20 -mt-16">
      <div className="grid grid-cols-2 md:grid-cols-4 overflow-hidden rounded-[22px] bg-white shadow-[0_24px_60px_rgba(16,35,26,0.12)]">
        {items.map((it) => (
          <div key={it.label} className="flex flex-col gap-1 px-6 sm:px-8 py-6 sm:py-7 border-l border-b md:border-b-0 border-muted">
            <span className="text-3xl sm:text-[42px] font-black tracking-tight text-primary">{it.value}</span>
            <span className="text-sm sm:text-[15px] text-muted-foreground">{it.label}</span>
          </div>
        ))}
        <div className="flex flex-col gap-1 px-6 sm:px-8 py-6 sm:py-7 bg-primary">
          <span className="text-3xl sm:text-[42px] font-black tracking-tight text-gold-text">0 ₪</span>
          <span className="text-sm sm:text-[15px] text-[#e8e2d4]">עלות לבעלי העסקים. בלי עמלות.</span>
        </div>
      </div>
    </section>
  );
}
