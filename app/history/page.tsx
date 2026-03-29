import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import AppShell from "@/components/AppShell";

const TEXT = "#F4EFE6";
const MUTED = "rgba(244,239,230,0.5)";

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

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, role, context, created_at, urgency_level")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <AppShell contentTopPadding={96}>
      <div className="px-5 sm:px-8 pb-16" style={{ maxWidth: 720, margin: "0 auto" }}>
        <p
          className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase mb-2"
          style={{ color: "var(--gold-muted)" }}
        >
          Saved sessions
        </p>
        <h1
          className="font-display"
          style={{ fontSize: "2.25rem", fontWeight: 400, marginBottom: 8, color: TEXT }}
        >
          History
        </h1>
        <p
          style={{
            color: MUTED,
            marginBottom: 24,
            fontFamily: "var(--font-body), sans-serif",
            fontSize: "0.9375rem",
          }}
        >
          Saved assessments linked to your account.
        </p>
        {!sessions?.length ? (
          <p style={{ color: MUTED }}>
            No saved sessions yet.{" "}
            <Link href="/assessment" className="orix-link" style={{ textDecoration: "underline" }}>
              Run an assessment
            </Link>
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {sessions.map((s) => {
              const u = s.urgency_level as string | null;
              const meta =
                u && URGENCY_ROW[u]
                  ? URGENCY_ROW[u]
                  : URGENCY_ROW.CONTACT_DOCTOR_TODAY;
              return (
                <li
                  key={s.id as string}
                  className="orix-clickable-row"
                  style={{
                    padding: "1rem 1.25rem",
                    marginBottom: 10,
                    background: "#0D1220",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 12,
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: 10,
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.06em",
                        padding: "4px 8px",
                        borderRadius: 100,
                        background: meta.bg,
                        border: `1px solid ${meta.border}`,
                        color: meta.color,
                        marginBottom: 8,
                        textTransform: "uppercase",
                      }}
                    >
                      {meta.label}
                    </span>
                    <p style={{ margin: 0, fontSize: "0.8125rem", color: MUTED, fontFamily: "var(--font-mono)" }}>
                      {new Date(s.created_at as string).toLocaleString()}
                    </p>
                    <p style={{ margin: "8px 0 0", color: TEXT }}>
                      {s.role as string} · {s.context as string}
                    </p>
                  </div>
                  <Link
                    href={`/assessment/${s.id}`}
                    className="orix-btn-outline"
                    style={{
                      fontSize: "0.875rem",
                      fontFamily: "DM Sans, sans-serif",
                      textDecoration: "none",
                      padding: "8px 16px",
                      borderRadius: 8,
                    }}
                  >
                    View
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {sessions && sessions.length > 0 ? (
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: 11,
              color: "rgba(244,239,230,0.45)",
              marginTop: 16,
              marginBottom: 0,
              lineHeight: 1.5,
            }}
          >
            AI-generated assessment. Not medical advice.
          </p>
        ) : null}
        <p
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: 12,
            color: "rgba(244,239,230,0.45)",
            marginTop: sessions?.length ? 20 : 16,
            marginBottom: 0,
            lineHeight: 1.6,
          }}
        >
          To export your full assessment history, email{" "}
          <a
            href="mailto:support@rohimaya.ai?subject=Data%20export%20request"
            className="orix-link"
            style={{ textDecoration: "underline" }}
          >
            support@rohimaya.ai
          </a>{" "}
          with the subject line &apos;Data export request&apos;.
        </p>
      </div>
    </AppShell>
  );
}
