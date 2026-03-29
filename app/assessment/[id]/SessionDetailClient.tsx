"use client";

import Link from "next/link";
import { parseAssessment } from "@/lib/parseAssessment";

const BG = "#080C14";
const CARD = "#0D1220";
const BORDER = "1px solid rgba(255,255,255,0.07)";
const TEXT = "#F4EFE6";
const MUTED = "rgba(244,239,230,0.5)";
const GOLD = "#C8A96E";

const URGENCY: Record<string, { label: string; bg: string; border: string; color: string }> = {
  EMERGENCY_DEPARTMENT_NOW: {
    label: "Emergency Department — Now",
    bg: "rgba(239,68,68,0.14)",
    border: "rgba(239,68,68,0.45)",
    color: "#FCA5A5",
  },
  URGENT_CARE: {
    label: "Urgent Care",
    bg: "rgba(249,115,22,0.14)",
    border: "rgba(249,115,22,0.45)",
    color: "#FDBA74",
  },
  CONTACT_DOCTOR_TODAY: {
    label: "Contact Doctor Today",
    bg: "rgba(234,179,8,0.14)",
    border: "rgba(234,179,8,0.45)",
    color: "#FDE047",
  },
  MONITOR_AT_HOME: {
    label: "Monitor at Home",
    bg: "rgba(34,197,94,0.14)",
    border: "rgba(34,197,94,0.45)",
    color: "#86EFAC",
  },
};

type SessionRow = {
  id: string;
  role: string;
  context: string | null;
  urgency_level: string | null;
  created_at: string;
};

type MessageRow = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

export default function SessionDetailClient({
  session,
  messages,
}: {
  session: SessionRow;
  messages: MessageRow[];
}) {
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const parsed = lastAssistant ? parseAssessment(lastAssistant.content) : null;
  const urgencyKey =
    (session.urgency_level as string) || parsed?.urgencyLevel || "CONTACT_DOCTOR_TODAY";
  const u = URGENCY[urgencyKey] || URGENCY.CONTACT_DOCTOR_TODAY;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: BG,
        color: TEXT,
        padding: "88px 20px 48px",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      <Link
        href="/history"
        style={{
          display: "inline-block",
          fontSize: 13,
          color: GOLD,
          fontFamily: "DM Sans, sans-serif",
          marginBottom: 20,
          textDecoration: "none",
        }}
      >
        ← Back to history
      </Link>

      <div
        style={{
          padding: "1rem 1.25rem",
          borderRadius: 12,
          background: CARD,
          border: BORDER,
          marginBottom: 20,
        }}
      >
        <span
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.06em",
            padding: "6px 12px",
            borderRadius: 100,
            background: u.bg,
            border: `1px solid ${u.border}`,
            color: u.color,
            marginBottom: 12,
          }}
        >
          {u.label}
        </span>
        <p style={{ margin: 0, fontSize: 14, color: MUTED, fontFamily: "DM Sans, sans-serif" }}>
          {session.role} · {session.context || "—"}
        </p>
      </div>

      {parsed && parsed.differential.length > 0 && (
        <div
          style={{
            padding: "1.25rem",
            borderRadius: 12,
            background: CARD,
            border: BORDER,
            marginBottom: 20,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: GOLD,
              marginBottom: 12,
            }}
          >
            Differential highlights
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, color: TEXT, lineHeight: 1.6 }}>
            {parsed.differential.slice(0, 4).map((d, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                <strong>{d.likelihood}</strong> — {d.name}
                {d.reason ? ` — ${d.reason}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2
        className="font-display"
        style={{ fontSize: 18, fontWeight: 500, marginBottom: 16, color: TEXT }}
      >
        Conversation
      </h2>
      <div style={{ marginBottom: 32 }}>
        {messages.map((m) =>
          m.role === "user" ? (
            <div
              key={m.id}
              style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}
            >
              <div
                style={{
                  maxWidth: "85%",
                  padding: "12px 16px",
                  borderRadius: "16px 16px 4px 16px",
                  background: "#141824",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: 14,
                  lineHeight: 1.55,
                  whiteSpace: "pre-wrap",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                {m.content}
              </div>
            </div>
          ) : (
            <div
              key={m.id}
              style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}
            >
              <div
                style={{
                  maxWidth: "90%",
                  padding: "12px 16px",
                  borderRadius: "4px 16px 16px 16px",
                  background: CARD,
                  border: BORDER,
                  fontSize: 14,
                  lineHeight: 1.55,
                  whiteSpace: "pre-wrap",
                  fontFamily: "DM Sans, sans-serif",
                  color: TEXT,
                }}
              >
                {m.content.replace(/\*\*/g, "")}
              </div>
            </div>
          )
        )}
      </div>

      <Link
        href="/assessment"
        style={{
          display: "block",
          width: "100%",
          textAlign: "center",
          padding: "14px 20px",
          borderRadius: 12,
          background: GOLD,
          color: BG,
          fontWeight: 600,
          fontFamily: "DM Sans, sans-serif",
          textDecoration: "none",
        }}
      >
        Start new assessment
      </Link>
    </main>
  );
}
