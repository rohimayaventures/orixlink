import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import AppShell from "@/components/AppShell";

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
          style={{ fontSize: "2.25rem", fontWeight: 400, marginBottom: 8, color: "var(--text-on-dark)" }}
        >
          History
        </h1>
        <p
          style={{
            color: "var(--text-muted-dark)",
            marginBottom: 24,
            fontFamily: "var(--font-body), sans-serif",
            fontSize: "0.9375rem",
          }}
        >
          Saved assessments linked to your account.
        </p>
        {!sessions?.length ? (
          <p style={{ color: "var(--text-muted-dark)" }}>
            No saved sessions yet.{" "}
            <Link href="/assessment" style={{ color: "var(--gold)" }}>
              Run an assessment
            </Link>
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {sessions.map((s) => (
              <li key={s.id} className="card-dark" style={{ padding: 16, marginBottom: 10 }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                    color: "var(--gold-muted)",
                  }}
                >
                  {new Date(s.created_at as string).toLocaleString()}
                </span>
                <p style={{ margin: "8px 0 0", color: "var(--text-on-dark)" }}>
                  {s.role as string} · {s.context as string}
                  {s.urgency_level
                    ? ` · ${String(s.urgency_level).replace(/_/g, " ")}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
