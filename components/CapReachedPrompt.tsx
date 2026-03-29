"use client";

import Link from "next/link";

export type CapReachedPayload = {
  error: "cap_reached";
  assessments_used: number;
  assessments_cap: number;
  reset_date: string;
  credits_remaining?: number;
};

type Props = {
  payload: CapReachedPayload;
  onDismiss?: () => void;
};

const GOLD = "var(--gold)";
const OBS = "var(--obsidian)";

export default function CapReachedPrompt({ payload, onDismiss }: Props) {
  const { assessments_cap: cap, reset_date: resetDate } = payload;

  return (
    <div
      style={{
        padding: "24px",
        marginBottom: 16,
        borderRadius: 12,
        border: "1px solid rgba(200, 169, 110, 0.35)",
        background: "var(--clinical-white)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <p
        className="font-display"
        style={{
          fontSize: "1.25rem",
          fontWeight: 500,
          color: "var(--text-on-light)",
          marginBottom: 12,
          lineHeight: 1.35,
        }}
      >
        You have used all {cap} assessments this month
      </p>
      <p
        style={{
          fontSize: "0.9rem",
          color: "var(--text-muted-light)",
          lineHeight: 1.6,
          marginBottom: 20,
          fontFamily: "var(--font-body), sans-serif",
        }}
      >
        {resetDate
          ? `Resets on ${resetDate}`
          : "Resets at the start of next month."}
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <Link
          href="/pricing"
          className="btn-gold"
          style={{
            display: "inline-block",
            textAlign: "center",
            minWidth: 200,
            background: GOLD,
            color: OBS,
            fontWeight: 600,
          }}
        >
          Upgrade to Pro
        </Link>
        <Link
          href="/pricing"
          style={{
            fontSize: "0.875rem",
            color: GOLD,
            fontWeight: 600,
            textDecoration: "underline",
            fontFamily: "var(--font-body), sans-serif",
          }}
        >
          Buy more assessments
        </Link>
        {onDismiss && (
          <button
            type="button"
            className="btn-ghost-gold"
            onClick={onDismiss}
            style={{ marginTop: 4 }}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
