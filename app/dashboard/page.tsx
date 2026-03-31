import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import { ensureUsageTrackingForMonth } from "@/lib/ensureUsageTracking";

const CARD = {
  background: "#0D1220",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 12,
  padding: "1.25rem",
} as const;

const TEXT = "#F4EFE6";
const MUTED = "rgba(244,239,230,0.5)";
const GOLD = "#C8A96E";

const URGENCY_ROW: Record<
  string,
  { label: string; bg: string; border: string; color: string }
> = {
  EMERGENCY_DEPARTMENT_NOW: {
    label: "Emergency",
    bg: "rgba(239,68,68,0.14)",
    border: "rgba(239,68,68,0.45)",
    color: "#FCA5A5",
  },
  URGENT_CARE: {
    label: "Urgent care",
    bg: "rgba(249,115,22,0.14)",
    border: "rgba(249,115,22,0.45)",
    color: "#FDBA74",
  },
  CONTACT_DOCTOR_TODAY: {
    label: "Contact doctor",
    bg: "rgba(234,179,8,0.14)",
    border: "rgba(234,179,8,0.45)",
    color: "#FDE047",
  },
  MONITOR_AT_HOME: {
    label: "Monitor at home",
    bg: "rgba(34,197,94,0.14)",
    border: "rgba(34,197,94,0.45)",
    color: "#86EFAC",
  },
};

function formatResetDate(
  sub: { tier: string; current_period_end: string | null } | null,
  periodMonth: string
): string {
  if (sub?.tier === "lifetime") {
    return "No monthly reset — lifetime access";
  }
  if (sub?.current_period_end) {
    return new Date(sub.current_period_end).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
  const [y, mo] = periodMonth.split("-").map(Number);
  const last = new Date(y, mo, 0);
  return last.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function rowPreview(
  session: { role: string; context: string | null },
  preview: string | undefined
): string {
  const raw = preview?.trim() || `${session.role} · ${session.context || "Assessment"}`;
  return raw.length > 60 ? `${raw.slice(0, 57)}…` : raw;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const periodMonth = new Date().toISOString().slice(0, 7);

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("tier, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  const usageRow =
    (await ensureUsageTrackingForMonth(supabase, user.id, periodMonth, sub)) ?? {
      assessments_used: 0,
      assessments_cap: 5,
      period_month: periodMonth,
    };

  const used = Number(usageRow.assessments_used) || 0;
  const cap = Number(usageRow.assessments_cap) || 5;
  const pct = cap > 0 ? Math.min(100, (used / cap) * 100) : 0;
  const remaining = Math.max(0, cap - used);
  const tier = (sub?.tier as string) || "free";
  const showUpgradeBanner = tier === "free" && remaining === 0;

  let creditsBalance = 0;
  const { data: creditsData } = await supabase
    .from("credits")
    .select("credits_remaining")
    .eq("user_id", user.id)
    .gt("credits_remaining", 0);
  creditsBalance =
    creditsData?.reduce((sum, row) => sum + row.credits_remaining, 0) ?? 0;

  const { data: recentSessions } = await supabase
    .from("sessions")
    .select(
      `
      id,
      urgency_level,
      created_at,
      role,
      context,
      messages (
        content,
        role,
        created_at
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  type SessionMsg = {
    content: string;
    role: string;
    created_at: string;
  };

  const sessionsWithPreview =
    recentSessions?.map((session) => {
      const msgs = (session.messages as SessionMsg[] | null) ?? [];
      const firstUserMessage = msgs
        .filter((m) => m.role === "user")
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        )[0];
      const preview = firstUserMessage?.content
        ? String(firstUserMessage.content)
        : undefined;
      return {
        id: session.id as string,
        role: session.role as string,
        context: session.context as string | null,
        created_at: session.created_at as string,
        urgency_level: session.urgency_level as string | null,
        preview,
      };
    }) ?? [];

  const resetLabel = formatResetDate(sub, periodMonth);

  return (
    <AppShell contentTopPadding={96}>
      <div className="px-5 sm:px-8 pb-20" style={{ maxWidth: 640, margin: "0 auto" }}>
        <p
          className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase mb-2"
          style={{ color: "var(--gold-muted)" }}
        >
          Home
        </p>
        <h1
          className="font-display"
          style={{ fontSize: "2.25rem", fontWeight: 400, marginBottom: 24, color: TEXT }}
        >
          Dashboard
        </h1>

        {/* Section 1 — usage */}
        <div style={{ ...CARD, marginBottom: 20 }}>
          <p
            style={{
              fontSize: "0.9375rem",
              color: TEXT,
              marginBottom: 12,
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            {used} of {cap} assessments used this month
          </p>
          <div
            style={{
              height: 6,
              borderRadius: 4,
              background: "rgba(255,255,255,0.07)",
              overflow: "hidden",
              marginBottom: 10,
            }}
          >
            <div style={{ width: `${pct}%`, height: "100%", background: GOLD, borderRadius: 4 }} />
          </div>
          <p
            style={{
              fontSize: 13,
              color: MUTED,
              margin: 0,
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            Resets {resetLabel}
          </p>
          {showUpgradeBanner && (
            <div
              style={{
                marginTop: 16,
                padding: "12px 14px",
                borderRadius: 8,
                background: "rgba(200,169,110,0.1)",
                border: "1px solid rgba(200,169,110,0.3)",
                fontSize: 13,
                color: GOLD,
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              Upgrade to Pro for 150 assessments/month —{" "}
              <Link href="/pricing" style={{ color: GOLD, fontWeight: 600, textDecoration: "underline" }}>
                View pricing
              </Link>
            </div>
          )}
        </div>

        {/* Section 2 — quick action */}
        <Link
          href="/"
          className="orix-btn-gold"
          style={{
            display: "block",
            width: "100%",
            textAlign: "center",
            padding: "14px 20px",
            borderRadius: 12,
            fontFamily: "DM Sans, sans-serif",
            textDecoration: "none",
            marginBottom: 24,
          }}
        >
          Start new assessment
        </Link>

        {/* Section 3 — recent */}
        <div style={{ ...CARD, marginBottom: 16 }}>
          <h2
            className="font-display"
            style={{ fontSize: 20, color: TEXT, marginBottom: 16, fontWeight: 500 }}
          >
            Recent assessments
          </h2>
          {!sessionsWithPreview.length ? (
            <p
              style={{
                textAlign: "center",
                color: "rgba(244,239,230,0.65)",
                fontSize: 14,
                margin: "8px 0 0",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              No assessments yet. Start your first one above.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {sessionsWithPreview.map((s) => {
                const u = s.urgency_level;
                const URGENCY_UNKNOWN_ROW = {
                  label: "Urgency unknown",
                  bg: "rgba(212,136,42,0.14)",
                  border: "rgba(212,136,42,0.45)",
                  color: "#D4882A",
                };
                const meta =
                  u && URGENCY_ROW[u]
                    ? URGENCY_ROW[u]
                    : URGENCY_UNKNOWN_ROW;
                const dateStr = new Date(s.created_at).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric", year: "numeric" }
                );
                return (
                  <li
                    key={s.id}
                    className="orix-clickable-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.06em",
                        padding: "4px 8px",
                        borderRadius: 100,
                        background: meta.bg,
                        border: `1px solid ${meta.border}`,
                        color: meta.color,
                        flexShrink: 0,
                        textTransform: "uppercase",
                      }}
                    >
                      {meta.label}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          color: TEXT,
                          fontFamily: "DM Sans, sans-serif",
                          lineHeight: 1.4,
                        }}
                      >
                        {rowPreview(
                          { role: s.role, context: s.context },
                          s.preview
                        )}
                      </p>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: 12,
                          color: MUTED,
                          fontFamily: "DM Sans, sans-serif",
                        }}
                      >
                        {dateStr}
                      </p>
                    </div>
                    <Link
                      href={`/assessment/${s.id}`}
                      className="orix-link"
                      style={{
                        flexShrink: 0,
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: "DM Sans, sans-serif",
                      }}
                    >
                      View
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Section 4 */}
        <p style={{ textAlign: "center", marginBottom: 20 }}>
          <Link
            href="/history"
            className="orix-link"
            style={{
              fontSize: 13,
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            View full history
          </Link>
        </p>

        {/* Section 5 */}
        {creditsBalance > 0 && (
          <p
            style={{
              fontSize: 13,
              color: MUTED,
              textAlign: "center",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            You have {creditsBalance} assessment credits in your account.
          </p>
        )}
      </div>
    </AppShell>
  );
}
