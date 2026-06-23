import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { computeCommissionAmounts, getEffectiveCommissionBps } from "@/lib/commission";
import { prisma } from "@/lib/prisma";
import { toLevelLabel } from "@/lib/video-taxonomy";
import { CoachUploadForm } from "@/components/coach-upload-form";
import { CoachVideoSettingsForm } from "@/components/coach-video-settings-form";
import { DeleteVideoButton } from "@/components/delete-video-button";
import { PublishToggleButton } from "@/components/publish-toggle-button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <section className="mx-auto max-w-4xl px-3 sm:px-4 py-12">
        <h1 className="text-3xl font-bold">Connexion requise</h1>
        <p className="mt-2 text-[#b8c1cd]">Connecte-toi pour acceder a l&apos;espace coach.</p>
      </section>
    );
  }

  if (session.user.role !== "COACH" && session.user.role !== "ADMIN") {
    return (
      <section className="mx-auto max-w-4xl px-3 sm:px-4 py-12">
        <h1 className="text-3xl font-bold">Acces restreint</h1>
        <p className="mt-2 text-[#b8c1cd]">Cette zone est reservee aux entraineurs et administrateurs.</p>
      </section>
    );
  }

  const videos = await prisma.video.findMany({
    where: { coachId: session.user.id, deletedAt: null },
    orderBy: { createdAt: "desc" }
  });

  const coach = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { commissionBps: true }
  });
  const coachCommissionBps = coach?.commissionBps ?? null;

  const purchases = await prisma.purchase.findMany({
    where: {
      video: {
        coachId: session.user.id
      }
    },
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
              commissionBps: true
            }
          }
        }
      }
    }
  });

  let grossCents = 0;
  let commissionCents = 0;
  let netCents = 0;
  const monthlyTotals = new Map<string, { sales: number; gross: number; commission: number; net: number }>();

  for (const purchase of purchases) {
    const bps =
      purchase.commissionBpsAtPurchase ??
      getEffectiveCommissionBps(purchase.video.commissionBpsOverride, purchase.video.coach.commissionBps);
    const amounts =
      purchase.commissionAmount !== null && purchase.coachNetAmount !== null
        ? { commissionAmount: purchase.commissionAmount, coachNetAmount: purchase.coachNetAmount }
        : computeCommissionAmounts(purchase.amount, bps);

    grossCents += purchase.amount;
    commissionCents += amounts.commissionAmount;
    netCents += amounts.coachNetAmount;

    const monthKey = new Date(purchase.createdAt).toISOString().slice(0, 7);
    const existing = monthlyTotals.get(monthKey) ?? { sales: 0, gross: 0, commission: 0, net: 0 };
    existing.sales += 1;
    existing.gross += purchase.amount;
    existing.commission += amounts.commissionAmount;
    existing.net += amounts.coachNetAmount;
    monthlyTotals.set(monthKey, existing);
  }

  const monthlyRows = Array.from(monthlyTotals.entries())
    .map(([month, values]) => ({ month, ...values }))
    .sort((a, b) => (a.month < b.month ? 1 : -1));

  return (
    <section className="mx-auto max-w-6xl px-3 sm:px-4 py-12">
      <h1 className="text-4xl font-bold">Espace entraineur</h1>
      <p className="mt-2 text-[#b8c1cd]">Bienvenue {session.user.name}, voici tes videos.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#12161b]/80 p-5">
          <p className="text-sm text-[#94a3b8]">Ventes</p>
          <p className="mt-2 text-3xl font-bold">{purchases.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#12161b]/80 p-5">
          <p className="text-sm text-[#94a3b8]">CA brut</p>
          <p className="mt-2 text-3xl font-bold">{(grossCents / 100).toFixed(2)} EUR</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#12161b]/80 p-5">
          <p className="text-sm text-[#94a3b8]">Commission plateforme</p>
          <p className="mt-2 text-3xl font-bold text-[#e2e8f0]">{(commissionCents / 100).toFixed(2)} EUR</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#12161b]/80 p-5">
          <p className="text-sm text-[#94a3b8]">Gain reel</p>
          <p className="mt-2 text-3xl font-bold text-[#e2e8f0]">{(netCents / 100).toFixed(2)} EUR</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#12161b]/80">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-[#cbd3dd]">
            <tr>
              <th className="px-4 py-3">Mois</th>
              <th className="px-4 py-3">Ventes</th>
              <th className="px-4 py-3">CA brut</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Gain reel</th>
            </tr>
          </thead>
          <tbody>
            {monthlyRows.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-[#94a3b8]" colSpan={5}>Aucune vente pour le moment.</td>
              </tr>
            ) : (
              monthlyRows.map((row) => (
                <tr key={row.month} className="border-t border-white/10">
                  <td className="px-4 py-3">{row.month}</td>
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

      <div className="mt-8">
        <CoachUploadForm />
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#12161b]/80">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-[#cbd3dd]">
            <tr>
              <th className="px-4 py-3">Titre</th>
              <th className="px-4 py-3">Categorie</th>
              <th className="px-4 py-3">Niveau</th>
              <th className="px-4 py-3">Prix</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Publiee</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr key={video.id} className="border-t border-white/10">
                <td className="px-4 py-3">{video.title}</td>
                <td className="px-4 py-3">{video.category}</td>
                <td className="px-4 py-3">{toLevelLabel(video.level)}</td>
                <td className="px-4 py-3">{(video.priceCents / 100).toFixed(2)} EUR</td>
                <td className="px-4 py-3">
                  {(getEffectiveCommissionBps(video.commissionBpsOverride, coachCommissionBps) / 100).toFixed(2)} %
                </td>
                <td className="px-4 py-3">{video.isPublished ? "Oui" : "Non"}</td>
                <td className="space-y-2 px-4 py-3">
                  <CoachVideoSettingsForm
                    videoId={video.id}
                    initialTitle={video.title}
                    initialDescription={video.description}
                    initialCategory={video.category}
                    initialLevel={video.level}
                    initialDurationMin={video.durationMin}
                    initialPriceCents={video.priceCents}
                    initialThumbnail={video.thumbnail}
                    effectiveCommissionBps={getEffectiveCommissionBps(video.commissionBpsOverride, coachCommissionBps)}
                  />
                  <PublishToggleButton videoId={video.id} isPublished={video.isPublished} />
                  <DeleteVideoButton videoId={video.id} title={video.title} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}