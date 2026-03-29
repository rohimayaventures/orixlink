"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { usageCapFromSubscriptionRow } from "@/lib/admin/tierCaps";
import { ensureUsageTrackingForMonth } from "@/lib/ensureUsageTracking";

export type SubscriptionUsageValue = {
  used: number;
  cap: number;
  remaining: number;
  tier: string;
  isLifetime: boolean;
  resetDate: string;
  loading: boolean;
};

const Ctx = createContext<SubscriptionUsageValue | null>(null);

function computeResetDateIso(
  currentPeriodEnd: string | null | undefined,
  periodMonth: string
): string {
  if (currentPeriodEnd) return currentPeriodEnd;
  const [y, m] = periodMonth.split("-").map(Number);
  if (!y || !m) return new Date().toISOString();
  return new Date(y, m, 1).toISOString();
}

export function SubscriptionUsageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [state, setState] = useState<Omit<SubscriptionUsageValue, "loading">>({
    used: 0,
    cap: 0,
    remaining: 0,
    tier: "free",
    isLifetime: false,
    resetDate: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setState({
        used: 0,
        cap: 0,
        remaining: 0,
        tier: "free",
        isLifetime: false,
        resetDate: new Date().toISOString(),
      });
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const ym = new Date().toISOString().slice(0, 7);
    try {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select(
          "tier, is_lifetime, assessments_cap, current_period_end"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      const tier = (sub?.tier as string) || "free";
      const isLifetime = Boolean(sub?.is_lifetime || tier === "lifetime");
      const usageRow = await ensureUsageTrackingForMonth(
        supabase,
        user.id,
        ym,
        sub
      );
      const used = usageRow?.assessments_used ?? 0;
      const cap =
        usageRow?.assessments_cap ?? usageCapFromSubscriptionRow(sub);
      const periodMonth = usageRow?.period_month ?? ym;
      const remaining = Math.max(0, cap - used);
      const resetDate = computeResetDateIso(
        sub?.current_period_end ?? null,
        periodMonth
      );
      setState({
        used,
        cap,
        remaining,
        tier,
        isLifetime,
        resetDate,
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<SubscriptionUsageValue>(
    () => ({
      ...state,
      loading,
    }),
    [state, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSubscriptionUsage(): SubscriptionUsageValue {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error(
      "useSubscriptionUsage must be used within SubscriptionUsageProvider"
    );
  }
  return v;
}
