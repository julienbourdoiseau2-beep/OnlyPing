import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  avatarUrl: z.string().trim().max(500).optional().or(z.literal(""))
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      createdAt: true
    }
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const avatarUrlValue = parsed.data.avatarUrl?.trim() ?? "";

  if (avatarUrlValue && !avatarUrlValue.startsWith("/")) {
    const urlValidation = z.string().url().safeParse(avatarUrlValue);
    if (!urlValidation.success) {
      return NextResponse.json({ error: "URL de photo invalide" }, { status: 400 });
    }
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing && existing.id !== session.user.id) {
    return NextResponse.json({ error: "Cet email est deja utilise" }, { status: 409 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      email,
      avatarUrl: avatarUrlValue || null
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true
    }
  });

  return NextResponse.json(updated);
}