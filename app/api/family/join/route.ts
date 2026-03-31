import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FAMILY_MAX_MEMBERS, normalizeInviteEmail } from "@/lib/family";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const raw = typeof body.inviteCode === "string" ? body.inviteCode.trim() : "";
    const inviteCode = raw.toUpperCase();
    if (!inviteCode) {
      return NextResponse.json({ error: "Invite code required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: rows } = await admin
      .from("family_members")
      .select("id, owner_user_id, invited_email, status")
      .eq("invite_code", inviteCode)
      .eq("status", "pending");

    const memberEmail = normalizeInviteEmail(user.email);
    const emailInviteRow = rows?.find(
      (r) =>
        r.invited_email &&
        normalizeInviteEmail(r.invited_email) === memberEmail
    );
    const codeOnlyRow = rows?.[0];
    const row = emailInviteRow ?? codeOnlyRow;

    if (!row) {
      return NextResponse.json(
        {
          error: "Invalid code or invite is no longer pending.",
        },
        { status: 400 }
      );
    }

    const { data: ownerSub } = await admin
      .from("subscriptions")
      .select("tier, status")
      .eq("user_id", row.owner_user_id)
      .maybeSingle();
    const ownerStatus = (ownerSub?.status ?? "").toLowerCase();
    const ownerHasActiveFamily =
      ownerSub?.tier === "family" &&
      (ownerStatus === "active" || ownerStatus === "trialing");
    if (!ownerHasActiveFamily) {
      return NextResponse.json(
        { error: "Family subscription is not active for this invite code" },
        { status: 403 }
      );
    }

    const { data: alreadyMember } = await admin
      .from("family_members")
      .select("id")
      .eq("member_user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (alreadyMember?.id) {
      return NextResponse.json(
        { error: "You are already an active member of a family plan" },
        { status: 400 }
      );
    }

    const { data: ownerRows } = await admin
      .from("family_members")
      .select("id, status")
      .eq("owner_user_id", row.owner_user_id)
      .in("status", ["pending", "active"]);
    const seatCount = ownerRows?.length ?? 0;
    if (seatCount >= FAMILY_MAX_MEMBERS) {
      return NextResponse.json(
        { error: `Maximum of ${FAMILY_MAX_MEMBERS} members reached` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { error: updErr } = await admin
      .from("family_members")
      .update({
        member_user_id: user.id,
        status: "active",
        joined_at: now,
        invited_email: memberEmail,
      })
      .eq("id", row.id)
      .eq("status", "pending");

    if (updErr) {
      console.error("family join update:", updErr);
      return NextResponse.json({ error: "Could not complete join" }, { status: 500 });
    }

    const { data: existingSub } = await admin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const { error: subErr } = await admin.from("subscriptions").upsert(
      {
        user_id: user.id,
        tier: "family",
        status: "active",
        is_lifetime: existingSub?.is_lifetime ?? false,
        assessments_cap: 600,
        stripe_customer_id: existingSub?.stripe_customer_id ?? null,
        stripe_subscription_id: existingSub?.stripe_subscription_id ?? null,
        current_period_start: existingSub?.current_period_start ?? null,
        current_period_end: existingSub?.current_period_end ?? null,
        cancel_at_period_end: existingSub?.cancel_at_period_end ?? false,
        updated_at: now,
      },
      { onConflict: "user_id" }
    );

    if (subErr) {
      console.error("family join subscription:", subErr);
    }

    const periodMonth = now.slice(0, 7);
    const { data: utRow } = await admin
      .from("usage_tracking")
      .select("id")
      .eq("user_id", user.id)
      .eq("period_month", periodMonth)
      .maybeSingle();

    if (utRow?.id) {
      await admin
        .from("usage_tracking")
        .update({ assessments_cap: 600 })
        .eq("id", utRow.id);
    }

    return NextResponse.json({
      success: true,
      ownerUserId: row.owner_user_id,
    });
  } catch (e) {
    console.error("family join:", e);
    return NextResponse.json({ error: "Join failed" }, { status: 500 });
  }
}
