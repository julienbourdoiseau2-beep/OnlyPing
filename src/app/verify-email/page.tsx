"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

function VerifyEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [verified, setVerified] = useState(false);
  const sent = searchParams.get("sent") === "1";

  useEffect(() => {
    if (session?.user?.emailVerified) {
      setVerified(true);
    }
  }, [session?.user?.emailVerified]);

  useEffect(() => {
    if (!verified) {
      return;
    }

    const timeout = setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1500);

    return () => clearTimeout(timeout);
  }, [verified, router]);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsVerifying(true);

    const response = await fetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() })
    });

    setIsVerifying(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Code invalide.");
      return;
    }

    await update();
    setVerified(true);
  }

  async function handleResend() {
    setIsResending(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/auth/resend-verification", {
      method: "POST"
    });

    setIsResending(false);

    if (!response.ok) {
      setMessage("Impossible d’envoyer le code pour le moment.");
      return;
    }

    setMessage("Un nouveau code a été envoyé à ton adresse email.");
  }

  return (
    <section className="mx-auto max-w-lg px-3 sm:px-4 py-12">
      <h1 className="text-4xl font-bold">Vérification email</h1>
      <p className="mt-2 text-[#b8c1cd]">
        Entre le code à 6 chiffres reçu par email pour débloquer l’accès à OnlyPing.
      </p>

      <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-[#12161b]/80 p-6">
        {verified ? (
          <p className="text-sm text-[#90e0ef]">Ton adresse email a bien été vérifiée. Redirection...</p>
        ) : (
          <>
            {sent ? <p className="text-sm text-[#d7dde5]">Un code de vérification a été envoyé par email.</p> : null}

            <form onSubmit={handleVerify} className="space-y-3">
              <label className="block text-sm text-[#b8c1cd]">
                Code de vérification
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                  className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-center text-2xl tracking-[0.5em] text-[#edf1f6] outline-none focus:border-white/35"
                  placeholder="000000"
                  required
                />
              </label>

              {error ? <p className="text-sm text-[#ff6b6b]">{error}</p> : null}

              <button
                type="submit"
                disabled={isVerifying || code.length !== 6}
                className="w-full rounded-full border border-white/20 bg-[#2d3540] px-4 py-2 font-semibold text-[#edf1f6] hover:bg-[#3a4452] disabled:opacity-60"
              >
                {isVerifying ? "Vérification..." : "Vérifier"}
              </button>
            </form>

            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="w-full text-sm text-[#cfd6df] hover:text-white disabled:opacity-60"
            >
              {isResending ? "Envoi..." : "Renvoyer le code"}
            </button>

            {message ? <p className="text-sm text-[#90e0ef]">{message}</p> : null}

            <div className="pt-2">
              <Link href="/login" className="text-sm text-[#cfd6df] hover:text-white">
                Se connecter avec un autre compte
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<section className="mx-auto max-w-lg px-3 sm:px-4 py-12" />}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
