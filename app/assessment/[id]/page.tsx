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
  );
}
