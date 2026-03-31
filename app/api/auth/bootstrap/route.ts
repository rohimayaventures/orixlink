import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id, tier")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingSub) {
      const now = new Date().toISOString();
      await supabase.from("subscriptions").insert({
        user_id: user.id,
        tier: "free",
        status: "active",
        created_at: now,
        updated_at: now,
      });
    }

    const yearMonth = new Date().toISOString().slice(0, 7);
    await supabase
      .from("usage_tracking")
      .upsert(
      {
        user_id: user.id,
        period_month: yearMonth,
        assessments_used: 0,
        assessments_cap: 5,
      },
      { onConflict: "user_id,period_month", ignoreDuplicates: true }
      );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Bootstrap failed" }, { status: 500 });
  }
}
