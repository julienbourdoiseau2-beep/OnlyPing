"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("Lien invalide ou incomplet.");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password })
    });

    setIsLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Impossible de reinitialiser le mot de passe.");
      return;
    }

    router.push("/login?reset=ok");
  }

  return (
    <section className="mx-auto max-w-lg px-3 sm:px-4 py-12">
      <h1 className="text-4xl font-bold">Nouveau mot de passe</h1>
      <p className="mt-2 text-[#cbd5e1]">Definis un nouveau mot de passe pour ton compte.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-black/30 p-6">
        <label className="block text-sm text-[#cbd5e1]">
          Nouveau mot de passe
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#f8fafc] outline-none focus:border-[#48cae4]"
            minLength={8}
            required
          />
        </label>

        <label className="block text-sm text-[#cbd5e1]">
          Confirmer le mot de passe
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#f8fafc] outline-none focus:border-[#48cae4]"
            minLength={8}
            required
          />
        </label>

        {error ? <p className="text-sm text-[#ff6b6b]">{error}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full bg-[#00b4d8] px-4 py-2 font-semibold text-[#04111d] hover:bg-[#48cae4] disabled:opacity-60"
        >
          {isLoading ? "Mise a jour..." : "Mettre a jour"}
        </button>
      </form>

      <p className="mt-4 text-sm text-[#cbd5e1]">
        Retour a la connexion? <Link className="text-[#90e0ef] hover:text-[#48cae4]" href="/login">Connecte-toi</Link>
      </p>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<section className="mx-auto max-w-lg px-3 sm:px-4 py-12" />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
