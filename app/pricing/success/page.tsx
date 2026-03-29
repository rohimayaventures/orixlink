import Link from "next/link";

export default function PricingSuccessPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--cream)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <h1 className="font-display" style={{ fontSize: "1.75rem", marginBottom: 12 }}>
          Thank you
        </h1>
        <p style={{ color: "var(--text-muted-light)", marginBottom: 24 }}>
          Your subscription is being updated. It may take a minute to appear on
          your account.
        </p>
        <Link href="/account" className="btn-gold" style={{ display: "inline-block" }}>
          Go to account
        </Link>
      </div>
    </main>
  );
}
