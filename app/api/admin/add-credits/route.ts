import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/assertAdminApi";

export async function POST(request: Request) {
  const gate = await assertAdminApi();
  if (!gate.ok) return gate.response;

  const body = await request.json();
  const userId = body.userId as string | undefined;
  const amount = Number(body.amount);

  if (!userId || !Number.isFinite(amount) || amount < 1 || amount > 1_000_000) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const n = Math.floor(amount);
  const { admin } = gate.ctx;

  const { error: insErr } = await admin.from("credits").insert({
    user_id: userId,
    credits_purchased: n,
    credits_remaining: n,
    pack_name: "admin_grant",
    purchased_at: new Date().toISOString(),
    frozen: false,
  });

  if (insErr) {
    console.error(insErr);
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }

  const { data: rows } = await admin
    .from("credits")
    .select("credits_remaining")
    .eq("user_id", userId);

  const newBalance = (rows ?? []).reduce(
    (s, r) => s + (Number(r.credits_remaining) || 0),
    0
  );

  return NextResponse.json({ success: true, newBalance });
}
