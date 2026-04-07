"use client";

import { useState, useMemo } from "react";
import Fuse from "fuse.js";
import { Search, X, Filter } from "lucide-react";
import type { Business, Category, Town } from "@/lib/types";
import { BusinessCard } from "./BusinessCard";

interface BusinessGridProps {
  businesses: Business[];
  categories: Category[];
  towns: Town[];
}

export function BusinessGrid({ businesses, categories, towns }: BusinessGridProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTown, setSelectedTown] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Build fuse index once per business list change.
  const fuse = useMemo(
    () =>
      new Fuse(businesses, {
        keys: ["name", "description", "shortDescription", "category", "town", "tags"],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [businesses],
  );

  const filtered = useMemo(() => {
    let result = businesses;

    if (query.trim()) {
      result = fuse.search(query).map((r) => r.item);
    }

    if (selectedCategory) {
      result = result.filter((b) => b.category === selectedCategory);
    }

    if (selectedTown) {
      result = result.filter((b) => b.town === selectedTown);
    }

    return result;
  }, [businesses, fuse, query, selectedCategory, selectedTown]);

  const hasFilters = Boolean(query || selectedCategory || selectedTown);

  function clearFilters() {
    setQuery("");
    setSelectedCategory("");
    setSelectedTown("");
  }

  return (
    <div>
      {/* Search bar */}
      <div className="sticky top-16 z-30 -mx-4 sm:mx-0 mb-6 bg-background/95 backdrop-blur px-4 sm:px-0 py-4 border-b sm:border-0">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חפשו לפי שם עסק, תיאור, או תחום..."
              className="w-full h-12 pr-11 pl-4 rounded-lg border border-input bg-white text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="md:hidden inline-flex items-center justify-center h-12 w-12 rounded-lg border border-input bg-white text-foreground hover:bg-muted transition"
            aria-label="הצג סינונים"
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>

        {/* Filters */}
        <div
          className={`${showFilters ? "grid" : "hidden md:grid"} mt-3 gap-2 md:grid-cols-[1fr_1fr_auto]`}
        >
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-11 px-3 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          >
            <option value="">כל הקטגוריות</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={selectedTown}
            onChange={(e) => setSelectedTown(e.target.value)}
            className="h-11 px-3 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          >
            <option value="">כל היישובים</option>
            {towns.map((town) => (
              <option key={town.id} value={town.name}>
                {town.name}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition"
            >
              <X className="h-4 w-4" />
              נקה
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {filtered.length === businesses.length
            ? `${businesses.length} עסקים מהצפון`
            : `נמצאו ${filtered.length} מתוך ${businesses.length} עסקים`}
        </p>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-12 text-center">
          <p className="text-lg font-medium text-foreground mb-2">לא נמצאו עסקים</p>
          <p className="text-sm text-muted-foreground mb-4">
            נסו לשנות את החיפוש או לנקות את הסינון
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-primary font-medium hover:underline"
            >
              נקה סינון
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      )}
    </div>
  );
}
