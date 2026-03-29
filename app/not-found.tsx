import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{ background: "#080C14" }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -52%)",
          fontFamily: "var(--font-display), Cormorant Garamond, serif",
          fontSize: 120,
          fontWeight: 400,
          color: "rgba(200,169,110,0.2)",
          lineHeight: 1,
          pointerEvents: "none",
          zIndex: 0,
          userSelect: "none",
        }}
      >
        404
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          maxWidth: 400,
        }}
      >
        <h1
          className="font-display"
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: "#F4EFE6",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Page not found.
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "rgba(244,239,230,0.5)",
            fontFamily: "DM Sans, sans-serif",
            marginTop: 8,
            marginBottom: 28,
            lineHeight: 1.5,
          }}
        >
          This page does not exist or has been moved.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "stretch",
          }}
        >
          <Link
            href="/"
            className="orix-btn-gold"
            style={{
              display: "block",
              padding: "14px 24px",
              borderRadius: 10,
              fontSize: 14,
              fontFamily: "DM Sans, sans-serif",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Go home
          </Link>
          <Link
            href="/"
            className="orix-btn-outline"
            style={{
              display: "block",
              padding: "14px 24px",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 14,
              fontFamily: "DM Sans, sans-serif",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Start an assessment
          </Link>
        </div>

        <p
          style={{
            marginTop: 28,
            fontSize: 12,
            color: "rgba(244,239,230,0.45)",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          Need help? support@rohimaya.ai
        </p>
      </div>
    </main>
  );
}
