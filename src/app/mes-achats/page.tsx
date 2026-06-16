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
        <p className="mt-2 text-[#cbd5e1]">Connecte-toi pour retrouver tes videos debloquees.</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full bg-[#00b4d8] px-5 py-2 font-semibold text-[#04111d] hover:bg-[#48cae4]"
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
      <p className="mt-2 text-[#cbd5e1]">Retrouve rapidement toutes tes videos debloquees.</p>

      {purchases.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6">
          <p className="text-[#cbd5e1]">Tu n&apos;as pas encore achete de video.</p>
          <Link
            href="/catalogue"
            className="mt-4 inline-block rounded-full bg-[#f4d35e] px-4 py-2 font-semibold text-[#1b1f3a] hover:bg-[#ffd166]"
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