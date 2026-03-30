import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function isActiveFamilySub(status: string | null | undefined): boolean {
  const s = (status ?? "").toLowerCase();
  return s === "active" || s === "trialing";
}

export type FamilyMemberOption = {
  userId: string;
  label: string;
};

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 503 }
      );
    }

    const { data: sub } = await admin
      .from("subscriptions")
      .select("tier, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (sub?.tier !== "family" || !isActiveFamilySub(sub.status)) {
      return NextResponse.json({ isOwner: false, members: [] as FamilyMemberOption[] });
    }

    const { data: asMember } = await admin
      .from("family_members")
      .select("owner_user_id")
      .eq("member_user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    const isInvitedOnly =
      !!asMember &&
      typeof asMember.owner_user_id === "string" &&
      asMember.owner_user_id !== user.id;

    const isOwner = !isInvitedOnly;

    if (!isOwner) {
      return NextResponse.json({ isOwner: false, members: [] as FamilyMemberOption[] });
    }

    const { data: rows } = await admin
      .from("family_members")
      .select("member_user_id, invited_email")
      .eq("owner_user_id", user.id)
      .eq("status", "active")
      .not("member_user_id", "is", null);

    const slots =
      rows?.filter(
        (r): r is { member_user_id: string; invited_email: string | null } =>
          typeof r.member_user_id === "string" && r.member_user_id.length > 0
      ) ?? [];

    const members: FamilyMemberOption[] = [];

    for (const row of slots) {
      if (row.member_user_id === user.id) continue;
      let label =
        (row.invited_email as string | null)?.trim() || "Family member";
      const { data: prof } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", row.member_user_id)
        .maybeSingle();
      const fn = prof?.full_name?.trim();
      if (fn) label = fn;
      try {
        const { data: authData } = await admin.auth.admin.getUserById(
          row.member_user_id
        );
        if (authData?.user?.email && !fn) {
          label = authData.user.email;
        }
      } catch {
        /* keep label */
      }
      members.push({ userId: row.member_user_id, label });
    }

    return NextResponse.json({ isOwner: true, members });
  } catch (e) {
    console.error("family members GET", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
