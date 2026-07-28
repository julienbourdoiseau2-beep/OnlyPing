"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type Option = { value: string; label: string };

type CatalogueFiltersProps = {
  coaches: Option[];
  categories: Option[];
  levels: Option[];
  initialQuery: string;
  initialCoachId: string;
  initialCategory: string;
  initialLevel: string;
};

const SEARCH_DEBOUNCE_MS = 400;

export function CatalogueFilters({
  coaches,
  categories,
  levels,
  initialQuery,
  initialCoachId,
  initialCategory,
  initialLevel
}: CatalogueFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);
  const [coachId, setCoachId] = useState(initialCoachId);
  const [category, setCategory] = useState(initialCategory);
  const [level, setLevel] = useState(initialLevel);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  function navigate(next: { query: string; coachId: string; category: string; level: string }) {
    const params = new URLSearchParams();
    if (next.query.trim()) params.set("q", next.query.trim());
    if (next.coachId) params.set("coachId", next.coachId);
    if (next.category) params.set("category", next.category);
    if (next.level) params.set("level", next.level);

    const queryString = params.toString();
    startTransition(() => {
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    });
  }

  function onQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      navigate({ query: value, coachId, category, level });
    }, SEARCH_DEBOUNCE_MS);
  }

  function onCoachChange(value: string) {
    setCoachId(value);
    navigate({ query, coachId: value, category, level });
  }

  function onCategoryChange(value: string) {
    setCategory(value);
    navigate({ query, coachId, category: value, level });
  }

  function onLevelChange(value: string) {
    setLevel(value);
    navigate({ query, coachId, category, level: value });
  }

  function reset() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setQuery("");
    setCoachId("");
    setCategory("");
    setLevel("");
    startTransition(() => {
      router.push(pathname);
    });
  }

  const hasActiveFilters = Boolean(query || coachId || category || level);

  return (
    <div className="mt-6 grid gap-3 rounded-md border border-line bg-surface p-4 shadow-resting md:grid-cols-6 md:items-end">
      <label className="text-sm text-ink-muted md:col-span-2">
        <span className="flex items-center gap-2">
          Rechercher
          {isPending ? (
            <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          ) : null}
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Titre de la video..."
          className="mt-1 w-full rounded-sm border border-line bg-surface-alt px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        />
      </label>

      <label className="text-sm text-ink-muted">
        Entraineur
        <select
          value={coachId}
          onChange={(event) => onCoachChange(event.target.value)}
          className="mt-1 w-full rounded-sm border border-line bg-surface-alt px-3 py-2 text-sm text-ink"
        >
          <option value="">Tous les entraineurs</option>
          {coaches.map((coach) => (
            <option key={coach.value} value={coach.value}>
              {coach.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm text-ink-muted">
        Categorie
        <select
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="mt-1 w-full rounded-sm border border-line bg-surface-alt px-3 py-2 text-sm text-ink"
        >
          {categories.map((item) => (
            <option key={item.label} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm text-ink-muted">
        Niveau
        <select
          value={level}
          onChange={(event) => onLevelChange(event.target.value)}
          className="mt-1 w-full rounded-sm border border-line bg-surface-alt px-3 py-2 text-sm text-ink"
        >
          {levels.map((item) => (
            <option key={item.label} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={reset}
        disabled={!hasActiveFilters}
        className="inline-flex items-center justify-center rounded-sm border border-line bg-surface-alt px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-line disabled:cursor-not-allowed disabled:opacity-50"
      >
        Reinitialiser
      </button>
    </div>
  );
}
