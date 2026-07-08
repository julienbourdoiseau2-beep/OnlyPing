"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsLoading(true);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    });

    setIsLoading(false);

    if (!response.ok) {
      setError("Impossible d’envoyer la demande pour le moment.");
      return;
    }

    setMessage("Si un compte existe, un lien de réinitialisation a été envoyé.");
  }

  return (
    <section className="mx-auto max-w-lg px-3 sm:px-4 py-12">
      <h1 className="text-4xl font-bold">Mot de passe oublié</h1>
      <p className="mt-2 text-[#b8c1cd]">Entre ton email pour recevoir un lien de réinitialisation.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-[#12161b]/80 p-6">
        <label className="block text-sm text-[#b8c1cd]">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6] outline-none focus:border-white/35"
            required
          />
        </label>

        {error ? <p className="text-sm text-[#ff6b6b]">{error}</p> : null}
        {message ? <p className="text-sm text-[#90e0ef]">{message}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full border border-white/20 bg-[#2d3540] px-4 py-2 font-semibold text-[#edf1f6] hover:bg-[#3a4452] disabled:opacity-60"
        >
          {isLoading ? "Envoi..." : "Envoyer le lien"}
        </button>
      </form>

      <p className="mt-4 text-sm text-[#b8c1cd]">
        Retour à <Link className="text-[#cfd6df] hover:text-white" href="/login">la connexion</Link>
      </p>
    </section>
  );
}
