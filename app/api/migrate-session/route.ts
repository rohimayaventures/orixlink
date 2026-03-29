import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type SessionData = {
  role: string;
  context: string;
  language: string;
  patientAge?: string;
  symptoms?: string;
  assistantResponse?: string;
  messages?: { role: string; content: string }[];
  urgencyLevel?: string | null;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const sessionData = body.sessionData as SessionData | undefined;
    const bodyUserId = body.userId as string | undefined;
    if (bodyUserId && bodyUserId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!sessionData?.role || !sessionData.context) {
      return NextResponse.json({ error: "Invalid session data" }, { status: 400 });
    }

    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return NextResponse.json(
        { error: "Server is not configured for migration" },
        { status: 503 }
      );
    }

    const { data: insertedSession, error: sessionErr } = await admin
      .from("sessions")
      .insert({
        user_id: user.id,
        role: sessionData.role,
        context: sessionData.context,
        language: sessionData.language || "en",
        urgency_level: sessionData.urgencyLevel ?? null,
      })
      .select("id")
      .single();

    if (sessionErr || !insertedSession) {
      console.error(sessionErr);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    const sessionId = insertedSession.id as string;
    const msgs = sessionData.messages?.length
      ? sessionData.messages
      : [
          {
            role: "user",
            content:
              sessionData.symptoms ||
              `Patient: ${sessionData.patientAge ?? ""}. Symptoms.`,
          },
          {
            role: "assistant",
            content:
              sessionData.assistantResponse ||
              "(Imported assessment — full text was not stored.)",
          },
        ];

    for (const m of msgs) {
      if (!m.content?.trim()) continue;
      const r = m.role === "assistant" ? "assistant" : "user";
      await admin.from("messages").insert({
        session_id: sessionId,
        role: r,
        content: m.content,
      });
    }

    await admin.from("subscriptions").upsert(
      {
        user_id: user.id,
        tier: "free",
        status: "active",
        is_lifetime: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    const yearMonth = new Date().toISOString().slice(0, 7);
    const { data: usageRow } = await admin
      .from("usage_tracking")
      .select("id, assessments_used")
      .eq("user_id", user.id)
      .eq("year_month", yearMonth)
      .maybeSingle();

    if (usageRow) {
      await admin
        .from("usage_tracking")
        .update({
          assessments_used: (usageRow.assessments_used as number) + 1,
        })
        .eq("id", usageRow.id);
    } else {
      await admin.from("usage_tracking").insert({
        user_id: user.id,
        year_month: yearMonth,
        assessments_used: 1,
        assessments_cap: 5,
      });
    }

    return NextResponse.json({ success: true, sessionId });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Migration failed" },
      { status: 500 }
    );
  }
}
