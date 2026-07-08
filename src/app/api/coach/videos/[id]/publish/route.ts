import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "COACH" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as { isPublished?: boolean } | null;
  if (!payload || typeof payload.isPublished !== "boolean") {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const video = await prisma.video.findUnique({
    where: { id: context.params.id },
    select: { id: true, coachId: true }
  });

  if (!video) {
    return NextResponse.json({ error: "Video introuvable" }, { status: 404 });
  }

  if (session.user.role !== "ADMIN" && video.coachId !== session.user.id) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  if (payload.isPublished) {
    const coachStripeAccount = await prisma.coachStripeAccount.findUnique({
      where: { userId: video.coachId },
      select: { stripeChargesEnabled: true, stripePayoutsEnabled: true }
    });

    if (!coachStripeAccount?.stripeChargesEnabled || !coachStripeAccount.stripePayoutsEnabled) {
      return NextResponse.json(
        {
          error: "Configure ton compte de paiement avant de publier une video.",
          onboardingUrl: "/api/coach/stripe/onboard"
        },
        { status: 403 }
      );
    }
  }

  const updated = await prisma.video.update({
    where: { id: video.id },
    data: { isPublished: payload.isPublished },
    select: { id: true, isPublished: true }
  });

  return NextResponse.json(updated);
}