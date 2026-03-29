"use client";

import type { User } from "@supabase/supabase-js";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

type Props = {
  user: User;
  profile: { full_name: string | null } | null;
  subscription: {
    tier: string;
    status: string;
    is_lifetime: boolean;
    stripe_customer_id: string | null;
    current_period_end: string | null;
  } | null;
  usage: {
    assessments_used: number;
    assessments_cap: number;
    year_month: string;
  };
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
  const used = usage.assessments_used;
  const cap = usage.assessments_cap;
  const nextPeriodLabel = (() => {
    if (subscription?.current_period_end) {
      return new Date(subscription.current_period_end).toLocaleDateString(
        "en-US",
        { month: "long", day: "numeric", year: "numeric" }
      );
    }
    if (subscription?.is_lifetime || subscription?.tier === "lifetime") {
      return "Never -- lifetime access";
    }
    const [y, m] = (usage.year_month ?? "").split("-").map(Number);
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
    <AppShell contentTopPadding={96}>
      <div className="px-5 sm:px-8 pb-16" style={{ maxWidth: 560, margin: "0 auto" }}>
        <p
          className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase mb-2"
          style={{ color: "var(--gold-muted)" }}
        >
          Your profile
        </p>
        <h1
          className="font-display"
          style={{
            fontSize: "2rem",
            color: "var(--text-on-dark)",
            marginBottom: "0.5rem",
          }}
        >
          Account
        </h1>
        <p style={{ color: "var(--text-muted-dark)", marginBottom: "2rem" }}>
          {profile?.full_name || "—"} · {user.email}
        </p>

        <div className="card-dark" style={{ padding: "24px", marginBottom: 16 }}>
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
              color: "var(--text-on-dark)",
              textTransform: "capitalize",
            }}
          >
            {tier}
            {subscription?.is_lifetime ? " · Lifetime" : ""}
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted-dark)" }}>
            Status: {subscription?.status ?? "—"}
          </p>
        </div>

        <div className="card-dark" style={{ padding: "24px", marginBottom: 16 }}>
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
              color: "var(--text-on-dark)",
            }}
          >
            {used} / {cap} used
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted-dark)" }}>
            Next period starts {nextPeriodLabel}
          </p>
        </div>

        <div className="card-dark" style={{ padding: "24px", marginBottom: 24 }}>
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
              color: "var(--text-on-dark)",
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
    </AppShell>
  );
}
