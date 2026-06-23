# Checklist Production - OnlyPing

Ce document liste les etapes pour mettre l'application en production de maniere sereine.

**Dernière mise à jour**: 2026-06-22

## État actuel

✅ **COMPLÉTÉ**:
- PostgreSQL 18 local fonctionnel (Windows)
- Prisma migrations (schema + soft delete)
- Cloudflare R2 intégré (upload/download/delete)
- GitHub repository synchronisé
- Code linting valide
- Soft delete videos (preserve purchases)

⏳ **EN COURS**:
- Finalisation `.env.prod` (R2, Stripe, NEXTAUTH)
- Migration DB en production

🔴 **À FAIRE**:
- Hébergeur prod (Vercel, Render, Railway)
- PostgreSQL managée (Neon, Supabase, Railway)
- Domaine pointant vers serveur
- Email transactionnel (Resend, SendGrid)
- Stripe live
- R2 public domain custom (images.onlyping.fr)

## 0) Prerequis

- ✅ Un stockage objet pour videos → **Cloudflare R2 (configuré)**
- ⏳ Un hebergeur pour Next.js → **À choisir (Vercel recommandé)**
- ⏳ Une base Postgres managée → **À créer (Neon, Supabase, etc.)**
- ⏳ Un provider email transactionnel → **À setup (Resend, SendGrid, Postmark)**
- ⏳ Un compte Stripe active en mode live → **À activer**
- ✅ Domaine acheté → **onlypingtt.com (acheté, pas configuré)**

## 1) Base de donnees: migrer de SQLite vers Postgres

**STATUS**: ✅ COMPLÉTÉ (Local) | ⏳ Migration prod à faire

### Local (Windows)
- ✅ PostgreSQL 18 installé
- ✅ Credentials: `onlyping` / `MQ0431db` @ localhost:5432
- ✅ prisma/schema.prisma configuré pour PostgreSQL
- ✅ Migrations créées (incluant soft delete Videos)
- ✅ À faire: `npm run db:up` puis `npm run prisma:migrate`

### Production
1. Créer une base Postgres managée (ex: Neon, Supabase).
2. Récupérer la chaîne de connexion.
3. Mettre à jour `.env.prod`:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
   ```
4. En prod, appliquer:
   ```bash
   npx prisma migrate deploy
   ```

Validation:
- Tables `User`, `Video`, `Purchase`, `CoachProfile`, `Review`, `CoachProfile` présentes
- Colonne `deletedAt` présente sur `Video` (soft delete)
- Indices et contraintes OK

## 2) Variables d'environnement production

**STATUS**: 🔄 EN COURS

Fichier: `.env.prod` (ne pas commiter, garder localement)

### Variables à configurer

#### PostgreSQL
```
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
```

#### NextAuth
```
NEXTAUTH_URL="https://onlypingtt.com"
NEXTAUTH_SECRET="<secret fort 32+ bytes>"
```

Générer secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

#### Stripe (mode live)
```
STRIPE_SECRET_KEY="sk_live_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
```

#### Cloudflare R2
```
R2_ENDPOINT="https://e3322c7598141eb5fcef29b8ac9dc25b.r2.cloudflarestorage.com"
R2_BUCKET="onlyping-videos"
R2_REGION="auto"
R2_ACCESS_KEY_ID="64d7c304a86d78b07d8411e82e130e3a"
R2_SECRET_ACCESS_KEY="2eb6b5115301d17801335b0d29646f1e6fbe3c812c96b5ea8fca6f9123e94bcb"
R2_PUBLIC_BASE_URL=""  # Vide (fallback local) jusqu'à config domaine custom
```

**TODO**: Configurer domaine custom `images.onlypingtt.com` → R2, puis mettre à jour `R2_PUBLIC_BASE_URL="https://images.onlypingtt.com"`

#### Validation des variables
- ✅ R2 credentials complétés
- ⏳ Stripe live keys (à activer)
- ⏳ PostgreSQL prod (à créer)
- ⏳ NEXTAUTH_SECRET (à générer)
- ⏳ R2_PUBLIC_BASE_URL (à compléter après domaine)

## 3) Hébergement production (Next.js)

**STATUS**: ⏳ À FAIRE

### Options recommandées

#### Vercel (recommandé pour Next.js)
- **Avantages**: Deploy direct depuis GitHub, optimisé pour Next.js, serverless
- **Démarrage**: 
  1. `vercel.com` → Login GitHub
  2. Importer repo `github.com/julie/.../Projet`
  3. Configurer env vars (`.env.prod`)
  4. Deploy

#### Render
- **Avantages**: PostgreSQL managée incluse, simple
- **Démarrage**: `render.com` → New → Web Service

#### Railway
- **Avantages**: PostgreSQL + Redis + Next.js, pay-as-you-go
- **Démarrage**: `railway.app` → New Project → GitHub import

### Configuration commune
1. Configurer variables d'environnement (copier `.env.prod`)
2. Pointer domaine vers serveur (CNAME ou A record)
3. Redéployer si changement env
4. Vérifier logs de déploiement

### Validation
- App accessible via domaine
- Home page charge
- Login/Register OK
- Pas d'erreur en prod

## 4) Stripe live (paiement + webhook)

**STATUS**: ⏳ À FAIRE

Objectif: securiser et valider le paiement en environnement reel.

1. Dans Stripe Dashboard, passer en mode live.
2. Recuperer `STRIPE_SECRET_KEY` live.
3. Creer un webhook vers:
   - `https://onlypingtt.com/api/webhooks/stripe`
4. Recuperer le `whsec_...` live et le mettre dans `STRIPE_WEBHOOK_SECRET`.
5. Evenement minimum a ecouter:
   - `checkout.session.completed`
6. Lancer un paiement reel a faible montant.

Validation:
- redirection checkout OK
- webhook recu (HTTP 200)
- `Purchase` cree en base
- video debloquee dans `Mes achats`

## 5) Mot de passe oublie (email transactionnel)

**STATUS**: ⏳ À FAIRE

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

## 6) Stockage videos durable (S3/R2)

### Implémentation
- ✅ Bucket R2 `onlyping-videos` créé
- ✅ Credentials configurés
- ✅ Upload endpoint (`src/app/api/coach/videos/route.ts`) → R2 + fallback local
- ✅ Download/Stream endpoint (`src/app/api/videos/[id]/stream/route.ts`) → Signed URLs R2
- ✅ Delete endpoint (`src/app/api/coach/videos/[id]/route.ts`) → Soft delete + nettoyage R2
- ✅ Videos supprimées restent accessibles aux acheteurs

### Configuration
- `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` → ✅ Configurées dans `.env.prod`
- `R2_PUBLIC_BASE_URL` → ⏳ À compléter après setup domaine custom

### Fonctionnement
1. Coach upload vidéo:
   - Video stockée: `r2:videos/YYYY/MM/filename.mp4`
   - Thumbnail: `r2:thumbnails/YYYY/MM/filename.jpg` (si R2 enabled)
   - Fallback local si R2 désactivé

2. Streaming vidéo achetée:
   - Génère signed URL (120s expiration)
   - Redirige vers R2 ou fallback local

3. Coach supprime vidéo:
   - Soft delete (`deletedAt = now()`)
   - Nettoyage assets (R2 + local)
   - Acheteurs gardent accès

Validation:
- ✅ Upload video OK
- ✅ Lecture autorisée OK
- ✅ Lecture non autorisée refusée
- ✅ Soft delete OK, acheteurs accès préservé

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

**Prérequis d'abord** (avant les étapes de déploiement):

### Phase 1: Infrastructure & Configuration
1. ✅ PostgreSQL + migrations **[COMPLÉTÉ]**
2. ✅ Stockage R2 **[COMPLÉTÉ]**
3. ⏳ Hébergeur prod (Vercel/Render/Railway) **[À FAIRE]**
4. ⏳ PostgreSQL managée (Neon/Supabase) **[À FAIRE]**
5. ⏳ Domaine configuré (DNS pointant vers serveur) **[À FAIRE]**
6. ⏳ Domaine custom R2 (images.onlypingtt.com) **[À FAIRE]**

### Phase 2: Intégrations externes
7. ⏳ Stripe live + webhook **[À FAIRE]**
8. ⏳ Email transactionnel (Resend/SendGrid) **[À FAIRE]**

### Phase 3: Déploiement
9. ⏳ CI/CD pipeline **[À FAIRE]**
10. ⏳ Observabilité (Sentry, logs) **[À FAIRE]**
11. ⏳ Smoke test final **[À FAIRE]**

### Phase 4: Go-live
12. ⏳ Ouverture publique

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
