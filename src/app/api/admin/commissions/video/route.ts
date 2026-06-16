import { authOptions } from "@/lib/auth";
import { sanitizeCommissionBps } from "@/lib/commission";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  videoId: z.string().min(1),
  commissionBpsOverride: z.number().int().min(0).max(10000).nullable()
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

  const commissionBpsOverride =
    parsed.data.commissionBpsOverride === null
      ? null
      : sanitizeCommissionBps(parsed.data.commissionBpsOverride);

  if (commissionBpsOverride === null && parsed.data.commissionBpsOverride !== null) {
    return NextResponse.json({ error: "Commission invalide" }, { status: 400 });
  }

  const video = await prisma.video.findUnique({
    where: { id: parsed.data.videoId },
    select: { id: true }
  });

  if (!video) {
    return NextResponse.json({ error: "Video introuvable" }, { status: 404 });
  }

  const updated = await prisma.video.update({
    where: { id: video.id },
    data: { commissionBpsOverride },
    select: {
      id: true,
      title: true,
      commissionBpsOverride: true
    }
  });

  return NextResponse.json(updated);
}
