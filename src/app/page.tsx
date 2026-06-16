import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const stats = await prisma.video.aggregate({
    _count: { _all: true }
  });

  return (
    <section className="mx-auto max-w-7xl px-3 sm:px-4 py-16">
      <div className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.2em] text-[#c4ccd6]">
            Plateforme coaching video
          </p>
          <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
            Progresse au ping-pong avec des videos faites par de vrais coachs.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-[#b9c2ce]">
            OnlyPing centralise des sequences techniques vendues par des entraineurs certifies: service,
            topspin, bloc, tactique de match et routines d&apos;entrainement.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/catalogue" className="rounded-full bg-[#2f3742] px-6 py-3 font-semibold text-[#f1f5f9] hover:bg-[#3c4756]">
              Voir le catalogue
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-white/20 px-6 py-3 font-semibold text-[#d4dbe4] hover:bg-white/10"
            >
              Espace entraineur
            </Link>
          </div>
        </div>

        <div className="hero-glow rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-sm uppercase tracking-widest text-[#c4ccd6]">Live stats</p>
          <p className="mt-4 text-5xl font-bold text-[#f3f5f8]">{stats._count._all}</p>
          <p className="mt-1 text-[#b9c2ce]">videos techniques disponibles</p>
          <div className="mt-8 space-y-3 text-sm text-[#ccd4de]">
            <p>Contenu structure en progression logique</p>
            <p>Coachs verifies et profils detailles</p>
            <p>Paiement par video et acces instantane</p>
          </div>
        </div>
      </div>
    </section>
  );
}