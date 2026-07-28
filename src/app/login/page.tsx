"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginPageContent() {
  const [email, setEmail] = useState("coach@onlyping.fr");
  const [password, setPassword] = useState("coach1234");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "ok";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    const result = await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirect: false
    });

    setIsLoading(false);

    if (result?.error) {
      setError("Identifiants invalides.");
      return;
    }

    router.push("/mes-achats");
    router.refresh();
  };

  return (
    <section className="mx-auto max-w-lg px-3 sm:px-4 py-12">
      <h1 className="text-4xl font-bold">Connexion</h1>
      <p className="mt-2 text-ink-muted">Entre avec un compte utilisateur ou coach.</p>

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

        <label className="block text-sm text-ink-muted">
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-sm border border-line bg-surface-alt px-3 py-2 text-ink outline-none focus:border-accent"
            required
          />
        </label>

        <p className="text-right text-sm">
          <Link className="text-ink-muted hover:text-ink" href="/forgot-password">
            Mot de passe oublie ?
          </Link>
        </p>

        {resetSuccess ? <p className="text-sm text-ink-muted">Mot de passe mis a jour. Tu peux te connecter.</p> : null}

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full bg-accent px-4 py-2 font-semibold text-white transition-colors hover:bg-accent-deep disabled:opacity-60"
        >
          {isLoading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <p className="mt-4 text-sm text-ink-muted">
        Pas encore de compte ? <Link className="text-ink-muted hover:text-ink" href="/register">Creer un compte</Link>
      </p>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<section className="mx-auto max-w-lg px-3 sm:px-4 py-12" />}>
      <LoginPageContent />
    </Suspense>
  );
}