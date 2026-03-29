"use client";

import Link from "next/link";
import HeaderAuth from "@/components/HeaderAuth";
import {
  ActivityLogIcon,
  LockClosedIcon,
  PersonIcon,
  ArrowRightIcon,
  DotFilledIcon,
  MixerHorizontalIcon,
  ChatBubbleIcon,
  UpdateIcon,
} from "@radix-ui/react-icons";

export default function LandingPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--obsidian)" }}>

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid var(--obsidian-muted)",
          background: "rgba(8,12,20,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/OrixLink AI Logo (1).svg"
            alt="OrixLink AI"
            style={{ width: 32, height: 32, borderRadius: "50%" }}
          />
          <span className="font-display" style={{ fontSize: "1.125rem", fontWeight: 500, color: "var(--text-on-dark)", letterSpacing: "0.02em" }}>
            OrixLink <span style={{ color: "var(--gold)" }}>AI</span>
          </span>
        </div>
        <HeaderAuth variant="dark" />
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column" as const,
        alignItems: "center", justifyContent: "center", textAlign: "center" as const,
        padding: "120px 24px 80px", position: "relative" as const, overflow: "hidden",
      }}>
        <div className="animate-orb" style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -60%)",
          width: "min(700px, 120vw)", height: "min(700px, 120vw)",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(200,169,110,0.07) 0%, transparent 70%)",
          pointerEvents: "none", zIndex: 0,
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(200,169,110,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(200,169,110,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 0,
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 720 }}>
          <div className="animate-fade-in" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 100,
            border: "1px solid var(--gold-muted)", background: "var(--gold-dim)", marginBottom: "2rem",
          }}>
            <DotFilledIcon style={{ color: "var(--gold)", width: 8, height: 8, animation: "goldPulse 2.4s ease-out infinite" }} />
            <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--gold)" }}>
              Universal Clinical Triage
            </span>
          </div>

          <h1 className="animate-fade-up font-display delay-100" style={{
            fontSize: "clamp(2.75rem, 8vw, 5.5rem)", fontWeight: 300,
            color: "var(--text-on-dark)", lineHeight: 1.08, letterSpacing: "-0.02em", marginBottom: "0.25em",
          }}>
            Every symptom<br />
            <span style={{ fontStyle: "italic", color: "var(--gold)", fontWeight: 400 }}>finds its answer.</span>
          </h1>

          <p className="animate-fade-up delay-200" style={{
            fontSize: "clamp(1rem, 2.5vw, 1.2rem)", color: "var(--text-muted-dark)",
            lineHeight: 1.7, maxWidth: 520, margin: "1.75rem auto 0", fontWeight: 300,
          }}>
            Describe what you&apos;re feeling. OrixLink assesses urgency, maps possible causes,
            and tells you exactly what to do next — any symptom, any person, no diagnosis required.
          </p>

          <div className="animate-fade-up delay-300" style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 14, marginTop: "2.75rem" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <Link href="/assessment" style={{ display: "inline-block" }}>
                <button className="btn-gold animate-pulse-gold" style={{ minWidth: 220, fontSize: "0.875rem" }}>
                  Begin Assessment
                  <ArrowRightIcon style={{ width: 16, height: 16 }} />
                </button>
              </Link>
              <Link href="/auth/signup" style={{ display: "inline-block" }}>
                <button
                  type="button"
                  className="btn-ghost-gold"
                  style={{
                    minWidth: 220,
                    padding: "14px 28px",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    borderWidth: "1.5px",
                    borderColor: "var(--gold)",
                  }}
                >
                  Sign Up
                </button>
              </Link>
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted-dark)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
              Free to start · Save your history · Sign up in seconds
            </span>
          </div>

          <div className="animate-fade-up delay-400" style={{ marginTop: "3.5rem" }}>
            <div className="divider-gold" style={{ marginBottom: "1.75rem" }} />
            <div style={{ display: "flex", flexWrap: "wrap" as const, alignItems: "center", justifyContent: "center", gap: "12px 32px" }}>
              {[
                { icon: <LockClosedIcon />, label: "Free to start" },
                { icon: <PersonIcon />, label: "Any person, any symptom" },
                { icon: <ActivityLogIcon />, label: "AI-assisted, not AI-decided" },
              ].map(({ icon, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted-dark)" }}>
                  <span style={{ color: "var(--gold-muted)", display: "flex" }}>{icon}</span>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 400 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 120,
          background: "linear-gradient(to bottom, transparent, var(--obsidian))", pointerEvents: "none",
        }} />
      </section>

      {/* ── Feature cards ────────────────────────────────────────── */}
      <section style={{
        background: "var(--obsidian-mid)",
        borderTop: "1px solid var(--obsidian-muted)",
        borderBottom: "1px solid var(--obsidian-muted)",
        padding: "80px 24px",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <p className="font-display" style={{ textAlign: "center", fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--gold-muted)", marginBottom: "0.75rem" }}>
            What you get
          </p>
          <h2 className="font-display" style={{ textAlign: "center", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 400, fontStyle: "italic", color: "var(--text-on-dark)", marginBottom: "3rem" }}>
            Built for clarity under pressure.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {[
              {
                icon: <MixerHorizontalIcon style={{ width: 20, height: 20 }} />,
                title: "Clinical Intelligence",
                body: "Ranked differential diagnoses, red flag tracking, and urgency assessment — adapted for patients, caregivers, and clinicians alike.",
              },
              {
                icon: <ChatBubbleIcon style={{ width: 20, height: 20 }} />,
                title: "Easy to Understand",
                body: "No medical jargon. Clear language, one action, exactly what to say when you arrive. Communication that works for everyone.",
              },
              {
                icon: <UpdateIcon style={{ width: 20, height: 20 }} />,
                title: "Living Conversation",
                body: "Add symptoms, ask follow-ups, update as things change. OrixLink refines its assessment in real time as new information arrives.",
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="card-dark" style={{ padding: "32px 28px" }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  border: "1px solid var(--gold-muted)", background: "var(--gold-dim)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--gold)", marginBottom: "1.25rem",
                }}>
                  {icon}
                </div>
                <h3 className="font-display" style={{ fontSize: "1.375rem", fontWeight: 400, fontStyle: "italic", color: "var(--text-on-dark)", marginBottom: "0.75rem", lineHeight: 1.2 }}>
                  {title}
                </h3>
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted-dark)", lineHeight: 1.7, fontWeight: 300 }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", background: "var(--obsidian)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p className="font-display" style={{ textAlign: "center", fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--gold-muted)", marginBottom: "0.75rem" }}>
            How it works
          </p>
          <h2 className="font-display" style={{ textAlign: "center", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 400, fontStyle: "italic", color: "var(--text-on-dark)", marginBottom: "3.5rem" }}>
            Three steps to clarity.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {[
              { step: "01", title: "Tell us who you are", body: "Patient, caregiver, or professional — your context shapes how we respond." },
              { step: "02", title: "Describe what's happening", body: "New symptoms, chronic flare, injury, pediatric concern — anything. No prior diagnosis needed." },
              { step: "03", title: "Get your answer", body: "Urgency level, differential possibilities, and your exact next step — clearly, without jargon." },
            ].map(({ step, title, body }) => (
              <div key={step} className="card-dark" style={{ padding: "28px 24px" }}>
                <div className="font-mono" style={{ fontSize: "0.6875rem", letterSpacing: "0.12em", color: "var(--gold-muted)", marginBottom: "1rem" }}>
                  {step}
                </div>
                <h3 className="font-display" style={{ fontSize: "1.375rem", fontWeight: 400, fontStyle: "italic", color: "var(--text-on-dark)", marginBottom: "0.75rem" }}>
                  {title}
                </h3>
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted-dark)", lineHeight: 1.65, fontWeight: 300 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use cases ────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", background: "var(--obsidian-mid)", borderTop: "1px solid var(--obsidian-muted)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p className="font-display" style={{ textAlign: "center", fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--gold-muted)", marginBottom: "0.75rem" }}>
            Built for every moment
          </p>
          <h2 className="font-display" style={{ textAlign: "center", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 400, fontStyle: "italic", color: "var(--text-on-dark)", marginBottom: "3rem" }}>
            When you need answers, not a waiting room.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 10 }}>
            {["Chest pain at 2am", "Child won't stop crying", "Post-surgery questions", "Medication side effects", "Chronic pain flare", "Injury assessment", "Mental health concern", "Pregnancy symptoms"].map((label) => (
              <div key={label} style={{ padding: "14px 18px", borderRadius: 8, border: "1px solid var(--obsidian-muted)", background: "var(--gold-dim)", display: "flex", alignItems: "center", gap: 10 }}>
                <DotFilledIcon style={{ color: "var(--gold)", width: 7, height: 7, flexShrink: 0 }} />
                <span style={{ fontSize: "0.875rem", color: "var(--text-on-dark)", fontWeight: 400 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px 100px", textAlign: "center" as const, borderTop: "1px solid var(--obsidian-muted)", background: "var(--obsidian)" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 className="font-display" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 300, fontStyle: "italic", color: "var(--text-on-dark)", lineHeight: 1.1, marginBottom: "1.5rem" }}>
            Something feels wrong.<br />
            <span style={{ color: "var(--gold)" }}>Let&apos;s find out what.</span>
          </h2>
          <p style={{ fontSize: "1rem", color: "var(--text-muted-dark)", marginBottom: "2.5rem", fontWeight: 300, lineHeight: 1.65 }}>
            Free. No account. No waiting. Just answers.
          </p>
          <Link href="/assessment" style={{ display: "inline-block" }}>
            <button className="btn-gold" style={{ minWidth: 240, fontSize: "0.875rem" }}>
              Start Now — It&apos;s Free
              <ArrowRightIcon style={{ width: 16, height: 16 }} />
            </button>
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid var(--obsidian-muted)",
          padding: "28px 24px 32px",
          background: "var(--obsidian)",
        }}
      >
        <div
          className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-5 items-center justify-center mb-4"
        >
          {[
            ["Home", "/"],
            ["Pricing", "/pricing"],
            ["Assessment", "/assessment"],
            ["Sign up", "/auth/signup"],
            ["Legal", "/legal"],
            ["Dashboard", "/dashboard"],
            ["History", "/history"],
            ["Account", "/account"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              style={{
                fontSize: "0.75rem",
                color: "var(--gold-muted)",
                textDecoration: "none",
                fontFamily: "var(--font-mono)",
              }}
            >
              {label}
            </Link>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap" as const,
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            textAlign: "center" as const,
          }}
        >
          <span className="font-display" style={{ color: "var(--text-muted-dark)", fontSize: "0.875rem" }}>
            OrixLink AI · <span style={{ color: "var(--gold-muted)" }}>Rohimaya Health AI</span>
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted-dark)", fontFamily: "var(--font-mono)" }}>
            For informational use only. Not a substitute for professional medical advice.
          </span>
        </div>
      </footer>
    </main>
  );
}
