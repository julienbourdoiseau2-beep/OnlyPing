# Checklist Production - OnlyPing

Ce document liste les etapes pour mettre l'application en production de maniere sereine.

## 0) Prerequis

- Un hebergeur pour Next.js (Vercel, Render, Railway, etc.)
- Une base Postgres managée
- Un provider email transactionnel (Resend, SendGrid, Postmark)
- Un stockage objet pour videos (S3 ou R2)
- Un compte Stripe active en mode live

## 1) Base de donnees: migrer de SQLite vers Postgres

Objectif: supprimer la dependance SQLite locale pour une prod stable.

1. Creer une base Postgres (ex: Neon).
2. Recuperer la chaine de connexion.
3. Mettre a jour `prisma/schema.prisma`:
   - `provider = "postgresql"`
   - `url = env("DATABASE_URL")`
4. Configurer `DATABASE_URL` dans les variables d'environnement de prod.
5. Generer migration locale:

```bash
npm run prisma:migrate -- --name postgres_init
```

6. En prod, appliquer:

```bash
npx prisma migrate deploy
```

7. Verifier en base:
   - tables `User`, `Video`, `Purchase`, `CoachProfile`
   - index et unique constraints presentes

Validation:
- inscription/login OK
- lecture/creation videos OK
- achat cree bien un Purchase

## 2) Variables d'environnement production

Objectif: secrets solides et configuration HTTPS complete.

Configurer au minimum:

- `DATABASE_URL` (Postgres)
- `NEXTAUTH_URL` (https://ton-domaine)
- `NEXTAUTH_SECRET` (secret fort, 32+ bytes)
- `STRIPE_SECRET_KEY` (live key)
- `STRIPE_WEBHOOK_SECRET` (live endpoint secret)
- `APP_URL` (optionnel mais recommande)

Commande utile pour generer `NEXTAUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Regles:
- Ne jamais commiter `.env`
- Ne jamais utiliser de valeur masquee (`sk_test_******`)
- Ne pas entourer les valeurs de guillemets si ce n'est pas necessaire

## 3) Stripe live (paiement + webhook)

Objectif: securiser et valider le paiement en environnement reel.

1. Dans Stripe Dashboard, passer en mode live.
2. Recuperer `STRIPE_SECRET_KEY` live.
3. Creer un webhook vers:
   - `https://ton-domaine/api/webhooks/stripe`
4. Recuperer le `whsec_...` live et le mettre dans `STRIPE_WEBHOOK_SECRET`.
5. Evenement minimum a ecouter:
   - `checkout.session.completed`
6. Lancer un paiement reel a faible montant.

Validation:
- redirection checkout OK
- webhook recu (HTTP 200)
- `Purchase` cree en base
- video debloquee dans `Mes achats`

## 4) Mot de passe oublie (email transactionnel)

Objectif: finaliser le flux reset password en production.

1. Creer un compte provider email (ex: Resend).
2. Verifier domaine expéditeur.
3. Ajouter variables:
   - `RESEND_API_KEY` (ou equivalent)
   - `MAIL_FROM`
4. Mettre en place l'envoi email dans `src/app/api/auth/forgot-password/route.ts`.
5. Garder la reponse generique (anti enumeration).
6. Retirer tout comportement dev-only en prod.

Validation:
- demande reset envoie un email
- lien ouvre `/reset-password`
- nouveau mot de passe fonctionne
- ancien lien reset invalide apres changement

## 5) Stockage videos durable (S3/R2)

Objectif: remplacer l'ecriture disque locale.

1. Creer un bucket prive.
2. Ajouter variables:
   - `S3_BUCKET`
   - `S3_REGION`
   - `S3_ACCESS_KEY_ID`
   - `S3_SECRET_ACCESS_KEY`
   - `S3_ENDPOINT` (si R2)
3. Remplacer l'upload local dans `src/app/api/coach/videos/route.ts` par upload S3/R2.
4. Stocker la cle objet dans `videoUrl`.
5. Adapter le stream protege pour lire depuis le bucket.

Validation:
- upload video OK
- lecture autorisee OK
- lecture non autorisee refusee

## 6) Securite applicative minimale

Objectif: reduire les risques d'abus et de fuite.

1. Verifier que le rate limit est actif sur:
   - register
   - forgot-password
   - reset-password
2. Conserver headers de securite dans `next.config.mjs`.
3. Ajouter CSRF review sur endpoints sensibles si besoin.
4. Ajouter une politique de rotation des secrets.

Validation:
- rate limit renvoie bien 429 apres seuil
- aucun secret en clair dans logs

## 7) Qualite et CI/CD

Objectif: bloquer les regressions avant deploy.

1. Pipeline CI avec jobs:
   - `npm ci`
   - `npm run lint`
   - `npm run build`
   - `npx prisma migrate deploy` (etape release)
2. Ajouter tests minimaux (API auth, checkout, webhook).
3. Proteger la branche principale (PR obligatoire).

Validation:
- aucun deploy si lint/build KO
- migrations executees automatiquement

## 8) Observabilite et exploitation

Objectif: detecter vite les incidents en prod.

1. Integrer Sentry (frontend + API routes).
2. Ajouter logs structures pour:
   - auth erreurs
   - checkout erreurs
   - webhook erreurs
3. Ajouter endpoint healthcheck simple.
4. Ajouter alerting (email/Slack) sur erreurs critiques.

Validation:
- une erreur test remonte dans Sentry
- healthcheck retourne 200

## 9) Plan de go-live (ordre recommande)

1. Postgres + migrations
2. Variables d'environnement prod
3. Stripe live + webhook
4. Email reset password
5. Stockage objet videos
6. CI/CD
7. Observabilite
8. Smoke test final

## 10) Smoke test final (a faire juste avant ouverture)

- Home, Catalogue, Detail video OK
- Register/Login/Logout OK
- Forgot password complet OK
- Achat Stripe live OK
- Webhook cree Purchase OK
- Mes achats affiche la video achetee OK
- Profil (email + mot de passe) OK
- Dashboard coach/admin accessible selon role OK

## 11) Rollback simple

Si incident majeur:

1. Desactiver temporairement achat (feature flag ou message maintenance).
2. Revenir au dernier build stable.
3. Rejouer les webhooks en attente Stripe si necessaire.
4. Corriger et redeployer.
