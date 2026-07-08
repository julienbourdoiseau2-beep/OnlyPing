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

const { POST } = await import("@/app/api/auth/verify-code/route");

let ipCounter = 0;

function request(body: unknown) {
  // A fresh IP per call keeps each test's rate-limit bucket independent,
  // since checkRateLimit's in-memory store is shared across the whole file.
  ipCounter += 1;
  return new Request("http://localhost/api/auth/verify-code", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `10.0.0.${ipCounter}` },
    body: JSON.stringify(body)
  });
}

beforeEach(() => {
  getServerSession.mockReset();
  userFindUnique.mockReset();
  userUpdate.mockReset();
  getServerSession.mockResolvedValue({ user: { id: "user_1" } });
});

describe("POST /api/auth/verify-code", () => {
  it("rejects an unauthenticated request", async () => {
    getServerSession.mockResolvedValue(null);
    const response = await POST(request({ code: "123456" }));
    expect(response.status).toBe(401);
  });

  it("rejects a malformed code (wrong length)", async () => {
    const response = await POST(request({ code: "123" }));
    expect(response.status).toBe(400);
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it("returns 404 if the session user no longer exists", async () => {
    userFindUnique.mockResolvedValue(null);
    const response = await POST(request({ code: "123456" }));
    expect(response.status).toBe(404);
  });

  it("short-circuits with ok:true if the user is already verified (no code check performed)", async () => {
    userFindUnique.mockResolvedValue({ emailVerified: true, verificationCode: null, verificationCodeExpiry: null });
    const response = await POST(request({ code: "000000" }));
    expect(response.status).toBe(200);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("rejects a wrong code", async () => {
    userFindUnique.mockResolvedValue({
      emailVerified: false,
      verificationCode: "111111",
      verificationCodeExpiry: new Date(Date.now() + 60_000)
    });
    const response = await POST(request({ code: "222222" }));
    expect(response.status).toBe(400);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("rejects an expired code even if it's otherwise correct", async () => {
    userFindUnique.mockResolvedValue({
      emailVerified: false,
      verificationCode: "111111",
      verificationCodeExpiry: new Date(Date.now() - 1000)
    });
    const response = await POST(request({ code: "111111" }));
    expect(response.status).toBe(400);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("rejects when no code was ever issued", async () => {
    userFindUnique.mockResolvedValue({ emailVerified: false, verificationCode: null, verificationCodeExpiry: null });
    const response = await POST(request({ code: "111111" }));
    expect(response.status).toBe(400);
  });

  it("accepts a correct, unexpired code and clears it after use", async () => {
    userFindUnique.mockResolvedValue({
      emailVerified: false,
      verificationCode: "654321",
      verificationCodeExpiry: new Date(Date.now() + 60_000)
    });
    userUpdate.mockResolvedValue({});

    const response = await POST(request({ code: "654321" }));
    expect(response.status).toBe(200);
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: { emailVerified: true, verificationCode: null, verificationCodeExpiry: null }
    });
  });

  it("rate-limits repeated attempts from the same IP", async () => {
    userFindUnique.mockResolvedValue({
      emailVerified: false,
      verificationCode: "999999",
      verificationCodeExpiry: new Date(Date.now() + 60_000)
    });

    const sameIpHeaders = { "Content-Type": "application/json", "x-forwarded-for": "10.1.1.1" };
    const makeReq = () =>
      new Request("http://localhost/api/auth/verify-code", {
        method: "POST",
        headers: sameIpHeaders,
        body: JSON.stringify({ code: "000000" })
      });

    let lastStatus = 0;
    for (let i = 0; i < 9; i++) {
      lastStatus = (await POST(makeReq())).status;
    }
    expect(lastStatus).toBe(429);
  });
});
