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
      <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 md:grid-cols-[1fr_auto]">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher par titre ou coach"
          className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-[#f8fafc] outline-none focus:border-[#48cae4]"
        />

        <select
          value={level}
          onChange={(event) => setLevel(event.target.value)}
          className="rounded-lg border border-white/20 bg-[#0f1724] px-3 py-2 text-sm text-[#f8fafc] outline-none focus:border-[#48cae4]"
        >
          {levels.map((levelOption) => (
            <option key={levelOption} value={levelOption}>
              {levelOption === "TOUS" ? "Tous les niveaux" : levelOption}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-3 text-sm text-[#cbd5e1]">{filtered.length} video(s) trouvee(s)</p>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((purchase) => (
          <article key={purchase.id} className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <p className="text-xs uppercase tracking-widest text-[#90e0ef]">{purchase.video.level}</p>
            <h2 className="mt-2 text-lg font-semibold">{purchase.video.title}</h2>
            <p className="mt-2 text-sm text-[#cbd5e1]">Coach: {purchase.video.coachName}</p>
            <p className="text-sm text-[#cbd5e1]">Duree: {purchase.video.durationMin} min</p>
            <p className="text-sm text-[#cbd5e1]">Achat: {new Date(purchase.createdAt).toLocaleDateString("fr-FR")}</p>

            <div className="mt-4 flex gap-2">
              <Link
                href={`/videos/${purchase.video.id}`}
                className="rounded-full bg-[#00b4d8] px-3 py-1 text-sm font-medium text-[#04111d] hover:bg-[#48cae4]"
              >
                Ouvrir
              </Link>
              <a
                href={`/api/videos/${purchase.video.id}/stream`}
                className="rounded-full border border-[#90e0ef]/40 px-3 py-1 text-sm text-[#90e0ef] hover:bg-[#90e0ef]/10"
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