import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileSettingsForm } from "@/components/profile-settings-form";

export default async function ProfilPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <section className="mx-auto max-w-4xl px-3 sm:px-4 py-12">
        <h1 className="text-4xl font-bold">Profil</h1>
        <p className="mt-2 text-[#b8c1cd]">Connecte-toi pour gerer ton profil.</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full border border-white/20 bg-[#2d3540] px-5 py-2 font-semibold text-[#edf1f6] hover:bg-[#3a4452]"
        >
          Se connecter
        </Link>
      </section>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      avatarUrl: true,
      role: true
    }
  });

  if (!user) {
    return (
      <section className="mx-auto max-w-4xl px-3 sm:px-4 py-12">
        <h1 className="text-4xl font-bold">Profil</h1>
        <p className="mt-2 text-[#b8c1cd]">Utilisateur introuvable.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-3 sm:px-4 py-12">
      <h1 className="text-4xl font-bold">Profil utilisateur</h1>
      <p className="mt-2 text-[#b8c1cd]">Mets a jour tes informations et ton mot de passe.</p>

      <div className="mt-8">
        <ProfileSettingsForm
          initialName={user.name}
          initialEmail={user.email}
          initialAvatarUrl={user.avatarUrl ?? ""}
          role={user.role}
        />
      </div>
    </section>
  );
}