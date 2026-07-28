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
      <p className="mt-2 text-ink-muted">Entre ton email pour recevoir un lien de réinitialisation.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-md border border-line bg-surface shadow-resting p-6">
        <label className="block text-sm text-ink-muted">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-sm border border-line bg-surface-alt px-3 py-2 text-ink outline-none focus:border-accent"
            required
          />
        </label>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {message ? <p className="text-sm text-info">{message}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full bg-accent px-4 py-2 font-semibold text-white transition-colors hover:bg-accent-deep disabled:opacity-60"
        >
          {isLoading ? "Envoi..." : "Envoyer le lien"}
        </button>
      </form>

      <p className="mt-4 text-sm text-ink-muted">
        Retour à <Link className="text-ink-muted hover:text-ink" href="/login">la connexion</Link>
      </p>
    </section>
  );
}
