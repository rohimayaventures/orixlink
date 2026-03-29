import type { SupabaseClient } from "@supabase/supabase-js";
import { usageCapFromSubscriptionRow } from "@/lib/admin/tierCaps";

type SubscriptionRow = {
  tier?: string | null;
  is_lifetime?: boolean | null;
  assessments_cap?: number | null;
} | null;

export type UsageMonthRow = {
  assessments_used: number;
  assessments_cap: number;
  period_month: string;
};

/**
 * Ensures usage_tracking exists for the month and assessments_cap matches subscription tier.
 */
export async function ensureUsageTrackingForMonth(
  supabase: SupabaseClient,
  userId: string,
  periodMonth: string,
  subscription: SubscriptionRow
): Promise<UsageMonthRow | null> {
  const expectedCap = usageCapFromSubscriptionRow(subscription);

  const { data: existing } = await supabase
    .from("usage_tracking")
    .select("assessments_used, assessments_cap, period_month")
    .eq("user_id", userId)
    .eq("period_month", periodMonth)
    .maybeSingle();

  if (!existing) {
    const { data: inserted, error } = await supabase
      .from("usage_tracking")
      .insert({
        user_id: userId,
        period_month: periodMonth,
        assessments_used: 0,
        assessments_cap: expectedCap,
      })
      .select("assessments_used, assessments_cap, period_month")
      .maybeSingle();

    if (!error && inserted) {
      return {
        assessments_used: Number(inserted.assessments_used) || 0,
        assessments_cap: Number(inserted.assessments_cap) || expectedCap,
        period_month: String(inserted.period_month),
      };
    }

    const { data: afterRace } = await supabase
      .from("usage_tracking")
      .select("assessments_used, assessments_cap, period_month")
      .eq("user_id", userId)
      .eq("period_month", periodMonth)
      .maybeSingle();

    if (
      afterRace &&
      Number(afterRace.assessments_cap) !== expectedCap
    ) {
      const { data: updated } = await supabase
        .from("usage_tracking")
        .update({ assessments_cap: expectedCap })
        .eq("user_id", userId)
        .eq("period_month", periodMonth)
        .select("assessments_used, assessments_cap, period_month")
        .maybeSingle();
      if (updated) {
        return {
          assessments_used: Number(updated.assessments_used) || 0,
          assessments_cap: Number(updated.assessments_cap) || expectedCap,
          period_month: String(updated.period_month),
        };
      }
    }

    if (afterRace) {
      return {
        assessments_used: Number(afterRace.assessments_used) || 0,
        assessments_cap: Number(afterRace.assessments_cap) || expectedCap,
        period_month: String(afterRace.period_month),
      };
    }
    return null;
  }

  if (Number(existing.assessments_cap) !== expectedCap) {
    const { data: updated } = await supabase
      .from("usage_tracking")
      .update({ assessments_cap: expectedCap })
      .eq("user_id", userId)
      .eq("period_month", periodMonth)
      .select("assessments_used, assessments_cap, period_month")
      .maybeSingle();
    if (updated) {
      return {
        assessments_used: Number(updated.assessments_used) || 0,
        assessments_cap: Number(updated.assessments_cap) || expectedCap,
        period_month: String(updated.period_month),
      };
    }
  }

  return {
    assessments_used: Number(existing.assessments_used) || 0,
    assessments_cap: Number(existing.assessments_cap) || expectedCap,
    period_month: String(existing.period_month),
  };
}
