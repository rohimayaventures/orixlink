import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.email) {
      return NextResponse.json(
        { error: "No email on account" },
        { status: 400 }
      );
    }

    const { sessionId, hoursDelay, chiefComplaint, urgencyTier } =
      await request.json();

    if (![24, 48, 72].includes(hoursDelay)) {
      return NextResponse.json(
        { error: "Invalid hours delay" },
        { status: 400 }
      );
    }

    const sendAt = new Date();
    sendAt.setHours(sendAt.getHours() + hoursDelay);

    const firstName =
      user.user_metadata?.full_name?.split(" ")[0] ||
      user.email?.split("@")[0] ||
      "there";

    const { data, error } = await supabase
      .from("reminders")
      .insert({
        user_id: user.id,
        session_id: sessionId,
        email: user.email,
        first_name: firstName,
        chief_complaint: chiefComplaint,
        urgency_tier: urgencyTier,
        hours_delay: hoursDelay,
        send_at: sendAt.toISOString(),
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to save reminder:", error);
      return NextResponse.json(
        { error: "Failed to save reminder" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sendAt: sendAt.toISOString(),
      reminderId: data?.id ?? null,
    });
  } catch (error) {
    console.error("Set reminder error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const reminderId = body?.reminderId as string | undefined;
    if (!reminderId) {
      return NextResponse.json(
        { error: "reminderId required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("reminders")
      .update({ status: "cancelled" })
      .eq("id", reminderId)
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (error) {
      return NextResponse.json(
        { error: "Failed to cancel reminder" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
