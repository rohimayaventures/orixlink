import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseUrgencyFromAssessmentText } from "@/lib/parseUrgency";
import {
  promptLanguageName,
  resolveLanguageCode,
} from "@/lib/outputLanguages";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const VALID_CONTEXTS = new Set([
  "recent_procedure",
  "chronic_condition",
  "new_symptoms",
  "injury",
  "pregnancy",
  "pediatric",
  "mental_health",
  "other",
]);

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

async function ensureUsageRow(
  admin: AdminClient,
  userId: string,
  yearMonth: string,
  cap: number
) {
  const { data: existing } = await admin
    .from("usage_tracking")
    .select("id, assessments_cap")
    .eq("user_id", userId)
    .eq("year_month", yearMonth)
    .maybeSingle();

  if (!existing) {
    await admin.from("usage_tracking").insert({
      user_id: userId,
      year_month: yearMonth,
      assessments_used: 0,
      assessments_cap: cap,
    });
    return;
  }
  if (Number(existing.assessments_cap) !== cap) {
    await admin
      .from("usage_tracking")
      .update({ assessments_cap: cap })
      .eq("id", existing.id);
  }
}

async function sumUserCredits(admin: AdminClient, userId: string): Promise<number> {
  const { data: rows } = await admin
    .from("credits")
    .select("credits_remaining")
    .eq("user_id", userId);
  return (rows ?? []).reduce(
    (s, r) => s + (Number(r.credits_remaining) || 0),
    0
  );
}

export async function POST(request: NextRequest) {
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
        .select("assessments_cap")
        .eq("user_id", user.id)
        .maybeSingle();

      const capFromSub = Number(sub?.assessments_cap);
      const assessmentsCap =
        Number.isFinite(capFromSub) && capFromSub > 0 ? capFromSub : 5;

      await ensureUsageRow(admin, user.id, yearMonth, assessmentsCap);

      const { data: ut, error: utErr } = await admin
        .from("usage_tracking")
        .select("assessments_used, assessments_cap")
        .eq("user_id", user.id)
        .eq("year_month", yearMonth)
        .single();

      if (utErr || !ut) {
        console.error("usage_tracking read", utErr);
        return NextResponse.json(
          { error: "Could not load usage" },
          { status: 500 }
        );
      }

      const used = Number(ut.assessments_used) || 0;
      const cap = Number(ut.assessments_cap) || assessmentsCap;

      if (used >= cap) {
        const creditsRemaining = await sumUserCredits(admin, user.id);
        if (creditsRemaining > 0) {
          const { data: consumed, error: cErr } = await admin.rpc(
            "consume_one_credit",
            { p_user_id: user.id }
          );
          if (cErr || consumed !== true) {
            const creditsAfter = await sumUserCredits(admin, user.id);
            return NextResponse.json(
              {
                error: "cap_reached",
                assessments_used: used,
                assessments_cap: cap,
                reset_date: nextPeriodStartDate(yearMonth),
                credits_remaining: creditsAfter,
              },
              { status: 402 }
            );
          }
        } else {
          return NextResponse.json(
            {
              error: "cap_reached",
              assessments_used: used,
              assessments_cap: cap,
              reset_date: nextPeriodStartDate(yearMonth),
              credits_remaining: 0,
            },
            { status: 402 }
          );
        }
      }

      if (sessionIdBody) {
        const { data: owned } = await admin
          .from("sessions")
          .select("id")
          .eq("id", sessionIdBody)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!owned) {
          return NextResponse.json(
            { error: "Invalid session_id" },
            { status: 400 }
          );
        }
      }

      const userContentCheck = lastUserMessageContent(messages);
      if (!userContentCheck.trim()) {
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

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: systemWithContext,
      messages: anthropicMessages,
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    const responseText = content.text;
    let sessionIdOut: string | null = null;

    if (user && admin) {
      const { error: incErr } = await admin.rpc("increment_usage_tracking", {
        p_user_id: user.id,
        p_year_month: yearMonth,
      });
      if (incErr) {
        console.error("increment_usage_tracking", incErr);
      }

      const urgency = parseUrgencyFromAssessmentText(responseText);
      const ctx =
        typeof context === "string" && VALID_CONTEXTS.has(context)
          ? context
          : "other";
      const roleDb =
        typeof role === "string" && VALID_ROLES.has(role) ? role : "patient";
      const langStored =
        typeof language === "string" && language.length > 0 ? language : "en";

      const userContent = lastUserMessageContent(messages);

      if (!sessionIdBody) {
        const { data: inserted, error: insErr } = await admin
          .from("sessions")
          .insert({
            user_id: user.id,
            role: roleDb,
            context: ctx,
            language: langStored,
            urgency_level: urgency,
          })
          .select("id")
          .single();

        if (insErr || !inserted) {
          console.error("sessions insert", insErr);
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
          if (msgErr) console.error("messages insert", msgErr);
        }
      } else {
        sessionIdOut = sessionIdBody;
        const { error: upErr } = await admin
          .from("sessions")
          .update({ urgency_level: urgency })
          .eq("id", sessionIdBody)
          .eq("user_id", user.id);
        if (upErr) console.error("sessions update", upErr);

        const { error: msgErr } = await admin.from("messages").insert([
          { session_id: sessionIdOut, role: "user", content: userContent },
          {
            session_id: sessionIdOut,
            role: "assistant",
            content: responseText,
          },
        ]);
        if (msgErr) console.error("messages insert", msgErr);
      }
    }

    return NextResponse.json({
      response: responseText,
      usage: response.usage,
      session_id: sessionIdOut,
    });
  } catch (error) {
    console.error("OrixLink API error:", error);
    return NextResponse.json(
      { error: "Assessment failed. Please try again." },
      { status: 500 }
    );
  }
}
