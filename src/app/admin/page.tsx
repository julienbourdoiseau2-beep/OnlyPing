import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminOverviewPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return (
      <section className="mx-auto max-w-5xl px-3 sm:px-4 py-12">
        <h1 className="text-4xl font-bold">Administration</h1>
        <p className="mt-2 text-ink-muted">Acces reserve aux administrateurs.</p>
      </section>
    );
  }

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [pendingCoachRequests, activeDisputes, totalUsers, totalCoaches, monthRevenue] = await Promise.all([
    prisma.coachRequest.count({ where: { status: "PENDING" } }),
    prisma.purchase.count({ where: { disputedAt: { not: null }, refundedAt: null } }),
    prisma.user.count(),
    prisma.user.count({ where: { role: "COACH" } }),
    prisma.purchase.aggregate({
      where: { createdAt: { gte: monthStart }, refundedAt: null, disputedAt: null },
      _sum: { amount: true },
      _count: { _all: true }
    })
  ]);

  const monthRevenueEur = ((monthRevenue._sum.amount ?? 0) / 100).toFixed(2);

  const cards = [
    {
      href: "/admin/coach-requests?status=PENDING",
      label: "Demandes coach en attente",
      value: pendingCoachRequests,
      tone: pendingCoachRequests > 0 ? "accent" : "neutral"
    },
    {
      href: "/admin/achats",
      label: "Litiges en cours",
      value: activeDisputes,
      tone: activeDisputes > 0 ? "danger" : "neutral"
    },
    {
      href: "/admin/achats",
      label: "Achats ce mois-ci",
      value: monthRevenue._count._all,
      tone: "neutral"
    },
    {
      href: "/admin/achats",
      label: "CA du mois (net remb./litiges)",
      value: `${monthRevenueEur} EUR`,
      tone: "neutral"
    },
    {
      href: "/admin/utilisateurs",
      label: "Utilisateurs",
      value: totalUsers,
      tone: "neutral"
    },
    {
      href: "/admin/utilisateurs",
      label: "Coachs actifs",
      value: totalCoaches,
      tone: "neutral"
    }
  ] as const;

  const toneClass: Record<string, string> = {
    accent: "text-accent",
    danger: "text-danger",
    neutral: "text-ink"
  };

  return (
    <section className="mx-auto max-w-6xl px-3 sm:px-4 py-12">
      <h1 className="text-4xl font-bold">Administration</h1>
      <p className="mt-2 text-ink-muted">Vue d&apos;ensemble de ce qui demande ton attention.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-md border border-line bg-surface p-5 shadow-resting transition hover:-translate-y-0.5 hover:shadow-raised"
          >
            <p className="text-sm text-ink-muted">{card.label}</p>
            <p className={`mt-2 text-3xl font-bold ${toneClass[card.tone]}`}>{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/achats"
          className="rounded-md border border-line bg-surface-alt p-4 text-sm font-semibold text-ink transition-colors hover:bg-line"
        >
          Suivi des achats et commissions →
        </Link>
        <Link
          href="/admin/coach-requests"
          className="rounded-md border border-line bg-surface-alt p-4 text-sm font-semibold text-ink transition-colors hover:bg-line"
        >
          Demandes coach →
        </Link>
        <Link
          href="/admin/utilisateurs"
          className="rounded-md border border-line bg-surface-alt p-4 text-sm font-semibold text-ink transition-colors hover:bg-line"
        >
          Gestion des utilisateurs →
        </Link>
      </div>
    </section>
  );
}
