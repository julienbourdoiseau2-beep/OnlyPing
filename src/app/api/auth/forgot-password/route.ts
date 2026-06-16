import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/password-reset";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email()
});

function getBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.APP_URL ??
    "http://localhost:3000"
  );
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, "auth-forgot-password", { windowMs: 15 * 60 * 1000, max: 8 });
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
    select: { id: true, passwordHash: true }
  });

  // Response is intentionally generic to avoid account enumeration.
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const token = createPasswordResetToken(user.id, user.passwordHash);
  const resetUrl = `${getBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;

  if (process.env.NODE_ENV !== "production") {
    console.info(`[password-reset] ${email} -> ${resetUrl}`);
    return NextResponse.json({ ok: true, resetUrl });
  }

  // TODO: brancher un provider email transactionnel en production.
  return NextResponse.json({ ok: true });
}
