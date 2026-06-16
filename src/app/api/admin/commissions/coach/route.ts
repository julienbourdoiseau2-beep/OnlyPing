import { authOptions } from "@/lib/auth";
import { sanitizeCommissionBps } from "@/lib/commission";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  coachId: z.string().min(1),
  commissionBps: z.number().int().min(0).max(10000)
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

  const commissionBps = sanitizeCommissionBps(parsed.data.commissionBps);
  if (commissionBps === null) {
    return NextResponse.json({ error: "Commission invalide" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.coachId },
    select: { id: true, role: true }
  });

  if (!user || (user.role !== "COACH" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Coach introuvable" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { commissionBps },
    select: {
      id: true,
      name: true,
      commissionBps: true
    }
  });

  return NextResponse.json(updated);
}
