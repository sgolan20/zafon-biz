import Image from "next/image";
import Link from "next/link";

const STEPS = [
  "ממלאים את פרטי העסק ובוחרים סיסמה",
  "אנחנו מאשרים, בדרך כלל תוך יום",
  "העסק באוויר, ואתם מנהלים אותו מהאזור האישי",
];

/** Dark call-to-action band for business owners, with the orchard photo. */
export function JoinSection() {
  return (
    <section className="container-page pb-24 sm:pb-28">
      <div className="grid lg:grid-cols-2 overflow-hidden rounded-[28px] bg-ink">
        <div className="flex flex-col gap-5 sm:gap-6 p-8 sm:p-14">
          <span className="text-sm font-bold tracking-wide text-gold-text">לבעלי עסקים מהצפון</span>
          <h2 className="text-3xl sm:text-[42px] leading-[1.12] font-extrabold tracking-tight text-white">
            העסק שלכם כאן,
            <br />
            תוך דקות. בחינם.
          </h2>
          <p className="text-[17px] leading-relaxed text-[#cfd6d0]">
            ממלאים טופס קצר, אנחנו בודקים ומאשרים, והעסק עולה לאתר עם דף משלו. עם המייל והסיסמה
            שלכם אתם נכנסים לאזור האישי ומעדכנים את הפרטים מתי שרוצים.
          </p>
          <ol className="mt-1 flex flex-col gap-3.5">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-3.5 text-base text-white">
                <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-accent font-extrabold text-accent-foreground">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href="/register/"
              className="inline-flex items-center min-h-[52px] rounded-[14px] bg-accent px-6 text-[17px] font-extrabold text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              הוסיפו את העסק שלכם
            </Link>
            <Link
              href="/login/"
              className="inline-flex items-center min-h-[52px] rounded-[14px] border border-white/30 px-5 text-base font-semibold text-white hover:bg-white/10 transition-colors"
            >
              כבר רשומים? כניסה
            </Link>
          </div>
        </div>
        <div className="relative min-h-[320px] lg:min-h-[460px]">
          <Image
            src="/images/v2/orchard.jpg"
            alt="חקלאי קוטף דובדבנים בפרדס ברמת הגולן"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
