"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PaymentStatusBannerProps = {
  status: "success" | "cancel" | null;
  canWatch: boolean;
};

const MAX_POLL_ATTEMPTS = 8;
const POLL_INTERVAL_MS = 2000;

export function PaymentStatusBanner({ status, canWatch }: PaymentStatusBannerProps) {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (status !== "success" || canWatch) {
      return;
    }

    if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {
      return;
    }

    const timeout = setTimeout(() => {
      attemptsRef.current += 1;
      setAttempts(attemptsRef.current);
      router.refresh();
    }, POLL_INTERVAL_MS);

    return () => clearTimeout(timeout);
  }, [status, canWatch, attempts, router]);

  if (!status) {
    return null;
  }

  if (status === "cancel") {
    return (
      <div className="mb-6 rounded-md border border-line bg-surface-alt p-4 text-sm text-ink">
        Paiement annule. Tu peux reessayer quand tu veux, aucune somme n&apos;a ete prelevee.
      </div>
    );
  }

  if (canWatch) {
    return (
      <div className="mb-6 rounded-md border border-success/30 bg-success-bg p-4 text-sm font-medium text-success">
        Merci pour ton achat, la video est debloquee.
      </div>
    );
  }

  if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {
    return (
      <div className="mb-6 rounded-md border border-line bg-surface-alt p-4 text-sm text-ink-muted">
        Paiement recu, l&apos;activation prend un peu plus de temps que prevu. Recharge la page dans une minute ; si le
        probleme persiste, verifie l&apos;etat de l&apos;achat depuis &laquo;&nbsp;Mes achats&nbsp;&raquo;.
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-center gap-3 rounded-md border border-info/30 bg-info-bg p-4 text-sm text-info">
      <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-info border-t-transparent" />
      Paiement recu, activation de la video en cours...
    </div>
  );
}
