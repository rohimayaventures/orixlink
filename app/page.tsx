“use client”;

import Link from “next/link”;
import {
ActivityLogIcon,
LockClosedIcon,
PersonIcon,
ArrowRightIcon,
DotFilledIcon,
} from “@radix-ui/react-icons”;

export default function LandingPage() {
return (
<main className=“min-h-screen” style={{ background: “var(–obsidian)” }}>

```
  {/* ── Nav ─────────────────────────────────────────────────── */}
  <nav
    className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
    style={{
      borderBottom: "1px solid var(--obsidian-muted)",
      background: "rgba(8,12,20,0.85)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
    }}
  >
    <div className="flex items-center gap-3">
      {/* Logo mark */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "1.5px solid var(--gold-muted)",
          background: "var(--gold-dim)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityLogIcon
          style={{ color: "var(--gold)", width: 14, height: 14 }}
        />
      </div>
      <span
        className="font-display"
        style={{
          fontSize: "1.125rem",
          fontWeight: 500,
          color: "var(--text-on-dark)",
          letterSpacing: "0.02em",
        }}
      >
        OrixLink <span style={{ color: "var(--gold)" }}>AI</span>
      </span>
    </div>

    <span
      style={{
        fontSize: "0.75rem",
        color: "var(--text-muted-dark)",
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      Rohimaya Health AI
    </span>
  </nav>

  {/* ── Hero ─────────────────────────────────────────────────── */}
  <section
    className="relative flex flex-col items-center justify-center text-center"
    style={{
      minHeight: "100vh",
      padding: "120px 24px 80px",
      overflow: "hidden",
    }}
  >
    {/* Ambient orb — background glow */}
    <div
      className="animate-orb"
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -60%)",
        width: "min(700px, 120vw)",
        height: "min(700px, 120vw)",
        borderRadius: "50%",
        background:
          "radial-gradient(ellipse at center, rgba(200,169,110,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />

    {/* Grid texture overlay */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(200,169,110,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(200,169,110,0.03) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />

    {/* Content */}
    <div className="relative" style={{ zIndex: 1, maxWidth: 720 }}>

      {/* Eyebrow */}
      <div
        className="animate-fade-in inline-flex items-center gap-2 mb-8"
        style={{
          padding: "6px 16px",
          borderRadius: 100,
          border: "1px solid var(--gold-muted)",
          background: "var(--gold-dim)",
        }}
      >
        <DotFilledIcon
          style={{
            color: "var(--gold)",
            width: 8,
            height: 8,
            animation: "goldPulse 2.4s ease-out infinite",
          }}
        />
        <span
          style={{
            fontSize: "0.75rem",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--gold)",
          }}
        >
          Universal Clinical Triage
        </span>
      </div>

      {/* Headline */}
      <h1
        className="animate-fade-up font-display delay-100"
        style={{
          fontSize: "clamp(2.75rem, 8vw, 5.5rem)",
          fontWeight: 300,
          color: "var(--text-on-dark)",
          lineHeight: 1.08,
          letterSpacing: "-0.02em",
          marginBottom: "0.25em",
        }}
      >
        Every symptom
        <br />
        <span
          style={{
            fontStyle: "italic",
            color: "var(--gold)",
            fontWeight: 400,
          }}
        >
          finds its answer.
        </span>
      </h1>

      {/* Subhead */}
      <p
        className="animate-fade-up delay-200"
        style={{
          fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
          color: "var(--text-muted-dark)",
          lineHeight: 1.7,
          maxWidth: 520,
          margin: "1.75rem auto 0",
          fontWeight: 300,
        }}
      >
        Describe what you're feeling. OrixLink assesses urgency, maps
        possible causes, and tells you exactly what to do next — any
        symptom, any person, no diagnosis required.
      </p>

      {/* CTA */}
      <div
        className="animate-fade-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4"
        style={{ marginTop: "2.75rem" }}
      >
        <Link href="/assessment">
          <button
            className="btn-gold animate-pulse-gold"
            style={{ minWidth: 220, fontSize: "0.875rem" }}
          >
            Begin Assessment
            <ArrowRightIcon style={{ width: 16, height: 16 }} />
          </button>
        </Link>
        <span
          style={{
            fontSize: "0.8125rem",
            color: "var(--text-muted-dark)",
            fontFamily: "var(--font-mono)",
          }}
        >
          No login · No data stored
        </span>
      </div>

      {/* Trust signals */}
      <div
        className="animate-fade-up delay-400"
        style={{ marginTop: "3.5rem" }}
      >
        <div className="divider-gold" style={{ marginBottom: "1.75rem" }} />
        <div
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
        >
          {[
            { icon: <LockClosedIcon />, label: "No login required" },
            { icon: <PersonIcon />, label: "Any person, any symptom" },
            {
              icon: <ActivityLogIcon />,
              label: "AI-assisted, not AI-decided",
            },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2"
              style={{ color: "var(--text-muted-dark)" }}
            >
              <span style={{ color: "var(--gold-muted)", display: "flex" }}>
                {icon}
              </span>
              <span
                style={{
                  fontSize: "0.8125rem",
                  fontFamily: "var(--font-body)",
                  fontWeight: 400,
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Bottom fade */}
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 120,
        background:
          "linear-gradient(to bottom, transparent, var(--obsidian))",
        pointerEvents: "none",
      }}
    />
  </section>

  {/* ── How it works ─────────────────────────────────────────── */}
  <section
    style={{
      background: "var(--obsidian-mid)",
      borderTop: "1px solid var(--obsidian-muted)",
      borderBottom: "1px solid var(--obsidian-muted)",
      padding: "80px 24px",
    }}
  >
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <p
        className="font-display text-center"
        style={{
          fontSize: "0.75rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--gold-muted)",
          marginBottom: "1rem",
          fontStyle: "normal",
        }}
      >
        How it works
      </p>
      <h2
        className="font-display text-center"
        style={{
          fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
          fontWeight: 400,
          color: "var(--text-on-dark)",
          marginBottom: "3.5rem",
          fontStyle: "italic",
        }}
      >
        Three steps to clarity.
      </h2>

      <div
        className="grid gap-6"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        }}
      >
        {[
          {
            step: "01",
            title: "Tell us who you are",
            body: "Patient, caregiver, or professional — your context shapes how we respond.",
          },
          {
            step: "02",
            title: "Describe what's happening",
            body: "New symptoms, chronic flare, injury, pediatric concern — anything. No prior diagnosis needed.",
          },
          {
            step: "03",
            title: "Get your answer",
            body: "Urgency level, differential possibilities, and your exact next step — clearly, without jargon.",
          },
        ].map(({ step, title, body }) => (
          <div
            key={step}
            className="card-dark"
            style={{ padding: "28px 24px" }}
          >
            <div
              className="font-mono"
              style={{
                fontSize: "0.6875rem",
                letterSpacing: "0.12em",
                color: "var(--gold-muted)",
                marginBottom: "1rem",
              }}
            >
              {step}
            </div>
            <h3
              className="font-display"
              style={{
                fontSize: "1.375rem",
                fontWeight: 400,
                color: "var(--text-on-dark)",
                marginBottom: "0.75rem",
                fontStyle: "italic",
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-muted-dark)",
                lineHeight: 1.65,
                fontWeight: 300,
              }}
            >
              {body}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* ── Use cases ────────────────────────────────────────────── */}
  <section style={{ padding: "80px 24px", background: "var(--obsidian)" }}>
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <p
        className="font-display text-center"
        style={{
          fontSize: "0.75rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--gold-muted)",
          marginBottom: "1rem",
        }}
      >
        Built for every moment
      </p>
      <h2
        className="font-display text-center"
        style={{
          fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
          fontWeight: 400,
          color: "var(--text-on-dark)",
          marginBottom: "3rem",
          fontStyle: "italic",
        }}
      >
        When you need answers, not a waiting room.
      </h2>

      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        }}
      >
        {[
          "Chest pain at 2am",
          "Child won't stop crying",
          "Post-surgery questions",
          "Medication side effects",
          "Chronic pain flare",
          "Injury assessment",
          "Mental health concern",
          "Pregnancy symptoms",
        ].map((label) => (
          <div
            key={label}
            style={{
              padding: "16px 20px",
              borderRadius: 8,
              border: "1px solid var(--obsidian-muted)",
              background: "var(--gold-dim)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <DotFilledIcon
              style={{
                color: "var(--gold)",
                width: 8,
                height: 8,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "0.875rem",
                color: "var(--text-on-dark)",
                fontWeight: 400,
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* ── Final CTA ────────────────────────────────────────────── */}
  <section
    style={{
      padding: "80px 24px 100px",
      textAlign: "center",
      borderTop: "1px solid var(--obsidian-muted)",
      background: "var(--obsidian-mid)",
    }}
  >
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h2
        className="font-display"
        style={{
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 300,
          color: "var(--text-on-dark)",
          lineHeight: 1.1,
          marginBottom: "1.5rem",
          fontStyle: "italic",
        }}
      >
        Something feels wrong.
        <br />
        <span style={{ color: "var(--gold)" }}>Let's find out what.</span>
      </h2>
      <p
        style={{
          fontSize: "1rem",
          color: "var(--text-muted-dark)",
          marginBottom: "2.5rem",
          fontWeight: 300,
          lineHeight: 1.65,
        }}
      >
        Free. No account. No waiting. Just answers.
      </p>
      <Link href="/assessment">
        <button
          className="btn-gold"
          style={{ minWidth: 240, fontSize: "0.875rem" }}
        >
          Start Now — It's Free
          <ArrowRightIcon style={{ width: 16, height: 16 }} />
        </button>
      </Link>
    </div>
  </section>

  {/* ── Footer ───────────────────────────────────────────────── */}
  <footer
    style={{
      borderTop: "1px solid var(--obsidian-muted)",
      padding: "28px 24px",
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      background: "var(--obsidian)",
    }}
  >
    <span
      className="font-display"
      style={{ color: "var(--text-muted-dark)", fontSize: "0.875rem" }}
    >
      OrixLink AI · <span style={{ color: "var(--gold-muted)" }}>Rohimaya Health AI</span>
    </span>
    <span
      style={{
        fontSize: "0.75rem",
        color: "var(--text-muted-dark)",
        fontFamily: "var(--font-mono)",
      }}
    >
      For informational use only. Not a substitute for professional medical advice.
    </span>
  </footer>
</main>
```

);
}