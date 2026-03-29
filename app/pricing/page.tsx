"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";

const GOLD = "var(--gold)";
const ON_DARK = "var(--text-on-dark)";
const MUTED = "var(--text-muted-dark)";
const OBS_BG = "var(--obsidian)";

const creditPacks = [
  {
    key: "credits-starter" as const,
    name: "Starter",
    price: 5,
    count: 25,
    per: 0.2,
    savePct: 20,
  },
  {
    key: "credits-standard" as const,
    name: "Standard",
    price: 12,
    count: 75,
    per: 0.16,
    savePct: 36,
  },
  {
    key: "credits-value" as const,
    name: "Value",
    price: 20,
    count: 150,
    per: 0.133,
    savePct: 47,
  },
  {
    key: "credits-power" as const,
    name: "Power",
    price: 35,
    count: 300,
    per: 0.117,
    savePct: 53,
  },
];

function FeatureLine({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className="flex gap-2.5 text-sm leading-snug" style={{ color: MUTED }}>
      {ok ? (
        <CheckIcon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: GOLD }} />
      ) : (
        <Cross2Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: MUTED }} />
      )}
      <span style={{ fontFamily: "var(--font-body), sans-serif" }}>{children}</span>
    </li>
  );
}

export default function PricingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [billing, setBilling] = useState<"annual" | "monthly">("annual");

  async function handleCheckout(priceKey: string) {
    if (!user) {
      router.push("/auth/signup?redirect=/pricing");
      return;
    }
    const isOneTime = priceKey === "lifetime" || priceKey.startsWith("credits-");
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: isOneTime ? "one-time" : "subscription",
        priceKey,
      }),
    });
    const data = await response.json();
    if (data.url) window.location.href = data.url;
  }

  const proKey = billing === "annual" ? "pro-annual" : "pro-monthly";
  const familyKey = billing === "annual" ? "family-annual" : "family-monthly";

  return (
    <AppShell contentTopPadding={88}>
      <main className="max-w-6xl mx-auto px-5 sm:px-6 pb-12 pt-2 md:pt-6">
        {/* Hero */}
        <header className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <p
            className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase mb-4"
            style={{ color: GOLD }}
          >
            OrixLink AI by Rohimaya Health AI
          </p>
          <h1
            className="text-4xl sm:text-5xl md:text-[3.25rem] font-medium mb-5"
            style={{ fontFamily: "var(--font-display), Georgia, serif", color: ON_DARK }}
          >
            Clear pricing. No surprises.
          </h1>
          <p
            className="text-base md:text-lg font-light"
            style={{ fontFamily: "var(--font-body), sans-serif", color: MUTED }}
          >
            Start free. Upgrade when OrixLink earns it.
          </p>
        </header>

        {/* Billing toggle */}
        <div className="flex flex-col items-center gap-4 mb-12 md:mb-14">
          <div
            className="inline-flex items-center gap-3 p-1.5 rounded-full border"
            style={{ borderColor: "var(--obsidian-muted)", background: "var(--obsidian-mid)" }}
          >
            <button
              type="button"
              onClick={() => setBilling("annual")}
              className="relative px-5 py-2.5 rounded-full text-sm font-medium transition-all"
              style={{
                fontFamily: "var(--font-body), sans-serif",
                color: billing === "annual" ? GOLD : MUTED,
                background: billing === "annual" ? "rgba(200,169,110,0.15)" : "transparent",
                boxShadow: billing === "annual" ? "0 0 0 1px rgba(200,169,110,0.35)" : "none",
              }}
            >
              <span className="inline-flex items-center gap-2 flex-wrap justify-center">
                Annual
                <span
                  className="font-mono text-[0.625rem] uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: GOLD, color: OBS_BG }}
                >
                  Save up to 17%
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className="px-5 py-2.5 rounded-full text-sm font-medium transition-all"
              style={{
                fontFamily: "var(--font-body), sans-serif",
                color: billing === "monthly" ? GOLD : MUTED,
                background: billing === "monthly" ? "rgba(200,169,110,0.1)" : "transparent",
              }}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16">
          {/* Free */}
          <div
            className="rounded-2xl p-8 flex flex-col border card-dark"
            style={{
              borderColor: "var(--obsidian-muted)",
              boxShadow: "var(--shadow-dark-card)",
            }}
          >
            <h2 className="font-display text-2xl mb-1" style={{ color: ON_DARK }}>
              Free
            </h2>
            <div className="mb-6">
              <span className="font-mono text-3xl font-medium" style={{ color: ON_DARK }}>
                $0
              </span>
              <span className="text-sm ml-1" style={{ color: MUTED, fontFamily: "var(--font-body), sans-serif" }}>
                /mo
              </span>
            </div>
            <ul className="space-y-2.5 flex-1 mb-8">
              <FeatureLine ok>5 assessments / month</FeatureLine>
              <FeatureLine ok>Haiku model (standard analysis)</FeatureLine>
              <FeatureLine ok>Voice input</FeatureLine>
              <FeatureLine ok>Caregiver mode</FeatureLine>
              <FeatureLine ok>All 12 languages</FeatureLine>
              <FeatureLine ok={false}>Symptom history</FeatureLine>
              <FeatureLine ok={false}>PDF export</FeatureLine>
              <FeatureLine ok={false}>Follow-up reminders</FeatureLine>
              <FeatureLine ok={false}>Offline PWA</FeatureLine>
            </ul>
            <Link
              href="/auth/signup?redirect=/pricing"
              className="btn-ghost-gold w-full text-center py-3 rounded-lg font-medium"
              style={{ fontFamily: "var(--font-body), sans-serif" }}
            >
              Get started free
            </Link>
          </div>

          {/* Pro — most popular */}
          <div
            className="rounded-2xl p-8 flex flex-col relative border-2 shadow-md md:-mt-2 md:mb-2 card-dark"
            style={{
              borderColor: GOLD,
              boxShadow: "0 8px 32px rgba(200,169,110,0.15), 0 0 0 1px rgba(200,169,110,0.25)",
            }}
          >
            <span
              className="absolute -top-3 left-1/2 -translate-x-1/2 font-mono text-[0.625rem] uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap"
              style={{ background: GOLD, color: OBS_BG }}
            >
              Most popular
            </span>
            <h2 className="font-display text-2xl mb-1 mt-2" style={{ color: ON_DARK }}>
              Pro
            </h2>
            <div className="mb-2">
              {billing === "annual" ? (
                <>
                  <div>
                    <span className="font-mono text-3xl font-medium" style={{ color: GOLD }}>
                      $15.83
                    </span>
                    <span className="text-sm ml-1" style={{ color: MUTED, fontFamily: "var(--font-body), sans-serif" }}>
                      /mo
                    </span>
                  </div>
                  <p className="text-sm mt-1" style={{ color: MUTED, fontFamily: "var(--font-body), sans-serif" }}>
                    Billed $190/yr — save $38
                  </p>
                </>
              ) : (
                <div>
                  <span className="font-mono text-3xl font-medium" style={{ color: GOLD }}>
                    $19
                  </span>
                  <span className="text-sm ml-1" style={{ color: MUTED, fontFamily: "var(--font-body), sans-serif" }}>
                    /mo
                  </span>
                </div>
              )}
            </div>
            <ul className="space-y-2.5 flex-1 mb-8">
              <FeatureLine ok>150 assessments / month</FeatureLine>
              <FeatureLine ok>Sonnet model (deep analysis)</FeatureLine>
              <FeatureLine ok>Full symptom history timeline</FeatureLine>
              <FeatureLine ok>Appointment prep PDF export</FeatureLine>
              <FeatureLine ok>Follow-up reminders</FeatureLine>
              <FeatureLine ok>Offline PWA</FeatureLine>
              <FeatureLine ok>Dependent profiles (up to 2)</FeatureLine>
              <FeatureLine ok>Credit packs available</FeatureLine>
              <FeatureLine ok>Cross-device sync</FeatureLine>
            </ul>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleCheckout(proKey)}
              className="btn-gold w-full py-3 rounded-lg font-semibold disabled:opacity-50"
              style={{ fontFamily: "var(--font-body), sans-serif", color: OBS_BG }}
            >
              Start Pro
            </button>
          </div>

          {/* Family */}
          <div
            className="rounded-2xl p-8 flex flex-col border card-dark"
            style={{
              borderColor: "var(--obsidian-muted)",
              boxShadow: "var(--shadow-dark-card)",
            }}
          >
            <h2 className="font-display text-2xl mb-1" style={{ color: ON_DARK }}>
              Family
            </h2>
            <div className="mb-2">
              {billing === "annual" ? (
                <>
                  <div>
                    <span className="font-mono text-3xl font-medium" style={{ color: GOLD }}>
                      $28.33
                    </span>
                    <span className="text-sm ml-1" style={{ color: MUTED, fontFamily: "var(--font-body), sans-serif" }}>
                      /mo
                    </span>
                  </div>
                  <p className="text-sm mt-1" style={{ color: MUTED, fontFamily: "var(--font-body), sans-serif" }}>
                    Billed $340/yr — save $68
                  </p>
                </>
              ) : (
                <div>
                  <span className="font-mono text-3xl font-medium" style={{ color: GOLD }}>
                    $34
                  </span>
                  <span className="text-sm ml-1" style={{ color: MUTED, fontFamily: "var(--font-body), sans-serif" }}>
                    /mo
                  </span>
                </div>
              )}
            </div>
            <ul className="space-y-2.5 flex-1 mb-8">
              <FeatureLine ok>300 assessments / month, 6 members</FeatureLine>
              <FeatureLine ok>Everything in Pro</FeatureLine>
              <FeatureLine ok>6 member profiles</FeatureLine>
              <FeatureLine ok>10 assessments / day per member</FeatureLine>
              <FeatureLine ok>Separate history per profile</FeatureLine>
              <FeatureLine ok>Family usage dashboard</FeatureLine>
              <FeatureLine ok>Per-member reminders</FeatureLine>
              <FeatureLine ok={false}>Provider dashboard</FeatureLine>
              <FeatureLine ok={false}>Clinical seats</FeatureLine>
            </ul>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleCheckout(familyKey)}
              className="w-full py-3 rounded-lg font-semibold border-2 transition-colors hover:bg-[rgba(200,169,110,0.08)] disabled:opacity-50"
              style={{
                fontFamily: "var(--font-body), sans-serif",
                borderColor: GOLD,
                color: ON_DARK,
                background: "transparent",
              }}
            >
              Start Family plan
            </button>
          </div>
        </div>

        {/* Lifetime bar */}
        <section
          className="rounded-2xl border-2 p-8 md:p-10 mb-16"
          style={{
            borderColor: GOLD,
            background: OBS_BG,
            boxShadow: "var(--shadow-dark-card)",
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-xl">
              <h2
                className="font-display text-2xl md:text-3xl mb-3"
                style={{ color: "var(--cream)" }}
              >
                Lifetime Access — Launch offer
              </h2>
              <p className="text-sm md:text-base leading-relaxed" style={{ color: "rgba(240,237,232,0.85)", fontFamily: "var(--font-body), sans-serif" }}>
                Pro features, 100 assessments/month forever. Available for 90 days only.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
              <div className="text-left">
                <p className="font-mono text-3xl font-medium" style={{ color: GOLD }}>
                  $249
                </p>
                <p className="font-mono text-xs uppercase tracking-wider" style={{ color: "rgba(240,237,232,0.6)" }}>
                  one-time
                </p>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleCheckout("lifetime")}
                className="px-6 py-3 rounded-lg font-semibold border-2 whitespace-nowrap disabled:opacity-50"
                style={{
                  borderColor: GOLD,
                  color: "var(--cream)",
                  fontFamily: "var(--font-body), sans-serif",
                  background: "transparent",
                }}
              >
                Claim Lifetime
              </button>
            </div>
          </div>
          <p
            className="mt-8 pt-6 border-t font-mono text-xs md:text-sm"
            style={{ borderColor: "rgba(200,169,110,0.25)", color: "rgba(240,237,232,0.65)" }}
          >
            Launch offer -- available for a limited time. Break-even vs Pro annual: 13 months.
          </p>
        </section>

        {user ? (
          <section className="mb-10">
            <p
              className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-center mb-3"
              style={{ color: GOLD }}
            >
              Assessment credit packs
            </p>
            <h2
              className="font-display text-3xl md:text-4xl text-center mb-4"
              style={{ color: ON_DARK }}
            >
              Need more assessments?
            </h2>
            <p
              className="text-center max-w-2xl mx-auto text-sm md:text-base mb-12"
              style={{ color: MUTED, fontFamily: "var(--font-body), sans-serif" }}
            >
              Available to Pro and Family subscribers. Credits never expire while your subscription is active. Freeze on cancellation, reactivate when you return.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {creditPacks.map((pack) => (
                <div
                  key={pack.key}
                  className="rounded-xl p-6 border flex flex-col card-dark"
                  style={{
                    borderColor: "var(--obsidian-muted)",
                    boxShadow: "var(--shadow-dark-card)",
                  }}
                >
                  <h3 className="font-display text-xl mb-1" style={{ color: ON_DARK }}>
                    {pack.name}
                  </h3>
                  <p className="font-mono text-sm mb-4" style={{ color: MUTED }}>
                    {pack.count} assessments
                  </p>
                  <p className="font-mono text-2xl font-semibold mb-1" style={{ color: GOLD }}>
                    ${pack.price}
                  </p>
                  <p className="text-xs mb-1" style={{ color: MUTED, fontFamily: "var(--font-body), sans-serif" }}>
                    ${pack.per.toFixed(2)} per assessment
                  </p>
                  <p className="text-xs mb-6" style={{ color: ON_DARK, fontFamily: "var(--font-body), sans-serif" }}>
                    Save {pack.savePct}% vs $0.25 pay-per-tap
                  </p>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleCheckout(pack.key)}
                    className="mt-auto w-full py-2.5 rounded-lg text-sm font-semibold border disabled:opacity-50"
                    style={{
                      borderColor: GOLD,
                      color: ON_DARK,
                      fontFamily: "var(--font-body), sans-serif",
                      background: "transparent",
                    }}
                  >
                    Add to account
                  </button>
                </div>
              ))}
            </div>

            <p
              className="mt-10 text-center text-sm max-w-3xl mx-auto leading-relaxed"
              style={{ color: MUTED, fontFamily: "var(--font-body), sans-serif" }}
            >
              Prefer pay-as-you-go? Paid subscribers can continue beyond their cap at $0.25 per assessment with a single tap — no packs required.
            </p>
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}
