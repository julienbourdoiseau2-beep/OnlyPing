import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";

const bodySchema = z.object({
  email: z.string().email()
});

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
}

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit(request, "auth-forgot-password", { windowMs: 15 * 60 * 1000, max: 8 });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "Trop de tentatives. Reessaie plus tard." }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true }
  });

  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpiry
    }
  });

  const resetUrl = `${getBaseUrl()}/reset-password?token=${encodeURIComponent(resetToken)}`;

  await sendEmail({
    to: user.email,
    subject: "Réinitialise ton mot de passe OnlyPing",
    html: `<p>Bonjour ${user.name || "there"},</p><p>Pour réinitialiser ton mot de passe, clique ici :</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Ce lien expire dans 1h.</p>`
  });

  return NextResponse.json({ ok: true });
}
