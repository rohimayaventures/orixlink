"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type ReminderUserTier = "free" | "pro" | "family" | "lifetime";

interface ReminderPromptProps {
  sessionId: string;
  chiefComplaint: string;
  urgencyTier: string;
  userTier: ReminderUserTier;
}

export function ReminderPrompt({
  sessionId,
  chiefComplaint,
  urgencyTier,
  userTier,
}: ReminderPromptProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmedSendAt, setConfirmedSendAt] = useState<Date | null>(null);
  const [reminderId, setReminderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  const isPaid = ["pro", "family", "lifetime"].includes(userTier);

  async function handleCancel() {
    if (!reminderId) return;
    try {
      await fetch("/api/reminders/set", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reminderId }),
      });
      setConfirmed(false);
      setSelected(null);
      setReminderId(null);
    } catch (error) {
      console.error("Failed to cancel reminder:", error);
    }
  }

  async function handleSet(hours: number) {
    setSelected(hours);
    setLoading(true);
    try {
      const response = await fetch("/api/reminders/set", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          hoursDelay: hours,
          chiefComplaint,
          urgencyTier,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success && data.sendAt) {
        setReminderId(data.reminderId ?? null);
        setConfirmedSendAt(new Date(data.sendAt));
        setConfirmed(true);
      }
    } catch (error) {
      console.error("Failed to set reminder:", error);
    } finally {
      setLoading(false);
    }
  }

  if (dismissed) return null;

  if (!isPaid) {
    return (
      <div
        style={{
          background: "#0D1220",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "12px",
          padding: "20px 24px",
          marginTop: "24px",
        }}
      >
        <p
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: "13px",
            color: "rgba(244,239,230,0.5)",
            margin: "0 0 8px 0",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Follow-up reminders
        </p>
        <p
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: "14px",
            color: "rgba(244,239,230,0.6)",
            margin: "0 0 16px 0",
            lineHeight: "1.6",
          }}
        >
          Get a check-in reminder at 24, 48, or 72 hours. Available on Pro,
          Family, and Lifetime plans.
        </p>
        <button
          type="button"
          onClick={() => router.push("/pricing")}
          className="orix-btn-outline"
          style={{
            padding: "8px 20px",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "13px",
          }}
        >
          Upgrade to Pro
        </button>
      </div>
    );
  }

  if (confirmed && confirmedSendAt && selected != null) {
    return (
      <div
        style={{
          background: "rgba(200,169,110,0.06)",
          border: "1px solid rgba(200,169,110,0.2)",
          borderRadius: "12px",
          padding: "20px 24px",
          marginTop: "24px",
        }}
      >
        <p
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: "14px",
            color: "#C8A96E",
            margin: "0",
            lineHeight: "1.6",
          }}
        >
          Reminder set. We will email you around{" "}
          {confirmedSendAt.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}{" "}
          ({selected} hours from when you scheduled it).
        </p>
        {reminderId ? (
          <button
            type="button"
            onClick={handleCancel}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(244,239,230,0.45)",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "12px",
              cursor: "pointer",
              padding: "8px 0 0 0",
              textDecoration: "underline",
            }}
          >
            Cancel reminder
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#0D1220",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "12px",
        padding: "20px 24px",
        marginTop: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "16px",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              color: "#C8A96E",
              margin: "0 0 4px 0",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Set a follow-up reminder
          </p>
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              color: "rgba(244,239,230,0.5)",
              margin: "0",
              lineHeight: "1.5",
            }}
          >
            We will email you to check if anything has changed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(244,239,230,0.45)",
            fontSize: "18px",
            cursor: "pointer",
            padding: "0 0 0 16px",
            lineHeight: "1",
          }}
        >
          &times;
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        {[24, 48, 72].map((hours) => (
          <button
            key={hours}
            type="button"
            onClick={() => handleSet(hours)}
            disabled={loading}
            style={{
              background:
                selected === hours ? "#C8A96E" : "transparent",
              border:
                selected === hours
                  ? "none"
                  : "1px solid rgba(200,169,110,0.4)",
              borderRadius: "8px",
              padding: "10px 20px",
              color: selected === hours ? "#080C14" : "#C8A96E",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              fontWeight: selected === hours ? 600 : 400,
              cursor: loading ? "wait" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {hours}h
          </button>
        ))}
      </div>
    </div>
  );
}
