"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type FormState = {
  fullName: string;
  address: string;
  phone: string;
  ranking: string;
  club: string;
  videoUrl: string;
  message: string;
};

const emptyForm: FormState = {
  fullName: "",
  address: "",
  phone: "",
  ranking: "",
  club: "",
  videoUrl: "",
  message: ""
};

function buildMessage(form: FormState) {
  const extras: string[] = [];
  if (form.ranking.trim()) extras.push(`Classement : ${form.ranking.trim()}`);
  if (form.club.trim()) extras.push(`Club : ${form.club.trim()}`);
  if (form.videoUrl.trim()) extras.push(`Video demo : ${form.videoUrl.trim()}`);

  const freeMessage = form.message.trim();
  const parts = [...extras, freeMessage].filter(Boolean);

  return parts.join("\n").slice(0, 1000);
}

export function CoachApplicationForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const response = await fetch("/api/coach-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName,
        address: form.address,
        phone: form.phone,
        message: buildMessage(form)
      })
    });

    setIsLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Impossible d'envoyer la candidature.");
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-[#12161b]/80 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-[#b8c1cd]">
          Nom complet
          <input
            value={form.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6] outline-none focus:border-white/35"
            required
          />
        </label>
        <label className="block text-sm text-[#b8c1cd]">
          Classement (optionnel)
          <input
            value={form.ranking}
            onChange={(event) => updateField("ranking", event.target.value)}
            placeholder="Ex. N3, R2..."
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6] outline-none focus:border-white/35"
          />
        </label>
        <label className="block text-sm text-[#b8c1cd]">
          Club (optionnel)
          <input
            value={form.club}
            onChange={(event) => updateField("club", event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6] outline-none focus:border-white/35"
          />
        </label>
        <label className="block text-sm text-[#b8c1cd]">
          Lien vers une video demo (optionnel)
          <input
            type="url"
            value={form.videoUrl}
            onChange={(event) => updateField("videoUrl", event.target.value)}
            placeholder="https://..."
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6] outline-none focus:border-white/35"
          />
        </label>
        <label className="block text-sm text-[#b8c1cd]">
          Adresse
          <input
            value={form.address}
            onChange={(event) => updateField("address", event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6] outline-none focus:border-white/35"
            required
          />
        </label>
        <label className="block text-sm text-[#b8c1cd]">
          Telephone
          <input
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6] outline-none focus:border-white/35"
            required
          />
        </label>
      </div>

      <label className="block text-sm text-[#b8c1cd]">
        Message (optionnel)
        <textarea
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          className="mt-1 min-h-24 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6] outline-none focus:border-white/35"
        />
      </label>

      {error ? <p className="text-sm text-[#ff6b6b]">{error}</p> : null}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-full bg-[#F5C842] px-4 py-2 font-semibold text-[#161B22] hover:bg-[#f0ba1f] disabled:opacity-60"
      >
        {isLoading ? "Envoi..." : "Envoyer ma candidature"}
      </button>
    </form>
  );
}
