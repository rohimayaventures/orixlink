export type PaidTier = "free" | "pro" | "family" | "clinical" | "lifetime";

const CAPS: Record<PaidTier, number> = {
  free: 5,
  pro: 150,
  family: 300,
  clinical: 200,
  lifetime: 100,
};

export function assessmentsCapForTier(tier: string): number {
  const t = tier as PaidTier;
  return CAPS[t] ?? CAPS.free;
}

/** Aligns with app/api/assess resolveUserCapForAttempt + lifetime cap. */
export function usageCapFromSubscriptionRow(sub: {
  tier?: string | null;
  is_lifetime?: boolean | null;
  assessments_cap?: number | null;
} | null): number {
  if (!sub) return CAPS.free;
  if (sub.is_lifetime) return CAPS.lifetime;
  const ac = Number(sub.assessments_cap);
  if (Number.isFinite(ac) && ac > 0) return ac;
  return assessmentsCapForTier(sub.tier ?? "free");
}

export const PAID_TIERS_FOR_ADMIN: PaidTier[] = [
  "free",
  "pro",
  "family",
  "clinical",
  "lifetime",
];
