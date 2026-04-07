import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, ArrowLeft } from "lucide-react";

export function Hero({ businessCount }: { businessCount: number }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-bl from-primary-soft via-background to-accent-soft border-b">
      <div className="container-page py-12 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Text side */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border shadow-sm text-sm font-medium text-primary mb-5">
              <Heart className="h-4 w-4" fill="currentColor" />
              <span>תמיכה בעסקי הצפון שנפגעו מהמלחמה</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              תומכים בעורף,
              <br />
              <span className="text-primary">קונים נכון</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl">
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

          {/* Image side */}
          <div className="relative">
            <div className="relative aspect-[3/2] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5">
              <Image
                src="/images/hero-bakery.jpg"
                alt="זוג בעלי מאפיה משפחתית בצפון מקשטים עוגות יחד"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            {/* Decorative gradient blobs */}
            <div
              aria-hidden="true"
              className="absolute -top-6 -right-6 w-32 h-32 bg-accent/20 rounded-full blur-3xl -z-10"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-8 -left-8 w-40 h-40 bg-primary/20 rounded-full blur-3xl -z-10"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
