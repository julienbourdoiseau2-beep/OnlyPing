# OnlyPing

Base de projet pour une plateforme de vente de videos techniques de ping-pong alimentee par des entraineurs.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Prisma + SQLite
- NextAuth (credentials)

## Fonctionnalites incluses

- Page d'accueil marketing
- Catalogue des videos
- Page detail video
- Espace coach protege
- Page profil utilisateur (nom, email, mot de passe)
- Page Mes achats avec filtre/recherche
- Dashboard admin des achats
- API routes pour videos et achat
- Authentification email/mot de passe
- Creation de compte utilisateur
- Seed de donnees de demo

## Prerequis

- Node.js 20+
- npm 10+

## Installation

1. Copier les variables d'environnement:

```bash
cp .env.example .env
```

2. Installer les dependances:

```bash
npm install
```

3. Initialiser la base:

```bash
npm run prisma:migrate -- --name init
npm run db:seed
```

4. Lancer en local:

```bash
npm run dev
```

Application disponible sur http://localhost:3000

## Comptes de demo

- Coach:
  - email: coach@onlyping.fr
  - mot de passe: coach1234
- Utilisateur:
  - email: user@onlyping.fr
  - mot de passe: user1234
- Admin:
  - email: admin@onlyping.fr
  - mot de passe: admin1234

## Scripts utiles

- `npm run dev` : demarrage local
- `npm run build` : build production
- `npm run start` : lancement production
- `npm run lint` : lint
- `npm run prisma:studio` : visualiser la base

## Notes

- Le bouton "Acheter" sur la page detail est en mode demo (pas de fournisseur de paiement branche).
- Tu peux brancher Stripe plus tard dans `src/app/api/purchase/route.ts`.
- Upload video local disponible dans l'espace coach: le fichier est enregistre dans `storage/private-videos` via `src/app/api/coach/videos/route.ts`.
- La lecture est debloquee apres achat via un stream protege `src/app/api/videos/[id]/stream/route.ts`.
- Paiement Stripe: creation session checkout `src/app/api/checkout/route.ts` + webhook `src/app/api/webhooks/stripe/route.ts`.

## Paiement Stripe (local)

1. Ajouter les cles dans `.env`:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Exemple:

```env
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

Important:

- Utiliser une vraie cle test Stripe du Dashboard (Developers > API keys).
- Ne pas mettre de guillemets autour de la cle.
- Ne pas utiliser une valeur de demonstration masquee (`sk_test_******...`).

2. Lancer l'application:

```bash
npm run dev
```

3. Dans un autre terminal, lancer Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

4. Copier le secret `whsec_...` affiche par Stripe CLI dans `STRIPE_WEBHOOK_SECRET`.

5. Utiliser une carte de test Stripe (ex: 4242 4242 4242 4242) pour acheter une video.
- La page Mes achats est disponible sur `/mes-achats` pour retrouver vite les videos achetees.