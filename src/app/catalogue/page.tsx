import { CatalogueFilters } from "@/components/catalogue-filters";
import { VideoCard } from "@/components/video-card";
import { prisma } from "@/lib/prisma";
import { VIDEO_LEVEL_LABELS, VIDEO_LEVEL_VALUES } from "@/lib/video-taxonomy";

type CataloguePageProps = {
  searchParams?: {
    q?: string;
    coachId?: string;
    category?: string;
    level?: string;
  };
};

const categories = [
  { value: "", label: "Toutes les categories" },
  { value: "SERVICE", label: "Service" },
  { value: "REVERS", label: "Revers" },
  { value: "COUP_DROIT", label: "Coup droit" }
];

export default async function CataloguePage({ searchParams }: CataloguePageProps) {
  const query = (searchParams?.q ?? "").trim();
  const coachId = searchParams?.coachId ?? "";
  const category = searchParams?.category ?? "";
  const rawLevel = (searchParams?.level ?? "").toUpperCase();
  const level = VIDEO_LEVEL_VALUES.includes(rawLevel as (typeof VIDEO_LEVEL_VALUES)[number]) ? rawLevel : "";

  const videoWhere = {
    isPublished: true,
    deletedAt: null,
    ...(query ? { title: { contains: query, mode: "insensitive" as const } } : {}),
    ...(coachId ? { coachId } : {}),
    ...(category ? { category } : {}),
    ...(level ? { level } : {})
  };

  const [coaches, videos] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: { in: ["COACH", "ADMIN"] },
        videos: { some: { isPublished: true, deletedAt: null } }
      },
      select: {
        id: true,
        name: true
      },
      orderBy: { name: "asc" }
    }),
    prisma.video.findMany({
      where: videoWhere,
      select: {
        id: true,
        title: true,
        thumbnail: true,
        category: true,
        level: true,
        durationMin: true,
        priceCents: true,
        coach: {
          select: {
            name: true,
            avatarUrl: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return (
    <section className="mx-auto max-w-7xl px-3 sm:px-4 py-12">
      <h1 className="font-display text-4xl font-semibold text-ink">Catalogue des videos</h1>
      <p className="mt-2 text-ink-muted">
        Choisis ta prochaine seance selon ton niveau et travaille avec les methodes des entraineurs.
      </p>

      <CatalogueFilters
        coaches={coaches.map((coach) => ({ value: coach.id, label: coach.name }))}
        categories={categories}
        levels={[
          { value: "", label: "Tous les niveaux" },
          ...VIDEO_LEVEL_VALUES.map((item) => ({ value: item, label: VIDEO_LEVEL_LABELS[item] }))
        ]}
        initialQuery={query}
        initialCoachId={coachId}
        initialCategory={category}
        initialLevel={level}
      />

      {videos.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-md border border-dashed border-line bg-surface p-10 text-center">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="h-10 w-10 text-ink-faint"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={2} />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
          </svg>
          <p className="text-base font-semibold text-ink">Aucune video ne correspond a ces filtres</p>
          <p className="max-w-sm text-sm text-ink-muted">
            Essaie d&apos;elargir ta recherche, de changer de categorie ou de niveau, ou reinitialise les filtres.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => {
            const reviewCount = video.reviews.length;
            const averageRating =
              reviewCount > 0
                ? video.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
                : null;

            return (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                thumbnail={video.thumbnail}
                category={video.category}
                level={video.level}
                durationMin={video.durationMin}
                priceCents={video.priceCents}
                averageRating={averageRating}
                reviewCount={reviewCount}
                coachName={video.coach.name}
                coachAvatarUrl={video.coach.avatarUrl}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}