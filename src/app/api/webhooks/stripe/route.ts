import { prisma } from "@/lib/prisma";
import { computeCommissionAmounts, getEffectiveCommissionBps } from "@/lib/commission";
import { getStripeServerClient } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import Stripe from "stripe";

function resolveStripeId(value: string | { id: string } | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
}

async function findPurchaseWithParties(paymentIntentId: string) {
  return prisma.purchase.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
    select: {
      amount: true,
      user: { select: { name: true, email: true } },
      video: {
        select: {
          id: true,
          title: true,
          coach: { select: { name: true, email: true } }
        }
      }
    }
  });
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
          title: true,
          priceCents: true,
          commissionBpsOverride: true,
          coach: {
            select: {
              name: true,
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

        let created = false;

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
          created = true;
        } catch (error) {
          if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
            throw error;
          }
        }

        if (created) {
          const buyer = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
          if (buyer) {
            const appUrl = getAppUrl();
            await sendEmail({
              to: buyer.email,
              subject: `Ton achat OnlyPing : ${video.title}`,
              html: `<p>Bonjour ${buyer.name},</p><p>Merci pour ton achat ! Ta video est disponible des maintenant :</p><p><a href="${appUrl}/videos/${videoId}">${video.title}</a></p><p>Montant : ${(video.priceCents / 100).toFixed(2)} EUR</p><p>Tu retrouveras toutes tes videos achetees depuis <a href="${appUrl}/mes-achats">Mes achats</a>.</p>`
            }).catch((error) => {
              console.error("Envoi email confirmation achat echoue", error);
            });
          }
        }
      }
    }
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId = resolveStripeId(charge.payment_intent);

    if (paymentIntentId) {
      const result = await prisma.purchase.updateMany({
        where: { stripePaymentIntentId: paymentIntentId, refundedAt: null },
        data: { refundedAt: new Date() }
      });

      if (result.count > 0) {
        const purchase = await findPurchaseWithParties(paymentIntentId);
        if (purchase?.video.coach.email) {
          const appUrl = getAppUrl();
          await sendEmail({
            to: purchase.video.coach.email,
            subject: `Vente remboursee - ${purchase.video.title}`,
            html: `<p>Bonjour ${purchase.video.coach.name},</p><p>Une vente de ta video <strong>${purchase.video.title}</strong> (${(purchase.amount / 100).toFixed(2)} EUR) vient d'etre remboursee. Ce montant ne sera pas verse (ou sera deduit) sur ton prochain versement.</p><p>Voir le detail depuis ton <a href="${appUrl}/dashboard">espace coach</a>.</p>`
          }).catch((error) => {
            console.error("Envoi email remboursement au coach echoue", error);
          });
        }
      }
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

      const purchase = await findPurchaseWithParties(paymentIntentId);
      const appUrl = getAppUrl();
      const dueBy = dispute.evidence_details?.due_by
        ? new Date(dispute.evidence_details.due_by * 1000).toLocaleString("fr-FR")
        : "non communique par Stripe";

      const adminEmail = process.env.ADMIN_EMAIL || "admin@onlyping.fr";
      await sendEmail({
        to: adminEmail,
        subject: `Litige Stripe ouvert${purchase ? ` - ${purchase.video.title}` : ""}`,
        html: `<p>Un litige (chargeback) vient d'etre ouvert sur un paiement.</p>` +
          (purchase
            ? `<p>Video : ${purchase.video.title}<br/>Client : ${purchase.user.name} (${purchase.user.email})<br/>Montant : ${(purchase.amount / 100).toFixed(2)} EUR</p>`
            : "") +
          `<p><strong>Date limite pour repondre au litige : ${dueBy}.</strong></p>` +
          `<p>Voir le detail dans le <a href="https://dashboard.stripe.com/disputes">dashboard Stripe</a> et le suivi des achats : <a href="${appUrl}/admin/achats">${appUrl}/admin/achats</a></p>`
      }).catch((error) => {
        console.error("Envoi email alerte litige Stripe echoue", error);
      });

      if (purchase?.video.coach.email) {
        await sendEmail({
          to: purchase.video.coach.email,
          subject: `Litige en cours sur une vente - ${purchase.video.title}`,
          html: `<p>Bonjour ${purchase.video.coach.name},</p><p>Un client conteste le paiement d'une vente de ta video <strong>${purchase.video.title}</strong> (${(purchase.amount / 100).toFixed(2)} EUR). Notre equipe s'en occupe aupres de Stripe.</p><p>Tant que le litige est en cours, ce montant est mis de cote et n'apparait plus dans tes ventes confirmees.</p>`
        }).catch((error) => {
          console.error("Envoi email litige au coach echoue", error);
        });
      }
    }
  }

  if (event.type === "charge.dispute.closed") {
    const dispute = event.data.object as Stripe.Dispute;
    const paymentIntentId = resolveStripeId(dispute.payment_intent);

    if (paymentIntentId) {
      const purchase = await findPurchaseWithParties(paymentIntentId);

      if (dispute.status === "won") {
        await prisma.purchase.updateMany({
          where: { stripePaymentIntentId: paymentIntentId },
          data: { disputedAt: null }
        });

        if (purchase?.video.coach.email) {
          await sendEmail({
            to: purchase.video.coach.email,
            subject: `Litige resolu en ta faveur - ${purchase.video.title}`,
            html: `<p>Bonjour ${purchase.video.coach.name},</p><p>Bonne nouvelle : le litige sur la vente de <strong>${purchase.video.title}</strong> a ete resolu en ta faveur. Le montant reapparait dans tes ventes confirmees.</p>`
          }).catch((error) => {
            console.error("Envoi email litige gagne au coach echoue", error);
          });
        }
      } else if (dispute.status === "lost") {
        await prisma.purchase.updateMany({
          where: { stripePaymentIntentId: paymentIntentId, refundedAt: null },
          data: { refundedAt: new Date() }
        });

        if (purchase?.video.coach.email) {
          await sendEmail({
            to: purchase.video.coach.email,
            subject: `Litige perdu, vente remboursee - ${purchase.video.title}`,
            html: `<p>Bonjour ${purchase.video.coach.name},</p><p>Le litige sur la vente de <strong>${purchase.video.title}</strong> (${(purchase.amount / 100).toFixed(2)} EUR) a ete perdu : le montant est rembourse au client et ne te sera pas verse.</p>`
          }).catch((error) => {
            console.error("Envoi email litige perdu au coach echoue", error);
          });
        }
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
