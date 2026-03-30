import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getFamilyUsageDashboard,
  type FamilyUsagePayload,
} from "@/lib/familyUsage";
import FamilyManageClient, {
  type FamilyMemberRow,
} from "./FamilyManageClient";

export default async function FamilyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/signin?redirect=/family");
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("tier, status")
    .eq("user_id", user.id)
    .maybeSingle();

  const subStatus = (sub?.status ?? "").toLowerCase();
  const isFamily =
    sub?.tier === "family" &&
    (subStatus === "active" || subStatus === "trialing");

  const { data: memberRow } = await supabase
    .from("family_members")
    .select("owner_user_id, invited_email, joined_at, status")
    .eq("member_user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const isFamilyMember = !!memberRow?.owner_user_id;
  const familyOwnerId = memberRow?.owner_user_id ?? null;
  const isMemberNotOwner = !isFamily && isFamilyMember;

  const periodMonth = new Date().toISOString().slice(0, 7);
  let memberMonthlyUsage = 0;
  const { data: utRow } = await supabase
    .from("usage_tracking")
    .select("assessments_used")
    .eq("user_id", user.id)
    .eq("period_month", periodMonth)
    .maybeSingle();
  memberMonthlyUsage = Number(utRow?.assessments_used) || 0;

  let ownerInviteLabel = "Plan owner";
  let memberPoolUsage: FamilyUsagePayload | null = null;

  if (isMemberNotOwner && familyOwnerId) {
    const { data: ownerProf } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", familyOwnerId)
      .maybeSingle();
    if (ownerProf?.full_name?.trim()) {
      ownerInviteLabel = ownerProf.full_name.trim();
    } else {
      try {
        const admin = createAdminClient();
        const { data: au } = await admin.auth.admin.getUserById(familyOwnerId);
        const em = au?.user?.email;
        if (em) {
          ownerInviteLabel = em.split("@")[0] || em;
        }
      } catch {
        /* keep label */
      }
    }
    const poolResult = await getFamilyUsageDashboard(familyOwnerId);
    if (poolResult.ok) {
      memberPoolUsage = poolResult.data;
    }
  }

  let initialUsage = null;
  if (isFamily) {
    const usageResult = await getFamilyUsageDashboard(user.id);
    if (usageResult.ok) {
      initialUsage = usageResult.data;
    }
  }

  const { data: rawMembers } = await supabase
    .from("family_members")
    .select(
      "id, invited_email, status, joined_at, invited_at, invite_code"
    )
    .eq("owner_user_id", user.id)
    .order("invited_at", { ascending: true });

  const initialMembers = (rawMembers ?? []) as FamilyMemberRow[];
  const initialShareCode =
    initialMembers.find((m) => m.invite_code)?.invite_code?.toUpperCase() ??
    null;

  return (
    <FamilyManageClient
      isFamily={isFamily}
      isMemberNotOwner={isMemberNotOwner}
      ownerInviteLabel={ownerInviteLabel}
      memberMonthlyUsage={memberMonthlyUsage}
      memberPoolUsage={memberPoolUsage}
      initialMembers={initialMembers}
      initialShareCode={initialShareCode}
      initialUsage={initialUsage}
    />
  );
}
