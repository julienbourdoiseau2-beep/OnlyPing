import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  code: z.string().trim().length(6)
});

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit(request, "auth-verify-code", { windowMs: 10 * 60 * 1000, max: 8 });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "Trop de tentatives. Reessaie plus tard." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Code invalide" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true, verificationCode: true, verificationCodeExpiry: true }
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ ok: true });
  }

  const isExpired = !user.verificationCodeExpiry || user.verificationCodeExpiry < new Date();
  if (!user.verificationCode || isExpired || user.verificationCode !== parsed.data.code) {
    return NextResponse.json({ error: "Code invalide ou expire" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      emailVerified: true,
      verificationCode: null,
      verificationCodeExpiry: null
    }
  });

  return NextResponse.json({ ok: true });
}
