import { authOptions } from "@/lib/auth";
import { computeCommissionAmounts, getEffectiveCommissionBps } from "@/lib/commission";
import { prisma } from "@/lib/prisma";
import { getStripeServerClient } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

const bodySchema = z.object({
  videoId: z.string().min(1)
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const video = await prisma.video.findUnique({
    where: { id: parsed.data.videoId },
    include: {
      coach: {
        select: {
          name: true,
          commissionBps: true,
          coachStripeAccount: {
            select: {
              stripeConnectId: true,
              stripeChargesEnabled: true,
              stripePayoutsEnabled: true
            }
          }
        }
      }
    }
  });

  if (!video || !video.isPublished) {
    return NextResponse.json({ error: "Video introuvable" }, { status: 404 });
  }

  const coachStripeAccount = video.coach.coachStripeAccount;
  if (
    !coachStripeAccount?.stripeConnectId ||
    !coachStripeAccount.stripeChargesEnabled ||
    !coachStripeAccount.stripePayoutsEnabled
  ) {
    return NextResponse.json(
      { error: "Ce coach n'a pas encore de compte de paiement pleinement configure. Achat impossible pour le moment." },
      { status: 409 }
    );
  }

  const existing = await prisma.purchase.findUnique({
    where: {
      userId_videoId: {
        userId: session.user.id,
        videoId: video.id
      }
    }
  });

  if (existing) {
    return NextResponse.json({ error: "Video deja achetee" }, { status: 409 });
  }

  const commissionBps = getEffectiveCommissionBps(video.commissionBpsOverride, video.coach.commissionBps);
  const { commissionAmount } = computeCommissionAmounts(video.priceCents, commissionBps);

  try {
    const stripe = getStripeServerClient();
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${baseUrl}/videos/${video.id}?payment=success`,
      cancel_url: `${baseUrl}/videos/${video.id}?payment=cancel`,
      customer_email: session.user.email ?? undefined,
      metadata: {
        userId: session.user.id,
        videoId: video.id,
        commissionBps: String(commissionBps)
      },
      payment_intent_data: {
        application_fee_amount: commissionAmount,
        transfer_data: {
          destination: coachStripeAccount.stripeConnectId
        }
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: video.priceCents,
            product_data: {
              name: video.title,
              description: `OnlyPing - ${video.level} - Coach ${video.coach.name}`
            }
          }
        }
      ]
    });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: "Session Stripe invalide" }, { status: 500 });
    }

    return NextResponse.json({ checkoutUrl: checkoutSession.url }, { status: 201 });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeAuthenticationError) {
      return NextResponse.json({ error: "Configuration Stripe invalide (cle secrete)" }, { status: 500 });
    }

    if (error instanceof Error && /STRIPE_SECRET_KEY/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    throw error;
  }
}