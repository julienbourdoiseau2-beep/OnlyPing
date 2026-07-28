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
      <p className="mt-2 text-ink-muted">Statut actuel : {request.status}</p>

      <div className="mt-8 rounded-md border border-line bg-surface shadow-resting p-6">
        <p className="text-lg font-semibold text-ink">{request.fullName}</p>
        <p className="mt-2 text-sm text-ink-muted">Utilisateur : {request.user.name} ({request.user.email})</p>
        <p className="text-sm text-ink-muted">Rôle actuel : {request.user.role}</p>
        <p className="mt-4 text-sm text-ink-muted">Adresse : {request.address}</p>
        <p className="text-sm text-ink-muted">Téléphone : {request.phone}</p>
        {request.message ? <p className="mt-4 text-sm text-ink-muted">{request.message}</p> : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/coach-requests" className="text-sm text-ink-muted hover:text-ink">
          Retour à la liste
        </Link>
      </div>
    </section>
  );
}
