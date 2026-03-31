export type DependentRow = {
  id: string;
  owner_user_id: string;
  display_name: string;
  age_range: string | null;
  relevant_conditions: string | null;
  created_at: string;
};

export const DEPENDENT_AGE_RANGES = [
  "Under 2",
  "2-5",
  "6-12",
  "13-17",
  "18-64",
  "65-74",
  "75+",
] as const;

export type DependentAgeRange = (typeof DEPENDENT_AGE_RANGES)[number];

export function dependentCapForTier(tier: string | null | undefined): number {
  const t = (tier ?? "").toLowerCase();
  if (t === "family") return 2;
  if (t === "pro" || t === "lifetime" || t === "clinical") return 2;
  return 0;
}

export function canManageDependentsTier(tier: string | null | undefined): boolean {
  return dependentCapForTier(tier) > 0;
}
