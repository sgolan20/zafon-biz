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

/** First Hebrew/Latin letter of the name, for the monogram tile. */
function initial(name: string): string {
  return name.replace(/[^א-תA-Za-z]/g, "").charAt(0) || "•";
}

export function BusinessCard({ business, isFavorite, onToggleFavorite }: BusinessCardProps) {
  const waNumber = business.whatsapp || business.phone;
  const waMessage = `שלום! ראיתי את ${business.name} באתר "תומכים בצפון - קונים נכון" ואשמח ליצור קשר.`;

  return (
    <article className="group relative flex flex-col gap-3.5 rounded-[20px] border border-[#eae3d5] bg-card p-5 sm:p-6 shadow-[0_1px_2px_rgba(16,35,26,0.04)] transition-all hover:shadow-[0_16px_40px_rgba(16,35,26,0.1)] hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-muted text-xl font-extrabold text-primary"
          >
            {initial(business.name)}
          </span>
          <div className="flex flex-col gap-0.5 min-w-0">
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
        </div>

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
            className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
              isFavorite
                ? "bg-accent-soft border-accent text-[#b9771a]"
                : "bg-white border-[#eae3d5] text-muted-foreground hover:border-accent hover:text-[#b9771a]"
            }`}
          >
            <Star className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} />
          </button>
        )}
      </div>

      <span className="self-start rounded-lg bg-[#f3efe6] px-2.5 py-1 text-[13px] font-semibold text-primary">
        {business.category}
      </span>

      <p className="flex-1 text-[15px] leading-relaxed text-[#3e4a43] line-clamp-3">
        {business.shortDescription || business.description}
      </p>

      <div className="relative z-10 flex gap-2 border-t border-[#f0eadf] pt-3.5">
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
    </article>
  );
}
