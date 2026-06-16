import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toLevelLabel } from "@/lib/video-taxonomy";
import { PurchaseButton } from "@/components/purchase-button";
import { VideoReviewForm } from "@/components/video-review-form";

type Params = {
  params: { id: string };
};

function shouldUseUnoptimizedImage(src: string) {
  return !src.startsWith("/");
}

export default async function VideoDetailsPage({ params }: Params) {
  const session = await getServerSession(authOptions);

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

  if (!video || !video.isPublished) {
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

  const canWatch =
    !!session?.user &&
    (session.user.role === "ADMIN" || session.user.id === video.coachId || hasPurchased);
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
      {showThumbnail ? (
        <Image
          unoptimized={shouldUseUnoptimizedImage(video.thumbnail)}
          src={video.thumbnail}
          alt={video.title}
          width={1280}
          height={512}
          sizes="100vw"
          className="h-64 w-full rounded-[10px] border border-[#30363d] object-cover"
        />
      ) : null}
      <div className="mt-4 flex items-center gap-2">
        <span className="rounded-full bg-[#2a2010] px-2.5 py-1 text-xs font-medium text-[#f5c842]">{categoryLabel}</span>
        <p className="text-sm uppercase tracking-wider text-[#8b949e]">{toLevelLabel(video.level)}</p>
      </div>
      <h1 className="mt-2 text-4xl font-bold">{video.title}</h1>
      <p className="mt-4 text-[#e6edf3]">{video.description}</p>

      <div className="mt-8 grid gap-6 rounded-[10px] border border-[#30363d] bg-[#161b22] p-6 md:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="text-xl font-semibold">Avant achat: ce que tu vas trouver</h2>
          <ul className="mt-3 space-y-2 text-sm text-[#8b949e]">
            <li>- Video complete sans coupure</li>
            <li>- Demonstrations techniques en rythme reel</li>
            <li>- Conseils actionnables pour tes prochaines seances</li>
            <li>- Acces immediat apres paiement</li>
          </ul>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[10px] border border-[#30363d] bg-[#21262d] p-3">
              <p className="text-xs text-[#8b949e]">Niveau</p>
              <p className="mt-1 font-medium">{toLevelLabel(video.level)}</p>
            </div>
            <div className="rounded-[10px] border border-[#30363d] bg-[#21262d] p-3">
              <p className="text-xs text-[#8b949e]">Duree</p>
              <p className="mt-1 font-medium">{video.durationMin} min</p>
            </div>
            <div className="rounded-[10px] border border-[#30363d] bg-[#21262d] p-3">
              <p className="text-xs text-[#8b949e]">Prix</p>
              <p className="mt-1 text-lg font-bold text-[#f5c842]">{(video.priceCents / 100).toFixed(2)} EUR</p>
            </div>
          </div>
        </div>

        <aside className="rounded-[10px] border border-[#30363d] bg-[#21262d] p-4">
          <p className="text-sm text-[#8b949e]">Coach</p>
          <div className="mt-2 flex items-center gap-3">
            {video.coach.avatarUrl ? (
              <Image
                unoptimized={shouldUseUnoptimizedImage(video.coach.avatarUrl)}
                src={video.coach.avatarUrl}
                alt={video.coach.name}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0f1724] text-sm font-semibold">
                {video.coach.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <p className="text-lg font-semibold">{video.coach.name}</p>
          </div>
          {video.coach.coachProfile?.bio ? (
            <p className="mt-3 text-sm text-[#e6edf3]">{video.coach.coachProfile.bio}</p>
          ) : null}
          {video.coach.coachProfile?.specialty ? (
            <p className="mt-2 text-sm text-[#8b949e]">Specialite: {video.coach.coachProfile.specialty}</p>
          ) : null}
        </aside>

        {canWatch ? (
          <div className="mt-6 rounded-[10px] border border-[#30363d] bg-[#21262d] p-3 md:col-span-2">
            <video controls className="w-full rounded-lg" src={`/api/videos/${video.id}/stream`} />
          </div>
        ) : session?.user ? (
          <div className="md:col-span-2">
            <p className="mb-3 text-sm text-[#8b949e]">La lecture complete se debloque apres achat.</p>
            <PurchaseButton videoId={video.id} />
          </div>
        ) : (
          <Link
            href="/login"
            className="mt-6 inline-block rounded-[8px] bg-[#f5c842] px-5 py-2 font-semibold text-[#0d1117] hover:bg-[#e6b83a] md:col-span-2"
          >
            Connecte-toi pour acheter
          </Link>
        )}
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[10px] border border-[#30363d] bg-[#161b22] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Avis</h2>
              <p className="mt-1 text-sm text-[#8b949e]">
                {averageRating ? `${averageRating.toFixed(1)} / 5` : "Pas encore de note"} · {video.reviews.length} commentaire{video.reviews.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {video.reviews.length === 0 ? (
              <p className="text-sm text-[#8b949e]">Aucun commentaire pour le moment.</p>
            ) : (
              video.reviews.map((review) => (
                <article key={review.id} className="rounded-[10px] border border-[#30363d] bg-[#21262d] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {review.user.avatarUrl ? (
                        <Image
                          unoptimized={shouldUseUnoptimizedImage(review.user.avatarUrl)}
                          src={review.user.avatarUrl}
                          alt={review.user.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f1724] text-sm font-semibold text-[#e6edf3]">
                          {review.user.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-[#e6edf3]">{review.user.name}</p>
                        <p className="text-xs text-[#8b949e]">{new Date(review.updatedAt).toLocaleDateString("fr-FR")}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-[#f5c842]">{review.rating} / 5</p>
                  </div>
                  <p className="mt-3 text-sm text-[#d7dde5]">{review.comment}</p>
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
            <div className="rounded-[10px] border border-[#30363d] bg-[#161b22] p-5">
              <h2 className="text-xl font-semibold">Laisser une note et un commentaire</h2>
              <p className="mt-2 text-sm text-[#8b949e]">Les avis sont reserves aux acheteurs de cette video.</p>
            </div>
          )
        ) : (
          <div className="rounded-[10px] border border-[#30363d] bg-[#161b22] p-5">
            <h2 className="text-xl font-semibold">Laisser une note et un commentaire</h2>
            <p className="mt-2 text-sm text-[#8b949e]">Connecte-toi pour partager ton avis sur cette video.</p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-[8px] bg-[#f5c842] px-5 py-2 font-semibold text-[#0d1117] hover:bg-[#e6b83a]"
            >
              Se connecter
            </Link>
          </div>
        )}
      </section>

      <Link href="/catalogue" className="mt-6 inline-block text-sm text-[#f5c842] hover:text-[#e6b83a]">
        Retour au catalogue
      </Link>
    </section>
  );
}