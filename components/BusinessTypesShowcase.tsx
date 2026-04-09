import Image from "next/image";

type Scene = {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
};

const SCENES: Scene[] = [
  {
    src: "/images/scene-cheese.webp",
    alt: "ידיים מבוגרות חותכות גלגל גבינה במרתף יישון בגליל",
    title: "גבנים ומחלבות",
    subtitle: "גבינות עיזים וכבשים מהגליל",
  },
  {
    src: "/images/scene-winemaker.webp",
    alt: "ידיים פותחות בקבוק יין אדום במרתף יין גלילי בין חביות עץ",
    title: "יקבים ויינות",
    subtitle: "יין מקומי מכרמי הצפון",
  },
  {
    src: "/images/scene-potter.webp",
    alt: "אמנית קרמיקה ישראלית יוצרת כד ליד אובניים בצפון",
    title: "אמנים ויוצרים",
    subtitle: "קרמיקה, אומנות ועיצוב",
  },
  {
    src: "/images/scene-carpenter.webp",
    alt: "נגר ישראלי עובד בבית מלאכת עץ בצפון",
    title: "נגרים ובעלי מלאכה",
    subtitle: "ריהוט בעבודת יד מהגליל",
  },
  {
    src: "/images/scene-tailor.webp",
    alt: "ידיים זקנות תופרות במכונת תפירה ישנה בחנות חייט בצפון",
    title: "חייטים ותפירה",
    subtitle: "תיקונים ועבודות בהזמנה",
  },
];

export function BusinessTypesShowcase() {
  return (
    <section className="bg-muted/40 border-y">
      <div className="container-page py-14 sm:py-20">
        <div className="max-w-2xl mb-10 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            עסקים אמיתיים. אנשים אמיתיים.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            מאחורי כל עסק באינדקס עומדים תושבי הצפון - אנשים שבחרו לבנות את הפרנסה שלהם
            כאן, ולא לוותר. הזמנה מהם היא לא רק קנייה, היא מעשה תמיכה.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 sm:gap-6">
          {SCENES.map((scene) => (
            <article
              key={scene.src}
              className="group relative overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5 bg-white"
            >
              <div className="relative aspect-[3/2]">
                <Image
                  src={scene.src}
                  alt={scene.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent"
                />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <h3 className="text-base lg:text-[15px] xl:text-base font-bold leading-tight">
                    {scene.title}
                  </h3>
                  <p className="text-xs lg:text-[11px] xl:text-xs text-white/85 mt-0.5 leading-snug">
                    {scene.subtitle}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
