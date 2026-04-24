import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInviteCode } from "@/lib/family";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: sub } = await admin
      .from("subscriptions")
      .select("tier, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sub || sub.tier !== "family") {
      return NextResponse.json(
        { error: "Family subscription required" },
        { status: 403 }
      );
    }
    if (sub.status !== "active" && sub.status !== "trialing") {
      return NextResponse.json(
        { error: "Subscription is not active" },
        { status: 403 }
      );
    }

    const { data: existing } = await admin
      .from("family_members")
      .select("invite_code")
      .eq("owner_user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (existing?.invite_code) {
      return NextResponse.json({
        code: String(existing.invite_code).toUpperCase(),
      });
    }

    const code = generateInviteCode();
    const { error } = await admin.from("family_members").insert({
      owner_user_id: user.id,
      // Code-only invite row: email is populated on join when a member redeems the code.
      invited_email: null,
      invite_code: code,
      status: "pending",
    });

    if (error) {
      console.error("family generate-code insert:", error);
      return NextResponse.json({ error: "Failed to generate code" }, { status: 500 });
    }

    return NextResponse.json({ code });
  } catch (e) {
    console.error("family generate-code:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
