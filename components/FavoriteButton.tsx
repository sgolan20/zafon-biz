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
      className={`inline-flex items-center gap-2 rounded-lg border-2 px-5 py-3 font-bold transition shadow-sm ${
        active
          ? "bg-amber-400 text-white border-amber-400 hover:bg-amber-500"
          : "bg-white text-amber-600 border-amber-300 hover:bg-amber-50"
      }`}
    >
      <Star className="h-5 w-5" fill={active ? "currentColor" : "none"} />
      {active ? "נשמר במועדפים" : "שמרו למועדפים"}
    </button>
  );
}
