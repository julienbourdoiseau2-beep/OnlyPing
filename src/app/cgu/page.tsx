import type { Metadata } from "next";
import { LegalPage, ToFill } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Conditions generales d'utilisation - OnlyPing"
};

export default function CguPage() {
  return (
    <LegalPage title="Conditions generales d'utilisation (CGU)" updatedAt="8 juillet 2026">
      <h2>1. Objet</h2>
      <p>
        Les presentes conditions generales d&apos;utilisation regissent l&apos;acces et l&apos;usage du site OnlyPing,
        plateforme de mise en relation entre des entraineurs de tennis de table independants (« Coachs ») et des
        utilisateurs souhaitant acheter des videos de formation technique (« Utilisateurs »). L&apos;utilisation du
        site implique l&apos;acceptation pleine et entiere des presentes CGU.
      </p>

      <h2>2. Acces au service et creation de compte</h2>
      <p>
        La creation d&apos;un compte necessite la fourniture d&apos;une adresse email valide et sa verification. Chaque
        utilisateur est responsable de la confidentialite de ses identifiants et de toute activite realisee depuis son
        compte. Un compte est strictement personnel et ne peut etre partage.
      </p>

      <h2>3. Role de OnlyPing</h2>
      <p>
        OnlyPing agit en tant qu&apos;intermediaire technique mettant en relation les Coachs, qui produisent et
        publient les videos, et les Utilisateurs, qui les achetent. Les paiements sont traites via Stripe Connect :
        OnlyPing preleve une commission sur chaque vente et reverse le solde au Coach. OnlyPing n&apos;est ni
        producteur, ni editeur du contenu des videos publiees par les Coachs.
      </p>

      <h2>4. Obligations des Utilisateurs</h2>
      <ul>
        <li>Fournir des informations exactes lors de l&apos;inscription.</li>
        <li>Utiliser le service a des fins strictement personnelles et non commerciales.</li>
        <li>Ne pas reproduire, diffuser ou revendre les videos achetees.</li>
        <li>Ne pas utiliser le site a des fins illicites ou frauduleuses.</li>
      </ul>

      <h2>5. Obligations des Coachs</h2>
      <ul>
        <li>Fournir des informations exactes et a jour lors de la demande d&apos;acces au statut de Coach.</li>
        <li>Publier uniquement des contenus dont ils detiennent les droits ou l&apos;autorisation de diffusion.</li>
        <li>Respecter la reglementation applicable a leur activite, y compris leurs obligations fiscales et sociales
          liees aux revenus percus via la plateforme.</li>
        <li>Configurer un compte de paiement Stripe Connect valide pour recevoir leurs versements ; les coordonnees
          bancaires sont saisies directement aupres de Stripe et ne sont jamais collectees ni stockees par OnlyPing.</li>
      </ul>

      <h2>6. Moderation et suspension</h2>
      <p>
        OnlyPing se reserve le droit de suspendre ou de supprimer tout compte, ou de retirer toute video, en cas de
        non-respect des presentes CGU, de contenu illicite, ou de comportement frauduleux, apres examen de la
        situation par l&apos;equipe d&apos;administration.
      </p>

      <h2>7. Responsabilite</h2>
      <p>
        Chaque video est publiee sous la responsabilite editoriale exclusive du Coach qui la propose. OnlyPing ne
        saurait etre tenu responsable du contenu, de l&apos;exactitude technique ou pedagogique des videos, ni des
        conseils sportifs qui y sont dispenses. OnlyPing s&apos;efforce d&apos;assurer la disponibilite du service mais
        ne garantit pas une disponibilite ininterrompue.
      </p>

      <h2>8. Donnees personnelles et cookies</h2>
      <p>
        Le traitement des donnees personnelles est decrit dans la{" "}
        <a href="/confidentialite" className="underline hover:text-white">
          politique de confidentialite
        </a>
        .
      </p>

      <h2>9. Resiliation</h2>
      <p>
        Chaque utilisateur peut demander la suppression de son compte a tout moment depuis la page « Profil » ou en
        ecrivant a <ToFill>adresse email de contact</ToFill>. OnlyPing peut resilier l&apos;acces d&apos;un utilisateur
        en cas de manquement grave aux presentes CGU.
      </p>

      <h2>10. Droit applicable et litiges</h2>
      <p>
        Les presentes CGU sont soumises au droit francais. En cas de litige, une solution amiable sera recherchee en
        priorite ; a defaut, les tribunaux francais competents seront seuls saisis.
      </p>

      <h2>11. Modification des CGU</h2>
      <p>
        OnlyPing peut modifier les presentes CGU a tout moment. Les utilisateurs seront informes de toute modification
        substantielle. La poursuite de l&apos;utilisation du service vaut acceptation des CGU modifiees.
      </p>
    </LegalPage>
  );
}
