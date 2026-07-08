import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripeServerClient } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RestartOnboardingButton } from "@/components/restart-onboarding-button";

export default async function CoachOnboardingReturnPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "COACH" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  const coachStripeAccount = await prisma.coachStripeAccount.findUnique({
    where: { userId: session.user.id },
    select: { stripeConnectId: true }
  });

  if (!coachStripeAccount?.stripeConnectId) {
    return (
      <section className="mx-auto max-w-lg px-3 sm:px-4 py-12">
        <h1 className="text-4xl font-bold">Compte de paiement</h1>
        <p className="mt-4 text-sm text-[#ff8c42]">
          Aucune configuration de compte de paiement n&apos;a ete trouvee. Lance l&apos;onboarding depuis ton tableau de
          bord.
        </p>
        <Link href="/dashboard" className="mt-6 inline-block text-sm text-[#cfd6df] hover:text-white">
          Retour au tableau de bord
        </Link>
      </section>
    );
  }

  const stripe = getStripeServerClient();
  const account = await stripe.accounts.retrieve(coachStripeAccount.stripeConnectId);

  const chargesEnabled = Boolean(account.charges_enabled);
  const payoutsEnabled = Boolean(account.payouts_enabled);
  const detailsSubmitted = Boolean(account.details_submitted);

  await prisma.coachStripeAccount.update({
    where: { userId: session.user.id },
    data: {
      stripeChargesEnabled: chargesEnabled,
      stripePayoutsEnabled: payoutsEnabled,
      stripeDetailsSubmitted: detailsSubmitted
    }
  });

  const isFullyActive = chargesEnabled && payoutsEnabled;

  return (
    <section className="mx-auto max-w-lg px-3 sm:px-4 py-12">
      <h1 className="text-4xl font-bold">Compte de paiement</h1>

      <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-[#12161b]/80 p-6">
        {isFullyActive ? (
          <p className="text-sm text-[#90e0ef]">Compte valide, tu peux publier des videos.</p>
        ) : (
          <>
            <p className="text-sm text-[#ff8c42]">Il reste des informations a completer sur ton compte de paiement.</p>
            <ul className="space-y-1 text-xs text-[#b8c1cd]">
              <li>Paiements entrants : {chargesEnabled ? "actives" : "en attente"}</li>
              <li>Versements : {payoutsEnabled ? "actives" : "en attente"}</li>
              <li>Informations soumises : {detailsSubmitted ? "oui" : "non"}</li>
            </ul>
            <RestartOnboardingButton />
          </>
        )}

        <div className="pt-2">
          <Link href="/dashboard" className="text-sm text-[#cfd6df] hover:text-white">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    </section>
  );
}
