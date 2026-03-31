"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Cross2Icon } from "@radix-ui/react-icons";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";

type Tier = "free" | "pro" | "family";
type Billing = "annual" | "monthly";

type PlanDef = {
  id: Tier;
  name: string;
  annualPrice: string;
  monthlyPrice: string;
  annualNote?: string;
  features: string[];
  cta: string;
  recommended?: boolean;
};

const BG = "#080C14";
const CARD = "#0D1220";
const TEXT = "#F4EFE6";
const MUTED = "rgba(244,239,230,0.5)";
const GOLD = "#C8A96E";
const BORDER = "1px solid rgba(255,255,255,0.07)";

const PLANS: PlanDef[] = [
  {
    id: "free",
    name: "Free",
    annualPrice: "$0",
    monthlyPrice: "$0",
    features: [
      "5 assessments / month",
      "Standard analysis",
      "Core triage and differential",
      "Anonymous or signed-in",
      "Legal disclaimer included",
    ],
    cta: "Sign up free",
  },
  {
    id: "pro",
    name: "Pro",
    annualPrice: "$15.83",
    monthlyPrice: "$19",
    annualNote: "Billed $190/yr · save $38",
    features: [
      "150 assessments / month",
      "Deep analysis (Sonnet)",
      "Full history and exports",
      "Follow-up reminders",
      "Dependent profiles (up to 2)",
      "Credit packs available",
    ],
    cta: "Sign up for Pro",
    recommended: true,
  },
  {
    id: "family",
    name: "Family",
    annualPrice: "$28.33",
    monthlyPrice: "$34",
    annualNote: "Billed $340/yr · save $68",
    features: [
      "600 assessments / month shared",
      "Up to 6 members",
      "Deep analysis (Sonnet)",
      "Dependent profiles (up to 6)",
      "Family usage dashboard",
      "Credit packs available",
    ],
    cta: "Sign up for Family",
  },
];

function priceKeyFor(tier: Tier, billing: Billing): string | null {
  if (tier === "free") return null;
  if (tier === "pro") return billing === "annual" ? "pro-annual" : "pro-monthly";
  return billing === "annual" ? "family-annual" : "family-monthly";
}

function AuthSignUpInner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const familyCode = searchParams.get("family_code");
  const planParamRaw = (searchParams.get("plan") || "").toLowerCase();
  const planParam: Tier | null =
    planParamRaw === "free" || planParamRaw === "pro" || planParamRaw === "family"
      ? (planParamRaw as Tier)
      : null;

  const [billing, setBilling] = useState<Billing>("annual");
  const [selectedPlan, setSelectedPlan] = useState<Tier | null>(planParam);
  const [modalOpen, setModalOpen] = useState(Boolean(planParam));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [formError, setFormError] = useState("");
  const processingPostAuthRef = useRef(false);
  const familyJoinHandled = useRef(false);

  useEffect(() => {
    if (planParam) {
      setSelectedPlan(planParam);
      setModalOpen(true);
    }
  }, [planParam]);

  const selectedPlanDef = useMemo(
    () => PLANS.find((p) => p.id === selectedPlan) ?? null,
    [selectedPlan]
  );

  const selectedPlanPriceText = useMemo(() => {
    if (!selectedPlanDef) return "";
    if (selectedPlanDef.id === "free") {
      return `You selected ${selectedPlanDef.name} · $0/mo`;
    }
    if (billing === "annual") {
      const annualTotal = selectedPlanDef.id === "pro" ? "$190/yr" : "$340/yr";
      return `You selected ${selectedPlanDef.name} · ${selectedPlanDef.annualPrice}/mo · Billed ${annualTotal}`;
    }
    return `You selected ${selectedPlanDef.name} · ${selectedPlanDef.monthlyPrice}/mo`;
  }, [selectedPlanDef, billing]);

  async function startCheckout(plan: Tier): Promise<void> {
    const priceKey = priceKeyFor(plan, billing);
    if (!priceKey) return;
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "subscription", priceKey }),
    });
    const data = (await response.json()) as { url?: string; error?: string };
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    throw new Error(data.error || "Could not start checkout");
  }

  useEffect(() => {
    if (loading || !user || !selectedPlan || processingPostAuthRef.current) return;
    if (familyCode?.trim()) return;
    processingPostAuthRef.current = true;

    void (async () => {
      try {
        if (selectedPlan === "free") {
          router.replace("/dashboard");
          return;
        }
        await startCheckout(selectedPlan);
      } catch (e) {
        console.error("post-auth checkout", e);
        setCheckoutError("We created your account but could not start checkout. Please try again.");
        processingPostAuthRef.current = false;
      }
    })();
  }, [loading, user, selectedPlan, familyCode, router, billing]);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!familyCode?.trim()) return;
    if (familyJoinHandled.current) return;
    familyJoinHandled.current = true;

    void (async () => {
      const code = familyCode.trim().toUpperCase();
      const res = await fetch("/api/family/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code }),
      });
      if (res.ok) {
        router.replace("/?family_welcome=1");
      } else {
        router.replace(`/account?join_family=${encodeURIComponent(code)}`);
      }
    })();
  }, [loading, user, familyCode, router]);

  function openPlanModal(plan: Tier) {
    setSelectedPlan(plan);
    setFormError("");
    setCheckoutError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setFormError("");
    setCheckoutError("");
    if (!planParam) setSelectedPlan(null);
  }

  async function handleGoogleSignUp() {
    if (!selectedPlan || !ageConfirmed || submitting) return;
    setSubmitting(true);
    setFormError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) {
        console.error("Google OAuth error:", error);
        setFormError(error.message || "Could not start Google sign up.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan || !ageConfirmed || submitting) return;
    setSubmitting(true);
    setFormError("");
    try {
      const callbackNext = `/auth/signup?plan=${selectedPlan}`;
      const emailRedirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackNext)}`
          : undefined;

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo },
      });

      if (error) {
        setFormError(error.message || "Could not create account.");
        setSubmitting(false);
        return;
      }

      // If email confirmation is enabled, keep user informed in place.
      setFormError(
        "Check your email to confirm your account, then continue from the same plan link."
      );
      setSubmitting(false);
    } catch {
      setFormError("Could not create account.");
      setSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: BG,
        color: TEXT,
        padding: "32px 16px 40px",
        overflowX: "hidden",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <h1
          className="font-display"
          style={{ textAlign: "center", fontSize: "clamp(2rem,4.2vw,3rem)", marginBottom: 10 }}
        >
          Choose your plan
        </h1>
        <p
          style={{
            textAlign: "center",
            color: MUTED,
            marginBottom: 28,
            fontFamily: "var(--font-body), sans-serif",
          }}
        >
          Start free or subscribe in one step.
        </p>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <div
            style={{
              display: "inline-flex",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 999,
              padding: 4,
              background: "#111827",
              gap: 4,
            }}
          >
            <button
              type="button"
              onClick={() => setBilling("annual")}
              style={{
                minHeight: 44,
                padding: "0 16px",
                borderRadius: 999,
                border: billing === "annual" ? "1px solid rgba(200,169,110,0.35)" : "1px solid transparent",
                background: billing === "annual" ? "rgba(200,169,110,0.2)" : "transparent",
                color: billing === "annual" ? GOLD : MUTED,
                cursor: "pointer",
                transition: "all 200ms ease",
                fontFamily: "var(--font-body), sans-serif",
              }}
            >
              Annual
            </button>
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              style={{
                minHeight: 44,
                padding: "0 16px",
                borderRadius: 999,
                border: billing === "monthly" ? "1px solid rgba(200,169,110,0.35)" : "1px solid transparent",
                background: billing === "monthly" ? "rgba(200,169,110,0.2)" : "transparent",
                color: billing === "monthly" ? GOLD : MUTED,
                cursor: "pointer",
                transition: "all 200ms ease",
                fontFamily: "var(--font-body), sans-serif",
              }}
            >
              Monthly
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            alignItems: "stretch",
            opacity: modalOpen ? 0.4 : 1,
            transition: "opacity 200ms ease",
          }}
        >
          {PLANS.map((plan) => {
            const displayPrice =
              plan.id === "free"
                ? "$0"
                : billing === "annual"
                  ? plan.annualPrice
                  : plan.monthlyPrice;
            const note =
              plan.id === "free"
                ? null
                : billing === "annual"
                  ? plan.annualNote
                  : "Billed monthly";

            return (
              <div
                key={plan.id}
                style={{
                  background: CARD,
                  border: plan.recommended ? "1px solid rgba(200,169,110,0.45)" : BORDER,
                  borderRadius: 16,
                  padding: 22,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  boxShadow: plan.recommended
                    ? "0 0 0 1px rgba(200,169,110,0.2)"
                    : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <h2 className="font-display" style={{ fontSize: 30, color: TEXT }}>
                    {plan.name}
                  </h2>
                  {plan.recommended ? (
                    <span
                      style={{
                        borderRadius: 999,
                        padding: "4px 10px",
                        fontSize: 11,
                        color: BG,
                        background: GOLD,
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      Recommended
                    </span>
                  ) : null}
                </div>

                <div style={{ marginTop: 6, marginBottom: 14 }}>
                  <span className="font-mono" style={{ fontSize: 32, color: GOLD }}>
                    {displayPrice}
                  </span>
                  <span style={{ marginLeft: 4, color: MUTED }}>/mo</span>
                  {note ? (
                    <p style={{ color: MUTED, marginTop: 6, fontSize: 13, fontFamily: "var(--font-body), sans-serif" }}>
                      {note}
                    </p>
                  ) : null}
                </div>

                <ul style={{ margin: 0, paddingLeft: 18, color: TEXT, lineHeight: 1.7, marginBottom: 20, flex: 1 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ marginBottom: 2 }}>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => openPlanModal(plan.id)}
                  style={{
                    width: "100%",
                    minHeight: 44,
                    border: "none",
                    borderRadius: 10,
                    background: GOLD,
                    color: BG,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "opacity 200ms ease",
                    fontFamily: "var(--font-body), sans-serif",
                    marginTop: "auto",
                  }}
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        <p style={{ textAlign: "center", marginTop: 26 }}>
          <Link
            href="/auth/signin"
            style={{
              color: GOLD,
              textDecoration: "none",
              fontFamily: "var(--font-body), sans-serif",
            }}
          >
            Already have an account? Sign in
          </Link>
        </p>
      </div>

      {modalOpen && selectedPlanDef ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              background: "#0D1220",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16,
              padding: "24px 20px 20px",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close"
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 44,
                height: 44,
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: MUTED,
                cursor: "pointer",
              }}
            >
              <Cross2Icon width={20} height={20} />
            </button>

            <p
              style={{
                margin: 0,
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: GOLD,
                fontFamily: "var(--font-mono)",
              }}
            >
              {selectedPlanPriceText}
            </p>

            <button
              type="button"
              disabled={!ageConfirmed || submitting}
              onClick={handleGoogleSignUp}
              style={{
                width: "100%",
                minHeight: 44,
                marginTop: 14,
                borderRadius: 8,
                border: "none",
                background: GOLD,
                color: BG,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                cursor: !ageConfirmed || submitting ? "not-allowed" : "pointer",
                opacity: !ageConfirmed || submitting ? 0.55 : 1,
                fontFamily: "var(--font-body), sans-serif",
              }}
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                width={20}
                height={20}
              />
              Continue with Google
            </button>

            <div
              style={{
                height: 1,
                background: "rgba(200,169,110,0.25)",
                margin: "16px 0",
              }}
            />

            <form onSubmit={handleEmailSignUp}>
              <label
                htmlFor="signup-email"
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 13,
                  color: "rgba(244,239,230,0.85)",
                  fontFamily: "var(--font-body), sans-serif",
                }}
              >
                Email address
              </label>
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 44,
                  marginBottom: 12,
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "#141824",
                  color: TEXT,
                  padding: "0 12px",
                }}
              />

              <label
                htmlFor="signup-password"
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 13,
                  color: "rgba(244,239,230,0.85)",
                  fontFamily: "var(--font-body), sans-serif",
                }}
              >
                Create a password
              </label>
              <input
                id="signup-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 44,
                  marginBottom: 12,
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "#141824",
                  color: TEXT,
                  padding: "0 12px",
                }}
              />

              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  marginBottom: 14,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  style={{ marginTop: 3, accentColor: GOLD }}
                />
                <span
                  style={{
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: MUTED,
                    fontFamily: "var(--font-body), sans-serif",
                  }}
                >
                  I confirm I am 18 years of age or older. OrixLink AI is for adults only. To assess a child, create an account and add them as a dependent profile.
                </span>
              </label>

              <button
                type="submit"
                disabled={!ageConfirmed || submitting}
                style={{
                  width: "100%",
                  minHeight: 44,
                  border: "none",
                  borderRadius: 8,
                  background: GOLD,
                  color: BG,
                  fontWeight: 700,
                  cursor: !ageConfirmed || submitting ? "not-allowed" : "pointer",
                  opacity: !ageConfirmed || submitting ? 0.55 : 1,
                  fontFamily: "var(--font-body), sans-serif",
                }}
              >
                Create account
              </button>
            </form>

            {formError ? (
              <p style={{ marginTop: 12, marginBottom: 0, color: GOLD, fontSize: 12, lineHeight: 1.5 }}>
                {formError}
              </p>
            ) : null}
            {checkoutError ? (
              <p style={{ marginTop: 10, marginBottom: 0, color: "#FCA5A5", fontSize: 12, lineHeight: 1.5 }}>
                {checkoutError}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default function AuthSignUpPage() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen flex items-center justify-center"
          style={{ background: BG }}
        >
          <p
            style={{
              color: MUTED,
              fontFamily: "DM Sans, sans-serif",
              fontSize: 14,
            }}
          >
            Loading…
          </p>
        </main>
      }
    >
      <AuthSignUpInner />
    </Suspense>
  );
}
