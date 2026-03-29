import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export const FAMILY_POOL_CAP = 300;

export type FamilyUsageMemberRow = {
  userId: string;
  email: string;
  isOwner: boolean;
  assessmentsUsed: number;
  /** For avatar initials; optional for API consumers that only need spec fields */
  displayName: string | null;
};

export type FamilyUsagePayload = {
  totalUsed: number;
  cap: number;
  resetDate: string | null;
  creditsBalance: number;
  members: FamilyUsageMemberRow[];
};

function isActiveFamilySub(status: string | null | undefined): boolean {
  const s = (status ?? "").toLowerCase();
  return s === "active" || s === "trialing";
}

export async function getFamilyUsageDashboard(
  viewingUserId: string
): Promise<
  | { ok: true; data: FamilyUsagePayload }
  | { ok: false; status: number; error: string }
> {
  let admin: AdminClient;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, status: 503, error: "Server configuration error" };
  }

  const { data: viewerSub } = await admin
    .from("subscriptions")
    .select("tier, status")
    .eq("user_id", viewingUserId)
    .maybeSingle();

  if (
    viewerSub?.tier !== "family" ||
    !isActiveFamilySub(viewerSub.status)
  ) {
    return { ok: false, status: 403, error: "Family subscription required" };
  }

  const { data: membership } = await admin
    .from("family_members")
    .select("owner_user_id")
    .eq("member_user_id", viewingUserId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  const ownerUserId = membership?.owner_user_id ?? viewingUserId;

  if (ownerUserId !== viewingUserId) {
    const { data: memCheck } = await admin
      .from("family_members")
      .select("id")
      .eq("owner_user_id", ownerUserId)
      .eq("member_user_id", viewingUserId)
      .eq("status", "active")
      .maybeSingle();
    if (!memCheck) {
      return { ok: false, status: 403, error: "Not a member of this family" };
    }
  }

  const { data: ownerSub } = await admin
    .from("subscriptions")
    .select("tier, status, current_period_end")
    .eq("user_id", ownerUserId)
    .maybeSingle();

  if (
    ownerSub?.tier !== "family" ||
    !isActiveFamilySub(ownerSub.status)
  ) {
    return { ok: false, status: 403, error: "Family plan not active for owner" };
  }

  const { data: activeRows } = await admin
    .from("family_members")
    .select("member_user_id, invited_email")
    .eq("owner_user_id", ownerUserId)
    .eq("status", "active")
    .not("member_user_id", "is", null);

  const memberSlots =
    activeRows?.filter(
      (r): r is { member_user_id: string; invited_email: string | null } =>
        typeof r.member_user_id === "string" && r.member_user_id.length > 0
    ) ?? [];

  const memberUserIds = new Set<string>([ownerUserId]);
  for (const row of memberSlots) {
    memberUserIds.add(row.member_user_id);
  }

  const userIds = [...memberUserIds];
  const periodMonth = new Date().toISOString().slice(0, 7);

  const { data: usageRows } = await admin
    .from("usage_tracking")
    .select("user_id, assessments_used, assessments_cap")
    .in("user_id", userIds)
    .eq("period_month", periodMonth);

  const usageByUser = new Map<string, number>();
  for (const row of usageRows ?? []) {
    const uid = row.user_id as string;
    usageByUser.set(uid, Number(row.assessments_used) || 0);
  }

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const nameByUser = new Map<string, string | null>();
  for (const p of profiles ?? []) {
    nameByUser.set(p.id as string, (p.full_name as string | null) ?? null);
  }

  const nowIso = new Date().toISOString();
  const { data: creditRows } = await admin
    .from("credits")
    .select("credits_remaining")
    .eq("user_id", ownerUserId)
    .gt("credits_remaining", 0)
    .is("frozen_at", null)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`);

  const creditsBalance =
    creditRows?.reduce((s, r) => s + Number(r.credits_remaining || 0), 0) ??
    0;

  const membersBuilt: FamilyUsageMemberRow[] = [];

  async function pushMember(
    userId: string,
    isOwner: boolean,
    fallbackEmail: string | null
  ) {
    let email = fallbackEmail ?? "";
    let displayName = nameByUser.get(userId) ?? null;
    try {
      const { data: authData, error: authErr } =
        await admin.auth.admin.getUserById(userId);
      if (!authErr && authData?.user?.email) {
        email = authData.user.email;
      }
    } catch {
      /* keep fallback */
    }
    membersBuilt.push({
      userId,
      email: email || "—",
      isOwner,
      assessmentsUsed: usageByUser.get(userId) ?? 0,
      displayName,
    });
  }

  await pushMember(ownerUserId, true, null);

  for (const row of memberSlots) {
    if (row.member_user_id === ownerUserId) continue;
    await pushMember(row.member_user_id, false, row.invited_email);
  }

  membersBuilt.sort((a, b) => {
    if (a.isOwner) return -1;
    if (b.isOwner) return 1;
    return (a.email || "").localeCompare(b.email || "");
  });

  const totalUsed = membersBuilt.reduce((s, m) => s + m.assessmentsUsed, 0);

  return {
    ok: true,
    data: {
      totalUsed,
      cap: FAMILY_POOL_CAP,
      resetDate: (ownerSub.current_period_end as string | null) ?? null,
      creditsBalance,
      members: membersBuilt,
    },
  };
}
