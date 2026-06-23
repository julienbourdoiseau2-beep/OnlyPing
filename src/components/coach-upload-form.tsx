"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { VIDEO_LEVEL_VALUES, VIDEO_LEVEL_LABELS } from "@/lib/video-taxonomy";

export function CoachUploadForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const response = await fetch("/api/coach/videos", {
      method: "POST",
      body: formData
    });

    setIsLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Upload impossible");
      return;
    }

    form.reset();
    setSuccess("Video enregistree en brouillon.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-[#12161b]/80 p-5">
      <h2 className="text-2xl font-semibold">Ajouter une video</h2>
      <p className="mt-1 text-sm text-[#b8c1cd]">Le stockage est gere automatiquement (R2 en production, local en fallback).</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          name="title"
          required
          placeholder="Titre"
          className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-[#edf1f6] outline-none focus:border-white/35"
        />
        <select
          name="level"
          defaultValue="INTERMEDIAIRE"
          className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-[#edf1f6] outline-none focus:border-white/35"
        >
          {VIDEO_LEVEL_VALUES.map((level) => (
            <option key={level} value={level}>
              {VIDEO_LEVEL_LABELS[level]}
            </option>
          ))}
        </select>
        <select
          name="category"
          defaultValue="SERVICE"
          className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-[#edf1f6] outline-none focus:border-white/35"
        >
          <option value="SERVICE">Service</option>
          <option value="REVERS">Revers</option>
          <option value="COUP_DROIT">Coup droit</option>
        </select>
        <input
          name="durationMin"
          type="number"
          min={1}
          required
          placeholder="Duree (min)"
          className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-[#edf1f6] outline-none focus:border-white/35"
        />
        <input
          name="priceCents"
          type="number"
          min={0}
          step={10}
          required
          placeholder="Prix en centimes (ex: 1990)"
          className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-[#edf1f6] outline-none focus:border-white/35"
        />
      </div>

      <textarea
        name="description"
        required
        placeholder="Description technique"
        className="mt-3 min-h-24 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-[#edf1f6] outline-none focus:border-white/35"
      />

      <label className="mt-3 block text-xs text-[#b8c1cd]">
        URL miniature (image, optionnel)
        <input
          name="thumbnail"
          placeholder="https://..."
          className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-[#edf1f6] outline-none focus:border-white/35"
        />
      </label>

      <label className="mt-3 block text-xs text-[#b8c1cd]">
        Fichier miniature (image)
        <input
          name="thumbnailFile"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-[#edf1f6] file:mr-3 file:rounded file:border-0 file:bg-[#3a4452] file:px-3 file:py-1 file:text-[#edf1f6]"
        />
      </label>

      <label className="mt-3 block text-xs text-[#b8c1cd]">
        Fichier video (obligatoire)
        <input
          name="video"
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          required
          className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-[#edf1f6] file:mr-3 file:rounded file:border-0 file:bg-[#3a4452] file:px-3 file:py-1 file:text-[#edf1f6]"
        />
      </label>

      {error ? <p className="mt-3 text-sm text-[#ff6b6b]">{error}</p> : null}
      {success ? <p className="mt-3 text-sm text-[#d7dde5]">{success}</p> : null}

      <button
        type="submit"
        disabled={isLoading}
        className="mt-4 rounded-lg bg-[#f5c842] px-5 py-2 font-semibold text-[#0d1117] hover:bg-[#e6b83a] disabled:opacity-60"
      >
        {isLoading ? "Upload..." : "Creer la video"}
      </button>
    </form>
  );
}