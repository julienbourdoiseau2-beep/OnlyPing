"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type PurchaseItem = {
  id: string;
  createdAt: string;
  video: {
    id: string;
    title: string;
    level: string;
    durationMin: number;
    coachName: string;
  };
};

type PurchasesFilterListProps = {
  purchases: PurchaseItem[];
};

export function PurchasesFilterList({ purchases }: PurchasesFilterListProps) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("TOUS");

  const levels = useMemo(() => {
    const unique = Array.from(new Set(purchases.map((purchase) => purchase.video.level))).sort();
    return ["TOUS", ...unique];
  }, [purchases]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    return purchases.filter((purchase) => {
      const byLevel = level === "TOUS" || purchase.video.level === level;
      const bySearch =
        !search ||
        purchase.video.title.toLowerCase().includes(search) ||
        purchase.video.coachName.toLowerCase().includes(search);

      return byLevel && bySearch;
    });
  }, [purchases, query, level]);

  return (
    <div>
      <div className="mt-6 grid gap-3 rounded-md border border-line bg-surface p-4 shadow-resting md:grid-cols-[1fr_auto]">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher par titre ou coach"
          className="rounded-sm border border-line bg-surface-alt px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        />

        <select
          value={level}
          onChange={(event) => setLevel(event.target.value)}
          className="rounded-sm border border-line bg-surface-alt px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        >
          {levels.map((levelOption) => (
            <option key={levelOption} value={levelOption}>
              {levelOption === "TOUS" ? "Tous les niveaux" : levelOption}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-3 text-sm text-ink-muted">{filtered.length} video(s) trouvee(s)</p>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((purchase) => (
          <article key={purchase.id} className="rounded-md border border-line bg-surface p-5 shadow-resting">
            <p className="text-xs uppercase tracking-widest text-ink-muted">{purchase.video.level}</p>
            <h2 className="mt-2 text-lg font-semibold text-ink">{purchase.video.title}</h2>
            <p className="mt-2 text-sm text-ink-muted">Coach: {purchase.video.coachName}</p>
            <p className="text-sm text-ink-muted">Duree: {purchase.video.durationMin} min</p>
            <p className="text-sm text-ink-muted">Achat: {new Date(purchase.createdAt).toLocaleDateString("fr-FR")}</p>

            <div className="mt-4 flex gap-2">
              <Link
                href={`/videos/${purchase.video.id}`}
                className="rounded-full bg-accent px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-accent-deep"
              >
                Ouvrir
              </Link>
              <a
                href={`/api/videos/${purchase.video.id}/stream`}
                className="rounded-full border border-line px-3 py-1 text-sm text-ink transition-colors hover:bg-surface-alt"
              >
                Lecture directe
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}