"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email: normalizedEmail, password })
    });

    if (!response.ok) {
      setIsLoading(false);
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Inscription impossible.");
      return;
    }

    const login = await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirect: false
    });

    setIsLoading(false);

    if (login?.error) {
      router.push("/login");
      return;
    }

    router.push("/verify-email?sent=1");
    router.refresh();
  }

  return (
    <section className="mx-auto max-w-lg px-3 sm:px-4 py-12">
      <h1 className="text-4xl font-bold">Creer un compte</h1>
      <p className="mt-2 text-ink-muted">Inscris-toi pour acheter et lire tes videos techniques.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-md border border-line bg-surface shadow-resting p-6">
        <label className="block text-sm text-ink-muted">
          Nom
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-sm border border-line bg-surface-alt px-3 py-2 text-ink outline-none focus:border-accent"
            required
          />
        </label>

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

        <label className="block text-sm text-ink-muted">
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-sm border border-line bg-surface-alt px-3 py-2 text-ink outline-none focus:border-accent"
            minLength={8}
            required
          />
        </label>

        <label className="block text-sm text-ink-muted">
          Confirmer le mot de passe
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="mt-1 w-full rounded-sm border border-line bg-surface-alt px-3 py-2 text-ink outline-none focus:border-accent"
            minLength={8}
            required
          />
        </label>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full bg-accent px-4 py-2 font-semibold text-white transition-colors hover:bg-accent-deep disabled:opacity-60"
        >
          {isLoading ? "Creation..." : "Creer mon compte"}
        </button>
      </form>

      <p className="mt-4 text-sm text-ink-muted">
        Deja inscrit ? <Link className="text-ink-muted hover:text-ink" href="/login">Connecte-toi</Link>
      </p>
    </section>
  );
}