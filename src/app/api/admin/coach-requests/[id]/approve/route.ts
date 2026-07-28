import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const requestRecord = await prisma.coachRequest.findUnique({
    where: { id: params.id },
    include: { user: { select: { email: true, name: true } } }
  });
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

  await sendEmail({
    to: requestRecord.user.email,
    subject: "Ta candidature coach OnlyPing a ete approuvee",
    html: `<p>Bonjour ${requestRecord.user.name},</p><p>Bonne nouvelle : ta candidature pour devenir coach sur OnlyPing a ete approuvee.</p><p>Rends-toi sur ton <a href="${appUrl}/dashboard">espace coach</a> pour configurer ton compte de paiement Stripe et publier tes premieres videos.</p>`
  }).catch((error) => {
    console.error("Envoi email approbation coach echoue", error);
  });

  return NextResponse.redirect(new URL("/admin/coach-requests", process.env.NEXTAUTH_URL || "http://localhost:3000"));
}
