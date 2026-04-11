"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Favorites (starred businesses) are stored in localStorage so they survive
 * page navigations and return visits on the same device, with no login.
 *
 * The hook is shared by BusinessGrid (which uses the set for the
 * "favorites only" filter) and any per-business star button (BusinessCard,
 * FavoriteButton on the detail page). Mutations fire a custom
 * `zafon-biz:favorites-changed` event so every mounted instance stays in
 * sync within the same tab — the native `storage` event only fires across
 * tabs, not same-tab. We also listen to `storage` so multi-tab sessions
 * stay consistent.
 *
 * Implementation uses `useSyncExternalStore` — the React-sanctioned API
 * for binding component state to something outside React (here:
 * localStorage + a DOM event). It handles SSR and hydration correctly:
 * during SSR and the initial client render it uses `getServerSnapshot`
 * (an empty set), then swaps in the real snapshot after hydration.
 */

const STORAGE_KEY = "zafon-biz:favorites";
const CHANGE_EVENT = "zafon-biz:favorites-changed";

// Empty snapshot shared by the server render and by failure cases, so
// `useSyncExternalStore`'s reference check never fires a false positive.
const EMPTY: ReadonlySet<string> = new Set();

// Snapshot cache: useSyncExternalStore requires `getSnapshot` to return
// the same reference for unchanged data, otherwise React tears. We cache
// the parsed Set keyed by the raw storage string.
let cachedRaw: string | null = null;
let cachedSet: ReadonlySet<string> = EMPTY;

function getSnapshot(): ReadonlySet<string> {
  if (typeof window === "undefined") return EMPTY;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cachedRaw) return cachedSet;
  cachedRaw = raw;
  if (!raw) {
    cachedSet = EMPTY;
    return cachedSet;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cachedSet = EMPTY;
    } else {
      cachedSet = new Set(parsed.filter((v): v is string => typeof v === "string"));
    }
  } catch {
    cachedSet = EMPTY;
  }
  return cachedSet;
}

function getServerSnapshot(): ReadonlySet<string> {
  return EMPTY;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function writeFavorites(set: ReadonlySet<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // Quota exceeded or storage disabled (Safari private mode etc.) —
    // nothing sensible to do, silently drop.
  }
  // Invalidate the cache so the next getSnapshot rereads. Then notify
  // all subscribers so same-tab listeners update.
  cachedRaw = null;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// Separate mount-detection hook so UI that wants to avoid the SSR→client
// "flash of unfavorited" (e.g. the detail-page button) can hide itself
// until hydration lands. Uses useSyncExternalStore so there's no
// setState-in-effect.
const noopSubscribe = () => () => {};
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useHasMounted();

  const isFavorite = useCallback((id: string) => ids.has(id), [ids]);

  const toggle = useCallback((id: string) => {
    const current = getSnapshot();
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    writeFavorites(next);
  }, []);

  return { ids, isFavorite, toggle, hydrated, count: ids.size };
}
