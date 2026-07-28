"use client";

import Image from "next/image";
import { signOut } from "next-auth/react";
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
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

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

  async function deleteAccount() {
    setDeleteError("");
    setIsDeleting(true);

    const response = await fetch("/api/profile", { method: "DELETE" });

    setIsDeleting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setDeleteError(payload.error ?? "Suppression impossible");
      return;
    }

    await signOut({ callbackUrl: "/" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={updateProfile} className="rounded-md border border-line bg-surface shadow-resting p-6">
        <h2 className="text-2xl font-semibold">Informations</h2>
        <p className="mt-1 text-sm text-ink-muted">Role actuel: {role}</p>

        <label className="mt-4 block text-sm text-ink-muted">
          Nom
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-sm border border-line bg-surface-alt px-3 py-2 text-ink outline-none focus:border-accent"
            required
          />
        </label>

        <label className="mt-3 block text-sm text-ink-muted">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-sm border border-line bg-surface-alt px-3 py-2 text-ink outline-none focus:border-accent"
            required
          />
        </label>

        <label className="mt-3 block text-sm text-ink-muted">
          Photo de profil {(role === "COACH" || role === "ADMIN") ? "coach" : ""} (URL)
          <input
            type="text"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            placeholder="https://... ou /uploads/avatars/..."
            className="mt-1 w-full rounded-sm border border-line bg-surface-alt px-3 py-2 text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="mt-3 block text-sm text-ink-muted">
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
            className="mt-1 w-full rounded-sm border border-line bg-surface-alt px-3 py-2 text-ink file:mr-3 file:rounded-sm file:border-0 file:bg-line file:px-3 file:py-1 file:text-ink"
          />
        </label>

        {isUploadingAvatar ? <p className="mt-2 text-sm text-ink-muted">Upload de la photo...</p> : null}

        {avatarUrl ? (
          <Image
            unoptimized={shouldUseUnoptimizedImage(avatarUrl)}
            src={avatarUrl}
            alt="Apercu photo profil"
            width={64}
            height={64}
            className="mt-3 h-16 w-16 rounded-full border border-line object-cover"
          />
        ) : null}

        {profileError ? <p className="mt-3 text-sm text-danger">{profileError}</p> : null}
        {profileSuccess ? <p className="mt-3 text-sm text-ink-muted">{profileSuccess}</p> : null}

        <button
          type="submit"
          disabled={isSavingProfile}
          className="mt-4 rounded-full bg-accent px-5 py-2 font-semibold text-white transition-colors hover:bg-accent-deep disabled:opacity-60"
        >
          {isSavingProfile ? "Sauvegarde..." : "Mettre a jour"}
        </button>
      </form>

      <form onSubmit={updatePassword} className="rounded-md border border-line bg-surface shadow-resting p-6">
        <h2 className="text-2xl font-semibold">Mot de passe</h2>
        <p className="mt-1 text-sm text-ink-muted">Change ton mot de passe en securite.</p>

        <label className="mt-4 block text-sm text-ink-muted">
          Mot de passe actuel
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="mt-1 w-full rounded-sm border border-line bg-surface-alt px-3 py-2 text-ink outline-none focus:border-accent"
            required
          />
        </label>

        <label className="mt-3 block text-sm text-ink-muted">
          Nouveau mot de passe
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="mt-1 w-full rounded-sm border border-line bg-surface-alt px-3 py-2 text-ink outline-none focus:border-accent"
            minLength={8}
            required
          />
        </label>

        {passwordError ? <p className="mt-3 text-sm text-danger">{passwordError}</p> : null}
        {passwordSuccess ? <p className="mt-3 text-sm text-ink-muted">{passwordSuccess}</p> : null}

        <button
          type="submit"
          disabled={isSavingPassword}
          className="mt-4 rounded-full bg-accent px-5 py-2 font-semibold text-white transition-colors hover:bg-accent-deep disabled:opacity-60"
        >
          {isSavingPassword ? "Mise a jour..." : "Changer le mot de passe"}
        </button>
      </form>

      <div className="rounded-md border border-danger/30 bg-danger-bg p-6 lg:col-span-2">
        <h2 className="text-2xl font-semibold text-danger">Supprimer mon compte</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Conformement au RGPD, tu peux demander la suppression de ton compte a tout moment. Tes informations
          personnelles (nom, email, mot de passe, photo) seront anonymisees immediatement et de maniere irreversible.
          Ton historique d&apos;achats est conserve de maniere anonyme pour repondre a nos obligations comptables.
        </p>
        <label className="mt-4 block text-sm text-ink-muted">
          Tape SUPPRIMER pour confirmer
          <input
            type="text"
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            className="mt-1 w-full max-w-xs rounded-sm border border-danger/30 bg-surface-alt px-3 py-2 text-ink outline-none focus:border-danger"
          />
        </label>

        {deleteError ? <p className="mt-3 text-sm text-danger">{deleteError}</p> : null}

        <button
          type="button"
          onClick={deleteAccount}
          disabled={isDeleting || deleteConfirmation !== "SUPPRIMER"}
          className="mt-4 rounded-full border border-danger/40 bg-danger/10 px-5 py-2 font-semibold text-danger transition-colors hover:bg-danger/20 disabled:opacity-50"
        >
          {isDeleting ? "Suppression..." : "Supprimer definitivement mon compte"}
        </button>
      </div>
    </div>
  );
}