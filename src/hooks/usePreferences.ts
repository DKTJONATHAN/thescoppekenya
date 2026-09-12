import { useCallback, useEffect, useState } from "react";

const KEY = "zn-prefs-v1";

export type ReaderPrefs = {
  categories: Record<string, number>;
  lastSlug?: string;
};

function load(): ReaderPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { categories: {} };
    return JSON.parse(raw) as ReaderPrefs;
  } catch {
    return { categories: {} };
  }
}

function save(prefs: ReaderPrefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

/** Track category affinity for a lightweight "For You" rail. */
export function trackCategoryView(category: string, slug?: string) {
  const prefs = load();
  const cat = (category || "News").trim();
  prefs.categories[cat] = (prefs.categories[cat] || 0) + 1;
  if (slug) prefs.lastSlug = slug;
  save(prefs);
}

export function topCategories(limit = 3): string[] {
  const prefs = load();
  return Object.entries(prefs.categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([c]) => c);
}

export function usePreferences() {
  const [prefs, setPrefs] = useState<ReaderPrefs>({ categories: {} });

  useEffect(() => {
    setPrefs(load());
  }, []);

  const track = useCallback((category: string, slug?: string) => {
    trackCategoryView(category, slug);
    setPrefs(load());
  }, []);

  const tops = Object.entries(prefs.categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c]) => c);

  return { prefs, track, topCategories: tops };
}
