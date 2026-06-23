"use client";

import { useMemo, useState } from "react";
import { getEffectiveCommissionBps } from "@/lib/commission";
import { toLevelLabel } from "@/lib/video-taxonomy";
import { CoachVideoSettingsForm } from "@/components/coach-video-settings-form";
import { DeleteVideoButton } from "@/components/delete-video-button";
import { PublishToggleButton } from "@/components/publish-toggle-button";

type CoachVideoMobileItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  durationMin: number;
  priceCents: number;
  thumbnail: string;
  isPublished: boolean;
  commissionBpsOverride: number | null;
};

type CoachVideosMobileManagerProps = {
  videos: CoachVideoMobileItem[];
  coachCommissionBps: number | null;
};

export function CoachVideosMobileManager({ videos, coachCommissionBps }: CoachVideosMobileManagerProps) {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const selectedVideo = useMemo(
    () => videos.find((video) => video.id === selectedVideoId) ?? null,
    [selectedVideoId, videos]
  );

  if (videos.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#12161b]/80 p-4 text-sm text-[#94a3b8]">
        Aucune video pour le moment.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {videos.map((video) => {
          const effectiveCommission = getEffectiveCommissionBps(video.commissionBpsOverride, coachCommissionBps);

          return (
            <button
              key={video.id}
              type="button"
              onClick={() => setSelectedVideoId(video.id)}
              className="w-full rounded-2xl border border-white/10 bg-[#12161b]/80 p-4 text-left hover:bg-[#182033]"
            >
              <h3 className="text-base font-semibold text-[#e6edf3]">{video.title}</h3>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#b8c1cd]">
                <p>
                  <span className="text-[#8b949e]">Categorie:</span> {video.category}
                </p>
                <p>
                  <span className="text-[#8b949e]">Niveau:</span> {toLevelLabel(video.level)}
                </p>
                <p>
                  <span className="text-[#8b949e]">Prix:</span> {(video.priceCents / 100).toFixed(2)} EUR
                </p>
                <p>
                  <span className="text-[#8b949e]">Commission:</span> {(effectiveCommission / 100).toFixed(2)} %
                </p>
                <p className="col-span-2">
                  <span className="text-[#8b949e]">Publiee:</span> {video.isPublished ? "Oui" : "Non"}
                </p>
              </div>
              <p className="mt-3 text-xs text-[#8b949e]">Touchez pour modifier</p>
            </button>
          );
        })}
      </div>

      {selectedVideo ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/50" role="dialog" aria-modal="true">
          <div className="max-h-[88vh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-[#12161b] p-4">
            <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-white/20" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-[#e6edf3]">{selectedVideo.title}</p>
                <p className="mt-1 text-xs text-[#8b949e]">{toLevelLabel(selectedVideo.level)} · {selectedVideo.durationMin} min</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVideoId(null)}
                className="rounded border border-white/20 px-2 py-1 text-xs text-[#d7dde5]"
              >
                Fermer
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <CoachVideoSettingsForm
                videoId={selectedVideo.id}
                initialTitle={selectedVideo.title}
                initialDescription={selectedVideo.description}
                initialCategory={selectedVideo.category}
                initialLevel={selectedVideo.level}
                initialDurationMin={selectedVideo.durationMin}
                initialPriceCents={selectedVideo.priceCents}
                initialThumbnail={selectedVideo.thumbnail}
                effectiveCommissionBps={getEffectiveCommissionBps(selectedVideo.commissionBpsOverride, coachCommissionBps)}
              />
              <PublishToggleButton videoId={selectedVideo.id} isPublished={selectedVideo.isPublished} />
              <DeleteVideoButton videoId={selectedVideo.id} title={selectedVideo.title} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
