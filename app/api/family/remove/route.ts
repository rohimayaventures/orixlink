import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const memberId = typeof body.memberId === "string" ? body.memberId : "";
    if (!memberId) {
      return NextResponse.json({ error: "memberId required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: row } = await admin
      .from("family_members")
      .select("id, owner_user_id, status")
      .eq("id", memberId)
      .maybeSingle();

    if (!row || row.owner_user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (row.status === "removed") {
      return NextResponse.json({ success: true });
    }

    const { error } = await admin
      .from("family_members")
      .update({ status: "removed" })
      .eq("id", memberId)
      .eq("owner_user_id", user.id);

    if (error) {
      console.error("family remove:", error);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("family remove:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
