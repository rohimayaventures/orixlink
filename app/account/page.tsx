import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountClient from "./AccountClient";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const yearMonth = new Date().toISOString().slice(0, 7);

  const [profileRes, subRes, usageRes, creditsRes] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("usage_tracking")
      .select("*")
      .eq("user_id", user.id)
      .eq("year_month", yearMonth)
      .maybeSingle(),
    supabase.from("credits").select("credits_remaining").eq("user_id", user.id),
  ]);

  const creditSum = (creditsRes.data ?? []).reduce(
    (s, r) => s + (Number(r.credits_remaining) || 0),
    0
  );

  return (
    <AccountClient
      user={user}
      profile={profileRes.data}
      subscription={subRes.data}
      usage={usageRes.data}
      creditSum={creditSum}
    />
  );
}
