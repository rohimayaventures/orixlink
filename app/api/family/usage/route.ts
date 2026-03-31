import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFamilyUsageDashboard } from "@/lib/familyUsage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getFamilyUsageDashboard(user.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { data } = result;
    return NextResponse.json({
      totalUsed: data.totalUsed,
      cap: data.cap,
      resetDate: data.resetDate,
      creditsBalance: data.creditsBalance,
      members: data.members.map((m) => ({
        userId: m.userId,
        email: m.email,
        isOwner: m.isOwner,
        assessmentsUsed: m.assessmentsUsed,
        dailyUsed: m.dailyUsed,
        displayName: m.displayName,
      })),
    });
  } catch (e) {
    console.error("family usage GET", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
