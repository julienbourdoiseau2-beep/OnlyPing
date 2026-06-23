import { VideoCard } from "@/components/video-card";
import { prisma } from "@/lib/prisma";
import { VIDEO_LEVEL_LABELS, VIDEO_LEVEL_VALUES } from "@/lib/video-taxonomy";

type CataloguePageProps = {
  searchParams?: {
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
  const coachId = searchParams?.coachId ?? "";
  const category = searchParams?.category ?? "";
  const rawLevel = (searchParams?.level ?? "").toUpperCase();
  const level = VIDEO_LEVEL_VALUES.includes(rawLevel as (typeof VIDEO_LEVEL_VALUES)[number]) ? rawLevel : "";

  const videoWhere = {
    isPublished: true,
    deletedAt: null,
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
        }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const videoIds = videos.map((video) => video.id);
  const reviewStats =
    videoIds.length > 0
      ? await prisma.review.groupBy({
          by: ["videoId"],
          where: {
            videoId: { in: videoIds }
          },
          _count: {
            _all: true
          },
          _avg: {
            rating: true
          }
        })
      : [];

  const reviewStatsByVideoId = new Map(
    reviewStats.map((row) => [row.videoId, { averageRating: row._avg.rating, reviewCount: row._count._all }])
  );

  return (
    <section className="mx-auto max-w-7xl px-3 sm:px-4 py-12">
      <h1 className="text-4xl font-bold">Catalogue des videos</h1>
      <p className="mt-2 text-[#8b949e]">
        Choisis ta prochaine seance selon ton niveau et travaille avec les methodes des entraineurs.
      </p>

      <form className="mt-6 grid gap-3 rounded-[10px] border border-[#30363d] bg-[#161b22] p-4 md:grid-cols-5 md:items-end">
        <label className="text-sm text-[#8b949e]">
          Entraineur
          <select
            name="coachId"
            defaultValue={coachId}
            className="mt-1 w-full rounded-[10px] border border-[#30363d] bg-[#21262d] px-3 py-2 text-sm text-[#e6edf3]"
          >
            <option value="">Tous les entraineurs</option>
            {coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-[#8b949e]">
          Categorie
          <select
            name="category"
            defaultValue={category}
            className="mt-1 w-full rounded-[10px] border border-[#30363d] bg-[#21262d] px-3 py-2 text-sm text-[#e6edf3]"
          >
            {categories.map((item) => (
              <option key={item.label} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-[#8b949e]">
          Niveau
          <select
            name="level"
            defaultValue={level}
            className="mt-1 w-full rounded-[10px] border border-[#30363d] bg-[#21262d] px-3 py-2 text-sm text-[#e6edf3]"
          >
            <option value="">Tous les niveaux</option>
            {VIDEO_LEVEL_VALUES.map((item) => (
              <option key={item} value={item}>
                {VIDEO_LEVEL_LABELS[item]}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="rounded-[8px] bg-[#f5c842] px-5 py-2 font-semibold text-[#0d1117] hover:bg-[#e6b83a]"
        >
          Filtrer
        </button>

        <a
          href="/catalogue"
          className="inline-flex items-center justify-center rounded-[8px] border border-[#30363d] bg-[#21262d] px-5 py-2 text-sm font-medium text-[#e6edf3] hover:bg-[#161b22]"
        >
          Reinitialiser
        </a>
      </form>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => {
          const stats = reviewStatsByVideoId.get(video.id);
          const averageRating = stats?.averageRating ?? null;
          const reviewCount = stats?.reviewCount ?? 0;

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

      {videos.length === 0 ? <p className="mt-6 text-sm text-[#8b949e]">Aucune video pour ces filtres.</p> : null}
    </section>
  );
}