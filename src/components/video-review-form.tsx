"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type VideoReviewFormProps = {
  videoId: string;
  initialRating?: number;
  initialComment?: string;
  hasExistingReview?: boolean;
};

export function VideoReviewForm({ videoId, initialRating = 5, initialComment = "", hasExistingReview = false }: VideoReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const response = await fetch(`/api/videos/${videoId}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        rating,
        comment: comment.trim()
      })
    });

    setIsLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Enregistrement impossible");
      return;
    }

    setSuccess("Avis enregistre.");
    router.refresh();
  }

  async function onDelete() {
    setError("");
    setSuccess("");
    setIsDeleting(true);

    const response = await fetch(`/api/videos/${videoId}/reviews`, {
      method: "DELETE"
    });

    setIsDeleting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Suppression impossible");
      return;
    }

    setSuccess("Avis supprime.");
    setComment("");
    setRating(5);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-md border border-line bg-surface p-5 shadow-resting">
      <h2 className="text-xl font-semibold text-ink">Laisser une note et un commentaire</h2>
      <p className="mt-1 text-sm text-ink-muted">Tu peux modifier ton avis plus tard{hasExistingReview ? " ou le supprimer" : ""}.</p>

      <label className="mt-4 grid gap-1 text-sm text-ink-muted">
        <span>Note</span>
        <select
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
          className="rounded-sm border border-line bg-surface-alt px-3 py-2 text-sm text-ink"
        >
          <option value={5}>5 / 5</option>
          <option value={4}>4 / 5</option>
          <option value={3}>3 / 5</option>
          <option value={2}>2 / 5</option>
          <option value={1}>1 / 5</option>
        </select>
      </label>

      <label className="mt-3 grid gap-1 text-sm text-ink-muted">
        <span>Commentaire</span>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          required
          minLength={3}
          maxLength={1200}
          rows={4}
          className="rounded-sm border border-line bg-surface-alt px-3 py-2 text-sm text-ink"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isLoading || isDeleting}
          className="rounded-sm bg-accent px-5 py-2 font-semibold text-white transition-colors hover:bg-accent-deep disabled:opacity-60"
        >
          {isLoading ? "Enregistrement..." : hasExistingReview ? "Mettre a jour mon avis" : "Enregistrer mon avis"}
        </button>

        {hasExistingReview ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={isLoading || isDeleting}
            className="rounded-sm border border-line bg-surface-alt px-5 py-2 font-semibold text-ink transition-colors hover:bg-line disabled:opacity-60"
          >
            {isDeleting ? "Suppression..." : "Supprimer mon avis"}
          </button>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {success ? <p className="mt-3 text-sm text-success">{success}</p> : null}
    </form>
  );
}
