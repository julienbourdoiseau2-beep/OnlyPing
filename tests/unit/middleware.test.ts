import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const { getToken } = vi.hoisted(() => ({ getToken: vi.fn() }));
vi.mock("next-auth/jwt", () => ({ getToken }));

const { middleware } = await import("@/middleware");

function makeRequest(path: string, method = "GET") {
  return new NextRequest(new URL(path, "http://localhost:3000"), { method });
}

afterEach(() => {
  getToken.mockReset();
});

describe("middleware: unauthenticated access", () => {
  it("lets an anonymous visitor browse public pages", async () => {
    getToken.mockResolvedValue(null);
    const response = await middleware(makeRequest("/"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("lets an anonymous visitor reach the public catalogue API", async () => {
    getToken.mockResolvedValue(null);
    const response = await middleware(makeRequest("/api/videos"));
    expect(response.status).toBe(200);
  });

  it.each(["/dashboard", "/dashboard/settings", "/mes-achats", "/profil", "/devenir-coach", "/admin", "/admin/achats"])(
    "redirects an anonymous visitor away from the protected page %s",
    async (path) => {
      getToken.mockResolvedValue(null);
      const response = await middleware(makeRequest(path));
      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toContain("/login");
      expect(location).toContain(`callbackUrl=${encodeURIComponent(path)}`);
    }
  );

  it.each(["/api/checkout", "/api/purchase", "/api/coach-request", "/api/coach/videos", "/api/admin/users/role"])(
    "returns 401 JSON (not a redirect) for an anonymous call to the protected API route %s",
    async (path) => {
      getToken.mockResolvedValue(null);
      const response = await middleware(makeRequest(path, "POST"));
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBeTruthy();
    }
  );

  it("does not require auth for the Stripe webhook, which never carries a session cookie", async () => {
    getToken.mockResolvedValue(null);
    const response = await middleware(makeRequest("/api/webhooks/stripe", "POST"));
    expect(response.status).toBe(200);
  });
});

describe("middleware: authenticated but unverified email", () => {
  const unverifiedToken = { id: "user_1", role: "USER", emailVerified: false };

  it.each(["/", "/catalogue", "/mes-achats", "/dashboard", "/devenir-coach"])(
    "redirects an unverified user away from %s to /verify-email",
    async (path) => {
      getToken.mockResolvedValue(unverifiedToken);
      const response = await middleware(makeRequest(path));
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/verify-email");
    }
  );

  it("lets an unverified user reach the verification page itself", async () => {
    getToken.mockResolvedValue(unverifiedToken);
    const response = await middleware(makeRequest("/verify-email"));
    expect(response.status).toBe(200);
  });

  it.each(["/login", "/register", "/forgot-password", "/reset-password"])(
    "lets an unverified user reach the auth page %s (e.g. to log in as a different account)",
    async (path) => {
      getToken.mockResolvedValue(unverifiedToken);
      const response = await middleware(makeRequest(path));
      expect(response.status).toBe(200);
    }
  );

  it.each(["/api/auth/verify-code", "/api/auth/resend-verification", "/api/auth/register", "/api/auth/session"])(
    "lets an unverified user call the auth endpoint %s",
    async (path) => {
      getToken.mockResolvedValue(unverifiedToken);
      const response = await middleware(makeRequest(path, "POST"));
      expect(response.status).toBe(200);
    }
  );

  it("returns 403 JSON (not a redirect) for an unverified user's protected API call", async () => {
    getToken.mockResolvedValue(unverifiedToken);
    const response = await middleware(makeRequest("/api/checkout", "POST"));
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  it("treats a token with a missing emailVerified claim as unverified (fail closed)", async () => {
    getToken.mockResolvedValue({ id: "user_legacy", role: "USER" });
    const response = await middleware(makeRequest("/dashboard"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/verify-email");
  });
});

describe("middleware: authenticated and verified", () => {
  const verifiedToken = { id: "user_2", role: "USER", emailVerified: true };

  it.each(["/", "/dashboard", "/mes-achats", "/profil", "/devenir-coach"])(
    "grants access to %s once verified",
    async (path) => {
      getToken.mockResolvedValue(verifiedToken);
      const response = await middleware(makeRequest(path));
      expect(response.status).toBe(200);
    }
  );

  it("grants access to protected coach API routes", async () => {
    getToken.mockResolvedValue({ id: "coach_1", role: "COACH", emailVerified: true });
    const response = await middleware(makeRequest("/api/coach/videos", "POST"));
    expect(response.status).toBe(200);
  });
});
