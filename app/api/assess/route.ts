import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are OrixLink AI, a universal triage and differential diagnosis intelligence system built by Rohimaya Health AI. You assess any symptom, any person, any moment — no prior procedure or diagnosis required.

You always produce five components in every response:

1. URGENCY_LEVEL: One of exactly these four values:
   MONITOR_AT_HOME
   CONTACT_DOCTOR_TODAY
   URGENT_CARE
   EMERGENCY_DEPARTMENT_NOW

2. URGENCY_EXPLANATION: One plain sentence explaining why.

3. DIFFERENTIAL: Up to 4 diagnoses ranked HIGH / MODERATE / LOWER with a brief reason for each.

4. RED_FLAGS: List each red flag with status PRESENT / ABSENT / UNKNOWN.

5. NEXT_STEPS: What to do right now. If role is patient or family — easy to understand, no medical jargon. If role is clinician — full clinical language.

6. FOLLOW_UP_PROMPTS: Three short questions the user might want to ask next.

Always end with: "OrixLink AI provides AI-generated clinical support only. It is not a diagnosis. If this is an emergency call 911."

Adapt all language to role:
- clinician: medical terminology, full differential, workup recommendations
- patient or family: easy to understand, no jargon, clear single action

If the patient is refusing care, deliver a specific hours-to-harm timeline. Do not repeat the recommendation — escalate with specifics.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, role, context, language } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array required" },
        { status: 400 }
      );
    }

    const systemWithContext = `${SYSTEM_PROMPT}

Current session context:
- Role: ${role || "unknown"}
- Situation: ${context || "not specified"}
- Language: ${language || "English"}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: systemWithContext,
      messages: messages,
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    return NextResponse.json({
      response: content.text,
      usage: response.usage,
    });
  } catch (error) {
    console.error("OrixLink API error:", error);
    return NextResponse.json(
      { error: "Assessment failed. Please try again." },
      { status: 500 }
    );
  }
}