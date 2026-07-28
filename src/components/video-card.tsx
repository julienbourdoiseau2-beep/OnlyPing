import Image from "next/image";
import Link from "next/link";
import { isOptimizableImageUrl } from "@/lib/image-optimization";
import { toLevelLabel } from "@/lib/video-taxonomy";

type VideoCardProps = {
  id: string;
  title: string;
  thumbnail: string;
  category: string;
  level: string;
  durationMin: number;
  priceCents: number;
  averageRating: number | null;
  reviewCount: number;
  coachName: string;
  coachAvatarUrl?: string | null;
};

function categoryLabel(category: string) {
  if (category === "REVERS") {
    return "Revers";
  }
  if (category === "COUP_DROIT") {
    return "Coup droit";
  }
  return "Service";
}

function categoryBadgeClass(category: string) {
  if (category === "REVERS") {
    return "bg-chip-revers-bg text-chip-revers-text";
  }
  if (category === "COUP_DROIT") {
    return "bg-chip-coupdroit-bg text-chip-coupdroit-text";
  }
  return "bg-chip-service-bg text-chip-service-text";
}

export function VideoCard({ id, title, thumbnail, category, level, durationMin, priceCents, averageRating, reviewCount, coachName, coachAvatarUrl }: VideoCardProps) {
  const euroPrice = (priceCents / 100).toFixed(2);
  const showThumbnail = Boolean(thumbnail && thumbnail !== "/uploads/default-thumb.jpg");

  return (
    <Link
      href={`/videos/${id}`}
      className="group block rounded-md border border-line bg-surface p-4 shadow-resting transition hover:-translate-y-0.5 hover:shadow-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {showThumbnail ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-sm">
          <Image
            fill
            unoptimized={!isOptimizableImageUrl(thumbnail)}
            src={thumbnail}
            alt={title}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className={showThumbnail ? "mt-3" : ""}>
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${categoryBadgeClass(category)}`}>
          {categoryLabel(category)}
        </span>
      </div>

      <p className="mt-2 text-xs uppercase tracking-wider text-ink-muted">{toLevelLabel(level)}</p>
      <h3 className="mt-2 text-lg font-semibold text-ink">{title}</h3>
      <div className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
        {coachAvatarUrl ? (
          <Image
            unoptimized={!isOptimizableImageUrl(coachAvatarUrl)}
            src={coachAvatarUrl}
            alt={coachName}
            width={24}
            height={24}
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : null}
        <p>Par {coachName}</p>
      </div>
      <p className="mt-1 text-sm text-ink-muted">{durationMin} min</p>
      <p className="mt-1 text-sm text-ink-muted">
        {averageRating === null ? "Pas encore d'avis" : `${averageRating.toFixed(1)} / 5`} · {reviewCount} avis
      </p>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-xl font-bold text-accent">{euroPrice} EUR</span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent transition-colors group-hover:text-accent-deep">
          Voir
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          >
            <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </Link>
  );
}