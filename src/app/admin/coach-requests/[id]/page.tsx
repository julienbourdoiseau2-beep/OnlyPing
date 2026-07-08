import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

type AdminCoachRequestDetailPageProps = {
  params: { id: string };
};

export default async function CoachRequestDetailPage({ params }: AdminCoachRequestDetailPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const request = await prisma.coachRequest.findUnique({
    where: { id: params.id },
    include: { user: { select: { id: true, name: true, email: true, role: true } } }
  });

  if (!request) {
    return (
      <section className="mx-auto max-w-4xl px-3 sm:px-4 py-12">
        <h1 className="text-4xl font-bold">Demande introuvable</h1>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-3 sm:px-4 py-12">
      <h1 className="text-4xl font-bold">Détail de la demande</h1>
      <p className="mt-2 text-[#b8c1cd]">Statut actuel : {request.status}</p>

      <div className="mt-8 rounded-2xl border border-white/10 bg-[#12161b]/80 p-6">
        <p className="text-lg font-semibold text-white">{request.fullName}</p>
        <p className="mt-2 text-sm text-[#b8c1cd]">Utilisateur : {request.user.name} ({request.user.email})</p>
        <p className="text-sm text-[#b8c1cd]">Rôle actuel : {request.user.role}</p>
        <p className="mt-4 text-sm text-[#b8c1cd]">Adresse : {request.address}</p>
        <p className="text-sm text-[#b8c1cd]">Téléphone : {request.phone}</p>
        <p className="text-sm text-[#b8c1cd]">IBAN / Stripe : {request.ibanOrStripeInfo}</p>
        {request.message ? <p className="mt-4 text-sm text-[#d7dde5]">{request.message}</p> : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/coach-requests" className="text-sm text-[#cfd6df] hover:text-white">
          Retour à la liste
        </Link>
      </div>
    </section>
  );
}
