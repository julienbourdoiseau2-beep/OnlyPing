import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(120)
});

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit(request, "auth-reset-password", { windowMs: 15 * 60 * 1000, max: 8 });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "Trop de tentatives. Reessaie plus tard." }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      resetToken: parsed.data.token,
      resetTokenExpiry: { gt: new Date() }
    },
    select: { id: true }
  });

  if (!user) {
    return NextResponse.json({ error: "Lien invalide ou expire" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null
    }
  });

  return NextResponse.json({ ok: true });
}
