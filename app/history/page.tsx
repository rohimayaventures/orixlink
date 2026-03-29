import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

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
    <main
      style={{
        minHeight: "100vh",
        background: "var(--cream)",
        padding: "100px 24px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 className="font-display" style={{ fontSize: "2rem", marginBottom: 8 }}>
          History
        </h1>
        <p style={{ color: "var(--text-muted-light)", marginBottom: 24 }}>
          Saved assessments linked to your account.
        </p>
        {!sessions?.length ? (
          <p style={{ color: "var(--text-muted-light)" }}>
            No saved sessions yet.{" "}
            <Link href="/assessment" style={{ color: "var(--gold)" }}>
              Run an assessment
            </Link>
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {sessions.map((s) => (
              <li
                key={s.id}
                className="card-clinical"
                style={{ padding: 16, marginBottom: 10 }}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                  {new Date(s.created_at as string).toLocaleString()}
                </span>
                <p style={{ margin: "8px 0 0", color: "var(--text-on-light)" }}>
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
    </main>
  );
}
