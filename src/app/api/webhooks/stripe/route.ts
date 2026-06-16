import { prisma } from "@/lib/prisma";
import { computeCommissionAmounts, getEffectiveCommissionBps } from "@/lib/commission";
import { getStripeServerClient } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import Stripe from "stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Configuration webhook manquante" }, { status: 400 });
  }

  let stripe: Stripe;
  try {
    stripe = getStripeServerClient();
  } catch (error) {
    if (error instanceof Error && /STRIPE_SECRET_KEY/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    throw error;
  }
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Signature webhook invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    const userId = checkoutSession.metadata?.userId;
    const videoId = checkoutSession.metadata?.videoId;

    if (userId && videoId && checkoutSession.payment_status === "paid") {
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        select: {
          priceCents: true,
          commissionBpsOverride: true,
          coach: {
            select: {
              commissionBps: true
            }
          }
        }
      });

      if (video) {
        const commissionBps = getEffectiveCommissionBps(video.commissionBpsOverride, video.coach.commissionBps);
        const { commissionAmount, coachNetAmount } = computeCommissionAmounts(video.priceCents, commissionBps);

        try {
          await prisma.purchase.create({
            data: {
              userId,
              videoId,
              amount: video.priceCents,
              commissionBpsAtPurchase: commissionBps,
              commissionAmount,
              coachNetAmount
            }
          });
        } catch (error) {
          if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
            throw error;
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}