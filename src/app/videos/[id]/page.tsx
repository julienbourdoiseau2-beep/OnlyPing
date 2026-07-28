import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isOptimizableImageUrl } from "@/lib/image-optimization";
import { prisma } from "@/lib/prisma";
import { toLevelLabel } from "@/lib/video-taxonomy";
import { PaymentStatusBanner } from "@/components/payment-status-banner";
import { PurchaseButton } from "@/components/purchase-button";
import { VideoReviewForm } from "@/components/video-review-form";

type Params = {
  params: { id: string };
  searchParams?: { payment?: string };
};

export default async function VideoDetailsPage({ params, searchParams }: Params) {
  const session = await getServerSession(authOptions);
  const paymentStatus = searchParams?.payment === "success" || searchParams?.payment === "cancel"
    ? searchParams.payment
    : null;

  const video = await prisma.video.findUnique({
    where: { id: params.id },
    include: {
      coach: {
        include: {
          coachProfile: true
        }
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        },
        orderBy: {
          updatedAt: "desc"
        }
      }
    }
  });

  if (!video) {
    notFound();
  }

  const hasPurchased = session?.user
    ? !!(await prisma.purchase.findUnique({
        where: {
          userId_videoId: {
            userId: session.user.id,
            videoId: video.id
          }
        }
      }))
    : false;

  const isAdmin = session?.user?.role === "ADMIN";
  const isCoach = session?.user?.id === video.coachId;

  const isAccessible = video.isPublished || (video.deletedAt && (hasPurchased || isAdmin || isCoach));
  if (!isAccessible && !isAdmin && !isCoach) {
    notFound();
  }

  const canWatch =
    !!session?.user &&
    (isAdmin || isCoach || hasPurchased);
  const showThumbnail = Boolean(video.thumbnail && video.thumbnail !== "/uploads/default-thumb.jpg");

  const categoryLabel =
    video.category === "REVERS" ? "Revers" : video.category === "COUP_DROIT" ? "Coup droit" : "Service";
  const averageRating =
    video.reviews.length > 0
      ? video.reviews.reduce((sum, review) => sum + review.rating, 0) / video.reviews.length
      : null;
  const currentUserReview = session?.user
    ? video.reviews.find((review) => review.userId === session.user.id) ?? null
    : null;

  return (
    <section className="mx-auto max-w-5xl px-3 sm:px-4 py-12">
      <PaymentStatusBanner status={paymentStatus} canWatch={canWatch} />

      {showThumbnail ? (
        <Image
          unoptimized={!isOptimizableImageUrl(video.thumbnail)}
          src={video.thumbnail}
          alt={video.title}
          width={1280}
          height={512}
          sizes="100vw"
          className="h-64 w-full rounded-md border border-line object-cover"
        />
      ) : null}
      <div className="mt-4 flex items-center gap-2">
        <span className="rounded-full bg-chip-service-bg px-2.5 py-1 text-xs font-medium text-chip-service-text">{categoryLabel}</span>
        <p className="text-sm uppercase tracking-wider text-ink-muted">{toLevelLabel(video.level)}</p>
      </div>
      <h1 className="mt-2 font-display text-4xl font-semibold text-ink">{video.title}</h1>
      <p className="mt-4 text-ink">{video.description}</p>

      <div className="mt-8 grid gap-6 rounded-md border border-line bg-surface p-6 shadow-resting md:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="text-xl font-semibold text-ink">Avant achat: ce que tu vas trouver</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li>- Video complete sans coupure</li>
            <li>- Demonstrations techniques en rythme reel</li>
            <li>- Conseils actionnables pour tes prochaines seances</li>
            <li>- Acces immediat apres paiement</li>
          </ul>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-line bg-surface-alt p-3">
              <p className="text-xs text-ink-muted">Niveau</p>
              <p className="mt-1 font-medium text-ink">{toLevelLabel(video.level)}</p>
            </div>
            <div className="rounded-md border border-line bg-surface-alt p-3">
              <p className="text-xs text-ink-muted">Duree</p>
              <p className="mt-1 font-medium text-ink">{video.durationMin} min</p>
            </div>
            <div className="rounded-md border border-line bg-surface-alt p-3">
              <p className="text-xs text-ink-muted">Prix</p>
              <p className="mt-1 text-lg font-bold text-accent">{(video.priceCents / 100).toFixed(2)} EUR</p>
            </div>
          </div>
        </div>

        <aside className="rounded-md border border-line bg-surface-alt p-4">
          <p className="text-sm text-ink-muted">Coach</p>
          <div className="mt-2 flex items-center gap-3">
            {video.coach.avatarUrl ? (
              <Image
                unoptimized={!isOptimizableImageUrl(video.coach.avatarUrl)}
                src={video.coach.avatarUrl}
                alt={video.coach.name}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-sm font-semibold text-ink">
                {video.coach.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <p className="text-lg font-semibold text-ink">{video.coach.name}</p>
          </div>
          {video.coach.coachProfile?.bio ? (
            <p className="mt-3 text-sm text-ink">{video.coach.coachProfile.bio}</p>
          ) : null}
          {video.coach.coachProfile?.specialty ? (
            <p className="mt-2 text-sm text-ink-muted">Specialite: {video.coach.coachProfile.specialty}</p>
          ) : null}
        </aside>

        {canWatch ? (
          <div className="mt-6 rounded-md border border-line bg-surface-alt p-3 md:col-span-2">
            <video
              controls
              className="aspect-video max-h-[70vh] w-full rounded-sm bg-black"
              src={`/api/videos/${video.id}/stream`}
            />
          </div>
        ) : session?.user ? (
          <div className="md:col-span-2">
            <p className="mb-3 text-sm text-ink-muted">La lecture complete se debloque apres achat.</p>
            <PurchaseButton videoId={video.id} />
          </div>
        ) : (
          <Link
            href="/login"
            className="mt-6 inline-block rounded-sm bg-accent px-5 py-2 font-semibold text-white transition-colors hover:bg-accent-deep md:col-span-2"
          >
            Connecte-toi pour acheter
          </Link>
        )}
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-md border border-line bg-surface p-5 shadow-resting">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-ink">Avis</h2>
              <p className="mt-1 text-sm text-ink-muted">
                {averageRating ? `${averageRating.toFixed(1)} / 5` : "Pas encore de note"} · {video.reviews.length} commentaire{video.reviews.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {video.reviews.length === 0 ? (
              <p className="text-sm text-ink-muted">Aucun commentaire pour le moment.</p>
            ) : (
              video.reviews.map((review) => (
                <article key={review.id} className="rounded-md border border-line bg-surface-alt p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {review.user.avatarUrl ? (
                        <Image
                          unoptimized={!isOptimizableImageUrl(review.user.avatarUrl)}
                          src={review.user.avatarUrl}
                          alt={review.user.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-sm font-semibold text-ink">
                          {review.user.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-ink">{review.user.name}</p>
                        <p className="text-xs text-ink-muted">{new Date(review.updatedAt).toLocaleDateString("fr-FR")}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-accent">{review.rating} / 5</p>
                  </div>
                  <p className="mt-3 text-sm text-ink-muted">{review.comment}</p>
                </article>
              ))
            )}
          </div>
        </div>

        {session?.user ? (
          hasPurchased ? (
            <VideoReviewForm
              videoId={video.id}
              initialRating={currentUserReview?.rating ?? 5}
              initialComment={currentUserReview?.comment ?? ""}
              hasExistingReview={Boolean(currentUserReview)}
            />
          ) : (
            <div className="rounded-md border border-line bg-surface p-5 shadow-resting">
              <h2 className="text-xl font-semibold text-ink">Laisser une note et un commentaire</h2>
              <p className="mt-2 text-sm text-ink-muted">Les avis sont reserves aux acheteurs de cette video.</p>
            </div>
          )
        ) : (
          <div className="rounded-md border border-line bg-surface p-5 shadow-resting">
            <h2 className="text-xl font-semibold text-ink">Laisser une note et un commentaire</h2>
            <p className="mt-2 text-sm text-ink-muted">Connecte-toi pour partager ton avis sur cette video.</p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-sm bg-accent px-5 py-2 font-semibold text-white transition-colors hover:bg-accent-deep"
            >
              Se connecter
            </Link>
          </div>
        )}
      </section>

      <Link href="/catalogue" className="mt-6 inline-block text-sm text-accent hover:text-accent-deep">
        Retour au catalogue
      </Link>
    </section>
  );
}
