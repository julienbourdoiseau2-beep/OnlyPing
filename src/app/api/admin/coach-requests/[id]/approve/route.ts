import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const requestRecord = await prisma.coachRequest.findUnique({ where: { id: params.id } });
  if (!requestRecord) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.coachRequest.update({
      where: { id: requestRecord.id },
      data: { status: "APPROVED", reviewedAt: new Date() }
    }),
    prisma.user.update({
      where: { id: requestRecord.userId },
      data: { role: "COACH" }
    })
  ]);

  return NextResponse.redirect(new URL("/admin/coach-requests", process.env.NEXTAUTH_URL || "http://localhost:3000"));
}
