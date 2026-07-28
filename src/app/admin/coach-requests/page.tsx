import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CoachRequestsAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const requests = await prisma.coachRequest.findMany({
    where: { status: "PENDING" },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <section className="mx-auto max-w-6xl px-3 sm:px-4 py-12">
      <h1 className="text-4xl font-bold">Demandes coach</h1>
      <p className="mt-2 text-ink-muted">Valide les profils qui souhaitent rejoindre OnlyPing.</p>

      <div className="mt-8 space-y-4">
        {requests.length === 0 ? (
          <div className="rounded-md border border-line bg-surface shadow-resting p-6 text-ink-muted">
            Aucune demande en attente.
          </div>
        ) : null}

        {requests.map((request) => (
          <div key={request.id} className="rounded-md border border-line bg-surface shadow-resting p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-lg font-semibold text-ink">{request.fullName}</p>
                <p className="text-sm text-ink-muted">{request.user.name} — {request.user.email}</p>
                <p className="mt-2 text-sm text-ink-muted">Téléphone : {request.phone}</p>
                <p className="text-sm text-ink-muted">Adresse : {request.address}</p>
                {request.message ? <p className="mt-2 text-sm text-ink-muted">{request.message}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={`/api/admin/coach-requests/${request.id}/approve`} method="POST">
                  <button className="rounded-full border border-success/30 bg-success-bg px-4 py-2 text-sm font-semibold text-success transition-colors hover:bg-success/20">
                    Approuver
                  </button>
                </form>
                <form action={`/api/admin/coach-requests/${request.id}/reject`} method="POST">
                  <button className="rounded-full border border-danger/30 bg-danger-bg px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/20">
                    Rejeter
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Link href="/admin" className="text-sm text-ink-muted hover:text-ink">
          Retour à l’administration
        </Link>
      </div>
    </section>
  );
}
