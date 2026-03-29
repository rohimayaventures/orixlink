import Link from "next/link";

export interface ModelBadgeProps {
  tier: string;
}

const DEEP_TIERS = ["pro", "family", "clinical", "lifetime"] as const;

export function ModelBadge({ tier }: ModelBadgeProps) {
  const normalized = (tier || "free").toLowerCase();
  const isDeep = DEEP_TIERS.includes(
    normalized as (typeof DEEP_TIERS)[number]
  );

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: isDeep
          ? "rgba(200,169,110,0.1)"
          : "rgba(244,239,230,0.05)",
        border: isDeep
          ? "1px solid rgba(200,169,110,0.3)"
          : "1px solid rgba(244,239,230,0.1)",
        borderRadius: "20px",
        padding: "3px 10px",
      }}
    >
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: isDeep ? "#C8A96E" : "rgba(244,239,230,0.3)",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: "11px",
          color: isDeep ? "#C8A96E" : "rgba(244,239,230,0.4)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {isDeep ? "Deep analysis" : "Standard analysis"}
      </span>
    </div>
  );
}

export function ModelBadgeFreeUpgradeLink() {
  return (
    <span
      style={{
        fontFamily: "var(--font-body), sans-serif",
        fontSize: "11px",
        color: "rgba(200,169,110,0.5)",
        marginLeft: "8px",
      }}
    >
      <Link
        href="/pricing"
        style={{
          color: "rgba(200,169,110,0.6)",
          textDecoration: "underline",
        }}
      >
        Upgrade for Deep analysis
      </Link>
    </span>
  );
}
