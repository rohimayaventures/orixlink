import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEPENDENT_AGE_RANGES } from "@/lib/dependents";

export const runtime = "nodejs";

function normalizeAgeRange(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const t = v.trim();
  return (DEPENDENT_AGE_RANGES as readonly string[]).includes(t) ? t : null;
}

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

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

    const { data: existing, error: selErr } = await admin
      .from("dependents")
      .select("id, owner_user_id")
      .eq("id", id)
      .maybeSingle();

    if (selErr) {
      console.error("dependents PATCH select", selErr);
      return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
    }
    if (!existing || existing.owner_user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const updates: Record<string, string | null> = {};

    if (typeof body.display_name === "string") {
      const d = body.display_name.trim();
      if (!d) {
        return NextResponse.json(
          { error: "Display name cannot be empty" },
          { status: 400 }
        );
      }
      updates.display_name = d;
    }

    if ("age_range" in body) {
      updates.age_range = normalizeAgeRange(body.age_range);
    }

    if ("relevant_conditions" in body) {
      updates.relevant_conditions =
        typeof body.relevant_conditions === "string"
          ? body.relevant_conditions.trim() || null
          : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data: row, error: upErr } = await admin
      .from("dependents")
      .update(updates)
      .eq("id", id)
      .eq("owner_user_id", user.id)
      .select("id, owner_user_id, display_name, age_range, relevant_conditions, created_at")
      .single();

    if (upErr || !row) {
      console.error("dependents PATCH update", upErr);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json(row);
  } catch (e) {
    console.error("dependents PATCH", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

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

    const { data: existing, error: selErr } = await admin
      .from("dependents")
      .select("id, owner_user_id")
      .eq("id", id)
      .maybeSingle();

    if (selErr) {
      console.error("dependents DELETE select", selErr);
      return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
    }
    if (!existing || existing.owner_user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { error: delErr } = await admin
      .from("dependents")
      .delete()
      .eq("id", id)
      .eq("owner_user_id", user.id);

    if (delErr) {
      console.error("dependents DELETE", delErr);
      return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("dependents DELETE", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
