"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function BecomeCoachPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState({
    fullName: "",
    address: "",
    phone: "",
    ibanOrStripeInfo: "",
    message: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");

  if (!session?.user) {
    return (
      <section className="mx-auto max-w-lg px-3 sm:px-4 py-12">
        <h1 className="text-4xl font-bold">Accès réservé</h1>
        <p className="mt-2 text-[#b8c1cd]">Connecte-toi pour déposer une demande.</p>
        <Link href="/login" className="mt-4 inline-block text-[#cfd6df] hover:text-white">
          Aller à la connexion
        </Link>
      </section>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const response = await fetch("/api/coach-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    setIsLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Impossible d’envoyer la demande.");
      return;
    }

    setSuccess("Ta demande a bien été envoyée. Un administrateur la traitera prochainement.");
    setForm({ fullName: "", address: "", phone: "", ibanOrStripeInfo: "", message: "" });
    router.refresh();
  }

  return (
    <section className="mx-auto max-w-lg px-3 sm:px-4 py-12">
      <h1 className="text-4xl font-bold">Devenir coach</h1>
      <p className="mt-2 text-[#b8c1cd]">Présente ton profil et tes coordonnées pour rejoindre OnlyPing.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-[#12161b]/80 p-6">
        <label className="block text-sm text-[#b8c1cd]">
          Nom complet
          <input
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6] outline-none focus:border-white/35"
            required
          />
        </label>
        <label className="block text-sm text-[#b8c1cd]">
          Adresse
          <input
            value={form.address}
            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6] outline-none focus:border-white/35"
            required
          />
        </label>
        <label className="block text-sm text-[#b8c1cd]">
          Téléphone
          <input
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6] outline-none focus:border-white/35"
            required
          />
        </label>
        <label className="block text-sm text-[#b8c1cd]">
          IBAN ou identifiant Stripe Connect
          <input
            value={form.ibanOrStripeInfo}
            onChange={(event) => setForm((prev) => ({ ...prev, ibanOrStripeInfo: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6] outline-none focus:border-white/35"
            required
          />
        </label>
        <label className="block text-sm text-[#b8c1cd]">
          Message (optionnel)
          <textarea
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            className="mt-1 min-h-24 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6] outline-none focus:border-white/35"
          />
        </label>

        {error ? <p className="text-sm text-[#ff6b6b]">{error}</p> : null}
        {success ? <p className="text-sm text-[#90e0ef]">{success}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full border border-white/20 bg-[#2d3540] px-4 py-2 font-semibold text-[#edf1f6] hover:bg-[#3a4452] disabled:opacity-60"
        >
          {isLoading ? "Envoi..." : "Envoyer ma demande"}
        </button>
      </form>
    </section>
  );
}
