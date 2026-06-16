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
    <form onSubmit={onSubmit} className="rounded-[10px] border border-[#30363d] bg-[#161b22] p-5">
      <h2 className="text-xl font-semibold">Laisser une note et un commentaire</h2>
      <p className="mt-1 text-sm text-[#8b949e]">Tu peux modifier ton avis plus tard{hasExistingReview ? " ou le supprimer" : ""}.</p>

      <label className="mt-4 grid gap-1 text-sm text-[#8b949e]">
        <span>Note</span>
        <select
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
          className="rounded-lg border border-[#30363d] bg-[#21262d] px-3 py-2 text-sm text-[#e6edf3]"
        >
          <option value={5}>5 / 5</option>
          <option value={4}>4 / 5</option>
          <option value={3}>3 / 5</option>
          <option value={2}>2 / 5</option>
          <option value={1}>1 / 5</option>
        </select>
      </label>

      <label className="mt-3 grid gap-1 text-sm text-[#8b949e]">
        <span>Commentaire</span>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          required
          minLength={3}
          maxLength={1200}
          rows={4}
          className="rounded-lg border border-[#30363d] bg-[#21262d] px-3 py-2 text-sm text-[#e6edf3]"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isLoading || isDeleting}
          className="rounded-[8px] bg-[#f5c842] px-5 py-2 font-semibold text-[#0d1117] hover:bg-[#e6b83a] disabled:opacity-60"
        >
          {isLoading ? "Enregistrement..." : hasExistingReview ? "Mettre a jour mon avis" : "Enregistrer mon avis"}
        </button>

        {hasExistingReview ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={isLoading || isDeleting}
            className="rounded-[8px] border border-[#30363d] bg-[#21262d] px-5 py-2 font-semibold text-[#e6edf3] hover:bg-[#30363d] disabled:opacity-60"
          >
            {isDeleting ? "Suppression..." : "Supprimer mon avis"}
          </button>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm text-[#ff6b6b]">{error}</p> : null}
      {success ? <p className="mt-3 text-sm text-[#b6f0c2]">{success}</p> : null}
    </form>
  );
}
