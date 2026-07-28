"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { isOptimizableImageUrl } from "@/lib/image-optimization";
import {
  VIDEO_CATEGORY_VALUES,
  VIDEO_LEVEL_LABELS,
  VIDEO_LEVEL_VALUES,
  toLevelLabel
} from "@/lib/video-taxonomy";

type CoachVideoSettingsFormProps = {
  videoId: string;
  initialTitle: string;
  initialDescription: string;
  initialCategory: string;
  initialLevel: string;
  initialDurationMin: number;
  initialPriceCents: number;
  initialThumbnail: string;
  effectiveCommissionBps: number;
  /** "row": collapsed behind a summary, for a compact desktop table row.
   *  "expanded": fields shown directly, for contexts already gated by a modal/sheet. */
  variant?: "row" | "expanded";
};

export function CoachVideoSettingsForm({
  videoId,
  initialTitle,
  initialDescription,
  initialCategory,
  initialLevel,
  initialDurationMin,
  initialPriceCents,
  initialThumbnail,
  effectiveCommissionBps,
  variant = "row"
}: CoachVideoSettingsFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [category, setCategory] = useState(initialCategory);
  const [level, setLevel] = useState(initialLevel);
  const [durationMin, setDurationMin] = useState(initialDurationMin);
  const [priceEuros, setPriceEuros] = useState((initialPriceCents / 100).toFixed(2));
  const [thumbnail, setThumbnail] = useState(initialThumbnail);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState(initialThumbnail);

  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreview(thumbnail.trim());
      return;
    }

    const objectUrl = URL.createObjectURL(thumbnailFile);
    setThumbnailPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [thumbnail, thumbnailFile]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const numericEuros = Number(priceEuros.replace(",", "."));
    const priceCents = Math.round(numericEuros * 100);

    if (!Number.isFinite(numericEuros) || numericEuros < 0) {
      setIsLoading(false);
      setError("Prix invalide");
      return;
    }

    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("description", description.trim());
    formData.set("category", category);
    formData.set("level", level);
    formData.set("durationMin", String(durationMin));
    formData.set("priceCents", String(priceCents));
    formData.set("thumbnail", thumbnail.trim());

    if (thumbnailFile) {
      formData.set("thumbnailFile", thumbnailFile);
    }

    const response = await fetch(`/api/coach/videos/${videoId}`, {
      method: "PATCH",
      body: formData
    });

    setIsLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Mise a jour impossible");
      return;
    }

    const payload = (await response.json().catch(() => ({}))) as { thumbnail?: string };
    if (payload.thumbnail) {
      setThumbnail(payload.thumbnail);
      setThumbnailFile(null);
    }

    setSuccess("Enregistrement valide.");

    router.refresh();
  }

  const formFields = (
      <form onSubmit={onSubmit} className="mt-3 space-y-2">
        <label className="grid gap-1 text-[11px] text-ink-muted">
          <span>Titre</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="w-full rounded-sm border border-line bg-surface-alt px-2 py-1.5 text-xs text-ink"
          />
        </label>

        <label className="grid gap-1 text-[11px] text-ink-muted">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
            rows={3}
            className="w-full rounded-sm border border-line bg-surface-alt px-2 py-1.5 text-xs text-ink"
          />
        </label>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-[11px] text-ink-muted">
            <span>Categorie</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-sm border border-line bg-surface-alt px-2 py-1.5 text-xs text-ink"
            >
              {VIDEO_CATEGORY_VALUES.map((item) => (
                <option key={item} value={item}>
                  {item === "SERVICE" ? "Service" : item === "REVERS" ? "Revers" : "Coup droit"}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-[11px] text-ink-muted">
            <span>Niveau</span>
            <select
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              className="w-full rounded-sm border border-line bg-surface-alt px-2 py-1.5 text-xs text-ink"
            >
              {VIDEO_LEVEL_VALUES.map((item) => (
                <option key={item} value={item}>
                  {VIDEO_LEVEL_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-[11px] text-ink-muted">
            <span>Duree (minutes)</span>
            <input
              value={durationMin}
              onChange={(event) => setDurationMin(Number(event.target.value))}
              type="number"
              min={1}
              required
              className="w-full rounded-sm border border-line bg-surface-alt px-2 py-1.5 text-xs text-ink"
            />
          </label>

          <label className="grid gap-1 text-[11px] text-ink-muted">
            <span>Prix (EUR)</span>
            <input
              value={priceEuros}
              onChange={(event) => setPriceEuros(event.target.value)}
              type="number"
              min={0}
              step="0.01"
              required
              className="w-full rounded-sm border border-line bg-surface-alt px-2 py-1.5 text-xs text-ink"
            />
          </label>
        </div>

        <p className="text-[11px] text-ink-muted">Commission du site: {(effectiveCommissionBps / 100).toFixed(2)}%</p>

        <label className="grid gap-1 text-[11px] text-ink-muted">
          <span>URL miniature</span>
          <input
            value={thumbnail}
            onChange={(event) => setThumbnail(event.target.value)}
            className="w-full rounded-sm border border-line bg-surface-alt px-2 py-1.5 text-xs text-ink"
          />
        </label>

        <label className="grid gap-1 text-[11px] text-ink-muted">
          <span>Fichier miniature</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            onChange={(event) => setThumbnailFile(event.target.files?.[0] ?? null)}
            className="w-full rounded-sm border border-line bg-surface-alt px-2 py-1.5 text-xs text-ink file:mr-2 file:rounded file:border-0 file:bg-line file:px-2 file:py-1 file:text-ink"
          />
        </label>

        {thumbnailPreview ? (
          <div>
            <p className="mb-1 text-[11px] text-ink-muted">Apercu miniature</p>
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-sm border border-line">
              <Image
                fill
                src={thumbnailPreview}
                alt="Apercu miniature"
                unoptimized={!isOptimizableImageUrl(thumbnailPreview)}
                sizes="(max-width: 768px) 100vw, 480px"
                className="object-cover"
              />
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-sm bg-accent px-2 py-1.5 text-xs font-semibold text-white hover:bg-accent-deep disabled:opacity-60"
        >
          {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>

        {error ? <p className="text-[11px] text-danger">{error}</p> : null}
        {success ? <p className="text-[11px] text-success">{success}</p> : null}
      </form>
  );

  if (variant === "expanded") {
    return (
      <div className="rounded-md border border-line bg-surface p-2">
        <p className="text-xs font-semibold text-ink">Modifier la video</p>
        {formFields}
      </div>
    );
  }

  return (
    <details className="group rounded-md border border-line bg-surface p-2">
      <summary className="flex cursor-pointer items-center gap-1.5 rounded-sm px-1 py-1 text-xs font-semibold text-ink transition-colors hover:bg-surface-alt">
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 shrink-0 text-ink-muted">
          <path
            d="M13.5 3.5l3 3-9 9H4.5v-3l9-9z"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Modifier la video ({toLevelLabel(level)})
      </summary>

      {formFields}
    </details>
  );
}
