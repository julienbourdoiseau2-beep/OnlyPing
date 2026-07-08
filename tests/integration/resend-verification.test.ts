import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession } = vi.hoisted(() => ({ getServerSession: vi.fn() }));
vi.mock("next-auth", () => ({ getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

const { userFindUnique, userUpdate } = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userUpdate: vi.fn()
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: userFindUnique, update: userUpdate } }
}));

const { sendEmail } = vi.hoisted(() => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmail }));

const { POST } = await import("@/app/api/auth/resend-verification/route");

let ipCounter = 0;

function request() {
  ipCounter += 1;
  return new Request("http://localhost/api/auth/resend-verification", {
    method: "POST",
    headers: { "x-forwarded-for": `10.2.0.${ipCounter}` }
  });
}

beforeEach(() => {
  getServerSession.mockReset();
  userFindUnique.mockReset();
  userUpdate.mockReset();
  sendEmail.mockReset();
  sendEmail.mockResolvedValue({ ok: true });
  getServerSession.mockResolvedValue({ user: { id: "user_1" } });
});

describe("POST /api/auth/resend-verification", () => {
  it("rejects an unauthenticated request", async () => {
    getServerSession.mockResolvedValue(null);
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("uses the session's own identity, ignoring any client-supplied target (no arbitrary-email spam vector)", async () => {
    userFindUnique.mockResolvedValue({ id: "user_1", email: "real-owner@example.com", name: "Real Owner", emailVerified: false });
    userUpdate.mockResolvedValue({});

    await POST(request());

    expect(userFindUnique).toHaveBeenCalledWith({
      where: { id: "user_1" },
      select: { id: true, email: true, name: true, emailVerified: true }
    });
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "real-owner@example.com" }));
  });

  it("no-ops (without sending an email) when the user is already verified", async () => {
    userFindUnique.mockResolvedValue({ id: "user_1", email: "a@example.com", name: "A", emailVerified: true });
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("no-ops when the session user no longer exists", async () => {
    userFindUnique.mockResolvedValue(null);
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("generates a fresh 6-digit numeric code with an expiry and emails it", async () => {
    userFindUnique.mockResolvedValue({ id: "user_1", email: "a@example.com", name: "A", emailVerified: false });
    userUpdate.mockResolvedValue({});

    await POST(request());

    expect(userUpdate).toHaveBeenCalledTimes(1);
    const updateArgs = userUpdate.mock.calls[0][0];
    expect(updateArgs.where).toEqual({ id: "user_1" });
    expect(updateArgs.data.verificationCode).toMatch(/^\d{6}$/);
    expect(updateArgs.data.verificationCodeExpiry).toBeInstanceOf(Date);
    expect(updateArgs.data.verificationCodeExpiry.getTime()).toBeGreaterThan(Date.now());

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "a@example.com", html: expect.stringContaining(updateArgs.data.verificationCode) })
    );
  });

  it("rate-limits repeated calls from the same IP", async () => {
    userFindUnique.mockResolvedValue({ id: "user_1", email: "a@example.com", name: "A", emailVerified: false });
    userUpdate.mockResolvedValue({});

    const sameIpHeaders = { "x-forwarded-for": "10.3.3.3" };
    const makeReq = () => new Request("http://localhost/api/auth/resend-verification", { method: "POST", headers: sameIpHeaders });

    let lastStatus = 0;
    for (let i = 0; i < 6; i++) {
      lastStatus = (await POST(makeReq())).status;
    }
    expect(lastStatus).toBe(429);
  });
});
