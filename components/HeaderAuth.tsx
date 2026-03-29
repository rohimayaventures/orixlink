"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { usageCapFromSubscriptionRow } from "@/lib/admin/tierCaps";
import { ensureUsageTrackingForMonth } from "@/lib/ensureUsageTracking";

type Variant = "dark" | "light";

export default function HeaderAuth({
  variant,
  omitPricing = false,
}: {
  variant: Variant;
  /** Hide Pricing link (e.g. in assessment flow where horizontal space is tight). */
  omitPricing?: boolean;
}) {
  const { user, loading, openAuthModal } = useAuth();
  const router = useRouter();
  const [usage, setUsage] = useState<{
    used: number;
    cap: number;
    tier: string;
  } | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const isDark = variant === "dark";

  useEffect(() => {
    if (!user) {
      setUsage(null);
      setUsageLoading(false);
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    setUsageLoading(true);
    const supabase = createClient();
    const ym = new Date().toISOString().slice(0, 7);
    (async () => {
      try {
        const [subRes, profRes] = await Promise.all([
          supabase
            .from("subscriptions")
            .select("tier, is_lifetime, assessments_cap")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .maybeSingle(),
        ]);
        if (cancelled) return;
        const tier = (subRes.data?.tier as string) || "free";
        const usageRow = await ensureUsageTrackingForMonth(
          supabase,
          user.id,
          ym,
          subRes.data
        );
        if (cancelled) return;
        const used = usageRow?.assessments_used ?? 0;
        const cap =
          usageRow?.assessments_cap ??
          usageCapFromSubscriptionRow(subRes.data);
        setUsage({ used, cap, tier });
        setIsAdmin(Boolean(profRes.data?.is_admin));
      } finally {
        if (!cancelled) setUsageLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function signOut() {
    await fetch("/api/auth/signout", {
      method: "POST",
      credentials: "same-origin",
      redirect: "manual",
    });
    router.refresh();
    window.location.href = "/";
  }

  const cream = "#F4EFE6";
  const gold = "#C8A96E";
  const muted = isDark ? "rgba(240,237,232,0.65)" : "var(--text-muted-light)";

  if (loading) {
    return (
      <span style={{ fontSize: "0.75rem", color: muted, fontFamily: "var(--font-mono)" }}>
        …
      </span>
    );
  }

  if (!user) {
    return (
      <div className="flex max-w-full min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-1 sm:gap-x-3.5">
        {!omitPricing && (
          <Link
            href="/pricing"
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: muted,
              textDecoration: "none",
              fontFamily: "var(--font-body), sans-serif",
              padding: "6px 4px",
            }}
          >
            Pricing
          </Link>
        )}
        <Link
          href="/auth/signup"
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: gold,
            textDecoration: "none",
            fontFamily: "var(--font-body), sans-serif",
            padding: "6px 4px",
          }}
        >
          Sign up
        </Link>
        <button
          type="button"
          onClick={openAuthModal}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: `1.5px solid ${gold}`,
            background: "transparent",
            color: isDark ? gold : "var(--gold)",
            fontSize: "0.8125rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--font-body), sans-serif",
          }}
        >
          Sign in
        </button>
      </div>
    );
  }

  const remaining =
    !usageLoading && usage ? Math.max(0, usage.cap - usage.used) : null;
  let usageColor = isDark ? cream : "var(--text-muted-light)";
  if (remaining !== null && usage) {
    if (usage.tier === "pro" && remaining <= 30) usageColor = gold;
    if (usage.tier === "free" && remaining <= 1) usageColor = "#C0392B";
  }

  const initials =
    user.email?.slice(0, 2).toUpperCase() ||
    user.user_metadata?.full_name?.slice(0, 1)?.toUpperCase() ||
    "?";

  return (
    <div className="flex max-w-full min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-2 sm:gap-x-3">
      {!omitPricing && (
        <Link
          href="/pricing"
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: gold,
            textDecoration: "none",
            fontFamily: "var(--font-body), sans-serif",
            padding: "6px 2px",
          }}
        >
          Pricing
        </Link>
      )}
      {usageLoading ? (
        <span className="header-usage-skeleton" aria-hidden />
      ) : remaining !== null ? (
        <span
          className="whitespace-nowrap"
          style={{
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
            color: usageColor,
            fontSize: "0.6875rem",
          }}
        >
          <span className="sm:hidden">{remaining} left</span>
          <span className="hidden sm:inline" style={{ fontSize: "0.75rem" }}>
            {remaining} assessments left
          </span>
        </span>
      ) : null}
      <Link
        href="/account"
        aria-label="Account"
        className="inline-flex min-h-[40px] min-w-[40px] items-center sm:min-h-0 sm:min-w-0"
        style={{
          gap: 8,
          textDecoration: "none",
          color: isDark ? cream : "var(--text-on-light)",
          fontSize: "0.8125rem",
          padding: "4px 2px",
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "rgba(200,169,110,0.25)",
            border: `1px solid ${gold}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.65rem",
            fontWeight: 700,
            color: gold,
            flexShrink: 0,
          }}
        >
          {initials}
        </span>
        <span className="hidden sm:inline">Account</span>
      </Link>
      {isAdmin && (
        <Link
          href="/admin"
          style={{
            fontSize: "0.75rem",
            color: gold,
            textDecoration: "none",
            fontWeight: 600,
            fontFamily: "var(--font-body), sans-serif",
            padding: "6px 2px",
          }}
        >
          Admin
        </Link>
      )}
      <button
        type="button"
        onClick={signOut}
        className="min-h-[40px] px-1 sm:min-h-0"
        style={{
          background: "none",
          border: "none",
          color: muted,
          fontSize: "0.75rem",
          cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        Sign out
      </button>
    </div>
  );
}
