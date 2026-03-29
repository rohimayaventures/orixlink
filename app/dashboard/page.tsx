import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import AppShell from "@/components/AppShell";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <AppShell contentTopPadding={96}>
      <div className="px-5 sm:px-8 pb-16" style={{ maxWidth: 640, margin: "0 auto" }}>
        <p
          className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase mb-2"
          style={{ color: "var(--gold-muted)" }}
        >
          Overview
        </p>
        <h1
          className="font-display"
          style={{ fontSize: "2.25rem", fontWeight: 400, marginBottom: 12, color: "var(--text-on-dark)" }}
        >
          Dashboard
        </h1>
        <p
          style={{
            color: "var(--text-muted-dark)",
            marginBottom: 28,
            fontFamily: "var(--font-body), sans-serif",
            fontSize: "0.9375rem",
          }}
        >
          Signed in as {user.email}
        </p>
        <div className="card-dark" style={{ padding: "24px 28px" }}>
          <Link
            href="/assessment"
            className="font-semibold"
            style={{ color: "var(--gold)", fontFamily: "var(--font-body), sans-serif" }}
          >
            New assessment →
          </Link>
          <p className="mt-3 text-sm" style={{ color: "var(--text-muted-dark)" }}>
            Run a triage session or continue where you left off.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
