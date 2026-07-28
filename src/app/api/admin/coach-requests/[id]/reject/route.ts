import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
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

  const formData = await request.formData().catch(() => null);
  const reason = formData?.get("reason")?.toString().trim() || "";

  await prisma.coachRequest.update({
    where: { id: requestRecord.id },
    data: { status: "REJECTED", reviewedAt: new Date() }
  });

  await sendEmail({
    to: requestRecord.user.email,
    subject: "A propos de ta candidature coach OnlyPing",
    html: `<p>Bonjour ${requestRecord.user.name},</p><p>Nous t'informons que ta candidature pour devenir coach sur OnlyPing n'a pas ete retenue pour le moment.</p>${
      reason ? `<p>Motif : ${reason}</p>` : ""
    }<p>Tu peux deposer une nouvelle candidature a tout moment depuis la page "Devenir coach".</p>`
  }).catch((error) => {
    console.error("Envoi email rejet coach echoue", error);
  });

  return NextResponse.redirect(new URL("/admin/coach-requests", process.env.NEXTAUTH_URL || "http://localhost:3000"));
}
