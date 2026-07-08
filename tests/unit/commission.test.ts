import { describe, expect, it } from "vitest";
import { computeCommissionAmounts, getEffectiveCommissionBps, sanitizeCommissionBps } from "@/lib/commission";

describe("sanitizeCommissionBps", () => {
  it("accepts integers within [0, 10000]", () => {
    expect(sanitizeCommissionBps(0)).toBe(0);
    expect(sanitizeCommissionBps(2500)).toBe(2500);
    expect(sanitizeCommissionBps(10000)).toBe(10000);
  });

  it("rounds fractional values", () => {
    expect(sanitizeCommissionBps(2500.4)).toBe(2500);
    expect(sanitizeCommissionBps(2500.5)).toBe(2501);
  });

  it("rejects values outside [0, 10000]", () => {
    expect(sanitizeCommissionBps(-1)).toBeNull();
    expect(sanitizeCommissionBps(10001)).toBeNull();
  });

  it("rejects non-finite values", () => {
    expect(sanitizeCommissionBps(NaN)).toBeNull();
    expect(sanitizeCommissionBps(Infinity)).toBeNull();
    expect(sanitizeCommissionBps(-Infinity)).toBeNull();
  });
});

describe("getEffectiveCommissionBps", () => {
  it("prefers the video override when present", () => {
    expect(getEffectiveCommissionBps(1500, 3000)).toBe(1500);
  });

  it("falls back to the coach default when there is no override", () => {
    expect(getEffectiveCommissionBps(null, 3000)).toBe(3000);
    expect(getEffectiveCommissionBps(undefined, 3000)).toBe(3000);
  });

  it("falls back to the platform default (30%) when neither is set", () => {
    expect(getEffectiveCommissionBps(null, null)).toBe(3000);
    expect(getEffectiveCommissionBps(undefined, undefined)).toBe(3000);
  });

  it("treats an explicit 0 override as significant, not missing", () => {
    // 0 is a valid commission rate and must not be coalesced away by ??
    expect(getEffectiveCommissionBps(0, 3000)).toBe(0);
  });

  it("treats an explicit 0 coach default as significant, not missing", () => {
    expect(getEffectiveCommissionBps(null, 0)).toBe(0);
  });
});

describe("computeCommissionAmounts", () => {
  it("splits a round amount at the standard 30% default", () => {
    const { commissionAmount, coachNetAmount } = computeCommissionAmounts(10000, 3000);
    expect(commissionAmount).toBe(3000);
    expect(coachNetAmount).toBe(7000);
  });

  it("splits at the 75/25 Connect objective rate", () => {
    const { commissionAmount, coachNetAmount } = computeCommissionAmounts(2490, 2500);
    expect(commissionAmount).toBe(623); // round(2490 * 0.25) = round(622.5) = 623
    expect(coachNetAmount).toBe(1867);
  });

  it("commission + net always reconstitutes the original amount (no leaked/lost cents)", () => {
    const amounts = [1, 7, 99, 1990, 2490, 9999, 100000];
    const bpsValues = [0, 1, 2500, 3000, 4999, 5000, 9999, 10000];

    for (const amountCents of amounts) {
      for (const bps of bpsValues) {
        const { commissionAmount, coachNetAmount } = computeCommissionAmounts(amountCents, bps);
        expect(commissionAmount + coachNetAmount).toBe(amountCents);
      }
    }
  });

  it("0% commission sends everything to the coach", () => {
    const { commissionAmount, coachNetAmount } = computeCommissionAmounts(5000, 0);
    expect(commissionAmount).toBe(0);
    expect(coachNetAmount).toBe(5000);
  });

  it("100% commission sends everything to the platform", () => {
    const { commissionAmount, coachNetAmount } = computeCommissionAmounts(5000, 10000);
    expect(commissionAmount).toBe(5000);
    expect(coachNetAmount).toBe(0);
  });
});
