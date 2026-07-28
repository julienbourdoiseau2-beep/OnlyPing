# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences:
- **Joueurs de ping-pong, tous niveaux** (débutant à confirmé) qui cherchent à progresser techniquement et achètent des vidéos de coaching à la carte.
- **Coachs/entraîneurs** qui produisent et vendent ces vidéos techniques, via une candidature (coach request) validée par un admin, puis un espace coach avec onboarding Stripe Connect pour être payés.

## Product Purpose

OnlyPing centralise des séquences techniques de ping-pong (service, topspin, bloc, tactique de match, routines d'entraînement) vendues à l'unité par des entraîneurs. Le succès se mesure à l'usage réel du catalogue par les joueurs (achats) et à l'activité des coachs (vidéos publiées, ventes, versements Stripe).

## Positioning

Deux piliers revendiqués face au contenu gratuit (YouTube) ou aux plateformes génériques :
- **Coachs vérifiés** : passage par une candidature (`coach-requests`) validée côté admin, pas un accès libre à tout le monde.
- **Contenu structuré en progression logique**, pensé comme un parcours technique plutôt qu'une collection de vidéos éparses.

Modèle économique : paiement à la vidéo avec accès instantané (pas d'abonnement).

## Operating Context

- Catalogue public de vidéos, page détail par vidéo, achat unitaire (Stripe checkout + webhooks).
- Espace coach protégé : gestion des vidéos, stats de ventes par vidéo, onboarding/versements Stripe Connect (`CoachStripeAccount`).
- Devenir coach : formulaire de candidature (`devenir-coach`), validé par un admin (`admin/coach-requests`).
- Compte utilisateur : inscription, connexion email/mot de passe, vérification d'email, réinitialisation de mot de passe, page profil, page "Mes achats" avec filtre/recherche.
- Back-office admin : achats, demandes de coach, gestion des utilisateurs (vérification email, achats, suppression).
- Pages légales existantes : CGU, CGV, mentions légales, confidentialité.

## Capabilities and Constraints

- Stack : Next.js 14 (App Router) + TypeScript, Tailwind CSS, Prisma/PostgreSQL, NextAuth (credentials), Stripe (checkout + Connect pour les coachs).
- Commission plateforme configurable par coach (`commissionBps` sur `User`).
- Un coach a un profil (bio, spécialité, années d'activité) distinct du compte utilisateur de base.
- Vérification d'email obligatoire dans le flux d'inscription (code + expiration) ; les comptes existants peuvent être marqués vérifiés manuellement côté admin/prod.
- Undecided / non confirmé : niveau de granularité de la "vérification" coach au-delà de la validation admin (diplôme, vidéo de présentation, etc.) — non précisé à ce stade.

## Evidence on Hand

Aucune preuve réelle pour l'instant : coachs, vidéos, avis, chiffres et contenu légal détaillé sont tous des données de démo/seed (`prisma/seed.ts`). Le futur travail de design ne doit inventer aucun témoignage, coach, avis ou chiffre comme s'il était réel — tout visuel doit soit rester générique/démo, soit être explicitement marqué comme placeholder.

## Product Principles

1. La confiance vient de la vérification humaine des coachs (candidature + validation admin), pas d'un accès libre.
2. L'achat est unitaire et instantané : pas de friction d'abonnement entre l'envie et l'accès à une vidéo.
3. Le contenu doit se lire comme une progression technique logique, pas comme une liste plate de vidéos.
4. Le produit est encore en construction (données de démo) : ne pas fabriquer de preuve sociale ou de contenu légal comme s'il était définitif.

## Accessibility & Inclusion

Aucune exigence spécifique établie à ce stade.
