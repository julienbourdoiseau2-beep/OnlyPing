import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

type CoachRequestsAdminPageProps = {
  searchParams?: { status?: string };
};

const STATUS_FILTERS = [
  { value: "ALL", label: "Toutes" },
  { value: "PENDING", label: "En attente" },
  { value: "APPROVED", label: "Approuvees" },
  { value: "REJECTED", label: "Rejetees" }
] as const;

function statusChipClass(status: string) {
  if (status === "APPROVED") {
    return "bg-success-bg text-success";
  }
  if (status === "REJECTED") {
    return "bg-danger-bg text-danger";
  }
  return "bg-info-bg text-info";
}

function statusLabel(status: string) {
  if (status === "APPROVED") return "Approuvee";
  if (status === "REJECTED") return "Rejetee";
  return "En attente";
}

export default async function CoachRequestsAdminPage({ searchParams }: CoachRequestsAdminPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const status = searchParams?.status ?? "PENDING";

  const [pendingCount, approvedCount, rejectedCount, requests] = await Promise.all([
    prisma.coachRequest.count({ where: { status: "PENDING" } }),
    prisma.coachRequest.count({ where: { status: "APPROVED" } }),
    prisma.coachRequest.count({ where: { status: "REJECTED" } }),
    prisma.coachRequest.findMany({
      where: status === "ALL" ? {} : { status },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const counts: Record<string, number> = {
    ALL: pendingCount + approvedCount + rejectedCount,
    PENDING: pendingCount,
    APPROVED: approvedCount,
    REJECTED: rejectedCount
  };

  return (
    <section className="mx-auto max-w-6xl px-3 sm:px-4 py-12">
      <h1 className="text-4xl font-bold">Demandes coach</h1>
      <p className="mt-2 text-ink-muted">Valide les profils qui souhaitent rejoindre OnlyPing.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={`/admin/coach-requests?status=${filter.value}`}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              status === filter.value
                ? "border-accent bg-accent text-white"
                : "border-line bg-surface text-ink-muted hover:bg-surface-alt"
            }`}
          >
            {filter.label} ({counts[filter.value]})
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {requests.length === 0 ? (
          <div className="rounded-md border border-line bg-surface shadow-resting p-6 text-ink-muted">
            Aucune demande pour ce filtre.
          </div>
        ) : null}

        {requests.map((request) => (
          <div key={request.id} className="rounded-md border border-line bg-surface shadow-resting p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold text-ink">{request.fullName}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusChipClass(request.status)}`}>
                    {statusLabel(request.status)}
                  </span>
                </div>
                <p className="text-sm text-ink-muted">{request.user.name} — {request.user.email}</p>
                <p className="mt-2 text-sm text-ink-muted">Téléphone : {request.phone}</p>
                <p className="text-sm text-ink-muted">Adresse : {request.address}</p>
                {request.message ? <p className="mt-2 text-sm text-ink-muted">{request.message}</p> : null}
                <p className="mt-2 text-xs text-ink-faint">
                  Recue le {new Date(request.createdAt).toLocaleDateString("fr-FR")}
                  {request.reviewedAt ? ` · traitee le ${new Date(request.reviewedAt).toLocaleDateString("fr-FR")}` : ""}
                </p>
              </div>

              {request.status === "PENDING" ? (
                <div className="flex flex-wrap items-start gap-2">
                  <form action={`/api/admin/coach-requests/${request.id}/approve`} method="POST">
                    <button className="rounded-full border border-success/30 bg-success-bg px-4 py-2 text-sm font-semibold text-success transition-colors hover:bg-success/20">
                      Approuver
                    </button>
                  </form>
                  <details className="group">
                    <summary className="list-none">
                      <span className="inline-flex cursor-pointer rounded-full border border-danger/30 bg-danger-bg px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/20">
                        Rejeter
                      </span>
                    </summary>
                    <form
                      action={`/api/admin/coach-requests/${request.id}/reject`}
                      method="POST"
                      className="mt-2 w-64 rounded-md border border-line bg-surface-alt p-3"
                    >
                      <label className="block text-xs text-ink-muted">
                        Motif (optionnel, envoye au candidat)
                        <textarea
                          name="reason"
                          rows={2}
                          className="mt-1 w-full rounded-sm border border-line bg-surface px-2 py-1.5 text-xs text-ink"
                        />
                      </label>
                      <button
                        type="submit"
                        className="mt-2 w-full rounded-full bg-danger px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90"
                      >
                        Confirmer le rejet
                      </button>
                    </form>
                  </details>
                </div>
              ) : null}
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
