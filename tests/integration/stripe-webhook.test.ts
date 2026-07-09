import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const { videoFindUnique, purchaseCreate, purchaseUpdateMany, coachStripeAccountUpdateMany } = vi.hoisted(() => ({
  videoFindUnique: vi.fn(),
  purchaseCreate: vi.fn(),
  purchaseUpdateMany: vi.fn(),
  coachStripeAccountUpdateMany: vi.fn()
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    video: { findUnique: videoFindUnique },
    purchase: { create: purchaseCreate, updateMany: purchaseUpdateMany },
    coachStripeAccount: { updateMany: coachStripeAccountUpdateMany }
  }
}));

const { constructEvent, getStripeServerClient } = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  getStripeServerClient: vi.fn()
}));
vi.mock("@/lib/stripe", () => ({ getStripeServerClient }));

const { POST } = await import("@/app/api/webhooks/stripe/route");

const ORIGINAL_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function request(body: string, signature: string | null = "t=1,v1=fake") {
  const headers = new Headers();
  if (signature) {
    headers.set("stripe-signature", signature);
  }
  return new Request("http://localhost/api/webhooks/stripe", { method: "POST", headers, body });
}

beforeEach(() => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  videoFindUnique.mockReset();
  purchaseCreate.mockReset();
  purchaseUpdateMany.mockReset();
  coachStripeAccountUpdateMany.mockReset();
  constructEvent.mockReset();
  getStripeServerClient.mockReset();
  getStripeServerClient.mockReturnValue({ webhooks: { constructEvent } });
});

afterAll(() => {
  if (ORIGINAL_WEBHOOK_SECRET === undefined) {
    delete process.env.STRIPE_WEBHOOK_SECRET;
  } else {
    process.env.STRIPE_WEBHOOK_SECRET = ORIGINAL_WEBHOOK_SECRET;
  }
});

describe("POST /api/webhooks/stripe", () => {
  it("rejects when the stripe-signature header is missing", async () => {
    const response = await POST(request("{}", null));
    expect(response.status).toBe(400);
    expect(constructEvent).not.toHaveBeenCalled();
  });

  it("rejects when STRIPE_WEBHOOK_SECRET is not configured", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const response = await POST(request("{}"));
    expect(response.status).toBe(400);
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  });

  it("rejects a payload with an invalid signature", async () => {
    constructEvent.mockImplementation(() => {
      throw new Error("signature mismatch");
    });
    const response = await POST(request("{}"));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/Signature webhook invalide/);
  });

  it("records a Purchase using the commissionBps locked in at checkout time, not the coach's current rate", async () => {
    constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          payment_status: "paid",
          payment_intent: "pi_test_123",
          metadata: { userId: "user_1", videoId: "video_1", commissionBps: "1000" }
        }
      }
    });
    videoFindUnique.mockResolvedValue({
      priceCents: 2490,
      commissionBpsOverride: null,
      // Coach's commission has since changed to 30% - the webhook must not use this.
      coach: { commissionBps: 3000 }
    });
    purchaseCreate.mockResolvedValue({ id: "purchase_1" });

    const response = await POST(request("{}"));
    expect(response.status).toBe(200);

    expect(purchaseCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        videoId: "video_1",
        amount: 2490,
        commissionBpsAtPurchase: 1000,
        commissionAmount: 249,
        coachNetAmount: 2241,
        stripePaymentIntentId: "pi_test_123"
      }
    });
  });

  it("falls back to deriving commissionBps live when metadata is missing (older/unexpected sessions)", async () => {
    constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          payment_status: "paid",
          metadata: { userId: "user_1", videoId: "video_1" }
        }
      }
    });
    videoFindUnique.mockResolvedValue({
      priceCents: 2000,
      commissionBpsOverride: null,
      coach: { commissionBps: 2000 }
    });
    purchaseCreate.mockResolvedValue({ id: "purchase_1" });

    await POST(request("{}"));

    expect(purchaseCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ commissionBpsAtPurchase: 2000 }) })
    );
  });

  it("ignores an unpaid checkout session", async () => {
    constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { payment_status: "unpaid", metadata: { userId: "user_1", videoId: "video_1" } } }
    });

    const response = await POST(request("{}"));
    expect(response.status).toBe(200);
    expect(videoFindUnique).not.toHaveBeenCalled();
    expect(purchaseCreate).not.toHaveBeenCalled();
  });

  it("swallows a duplicate-purchase unique constraint error (idempotent on webhook retry)", async () => {
    constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: { payment_status: "paid", metadata: { userId: "user_1", videoId: "video_1", commissionBps: "3000" } }
      }
    });
    videoFindUnique.mockResolvedValue({ priceCents: 1000, commissionBpsOverride: null, coach: { commissionBps: null } });
    purchaseCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", { code: "P2002", clientVersion: "5.22.0" })
    );

    const response = await POST(request("{}"));
    expect(response.status).toBe(200);
  });

  it("re-throws a non-duplicate database error instead of silently swallowing it", async () => {
    constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: { payment_status: "paid", metadata: { userId: "user_1", videoId: "video_1", commissionBps: "3000" } }
      }
    });
    videoFindUnique.mockResolvedValue({ priceCents: 1000, commissionBpsOverride: null, coach: { commissionBps: null } });
    purchaseCreate.mockRejectedValue(new Error("connection lost"));

    await expect(POST(request("{}"))).rejects.toThrow("connection lost");
  });

  it("updates CoachStripeAccount flags on account.updated", async () => {
    constructEvent.mockReturnValue({
      type: "account.updated",
      data: {
        object: { id: "acct_123", charges_enabled: true, payouts_enabled: false, details_submitted: true }
      }
    });

    const response = await POST(request("{}"));
    expect(response.status).toBe(200);
    expect(coachStripeAccountUpdateMany).toHaveBeenCalledWith({
      where: { stripeConnectId: "acct_123" },
      data: { stripeChargesEnabled: true, stripePayoutsEnabled: false, stripeDetailsSubmitted: true }
    });
  });

  it("does not throw when account.updated references an account we don't have a row for", async () => {
    constructEvent.mockReturnValue({
      type: "account.updated",
      data: { object: { id: "acct_unknown", charges_enabled: true, payouts_enabled: true, details_submitted: true } }
    });
    coachStripeAccountUpdateMany.mockResolvedValue({ count: 0 });

    const response = await POST(request("{}"));
    expect(response.status).toBe(200);
  });

  it("marks the matching Purchase as refunded on charge.refunded", async () => {
    constructEvent.mockReturnValue({
      type: "charge.refunded",
      data: { object: { payment_intent: "pi_test_123" } }
    });
    purchaseUpdateMany.mockResolvedValue({ count: 1 });

    const response = await POST(request("{}"));
    expect(response.status).toBe(200);
    expect(purchaseUpdateMany).toHaveBeenCalledWith({
      where: { stripePaymentIntentId: "pi_test_123", refundedAt: null },
      data: { refundedAt: expect.any(Date) }
    });
  });

  it("does not touch any Purchase on charge.refunded when the charge has no payment_intent", async () => {
    constructEvent.mockReturnValue({
      type: "charge.refunded",
      data: { object: { payment_intent: null } }
    });

    const response = await POST(request("{}"));
    expect(response.status).toBe(200);
    expect(purchaseUpdateMany).not.toHaveBeenCalled();
  });

  it("marks the matching Purchase as disputed on charge.dispute.created", async () => {
    constructEvent.mockReturnValue({
      type: "charge.dispute.created",
      data: { object: { payment_intent: "pi_test_456" } }
    });
    purchaseUpdateMany.mockResolvedValue({ count: 1 });

    const response = await POST(request("{}"));
    expect(response.status).toBe(200);
    expect(purchaseUpdateMany).toHaveBeenCalledWith({
      where: { stripePaymentIntentId: "pi_test_456", disputedAt: null },
      data: { disputedAt: expect.any(Date) }
    });
  });

  it("clears the dispute flag and restores access when charge.dispute.closed resolves as won", async () => {
    constructEvent.mockReturnValue({
      type: "charge.dispute.closed",
      data: { object: { payment_intent: "pi_test_456", status: "won" } }
    });
    purchaseUpdateMany.mockResolvedValue({ count: 1 });

    const response = await POST(request("{}"));
    expect(response.status).toBe(200);
    expect(purchaseUpdateMany).toHaveBeenCalledWith({
      where: { stripePaymentIntentId: "pi_test_456" },
      data: { disputedAt: null }
    });
  });

  it("treats a lost dispute as a refund (funds are actually taken back)", async () => {
    constructEvent.mockReturnValue({
      type: "charge.dispute.closed",
      data: { object: { payment_intent: "pi_test_456", status: "lost" } }
    });
    purchaseUpdateMany.mockResolvedValue({ count: 1 });

    const response = await POST(request("{}"));
    expect(response.status).toBe(200);
    expect(purchaseUpdateMany).toHaveBeenCalledWith({
      where: { stripePaymentIntentId: "pi_test_456", refundedAt: null },
      data: { refundedAt: expect.any(Date) }
    });
  });

  it("acknowledges unrelated event types with 200 without side effects", async () => {
    constructEvent.mockReturnValue({ type: "customer.created", data: { object: {} } });
    const response = await POST(request("{}"));
    expect(response.status).toBe(200);
    expect(purchaseCreate).not.toHaveBeenCalled();
    expect(coachStripeAccountUpdateMany).not.toHaveBeenCalled();
  });
});
