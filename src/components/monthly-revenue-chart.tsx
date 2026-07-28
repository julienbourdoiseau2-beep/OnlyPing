"use client";

import { useState } from "react";

type MonthlyPoint = {
  label: string;
  grossCents: number;
  sales: number;
};

type MonthlyRevenueChartProps = {
  title: string;
  data: MonthlyPoint[];
};

function niceMax(value: number) {
  if (value <= 0) {
    return 100;
  }
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export function MonthlyRevenueChart({ title, data }: MonthlyRevenueChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return null;
  }

  const maxCents = niceMax(Math.max(...data.map((d) => d.grossCents)));
  const chartHeight = 160;

  return (
    <div className="rounded-md border border-line bg-surface p-5 shadow-resting">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-0.5 text-xs text-ink-muted">CA brut par mois (EUR)</p>

      <div className="relative mt-6" style={{ height: chartHeight }}>
        <div className="absolute inset-x-0 top-0 border-t border-line" />
        <div className="absolute inset-x-0 border-t border-line" style={{ top: chartHeight / 2 }} />
        <div className="absolute inset-x-0 bottom-0 border-t border-line" />

        <span className="absolute -top-2 left-0 -translate-y-full text-[10px] text-ink-faint">
          {(maxCents / 100).toFixed(0)} €
        </span>
        <span
          className="absolute left-0 -translate-y-1/2 text-[10px] text-ink-faint"
          style={{ top: chartHeight / 2 }}
        >
          {(maxCents / 200).toFixed(0)} €
        </span>

        <div className="flex h-full items-end gap-0.5 pl-0">
          {data.map((point, index) => {
            const heightPx = Math.max(2, (point.grossCents / maxCents) * chartHeight);
            const isActive = activeIndex === index;
            const isLast = index === data.length - 1;

            return (
              <div key={point.label} className="group relative flex flex-1 flex-col items-center justify-end">
                {isActive ? (
                  <div className="absolute bottom-full z-10 mb-2 w-max max-w-[160px] rounded-sm border border-line bg-surface-alt px-2 py-1 text-center text-xs shadow-raised">
                    <p className="font-semibold text-ink">{(point.grossCents / 100).toFixed(2)} EUR</p>
                    <p className="text-ink-muted">
                      {point.label} · {point.sales} vente{point.sales > 1 ? "s" : ""}
                    </p>
                  </div>
                ) : null}

                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onFocus={() => setActiveIndex(index)}
                  onBlur={() => setActiveIndex(null)}
                  className={`w-full max-w-6 rounded-t-sm transition-colors ${
                    isActive ? "bg-accent-deep" : "bg-accent"
                  }`}
                  style={{ height: heightPx }}
                  aria-label={`${point.label} : ${(point.grossCents / 100).toFixed(2)} EUR, ${point.sales} vente(s)`}
                />

                {isLast ? (
                  <span className="absolute -top-5 text-[10px] font-medium text-ink">
                    {(point.grossCents / 100).toFixed(0)} €
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex gap-0.5 pl-0 text-center text-[10px] text-ink-muted">
        {data.map((point) => (
          <span key={point.label} className="flex-1 truncate">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}
