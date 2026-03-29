import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

export type AdminApiOk = { user: User; admin: SupabaseClient };

export async function assertAdminApi():
  Promise<{ ok: true; ctx: AdminApiOk } | { ok: false; response: NextResponse }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  let admin: SupabaseClient;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Server misconfigured" },
        { status: 503 }
      ),
    };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, ctx: { user, admin } };
}
