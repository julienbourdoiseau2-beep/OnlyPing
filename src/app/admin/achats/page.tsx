import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { computeCommissionAmounts, getEffectiveCommissionBps } from "@/lib/commission";
import { prisma } from "@/lib/prisma";
import { AdminCommissionManager } from "@/components/admin-commission-manager";
import { MonthlyRevenueChart } from "@/components/monthly-revenue-chart";

type SearchParams = {
  sort?: string;
  page?: string;
  coachId?: string;
  month?: string;
};

type AdminAchatsPageProps = {
  searchParams?: SearchParams;
};

const PAGE_SIZE = 10;

function toPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
}

function buildPageHref(page: number, sort: string, coachId: string, month: string) {
  const params = new URLSearchParams({
    page: String(page),
    sort
  });

  if (coachId) {
    params.set("coachId", coachId);
  }

  if (month) {
    params.set("month", month);
  }

  return `/admin/achats?${params.toString()}`;
}

function toDateRange(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return null;
  }

  const [yearPart, monthPart] = month.split("-");
  const year = Number(yearPart);
  const monthIndex = Number(monthPart) - 1;
  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return null;
  }

  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));
  return { start, end };
}

export default async function AdminAchatsPage({ searchParams }: AdminAchatsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <section className="mx-auto max-w-5xl px-3 sm:px-4 py-12">
        <h1 className="text-4xl font-bold">Dashboard admin achats</h1>
        <p className="mt-2 text-ink-muted">Connecte-toi pour acceder a cette page.</p>
      </section>
    );
  }

  if (session.user.role !== "ADMIN") {
    return (
      <section className="mx-auto max-w-5xl px-3 sm:px-4 py-12">
        <h1 className="text-4xl font-bold">Dashboard admin achats</h1>
        <p className="mt-2 text-ink-muted">Acces reserve aux administrateurs.</p>
      </section>
    );
  }

  const sort = searchParams?.sort ?? "date_desc";
  const currentPage = toPositiveInt(searchParams?.page, 1);
  const coachId = searchParams?.coachId ?? "";
  const month = searchParams?.month ?? "";
  const monthRange = toDateRange(month);

  const orderBy =
    sort === "date_asc"
      ? [{ createdAt: "asc" as const }]
      : sort === "amount_desc"
        ? [{ amount: "desc" as const }, { createdAt: "desc" as const }]
        : sort === "amount_asc"
          ? [{ amount: "asc" as const }, { createdAt: "desc" as const }]
          : [{ createdAt: "desc" as const }];

  const where = {
    ...(coachId ? { video: { coachId } } : {}),
    ...(monthRange
      ? {
          createdAt: {
            gte: monthRange.start,
            lt: monthRange.end
          }
        }
      : {})
  };

  // Les remboursements/litiges restent visibles dans le tableau detaille (audit),
  // mais sont exclus des totaux : cet argent n'est plus (ou pas encore) acquis.
  const cleanWhere = { ...where, refundedAt: null, disputedAt: null };

  // Tout ce qui ne depend pas de la pagination (donc pas de totalPurchasesRaw)
  // part en une seule vague parallele plutot qu'en aller-retours DB successifs.
  const [
    coaches,
    totalPurchasesRaw,
    totalPurchasesClean,
    revenueAggregateClean,
    videos,
    cleanPurchasesForTotals
  ] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["COACH", "ADMIN"] } },
      select: {
        id: true,
        name: true,
        commissionBps: true
      },
      orderBy: { name: "asc" }
    }),
    prisma.purchase.count({ where }),
    prisma.purchase.count({ where: cleanWhere }),
    prisma.purchase.aggregate({
      where: cleanWhere,
      _sum: { amount: true }
    }),
    prisma.video.findMany({
      select: {
        id: true,
        title: true,
        commissionBpsOverride: true,
        coach: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 200
    }),
    // Totaux calcules sur l'ensemble filtre (pas seulement la page affichee), net des
    // remboursements/litiges.
    prisma.purchase.findMany({
      where: cleanWhere,
      select: {
        amount: true,
        commissionAmount: true,
        coachNetAmount: true,
        commissionBpsAtPurchase: true,
        createdAt: true,
        video: {
          select: {
            commissionBpsOverride: true,
            coach: {
              select: {
                id: true,
                name: true,
                commissionBps: true
              }
            }
          }
        }
      }
    })
  ]);

  const totalPages = Math.max(1, Math.ceil(totalPurchasesRaw / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const skip = (page - 1) * PAGE_SIZE;

  const purchases = await prisma.purchase.findMany({
    include: {
      user: {
        select: { name: true, email: true }
      },
      video: {
        select: {
          title: true,
          level: true,
          commissionBpsOverride: true,
          coach: {
            select: {
              id: true,
              name: true,
              commissionBps: true
            }
          }
        }
      }
    },
    where,
    orderBy,
    skip,
    take: PAGE_SIZE
  });

  const coachTotalsMap = new Map<string, { coachName: string; gross: number; commission: number; net: number; sales: number }>();
  const monthlyTotalsMap = new Map<string, { gross: number; sales: number }>();
  let totalCommissionCents = 0;
  let totalCoachNetCents = 0;

  for (const purchase of cleanPurchasesForTotals) {
    const bps =
      purchase.commissionBpsAtPurchase ??
      getEffectiveCommissionBps(purchase.video.commissionBpsOverride, purchase.video.coach.commissionBps);

    const amounts =
      purchase.commissionAmount !== null && purchase.coachNetAmount !== null
        ? { commissionAmount: purchase.commissionAmount, coachNetAmount: purchase.coachNetAmount }
        : computeCommissionAmounts(purchase.amount, bps);

    totalCommissionCents += amounts.commissionAmount;
    totalCoachNetCents += amounts.coachNetAmount;

    const existing = coachTotalsMap.get(purchase.video.coach.id) ?? {
      coachName: purchase.video.coach.name,
      gross: 0,
      commission: 0,
      net: 0,
      sales: 0
    };

    existing.gross += purchase.amount;
    existing.commission += amounts.commissionAmount;
    existing.net += amounts.coachNetAmount;
    existing.sales += 1;
    coachTotalsMap.set(purchase.video.coach.id, existing);

    const monthKey = purchase.createdAt.toISOString().slice(0, 7);
    const existingMonth = monthlyTotalsMap.get(monthKey) ?? { gross: 0, sales: 0 };
    existingMonth.gross += purchase.amount;
    existingMonth.sales += 1;
    monthlyTotalsMap.set(monthKey, existingMonth);
  }

  const coachTotals = Array.from(coachTotalsMap.values()).sort((a, b) => b.gross - a.gross);
  const monthlyChartData = Array.from(monthlyTotalsMap.entries())
    .map(([month, values]) => ({ label: month, grossCents: values.gross, sales: values.sales }))
    .sort((a, b) => (a.label < b.label ? -1 : 1));

  const totalRevenueCents = revenueAggregateClean._sum.amount ?? 0;
  const totalRevenueEur = (totalRevenueCents / 100).toFixed(2);
  const totalCommissionEur = (totalCommissionCents / 100).toFixed(2);
  const totalCoachNetEur = (totalCoachNetCents / 100).toFixed(2);

  return (
    <section className="mx-auto max-w-7xl px-3 sm:px-4 py-12">
      <h1 className="text-4xl font-bold">Dashboard admin achats</h1>
      <p className="mt-2 text-ink-muted">Suivi des achats, CA par coach et commissions.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-md border border-line bg-surface shadow-resting p-5">
          <p className="text-sm text-ink-muted">Achats (hors rembourses/litiges)</p>
          <p className="mt-2 text-3xl font-bold">{totalPurchasesClean}</p>
        </div>
        <div className="rounded-md border border-line bg-surface shadow-resting p-5">
          <p className="text-sm text-ink-muted">Chiffre d&apos;affaires</p>
          <p className="mt-2 text-3xl font-bold text-ink-muted">{totalRevenueEur} EUR</p>
        </div>
        <div className="rounded-md border border-line bg-surface shadow-resting p-5">
          <p className="text-sm text-ink-muted">Commission plateforme</p>
          <p className="mt-2 text-3xl font-bold text-ink-muted">{totalCommissionEur} EUR</p>
        </div>
        <div className="rounded-md border border-line bg-surface shadow-resting p-5">
          <p className="text-sm text-ink-muted">Gain reel coachs (CA - commission)</p>
          <p className="mt-2 text-3xl font-bold">
            {totalCoachNetEur} EUR
          </p>
        </div>
      </div>

      <form className="mt-6 grid gap-3 rounded-md border border-line bg-surface shadow-resting p-4 md:grid-cols-5 md:items-end">
        <label htmlFor="sort" className="text-sm text-ink-muted">
          Trier par
          <select
            id="sort"
            name="sort"
            defaultValue={sort}
            className="mt-1 w-full rounded-sm border border-line bg-surface-alt px-3 py-2 text-sm text-ink [&>option]:bg-surface [&>option]:text-ink"
          >
            <option value="date_desc">Date (recent au plus ancien)</option>
            <option value="date_asc">Date (ancien au plus recent)</option>
            <option value="amount_desc">Montant (plus eleve)</option>
            <option value="amount_asc">Montant (plus faible)</option>
          </select>
        </label>

        <label htmlFor="coachId" className="text-sm text-ink-muted">
          Coach
          <select
            id="coachId"
            name="coachId"
            defaultValue={coachId}
            className="mt-1 w-full rounded-sm border border-line bg-surface-alt px-3 py-2 text-sm text-ink [&>option]:bg-surface [&>option]:text-ink"
          >
            <option value="">Tous les coachs</option>
            {coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.name}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="month" className="text-sm text-ink-muted">
          Mois
          <input
            id="month"
            name="month"
            type="month"
            defaultValue={month}
            className="mt-1 w-full rounded-sm border border-line bg-surface-alt px-3 py-2 text-sm text-ink"
          />
        </label>

        <input type="hidden" name="page" value="1" />
        <button
          type="submit"
          className="rounded-full border border-line bg-surface-alt px-4 py-2 text-sm font-semibold text-ink hover:bg-line"
        >
          Appliquer
        </button>
        <Link
          href="/admin/achats"
          className="inline-flex items-center justify-center rounded-full border border-line px-4 py-2 text-sm text-ink-muted hover:bg-surface-alt"
        >
          Reinitialiser
        </Link>
      </form>

      <div className="mt-3 flex justify-end">
        <a
          href={`/api/admin/achats/export?${new URLSearchParams({
            ...(coachId ? { coachId } : {}),
            ...(month ? { month } : {})
          }).toString()}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-alt px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-line"
        >
          Exporter en CSV
        </a>
      </div>

      {monthlyChartData.length > 1 ? (
        <div className="mt-6">
          <MonthlyRevenueChart title="Tendance des ventes (plateforme)" data={monthlyChartData} />
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-md border border-line bg-surface shadow-resting">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-alt text-ink-muted">
            <tr>
              <th className="px-4 py-3">Coach</th>
              <th className="px-4 py-3">Ventes</th>
              <th className="px-4 py-3">CA brut</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Gain reel coach</th>
            </tr>
          </thead>
          <tbody>
            {coachTotals.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-ink-muted">Aucune vente sur ce filtre.</td>
              </tr>
            ) : (
              coachTotals.map((row) => (
                <tr key={row.coachName} className="border-t border-line">
                  <td className="px-4 py-3">{row.coachName}</td>
                  <td className="px-4 py-3">{row.sales}</td>
                  <td className="px-4 py-3">{(row.gross / 100).toFixed(2)} EUR</td>
                  <td className="px-4 py-3">{(row.commission / 100).toFixed(2)} EUR</td>
                  <td className="px-4 py-3">{(row.net / 100).toFixed(2)} EUR</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-ink-muted">
        Page {page} sur {totalPages} ({purchases.length} achat(s) affiche(s), {totalPurchasesRaw} au total sur ce
        filtre)
      </p>

      <div className="mt-8 overflow-hidden rounded-md border border-line bg-surface shadow-resting">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-alt text-ink-muted">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Video</th>
              <th className="px-4 py-3">Coach</th>
              <th className="px-4 py-3">Niveau</th>
              <th className="px-4 py-3">CA</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Gain reel coach</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((purchase) => {
              const bps =
                purchase.commissionBpsAtPurchase ??
                getEffectiveCommissionBps(purchase.video.commissionBpsOverride, purchase.video.coach.commissionBps);

              const amounts =
                purchase.commissionAmount !== null && purchase.coachNetAmount !== null
                  ? { commissionAmount: purchase.commissionAmount, coachNetAmount: purchase.coachNetAmount }
                  : computeCommissionAmounts(purchase.amount, bps);

              const status = purchase.refundedAt
                ? { label: "Rembourse", className: "text-ink-muted" }
                : purchase.disputedAt
                  ? { label: "Litige en cours", className: "text-danger" }
                  : { label: "Paye", className: "text-success" };

              return (
                <tr key={purchase.id} className="border-t border-line">
                  <td className="px-4 py-3">{new Date(purchase.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3">{purchase.user.name}</td>
                  <td className="px-4 py-3">{purchase.user.email}</td>
                  <td className="px-4 py-3">{purchase.video.title}</td>
                  <td className="px-4 py-3">{purchase.video.coach.name}</td>
                  <td className="px-4 py-3">{purchase.video.level}</td>
                  <td className="px-4 py-3">{(purchase.amount / 100).toFixed(2)} EUR</td>
                  <td className="px-4 py-3">{(amounts.commissionAmount / 100).toFixed(2)} EUR</td>
                  <td className="px-4 py-3">{(amounts.coachNetAmount / 100).toFixed(2)} EUR</td>
                  <td className={`px-4 py-3 font-semibold ${status.className}`}>{status.label}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Link
          href={buildPageHref(Math.max(1, page - 1), sort, coachId, month)}
          className={`rounded-full px-4 py-2 text-sm ${
            page <= 1
              ? "pointer-events-none border border-line text-ink-muted"
                : "border border-line text-ink-muted hover:bg-surface-alt"
          }`}
        >
          Precedent
        </Link>

        <Link
          href={buildPageHref(Math.min(totalPages, page + 1), sort, coachId, month)}
          className={`rounded-full px-4 py-2 text-sm ${
            page >= totalPages
              ? "pointer-events-none border border-line text-ink-muted"
                : "border border-line text-ink-muted hover:bg-surface-alt"
          }`}
        >
          Suivant
        </Link>
      </div>

      <AdminCommissionManager
        coaches={coaches}
        videos={videos.map((video) => ({
          id: video.id,
          title: video.title,
          coachName: video.coach.name,
          commissionBpsOverride: video.commissionBpsOverride
        }))}
      />
    </section>
  );
}