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
      <p className="mt-2 text-[#b8c1cd]">Inscris-toi pour acheter et lire tes videos techniques.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-[#12161b]/80 p-6">
        <label className="block text-sm text-[#b8c1cd]">
          Nom
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6] outline-none focus:border-white/35"
            required
          />
        </label>

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
            minLength={8}
            required
          />
        </label>

        <label className="block text-sm text-[#b8c1cd]">
          Confirmer le mot de passe
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6] outline-none focus:border-white/35"
            minLength={8}
            required
          />
        </label>

        {error ? <p className="text-sm text-[#ff6b6b]">{error}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full border border-white/20 bg-[#2d3540] px-4 py-2 font-semibold text-[#edf1f6] hover:bg-[#3a4452] disabled:opacity-60"
        >
          {isLoading ? "Creation..." : "Creer mon compte"}
        </button>
      </form>

      <p className="mt-4 text-sm text-[#b8c1cd]">
        Deja inscrit ? <Link className="text-[#cfd6df] hover:text-white" href="/login">Connecte-toi</Link>
      </p>
    </section>
  );
}