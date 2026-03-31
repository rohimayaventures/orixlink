"use client";

import { useEffect, useRef, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Cross2Icon } from "@radix-ui/react-icons";

type Props = {
  open: boolean;
  onClose: () => void;
  supabaseClient: SupabaseClient;
};

export default function AuthModal({
  open,
  onClose,
  supabaseClient,
}: Props) {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const authRootRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const root = authRootRef.current;
    if (!root) return;

    const applyAgeGateState = () => {
      const submit = root.querySelector(
        'button[type="submit"]'
      ) as HTMLButtonElement | null;
      if (!submit) return;
      submit.disabled = !ageConfirmed;
      if (!ageConfirmed) {
        submit.style.opacity = "0.55";
        submit.style.cursor = "not-allowed";
      } else {
        submit.style.opacity = "";
        submit.style.cursor = "";
      }

      const providerButtons = root.querySelectorAll(
        'button[type="button"]'
      ) as NodeListOf<HTMLButtonElement>;
      providerButtons.forEach((btn) => {
        const label = (btn.textContent || "").toLowerCase();
        if (!label.includes("google")) return;
        btn.disabled = !ageConfirmed;
        if (!ageConfirmed) {
          btn.style.opacity = "0.55";
          btn.style.cursor = "not-allowed";
        } else {
          btn.style.opacity = "";
          btn.style.cursor = "";
        }
      });
    };

    applyAgeGateState();
    const observer = new MutationObserver(applyAgeGateState);

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [ageConfirmed, open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    const root = modalRef.current;
    if (!root) return;
    const firstFocusable = root.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
    return () => {
      lastFocusedRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : "";

  return (
    <div
      className="auth-modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(8, 12, 20, 0.92)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        className="auth-modal-panel"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-heading"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 420,
          maxHeight: "min(90vh, 720px)",
          overflowY: "auto",
          background: "#080C14",
          borderRadius: 16,
          border: "1px solid rgba(200, 169, 110, 0.35)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          padding: "28px 24px 32px",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(244, 239, 230, 0.6)",
            padding: 4,
          }}
        >
          <Cross2Icon width={20} height={20} />
        </button>

        <h2
          id="auth-modal-heading"
          className="font-display"
          style={{
            fontSize: 22,
            color: "#C8A96E",
            fontWeight: 500,
            marginBottom: 8,
            paddingRight: 32,
            lineHeight: 1.25,
          }}
        >
          Save your assessment. Get 4 more free.
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "rgba(244, 239, 230, 0.7)",
            marginBottom: 24,
            lineHeight: 1.5,
            fontFamily: "var(--font-body), sans-serif",
          }}
        >
          Your results are waiting -- they will save automatically when you sign
          up.
        </p>

        <div
          ref={authRootRef}
          style={{
            fontFamily: "var(--font-body), DM Sans, sans-serif",
          }}
        >
          <Auth
            supabaseClient={supabaseClient}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "#C8A96E",
                    brandAccent: "#080C14",
                    brandButtonText: "#080C14",
                    defaultButtonBackground: "#C8A96E",
                    defaultButtonText: "#080C14",
                    anchorTextColor: "#C8A96E",
                    inputBackground: "#0D1117",
                    inputText: "#F4EFE6",
                    inputPlaceholder: "rgba(244,239,230,0.45)",
                    messageText: "rgba(244,239,230,0.85)",
                    messageTextDanger: "#C0392B",
                    dividerBackground: "rgba(200,169,110,0.25)",
                  },
                  borderWidths: {
                    buttonBorderWidth: "1px",
                    inputBorderWidth: "1px",
                  },
                  radii: {
                    borderRadiusButton: "8px",
                    inputBorderRadius: "8px",
                  },
                  fonts: {
                    bodyFontFamily: "var(--font-body), DM Sans, sans-serif",
                    buttonFontFamily: "var(--font-body), DM Sans, sans-serif",
                    inputFontFamily: "var(--font-body), DM Sans, sans-serif",
                    labelFontFamily: "var(--font-body), DM Sans, sans-serif",
                  },
                },
              },
              style: {
                button: {
                  borderColor: "rgba(200,169,110,0.5)",
                  borderRadius: "8px",
                },
                input: {
                  borderColor: "rgba(200, 169, 110, 0.3)",
                  color: "#F4EFE6",
                },
                label: { color: "rgba(244,239,230,0.85)" },
                anchor: { color: "#C8A96E", fontWeight: 500 },
                message: { color: "rgba(244,239,230,0.8)" },
              },
            }}
            providers={["google"]}
            redirectTo={redirectTo}
            onlyThirdPartyProviders={false}
            magicLink={false}
            showLinks={true}
            view="sign_up"
          />
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              marginTop: 12,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              style={{
                marginTop: "3px",
                width: 16,
                height: 16,
                accentColor: "#C8A96E",
                border: "1px solid rgba(200, 169, 110, 0.35)",
                backgroundColor: "#0D1117",
              }}
            />
            <span
              style={{
                fontSize: 12,
                color: "rgba(244,239,230,0.7)",
                lineHeight: 1.6,
                fontFamily: "var(--font-body), sans-serif",
              }}
            >
              I confirm I am 18 years of age or older
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
