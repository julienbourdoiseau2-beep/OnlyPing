"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PublishToggleButtonProps = {
  videoId: string;
  isPublished: boolean;
  canPublish: boolean;
};

export function PublishToggleButton({ videoId, isPublished, canPublish }: PublishToggleButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const nextStatus = !isPublished;
  const isBlockedByStripe = nextStatus && !canPublish;

  async function handleClick() {
    if (isBlockedByStripe) {
      return;
    }

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
        disabled={isLoading || isBlockedByStripe}
        title={isBlockedByStripe ? "Configure ton compte de paiement avant de publier une video." : undefined}
        className={`rounded-full border px-3 py-1 text-xs font-semibold transition disabled:opacity-60 ${
          isPublished
            ? "border-[#7c2d12] bg-[#b45309] text-white hover:bg-[#c26812]"
            : "border-[#166534] bg-[#15803d] text-white hover:bg-[#1d9350]"
        }`}
      >
        {isLoading ? "..." : isPublished ? "Depublier" : "Publier"}
      </button>
      <p className="mt-1 text-[11px] text-[#b8c1cd]">Etat: {isPublished ? "En ligne" : "Brouillon"}</p>
      {isBlockedByStripe ? (
        <p className="mt-1 text-[11px] text-[#ff8c42]">Compte de paiement a configurer pour publier.</p>
      ) : null}
      {error ? <p className="mt-1 text-xs text-[#ff6b6b]">{error}</p> : null}
    </div>
  );
}