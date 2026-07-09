import type { Metadata } from "next";
import { LegalPage, ToFill } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Politique de confidentialite - OnlyPing"
};

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialite" updatedAt="8 juillet 2026">
      <h2>1. Responsable de traitement</h2>
      <p>
        Le responsable du traitement des donnees personnelles collectees sur OnlyPing est{" "}
        <ToFill>raison sociale ou nom de l&apos;exploitant</ToFill>, contact : <ToFill>adresse email de contact</ToFill>.
      </p>

      <h2>2. Donnees collectees</h2>
      <ul>
        <li>Donnees de compte : nom, adresse email, mot de passe (stocke sous forme hachee), photo de profil.</li>
        <li>
          Donnees de demande de statut Coach : nom complet, adresse postale, numero de telephone, message libre.
        </li>
        <li>Donnees d&apos;achat : historique des videos achetees, montants, date.</li>
        <li>
          Donnees de compte de paiement Coach : identifiant et statut du compte Stripe Connect. Les coordonnees
          bancaires (IBAN) sont saisies directement sur les formulaires securises de Stripe et ne sont a aucun moment
          collectees ni stockees par OnlyPing.
        </li>
      </ul>

      <h2>3. Finalites du traitement</h2>
      <ul>
        <li>Creation et gestion des comptes utilisateurs et coachs.</li>
        <li>Traitement des achats et versement des sommes dues aux coachs.</li>
        <li>Verification d&apos;identite lors des demandes de statut Coach.</li>
        <li>Support utilisateur et gestion des reclamations.</li>
        <li>Respect des obligations legales et comptables (facturation, lutte contre la fraude).</li>
      </ul>

      <h2>4. Base legale</h2>
      <p>
        Les traitements reposent sur l&apos;execution du contrat (creation de compte, achat, versement aux coachs),
        sur le respect d&apos;obligations legales (comptabilite, obligations fiscales des plateformes) et, le cas
        echeant, sur l&apos;interet legitime d&apos;OnlyPing (securite, prevention de la fraude).
      </p>

      <h2>5. Destinataires des donnees</h2>
      <p>Les donnees sont transmises, dans la stricte mesure necessaire, aux sous-traitants suivants :</p>
      <ul>
        <li>Stripe (traitement des paiements et versements aux coachs).</li>
        <li>Resend (envoi des emails transactionnels : verification de compte, reinitialisation de mot de passe).</li>
        <li>Cloudflare (hebergement des fichiers video).</li>
        <li><ToFill>hebergeur du site web</ToFill> (hebergement de l&apos;application).</li>
      </ul>
      <p>
        Ces prestataires sont susceptibles de traiter des donnees en dehors de l&apos;Union europeenne ; dans ce cas,
        ces transferts sont encadres par les garanties appropriees (clauses contractuelles types de la Commission
        europeenne).
      </p>

      <h2>6. Duree de conservation</h2>
      <ul>
        <li>Donnees de compte : pendant toute la duree de vie du compte, puis suppression ou anonymisation en cas de suppression du compte.</li>
        <li>Donnees de facturation et d&apos;achat : conservees 10 ans conformement aux obligations comptables et fiscales.</li>
        <li>Demandes de statut Coach rejetees : conservees <ToFill>duree de conservation choisie, ex. 12 mois</ToFill> puis supprimees.</li>
      </ul>

      <h2>7. Cookies</h2>
      <p>
        OnlyPing utilise un unique cookie de session, depose par la solution d&apos;authentification (NextAuth), qui
        est strictement necessaire au fonctionnement du site (maintien de la connexion). Ce cookie ne necessite pas de
        consentement prealable. OnlyPing n&apos;utilise a ce jour aucun cookie de mesure d&apos;audience, publicitaire
        ou de suivi tiers. Si de tels cookies etaient ajoutes a l&apos;avenir, un bandeau de consentement serait mis en
        place prealablement a leur depot.
      </p>

      <h2>8. Vos droits</h2>
      <p>
        Conformement au Reglement general sur la protection des donnees (RGPD) et a la loi Informatique et Libertes,
        vous disposez d&apos;un droit d&apos;acces, de rectification, d&apos;effacement, de limitation, d&apos;opposition
        et de portabilite de vos donnees personnelles.
      </p>
      <p>
        Vous pouvez exercer ces droits directement depuis votre page « Profil » (mise a jour des informations,
        suppression du compte) ou en ecrivant a <ToFill>adresse email de contact</ToFill>. Vous disposez egalement du
        droit d&apos;introduire une reclamation aupres de la Commission nationale de l&apos;informatique et des
        libertes (CNIL) - www.cnil.fr.
      </p>

      <h2>9. Securite</h2>
      <p>
        Les mots de passe sont stockes sous forme hachee, les acces administrateur sont restreints par role, et les
        donnees bancaires des coachs sont exclusivement gerees par Stripe, prestataire certifie PCI-DSS, sans jamais
        transiter ni etre stockees par les serveurs d&apos;OnlyPing.
      </p>
    </LegalPage>
  );
}
