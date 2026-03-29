import type { ReactNode } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Legal | OrixLink AI",
  description:
    "Medical disclaimer, terms of use, subscription terms, and privacy policy for OrixLink AI by Rohimaya Health AI.",
};

const muted = "var(--text-muted-dark)";
const heading = "var(--text-on-dark)";
const rule = {
  border: "none" as const,
  borderTop: "1px solid var(--obsidian-muted)",
  margin: "0 0 3rem",
};

const bodyStyle = { fontSize: "0.9375rem", color: muted, lineHeight: 1.8 as const };

function Subheading({ children }: { children: ReactNode }) {
  return (
    <p style={{ marginTop: "1.35rem", marginBottom: "0.65rem" }}>
      <strong style={{ fontSize: "1.05rem", color: heading, fontWeight: 600, display: "block" }}>
        {children}
      </strong>
    </p>
  );
}

export default function LegalPage() {
  return (
    <AppShell contentTopPadding={96}>
      <div className="px-5 sm:px-8 pb-16" style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            display: "inline-block",
            fontSize: "0.8125rem",
            color: "var(--gold-muted)",
            textDecoration: "none",
            marginBottom: "2rem",
            fontFamily: "var(--font-mono)",
          }}
        >
          &larr; Back to OrixLink AI
        </Link>

        <h1
          className="font-display"
          style={{
            fontSize: "2rem",
            fontWeight: 500,
            color: heading,
            marginBottom: "0.25rem",
            lineHeight: 1.2,
          }}
        >
          Legal
        </h1>
        <p
          style={{
            fontSize: "0.8125rem",
            color: muted,
            marginBottom: "3rem",
            fontFamily: "var(--font-mono)",
          }}
        >
          Effective March 28, 2026
        </p>

        <section style={{ marginBottom: "3rem" }}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: heading,
              marginBottom: "1rem",
            }}
          >
            Medical disclaimer
          </h2>
          <div style={bodyStyle}>
            <p style={{ marginBottom: "1rem" }}>
              OrixLink AI is not a substitute for professional medical advice,
              diagnosis, or treatment. The information provided by this service is
              for general informational and educational purposes only and does not
              constitute medical advice.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              OrixLink AI does not diagnose medical conditions, prescribe treatments,
              or create a provider-patient relationship between you and Hannah
              Kraulik Pagade, operating as Rohimaya Health AI.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              Always seek the advice of a qualified healthcare provider with any
              questions you may have regarding a medical condition. Never disregard
              professional medical advice or delay seeking it because of information
              provided by OrixLink AI.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              If you believe you are experiencing a medical emergency, call 911 or go
              to your nearest emergency department immediately. OrixLink AI is not an
              emergency service.
            </p>
            <p>
              Urgency tier ratings produced by OrixLink AI are AI-generated estimates
              only. They are not a clinical determination and should never replace
              evaluation by a licensed provider.
            </p>
          </div>
        </section>

        <hr style={rule} />

        <section style={{ marginBottom: "3rem" }}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: heading,
              marginBottom: "1rem",
            }}
          >
            Terms of use
          </h2>
          <div style={bodyStyle}>
            <p style={{ marginBottom: "1rem" }}>
              By accessing or using OrixLink AI, you agree to be bound by these Terms
              of Use. If you do not agree, you must not use the service.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              OrixLink AI is operated by Hannah Kraulik Pagade, operating as Rohimaya
              Health AI, Westminster, Colorado. The service provides AI-generated
              health information and triage guidance. It is not a licensed medical
              provider and does not practice medicine.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              You agree that you will not rely solely on OrixLink AI for any medical
              decision. You acknowledge that all assessments are AI-generated and may
              be inaccurate, incomplete, or inappropriate for your specific
              situation.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              You must be at least 18 years old to create an account. If you are using
              OrixLink AI in caregiver mode to assess a minor or dependent, you
              represent that you are their legal guardian or authorized caregiver.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              You agree not to use OrixLink AI to seek emergency medical care. If you
              are in a life-threatening situation, call 911 immediately.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              The service is provided &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; without warranties of any kind, either express or
              implied. We do not guarantee the accuracy, completeness, or usefulness of
              any information provided.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              To the fullest extent permitted by law, Hannah Kraulik Pagade, operating
              as Rohimaya Health AI, shall not be liable for any direct, indirect,
              incidental, consequential, or punitive damages arising from your use of
              OrixLink AI.
            </p>
            <p>
              We reserve the right to modify these terms at any time. Continued use
              of the service after changes constitutes acceptance of the updated
              terms. Material changes will be noted by updating the effective date at
              the top of this page.
            </p>
          </div>
        </section>

        <hr style={rule} />

        <section style={{ marginBottom: "3rem" }}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: heading,
              marginBottom: "1rem",
            }}
          >
            Subscription terms
          </h2>
          <div style={bodyStyle}>
            <p style={{ marginBottom: "1rem" }}>
              OrixLink AI offers free and paid subscription tiers including Pro,
              Family, and Lifetime access, as well as assessment credit packs.
              Subscriptions are billed through Stripe. By purchasing a subscription
              you agree to Stripe&apos;s terms of service in addition to these terms.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              Subscriptions renew automatically on the same day each month or year
              depending on your billing cycle. You may cancel at any time through your
              account billing portal. Cancellation takes effect at the end of your
              current billing period &mdash; you retain access until that date.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              Assessment credits purchased separately do not expire while your
              subscription is active. Credits freeze on cancellation and reactivate
              if your subscription is reinstated. Credits are non-refundable.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              The Lifetime Access tier is a one-time purchase available for a limited
              period only. Lifetime access includes Pro features and a 100 assessment
              per month cap. This cap applies permanently and is not subject to change
              after purchase.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              Pro, Family, and Lifetime tiers include the ability to schedule optional
              follow-up email reminders after you view assessment results (offered in
              the product at 24, 48, or 72 hours). The Free tier does not include this
              feature.
            </p>
            <p>
              Refunds are not offered for subscription periods already in use. If you
              believe you were charged in error contact us at{" "}
              <a
                href="mailto:support@rohimaya.ai"
                style={{ color: "var(--gold)", textDecoration: "underline" }}
              >
                support@rohimaya.ai
              </a>{" "}
              within 7 days of the charge.
            </p>
          </div>
        </section>

        <hr style={rule} />

        <section style={{ marginBottom: "3rem" }}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: heading,
              marginBottom: "1rem",
            }}
          >
            Privacy policy
          </h2>
          <div style={bodyStyle}>
            <p style={{ marginBottom: "1rem" }}>
              Your privacy matters. This policy describes how Hannah Kraulik Pagade,
              operating as Rohimaya Health AI, handles your information when you use
              OrixLink AI.
            </p>

            <Subheading>HIPAA and regulatory scope</Subheading>
            <p style={{ marginBottom: "1rem" }}>
              OrixLink AI is not a covered entity under the Health Insurance
              Portability and Accountability Act (HIPAA). OrixLink AI is a
              direct-to-consumer informational tool and does not create a covered
              relationship between users and a healthcare provider, health plan, or
              healthcare clearinghouse. Users should not treat OrixLink AI assessments
              as protected health information (PHI) under HIPAA. If you are a clinical
              practice using the Clinical Practice tier, please consult your own
              compliance counsel regarding any applicable HIPAA obligations on your end
              before using patient-linked features.
            </p>

            <p style={{ marginTop: 0, marginBottom: "0.65rem" }}>
              <strong style={{ fontSize: "1.05rem", color: heading, fontWeight: 600, display: "block" }}>
                Information we collect
              </strong>
            </p>
            <p style={{ marginBottom: "1rem" }}>
              When you create an account we collect your email address and display
              name provided through Google OAuth or email signup. We do not collect
              your password &mdash; authentication is handled by Supabase Auth.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              When you use OrixLink AI, your assessment sessions and messages are
              stored in our Supabase database and associated with your account. This
              includes symptom descriptions, language preferences, role selections, and
              AI-generated assessment responses.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              We collect subscription and billing status through Stripe. We do not
              store your payment card information &mdash; all payment data is handled
              directly by Stripe and subject to their privacy policy.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              We use Vercel Analytics to collect anonymous usage data such as page
              views and device type. This data does not identify individual users.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              For anonymous users: a browser fingerprint and IP address for rate
              limiting purposes only, retained for 30 days.
            </p>

            <Subheading>Anonymous assessments and rate limiting</Subheading>
            <p style={{ marginBottom: "1rem" }}>
              Users who have not created an account may complete one free assessment. To
              prevent abuse of the free assessment, OrixLink AI records a browser
              fingerprint and IP address in a server-side rate limiting table when an
              anonymous assessment is submitted. This data is used only to enforce the
              one free assessment limit and is not linked to any personal profile or used
              for any other purpose.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              The browser fingerprint is derived from non-identifying technical signals
              including browser type, screen dimensions, and timezone. It does not
              include cookies, device identifiers, or any personally identifying
              information.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              Anonymous assessment content &mdash; your symptom description and the AI
              response &mdash; is not stored on our servers. It exists only in your
              browser session and is cleared when you close the tab.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              If you create an account after completing an anonymous assessment, you may
              choose to save that session to your account. At that point the session
              content is stored under your authenticated profile subject to the data
              practices described in this policy.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              Rate limiting data (fingerprint and IP) is retained for 30 days and then
              deleted automatically.
            </p>

            <Subheading>How we use your information</Subheading>
            <p style={{ marginBottom: "1rem" }}>
              We use your assessment data solely to provide the OrixLink AI service
              &mdash; including saving your history, generating PDF exports, and
              sending optional follow-up email reminders that you explicitly
              schedule after an assessment. We do not use your health assessment
              data to train AI models.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              Assessment content is processed by Anthropic (Claude API) to generate
              responses and is subject to Anthropic&apos;s data handling policies.
              Anthropic does not use API inputs to train their models by default.
            </p>

            <Subheading>Data sharing</Subheading>
            <p style={{ marginBottom: "1rem" }}>
              We do not sell, rent, or share your personal information or health
              assessment data with third parties for marketing purposes.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              We share data only with the following service providers as necessary to
              operate the product: Supabase (database and authentication), Stripe
              (billing and payments), Anthropic (AI assessment generation), Vercel
              (hosting and analytics), and Resend (transactional email reminders).
            </p>
            <p style={{ marginBottom: "1rem" }}>
              Transactional emails including follow-up reminders are sent via Resend
              (resend.com). Loops (loops.so) is integrated for future marketing
              communications and audience management but is not currently used to
              process personal data.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              Each provider is subject to their own privacy policy and data handling
              terms.
            </p>

            <Subheading>Data retention</Subheading>
            <p style={{ marginBottom: "1rem" }}>
              Your account data and assessment history are retained for as long as
              your account is active. If you request account deletion, your data will
              be permanently deleted within 30 days.
            </p>

            <Subheading>Your rights</Subheading>
            <p style={{ marginBottom: "0.75rem" }}>You have the right to:</p>
            <ul
              style={{
                margin: "0 0 1rem",
                paddingLeft: "1.25rem",
                listStyleType: "disc",
              }}
            >
              <li style={{ marginBottom: "0.35rem" }}>
                Access the personal data we hold about you
              </li>
              <li style={{ marginBottom: "0.35rem" }}>
                Request correction of inaccurate data
              </li>
              <li style={{ marginBottom: "0.35rem" }}>
                Request deletion of your account and associated data
              </li>
              <li style={{ marginBottom: "0.35rem" }}>
                Export your assessment history
              </li>
            </ul>
            <p style={{ marginBottom: "1rem" }}>
              To exercise any of these rights contact us at{" "}
              <a
                href="mailto:support@rohimaya.ai"
                style={{ color: "var(--gold)", textDecoration: "underline" }}
              >
                support@rohimaya.ai
              </a>{" "}
              with the subject line &ldquo;Data Request.&rdquo;
            </p>

            <Subheading>Security</Subheading>
            <p style={{ marginBottom: "1rem" }}>
              We use industry-standard security practices including encrypted
              connections (HTTPS), row-level security on all database tables, and
              authenticated API access. No system is perfectly secure &mdash; if you
              believe your account has been compromised contact us immediately at{" "}
              <a
                href="mailto:support@rohimaya.ai"
                style={{ color: "var(--gold)", textDecoration: "underline" }}
              >
                support@rohimaya.ai
              </a>
              .
            </p>

            <Subheading>Session security</Subheading>
            <p style={{ marginBottom: "1rem" }}>
              OrixLink AI automatically signs you out after 30 minutes of inactivity. You
              will receive a warning 2 minutes before this occurs. This applies to all
              authenticated sessions on all devices.
            </p>

            <Subheading>Contact</Subheading>
            <p>
              If you have questions about this privacy policy or your data contact us
              at{" "}
              <a
                href="mailto:support@rohimaya.ai"
                style={{ color: "var(--gold)", textDecoration: "underline" }}
              >
                support@rohimaya.ai
              </a>
              .
            </p>
          </div>
        </section>

        <hr style={{ ...rule, margin: "0 0 2rem" }} />

        <p
          style={{
            fontSize: "0.8125rem",
            color: muted,
            lineHeight: 1.7,
            fontFamily: "var(--font-mono)",
            marginBottom: "1rem",
          }}
        >
          &copy; 2026 Hannah Kraulik Pagade, operating as Rohimaya Health AI. All
          rights reserved.
        </p>
        <p
          style={{
            fontSize: "0.8125rem",
            color: muted,
            lineHeight: 1.7,
            fontFamily: "var(--font-mono)",
            maxWidth: "36rem",
          }}
        >
          OrixLink AI is not a medical device and has not been reviewed or approved by
          the FDA or any regulatory body. It is an informational tool only.
        </p>
      </div>
    </AppShell>
  );
}
