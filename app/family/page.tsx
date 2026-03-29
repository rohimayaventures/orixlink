import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFamilyUsageDashboard } from "@/lib/familyUsage";
import FamilyManageClient, {
  type FamilyMemberRow,
} from "./FamilyManageClient";

export default async function FamilyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/signin?redirect=/family");
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("tier, status")
    .eq("user_id", user.id)
    .maybeSingle();

  const subStatus = (sub?.status ?? "").toLowerCase();
  const isFamily =
    sub?.tier === "family" &&
    (subStatus === "active" || subStatus === "trialing");

  let initialUsage = null;
  if (isFamily) {
    const usageResult = await getFamilyUsageDashboard(user.id);
    if (usageResult.ok) {
      initialUsage = usageResult.data;
    }
  }

  const { data: rawMembers } = await supabase
    .from("family_members")
    .select(
      "id, invited_email, status, joined_at, invited_at, invite_code"
    )
    .eq("owner_user_id", user.id)
    .order("invited_at", { ascending: true });

  const initialMembers = (rawMembers ?? []) as FamilyMemberRow[];
  const initialShareCode =
    initialMembers.find((m) => m.invite_code)?.invite_code?.toUpperCase() ??
    null;

  return (
    <FamilyManageClient
      isFamily={isFamily}
      initialMembers={initialMembers}
      initialShareCode={initialShareCode}
      initialUsage={initialUsage}
    />
  );
}
