"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PublishToggleButtonProps = {
  videoId: string;
  isPublished: boolean;
};

export function PublishToggleButton({ videoId, isPublished }: PublishToggleButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const nextStatus = !isPublished;

  async function handleClick() {
    setError("");
    setIsLoading(true);

    const response = await fetch(`/api/coach/videos/${videoId}/publish`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ isPublished: nextStatus })
    });

    setIsLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Action impossible");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={`rounded-full border px-3 py-1 text-xs font-semibold transition disabled:opacity-60 ${
          isPublished
            ? "border-[#7c2d12] bg-[#b45309] text-white hover:bg-[#c26812]"
            : "border-[#166534] bg-[#15803d] text-white hover:bg-[#1d9350]"
        }`}
      >
        {isLoading ? "..." : isPublished ? "Depublier" : "Publier"}
      </button>
      <p className="mt-1 text-[11px] text-[#b8c1cd]">Etat: {isPublished ? "En ligne" : "Brouillon"}</p>
      {error ? <p className="mt-1 text-xs text-[#ff6b6b]">{error}</p> : null}
    </div>
  );
}