"use client";

import Link from "next/link";

export type CapReachedPayload = {
  error: "cap_reached";
  assessments_used: number;
  assessments_cap: number;
  reset_date: string;
  credits_remaining?: number;
  cap_reached?: boolean;
  message?: string;
  upgrade_prompt?: boolean;
};

type Props = {
  payload: CapReachedPayload;
  onDismiss?: () => void;
  /** Logged-out / anonymous cap UX (e.g. free run exhausted). */
  isAnonymous?: boolean;
  creditsRemaining?: number;
};

const GOLD = "var(--gold)";
const OBS = "var(--obsidian)";

export default function CapReachedPrompt({
  payload,
  onDismiss,
  isAnonymous = false,
  creditsRemaining = 0,
}: Props) {
  const { assessments_cap: cap, reset_date: resetDate } = payload;
  const hasCredits = !isAnonymous && creditsRemaining > 0;

  const headline = isAnonymous
    ? "You've used your free assessment."
    : cap === 5
      ? "You've used all 5 assessments this month."
      : `You've used all ${cap} assessments this month.`;

  const primaryHref = isAnonymous
    ? "/auth/signup"
    : hasCredits
      ? "/pricing#credit-packs"
      : "/pricing";
  const primaryLabel = isAnonymous
    ? "Create a free account"
    : hasCredits
      ? "Use your credits"
    : cap === 5
      ? "Upgrade to Pro"
      : "Upgrade now";

  const detailCopy = isAnonymous
    ? "Create a free account for 5 assessments per month -- no credit card required."
    : resetDate
      ? `Resets on ${resetDate}`
      : "Resets at the start of next month.";

  return (
    <div
      style={{
        padding: "24px",
        marginBottom: 16,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "#0D1220",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
      }}
    >
      <p
        className="font-display"
        style={{
          fontSize: "1.25rem",
          fontWeight: 500,
          color: "#F4EFE6",
          marginBottom: 12,
          lineHeight: 1.35,
        }}
      >
        {headline}
      </p>
      <p
        style={{
          fontSize: "0.9rem",
          color: "rgba(244,239,230,0.5)",
          lineHeight: 1.6,
          marginBottom: 20,
          fontFamily: "var(--font-body), sans-serif",
        }}
      >
        {detailCopy}
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
          href={primaryHref}
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
          {primaryLabel}
        </Link>
        {hasCredits ? (
          <p
            style={{
              fontSize: "0.8125rem",
              color: "rgba(244,239,230,0.55)",
              margin: "2px 0 0",
              fontFamily: "var(--font-body), sans-serif",
            }}
          >
            You have {creditsRemaining} credits available
          </p>
        ) : null}
        {!isAnonymous && hasCredits ? (
          <Link
            href="/pricing"
            className="btn-ghost-gold"
            style={{
              display: "inline-block",
              textAlign: "center",
              minWidth: 200,
              padding: "10px 18px",
              fontSize: "0.875rem",
              fontWeight: 600,
              fontFamily: "var(--font-body), sans-serif",
              borderWidth: "1.5px",
              borderColor: GOLD,
              color: "#F4EFE6",
              textDecoration: "none",
            }}
          >
            Upgrade now
          </Link>
        ) : !isAnonymous ? (
          <Link
            href="/auth/signin"
            className="btn-ghost-gold"
            style={{
              display: "inline-block",
              textAlign: "center",
              minWidth: 200,
              padding: "10px 18px",
              fontSize: "0.875rem",
              fontWeight: 600,
              fontFamily: "var(--font-body), sans-serif",
              borderWidth: "1.5px",
              borderColor: GOLD,
              color: "#F4EFE6",
              textDecoration: "none",
            }}
          >
            Sign in to a different account
          </Link>
        ) : null}
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
