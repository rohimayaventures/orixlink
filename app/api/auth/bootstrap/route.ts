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

    await supabase.from("subscriptions").upsert(
      {
        user_id: user.id,
        tier: "free",
        status: "active",
        is_lifetime: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    const yearMonth = new Date().toISOString().slice(0, 7);
    const { data: existing } = await supabase
      .from("usage_tracking")
      .select("id")
      .eq("user_id", user.id)
      .eq("year_month", yearMonth)
      .maybeSingle();

    if (!existing) {
      await supabase.from("usage_tracking").insert({
        user_id: user.id,
        year_month: yearMonth,
        assessments_used: 0,
        assessments_cap: 5,
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Bootstrap failed" }, { status: 500 });
  }
}
