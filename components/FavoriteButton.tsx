"use client";

import { Star } from "lucide-react";
import { useFavorites } from "@/lib/favorites";

interface FavoriteButtonProps {
  businessId: string;
  businessName: string;
}

/**
 * Standalone star toggle used on the business detail page. Within the
 * listing grid, BusinessCard renders its own star — this component is
 * for places that don't go through BusinessGrid.
 *
 * Intentionally styled to stand next to the phone/WhatsApp CTAs on the
 * detail page without dominating them.
 */
export function FavoriteButton({ businessId, businessName }: FavoriteButtonProps) {
  const { isFavorite, toggle, hydrated } = useFavorites();
  const active = isFavorite(businessId);

  return (
    <button
      type="button"
      onClick={() => toggle(businessId)}
      aria-label={
        active
          ? `הסר את ${businessName} מהמועדפים`
          : `הוסף את ${businessName} למועדפים`
      }
      aria-pressed={active}
      // Hide until hydrated so users who already favorited don't see the
      // button flash from "not favorited" → "favorited" after hydration.
      style={{ visibility: hydrated ? "visible" : "hidden" }}
      className={`inline-flex items-center gap-2 min-h-[54px] rounded-[14px] border px-5 font-bold transition ${
        active
          ? "bg-accent-soft text-[#8a5a10] border-accent"
          : "bg-white text-foreground border-border hover:border-accent"
      }`}
    >
      <Star className="h-5 w-5" fill={active ? "currentColor" : "none"} />
      {active ? "נשמר במועדפים" : "שמרו למועדפים"}
    </button>
  );
}
