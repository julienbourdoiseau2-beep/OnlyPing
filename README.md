# OnlyPing

Base de projet pour une plateforme de vente de videos techniques de ping-pong alimentee par des entraineurs.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
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

3. Demarrer Postgres en local:

```bash
npm run db:up
```

4. Initialiser la base:

```bash
npm run prisma:migrate -- --name init
npm run db:seed
```

5. Lancer en local:

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
- Upload video: stockage R2 en production (si variables R2 configurees), sinon fallback local `storage/private-videos`.
- La lecture est debloquee apres achat via un stream protege `src/app/api/videos/[id]/stream/route.ts`.
- Paiement Stripe: creation session checkout `src/app/api/checkout/route.ts` + webhook `src/app/api/webhooks/stripe/route.ts`.

## Stockage Cloudflare R2 (prod)

Configurer ces variables dans ton environnement de production:

- `R2_ENDPOINT` (ex: `https://<accountid>.r2.cloudflarestorage.com`)
- `R2_BUCKET`
- `R2_REGION` (`auto`)
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_PUBLIC_BASE_URL` (URL publique du bucket pour les miniatures)

Quand ces variables sont presentes:

- les videos sont ecrites dans R2 et stockees en DB sous format `r2:<key>`
- la route protegee de stream genere une URL signee courte (120s)
- les miniatures sont ecrites dans R2 et exposees via `R2_PUBLIC_BASE_URL`

Sans ces variables, l'application reste fonctionnelle en mode local.

## Strategie local vs prod (.env)

- Local: conserver `DATABASE_URL` sur PostgreSQL local et laisser les variables `R2_*` vides.
- Production: configurer `DATABASE_URL` de prod + toutes les variables `R2_*` dans l'hebergeur.
- Ne jamais commiter les secrets de production dans le repo.
- Si un mot de passe DB contient des caracteres speciaux, l'encoder dans l'URL (ex: `!` devient `%21`).

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

## Base de donnees PostgreSQL (local)

Le projet utilise PostgreSQL via Prisma. Pour un environnement local standard:

1. Lancer la base:

```bash
npm run db:up
```

2. Verifier que `.env` contient une URL de ce type:

```env
DATABASE_URL=postgresql://onlyping:onlyping@localhost:5432/onlyping?schema=public
```

3. Appliquer les migrations et peupler la base:

```bash
npm run prisma:migrate -- --name init
npm run db:seed
```

4. Ouvrir Prisma Studio si besoin:

```bash
npm run prisma:studio
```

5. Utiliser une carte de test Stripe (ex: 4242 4242 4242 4242) pour acheter une video.
- La page Mes achats est disponible sur `/mes-achats` pour retrouver vite les videos achetees.