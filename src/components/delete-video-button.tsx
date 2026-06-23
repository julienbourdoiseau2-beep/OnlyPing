"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteVideoButtonProps = {
  videoId: string;
  title: string;
};

export function DeleteVideoButton({ videoId, title }: DeleteVideoButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    const confirmed = window.confirm(`Supprimer definitivement la video \"${title}\" ?`);
    if (!confirmed) {
      return;
    }

    setIsLoading(true);

    const response = await fetch(`/api/coach/videos/${videoId}`, {
      method: "DELETE"
    });

    setIsLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Suppression impossible");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isLoading}
        className="rounded-full border border-[#7f1d1d] bg-[#991b1b] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#b91c1c] disabled:opacity-60"
      >
        {isLoading ? "Suppression..." : "Supprimer"}
      </button>
      {error ? <p className="mt-1 text-xs text-[#ff6b6b]">{error}</p> : null}
    </div>
  );
}
