import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CoachApplicationForm } from "@/components/coach-application-form";

export const metadata: Metadata = {
  title: "Devenir coach - OnlyPing",
  description: "Publie tes videos techniques de ping-pong sur OnlyPing et touche 70% de chaque vente, sans abonnement."
};

const steps = [
  {
    title: "Filmez vos videos techniques",
    description: "Service, topspin, bloc, tactique... capturez vos sequences avec votre smartphone."
  },
  {
    title: "Fixez votre prix",
    description: "Vous choisissez librement le prix de vente de chaque video."
  },
  {
    title: "OnlyPing heberge et vend",
    description: "Stockage securise, paiement en ligne et mise en avant aupres d'une audience ciblee ping-pong."
  },
  {
    title: "Vous touchez votre part",
    description: "A chaque vente, le paiement est verse directement sur votre compte, sans attendre de seuil."
  }
];

const differentiators = [
  {
    title: "Hebergement securise",
    description: "Vos videos sont protegees et diffusees en streaming, sans telechargement libre ni piratage facile."
  },
  {
    title: "Paiement gere de bout en bout",
    description: "Encaissement, facturation et versement automatique : vous n'avez rien a gerer techniquement."
  },
  {
    title: "Audience ciblee ping-pong",
    description: "Contrairement a YouTube ou Instagram, vos videos sont vues par des joueurs qui cherchent activement a progresser et sont prets a payer."
  }
];

const faqItems = [
  {
    question: "Dois-je payer un abonnement ?",
    answer: "Non. Aucun abonnement, aucun frais fixe. OnlyPing preleve uniquement une commission sur chaque vente realisee."
  },
  {
    question: "Qui fixe le prix de mes videos ?",
    answer: "Vous. Chaque coach choisit librement le prix de chacune de ses videos."
  },
  {
    question: "Quel materiel pour filmer ?",
    answer: "Un smartphone recent suffit largement. Un cadrage stable, un bon eclairage et un son clair comptent plus qu'un materiel professionnel."
  },
  {
    question: "Quel est le delai de validation d'une candidature ?",
    answer: "Notre equipe examine chaque candidature sous quelques jours ouvres et revient vers vous par email."
  }
];

export default async function DevenirCoachPage() {
  const session = await getServerSession(authOptions);
  const isCoachOrAdmin = session?.user?.role === "COACH" || session?.user?.role === "ADMIN";

  const latestRequest =
    session?.user && session.user.role === "USER"
      ? await prisma.coachRequest.findFirst({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          select: { status: true }
        })
      : null;

  const heroCtaHref = !session?.user ? "/register" : isCoachOrAdmin ? "/dashboard" : "#candidature";
  const heroCtaLabel = !session?.user
    ? "Creer un compte pour devenir coach"
    : isCoachOrAdmin
      ? "Accede a ton espace coach"
      : "Deposer ma candidature";

  return (
    <div>
      <section className="mx-auto max-w-7xl px-3 sm:px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.2em] text-[#c4ccd6]">
            Programme coach OnlyPing
          </p>
          <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
            Monetisez votre expertise du tennis de table.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[#b9c2ce]">
            Publiez vos videos techniques, fixez votre prix, et touchez votre part a chaque vente. Pas
            d&apos;abonnement, pas de frais caches.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href={heroCtaHref}
              className="rounded-full bg-[#F5C842] px-8 py-3 font-semibold text-[#161B22] hover:bg-[#f0ba1f]"
            >
              {heroCtaLabel}
            </Link>
            {!session?.user ? (
              <p className="text-sm text-[#8b95a5]">
                Deja inscrit ?{" "}
                <Link href="/login" className="underline hover:text-white">
                  Connecte-toi
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 sm:px-4 py-12">
        <h2 className="text-center text-3xl font-bold">Comment ca marche</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-white/10 bg-[#12161b]/80 p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F5C842]/40 text-lg font-bold text-[#F5C842]">
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-[#b8c1cd]">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 sm:px-4 py-12">
        <div className="rounded-2xl border border-white/10 bg-[#12161b]/80 p-8">
          <h2 className="text-3xl font-bold">Combien vous touchez</h2>
          <p className="mt-2 text-[#b8c1cd]">
            A chaque vente, vous conservez 70% du prix de vente. OnlyPing garde 30% pour l&apos;hebergement, le
            paiement securise et la mise en avant de vos videos.
          </p>

          <div className="mt-6 flex h-4 w-full overflow-hidden rounded-full border border-white/10">
            <div className="h-full bg-[#F5C842]" style={{ width: "70%" }} />
            <div className="h-full bg-white/15" style={{ width: "30%" }} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-[#b8c1cd]">
            <span>70% pour vous</span>
            <span>30% OnlyPing</span>
          </div>

          <div className="mt-6 inline-flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-[#d7dde5]">
            <span>Exemple : video vendue 15,00 €</span>
            <span className="text-lg font-semibold text-[#F5C842]">10,50 € pour vous</span>
            <span className="text-xs text-[#8b95a5]">4,50 € pour OnlyPing</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 sm:px-4 py-12">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <h2 className="text-2xl font-bold">Nos premiers coachs</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[#b8c1cd]">
            OnlyPing accueille ses premiers entraineurs independants, qui construisent des maintenant leur catalogue
            de videos techniques et touchent leur part a chaque vente. Rejoignez le programme des le depart.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 sm:px-4 py-12">
        <h2 className="text-center text-3xl font-bold">Pourquoi pas juste YouTube ou Instagram ?</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {differentiators.map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-[#12161b]/80 p-6">
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-[#b8c1cd]">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="candidature" className="mx-auto max-w-3xl px-3 sm:px-4 py-12 scroll-mt-20">
        {!session?.user ? (
          <div className="rounded-2xl border border-white/10 bg-[#12161b]/80 p-8 text-center">
            <h2 className="text-3xl font-bold">Pret a rejoindre OnlyPing ?</h2>
            <p className="mx-auto mt-3 max-w-xl text-[#b8c1cd]">
              La candidature au programme coach se fait depuis un compte OnlyPing. Cree ton compte pour deposer ta
              demande, puis configure ton compte de paiement directement et de maniere securisee via Stripe une fois
              ta candidature approuvee.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <Link
                href="/register"
                className="rounded-full bg-[#F5C842] px-8 py-3 font-semibold text-[#161B22] hover:bg-[#f0ba1f]"
              >
                Creer un compte
              </Link>
              <p className="text-sm text-[#8b95a5]">
                Deja inscrit ?{" "}
                <Link href="/login" className="underline hover:text-white">
                  Connecte-toi
                </Link>
              </p>
            </div>
          </div>
        ) : isCoachOrAdmin ? (
          <div className="rounded-2xl border border-white/10 bg-[#12161b]/80 p-8 text-center">
            <h2 className="text-3xl font-bold">Tu es deja coach sur OnlyPing</h2>
            <p className="mx-auto mt-3 max-w-xl text-[#b8c1cd]">
              Retrouve tes videos, tes ventes et ton compte de paiement Stripe depuis ton espace coach.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-block rounded-full bg-[#F5C842] px-8 py-3 font-semibold text-[#161B22] hover:bg-[#f0ba1f]"
            >
              Accede a ton espace coach
            </Link>
          </div>
        ) : latestRequest?.status === "PENDING" ? (
          <div className="rounded-2xl border border-white/10 bg-[#12161b]/80 p-8 text-center">
            <h2 className="text-3xl font-bold">Candidature en cours d&apos;examen</h2>
            <p className="mx-auto mt-3 max-w-xl text-[#b8c1cd]">
              Ta demande a bien ete recue. Notre equipe la valide sous quelques jours ouvres et te repond par email.
              Une fois approuvee, tu configureras ton compte de paiement via Stripe.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-bold">Candidater au programme coach</h2>
            <p className="mt-2 text-[#b8c1cd]">
              {latestRequest?.status === "REJECTED"
                ? "Ta precedente candidature n'a pas ete retenue. Tu peux en soumettre une nouvelle ci-dessous."
                : "Presente ton profil pour rejoindre OnlyPing. Une fois ta candidature approuvee, tu configureras ton compte de paiement directement et de maniere securisee via Stripe."}
            </p>
            <CoachApplicationForm />
          </>
        )}
      </section>

      <section className="mx-auto max-w-3xl px-3 sm:px-4 py-12">
        <h2 className="text-3xl font-bold">Questions frequentes</h2>
        <div className="mt-6 space-y-3">
          {faqItems.map((item) => (
            <details key={item.question} className="rounded-xl border border-white/10 bg-[#12161b]/80 p-4">
              <summary className="cursor-pointer font-semibold text-white">{item.question}</summary>
              <p className="mt-2 text-sm text-[#b8c1cd]">{item.answer}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-sm text-[#8b95a5]">
          Deja coach sur OnlyPing ?{" "}
          <Link href="/dashboard" className="underline hover:text-white">
            Accede a ton espace coach
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
