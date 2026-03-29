import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminUserRow = {
  id: string;
  email: string;
  created_at: string | undefined;
  tier: string;
  assessments_used: number;
  assessments_cap: number | null;
  credits_total: number;
};

export type AdminPaidSubRow = {
  user_id: string;
  email: string;
  tier: string;
  status: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export type AdminCreditHistoryRow = {
  id: string;
  email: string;
  pack_name: string | null;
  credits_purchased: number;
  credits_remaining: number;
  purchased_at: string;
  frozen: boolean;
};

export type AdminDashboardPayload = {
  stats: {
    registeredUsers: number;
    assessmentsToday: number;
    activePaidSubs: number;
    totalAssessmentsMonth: number;
  };
  users: AdminUserRow[];
  usersTotal: number;
  usersPage: number;
  usersQ: string;
  paidRows: AdminPaidSubRow[];
  paidCount: number;
  subsPage: number;
  langCounts: Record<string, number>;
  urgCounts: Record<string, number>;
  topUsers: { email: string; assessments_used: number }[];
  creditHistory: AdminCreditHistoryRow[];
};

const NIL = "00000000-0000-0000-0000-000000000000";

function monthBoundsUtc(ym: string): { start: string; endExclusive: string } {
  const [yStr, moStr] = ym.split("-");
  const y = Number(yStr);
  const mo = Number(moStr);
  const start = new Date(Date.UTC(y, mo - 1, 1)).toISOString();
  const endExclusive = new Date(Date.UTC(y, mo, 1)).toISOString();
  return { start, endExclusive };
}

export async function loadAdminDashboardData(
  admin: SupabaseClient,
  opts: { q: string; usersPage: number; subsPage: number }
): Promise<AdminDashboardPayload> {
  const ym = new Date().toISOString().slice(0, 7);
  const startDay = new Date();
  startDay.setUTCHours(0, 0, 0, 0);

  const [
    profilesCountRes,
    usageTodayRes,
    proPlusRes,
    usageMonthRes,
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin
      .from("usage_tracking")
      .select("*", { count: "exact", head: true })
      .gte("updated_at", startDay.toISOString())
      .gt("assessments_used", 0),
    admin
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .in("tier", ["pro", "family", "clinical", "lifetime"])
      .eq("status", "active"),
    admin.from("usage_tracking").select("assessments_used").eq("period_month", ym),
  ]);

  const totalAssessmentsMonth = (usageMonthRes.data ?? []).reduce(
    (s, r) => s + Number(r.assessments_used || 0),
    0
  );

  const authUsers: { id: string; email?: string; created_at?: string }[] = [];
  let page = 1;
  const per = 200;
  while (page <= 50) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: per,
    });
    if (error) break;
    authUsers.push(
      ...data.users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
      }))
    );
    if (data.users.length < per) break;
    page++;
  }

  const q = (opts.q ?? "").trim().toLowerCase();
  const filtered = authUsers.filter((u) => {
    if (!q) return true;
    return (u.email ?? "").toLowerCase().includes(q);
  });
  filtered.sort((a, b) =>
    (b.created_at ?? "").localeCompare(a.created_at ?? "")
  );

  const usersTotal = filtered.length;
  const from = (opts.usersPage - 1) * 25;
  const pageSlice = filtered.slice(from, from + 25);
  const ids = pageSlice.map((u) => u.id);

  const subBy = new Map<string, { tier: string }>();
  const useBy = new Map<
    string,
    { assessments_used: number; assessments_cap: number }
  >();
  const creditSumBy = new Map<string, number>();

  if (ids.length > 0) {
    const [{ data: subsRows }, { data: usageRows }, { data: creditsRows }] =
      await Promise.all([
        admin.from("subscriptions").select("user_id,tier").in("user_id", ids),
        admin
          .from("usage_tracking")
          .select("user_id,assessments_used,assessments_cap")
          .eq("period_month", ym)
          .in("user_id", ids),
        admin
          .from("credits")
          .select("user_id,credits_remaining")
          .in("user_id", ids),
      ]);

    for (const r of subsRows ?? []) {
      subBy.set(r.user_id as string, { tier: r.tier as string });
    }
    for (const r of usageRows ?? []) {
      useBy.set(r.user_id as string, {
        assessments_used: Number(r.assessments_used) || 0,
        assessments_cap: Number(r.assessments_cap) || 0,
      });
    }
    for (const c of creditsRows ?? []) {
      const uid = c.user_id as string;
      creditSumBy.set(
        uid,
        (creditSumBy.get(uid) ?? 0) + Number(c.credits_remaining || 0)
      );
    }
  }

  const userRows: AdminUserRow[] = pageSlice.map((u) => {
    const uu = useBy.get(u.id);
    return {
      id: u.id,
      email: u.email ?? "—",
      created_at: u.created_at,
      tier: subBy.get(u.id)?.tier ?? "free",
      assessments_used: uu?.assessments_used ?? 0,
      assessments_cap: uu?.assessments_cap ?? null,
      credits_total: creditSumBy.get(u.id) ?? 0,
    };
  });

  const subFrom = (opts.subsPage - 1) * 25;
  const { data: paidSubs, count: paidCount } = await admin
    .from("subscriptions")
    .select(
      "user_id,tier,status,stripe_subscription_id,stripe_customer_id,current_period_end,cancel_at_period_end",
      { count: "exact" }
    )
    .neq("tier", "free")
    .order("updated_at", { ascending: false })
    .range(subFrom, subFrom + 24);

  const emailById = new Map<string, string>();
  for (const u of authUsers) {
    emailById.set(u.id, u.email ?? "—");
  }

  async function resolveEmail(uid: string): Promise<string> {
    if (emailById.has(uid)) return emailById.get(uid)!;
    const { data } = await admin.auth.admin.getUserById(uid);
    const em = data.user?.email ?? "—";
    emailById.set(uid, em);
    return em;
  }

  const paidRows: AdminPaidSubRow[] = [];
  for (const s of paidSubs ?? []) {
    const uid = s.user_id as string;
    paidRows.push({
      user_id: uid,
      email: await resolveEmail(uid),
      tier: s.tier as string,
      status: s.status as string,
      stripe_subscription_id: s.stripe_subscription_id as string | null,
      stripe_customer_id: s.stripe_customer_id as string | null,
      current_period_end: s.current_period_end as string | null,
      cancel_at_period_end: Boolean(s.cancel_at_period_end),
    });
  }

  const { start: monthStart, endExclusive } = monthBoundsUtc(ym);

  const { data: sessLang } = await admin
    .from("sessions")
    .select("language")
    .gte("created_at", monthStart)
    .lt("created_at", endExclusive);

  const langCounts: Record<string, number> = {};
  for (const r of sessLang ?? []) {
    const k = String(r.language);
    langCounts[k] = (langCounts[k] ?? 0) + 1;
  }

  const { data: sessUrg } = await admin
    .from("sessions")
    .select("urgency_level")
    .gte("created_at", monthStart)
    .lt("created_at", endExclusive);

  const urgCounts: Record<string, number> = {};
  for (const r of sessUrg ?? []) {
    const k =
      r.urgency_level == null ? "unknown" : String(r.urgency_level);
    urgCounts[k] = (urgCounts[k] ?? 0) + 1;
  }

  const { data: topUsage } = await admin
    .from("usage_tracking")
    .select("user_id,assessments_used")
    .eq("period_month", ym)
    .order("assessments_used", { ascending: false })
    .limit(10);

  const topUsers: { email: string; assessments_used: number }[] = [];
  for (const row of topUsage ?? []) {
    const uid = row.user_id as string;
    topUsers.push({
      email: await resolveEmail(uid),
      assessments_used: Number(row.assessments_used) || 0,
    });
  }

  const { data: credHist } = await admin
    .from("credits")
    .select(
      "id,user_id,pack_name,credits_purchased,credits_remaining,purchased_at,frozen_at"
    )
    .order("purchased_at", { ascending: false })
    .limit(50);

  const creditHistory: AdminCreditHistoryRow[] = [];
  for (const c of credHist ?? []) {
    const uid = c.user_id as string;
    creditHistory.push({
      id: c.id as string,
      email: await resolveEmail(uid),
      pack_name: c.pack_name as string | null,
      credits_purchased: Number(c.credits_purchased) || 0,
      credits_remaining: Number(c.credits_remaining) || 0,
      purchased_at: (c.purchased_at as string) ?? "",
      frozen: c.frozen_at != null,
    });
  }

  return {
    stats: {
      registeredUsers: profilesCountRes.count ?? 0,
      assessmentsToday: usageTodayRes.count ?? 0,
      activePaidSubs: proPlusRes.count ?? 0,
      totalAssessmentsMonth,
    },
    users: userRows,
    usersTotal,
    usersPage: opts.usersPage,
    usersQ: opts.q,
    paidRows,
    paidCount: paidCount ?? 0,
    subsPage: opts.subsPage,
    langCounts,
    urgCounts,
    topUsers,
    creditHistory,
  };
}
