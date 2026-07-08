import { authOptions } from "@/lib/auth";
import { createCoachOnboardingLink, getAppBaseUrl, getOrCreateCoachStripeAccountId } from "@/lib/stripe-connect";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

async function buildOnboardingUrl(userId: string, email: string) {
  const stripeConnectId = await getOrCreateCoachStripeAccountId(userId, email);
  return createCoachOnboardingLink(stripeConnectId);
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "COACH" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  if (!session.user.email) {
    return NextResponse.json({ error: "Email de session manquant" }, { status: 400 });
  }

  const url = await buildOnboardingUrl(session.user.id, session.user.email);
  return NextResponse.json({ url });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "COACH" && session.user.role !== "ADMIN") || !session.user.email) {
    return NextResponse.redirect(new URL("/login", getAppBaseUrl()));
  }

  const url = await buildOnboardingUrl(session.user.id, session.user.email);
  return NextResponse.redirect(url);
}
