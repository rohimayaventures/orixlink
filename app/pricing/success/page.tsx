"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";

const OBS = "#080C14";
const GOLD = "#C8A96E";
const CREAM = "#F4EFE6";

type ConfirmPayload = {
  status: string;
  priceKey?: string;
  creditsAmount?: string;
  isLifetime?: boolean;
};

function headlineForPurchase(data: ConfirmPayload): string {
  if (data.isLifetime) return "Lifetime access secured.";
  if (
    data.creditsAmount != null ||
    (data.priceKey && data.priceKey.startsWith("credits-"))
  ) {
    return "Credits added to your account.";
  }
  if (data.priceKey?.startsWith("pro")) return "You're now on Pro.";
  if (data.priceKey?.startsWith("family")) return "You're now on Family.";
  return "Thank you — you're all set.";
}

function GoldCheckIcon() {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="mx-auto mb-8"
    >
      <circle
        cx="36"
        cy="36"
        r="34"
        stroke={GOLD}
        strokeWidth="2"
        fill="rgba(200,169,110,0.12)"
      />
      <path
        d="M22 37l10 10 18-22"
        stroke={GOLD}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function PricingSuccessInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [phase, setPhase] = useState<"loading" | "success" | "error">("loading");
  const [data, setData] = useState<ConfirmPayload | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setPhase("error");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`
        );
        const json = (await res.json()) as ConfirmPayload & { error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setPhase("error");
          return;
        }
        if (
          json.status !== "paid" &&
          json.status !== "no_payment_required"
        ) {
          setPhase("error");
          return;
        }
        setData({
          status: json.status,
          priceKey: json.priceKey,
          creditsAmount: json.creditsAmount,
          isLifetime: json.isLifetime,
        });
        setPhase("success");
      } catch {
        if (!cancelled) setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const openBillingPortal = useCallback(async () => {
    try {
      const res = await fetch("/api/billing-portal", {
        method: "POST",
        credentials: "same-origin",
      });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } catch {
      /* ignore */
    }
  }, []);

  if (phase === "loading") {
    return (
      <div className="text-center px-6 max-w-md">
        <div
          className="font-mono text-sm tracking-widest uppercase mb-4 animate-pulse"
          style={{ color: "rgba(200,169,110,0.85)" }}
        >
          Confirming your purchase
        </div>
        <p style={{ color: "rgba(240,237,232,0.55)", fontFamily: "var(--font-body), sans-serif", fontSize: "0.9375rem" }}>
          One moment while we verify your checkout…
        </p>
      </div>
    );
  }

  if (phase === "error" || !data) {
    return (
      <div className="text-center px-6 max-w-md">
        <h1
          className="text-2xl sm:text-3xl font-medium mb-4"
          style={{ fontFamily: "var(--font-display), Georgia, serif", color: CREAM }}
        >
          We couldn&apos;t confirm that checkout
        </h1>
        <p
          className="mb-8 leading-relaxed"
          style={{ color: "rgba(240,237,232,0.65)", fontFamily: "var(--font-body), sans-serif", fontSize: "0.9375rem" }}
        >
          The session may have expired, or something went wrong on our side. If you were charged, your account will still update — check your email or account.
        </p>
        <Link
          href="/pricing"
          className="inline-block px-8 py-3 rounded-lg font-semibold transition-opacity hover:opacity-90"
          style={{
            background: GOLD,
            color: OBS,
            fontFamily: "var(--font-body), sans-serif",
          }}
        >
          Back to pricing
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center px-6 max-w-lg">
      <GoldCheckIcon />
      <h1
        className="text-3xl sm:text-[2.125rem] font-medium mb-5 leading-tight"
        style={{ fontFamily: "var(--font-display), Georgia, serif", color: CREAM }}
      >
        {headlineForPurchase(data)}
      </h1>
      <p
        className="mb-10 leading-relaxed"
        style={{ color: "rgba(240,237,232,0.78)", fontFamily: "var(--font-body), sans-serif", fontSize: "1.0625rem" }}
      >
        Your account has been updated. You can start a new assessment now.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center mb-12">
        <Link
          href="/"
          className="btn-gold inline-flex justify-center items-center px-8 py-3.5 rounded-lg font-semibold no-underline"
          style={{ color: OBS, fontFamily: "var(--font-body), sans-serif" }}
        >
          Start an assessment
        </Link>
        <button
          type="button"
          onClick={openBillingPortal}
          className="btn-ghost-gold inline-flex justify-center items-center px-8 py-3.5 rounded-lg font-semibold border"
          style={{
            fontFamily: "var(--font-body), sans-serif",
            borderColor: "rgba(200,169,110,0.45)",
            color: GOLD,
            background: "transparent",
          }}
        >
          Manage billing
        </button>
      </div>
      <p
        className="text-sm"
        style={{ color: "rgba(240,237,232,0.45)", fontFamily: "var(--font-body), sans-serif" }}
      >
        Questions? Reach us at{" "}
        <a href="mailto:support@rohimaya.ai" className="orix-link">
          support@rohimaya.ai
        </a>
      </p>
    </div>
  );
}

export default function PricingSuccessPage() {
  return (
    <AppShell contentTopPadding={96}>
      <div className="flex flex-col items-center justify-center py-12 px-4 min-h-[calc(100vh-12rem)]">
        <Suspense
          fallback={
            <div className="text-center px-6">
              <p
                className="font-mono text-sm"
                style={{ color: "rgba(200,169,110,0.85)" }}
              >
                Loading…
              </p>
            </div>
          }
        >
          <PricingSuccessInner />
        </Suspense>
      </div>
    </AppShell>
  );
}
