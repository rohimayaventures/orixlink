import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { loops } from "@/lib/loops";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://triage.rohimaya.ai";

const TRANSACTIONAL_ID =
  process.env.LOOPS_REMINDER_TRANSACTIONAL_ID ||
  "orixlink-followup-reminder";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getLogoFilename(): string {
  const publicDir = path.join(process.cwd(), "public");
  const candidates = [
    "logo.png",
    "logo.svg",
    "logo.jpg",
    "orixlink-logo.png",
    "orixlink-logo.svg",
    "OrixLink-logo.png",
    "OrixLink-logo.svg",
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(publicDir, candidate))) {
      return candidate;
    }
  }
  return "logo.png";
}

function buildEmailHtml(params: {
  firstName: string;
  hoursAgo: number;
  chiefComplaint: string;
  urgencyTier: string;
  assessmentUrl: string;
}): string {
  const {
    firstName,
    hoursAgo,
    chiefComplaint,
    urgencyTier,
    assessmentUrl,
  } = params;

  const safeName = escapeHtml(firstName);
  const safeComplaint = escapeHtml(chiefComplaint);
  const safeUrgency = escapeHtml(urgencyTier);
  const logoUrl = `${baseUrl}/${getLogoFilename()}`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport"
  content="width=device-width,initial-scale=1.0">
<title>Your OrixLink follow-up check-in</title>
</head>
<body style="margin:0;padding:0;
  background-color:#080C14;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0"
  style="background-color:#080C14;padding:40px 20px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
        style="max-width:600px;width:100%;">

        <!-- Logo header -->
        <tr>
          <td style="padding:0 0 32px 0;text-align:center;">
            <img
              src="${logoUrl}"
              alt="OrixLink AI"
              width="140"
              height="auto"
              style="display:block;margin:0 auto 10px auto;
                max-width:140px;"
            />
            <p style="font-family:Arial,sans-serif;
              font-size:11px;
              color:rgba(200,169,110,0.5);
              letter-spacing:0.14em;
              text-transform:uppercase;
              margin:0;">
              by Rohimaya Health AI
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 0 32px 0;">
            <div style="height:1px;
              background:rgba(200,169,110,0.2);">
            </div>
          </td>
        </tr>

        <!-- Body card -->
        <tr>
          <td style="background:#0D1220;
            border:1px solid rgba(255,255,255,0.07);
            border-radius:12px;
            padding:36px 40px;">

            <p style="font-family:Georgia,serif;
              font-size:22px;font-weight:400;
              color:#F4EFE6;margin:0 0 24px 0;
              line-height:1.4;">
              Hi ${safeName},
            </p>

            <p style="font-family:Arial,sans-serif;
              font-size:15px;
              color:rgba(244,239,230,0.8);
              margin:0 0 20px 0;line-height:1.7;">
              It has been
              <strong style="color:#F4EFE6;">
                ${hoursAgo} hours
              </strong>
              since your OrixLink assessment.
            </p>

            <!-- Assessment summary card -->
            <table width="100%" cellpadding="0"
              cellspacing="0"
              style="background:rgba(200,169,110,0.06);
                border:1px solid rgba(200,169,110,0.15);
                border-radius:8px;margin:0 0 24px 0;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="font-family:Arial,sans-serif;
                    font-size:11px;color:#C8A96E;
                    letter-spacing:0.12em;
                    text-transform:uppercase;
                    margin:0 0 6px 0;">
                    What you assessed
                  </p>
                  <p style="font-family:Georgia,serif;
                    font-size:16px;color:#F4EFE6;
                    margin:0 0 16px 0;">
                    ${safeComplaint}
                  </p>
                  <p style="font-family:Arial,sans-serif;
                    font-size:11px;color:#C8A96E;
                    letter-spacing:0.12em;
                    text-transform:uppercase;
                    margin:0 0 6px 0;">
                    Urgency level at the time
                  </p>
                  <p style="font-family:Georgia,serif;
                    font-size:16px;color:#F4EFE6;
                    margin:0;">
                    ${safeUrgency}
                  </p>
                </td>
              </tr>
            </table>

            <p style="font-family:Arial,sans-serif;
              font-size:15px;
              color:rgba(244,239,230,0.8);
              margin:0 0 28px 0;line-height:1.7;">
              Has anything changed since then? Symptoms
              can shift quickly. A quick check-in takes
              less than 2 minutes.
            </p>

            <!-- CTA button -->
            <table width="100%" cellpadding="0"
              cellspacing="0"
              style="margin:0 0 28px 0;">
              <tr>
                <td align="center">
                  <a href="${assessmentUrl}"
                    style="display:inline-block;
                      background:#C8A96E;
                      color:#080C14;
                      font-family:Arial,sans-serif;
                      font-size:14px;font-weight:600;
                      letter-spacing:0.08em;
                      text-decoration:none;
                      padding:14px 36px;
                      border-radius:8px;">
                    CHECK IN NOW
                  </a>
                </td>
              </tr>
            </table>

            <p style="font-family:Arial,sans-serif;
              font-size:13px;
              color:rgba(244,239,230,0.4);
              margin:0;line-height:1.6;
              text-align:center;">
              Your assessment history and full results
              are saved in your account.
            </p>

          </td>
        </tr>

        <!-- Disclaimer -->
        <tr>
          <td style="padding:28px 0 0 0;">
            <p style="font-family:Arial,sans-serif;
              font-size:12px;
              color:rgba(244,239,230,0.3);
              margin:0 0 12px 0;line-height:1.6;
              text-align:center;">
              This reminder was scheduled by you after
              your assessment. You will not receive
              further reminders unless you request them.
            </p>
            <p style="font-family:Arial,sans-serif;
              font-size:11px;
              color:rgba(244,239,230,0.2);
              margin:0 0 16px 0;line-height:1.6;
              text-align:center;">
              OrixLink AI is not a substitute for
              professional medical advice. If your
              symptoms have worsened or you believe
              you are experiencing a medical emergency,
              call 911 immediately.
            </p>
            <p style="font-family:Arial,sans-serif;
              font-size:11px;
              color:rgba(244,239,230,0.2);
              margin:0;text-align:center;">
              Questions?
              <a href="mailto:support@rohimaya.ai"
                style="color:rgba(200,169,110,0.5);
                  text-decoration:none;">
                support@rohimaya.ai
              </a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 0 0 0;
            text-align:center;">
            <div style="height:1px;
              background:rgba(200,169,110,0.1);
              margin:0 0 20px 0;">
            </div>
            <p style="font-family:Arial,sans-serif;
              font-size:11px;
              color:rgba(244,239,230,0.15);
              margin:0;letter-spacing:0.06em;">
              &copy; 2026 Rohimaya Health AI
              &nbsp;&middot;&nbsp;
              Westminster, CO
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    const { data: reminders, error } = await supabaseAdmin
      .from("reminders")
      .select("*")
      .eq("status", "pending")
      .lte("send_at", now.toISOString())
      .limit(50);

    if (error) {
      console.error("Failed to fetch reminders:", error);
      return NextResponse.json(
        { error: "Failed to fetch reminders" },
        { status: 500 }
      );
    }

    if (!reminders || reminders.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
      });
    }

    const results = await Promise.allSettled(
      reminders.map(async (reminder: {
        id: string;
        email: string;
        session_id: string | null;
        first_name: string | null;
        chief_complaint: string | null;
        urgency_tier: string | null;
        hours_delay: number;
      }) => {
        const assessmentUrl = reminder.session_id
          ? `${baseUrl}/assessment/${reminder.session_id}`
          : `${baseUrl}`;

        const htmlBody = buildEmailHtml({
          firstName: reminder.first_name || "there",
          hoursAgo: reminder.hours_delay,
          chiefComplaint:
            reminder.chief_complaint || "your recent symptoms",
          urgencyTier: reminder.urgency_tier || "Not specified",
          assessmentUrl,
        });

        await loops.sendTransactionalEmail({
          transactionalId: TRANSACTIONAL_ID,
          email: reminder.email,
          dataVariables: {
            firstName: reminder.first_name || "there",
            hoursAgo: reminder.hours_delay,
            chiefComplaint:
              reminder.chief_complaint || "your recent symptoms",
            urgencyTier: reminder.urgency_tier || "Not specified",
            assessmentUrl,
            htmlBody,
          },
          addToAudience: false,
        });

        const { error: updateError } = await supabaseAdmin
          .from("reminders")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", reminder.id);

        if (updateError) {
          throw updateError;
        }
      })
    );

    const failedIds = reminders
      .filter((_, i) => results[i]?.status === "rejected")
      .map((r: { id: string }) => r.id);

    if (failedIds.length > 0) {
      await supabaseAdmin
        .from("reminders")
        .update({ status: "failed" })
        .in("id", failedIds);
    }

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`Reminders sent: ${sent}, failed: ${failed}`);

    return NextResponse.json({
      success: true,
      sent,
      failed,
    });
  } catch (error) {
    console.error("Send reminders error:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
