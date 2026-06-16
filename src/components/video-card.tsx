import Image from "next/image";
import Link from "next/link";
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

function shouldUseUnoptimizedImage(src: string) {
  return !src.startsWith("/");
}

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
    return "bg-[#1c3a2a] text-[#52b788]";
  }
  if (category === "COUP_DROIT") {
    return "bg-[#2a1515] text-[#e05c5c]";
  }
  return "bg-[#2a2010] text-[#f5c842]";
}

export function VideoCard({ id, title, thumbnail, category, level, durationMin, priceCents, averageRating, reviewCount, coachName, coachAvatarUrl }: VideoCardProps) {
  const euroPrice = (priceCents / 100).toFixed(2);
  const showThumbnail = Boolean(thumbnail && thumbnail !== "/uploads/default-thumb.jpg");

  return (
    <article className="group rounded-[10px] border border-[#30363d] bg-[#161b22] p-4 transition hover:border-[#f5c842]">
      {showThumbnail ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[8px]">
          <Image
            fill
            unoptimized={shouldUseUnoptimizedImage(thumbnail)}
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

      <p className="mt-2 text-xs uppercase tracking-wider text-[#8b949e]">{toLevelLabel(level)}</p>
      <h3 className="mt-2 text-lg font-semibold text-[#e6edf3]">{title}</h3>
      <div className="mt-2 flex items-center gap-2 text-sm text-[#8b949e]">
        {coachAvatarUrl ? (
          <Image
            unoptimized={shouldUseUnoptimizedImage(coachAvatarUrl)}
            src={coachAvatarUrl}
            alt={coachName}
            width={24}
            height={24}
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : null}
        <p>Par {coachName}</p>
      </div>
      <p className="mt-1 text-sm text-[#8b949e]">{durationMin} min</p>
      <p className="mt-1 text-sm text-[#8b949e]">
        {averageRating === null ? "Pas encore d'avis" : `${averageRating.toFixed(1)} / 5`} · {reviewCount} avis
      </p>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-xl font-bold text-[#f5c842]">{euroPrice} EUR</span>
        <Link
          href={`/videos/${id}`}
          className="rounded-[8px] bg-[#f5c842] px-3 py-1.5 text-sm font-semibold text-[#0d1117] transition hover:bg-[#e6b83a]"
        >
          Voir
        </Link>
      </div>
    </article>
  );
}