import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assessmentsCapForTier } from "@/lib/admin/tierCaps";
import { parseUrgencyFromAssessmentText } from "@/lib/parseUrgency";
import {
  promptLanguageName,
  resolveLanguageCode,
} from "@/lib/outputLanguages";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const VALID_ROLES = new Set(["patient", "family", "clinician"]);

const SYSTEM_PROMPT = `You are OrixLink AI, a universal triage and differential diagnosis intelligence system built by Rohimaya Health AI. You assess any symptom, any person, any moment — no prior procedure or diagnosis required.

CRITICAL URGENCY RULES — these override everything else:
When symptoms include ANY of the following, URGENCY_LEVEL must be EMERGENCY_DEPARTMENT_NOW with no exceptions:
- Compartment syndrome signs: woody/hard swelling + pain returning after improvement + waking from sleep with pain + grip loss
- Chest pain with jaw, arm, or shoulder involvement
- Stroke symptoms: facial drooping, arm weakness, speech difficulty
- Pregnancy with severe headache + vision changes
- Active uncontrolled bleeding
- Altered consciousness or confusion
- Absent pulse in an extremity
- Any post-procedure complication with neurological signs (numbness, tingling, weakness)
- Difficulty breathing or airway compromise
Do not default to a lower urgency level when these signs are present. Assign the highest clinically justified level.

You always produce these components in every response:

1. URGENCY_LEVEL: One of exactly these four values:
   MONITOR_AT_HOME
   CONTACT_DOCTOR_TODAY
   URGENT_CARE
   EMERGENCY_DEPARTMENT_NOW

2. URGENCY_EXPLANATION: One plain sentence explaining why. Do not include ** asterisks.

3. DIFFERENTIAL: Up to 4 diagnoses ranked HIGH / MODERATE / LOWER with a brief reason for each. Format each line exactly as:
   HIGH: [Diagnosis name] - [Brief reason]
   MODERATE: [Diagnosis name] - [Brief reason]
   LOWER: [Diagnosis name] - [Brief reason]

4. RED_FLAGS: List each red flag with status. Format each line exactly as:
   [Red flag description]: PRESENT
   [Red flag description]: ABSENT
   [Red flag description]: UNKNOWN

5. NEXT_STEPS: What to do right now in plain language. One clear paragraph. No asterisks. If role is patient or family — easy to understand, no medical jargon, tell them exactly what to say when they arrive. If role is clinician — full clinical language with workup recommendations.

6. FOLLOW_UP_PROMPTS: Three short symptom updates the user might want to report next — written as first-person statements the user would say, not questions. These should be the most clinically relevant new information that would change the assessment. Examples: "His fingers are now turning blue", "She is refusing to go to the hospital", "The swelling has gotten worse in the last hour", "He just developed a fever", "She can no longer feel her hand at all". Make them specific to the current clinical picture.

End with a one-sentence disclaimer in the response language that preserves this meaning: OrixLink provides AI-generated clinical support only, not a diagnosis, and in an emergency the user should contact local emergency services (use the appropriate number for the user's region when known, e.g. 911 in the US).

Adapt all language to role:
- clinician: medical terminology, full differential, workup recommendations, specialist referral guidance
- patient or family: easy to understand, no jargon, clear single action, translate every medical term

If the patient is refusing care, deliver a specific hours-to-harm timeline. State clearly what becomes irreversible at each time threshold. Do not repeat the recommendation — escalate with specifics only.

LANGUAGE OUTPUT RULES:
- The session specifies a response language for human-readable prose.
- Keep all structural tokens EXACTLY as defined above in English: section names (URGENCY_LEVEL, URGENCY_EXPLANATION, DIFFERENTIAL, RED_FLAGS, NEXT_STEPS, FOLLOW_UP_PROMPTS), urgency enum values (MONITOR_AT_HOME, CONTACT_DOCTOR_TODAY, URGENT_CARE, EMERGENCY_DEPARTMENT_NOW), likelihood labels (HIGH, MODERATE, LOWER), and red-flag statuses (PRESENT, ABSENT, UNKNOWN).
- Write URGENCY_EXPLANATION, differential line reasons, red-flag descriptions, NEXT_STEPS, FOLLOW_UP_PROMPTS, and the final disclaimer line entirely in the requested response language (adapt the emergency number phrase to the user's locale where appropriate, e.g. 911 vs local equivalents, while preserving meaning).
- If the response language is not English, translate medical terms carefully; when uncertain, prefer clarity and recommend confirming with a qualified professional.`;

function lastUserMessageContent(
  messages: { role: string; content: string }[]
): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role === "user" && typeof m.content === "string") return m.content;
  }
  return "";
}

function nextPeriodStartDate(yearMonth: string): string {
  const [yStr, mStr] = yearMonth.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (!y || !m || m < 1 || m > 12) return "";
  return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
}

type AdminClient = ReturnType<typeof createAdminClient>;

function resolveUserCapForAttempt(
  sub: { tier?: string | null; assessments_cap?: number | null } | null
): number {
  if (!sub) return 5;
  const ac = Number(sub.assessments_cap);
  if (Number.isFinite(ac) && ac > 0) return ac;
  return assessmentsCapForTier(sub.tier ?? "free");
}

type AttemptResult = {
  allowed: boolean;
  assessments_used: number;
  assessments_cap: number;
};

function parseAllowedFlag(value: unknown): boolean | null {
  if (value === true) return true;
  if (value === false) return false;
  if (value === "t" || value === "true" || value === "T") return true;
  if (value === "f" || value === "false" || value === "F") return false;
  return null;
}

function parseAttemptAssessmentResult(data: unknown): AttemptResult | null {
  if (data == null) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (row == null || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const allowed = parseAllowedFlag(o.allowed);
  if (allowed === null) return null;
  return {
    allowed,
    assessments_used: Number(o.assessments_used) || 0,
    assessments_cap: Number(o.assessments_cap) || 0,
  };
}

export async function POST(request: NextRequest) {
  let consumedAttempt = false;
  let rollbackUserId: string | null = null;
  let adminForRollback: AdminClient | null = null;

  try {
    const body = await request.json();
    const {
      messages,
      role,
      context,
      language,
      session_id: sessionIdBody,
    } = body as {
      messages?: { role: string; content: string }[];
      role?: string;
      context?: string;
      language?: string;
      session_id?: string | null;
    };

    const langCode = resolveLanguageCode(
      typeof language === "string" ? language : undefined
    );
    const responseLanguageName = promptLanguageName(langCode);

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array required" },
        { status: 400 }
      );
    }

    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    const yearMonth = new Date().toISOString().slice(0, 7);
    let admin: AdminClient | null = null;

    if (user) {
      try {
        admin = createAdminClient();
      } catch {
        return NextResponse.json(
          { error: "Server is not configured for authenticated assessments" },
          { status: 503 }
        );
      }

      const { data: sub } = await admin
        .from("subscriptions")
        .select("tier, assessments_cap")
        .eq("user_id", user.id)
        .maybeSingle();

      const userCap = resolveUserCapForAttempt(sub);

      const { data: attemptData, error: attemptErr } = await admin.rpc(
        "attempt_assessment",
        { p_user_id: user.id, p_cap: userCap }
      );

      if (attemptErr) {
        console.error("attempt_assessment", attemptErr);
        return NextResponse.json(
          { error: "Could not verify usage allowance" },
          { status: 500 }
        );
      }

      const ar = parseAttemptAssessmentResult(attemptData);
      if (!ar) {
        console.error("attempt_assessment unexpected shape", attemptData);
        return NextResponse.json(
          { error: "Invalid usage response" },
          { status: 500 }
        );
      }

      if (!ar.allowed) {
        return NextResponse.json(
          {
            error: "cap_reached",
            assessments_used: ar.assessments_used,
            assessments_cap: ar.assessments_cap,
            reset_date: nextPeriodStartDate(yearMonth),
            credits_remaining: 0,
          },
          { status: 402 }
        );
      }

      consumedAttempt = true;
      rollbackUserId = user.id;
      adminForRollback = admin;

      if (sessionIdBody) {
        const { data: owned } = await admin
          .from("sessions")
          .select("id")
          .eq("id", sessionIdBody)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!owned) {
          await admin.rpc("rollback_assessment", { p_user_id: user.id });
          return NextResponse.json(
            { error: "Invalid session_id" },
            { status: 400 }
          );
        }
      }

      const userContentCheck = lastUserMessageContent(messages);
      if (!userContentCheck.trim()) {
        await admin.rpc("rollback_assessment", { p_user_id: user.id });
        return NextResponse.json(
          { error: "Last user message missing" },
          { status: 400 }
        );
      }
    }

    const systemWithContext = `${SYSTEM_PROMPT}

Current session context:
- Role: ${role || "unknown"}
- Situation: ${context || "not specified"}
- Response language (prose): ${responseLanguageName} (code: ${langCode})
- Critical instruction: Evaluate all red flags present in the message and assign the highest clinically justified urgency level. Do not default to a lower level. If compartment syndrome is on the differential and multiple red flags are present, assign EMERGENCY_DEPARTMENT_NOW. If neurological signs are present in any post-procedure patient, assign EMERGENCY_DEPARTMENT_NOW.`;

    const anthropicMessages: MessageParam[] = messages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: typeof m.content === "string" ? m.content : "",
    }));

    let responseText: string;
    let anthropicUsage: unknown;
    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: systemWithContext,
        messages: anthropicMessages,
      });

      anthropicUsage = response.usage;
      const content = response.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type from Claude");
      }
      responseText = content.text;
    } catch (claudeErr) {
      if (consumedAttempt && rollbackUserId && adminForRollback) {
        const { error: rbErr } = await adminForRollback.rpc(
          "rollback_assessment",
          { p_user_id: rollbackUserId }
        );
        if (rbErr) console.error("rollback_assessment", rbErr);
      }
      throw claudeErr;
    }

    let sessionIdOut: string | null = null;
    let historyWarning = false;

    if (user && admin) {
      const urgency = parseUrgencyFromAssessmentText(responseText);
      const roleRaw =
        typeof role === "string" && role.trim() !== "" ? role.trim() : "self";
      const roleDb =
        roleRaw === "self" || roleRaw === "patient"
          ? "patient"
          : VALID_ROLES.has(roleRaw)
            ? roleRaw
            : "patient";
      const langStored =
        typeof language === "string" && language.length > 0 ? language : "en";

      const userContent = lastUserMessageContent(messages);
      const contextSnippet =
        userContent.trim().length > 0
          ? userContent.trim().slice(0, 500)
          : "other";

      try {
        if (!sessionIdBody) {
          const { data: inserted, error: insErr } = await admin
            .from("sessions")
            .insert({
              user_id: user.id,
              role: roleDb,
              context: contextSnippet,
              language: langStored,
              urgency_level: urgency,
            })
            .select("id")
            .single();

          if (insErr || !inserted) {
            console.error("assess history persist: session insert failed", {
              user_id: user.id,
              session_content: userContent,
              claude_response: responseText,
              error: insErr,
            });
            historyWarning = true;
          } else {
            sessionIdOut = inserted.id as string;
            const { error: msgErr } = await admin.from("messages").insert([
              { session_id: sessionIdOut, role: "user", content: userContent },
              {
                session_id: sessionIdOut,
                role: "assistant",
                content: responseText,
              },
            ]);
            if (msgErr) {
              console.error("assess history persist: messages insert failed", {
                user_id: user.id,
                session_id: sessionIdOut,
                session_content: userContent,
                claude_response: responseText,
                error: msgErr,
              });
              historyWarning = true;
            }
          }
        } else {
          sessionIdOut = sessionIdBody;
          const { error: upErr } = await admin
            .from("sessions")
            .update({
              urgency_level: urgency,
              updated_at: new Date().toISOString(),
            })
            .eq("id", sessionIdBody)
            .eq("user_id", user.id);
          if (upErr) {
            console.error("assess history persist: session update failed", {
              user_id: user.id,
              session_id: sessionIdBody,
              session_content: userContent,
              claude_response: responseText,
              error: upErr,
            });
            historyWarning = true;
          }

          const { error: msgErr } = await admin.from("messages").insert([
            { session_id: sessionIdOut, role: "user", content: userContent },
            {
              session_id: sessionIdOut,
              role: "assistant",
              content: responseText,
            },
          ]);
          if (msgErr) {
            console.error("assess history persist: messages insert failed", {
              user_id: user.id,
              session_id: sessionIdOut,
              session_content: userContent,
              claude_response: responseText,
              error: msgErr,
            });
            historyWarning = true;
          }
        }
      } catch (persistErr) {
        console.error("assess history persist: unexpected error", {
          user_id: user.id,
          session_content: userContent,
          claude_response: responseText,
          error: persistErr,
        });
        historyWarning = true;
      }
    }

    return NextResponse.json({
      response: responseText,
      usage: anthropicUsage,
      session_id: sessionIdOut,
      ...(historyWarning ? { historyWarning: true } : {}),
    });
  } catch (error) {
    console.error("OrixLink API error:", error);
    return NextResponse.json(
      { error: "Assessment failed. Please try again." },
      { status: 500 }
    );
  }
}
