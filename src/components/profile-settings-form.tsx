"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type ProfileSettingsFormProps = {
  initialName: string;
  initialEmail: string;
  initialAvatarUrl: string;
  role: string;
};

function shouldUseUnoptimizedImage(src: string) {
  return !src.startsWith("/");
}

export function ProfileSettingsForm({ initialName, initialEmail, initialAvatarUrl, role }: ProfileSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  async function uploadAvatarFile(file: File) {
    setProfileError("");
    setProfileSuccess("");
    setIsUploadingAvatar(true);

    const formData = new FormData();
    formData.append("avatar", file);

    const response = await fetch("/api/profile/avatar", {
      method: "POST",
      body: formData
    });

    setIsUploadingAvatar(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setProfileError(payload.error ?? "Upload avatar impossible");
      return;
    }

    const payload = (await response.json().catch(() => ({}))) as { avatarUrl?: string };
    if (payload.avatarUrl) {
      setAvatarUrl(payload.avatarUrl);
      setProfileSuccess("Photo de profil mise a jour.");
      router.refresh();
    }
  }

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setIsSavingProfile(true);

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, avatarUrl })
    });

    setIsSavingProfile(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setProfileError(payload.error ?? "Mise a jour impossible");
      return;
    }

    setProfileSuccess("Profil mis a jour.");
    router.refresh();
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 8) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 8 caracteres.");
      return;
    }

    setIsSavingPassword(true);

    const response = await fetch("/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    setIsSavingPassword(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setPasswordError(payload.error ?? "Changement impossible");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setPasswordSuccess("Mot de passe mis a jour.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={updateProfile} className="rounded-2xl border border-white/10 bg-[#12161b]/80 p-6">
        <h2 className="text-2xl font-semibold">Informations</h2>
        <p className="mt-1 text-sm text-[#b8c1cd]">Role actuel: {role}</p>

        <label className="mt-4 block text-sm text-[#b8c1cd]">
          Nom
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6] outline-none focus:border-white/35"
            required
          />
        </label>

        <label className="mt-3 block text-sm text-[#b8c1cd]">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6] outline-none focus:border-white/35"
            required
          />
        </label>

        <label className="mt-3 block text-sm text-[#b8c1cd]">
          Photo de profil {(role === "COACH" || role === "ADMIN") ? "coach" : ""} (URL)
          <input
            type="text"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            placeholder="https://... ou /uploads/avatars/..."
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6] outline-none focus:border-white/35"
          />
        </label>

        <label className="mt-3 block text-sm text-[#b8c1cd]">
          Ou importer une photo (telephone inclus)
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void uploadAvatarFile(file);
              }
            }}
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6] file:mr-3 file:rounded file:border-0 file:bg-[#3a4452] file:px-3 file:py-1 file:text-[#edf1f6]"
          />
        </label>

        {isUploadingAvatar ? <p className="mt-2 text-sm text-[#d7dde5]">Upload de la photo...</p> : null}

        {avatarUrl ? (
          <Image
            unoptimized={shouldUseUnoptimizedImage(avatarUrl)}
            src={avatarUrl}
            alt="Apercu photo profil"
            width={64}
            height={64}
            className="mt-3 h-16 w-16 rounded-full border border-white/20 object-cover"
          />
        ) : null}

        {profileError ? <p className="mt-3 text-sm text-[#ff6b6b]">{profileError}</p> : null}
        {profileSuccess ? <p className="mt-3 text-sm text-[#d7dde5]">{profileSuccess}</p> : null}

        <button
          type="submit"
          disabled={isSavingProfile}
          className="mt-4 rounded-full border border-white/20 bg-[#2d3540] px-5 py-2 font-semibold text-[#edf1f6] hover:bg-[#3a4452] disabled:opacity-60"
        >
          {isSavingProfile ? "Sauvegarde..." : "Mettre a jour"}
        </button>
      </form>

      <form onSubmit={updatePassword} className="rounded-2xl border border-white/10 bg-[#12161b]/80 p-6">
        <h2 className="text-2xl font-semibold">Mot de passe</h2>
        <p className="mt-1 text-sm text-[#b8c1cd]">Change ton mot de passe en securite.</p>

        <label className="mt-4 block text-sm text-[#b8c1cd]">
          Mot de passe actuel
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6] outline-none focus:border-white/35"
            required
          />
        </label>

        <label className="mt-3 block text-sm text-[#b8c1cd]">
          Nouveau mot de passe
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-[#edf1f6] outline-none focus:border-white/35"
            minLength={8}
            required
          />
        </label>

        {passwordError ? <p className="mt-3 text-sm text-[#ff6b6b]">{passwordError}</p> : null}
        {passwordSuccess ? <p className="mt-3 text-sm text-[#d7dde5]">{passwordSuccess}</p> : null}

        <button
          type="submit"
          disabled={isSavingPassword}
          className="mt-4 rounded-full border border-white/20 bg-[#2d3540] px-5 py-2 font-semibold text-[#edf1f6] hover:bg-[#3a4452] disabled:opacity-60"
        >
          {isSavingPassword ? "Mise a jour..." : "Changer le mot de passe"}
        </button>
      </form>
    </div>
  );
}