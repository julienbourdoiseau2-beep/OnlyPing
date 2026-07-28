import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PurchasesFilterList } from "@/components/purchases-filter-list";

export default async function MesAchatsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <section className="mx-auto max-w-4xl px-3 sm:px-4 py-12">
        <h1 className="text-4xl font-bold">Mes achats</h1>
        <p className="mt-2 text-ink-muted">Connecte-toi pour retrouver tes videos debloquees.</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full bg-accent px-5 py-2 font-semibold text-white transition-colors hover:bg-accent-deep"
        >
          Se connecter
        </Link>
      </section>
    );
  }

  const purchases = await prisma.purchase.findMany({
    where: { userId: session.user.id },
    include: {
      video: {
        include: {
          coach: {
            select: { name: true }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const normalizedPurchases = purchases.map((purchase) => ({
    id: purchase.id,
    createdAt: purchase.createdAt.toISOString(),
    video: {
      id: purchase.video.id,
      title: purchase.video.title,
      level: purchase.video.level,
      durationMin: purchase.video.durationMin,
      coachName: purchase.video.coach.name
    }
  }));

  return (
    <section className="mx-auto max-w-7xl px-3 sm:px-4 py-12">
      <h1 className="text-4xl font-bold">Mes achats</h1>
      <p className="mt-2 text-ink-muted">Retrouve rapidement toutes tes videos debloquees.</p>

      {purchases.length === 0 ? (
        <div className="mt-8 rounded-md border border-line bg-surface p-6 shadow-resting">
          <p className="text-ink-muted">Tu n&apos;as pas encore achete de video.</p>
          <Link
            href="/catalogue"
            className="mt-4 inline-block rounded-full bg-accent px-4 py-2 font-semibold text-white transition-colors hover:bg-accent-deep"
          >
            Parcourir le catalogue
          </Link>
        </div>
      ) : (
        <PurchasesFilterList purchases={normalizedPurchases} />
      )}
    </section>
  );
}