import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import crypto from "crypto";

function generateVerificationCode() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, "auth-resend-verification", { windowMs: 15 * 60 * 1000, max: 5 });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "Trop de tentatives. Reessaie plus tard." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, emailVerified: true }
  });

  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true });
  }

  const verificationCode = generateVerificationCode();
  const verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationCode,
      verificationCodeExpiry
    }
  });

  await sendEmail({
    to: user.email,
    subject: "Ton code de vérification OnlyPing",
    html: `<p>Bonjour ${user.name || "there"},</p><p>Voici ton nouveau code de vérification OnlyPing :</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${verificationCode}</p><p>Ce code expire dans 15 minutes.</p>`
  });

  return NextResponse.json({ ok: true });
}
