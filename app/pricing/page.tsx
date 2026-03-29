import Link from "next/link";

export default function PricingPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--cream)",
        padding: "100px 24px 80px",
        maxWidth: 560,
        margin: "0 auto",
      }}
    >
      <h1
        className="font-display"
        style={{
          fontSize: "2rem",
          color: "var(--text-on-light)",
          marginBottom: 16,
        }}
      >
        Pricing
      </h1>
      <p
        style={{
          color: "var(--text-muted-light)",
          lineHeight: 1.65,
          marginBottom: 28,
          fontFamily: "var(--font-body), sans-serif",
        }}
      >
        Upgrade to Pro or purchase additional assessments. Checkout will be
        available here soon — for now, use your account or contact support for
        billing changes.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <Link href="/account" className="btn-gold" style={{ display: "inline-block" }}>
          Account
        </Link>
        <Link href="/" className="btn-ghost-gold" style={{ display: "inline-block" }}>
          Back to home
        </Link>
      </div>
    </main>
  );
}
