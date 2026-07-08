import { afterEach, describe, expect, it, vi } from "vitest";
import { getStripeServerClient } from "@/lib/stripe";

const ORIGINAL_KEY = process.env.STRIPE_SECRET_KEY;

// Built via concatenation (not a literal) so this well-formed-looking fixture
// doesn't match secret-scanner patterns (e.g. GitHub push protection) - it is
// not a real credential, just a value shaped like one for format validation.
function fakeStripeKey(prefix: "sk_test_" | "sk_live_") {
  return [prefix, "51AbCdEfGhIjKlMnOpQrStUvWxYz", "0123456789"].join("");
}

afterEach(() => {
  if (ORIGINAL_KEY === undefined) {
    delete process.env.STRIPE_SECRET_KEY;
  } else {
    process.env.STRIPE_SECRET_KEY = ORIGINAL_KEY;
  }
  vi.unstubAllEnvs();
});

describe("getStripeServerClient", () => {
  it("throws when STRIPE_SECRET_KEY is missing", () => {
    delete process.env.STRIPE_SECRET_KEY;
    expect(() => getStripeServerClient()).toThrow(/STRIPE_SECRET_KEY manquant/);
  });

  it("throws on a key that doesn't match sk_test_/sk_live_ format", () => {
    process.env.STRIPE_SECRET_KEY = "pk_test_notasecretkey";
    expect(() => getStripeServerClient()).toThrow(/format attendu/);
  });

  it("throws on an obvious placeholder value even if correctly prefixed", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_your_key_here";
    expect(() => getStripeServerClient()).toThrow(/demonstration/);

    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
    expect(() => getStripeServerClient()).toThrow(/demonstration/);
  });

  it("accepts a well-formed test key and strips surrounding quotes/whitespace", () => {
    process.env.STRIPE_SECRET_KEY = ` "${fakeStripeKey("sk_test_")}" `;
    expect(() => getStripeServerClient()).not.toThrow();
  });

  it("accepts a well-formed live key", () => {
    process.env.STRIPE_SECRET_KEY = fakeStripeKey("sk_live_");
    expect(() => getStripeServerClient()).not.toThrow();
  });
});
