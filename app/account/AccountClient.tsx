"use client";

import type { User } from "@supabase/supabase-js";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  user: User;
  profile: { full_name: string | null } | null;
  subscription: {
    tier: string;
    status: string;
    is_lifetime: boolean;
    stripe_customer_id: string | null;
  } | null;
  usage: {
    assessments_used: number;
    assessments_cap: number;
    year_month: string;
  } | null;
  creditSum: number;
};

export default function AccountClient({
  user,
  profile,
  subscription,
  usage,
  creditSum,
}: Props) {
  const router = useRouter();
  const [portalLoading, setPortalLoading] = useState(false);
  const tier = subscription?.tier ?? "free";
  const used = usage?.assessments_used ?? 0;
  const cap = usage?.assessments_cap ?? 5;
  const nextMonth = (() => {
    const [y, m] = (usage?.year_month ?? "").split("-").map(Number);
    if (!y || !m) return "—";
    const d = new Date(y, m, 1);
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  })();

  async function openBillingPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing-portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setPortalLoading(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth/signout", {
      method: "POST",
      credentials: "same-origin",
      redirect: "manual",
    });
    router.refresh();
    window.location.href = "/";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--cream)",
        padding: "100px 24px 80px",
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <h1
          className="font-display"
          style={{
            fontSize: "2rem",
            color: "var(--text-on-light)",
            marginBottom: "0.5rem",
          }}
        >
          Account
        </h1>
        <p style={{ color: "var(--text-muted-light)", marginBottom: "2rem" }}>
          {profile?.full_name || "—"} · {user.email}
        </p>

        <div
          className="card-clinical"
          style={{ padding: "24px", marginBottom: 16 }}
        >
          <p
            style={{
              fontSize: "0.6875rem",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--gold-muted)",
              marginBottom: 8,
            }}
          >
            Plan
          </p>
          <p
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "var(--text-on-light)",
              textTransform: "capitalize",
            }}
          >
            {tier}
            {subscription?.is_lifetime ? " · Lifetime" : ""}
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted-light)" }}>
            Status: {subscription?.status ?? "—"}
          </p>
        </div>

        <div
          className="card-clinical"
          style={{ padding: "24px", marginBottom: 16 }}
        >
          <p
            style={{
              fontSize: "0.6875rem",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--gold-muted)",
              marginBottom: 8,
            }}
          >
            Assessments this month
          </p>
          <p
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "var(--text-on-light)",
            }}
          >
            {used} / {cap} used
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted-light)" }}>
            Next period starts {nextMonth}
          </p>
        </div>

        <div
          className="card-clinical"
          style={{ padding: "24px", marginBottom: 24 }}
        >
          <p
            style={{
              fontSize: "0.6875rem",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--gold-muted)",
              marginBottom: 8,
            }}
          >
            Credits balance
          </p>
          <p
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "var(--text-on-light)",
            }}
          >
            {creditSum}
          </p>
        </div>

        {subscription?.stripe_customer_id && (
          <button
            type="button"
            className="btn-gold"
            style={{ width: "100%", marginBottom: 12 }}
            disabled={portalLoading}
            onClick={openBillingPortal}
          >
            {portalLoading ? "Opening…" : "Manage billing"}
          </button>
        )}

        <button
          type="button"
          className="btn-ghost-gold"
          style={{ width: "100%" }}
          onClick={signOut}
        >
          Sign out
        </button>
      </div>
    </main>
  );
}
