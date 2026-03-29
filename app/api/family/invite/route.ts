import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import {
  FAMILY_MAX_MEMBERS,
  generateInviteCode,
  normalizeInviteEmail,
} from "@/lib/family";

export const runtime = "nodejs";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildFamilyInviteHtml(params: {
  ownerLabel: string;
  inviteCode: string;
  signupUrl: string;
  accountUrl: string;
}): string {
  const { ownerLabel, inviteCode, signupUrl, accountUrl } = params;
  const safeOwner = escapeHtml(ownerLabel);
  const safeCode = escapeHtml(inviteCode);
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#080C14;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#080C14;padding:40px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr><td style="padding:0 0 24px 0;text-align:center;">
        <p style="font-family:Arial,sans-serif;font-size:11px;color:rgba(200,169,110,0.75);letter-spacing:0.14em;text-transform:uppercase;margin:0;">OrixLink AI · Rohimaya Health AI</p>
      </td></tr>
      <tr><td style="background:#0D1220;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:36px 32px;">
        <p style="font-family:Georgia,serif;font-size:20px;color:#F4EFE6;margin:0 0 16px 0;line-height:1.4;">
          You&apos;ve been invited to join OrixLink AI
        </p>
        <p style="font-family:Arial,sans-serif;font-size:15px;color:rgba(244,239,230,0.82);line-height:1.65;margin:0 0 28px 0;">
          <strong style="color:#C8A96E;">${safeOwner}</strong> has invited you to join their OrixLink AI family plan.
        </p>
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px auto;">
          <tr><td style="border-radius:8px;background:#C8A96E;padding:14px 28px;text-align:center;">
            <a href="${signupUrl}" style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#080C14;text-decoration:none;display:inline-block;">
              Create account and join
            </a>
          </td></tr>
        </table>
        <p style="font-family:Arial,sans-serif;font-size:13px;color:rgba(244,239,230,0.55);margin:24px 0 8px 0;line-height:1.6;">
          Already have an account? Sign in and enter this code in account settings:
        </p>
        <p style="font-family:ui-monospace,monospace;font-size:18px;letter-spacing:0.12em;color:#C8A96E;margin:0 0 20px 0;">${safeCode}</p>
        <p style="font-family:Arial,sans-serif;font-size:13px;margin:0;">
          <a href="${accountUrl}" style="color:#C8A96E;text-decoration:underline;">Open your account</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const rawEmail = typeof body.email === "string" ? body.email : "";
    const email = normalizeInviteEmail(rawEmail);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: sub } = await admin
      .from("subscriptions")
      .select("tier, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sub || sub.tier !== "family") {
      return NextResponse.json(
        { error: "Family subscription required" },
        { status: 403 }
      );
    }
    if (sub.status !== "active" && sub.status !== "trialing") {
      return NextResponse.json(
        { error: "Subscription is not active" },
        { status: 403 }
      );
    }

    const { data: allRows } = await admin
      .from("family_members")
      .select("id, invited_email, status, invite_code")
      .eq("owner_user_id", user.id);

    const seatRows =
      allRows?.filter(
        (r) =>
          (r.status === "pending" || r.status === "active") &&
          r.invited_email
      ) ?? [];

    if (seatRows.length >= FAMILY_MAX_MEMBERS) {
      return NextResponse.json(
        { error: `Maximum of ${FAMILY_MAX_MEMBERS} members reached` },
        { status: 400 }
      );
    }

    const dup = seatRows.some(
      (r) => normalizeInviteEmail(r.invited_email ?? "") === email
    );
    if (dup) {
      return NextResponse.json(
        { error: "This email is already invited" },
        { status: 400 }
      );
    }

    let inviteCode =
      allRows?.find((r) => r.invite_code)?.invite_code?.toUpperCase() ?? null;
    if (!inviteCode) {
      inviteCode = generateInviteCode();
    }

    const { error: insErr } = await admin.from("family_members").insert({
      owner_user_id: user.id,
      invited_email: email,
      invite_code: inviteCode,
      status: "pending",
    });

    if (insErr) {
      console.error("family invite insert:", insErr);
      return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const ownerLabel =
      profile?.full_name?.trim() || user.email || "Your family organizer";

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://triage.rohimaya.ai";
    const signupUrl = `${baseUrl}/auth/signup?family_code=${encodeURIComponent(inviteCode)}`;
    const accountUrl = `${baseUrl}/account?join_family=${encodeURIComponent(inviteCode)}`;

    const html = buildFamilyInviteHtml({
      ownerLabel,
      inviteCode,
      signupUrl,
      accountUrl,
    });

    await resend.emails.send({
      from: "OrixLink AI <reminders@rohimaya.ai>",
      to: email,
      subject: "You've been invited to join OrixLink AI",
      html,
    });

    return NextResponse.json({ success: true, inviteCode });
  } catch (e) {
    console.error("family invite:", e);
    return NextResponse.json({ error: "Invite failed" }, { status: 500 });
  }
}
