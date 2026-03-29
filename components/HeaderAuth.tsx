"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

type Variant = "dark" | "light";

export default function HeaderAuth({ variant }: { variant: Variant }) {
  const { user, loading, openAuthModal } = useAuth();
  const router = useRouter();
  const [usage, setUsage] = useState<{
    used: number;
    cap: number;
    tier: string;
  } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const isDark = variant === "dark";

  useEffect(() => {
    if (!user) {
      setUsage(null);
      setIsAdmin(false);
      return;
    }
    const supabase = createClient();
    const ym = new Date().toISOString().slice(0, 7);
    (async () => {
      const [subRes, useRes, profRes] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("tier")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("usage_tracking")
          .select("assessments_used, assessments_cap")
          .eq("user_id", user.id)
          .eq("year_month", ym)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .maybeSingle(),
      ]);
      const tier = (subRes.data?.tier as string) || "free";
      const used = (useRes.data?.assessments_used as number) ?? 0;
      const cap = (useRes.data?.assessments_cap as number) ?? 5;
      setUsage({ used, cap, tier });
      setIsAdmin(Boolean(profRes.data?.is_admin));
    })();
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
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Link
          href="/pricing"
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: muted,
            textDecoration: "none",
            fontFamily: "var(--font-body), sans-serif",
          }}
        >
          Pricing
        </Link>
        <Link
          href="/auth/signup"
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: gold,
            textDecoration: "none",
            fontFamily: "var(--font-body), sans-serif",
          }}
        >
          Sign up
        </Link>
        <button
          type="button"
          onClick={openAuthModal}
          style={{
            padding: "6px 14px",
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

  const remaining = usage ? Math.max(0, usage.cap - usage.used) : null;
  let usageColor = isDark ? cream : "var(--text-muted-light)";
  if (remaining !== null) {
    if (usage!.tier === "pro" && remaining <= 30) usageColor = gold;
    if (usage!.tier === "free" && remaining <= 1) usageColor = "#C0392B";
  }

  const initials =
    user.email?.slice(0, 2).toUpperCase() ||
    user.user_metadata?.full_name?.slice(0, 1)?.toUpperCase() ||
    "?";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Link
        href="/pricing"
        style={{
          fontSize: "0.8125rem",
          fontWeight: 600,
          color: gold,
          textDecoration: "none",
          fontFamily: "var(--font-body), sans-serif",
        }}
      >
        Pricing
      </Link>
      {remaining !== null && (
        <span
          style={{
            fontSize: "0.75rem",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
            color: usageColor,
          }}
        >
          {remaining} assessments left
        </span>
      )}
      <Link
        href="/account"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          textDecoration: "none",
          color: isDark ? cream : "var(--text-on-light)",
          fontSize: "0.8125rem",
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "rgba(200,169,110,0.25)",
            border: `1px solid ${gold}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.65rem",
            fontWeight: 700,
            color: gold,
          }}
        >
          {initials}
        </span>
        Account
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
          }}
        >
          Admin
        </Link>
      )}
      <button
        type="button"
        onClick={signOut}
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
