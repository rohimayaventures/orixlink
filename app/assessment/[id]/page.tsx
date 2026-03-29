import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SessionDetailClient from "./SessionDetailClient";

export default async function AssessmentSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/signin?redirect=${encodeURIComponent(`/assessment/${id}`)}`);
  }

  const { data: session, error } = await supabase
    .from("sessions")
    .select("id, role, context, urgency_level, created_at, user_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !session || session.user_id !== user.id) {
    notFound();
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  return (
    <div style={{ background: "#080C14", minHeight: "100vh" }}>
      <SessionDetailClient
        session={{
          id: session.id as string,
          role: session.role as string,
          context: session.context as string | null,
          urgency_level: session.urgency_level as string | null,
          created_at: session.created_at as string,
        }}
        messages={
          (messages ?? []).map((m) => ({
            id: m.id as string,
            role: m.role as string,
            content: m.content as string,
            created_at: m.created_at as string,
          }))
        }
      />
      <p
        style={{
          fontFamily: "DM Sans, sans-serif",
          fontSize: 12,
          color: "rgba(244,239,230,0.45)",
          textAlign: "center",
          paddingTop: 24,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          maxWidth: 720,
          margin: "0 auto",
          paddingLeft: 20,
          paddingRight: 20,
          paddingBottom: 48,
          lineHeight: 1.6,
          boxSizing: "border-box",
        }}
      >
        OrixLink AI assessments are AI-generated and for informational purposes
        only. Not a substitute for professional medical advice. In an emergency
        call 911.
      </p>
    </div>
  );
}
