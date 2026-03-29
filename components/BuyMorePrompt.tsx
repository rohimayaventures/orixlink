"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const DISMISS_KEY = "orixlink_buy_more_dismissed";

export interface BuyMorePromptProps {
  remaining: number;
  tier: "pro" | "family";
  resetDate: string;
}

export function BuyMorePrompt({
  remaining,
  tier,
  resetDate,
}: BuyMorePromptProps) {
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  const resetFormatted = new Date(resetDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  return (
    <div
      data-tier={tier}
      style={{
        background: "rgba(200,169,110,0.06)",
        borderBottom: "1px solid rgba(200,169,110,0.2)",
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-body), sans-serif",
          fontSize: "13px",
          color: "rgba(244,239,230,0.7)",
          margin: 0,
        }}
      >
        You have{" "}
        <span style={{ color: "#C8A96E", fontWeight: 500 }}>
          {remaining} assessments
        </span>{" "}
        remaining this month. Resets {resetFormatted}.
      </p>
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => {
            handleDismiss();
            router.push("/pricing#credit-packs");
          }}
          style={{
            background: "#C8A96E",
            color: "#080C14",
            border: "none",
            borderRadius: "6px",
            padding: "6px 14px",
            fontFamily: "var(--font-body), sans-serif",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Add assessments
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(244,239,230,0.3)",
            fontSize: "18px",
            cursor: "pointer",
            padding: "0",
            lineHeight: "1",
          }}
        >
          &times;
        </button>
      </div>
    </div>
  );
}
