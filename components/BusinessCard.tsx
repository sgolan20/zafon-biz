/* eslint-disable @next/next/no-img-element -- R2 photos via /media, already resized on upload */
import Link from "next/link";
import { MapPin, Phone, MessageCircle, Star } from "lucide-react";
import type { BusinessSummary } from "@/lib/types";
import { telLink, whatsappLink } from "@/lib/utils";

interface BusinessCardProps {
  business: BusinessSummary;
  /** When provided, the card renders a star toggle in the top corner. */
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

/** First Hebrew/Latin letter of the name, for the monogram fallback. */
export function initial(name: string): string {
  return name.replace(/[^א-תA-Za-z]/g, "").charAt(0) || "•";
}

/**
 * Branded stand-in when a business has no main photo yet: forest green with
 * the Hermon ridge line and a large faded initial.
 */
export function CoverFallback({ name }: { name: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(135deg,#1f4a37_0%,#10231a_100%)]">
      <span
        aria-hidden="true"
        className="absolute -bottom-6 left-4 select-none text-[120px] font-black leading-none text-white/[0.07]"
      >
        {initial(name)}
      </span>
      <svg
        aria-hidden="true"
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-1/2 w-full"
      >
        <path
          d="M0 95 C60 80 90 88 140 70 S220 40 260 30 L282 18 300 34 C330 50 360 62 400 70"
          fill="none"
          stroke="#e9a93b"
          strokeOpacity="0.55"
          strokeWidth="2"
        />
        <circle cx="282" cy="10" r="6" fill="#e9a93b" fillOpacity="0.7" />
      </svg>
    </div>
  );
}

export function BusinessCard({ business, isFavorite, onToggleFavorite }: BusinessCardProps) {
  const waNumber = business.whatsapp || business.phone;
  const waMessage = `שלום! ראיתי את ${business.name} באתר "תומכים בצפון - קונים נכון" ואשמח ליצור קשר.`;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[20px] border border-[#eae3d5] bg-card shadow-[0_1px_2px_rgba(16,35,26,0.04)] transition-all hover:shadow-[0_16px_40px_rgba(16,35,26,0.12)] hover:-translate-y-0.5">
      {/* Main photo */}
      <div className="relative aspect-[16/10] bg-muted">
        {business.coverUrl ? (
          <img
            src={business.coverUrl}
            alt={`תמונה של ${business.name}`}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <CoverFallback name={business.name} />
        )}

        <span className="absolute top-3 right-3 rounded-lg bg-white/95 px-2.5 py-1 text-[13px] font-semibold text-primary shadow-sm">
          {business.category}
        </span>

        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(business.id);
            }}
            aria-label={
              isFavorite ? `הסר את ${business.name} מהמועדפים` : `הוסף את ${business.name} למועדפים`
            }
            aria-pressed={Boolean(isFavorite)}
            className={`absolute top-3 left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full shadow-md backdrop-blur transition ${
              isFavorite
                ? "bg-accent text-accent-foreground"
                : "bg-white/90 text-foreground hover:bg-white hover:text-[#b9771a]"
            }`}
          >
            <Star className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} />
          </button>
        )}
      </div>

      <div className="relative flex flex-1 flex-col gap-3 px-5 sm:px-6 pb-5 sm:pb-6">
        {/* Logo overlapping the photo */}
        <div className="-mt-9 flex items-end gap-3">
          <span className="relative z-[1] flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={`הלוגו של ${business.name}`}
                loading="lazy"
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-muted text-2xl font-extrabold text-primary">
                {initial(business.name)}
              </span>
            )}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-lg sm:text-[19px] font-extrabold leading-tight line-clamp-2">
            {/* Whole card is clickable via this link's ::before overlay */}
            <Link
              href={`/business/${business.slug}/`}
              className="before:absolute before:inset-0 before:rounded-[20px] hover:text-primary transition-colors"
            >
              {business.name}
            </Link>
          </h3>
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{business.town}</span>
          </span>
        </div>

        <p className="flex-1 text-[15px] leading-relaxed text-[#3e4a43] line-clamp-2">
          {business.shortDescription || business.description}
        </p>

        <div className="relative z-10 flex gap-2 pt-1">
          <a
            href={telLink(business.phone)}
            className="flex flex-1 items-center justify-center gap-2 min-h-11 rounded-xl bg-primary text-[15px] font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Phone className="h-4 w-4" />
            התקשרו
          </a>
          <a
            href={whatsappLink(waNumber, waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 min-h-11 rounded-xl border border-[#cfe6d6] bg-[#eef7f1] text-[15px] font-bold text-[#17603a] hover:bg-[#e2f1e8] transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            וואטסאפ
          </a>
        </div>
      </div>
    </article>
  );
}
