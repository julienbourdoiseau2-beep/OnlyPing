"use client";

import { useState } from "react";

type PurchaseButtonProps = {
  videoId: string;
};

export function PurchaseButton({ videoId }: PurchaseButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasConsented, setHasConsented] = useState(false);

  async function handlePurchase() {
    if (!hasConsented) {
      setError("Merci de confirmer la case ci-dessus avant de payer.");
      return;
    }

    setError("");
    setIsLoading(true);

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId })
    });

    setIsLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Achat impossible");
      return;
    }

    const payload = (await response.json()) as { checkoutUrl?: string };
    if (!payload.checkoutUrl) {
      setError("URL de paiement indisponible");
      return;
    }

    window.location.href = payload.checkoutUrl;
  }

  return (
    <div>
      <label className="mt-6 flex items-start gap-2 text-xs text-[#b8c1cd]">
        <input
          type="checkbox"
          checked={hasConsented}
          onChange={(event) => setHasConsented(event.target.checked)}
          className="mt-0.5"
        />
        <span>
          Je demande l&apos;acces immediat a cette video numerique et je reconnais renoncer a mon droit de
          retractation de 14 jours des lors que la lecture aura commence (article L.221-28 du Code de la
          consommation).
        </span>
      </label>

      <button
        type="button"
        onClick={handlePurchase}
        disabled={isLoading || !hasConsented}
        className="mt-3 rounded-full border border-white/20 bg-[#2d3540] px-5 py-2 font-semibold text-[#f1f5f9] hover:bg-[#3a4452] disabled:opacity-60"
      >
        {isLoading ? "Redirection..." : "Payer avec Stripe"}
      </button>
      {error ? <p className="mt-2 text-sm text-[#ff6b6b]">{error}</p> : null}
    </div>
  );
}