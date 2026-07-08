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
      <p className="mt-2 text-[#b8c1cd]">Entre avec un compte utilisateur ou coach.</p>

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

        <label className="block text-sm text-[#b8c1cd]">
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6] outline-none focus:border-white/35"
            required
          />
        </label>

        <p className="text-right text-sm">
          <Link className="text-[#cfd6df] hover:text-white" href="/forgot-password">
            Mot de passe oublie ?
          </Link>
        </p>

        {resetSuccess ? <p className="text-sm text-[#d7dde5]">Mot de passe mis a jour. Tu peux te connecter.</p> : null}

        {error ? <p className="text-sm text-[#ff6b6b]">{error}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full border border-white/20 bg-[#2d3540] px-4 py-2 font-semibold text-[#edf1f6] hover:bg-[#3a4452] disabled:opacity-60"
        >
          {isLoading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <p className="mt-4 text-sm text-[#b8c1cd]">
        Pas encore de compte ? <Link className="text-[#cfd6df] hover:text-white" href="/register">Creer un compte</Link>
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