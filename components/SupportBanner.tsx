import Link from "next/link";
import { Heart, ArrowLeft } from "lucide-react";

/**
 * Compact donation strip shown on the home page between the showcase and
 * the business grid. Soft / non-pushy by design — visitors see businesses
 * first; this is a gentle ask, not an interruption.
 */
export function SupportBanner() {
  return (
    <section className="container-page py-6">
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-bl from-primary-soft via-white to-accent-soft px-5 sm:px-8 py-5 sm:py-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-right">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-primary/20">
            <Heart className="h-6 w-6 text-primary" fill="currentColor" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground leading-snug">
              עוזרים לנו להחזיק את המיזם באוויר?
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              האתר קהילתי וללא רווח. כל תרומה — קטנה כגדולה — עוזרת לנו להמשיך.
            </p>
          </div>
          <Link
            href="/support/"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap"
          >
            <Heart className="h-4 w-4" fill="currentColor" />
            תמיכה במיזם
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
