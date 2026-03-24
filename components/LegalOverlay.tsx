"use client";

import { useEffect, useState } from "react";

export default function LegalOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("rohimaya-legal-accepted");
    if (!accepted) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("rohimaya-legal-accepted", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          maxWidth: "520px",
          width: "100%",
          padding: "2rem",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#888",
            marginBottom: "0.75rem",
          }}
        >
          Before you continue
        </p>

        <h2
          style={{
            fontSize: "20px",
            fontWeight: 500,
            color: "#0f0f0f",
            marginBottom: "1rem",
            lineHeight: 1.3,
          }}
        >
          OrixLink AI is not a substitute for medical care
        </h2>

        <p
          style={{
            fontSize: "14px",
            color: "#444",
            lineHeight: 1.7,
            marginBottom: "0.875rem",
          }}
        >
          This tool provides general health information only. It does not
          diagnose, treat, or replace the advice of a licensed medical
          professional. Using OrixLink does not create a provider-patient
          relationship.
        </p>

        <p
          style={{
            fontSize: "14px",
            color: "#444",
            lineHeight: 1.7,
            marginBottom: "1.5rem",
          }}
        >
          If you believe you are experiencing a medical emergency, call{" "}
          <strong style={{ color: "#0f0f0f" }}>911</strong> or go to your
          nearest emergency department immediately. Do not wait for an AI
          assessment.
        </p>

        <div
          style={{
            borderTop: "0.5px solid #e5e5e5",
            paddingTop: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <button
            onClick={handleAccept}
            style={{
              backgroundColor: "#0f0f0f",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "0.875rem 1.5rem",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              width: "100%",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            I understand — continue to OrixLink
          </button>

          <p
            style={{
              fontSize: "12px",
              color: "#999",
              textAlign: "center",
              margin: 0,
            }}
          >
            By continuing, you agree to our{" "}
            <a
              href="/legal"
              style={{ color: "#666", textDecoration: "underline" }}
            >
              Terms of Use and Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}