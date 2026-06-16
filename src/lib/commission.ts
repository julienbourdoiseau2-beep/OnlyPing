const DEFAULT_COMMISSION_BPS = 3000;

export function sanitizeCommissionBps(value: number) {
  if (!Number.isFinite(value)) {
    return null;
  }

  const rounded = Math.round(value);
  if (rounded < 0 || rounded > 10000) {
    return null;
  }

  return rounded;
}

export function getEffectiveCommissionBps(videoOverride: number | null | undefined, coachDefault: number | null | undefined) {
  return videoOverride ?? coachDefault ?? DEFAULT_COMMISSION_BPS;
}

export function computeCommissionAmounts(amountCents: number, commissionBps: number) {
  const commissionAmount = Math.round((amountCents * commissionBps) / 10000);
  const coachNetAmount = amountCents - commissionAmount;

  return {
    commissionAmount,
    coachNetAmount
  };
}
