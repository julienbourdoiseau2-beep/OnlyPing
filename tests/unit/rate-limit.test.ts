import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

function requestFrom(ip: string | null) {
  const headers = new Headers();
  if (ip) {
    headers.set("x-forwarded-for", ip);
  }
  return new Request("http://localhost/api/test", { headers });
}

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to max within the window, then blocks", () => {
    const scope = "test-scope-basic";
    const request = requestFrom("1.1.1.1");
    const options = { windowMs: 60_000, max: 3 };

    expect(checkRateLimit(request, scope, options).ok).toBe(true);
    expect(checkRateLimit(request, scope, options).ok).toBe(true);
    expect(checkRateLimit(request, scope, options).ok).toBe(true);

    const fourth = checkRateLimit(request, scope, options);
    expect(fourth.ok).toBe(false);
    expect(fourth.remaining).toBe(0);
  });

  it("reports decreasing remaining count as requests are consumed", () => {
    const scope = "test-scope-remaining";
    const request = requestFrom("1.1.1.2");
    const options = { windowMs: 60_000, max: 3 };

    expect(checkRateLimit(request, scope, options).remaining).toBe(2);
    expect(checkRateLimit(request, scope, options).remaining).toBe(1);
    expect(checkRateLimit(request, scope, options).remaining).toBe(0);
  });

  it("resets the counter once the window has elapsed", () => {
    const scope = "test-scope-reset";
    const request = requestFrom("1.1.1.3");
    const options = { windowMs: 60_000, max: 1 };

    expect(checkRateLimit(request, scope, options).ok).toBe(true);
    expect(checkRateLimit(request, scope, options).ok).toBe(false);

    vi.advanceTimersByTime(60_001);

    expect(checkRateLimit(request, scope, options).ok).toBe(true);
  });

  it("keeps separate buckets per scope for the same IP", () => {
    const request = requestFrom("1.1.1.4");
    const options = { windowMs: 60_000, max: 1 };

    expect(checkRateLimit(request, "scope-a", options).ok).toBe(true);
    // A different scope (different route) must not be affected by scope-a's usage.
    expect(checkRateLimit(request, "scope-b", options).ok).toBe(true);
    // scope-a is now exhausted regardless of scope-b's state.
    expect(checkRateLimit(request, "scope-a", options).ok).toBe(false);
  });

  it("keeps separate buckets per IP for the same scope", () => {
    const scope = "test-scope-per-ip";
    const options = { windowMs: 60_000, max: 1 };

    expect(checkRateLimit(requestFrom("2.2.2.1"), scope, options).ok).toBe(true);
    expect(checkRateLimit(requestFrom("2.2.2.2"), scope, options).ok).toBe(true);
    expect(checkRateLimit(requestFrom("2.2.2.1"), scope, options).ok).toBe(false);
  });

  it("uses the first address in a comma-separated x-forwarded-for header", () => {
    const scope = "test-scope-xff-list";
    const options = { windowMs: 60_000, max: 1 };
    const headers = new Headers({ "x-forwarded-for": "3.3.3.3, 9.9.9.9" });
    const request = new Request("http://localhost/api/test", { headers });

    expect(checkRateLimit(request, scope, options).ok).toBe(true);
    // Same first hop IP -> same bucket, should now be blocked.
    expect(
      checkRateLimit(new Request("http://localhost/api/test", { headers: new Headers({ "x-forwarded-for": "3.3.3.3" }) }), scope, options)
        .ok
    ).toBe(false);
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const scope = "test-scope-real-ip";
    const options = { windowMs: 60_000, max: 1 };
    const request = new Request("http://localhost/api/test", { headers: new Headers({ "x-real-ip": "4.4.4.4" }) });

    expect(checkRateLimit(request, scope, options).ok).toBe(true);
    expect(checkRateLimit(request, scope, options).ok).toBe(false);
  });

  it("falls back to a shared 'unknown' bucket when no IP header is present", () => {
    const scope = "test-scope-unknown";
    const options = { windowMs: 60_000, max: 1 };

    expect(checkRateLimit(requestFrom(null), scope, options).ok).toBe(true);
    // Two different clients with no IP headers share the same fallback bucket -
    // documenting current behavior so a future change here is a deliberate choice.
    expect(checkRateLimit(requestFrom(null), scope, options).ok).toBe(false);
  });
});
