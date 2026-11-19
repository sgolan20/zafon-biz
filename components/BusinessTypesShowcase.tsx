import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type Face = { category: string; title: string; src: string; alt: string };

/** One photo per category — a mix of town, field and workshop businesses. */
const FACES: Face[] = [
  { category: "מסעדנות וקייטרינג", title: "מסעדות וקייטרינג", src: "/images/v2/restaurant.jpg", alt: "שף מגיש מנה במסעדה מודרנית" },
  { category: "חקלאות ומזון מקומי", title: "חקלאות ומזון מקומי", src: "/images/v2/orchard.jpg", alt: "חקלאי קוטף דובדבנים בפרדס ברמת הגולן" },
  { category: "תיירות ואירוח", title: "תיירות ואירוח", src: "/images/v2/jeep.jpg", alt: "מדריך טיולים ליד ג׳יפ מול עמק החולה" },
  { category: "יופי וטיפוח", title: "יופי וטיפוח", src: "/images/v2/salon.jpg", alt: "ספרית מעצבת שיער במספרה שכונתית" },
  { category: "בנייה ושיפוצים", title: "בנייה ושיפוצים", src: "/images/v2/contractor.jpg", alt: "קבלן שיפוצים מודד קיר בדירה חדשה" },
  { category: "ספורט ופנאי", title: "ספורט ופנאי", src: "/images/v2/yoga.jpg", alt: "שיעור יוגה על דק עץ בין העצים" },
  { category: "אומנות ועבודת יד", title: "אומנות ועבודת יד", src: "/images/v2/potter.jpg", alt: "קדר יוצר כד על אובניים" },
  { category: "מתנות ומזכרות", title: "מתנות ומזכרות", src: "/images/v2/cafe.jpg", alt: "בעלת חנות מתנות מאחורי הדלפק" },
];

/**
 * "The faces of the north" — eight category tiles with photos. Each links to
 * the directory pre-filtered to that category.
 */
export function BusinessTypesShowcase({
  categoryCounts,
  categoryTotal,
}: {
  categoryCounts: Record<string, number>;
  categoryTotal: number;
}) {
  return (
    <section id="faces" className="container-page pt-24 sm:pt-28 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-5 mb-9">
        <div className="flex flex-col gap-2.5 max-w-[640px]">
          <span className="eyebrow">הפנים של הצפון</span>
          <h2 className="text-3xl sm:text-[44px] leading-[1.1] font-extrabold tracking-tight">
            מהפרדס ועד המספרה בשכונה
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            עסקים קטנים ומשפחתיים שממשיכים לעבוד ולשרת את האזור, גם אחרי תקופה לא פשוטה. בחרו
            תחום ומצאו את מי שעושה את זה הכי טוב, קרוב אליכם.
          </p>
        </div>
        <Link
          href="/#businesses"
          className="inline-flex items-center gap-2 min-h-11 rounded-xl border border-input px-4 font-bold hover:bg-white transition-colors"
        >
          כל {categoryTotal} התחומים
          <ChevronLeft className="h-[18px] w-[18px]" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {FACES.map((f) => {
          const count = categoryCounts[f.category] ?? 0;
          return (
            <Link
              key={f.category}
              href={`/?cat=${encodeURIComponent(f.category)}#businesses`}
              className="group relative block aspect-[4/5] overflow-hidden rounded-2xl sm:rounded-[20px] bg-primary"
            >
              <Image
                src={f.src}
                alt={f.alt}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[rgba(10,24,17,0.88)] via-[rgba(10,24,17,0.15)] to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex flex-col gap-0.5">
                <span className="text-base sm:text-[21px] font-extrabold text-white leading-tight">{f.title}</span>
                <span className="text-xs sm:text-sm text-[#e8e2d4]">
                  {count === 1 ? "עסק אחד" : `${count} עסקים`}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
