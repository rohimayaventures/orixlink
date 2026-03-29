"use client";

import Link from "next/link";

export type CapReachedPayload = {
  error: "cap_reached";
  assessments_used: number;
  assessments_cap: number;
  reset_date: string;
  credits_remaining: number;
};

type Props = {
  payload: CapReachedPayload;
  onDismiss?: () => void;
};

export default function CapReachedPrompt({ payload, onDismiss }: Props) {
  const {
    assessments_used: used,
    assessments_cap: cap,
    reset_date: resetDate,
    credits_remaining: credits,
  } = payload;

  return (
    <div
      className="card-clinical"
      style={{
        padding: "24px",
        marginBottom: 16,
        border: "2px solid rgba(192, 57, 43, 0.45)",
        background: "rgba(192, 57, 43, 0.06)",
      }}
    >
      <p
        style={{
          fontSize: "0.6875rem",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#C0392B",
          marginBottom: 10,
        }}
      >
        Monthly assessment limit
      </p>
      <h2
        className="font-display"
        style={{
          fontSize: "1.35rem",
          fontWeight: 500,
          color: "var(--text-on-light)",
          marginBottom: 8,
          lineHeight: 1.25,
        }}
      >
        You have used all {cap} assessments for this period
      </h2>
      <p
        style={{
          fontSize: "0.9rem",
          color: "var(--text-muted-light)",
          lineHeight: 1.6,
          marginBottom: 12,
        }}
      >
        Used {used} of {cap} this month.
        {resetDate
          ? ` Your limit resets on ${resetDate}.`
          : " Your limit resets next month."}{" "}
        {credits > 0
          ? `You still show ${credits} credit${credits === 1 ? "" : "s"} on file — if a charge failed, try again or contact support.`
          : " Add credits or upgrade to continue."}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <Link href="/account" className="btn-gold" style={{ display: "inline-block" }}>
          Account & billing
        </Link>
        {onDismiss && (
          <button type="button" className="btn-ghost-gold" onClick={onDismiss}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}
