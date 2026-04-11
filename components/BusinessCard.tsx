import Link from "next/link";
import { MapPin, Phone, ArrowLeft, Star } from "lucide-react";
import type { BusinessSummary } from "@/lib/types";
import { formatPhone } from "@/lib/utils";

interface BusinessCardProps {
  business: BusinessSummary;
  /** When provided, the card renders a star toggle in the top corner. */
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export function BusinessCard({ business, isFavorite, onToggleFavorite }: BusinessCardProps) {
  return (
    <article className="group relative flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
      {onToggleFavorite && (
        <button
          type="button"
          onClick={(e) => {
            // The card-wide Link uses a `before:absolute before:inset-0`
            // trick to make the whole card clickable — prevent default
            // plus z-10 keeps the star from activating that link.
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(business.id);
          }}
          aria-label={
            isFavorite
              ? `הסר את ${business.name} מהמועדפים`
              : `הוסף את ${business.name} למועדפים`
          }
          aria-pressed={Boolean(isFavorite)}
          className={`absolute top-3 left-3 z-10 inline-flex items-center justify-center h-9 w-9 rounded-full border shadow-sm transition ${
            isFavorite
              ? "bg-amber-50 border-amber-300 text-amber-500 hover:bg-amber-100"
              : "bg-white/90 border-input text-muted-foreground hover:bg-amber-50 hover:text-amber-500 hover:border-amber-300"
          }`}
        >
          <Star
            className="h-5 w-5"
            fill={isFavorite ? "currentColor" : "none"}
            strokeWidth={2}
          />
        </button>
      )}

      <div className="flex items-start justify-between gap-3 mb-3 pl-10">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            <Link href={`/business/${business.slug}/`} className="before:absolute before:inset-0">
              {business.name}
            </Link>
          </h3>
          <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary-soft px-2 py-0.5 rounded-md">
            {business.category}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
        {business.shortDescription || business.description}
      </p>

      <div className="space-y-1.5 text-sm text-muted-foreground border-t pt-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary/70 shrink-0" />
          <span className="truncate">{business.town}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary/70 shrink-0" />
          <span className="truncate" dir="ltr">
            {formatPhone(business.phone)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm font-semibold text-primary relative z-10 pointer-events-none">
        <span>לדף העסק</span>
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
      </div>
    </article>
  );
}
