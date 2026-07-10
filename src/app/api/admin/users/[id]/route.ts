import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  if (params.id === session.user.id) {
    return NextResponse.json(
      { error: "Utilise la suppression de compte depuis ton profil pour te supprimer toi-meme" },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      role: true,
      coachStripeAccount: { select: { stripeConnectId: true } }
    }
  });

  if (!target) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  if (target.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Impossible de supprimer le dernier administrateur" }, { status: 400 });
    }
  }

  if (target.coachStripeAccount?.stripeConnectId) {
    return NextResponse.json(
      {
        error:
          "Ce compte est relie a un compte de paiement Stripe actif. Retire-lui d'abord son role coach avant de le supprimer."
      },
      { status: 409 }
    );
  }

  // RGPD : on anonymise plutot que de supprimer la ligne, pour conserver l'historique
  // d'achats necessaire aux obligations comptables (facturation 10 ans).
  const anonymizedEmail = `deleted-${target.id}-${randomUUID()}@deleted.onlyping.local`;
  const invalidatedPasswordHash = await bcrypt.hash(randomUUID(), 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: target.id },
      data: {
        name: "Utilisateur supprime",
        email: anonymizedEmail,
        avatarUrl: null,
        passwordHash: invalidatedPasswordHash,
        role: "USER",
        emailVerified: false,
        resetToken: null,
        resetTokenExpiry: null,
        verificationCode: null,
        verificationCodeExpiry: null
      }
    }),
    prisma.coachRequest.updateMany({
      where: { userId: target.id },
      data: {
        fullName: "Utilisateur supprime",
        address: "Supprime",
        phone: "Supprime",
        message: null
      }
    })
  ]);

  return NextResponse.json({ ok: true });
}
