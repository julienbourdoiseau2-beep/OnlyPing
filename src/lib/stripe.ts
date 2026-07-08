import Stripe from "stripe";

export function getStripeServerClient() {
  const rawSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!rawSecretKey) {
    throw new Error("STRIPE_SECRET_KEY manquant");
  }

  const secretKey = rawSecretKey.trim().replace(/^['\"]|['\"]$/g, "");

  if (!/^sk_(test|live)_/.test(secretKey)) {
    throw new Error("STRIPE_SECRET_KEY invalide: format attendu sk_test_... ou sk_live_...");
  }

  if (/\*|example|changeme|your_|_here|ekey|xxx/i.test(secretKey)) {
    throw new Error("STRIPE_SECRET_KEY invalide: valeur de demonstration detectee");
  }

  return new Stripe(secretKey, {
    apiVersion: "2026-05-27.dahlia"
  });
}