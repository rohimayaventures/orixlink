"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckIcon } from "@radix-ui/react-icons";
import { useAuth } from "@/components/AuthProvider";
import AppShell from "@/components/AppShell";

type Tier = "free" | "pro" | "family";
type Phase = "idle" | "awaiting-auth" | "checkout";

function priceKeyFor(tier: Tier, billing: "annual" | "monthly"): string | null {
  if (tier === "free") return null;
  if (tier === "pro")
    return billing === "annual" ? "pro-annual" : "pro-monthly";
  return billing === "annual" ? "family-annual" : "family-monthly";
}

function AuthSignUpInner() {
  const { user, loading, openAuthModal } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/assessment";
  const signInHref = `/auth/signin?redirect=${encodeURIComponent(redirect)}`;

  const [tier, setTier] = useState<Tier>("free");
  const [billing, setBilling] = useState<"annual" | "monthly">("annual");
  const [phase, setPhase] = useState<Phase>("idle");
  const [checkoutError, setCheckoutError] = useState(false);
  const checkoutStarted = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (user && phase === "idle") {
      const redirectTo = searchParams.get("redirect");
      if (
        redirectTo &&
        redirectTo.startsWith("/") &&
        !redirectTo.startsWith("//")
      ) {
        router.replace(redirectTo);
      } else {
        router.replace("/account");
      }
    }
  }, [loading, user, phase, router, searchParams]);

  useEffect(() => {
    if (loading || !user) return;
    if (phase !== "awaiting-auth") return;
    if (tier === "free") {
      router.replace(redirect);
      return;
    }
    setPhase("checkout");
  }, [user, loading, phase, tier, redirect, router]);

  useEffect(() => {
    if (phase !== "checkout" || !user) return;
    if (checkoutStarted.current) return;
    const key = priceKeyFor(tier, billing);
    if (!key) return;
    checkoutStarted.current = true;
    setCheckoutError(false);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "subscription", priceKey: key }),
        });
        let data: { url?: string; error?: string } = {};
        try {
          data = await res.json();
        } catch (parseErr) {
          console.error("Checkout session creation failed:", parseErr);
          if (!cancelled) {
            checkoutStarted.current = false;
            setCheckoutError(true);
            setPhase("idle");
          }
          return;
        }
        if (cancelled) return;
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        console.error("Checkout session creation failed:", {
          status: res.status,
          body: data,
        });
        checkoutStarted.current = false;
        setCheckoutError(true);
        setPhase("idle");
      } catch (error) {
        console.error("Checkout session creation failed:", error);
        if (!cancelled) {
          checkoutStarted.current = false;
          setCheckoutError(true);
          setPhase("idle");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, user, tier, billing]);

  function handleCreateAccount() {
    setCheckoutError(false);
    setPhase("awaiting-auth");
    openAuthModal();
  }

  const showPaidToggle = tier === "pro" || tier === "family";

  return (
    <AppShell contentTopPadding={96}>
      <div className="px-5 sm:px-8 pb-20 max-w-5xl mx-auto">
        <p
          className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-center mb-3"
          style={{ color: "var(--gold-muted)" }}
        >
          Create account
        </p>
        <h1
          className="font-display text-center text-3xl sm:text-4xl font-medium mb-2"
          style={{ color: "var(--text-on-dark)" }}
        >
          Choose your plan
        </h1>
        <p
          className="text-center text-sm sm:text-base mb-8 max-w-xl mx-auto"
          style={{ color: "var(--text-muted-dark)", fontFamily: "var(--font-body), sans-serif" }}
        >
          Start free or subscribe in one step. After you sign up with email or Google, we&apos;ll
          send you to secure checkout for paid plans.
        </p>

        {showPaidToggle && (
          <div className="flex justify-center mb-8">
            <div
              className="inline-flex p-1 rounded-full border gap-1"
              style={{
                borderColor: "var(--obsidian-muted)",
                background: "var(--obsidian-mid)",
              }}
            >
              <button
                type="button"
                onClick={() => setBilling("annual")}
                className="px-4 py-2 rounded-full text-xs font-semibold font-mono uppercase tracking-wide"
                style={{
                  background: billing === "annual" ? "rgba(200,169,110,0.2)" : "transparent",
                  color: billing === "annual" ? "var(--gold)" : "var(--text-muted-dark)",
                  border: billing === "annual" ? "1px solid rgba(200,169,110,0.35)" : "1px solid transparent",
                }}
              >
                Annual
              </button>
              <button
                type="button"
                onClick={() => setBilling("monthly")}
                className="px-4 py-2 rounded-full text-xs font-semibold font-mono uppercase tracking-wide"
                style={{
                  background: billing === "monthly" ? "rgba(200,169,110,0.2)" : "transparent",
                  color: billing === "monthly" ? "var(--gold)" : "var(--text-muted-dark)",
                  border: billing === "monthly" ? "1px solid rgba(200,169,110,0.35)" : "1px solid transparent",
                }}
              >
                Monthly
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {(
            [
              {
                id: "free" as const,
                name: "Free",
                blurb: "5 assessments / month · Core features",
                price: "$0",
                sub: "/mo",
              },
              {
                id: "pro" as const,
                name: "Pro",
                blurb: "150 assessments / month · Full history & exports",
                price: billing === "annual" ? "$15.83" : "$19",
                sub: "/mo",
                extra:
                  billing === "annual" ? "Billed $190/yr · save $38" : "Billed monthly",
              },
              {
                id: "family" as const,
                name: "Family",
                blurb: "300 assessments / month · Up to 6 members",
                price: billing === "annual" ? "$28.33" : "$34",
                sub: "/mo",
                extra:
                  billing === "annual" ? "Billed $340/yr · save $68" : "Billed monthly",
              },
            ] as const
          ).map((card) => {
            const selected = tier === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setTier(card.id)}
                className="text-left rounded-xl p-6 border-2 transition-all card-dark"
                style={{
                  borderColor: selected ? "var(--gold)" : "var(--obsidian-muted)",
                  boxShadow: selected
                    ? "0 0 0 1px rgba(200,169,110,0.25), 0 8px 32px rgba(0,0,0,0.35)"
                    : undefined,
                  background: "var(--obsidian-mid)",
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-display text-xl" style={{ color: "var(--text-on-dark)" }}>
                    {card.name}
                  </span>
                  {selected && (
                    <CheckIcon className="w-5 h-5 shrink-0" style={{ color: "var(--gold)" }} />
                  )}
                </div>
                <div className="mb-3">
                  <span className="font-mono text-2xl font-semibold" style={{ color: "var(--gold)" }}>
                    {card.price}
                  </span>
                  <span className="text-sm ml-1" style={{ color: "var(--text-muted-dark)" }}>
                    {card.sub}
                  </span>
                </div>
                {"extra" in card && card.extra && (
                  <p className="font-mono text-xs mb-3" style={{ color: "var(--text-muted-dark)" }}>
                    {card.extra}
                  </p>
                )}
                <p className="text-sm leading-snug" style={{ color: "var(--text-muted-dark)" }}>
                  {card.blurb}
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <button
            type="button"
            onClick={handleCreateAccount}
            disabled={loading}
            className="btn-gold px-10 py-3.5 rounded-lg font-semibold disabled:opacity-50 w-full sm:w-auto min-w-[240px]"
            style={{ color: "var(--obsidian)" }}
          >
            {phase === "checkout" ? "Redirecting to checkout…" : "Create account & continue"}
          </button>
        </div>

        {checkoutError && (
          <p
            role="alert"
            style={{
              backgroundColor: "rgba(200,169,110,0.08)",
              border: "1px solid rgba(200,169,110,0.3)",
              color: "#C8A96E",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              padding: "12px 16px",
              borderRadius: "8px",
              marginTop: "16px",
              textAlign: "center",
            }}
          >
            We created your account but could not start checkout. Please go to{" "}
            <Link
              href="/pricing"
              style={{
                color: "#C8A96E",
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              Pricing
            </Link>{" "}
            to select your plan.
          </p>
        )}

        <p className="text-center text-sm" style={{ color: "var(--text-muted-dark)" }}>
          <Link href="/pricing" style={{ color: "var(--gold)" }}>
            Full plan comparison
          </Link>
          {" · "}
          <Link href="/" style={{ color: "var(--gold-muted)" }}>
            Back to home
          </Link>
        </p>
        <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted-dark)" }}>
          Already have an account?{" "}
          <Link href={signInHref} style={{ color: "var(--gold)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </AppShell>
  );
}

export default function AuthSignUpPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "var(--obsidian)" }}
        >
          <p className="font-mono text-sm" style={{ color: "var(--gold-muted)" }}>
            Loading…
          </p>
        </div>
      }
    >
      <AuthSignUpInner />
    </Suspense>
  );
}
