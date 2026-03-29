/** Proactive “near cap” threshold (not at cap). Free / lifetime never use this. */
export function isNearCap(
  remaining: number,
  tier: string,
  isLifetime: boolean
): boolean {
  if (isLifetime || tier === "lifetime") return false;
  if (tier === "pro") return remaining <= 30;
  if (tier === "family") return remaining <= 60;
  return false;
}

/** Banner only before cap is hit. */
export function shouldShowBuyMoreBanner(
  remaining: number,
  tier: string,
  isLifetime: boolean
): boolean {
  if (remaining <= 0) return false;
  return isNearCap(remaining, tier, isLifetime);
}
