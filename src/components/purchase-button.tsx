"use client";

import { useState } from "react";

type PurchaseButtonProps = {
  videoId: string;
};

export function PurchaseButton({ videoId }: PurchaseButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePurchase() {
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
      <button
        type="button"
        onClick={handlePurchase}
        disabled={isLoading}
        className="mt-6 rounded-full border border-white/20 bg-[#2d3540] px-5 py-2 font-semibold text-[#f1f5f9] hover:bg-[#3a4452] disabled:opacity-60"
      >
        {isLoading ? "Redirection..." : "Payer avec Stripe"}
      </button>
      {error ? <p className="mt-2 text-sm text-[#ff6b6b]">{error}</p> : null}
    </div>
  );
}