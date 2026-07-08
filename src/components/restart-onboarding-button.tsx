"use client";

import { useState } from "react";

export function RestartOnboardingButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setError("");
    setIsLoading(true);

    const response = await fetch("/api/coach/stripe/onboard", { method: "POST" });
    const payload = (await response.json().catch(() => ({}))) as { url?: string; error?: string };

    if (!response.ok || !payload.url) {
      setIsLoading(false);
      setError(payload.error ?? "Impossible de generer le lien de configuration.");
      return;
    }

    window.location.href = payload.url;
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="w-full rounded-full border border-white/20 bg-[#2d3540] px-4 py-2 font-semibold text-[#edf1f6] hover:bg-[#3a4452] disabled:opacity-60"
      >
        {isLoading ? "Redirection..." : "Completer mon compte de paiement"}
      </button>
      {error ? <p className="mt-2 text-sm text-[#ff6b6b]">{error}</p> : null}
    </div>
  );
}
