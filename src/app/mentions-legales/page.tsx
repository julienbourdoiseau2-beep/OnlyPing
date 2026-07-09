import type { Metadata } from "next";
import { LegalPage, ToFill } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Mentions legales - OnlyPing"
};

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions legales" updatedAt="8 juillet 2026">
      <h2>Editeur du site</h2>
      <p>
        Le site OnlyPing (onlypingtt.com) est edite par <ToFill>raison sociale ou nom et prenom de l&apos;exploitant</ToFill>,{" "}
        <ToFill>statut juridique : entreprise individuelle, auto-entrepreneur, SASU...</ToFill>, immatricule sous le
        numero SIRET <ToFill>numero SIRET</ToFill>, dont le siege est situe <ToFill>adresse du siege</ToFill>.
      </p>
      <p>
        Numero de TVA intracommunautaire : <ToFill>numero de TVA le cas echeant</ToFill>.
      </p>
      <p>
        Contact : <ToFill>adresse email de contact</ToFill>
      </p>
      <p>
        Directeur de la publication : <ToFill>nom du responsable de la publication</ToFill>
      </p>

      <h2>Hebergement</h2>
      <p>
        Le site est heberge par <ToFill>nom et adresse de l&apos;hebergeur du site (ex. Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA)</ToFill>.
      </p>
      <p>
        Les fichiers video sont stockes par Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, Etats-Unis
        (service Cloudflare R2).
      </p>
      <p>
        Les paiements sont traites par Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Dublin 2, Irlande.
      </p>

      <h2>Propriete intellectuelle</h2>
      <p>
        L&apos;ensemble des elements du site (charte graphique, textes, logo, interface) est protege par le droit
        d&apos;auteur. Toute reproduction ou representation, totale ou partielle, sans autorisation est interdite.
      </p>
      <p>
        Les videos publiees par les coachs restent la propriete intellectuelle de leurs auteurs respectifs. L&apos;achat
        d&apos;une video sur OnlyPing accorde a l&apos;acheteur un droit d&apos;acces et de visionnage personnel, non
        cessible et non destine a une exploitation commerciale ou a une redistribution.
      </p>

      <h2>Mediation de la consommation</h2>
      <p>
        Conformement aux articles L.616-1 et R.616-1 du Code de la consommation, tout consommateur a le droit de
        recourir gratuitement a un mediateur de la consommation en vue de la resolution amiable d&apos;un litige.
        Mediateur competent : <ToFill>nom et coordonnees du mediateur de la consommation choisi</ToFill>.
      </p>

      <h2>Donnees personnelles</h2>
      <p>
        Le traitement des donnees personnelles des utilisateurs du site est decrit dans la{" "}
        <a href="/confidentialite" className="underline hover:text-white">
          politique de confidentialite
        </a>
        .
      </p>
    </LegalPage>
  );
}
