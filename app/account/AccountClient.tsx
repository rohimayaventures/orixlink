"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Cross2Icon } from "@radix-ui/react-icons";
import AppShell from "@/components/AppShell";
import { SkeletonBlock } from "@/components/SkeletonBlock";

type Props = {
  user: User;
  profile: { full_name: string | null } | null;
  subscription: {
    tier: string;
    status: string;
    is_lifetime: boolean;
    stripe_customer_id: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
  } | null;
  usage: {
    assessments_used: number;
    assessments_cap: number;
    period_month: string;
  };
  creditSum: number;
  frozenCreditsSum: number;
  /** Count from billing portal return_url when user had unfrozen credits before opening portal. */
  portalCreditsFrozenHint: number | null;
};

export default function AccountClient({
  user,
  profile,
  subscription,
  usage,
  creditSum,
  frozenCreditsSum,
  portalCreditsFrozenHint,
}: Props) {
  const router = useRouter();
  const [portalLoading, setPortalLoading] = useState(false);
  const [accountUiReady, setAccountUiReady] = useState(false);
  const [portalFrozenBannerDismissed, setPortalFrozenBannerDismissed] =
    useState(false);
  const tier = subscription?.tier ?? "free";

  const subStatusNorm = (subscription?.status ?? "").toLowerCase();
  const showFrozenCreditsNotice =
    (subStatusNorm === "canceled" ||
      subStatusNorm === "cancelled" ||
      subStatusNorm === "past_due") &&
    frozenCreditsSum > 0;

  const showPortalFrozenBanner =
    portalCreditsFrozenHint != null &&
    portalCreditsFrozenHint > 0 &&
    !portalFrozenBannerDismissed;

  useEffect(() => {
    setAccountUiReady(true);
  }, []);
  const used = usage.assessments_used;
  const cap = usage.assessments_cap;

  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const isLifetimeNoEnd =
    (subscription?.is_lifetime || subscription?.tier === "lifetime") &&
    subscription?.current_period_end == null;

  const billingLines = (() => {
    if (isLifetimeNoEnd) {
      return { kind: "lifetime" as const };
    }
    const start = subscription?.current_period_start;
    const end = subscription?.current_period_end;
    if (start && end) {
      return {
        kind: "period" as const,
        current: `Current period: ${dateFmt(start)} -- ${dateFmt(end)}`,
        renews: `Renews: ${dateFmt(end)}`,
      };
    }
    if (end) {
      return { kind: "renewsOnly" as const, renews: `Renews: ${dateFmt(end)}` };
    }
    const [y, m] = (usage.period_month ?? "").split("-").map(Number);
    if (!y || !m) {
      return { kind: "fallback" as const, renews: "Renews: —" };
    }
    const d = new Date(y, m, 1);
    return {
      kind: "fallback" as const,
      renews: `Renews: ${d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })}`,
    };
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

  if (!accountUiReady) {
    return (
      <AppShell contentTopPadding={96}>
        <div className="px-5 sm:px-8 pb-16" style={{ maxWidth: 560, margin: "0 auto" }}>
          <SkeletonBlock width="100px" height="14px" style={{ marginBottom: 8 }} />
          <SkeletonBlock width="180px" height="32px" style={{ marginBottom: "0.5rem" }} />
          <SkeletonBlock width="100%" height="20px" style={{ marginBottom: "2rem" }} />
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-dark" style={{ padding: "24px", marginBottom: 16 }}>
              <SkeletonBlock width="72px" height="12px" style={{ marginBottom: 12 }} />
              <SkeletonBlock width="55%" height="26px" style={{ marginBottom: 8 }} />
              <SkeletonBlock width="100%" height="16px" />
            </div>
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell contentTopPadding={96}>
      <div className="px-5 sm:px-8 pb-16" style={{ maxWidth: 560, margin: "0 auto" }}>
        {showPortalFrozenBanner && (
          <div
            role="status"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "12px 14px",
              marginBottom: 16,
              borderRadius: 10,
              background: "rgba(200,169,110,0.08)",
              border: "1px solid rgba(200,169,110,0.2)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-body), sans-serif",
                fontSize: 13,
                lineHeight: 1.45,
                color: "rgba(244,239,230,0.7)",
                flex: 1,
              }}
            >
              Your {portalCreditsFrozenHint} unused credits are frozen. They will be
              waiting when you return.
            </p>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => {
                setPortalFrozenBannerDismissed(true);
                router.replace("/account");
              }}
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                border: "none",
                borderRadius: 8,
                background: "rgba(200,169,110,0.12)",
                color: "#C8A96E",
                cursor: "pointer",
              }}
            >
              <Cross2Icon style={{ width: 16, height: 16 }} />
            </button>
          </div>
        )}
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
          {billingLines.kind === "lifetime" ? (
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted-dark)" }}>
              Lifetime access -- never expires
            </p>
          ) : billingLines.kind === "period" ? (
            <>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted-dark)" }}>
                {billingLines.current}
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted-dark)" }}>
                {billingLines.renews}
              </p>
            </>
          ) : (
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted-dark)" }}>
              {billingLines.renews}
            </p>
          )}
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
          {showFrozenCreditsNotice && (
            <p
              style={{
                fontFamily: "var(--font-body), sans-serif",
                fontSize: "12px",
                color: "rgba(244,239,230,0.4)",
                marginTop: "8px",
                marginBottom: 0,
                lineHeight: 1.5,
              }}
            >
              You have {frozenCreditsSum} frozen credits. They will restore when you
              reactivate your subscription.
            </p>
          )}
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

        <div style={{ marginBottom: 20 }}>
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: 13,
              color: "rgba(244,239,230,0.65)",
              margin: "0 0 8px",
            }}
          >
            Delete account
          </p>
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: 12,
              color: "rgba(244,239,230,0.45)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            To permanently delete your account and all associated data, email{" "}
            <a
              href="mailto:support@rohimaya.ai?subject=Delete%20my%20account"
              style={{ color: "#C8A96E", textDecoration: "underline" }}
            >
              support@rohimaya.ai
            </a>{" "}
            with the subject line &apos;Delete my account&apos;. Deletion is processed
            within 30 days.
          </p>
        </div>

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
