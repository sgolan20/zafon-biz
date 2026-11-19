import Link from "next/link";
import { Heart, ArrowLeft } from "lucide-react";

/**
 * Compact donation strip on the home page. Soft by design — visitors see
 * businesses first; this is a gentle ask, not an interruption.
 */
export function SupportBanner() {
  return (
    <section className="container-page py-6">
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 rounded-2xl bg-muted px-5 sm:px-8 py-5 text-center sm:text-right">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white">
          <Heart className="h-6 w-6 text-primary" fill="currentColor" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold leading-snug">עוזרים לנו להחזיק את המיזם באוויר?</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            האתר קהילתי וללא רווח. כל תרומה, קטנה כגדולה, עוזרת לנו להמשיך.
          </p>
        </div>
        <Link
          href="/support/"
          className="inline-flex items-center gap-1.5 min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          תמיכה במיזם
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
