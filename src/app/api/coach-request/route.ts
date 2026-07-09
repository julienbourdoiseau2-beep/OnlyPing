import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const bodySchema = z.object({
  fullName: z.string().min(2).max(120),
  address: z.string().min(2).max(240),
  phone: z.string().min(4).max(40),
  message: z.string().max(1000).optional().or(z.literal(""))
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const requestRecord = await prisma.coachRequest.create({
    data: {
      userId: session.user.id,
      fullName: parsed.data.fullName.trim(),
      address: parsed.data.address.trim(),
      phone: parsed.data.phone.trim(),
      message: parsed.data.message?.trim() || null
    },
    include: {
      user: { select: { email: true, name: true } }
    }
  });

  const adminEmail = process.env.ADMIN_EMAIL || "admin@onlyping.fr";
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/admin/coach-requests/${requestRecord.id}`;

  await sendEmail({
    to: adminEmail,
    subject: "Nouvelle demande de coach OnlyPing",
    html: `<p>Une nouvelle demande de coach a été enregistrée.</p><p>Utilisateur : ${requestRecord.user.name} (${requestRecord.user.email})</p><p>Voir la demande : <a href="${adminUrl}">${adminUrl}</a></p>`
  });

  return NextResponse.json({ ok: true, requestId: requestRecord.id });
}
