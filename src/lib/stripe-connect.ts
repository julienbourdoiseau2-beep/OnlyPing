import { prisma } from "@/lib/prisma";
import { getStripeServerClient } from "@/lib/stripe";

export function getAppBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
}

export async function getOrCreateCoachStripeAccountId(userId: string, email: string) {
  const existing = await prisma.coachStripeAccount.findUnique({
    where: { userId },
    select: { stripeConnectId: true }
  });

  if (existing?.stripeConnectId) {
    return existing.stripeConnectId;
  }

  const stripe = getStripeServerClient();
  const account = await stripe.accounts.create({
    type: "express",
    country: "FR",
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true }
    }
  });

  await prisma.coachStripeAccount.upsert({
    where: { userId },
    update: { stripeConnectId: account.id },
    create: { userId, stripeConnectId: account.id }
  });

  return account.id;
}

export async function createCoachOnboardingLink(stripeConnectId: string) {
  const stripe = getStripeServerClient();
  const baseUrl = getAppBaseUrl();

  const accountLink = await stripe.accountLinks.create({
    account: stripeConnectId,
    type: "account_onboarding",
    refresh_url: `${baseUrl}/api/coach/stripe/onboard`,
    return_url: `${baseUrl}/coach/onboarding/retour`
  });

  return accountLink.url;
}
