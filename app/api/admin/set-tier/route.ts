import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/assertAdminApi";
import { PAID_TIERS_FOR_ADMIN, assessmentsCapForTier } from "@/lib/admin/tierCaps";

export async function POST(request: Request) {
  const gate = await assertAdminApi();
  if (!gate.ok) return gate.response;

  const body = await request.json();
  const userId = body.userId as string | undefined;
  const tier = body.tier as string | undefined;

  const validTier = new Set<string>(PAID_TIERS_FOR_ADMIN);
  if (!userId || !tier || !validTier.has(tier)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const cap = assessmentsCapForTier(tier);
  const { admin } = gate.ctx;
  const ym = new Date().toISOString().slice(0, 7);

  const { error: subErr } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      tier,
      status: "active",
      is_lifetime: tier === "lifetime",
      assessments_cap: cap,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (subErr) {
    console.error(subErr);
    return NextResponse.json({ error: "Subscription update failed" }, { status: 500 });
  }

  const { data: ut } = await admin
    .from("usage_tracking")
    .select("id, assessments_used")
    .eq("user_id", userId)
    .eq("year_month", ym)
    .maybeSingle();

  if (ut) {
    await admin
      .from("usage_tracking")
      .update({ assessments_cap: cap })
      .eq("id", ut.id);
  } else {
    await admin.from("usage_tracking").insert({
      user_id: userId,
      year_month: ym,
      assessments_used: 0,
      assessments_cap: cap,
    });
  }

  return NextResponse.json({ success: true });
}
