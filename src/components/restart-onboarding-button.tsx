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
        className="w-full rounded-full bg-accent px-4 py-2 font-semibold text-white transition-colors hover:bg-accent-deep disabled:opacity-60"
      >
        {isLoading ? "Redirection..." : "Completer mon compte de paiement"}
      </button>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
