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

export const PAID_TIERS_FOR_ADMIN: PaidTier[] = [
  "free",
  "pro",
  "family",
  "clinical",
  "lifetime",
];
