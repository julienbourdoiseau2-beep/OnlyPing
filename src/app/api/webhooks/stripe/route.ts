import { prisma } from "@/lib/prisma";
import { computeCommissionAmounts, getEffectiveCommissionBps } from "@/lib/commission";
import { getStripeServerClient } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import Stripe from "stripe";

function resolveStripeId(value: string | { id: string } | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

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
        const metadataCommissionBps = Number(checkoutSession.metadata?.commissionBps);
        const commissionBps = Number.isInteger(metadataCommissionBps)
          ? metadataCommissionBps
          : getEffectiveCommissionBps(video.commissionBpsOverride, video.coach.commissionBps);
        const { commissionAmount, coachNetAmount } = computeCommissionAmounts(video.priceCents, commissionBps);

        try {
          await prisma.purchase.create({
            data: {
              userId,
              videoId,
              amount: video.priceCents,
              commissionBpsAtPurchase: commissionBps,
              commissionAmount,
              coachNetAmount,
              stripePaymentIntentId: resolveStripeId(checkoutSession.payment_intent)
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

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId = resolveStripeId(charge.payment_intent);

    if (paymentIntentId) {
      await prisma.purchase.updateMany({
        where: { stripePaymentIntentId: paymentIntentId, refundedAt: null },
        data: { refundedAt: new Date() }
      });
    }
  }

  if (event.type === "charge.dispute.created") {
    const dispute = event.data.object as Stripe.Dispute;
    const paymentIntentId = resolveStripeId(dispute.payment_intent);

    if (paymentIntentId) {
      await prisma.purchase.updateMany({
        where: { stripePaymentIntentId: paymentIntentId, disputedAt: null },
        data: { disputedAt: new Date() }
      });
    }
  }

  if (event.type === "charge.dispute.closed") {
    const dispute = event.data.object as Stripe.Dispute;
    const paymentIntentId = resolveStripeId(dispute.payment_intent);

    if (paymentIntentId) {
      if (dispute.status === "won") {
        await prisma.purchase.updateMany({
          where: { stripePaymentIntentId: paymentIntentId },
          data: { disputedAt: null }
        });
      } else if (dispute.status === "lost") {
        await prisma.purchase.updateMany({
          where: { stripePaymentIntentId: paymentIntentId, refundedAt: null },
          data: { refundedAt: new Date() }
        });
      }
    }
  }

  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;

    await prisma.coachStripeAccount.updateMany({
      where: { stripeConnectId: account.id },
      data: {
        stripeChargesEnabled: Boolean(account.charges_enabled),
        stripePayoutsEnabled: Boolean(account.payouts_enabled),
        stripeDetailsSubmitted: Boolean(account.details_submitted)
      }
    });
  }

  return NextResponse.json({ received: true });
}