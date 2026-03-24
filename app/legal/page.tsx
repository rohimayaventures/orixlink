import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal — OrixLink AI",
  description:
    "Medical disclaimer, terms of use, and privacy policy for OrixLink AI by Rohimaya Health AI.",
};

export default function LegalPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        color: "#1a1a1a",
        fontFamily: "'DM Sans', sans-serif",
        padding: "60px 24px 100px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            display: "inline-block",
            fontSize: "0.8125rem",
            color: "#888888",
            textDecoration: "none",
            marginBottom: "2rem",
          }}
        >
          &larr; Back to OrixLink AI
        </Link>

        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 500,
            color: "#0f0f0f",
            marginBottom: "0.25rem",
            lineHeight: 1.2,
          }}
        >
          Legal
        </h1>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "#999999",
            marginBottom: "3rem",
          }}
        >
          Effective March 24, 2026
        </p>

        {/* ── Medical Disclaimer ──────────────────────────────────── */}
        <section style={{ marginBottom: "3rem" }}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "#0f0f0f",
              marginBottom: "1rem",
            }}
          >
            Medical Disclaimer
          </h2>
          <div style={{ fontSize: "0.9375rem", color: "#444444", lineHeight: 1.8 }}>
            <p style={{ marginBottom: "1rem" }}>
              OrixLink AI is not a substitute for professional medical advice,
              diagnosis, or treatment. The information provided by this tool is
              for general informational and educational purposes only.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              OrixLink AI does not diagnose medical conditions, prescribe
              treatments, or create a provider-patient relationship between you
              and Hannah Kraulik Pagade, operating as Rohimaya Health AI.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              Always seek the advice of a qualified healthcare provider with any
              questions you may have regarding a medical condition. Never
              disregard professional medical advice or delay seeking it because
              of information provided by OrixLink AI.
            </p>
            <p>
              <strong style={{ color: "#0f0f0f" }}>
                If you believe you are experiencing a medical emergency, call
                911 or go to your nearest emergency department immediately.
              </strong>
            </p>
          </div>
        </section>

        <hr style={{ border: "none", borderTop: "1px solid #e5e5e5", margin: "0 0 3rem" }} />

        {/* ── Terms of Use ────────────────────────────────────────── */}
        <section style={{ marginBottom: "3rem" }}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "#0f0f0f",
              marginBottom: "1rem",
            }}
          >
            Terms of Use
          </h2>
          <div style={{ fontSize: "0.9375rem", color: "#444444", lineHeight: 1.8 }}>
            <p style={{ marginBottom: "1rem" }}>
              By accessing or using OrixLink AI, you agree to be bound by these
              Terms of Use. If you do not agree, you must not use the service.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              OrixLink AI is operated by Hannah Kraulik Pagade, operating as
              Rohimaya Health AI. The service provides AI-generated health
              information and triage guidance. It is not a licensed medical
              provider and does not practice medicine.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              You agree that you will not rely solely on OrixLink AI for any
              medical decision. You acknowledge that all assessments are
              AI-generated and may be inaccurate, incomplete, or inappropriate
              for your specific situation.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              The service is provided &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; without warranties of any kind, either express or
              implied. We do not guarantee the accuracy, completeness, or
              usefulness of any information provided.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              To the fullest extent permitted by law, Hannah Kraulik Pagade,
              operating as Rohimaya Health AI, shall not be liable for any
              direct, indirect, incidental, consequential, or punitive damages
              arising from your use of OrixLink AI.
            </p>
            <p>
              We reserve the right to modify these terms at any time. Continued
              use of the service after changes constitutes acceptance of the
              updated terms.
            </p>
          </div>
        </section>

        <hr style={{ border: "none", borderTop: "1px solid #e5e5e5", margin: "0 0 3rem" }} />

        {/* ── Privacy Policy ──────────────────────────────────────── */}
        <section style={{ marginBottom: "3rem" }}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "#0f0f0f",
              marginBottom: "1rem",
            }}
          >
            Privacy Policy
          </h2>
          <div style={{ fontSize: "0.9375rem", color: "#444444", lineHeight: 1.8 }}>
            <p style={{ marginBottom: "1rem" }}>
              Your privacy matters. This policy describes how Hannah Kraulik
              Pagade, operating as Rohimaya Health AI, handles information when
              you use OrixLink AI.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              <strong style={{ color: "#0f0f0f" }}>
                Information we collect:
              </strong>{" "}
              OrixLink AI does not require an account or login. We do not
              collect personally identifiable information unless you voluntarily
              provide it in the conversation. Conversations are processed by a
              third-party AI provider (Anthropic) and are subject to their data
              handling policies.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              <strong style={{ color: "#0f0f0f" }}>Analytics:</strong> We use
              Vercel Analytics to collect anonymous usage data such as page
              views and device type. This data does not identify individual
              users.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              <strong style={{ color: "#0f0f0f" }}>Local storage:</strong> We
              store a single preference in your browser&apos;s local storage to
              remember that you have acknowledged the medical disclaimer. No
              health data is stored locally.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              <strong style={{ color: "#0f0f0f" }}>Data sharing:</strong> We do
              not sell, rent, or share your information with third parties for
              marketing purposes. Conversation data may be processed by our AI
              provider to generate responses.
            </p>
            <p>
              If you have questions about this privacy policy, contact us at{" "}
              <a
                href="mailto:legal@rohimaya.ai"
                style={{ color: "#0f0f0f", textDecoration: "underline" }}
              >
                legal@rohimaya.ai
              </a>
              .
            </p>
          </div>
        </section>

        <hr style={{ border: "none", borderTop: "1px solid #e5e5e5", margin: "0 0 2rem" }} />

        <p
          style={{
            fontSize: "0.8125rem",
            color: "#999999",
            lineHeight: 1.7,
          }}
        >
          &copy; 2026 Hannah Kraulik Pagade, operating as Rohimaya Health AI.
          All rights reserved.
        </p>
      </div>
    </main>
  );
}
