import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const stats = await prisma.video.aggregate({
    _count: { _all: true }
  });

  const highlights = [
    "Contenu structure en progression logique",
    "Coachs verifies et profils detailles",
    "Paiement par video et acces instantane"
  ];

  return (
    <section className="mx-auto max-w-7xl px-3 sm:px-4 py-16">
      <div className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="inline-flex rounded-full border border-line bg-surface-alt px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-ink-muted">
            Plateforme coaching video
          </p>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-tight text-ink md:text-6xl">
            Progresse au ping-pong avec des videos faites par de vrais coachs.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-muted">
            OnlyPing centralise des sequences techniques vendues par des entraineurs certifies: service,
            topspin, bloc, tactique de match et routines d&apos;entrainement.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/catalogue"
              className="rounded-full bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-deep"
            >
              Voir le catalogue
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-line px-6 py-3 font-semibold text-ink transition-colors hover:bg-surface-alt"
            >
              Espace entraineur
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-surface p-8 shadow-resting">
          <p className="text-sm uppercase tracking-widest text-ink-muted">Live stats</p>
          <p className="mt-4 font-display text-5xl font-semibold text-ink">{stats._count._all}</p>
          <p className="mt-1 text-ink-muted">videos techniques disponibles</p>
          <div className="mt-8 space-y-3 text-sm text-ink-muted">
            {highlights.map((item) => (
              <p key={item} className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-bg text-success">
                  <svg viewBox="0 0 20 20" width="12" height="12" fill="none" aria-hidden="true">
                    <path d="M4 10.5l3.5 3.5L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {item}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
