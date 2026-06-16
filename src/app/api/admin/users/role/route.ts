import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["USER", "COACH", "ADMIN"])
});

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: {
      id: true,
      role: true
    }
  });

  if (!target) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  if (target.role === "ADMIN" && parsed.data.role !== "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" }
    });

    if (adminCount <= 1) {
      return NextResponse.json({ error: "Impossible de retirer le dernier administrateur" }, { status: 400 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { role: parsed.data.role },
    select: {
      id: true,
      name: true,
      role: true
    }
  });

  return NextResponse.json(updated);
}
