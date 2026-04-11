"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Fuse from "fuse.js";
import { Search, X, Filter, Loader2, LayoutGrid, Star } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import type { BusinessSummary, Category, Town } from "@/lib/types";
import { BusinessCard } from "./BusinessCard";
import { useFavorites } from "@/lib/favorites";

interface BusinessGridProps {
  /** First N businesses inlined in the home page HTML for fast first paint + SEO. */
  initialBusinesses: BusinessSummary[];
  /** Total number of approved businesses (used for the count label and pagination cap). */
  totalCount: number;
  categories: Category[];
  /** Category name → number of approved businesses in it (computed server-side). */
  categoryCounts: Record<string, number>;
  towns: Town[];
}

/** How many extra businesses to reveal each time the sentinel scrolls into view. */
const PAGE_STEP = 30;

export function BusinessGrid({
  initialBusinesses,
  totalCount,
  categories,
  categoryCounts,
  towns,
}: BusinessGridProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTown, setSelectedTown] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const {
    isFavorite,
    toggle: toggleFavorite,
    count: favoritesCount,
    hydrated: favoritesHydrated,
  } = useFavorites();

  // Full catalog, lazy-loaded from /businesses.json after hydration. Until
  // it arrives we render with the initial 30 the server inlined — so the
  // page is interactive immediately and search starts working in the
  // background once the JSON lands.
  const [allBusinesses, setAllBusinesses] = useState<BusinessSummary[]>(initialBusinesses);
  const [fullLoaded, setFullLoaded] = useState(initialBusinesses.length >= totalCount);
  const [visibleCount, setVisibleCount] = useState(initialBusinesses.length);

  // Fetch the full catalog once on mount. Skip if the initial set already
  // contained everything (small directories).
  useEffect(() => {
    if (fullLoaded) return;
    let cancelled = false;
    fetch("/businesses.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<BusinessSummary[]>;
      })
      .then((data) => {
        if (cancelled) return;
        setAllBusinesses(data);
        setFullLoaded(true);
      })
      .catch((err) => {
        // Non-fatal — search just stays scoped to the initial inline set.
        console.warn("Failed to load /businesses.json:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [fullLoaded]);

  // Build the Fuse index against whatever data is currently loaded.
  const fuse = useMemo(
    () =>
      new Fuse(allBusinesses, {
        keys: ["name", "description", "shortDescription", "category", "town", "tags"],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [allBusinesses],
  );

  const filtered = useMemo(() => {
    let result = allBusinesses;

    if (query.trim()) {
      result = fuse.search(query).map((r) => r.item);
    }

    if (selectedCategory) {
      result = result.filter((b) => b.category === selectedCategory);
    }

    if (selectedTown) {
      result = result.filter((b) => b.town === selectedTown);
    }

    if (favoritesOnly) {
      result = result.filter((b) => isFavorite(b.id));
    }

    return result;
  }, [allBusinesses, fuse, query, selectedCategory, selectedTown, favoritesOnly, isFavorite]);

  const hasFilters = Boolean(query || selectedCategory || selectedTown || favoritesOnly);

  // Infinite scroll — when the sentinel hits the viewport, reveal another
  // PAGE_STEP cards. Disabled while a filter is active (filtered results
  // are shown in full).
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (hasFilters) return;
    if (visibleCount >= allBusinesses.length) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_STEP, allBusinesses.length));
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasFilters, visibleCount, allBusinesses.length]);

  // Lock body scroll + close on Escape while the category modal is open.
  useEffect(() => {
    if (!categoryModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCategoryModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [categoryModalOpen]);

  function selectCategoryFromModal(name: string) {
    setSelectedCategory(name);
    // Clear competing filters so the user sees a clean category view.
    setQuery("");
    setFavoritesOnly(false);
    setCategoryModalOpen(false);
    // Bring the results grid into view so the effect of the click is
    // obvious — especially on mobile where the button and the grid may be
    // separated by a few hundred pixels.
    setTimeout(() => {
      document.getElementById("businesses")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 60);
  }

  function clearFilters() {
    setQuery("");
    setSelectedCategory("");
    setSelectedTown("");
    setFavoritesOnly(false);
  }

  const visible = hasFilters ? filtered : filtered.slice(0, visibleCount);
  const totalForLabel = fullLoaded ? allBusinesses.length : totalCount;

  // Categories that actually have at least one approved business —
  // shown in the modal and (with counts) in the dropdown.
  const categoriesWithBusinesses = categories.filter(
    (c) => (categoryCounts[c.name] ?? 0) > 0,
  );

  return (
    <div>
      {/* Prominent "search by category" CTA + favorites shortcut */}
      <div className="mb-5 flex flex-col sm:flex-row gap-3 sm:items-stretch">
        <button
          type="button"
          onClick={() => setCategoryModalOpen(true)}
          className="group inline-flex items-center justify-center gap-3 rounded-xl bg-primary px-6 py-4 text-base sm:text-lg font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition flex-1 sm:flex-initial"
        >
          <LayoutGrid className="h-5 w-5 sm:h-6 sm:w-6" />
          <span>חפשו לפי קטגוריה</span>
        </button>

        {favoritesHydrated && favoritesCount > 0 && (
          <button
            type="button"
            onClick={() => setFavoritesOnly((v) => !v)}
            aria-pressed={favoritesOnly}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-4 text-base font-bold transition border-2 ${
              favoritesOnly
                ? "bg-amber-400 text-white border-amber-400 hover:bg-amber-500 shadow-md"
                : "bg-white text-amber-600 border-amber-300 hover:bg-amber-50"
            }`}
          >
            <Star className="h-5 w-5" fill="currentColor" />
            <span>
              {favoritesOnly ? "מציג מועדפים" : "המועדפים שלי"} ({favoritesCount})
            </span>
          </button>
        )}
      </div>

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
            {categoriesWithBusinesses.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name} ({categoryCounts[cat.name] ?? 0})
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
          {hasFilters
            ? `נמצאו ${filtered.length} מתוך ${totalForLabel} עסקים`
            : `${totalForLabel} עסקים מהצפון`}
          {selectedCategory && (
            <>
              {" "}• קטגוריה: <span className="font-semibold text-foreground">{selectedCategory}</span>
            </>
          )}
          {hasFilters && !fullLoaded && (
            <span className="inline-flex items-center gap-1.5 mr-2 text-muted-foreground/80">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              טוען את שאר העסקים...
            </span>
          )}
        </p>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-12 text-center">
          <p className="text-lg font-medium text-foreground mb-2">
            {favoritesOnly && favoritesCount === 0
              ? "עדיין לא שמרתם עסקים למועדפים"
              : "לא נמצאו עסקים"}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {favoritesOnly && favoritesCount === 0
              ? "לחצו על הכוכב בכל כרטיס כדי לשמור אותו כאן"
              : "נסו לשנות את החיפוש או לנקות את הסינון"}
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
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                isFavorite={isFavorite(business.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>

          {/* Infinite-scroll sentinel — only when not filtering and more to load */}
          {!hasFilters && visibleCount < allBusinesses.length && (
            <div
              ref={sentinelRef}
              className="flex items-center justify-center py-10 text-muted-foreground"
            >
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
        </>
      )}

      {/* Category picker modal */}
      {categoryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-modal-title"
          onClick={() => setCategoryModalOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl my-auto animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 border-b">
              <div className="flex-1 min-w-0">
                <h2
                  id="category-modal-title"
                  className="text-xl sm:text-2xl font-bold text-foreground"
                >
                  חיפוש לפי קטגוריה
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  בחרו קטגוריה כדי לראות את העסקים בתחום
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-input text-muted-foreground hover:bg-muted transition shrink-0"
                aria-label="סגור"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Grid of categories */}
            <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-6">
              {categoriesWithBusinesses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  עדיין אין עסקים באף קטגוריה.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {categoriesWithBusinesses.map((cat) => {
                    const count = categoryCounts[cat.name] ?? 0;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => selectCategoryFromModal(cat.name)}
                        className="group relative flex flex-col items-center justify-start gap-2 rounded-xl border border-input bg-white p-4 text-center hover:border-primary hover:bg-primary-soft hover:shadow-md transition"
                      >
                        <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary-soft text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                          <DynamicIcon
                            name={cat.icon as IconName}
                            className="h-6 w-6"
                          />
                        </span>
                        <span className="text-sm font-bold text-foreground leading-tight line-clamp-2 min-h-[2.5rem]">
                          {cat.name}
                        </span>
                        <span className="inline-flex items-center justify-center min-w-[1.75rem] px-2 h-5 rounded-full bg-muted text-xs font-semibold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
