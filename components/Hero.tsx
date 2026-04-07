import Link from "next/link";
import { Heart, MapPin, ArrowLeft } from "lucide-react";

export function Hero({ businessCount }: { businessCount: number }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-bl from-primary-soft via-background to-accent-soft border-b">
      <div className="container-page py-12 sm:py-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border shadow-sm text-sm font-medium text-primary mb-5">
            <Heart className="h-4 w-4" fill="currentColor" />
            <span>תמיכה בעסקי הצפון שנפגעו מהמלחמה</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
            תומכים בעורף,
            <br />
            <span className="text-primary">קונים נכון</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl">
            אינדקס עסקים מקריית שמונה, אצבע הגליל ויישובי קו העימות. הזמינו מוצרים ושירותים
            מבעלי המקצוע מהצפון - ותמכו בכלכלה המקומית.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#businesses"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              גלו עסקים מהצפון
              <ArrowLeft className="h-4 w-4" />
            </a>
            <Link
              href="/register/"
              className="inline-flex items-center gap-2 rounded-lg bg-white border-2 border-primary px-6 py-3 text-base font-bold text-primary hover:bg-primary-soft transition-colors"
            >
              הוסיפו את העסק שלכם
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{businessCount} עסקים פעילים</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="h-4 w-4" />
              <span>פרויקט קהילתי ללא מטרות רווח</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
