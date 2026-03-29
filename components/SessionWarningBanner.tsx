"use client";

import { useState, useEffect } from "react";

export function SessionWarningBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener("session-warning", handler);
    return () => window.removeEventListener("session-warning", handler);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#0D1220",
        border: "1px solid rgba(200,169,110,0.5)",
        borderRadius: "10px",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        zIndex: 9999,
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        fontFamily: "var(--font-body), DM Sans, sans-serif",
        fontSize: "13px",
        color: "#F4EFE6",
        maxWidth: "min(96vw, 520px)",
        flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      <span style={{ color: "#C8A96E", textAlign: "center" }}>
        Your session will expire in 2 minutes due to inactivity.
      </span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        style={{
          backgroundColor: "#C8A96E",
          color: "#080C14",
          border: "none",
          borderRadius: "6px",
          padding: "6px 14px",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "var(--font-body), DM Sans, sans-serif",
        }}
      >
        Stay signed in
      </button>
    </div>
  );
}
