"use client";

import { useState } from "react";

type CoachOption = {
  id: string;
  name: string;
  commissionBps: number | null;
};

type VideoOption = {
  id: string;
  title: string;
  coachName: string;
  commissionBpsOverride: number | null;
};

type AdminCommissionManagerProps = {
  coaches: CoachOption[];
  videos: VideoOption[];
};

function bpsToPercent(bps: number | null) {
  if (bps === null) {
    return "Default (30%)";
  }

  return `${(bps / 100).toFixed(2)}%`;
}

function percentToBps(percent: number) {
  return Math.round(percent * 100);
}

export function AdminCommissionManager({ coaches, videos }: AdminCommissionManagerProps) {
  const [coachId, setCoachId] = useState(coaches[0]?.id ?? "");
  const [coachCommissionPercent, setCoachCommissionPercent] = useState<number>((coaches[0]?.commissionBps ?? 3000) / 100);
  const [coachMessage, setCoachMessage] = useState("");
  const [isCoachLoading, setIsCoachLoading] = useState(false);

  const [videoId, setVideoId] = useState(videos[0]?.id ?? "");
  const [videoCommissionPercent, setVideoCommissionPercent] = useState<number>(
    (videos[0]?.commissionBpsOverride ?? 3000) / 100
  );
  const [clearOverride, setClearOverride] = useState(videos[0]?.commissionBpsOverride === null);
  const [videoMessage, setVideoMessage] = useState("");
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const selectedCoach = coaches.find((coach) => coach.id === coachId) ?? null;
  const selectedVideo = videos.find((video) => video.id === videoId) ?? null;

  async function updateCoachCommission() {
    if (!coachId) {
      return;
    }

    setCoachMessage("");
    setIsCoachLoading(true);

    const response = await fetch("/api/admin/commissions/coach", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coachId,
        commissionBps: percentToBps(coachCommissionPercent)
      })
    });

    setIsCoachLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setCoachMessage(payload.error ?? "Mise a jour impossible");
      return;
    }

    setCoachMessage("Commission coach mise a jour. Recharge la page pour voir toutes les stats recalculees.");
  }

  async function updateVideoCommission() {
    if (!videoId) {
      return;
    }

    setVideoMessage("");
    setIsVideoLoading(true);

    const response = await fetch("/api/admin/commissions/video", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId,
        commissionBpsOverride: clearOverride ? null : percentToBps(videoCommissionPercent)
      })
    });

    setIsVideoLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setVideoMessage(payload.error ?? "Mise a jour impossible");
      return;
    }

    setVideoMessage("Commission video mise a jour. Recharge la page pour voir toutes les stats recalculees.");
  }

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-[#12161b]/80 p-5">
        <h2 className="text-xl font-semibold">Commission par coach</h2>
        <p className="mt-1 text-sm text-[#94a3b8]">Definis le pourcentage retenu par la plateforme.</p>

        <div className="mt-4 space-y-3">
          <select
            value={coachId}
            onChange={(event) => {
              const newCoachId = event.target.value;
              setCoachId(newCoachId);
              const coach = coaches.find((item) => item.id === newCoachId);
              setCoachCommissionPercent((coach?.commissionBps ?? 3000) / 100);
            }}
            className="w-full rounded-lg border border-white/20 bg-[#21262d] px-3 py-2 text-sm text-[#edf1f6] [&>option]:bg-[#161b22] [&>option]:text-[#edf1f6]"
          >
            {coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.name} ({bpsToPercent(coach.commissionBps)})
              </option>
            ))}
          </select>

          <label className="block text-sm text-[#b8c1cd]">
            Commission (%)
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={coachCommissionPercent}
              onChange={(event) => setCoachCommissionPercent(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6]"
            />
          </label>

          {selectedCoach ? (
            <p className="text-xs text-[#94a3b8]">Actuel: {bpsToPercent(selectedCoach.commissionBps)}</p>
          ) : null}

          <button
            type="button"
            onClick={updateCoachCommission}
            disabled={isCoachLoading || !coachId}
            className="rounded-full border border-white/20 bg-[#2d3540] px-4 py-2 text-sm font-semibold text-[#edf1f6] hover:bg-[#3a4452] disabled:opacity-60"
          >
            {isCoachLoading ? "Enregistrement..." : "Enregistrer"}
          </button>

          {coachMessage ? <p className="text-sm text-[#d7dde5]">{coachMessage}</p> : null}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#12161b]/80 p-5">
        <h2 className="text-xl font-semibold">Commission par video</h2>
        <p className="mt-1 text-sm text-[#94a3b8]">Override optionnel pour une video specifique.</p>

        <div className="mt-4 space-y-3">
          <select
            value={videoId}
            onChange={(event) => {
              const newVideoId = event.target.value;
              setVideoId(newVideoId);
              const video = videos.find((item) => item.id === newVideoId);
              setClearOverride(video?.commissionBpsOverride === null);
              setVideoCommissionPercent((video?.commissionBpsOverride ?? 3000) / 100);
            }}
            className="w-full rounded-lg border border-white/20 bg-[#21262d] px-3 py-2 text-sm text-[#edf1f6] [&>option]:bg-[#161b22] [&>option]:text-[#edf1f6]"
          >
            {videos.map((video) => (
              <option key={video.id} value={video.id}>
                {video.title} - {video.coachName}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-[#b8c1cd]">
            <input type="checkbox" checked={clearOverride} onChange={(event) => setClearOverride(event.target.checked)} />
            Utiliser la commission par defaut du coach
          </label>

          <label className="block text-sm text-[#b8c1cd]">
            Override commission (%)
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={videoCommissionPercent}
              onChange={(event) => setVideoCommissionPercent(Number(event.target.value))}
              disabled={clearOverride}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6] disabled:opacity-50"
            />
          </label>

          {selectedVideo ? (
            <p className="text-xs text-[#94a3b8]">Actuel: {bpsToPercent(selectedVideo.commissionBpsOverride)}</p>
          ) : null}

          <button
            type="button"
            onClick={updateVideoCommission}
            disabled={isVideoLoading || !videoId}
            className="rounded-full border border-white/20 bg-[#2d3540] px-4 py-2 text-sm font-semibold text-[#edf1f6] hover:bg-[#3a4452] disabled:opacity-60"
          >
            {isVideoLoading ? "Enregistrement..." : "Enregistrer"}
          </button>

          {videoMessage ? <p className="text-sm text-[#d7dde5]">{videoMessage}</p> : null}
        </div>
      </div>
    </section>
  );
}
