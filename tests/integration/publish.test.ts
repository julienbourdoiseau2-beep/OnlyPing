import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession } = vi.hoisted(() => ({ getServerSession: vi.fn() }));
vi.mock("next-auth", () => ({ getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

const { videoFindUnique, videoUpdate, coachStripeAccountFindUnique } = vi.hoisted(() => ({
  videoFindUnique: vi.fn(),
  videoUpdate: vi.fn(),
  coachStripeAccountFindUnique: vi.fn()
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    video: { findUnique: videoFindUnique, update: videoUpdate },
    coachStripeAccount: { findUnique: coachStripeAccountFindUnique }
  }
}));

const { PATCH } = await import("@/app/api/coach/videos/[id]/publish/route");

function request(body: unknown) {
  return new Request("http://localhost/api/coach/videos/video_1/publish", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

const context = { params: { id: "video_1" } };

beforeEach(() => {
  getServerSession.mockReset();
  videoFindUnique.mockReset();
  videoUpdate.mockReset();
  coachStripeAccountFindUnique.mockReset();
  videoFindUnique.mockResolvedValue({ id: "video_1", coachId: "coach_1" });
});

describe("PATCH /api/coach/videos/[id]/publish", () => {
  it("rejects a plain USER", async () => {
    getServerSession.mockResolvedValue({ user: { id: "user_1", role: "USER" } });
    const response = await PATCH(request({ isPublished: true }), context);
    expect(response.status).toBe(403);
  });

  it("rejects a COACH who does not own the video", async () => {
    getServerSession.mockResolvedValue({ user: { id: "coach_other", role: "COACH" } });
    const response = await PATCH(request({ isPublished: true }), context);
    expect(response.status).toBe(403);
  });

  it("rejects an invalid payload", async () => {
    getServerSession.mockResolvedValue({ user: { id: "coach_1", role: "COACH" } });
    const response = await PATCH(request({}), context);
    expect(response.status).toBe(400);
  });

  it("returns 404 for a video that doesn't exist", async () => {
    videoFindUnique.mockResolvedValue(null);
    getServerSession.mockResolvedValue({ user: { id: "coach_1", role: "COACH" } });
    const response = await PATCH(request({ isPublished: true }), context);
    expect(response.status).toBe(404);
  });

  it("blocks publishing when the coach has no Stripe Connect account", async () => {
    getServerSession.mockResolvedValue({ user: { id: "coach_1", role: "COACH" } });
    coachStripeAccountFindUnique.mockResolvedValue(null);

    const response = await PATCH(request({ isPublished: true }), context);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toMatch(/Configure ton compte de paiement/);
    expect(videoUpdate).not.toHaveBeenCalled();
  });

  it("blocks publishing when charges/payouts are not both enabled", async () => {
    getServerSession.mockResolvedValue({ user: { id: "coach_1", role: "COACH" } });
    coachStripeAccountFindUnique.mockResolvedValue({ stripeChargesEnabled: true, stripePayoutsEnabled: false });

    const response = await PATCH(request({ isPublished: true }), context);
    expect(response.status).toBe(403);
    expect(videoUpdate).not.toHaveBeenCalled();
  });

  it("allows publishing once the Stripe account is fully activated", async () => {
    getServerSession.mockResolvedValue({ user: { id: "coach_1", role: "COACH" } });
    coachStripeAccountFindUnique.mockResolvedValue({ stripeChargesEnabled: true, stripePayoutsEnabled: true });
    videoUpdate.mockResolvedValue({ id: "video_1", isPublished: true });

    const response = await PATCH(request({ isPublished: true }), context);
    expect(response.status).toBe(200);
    expect(videoUpdate).toHaveBeenCalledWith({
      where: { id: "video_1" },
      data: { isPublished: true },
      select: { id: true, isPublished: true }
    });
  });

  it("never gates unpublishing on Stripe status (must always be reversible)", async () => {
    getServerSession.mockResolvedValue({ user: { id: "coach_1", role: "COACH" } });
    videoUpdate.mockResolvedValue({ id: "video_1", isPublished: false });

    const response = await PATCH(request({ isPublished: false }), context);
    expect(response.status).toBe(200);
    expect(coachStripeAccountFindUnique).not.toHaveBeenCalled();
  });

  it("lets an ADMIN publish on behalf of a coach, but still gates on the video owner's Stripe status (not the admin's)", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin_1", role: "ADMIN" } });
    coachStripeAccountFindUnique.mockResolvedValue({ stripeChargesEnabled: false, stripePayoutsEnabled: false });

    const response = await PATCH(request({ isPublished: true }), context);
    expect(response.status).toBe(403);
    // Must look up the video's coach (coach_1), not the admin.
    expect(coachStripeAccountFindUnique).toHaveBeenCalledWith({
      where: { userId: "coach_1" },
      select: { stripeChargesEnabled: true, stripePayoutsEnabled: true }
    });
  });
});
