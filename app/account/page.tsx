import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { usageCapFromSubscriptionRow } from "@/lib/admin/tierCaps";
import { ensureUsageTrackingForMonth } from "@/lib/ensureUsageTracking";
import AccountClient from "./AccountClient";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ credits_frozen?: string }>;
}) {
  const sp = await searchParams;
  const portalCreditsFrozenHintRaw = sp.credits_frozen;
  const parsedHint = portalCreditsFrozenHintRaw
    ? parseInt(portalCreditsFrozenHintRaw, 10)
    : NaN;
  const portalCreditsFrozenHint =
    Number.isFinite(parsedHint) && parsedHint > 0 ? parsedHint : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const yearMonth = new Date().toISOString().slice(0, 7);

  const [profileRes, subRes, creditsRes] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("credits")
      .select("credits_remaining, frozen_at")
      .eq("user_id", user.id)
      .gt("credits_remaining", 0),
  ]);

  const usageAligned =
    (await ensureUsageTrackingForMonth(
      supabase,
      user.id,
      yearMonth,
      subRes.data
    )) ?? {
      assessments_used: 0,
      assessments_cap: usageCapFromSubscriptionRow(subRes.data),
      period_month: yearMonth,
    };

  const rows = creditsRes.data ?? [];
  const creditSum = rows.reduce(
    (sum, row) =>
      row.frozen_at == null ? sum + row.credits_remaining : sum,
    0
  );
  const frozenCreditsSum = rows.reduce(
    (sum, row) =>
      row.frozen_at != null ? sum + row.credits_remaining : sum,
    0
  );

  return (
    <AccountClient
      user={user}
      profile={profileRes.data}
      subscription={subRes.data}
      usage={usageAligned}
      creditSum={creditSum}
      frozenCreditsSum={frozenCreditsSum}
      portalCreditsFrozenHint={portalCreditsFrozenHint}
    />
  );
}
