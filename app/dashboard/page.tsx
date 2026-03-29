import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--obsidian)",
        color: "var(--text-on-dark)",
        padding: "120px 24px",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 className="font-display" style={{ fontSize: "2rem", marginBottom: 16 }}>
          Dashboard
        </h1>
        <p style={{ color: "var(--text-muted-dark)", marginBottom: 24 }}>
          Signed in as {user.email}
        </p>
        <Link href="/assessment" style={{ color: "var(--gold)" }}>
          New assessment →
        </Link>
      </div>
    </main>
  );
}
