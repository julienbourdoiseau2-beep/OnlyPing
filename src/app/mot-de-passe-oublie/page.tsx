"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type ForgotPasswordResponse = {
  resetUrl?: string;
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setResetUrl(null);
    setIsLoading(true);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    });

    setIsLoading(false);

    if (!response.ok) {
      setError("Impossible d'envoyer la demande pour le moment.");
      return;
    }

    const payload = (await response.json().catch(() => ({}))) as ForgotPasswordResponse;

    setMessage("Si un compte existe, un lien de reinitialisation a ete genere.");
    if (payload.resetUrl) {
      setResetUrl(payload.resetUrl);
    }
  }

  return (
    <section className="mx-auto max-w-lg px-3 sm:px-4 py-12">
      <h1 className="text-4xl font-bold">Mot de passe oublie</h1>
      <p className="mt-2 text-[#cbd5e1]">Entre ton email pour recevoir un lien de reinitialisation.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-black/30 p-6">
        <label className="block text-sm text-[#cbd5e1]">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#f8fafc] outline-none focus:border-[#48cae4]"
            required
          />
        </label>

        {error ? <p className="text-sm text-[#ff6b6b]">{error}</p> : null}
        {message ? <p className="text-sm text-[#90e0ef]">{message}</p> : null}

        {resetUrl ? (
          <p className="text-sm text-[#cbd5e1]">
            Environnement local: ouvre ce lien de test{" "}
            <a href={resetUrl} className="text-[#90e0ef] hover:text-[#48cae4] underline break-all">
              {resetUrl}
            </a>
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full bg-[#00b4d8] px-4 py-2 font-semibold text-[#04111d] hover:bg-[#48cae4] disabled:opacity-60"
        >
          {isLoading ? "Envoi..." : "Envoyer le lien"}
        </button>
      </form>

      <p className="mt-4 text-sm text-[#cbd5e1]">
        Retour a la connexion? <Link className="text-[#90e0ef] hover:text-[#48cae4]" href="/login">Connecte-toi</Link>
      </p>
    </section>
  );
}
