import type { Metadata } from "next";
import { LegalPage, ToFill } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Conditions generales de vente - OnlyPing"
};

export default function CgvPage() {
  return (
    <LegalPage title="Conditions generales de vente (CGV)" updatedAt="8 juillet 2026">
      <h2>1. Champ d&apos;application</h2>
      <p>
        Les presentes conditions generales de vente s&apos;appliquent a toute vente de video de formation technique de
        tennis de table realisee sur le site OnlyPing entre un Coach vendeur et un Utilisateur acheteur, OnlyPing
        agissant en qualite d&apos;intermediaire technique et de paiement (Stripe Connect).
      </p>

      <h2>2. Produits et prix</h2>
      <p>
        Les videos proposees a la vente sont des contenus numeriques telechargeables/visionnables en streaming, dont
        le prix est affiche toutes taxes comprises (TTC) en euros sur la fiche de chaque video. OnlyPing se reserve le
        droit de modifier les prix a tout moment, sans effet sur les achats deja confirmes.
      </p>

      <h2>3. Commande et paiement</h2>
      <p>
        La commande est finalisee via le prestataire de paiement Stripe. Le paiement est exigible immediatement au
        moment de la commande. Une fois le paiement confirme, la video est instantanement accessible dans l&apos;espace
        « Mes achats » de l&apos;Utilisateur.
      </p>

      <h2>4. Livraison</h2>
      <p>
        S&apos;agissant d&apos;un contenu numerique, la « livraison » consiste en l&apos;ouverture d&apos;un acces
        immediat et permanent a la video achetee, sans limitation de duree, depuis le compte de l&apos;Utilisateur.
      </p>

      <h2>5. Droit de retractation</h2>
      <p>
        Conformement a l&apos;article L.221-28, 13° du Code de la consommation, le droit de retractation ne
        s&apos;applique pas a la fourniture d&apos;un contenu numerique non fourni sur un support materiel dont
        l&apos;execution a commence apres accord prealable expres du consommateur et renoncement expres a son droit de
        retractation.
      </p>
      <p>
        En cochant la case de confirmation au moment de l&apos;achat, l&apos;Utilisateur demande expressement
        l&apos;acces immediat au contenu et reconnait renoncer a son droit de retractation de 14 jours des lors que la
        lecture de la video a commence.
      </p>

      <h2>6. Reclamations et remboursement</h2>
      <p>
        En cas de probleme technique empechant l&apos;acces a une video achetee, l&apos;Utilisateur peut contacter{" "}
        <ToFill>adresse email de contact / support</ToFill>. Un remboursement pourra etre accorde, a la discretion de
        OnlyPing, en cas de dysfonctionnement avere non resolu.
      </p>

      <h2>7. Responsabilite du contenu</h2>
      <p>
        Chaque video est produite, publiee et garantie conforme au droit applicable par le Coach qui la propose.
        OnlyPing n&apos;intervient pas dans la conception pedagogique des videos et n&apos;est pas responsable de leur
        contenu.
      </p>

      <h2>8. Facturation</h2>
      <p>
        Une confirmation d&apos;achat est adressee a l&apos;Utilisateur. <ToFill>preciser qui emet la facture a
        l&apos;acheteur (OnlyPing ou le Coach) et comment l&apos;obtenir</ToFill>.
      </p>

      <h2>9. Mediation et reglement des litiges</h2>
      <p>
        Conformement aux articles L.616-1 et R.616-1 du Code de la consommation, tout consommateur a le droit de
        recourir gratuitement a un mediateur de la consommation : <ToFill>nom et coordonnees du mediateur</ToFill>.
        La Commission europeenne met egalement a disposition une plateforme de reglement en ligne des litiges,
        accessible a l&apos;adresse https://ec.europa.eu/consumers/odr.
      </p>

      <h2>10. Droit applicable</h2>
      <p>Les presentes CGV sont soumises au droit francais.</p>
    </LegalPage>
  );
}
