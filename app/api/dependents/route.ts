import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEPENDENT_AGE_RANGES,
  dependentCapForTier,
} from "@/lib/dependents";

export const runtime = "nodejs";

function isActiveProOrFamily(sub: {
  tier?: string | null;
  status?: string | null;
} | null): boolean {
  if (!sub) return false;
  const st = (sub.status ?? "").toLowerCase();
  if (st !== "active" && st !== "trialing") return false;
  return dependentCapForTier(sub.tier) > 0;
}

function normalizeAgeRange(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const t = v.trim();
  return (DEPENDENT_AGE_RANGES as readonly string[]).includes(t) ? t : null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 503 }
      );
    }

    const { data: sub } = await admin
      .from("subscriptions")
      .select("tier, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!isActiveProOrFamily(sub)) {
      return NextResponse.json({ dependents: [] });
    }

    const { data, error } = await admin
      .from("dependents")
      .select("id, owner_user_id, display_name, age_range, relevant_conditions, created_at")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("dependents GET", error);
      return NextResponse.json({ error: "Failed to load dependents" }, { status: 500 });
    }

    return NextResponse.json({ dependents: data ?? [] });
  } catch (e) {
    console.error("dependents GET", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

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
    const displayName =
      typeof body.display_name === "string" ? body.display_name.trim() : "";
    if (!displayName) {
      return NextResponse.json(
        { error: "Display name is required" },
        { status: 400 }
      );
    }

    if (
      typeof body.age_range === "string" &&
      body.age_range.trim() !== "" &&
      normalizeAgeRange(body.age_range) === null
    ) {
      return NextResponse.json({ error: "Invalid age range" }, { status: 400 });
    }
    const ageRange = normalizeAgeRange(body.age_range);
    const relevantConditions =
      typeof body.relevant_conditions === "string"
        ? body.relevant_conditions.trim() || null
        : null;

    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 503 }
      );
    }

    const { data: sub } = await admin
      .from("subscriptions")
      .select("tier, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!isActiveProOrFamily(sub)) {
      return NextResponse.json(
        { error: "Pro or Family subscription required" },
        { status: 403 }
      );
    }

    const cap = dependentCapForTier(sub?.tier);
    const { count, error: countErr } = await admin
      .from("dependents")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", user.id);

    if (countErr) {
      console.error("dependents POST count", countErr);
      return NextResponse.json({ error: "Could not verify limit" }, { status: 500 });
    }

    if ((count ?? 0) >= cap) {
      return NextResponse.json(
        { error: `Maximum of ${cap} dependent profiles reached` },
        { status: 400 }
      );
    }

    const { data: row, error: insErr } = await admin
      .from("dependents")
      .insert({
        owner_user_id: user.id,
        display_name: displayName,
        age_range: ageRange,
        relevant_conditions: relevantConditions,
      })
      .select("id, owner_user_id, display_name, age_range, relevant_conditions, created_at")
      .single();

    if (insErr || !row) {
      console.error("dependents POST insert", insErr);
      return NextResponse.json({ error: "Failed to create dependent" }, { status: 500 });
    }

    return NextResponse.json(row);
  } catch (e) {
    console.error("dependents POST", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
