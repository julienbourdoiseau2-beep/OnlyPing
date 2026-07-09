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

  try {
    const url = await buildOnboardingUrl(session.user.id, session.user.email);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("coach-stripe-onboard-error", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: `Impossible de generer le lien de configuration : ${message}` }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "COACH" && session.user.role !== "ADMIN") || !session.user.email) {
    return NextResponse.redirect(new URL("/login", getAppBaseUrl()));
  }

  try {
    const url = await buildOnboardingUrl(session.user.id, session.user.email);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("coach-stripe-onboard-error", error);
    return NextResponse.redirect(new URL("/dashboard?stripe_error=1", getAppBaseUrl()));
  }
}
