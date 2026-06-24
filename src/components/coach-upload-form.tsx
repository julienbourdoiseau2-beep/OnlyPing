"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { VIDEO_LEVEL_VALUES, VIDEO_LEVEL_LABELS } from "@/lib/video-taxonomy";

export function CoachUploadForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStep, setUploadStep] = useState("");
  const [priceEuros, setPriceEuros] = useState("");

  function uploadFileWithProgress(uploadUrl: string, file: File, headers?: Record<string, string>) {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      if (headers) {
        for (const [name, value] of Object.entries(headers)) {
          xhr.setRequestHeader(name, value);
        }
      } else {
        xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
      }

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) {
          return;
        }

        const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
        setUploadProgress(percent);
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
          return;
        }
        reject(new Error(`Upload HTTP ${xhr.status}`));
      };

      xhr.onerror = () => {
        reject(new Error("Erreur reseau pendant l'upload"));
      };

      xhr.send(file);
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setUploadProgress(null);
    setUploadStep("");
    setIsLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const numericEuros = Number(priceEuros.replace(",", "."));
    const priceCents = Math.round(numericEuros * 100);
    if (!Number.isFinite(numericEuros) || numericEuros < 0) {
      setIsLoading(false);
      setError("Prix invalide");
      return;
    }
    formData.delete("priceEuros");
    formData.set("priceCents", String(priceCents));

    const videoFile = formData.get("video");
    if (!(videoFile instanceof File)) {
      setIsLoading(false);
      setError("Fichier video manquant");
      return;
    }

    // Upload video directly to R2 to bypass serverless payload limits (ex: Vercel FUNCTION_PAYLOAD_TOO_LARGE).
    const signedUploadResponse = await fetch("/api/coach/videos/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: videoFile.name,
        contentType: videoFile.type || "video/mp4",
        kind: "video"
      })
    });

    if (signedUploadResponse.ok) {
      setUploadStep("Preparation de l'upload...");
      const signedPayload = (await signedUploadResponse.json()) as {
        key: string;
        uploadUrl: string;
        headers?: Record<string, string>;
      };

      setUploadStep("Envoi de la video...");
      setUploadProgress(0);

      try {
        await uploadFileWithProgress(signedPayload.uploadUrl, videoFile, signedPayload.headers);
      } catch (uploadError) {
        setIsLoading(false);
        setUploadProgress(null);
        setUploadStep("");
        const message = uploadError instanceof Error ? uploadError.message : "Upload video R2 impossible";
        setError(`${message}. Verifie la config CORS du bucket R2 (PUT, OPTIONS, origin du site).`);
        return;
      }

      setUploadProgress(100);
      setUploadStep("Finalisation...");

      formData.delete("video");
      formData.append("videoR2Key", signedPayload.key);
    } else {
      const payload = (await signedUploadResponse.json().catch(() => ({}))) as { error?: string };
      setIsLoading(false);
      setUploadProgress(null);
      setUploadStep("");
      setError(payload.error ?? "Upload direct indisponible. L'application bloque l'envoi direct a l'API pour eviter FUNCTION_PAYLOAD_TOO_LARGE.");
      return;
    }

    const thumbnailFile = formData.get("thumbnailFile");
    if (thumbnailFile instanceof File && thumbnailFile.size > 0) {
      const signedThumbResponse = await fetch("/api/coach/videos/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: thumbnailFile.name,
          contentType: thumbnailFile.type || "image/jpeg",
          kind: "thumbnail"
        })
      });

      if (!signedThumbResponse.ok) {
        const payload = (await signedThumbResponse.json().catch(() => ({}))) as { error?: string };
        setIsLoading(false);
        setUploadProgress(null);
        setUploadStep("");
        setError(payload.error ?? "Preparation miniature impossible");
        return;
      }

      const signedThumbPayload = (await signedThumbResponse.json()) as {
        key: string;
        uploadUrl: string;
        headers?: Record<string, string>;
      };

      try {
        await uploadFileWithProgress(signedThumbPayload.uploadUrl, thumbnailFile, signedThumbPayload.headers);
      } catch (thumbError) {
        const message = thumbError instanceof Error ? thumbError.message : "Upload miniature impossible";
        setIsLoading(false);
        setUploadProgress(null);
        setUploadStep("");
        setError(message);
        return;
      }

      formData.delete("thumbnailFile");
      formData.set("thumbnailR2Key", signedThumbPayload.key);
    }

    const payload = {
      title: String(formData.get("title") ?? "").trim(),
      category: String(formData.get("category") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      level: String(formData.get("level") ?? "").trim(),
      durationMin: Number(formData.get("durationMin") ?? 0),
      priceCents: Number(formData.get("priceCents") ?? 0),
      thumbnail: String(formData.get("thumbnail") ?? "").trim(),
      videoR2Key: String(formData.get("videoR2Key") ?? "").trim(),
      thumbnailR2Key: String(formData.get("thumbnailR2Key") ?? "").trim()
    };

    const response = await fetch("/api/coach/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setIsLoading(false);
    setUploadProgress(null);
    setUploadStep("");

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Upload impossible");
      return;
    }

    form.reset();
    setPriceEuros("");
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
          name="priceEuros"
          type="number"
          min={0}
          step="0.01"
          required
          value={priceEuros}
          onChange={(event) => setPriceEuros(event.target.value)}
          placeholder="Prix en euros (ex: 19.90)"
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

      {isLoading ? (
        <div className="mt-3 rounded-lg border border-white/20 bg-white/5 p-3">
          <div className="flex items-center justify-between text-xs text-[#b8c1cd]">
            <span>{uploadStep || "Traitement..."}</span>
            <span>{uploadProgress !== null ? `${uploadProgress}%` : "..."}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-[#f5c842] transition-all duration-200"
              style={{ width: `${uploadProgress ?? 15}%` }}
            />
          </div>
        </div>
      ) : null}

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