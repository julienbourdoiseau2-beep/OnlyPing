import { beforeEach, describe, expect, it, vi } from "vitest";
import Stripe from "stripe";

const { getServerSession } = vi.hoisted(() => ({ getServerSession: vi.fn() }));
vi.mock("next-auth", () => ({ getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

const { videoFindUnique, purchaseFindUnique } = vi.hoisted(() => ({
  videoFindUnique: vi.fn(),
  purchaseFindUnique: vi.fn()
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    video: { findUnique: videoFindUnique },
    purchase: { findUnique: purchaseFindUnique }
  }
}));

const { checkoutSessionsCreate, getStripeServerClient } = vi.hoisted(() => ({
  checkoutSessionsCreate: vi.fn(),
  getStripeServerClient: vi.fn()
}));
vi.mock("@/lib/stripe", () => ({ getStripeServerClient }));

const { POST } = await import("@/app/api/checkout/route");

const READY_COACH_STRIPE_ACCOUNT = {
  stripeConnectId: "acct_ready",
  stripeChargesEnabled: true,
  stripePayoutsEnabled: true
};

function baseVideo(overrides: Record<string, unknown> = {}) {
  return {
    id: "video_1",
    title: "Service court coupe",
    level: "Intermediaire",
    priceCents: 2490,
    isPublished: true,
    commissionBpsOverride: null,
    coach: {
      name: "Lucas Martin",
      commissionBps: null,
      coachStripeAccount: READY_COACH_STRIPE_ACCOUNT
    },
    ...overrides
  };
}

function request(body: unknown) {
  return new Request("http://localhost/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

beforeEach(() => {
  getServerSession.mockReset();
  videoFindUnique.mockReset();
  purchaseFindUnique.mockReset();
  checkoutSessionsCreate.mockReset();
  getStripeServerClient.mockReset();
  getStripeServerClient.mockReturnValue({ checkout: { sessions: { create: checkoutSessionsCreate } } });
  getServerSession.mockResolvedValue({ user: { id: "user_1", email: "buyer@example.com" } });
});

describe("POST /api/checkout", () => {
  it("rejects an unauthenticated request", async () => {
    getServerSession.mockResolvedValue(null);
    const response = await POST(request({ videoId: "video_1" }));
    expect(response.status).toBe(401);
  });

  it("rejects a malformed payload", async () => {
    const response = await POST(request({}));
    expect(response.status).toBe(400);
  });

  it("returns 404 when the video does not exist", async () => {
    videoFindUnique.mockResolvedValue(null);
    const response = await POST(request({ videoId: "missing" }));
    expect(response.status).toBe(404);
  });

  it("returns 404 for an unpublished video (not purchasable yet)", async () => {
    videoFindUnique.mockResolvedValue(baseVideo({ isPublished: false }));
    const response = await POST(request({ videoId: "video_1" }));
    expect(response.status).toBe(404);
  });

  it("blocks the purchase when the coach has no Stripe Connect account at all", async () => {
    videoFindUnique.mockResolvedValue(baseVideo({ coach: { name: "Lucas", commissionBps: null, coachStripeAccount: null } }));
    const response = await POST(request({ videoId: "video_1" }));
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toMatch(/pas encore de compte de paiement/);
    expect(checkoutSessionsCreate).not.toHaveBeenCalled();
  });

  it("blocks the purchase when charges are not enabled yet", async () => {
    videoFindUnique.mockResolvedValue(
      baseVideo({
        coach: {
          name: "Lucas",
          commissionBps: null,
          coachStripeAccount: { ...READY_COACH_STRIPE_ACCOUNT, stripeChargesEnabled: false }
        }
      })
    );
    const response = await POST(request({ videoId: "video_1" }));
    expect(response.status).toBe(409);
    expect(checkoutSessionsCreate).not.toHaveBeenCalled();
  });

  it("blocks the purchase when payouts are not enabled yet", async () => {
    videoFindUnique.mockResolvedValue(
      baseVideo({
        coach: {
          name: "Lucas",
          commissionBps: null,
          coachStripeAccount: { ...READY_COACH_STRIPE_ACCOUNT, stripePayoutsEnabled: false }
        }
      })
    );
    const response = await POST(request({ videoId: "video_1" }));
    expect(response.status).toBe(409);
    expect(checkoutSessionsCreate).not.toHaveBeenCalled();
  });

  it("rejects a repeat purchase of the same video", async () => {
    videoFindUnique.mockResolvedValue(baseVideo());
    purchaseFindUnique.mockResolvedValue({ id: "purchase_1" });
    const response = await POST(request({ videoId: "video_1" }));
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toMatch(/deja achetee/);
    expect(checkoutSessionsCreate).not.toHaveBeenCalled();
  });

  it("creates a Checkout Session with the correct Connect split and metadata (video override wins)", async () => {
    videoFindUnique.mockResolvedValue(
      baseVideo({ commissionBpsOverride: 1000, coach: { name: "Lucas", commissionBps: 3000, coachStripeAccount: READY_COACH_STRIPE_ACCOUNT } })
    );
    purchaseFindUnique.mockResolvedValue(null);
    checkoutSessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/session123" });

    const response = await POST(request({ videoId: "video_1" }));

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.checkoutUrl).toBe("https://checkout.stripe.com/session123");

    expect(checkoutSessionsCreate).toHaveBeenCalledTimes(1);
    const args = checkoutSessionsCreate.mock.calls[0][0];
    // 10% override, not the coach's 30% default.
    expect(args.payment_intent_data.application_fee_amount).toBe(249); // round(2490 * 0.10)
    expect(args.payment_intent_data.transfer_data.destination).toBe("acct_ready");
    expect(args.metadata.commissionBps).toBe("1000");
    expect(args.metadata.videoId).toBe("video_1");
    expect(args.metadata.userId).toBe("user_1");
    expect(args.line_items[0].price_data.unit_amount).toBe(2490);
  });

  it("falls back to the coach's default commission when there is no video override", async () => {
    videoFindUnique.mockResolvedValue(baseVideo({ coach: { name: "Lucas", commissionBps: 2500, coachStripeAccount: READY_COACH_STRIPE_ACCOUNT } }));
    purchaseFindUnique.mockResolvedValue(null);
    checkoutSessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/session456" });

    await POST(request({ videoId: "video_1" }));

    const args = checkoutSessionsCreate.mock.calls[0][0];
    expect(args.metadata.commissionBps).toBe("2500");
    expect(args.payment_intent_data.application_fee_amount).toBe(623); // round(2490 * 0.25)
  });

  it("returns 500 when Stripe returns a session without a url", async () => {
    videoFindUnique.mockResolvedValue(baseVideo());
    purchaseFindUnique.mockResolvedValue(null);
    checkoutSessionsCreate.mockResolvedValue({ url: null });

    const response = await POST(request({ videoId: "video_1" }));
    expect(response.status).toBe(500);
  });

  it("returns a friendly 500 on Stripe authentication failure instead of leaking a raw exception", async () => {
    videoFindUnique.mockResolvedValue(baseVideo());
    purchaseFindUnique.mockResolvedValue(null);
    checkoutSessionsCreate.mockRejectedValue(
      new Stripe.errors.StripeAuthenticationError({ type: "invalid_request_error", message: "bad key" })
    );

    const response = await POST(request({ videoId: "video_1" }));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toMatch(/Configuration Stripe invalide/);
  });
});
