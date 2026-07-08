import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";

const bodySchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(120)
});

function generateVerificationCode() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, "auth-register", { windowMs: 15 * 60 * 1000, max: 10 });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "Trop de tentatives. Reessaie plus tard." }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const name = parsed.data.name.trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Cet email est deja utilise" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const verificationCode = generateVerificationCode();
  const verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "USER",
      emailVerified: false,
      verificationCode,
      verificationCodeExpiry
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  await sendEmail({
    to: email,
    subject: "Ton code de vérification OnlyPing",
    html: `<p>Bonjour ${name},</p><p>Voici ton code de vérification OnlyPing :</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${verificationCode}</p><p>Ce code expire dans 15 minutes.</p>`
  });

  return NextResponse.json(user, { status: 201 });
}