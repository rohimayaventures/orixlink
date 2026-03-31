"use client";

import Link from "next/link";
import HeaderAuth from "@/components/HeaderAuth";
import { BuyMorePrompt } from "@/components/BuyMorePrompt";
import { useAuth } from "@/components/AuthProvider";
import { useSubscriptionUsage } from "@/components/SubscriptionUsageProvider";
import { shouldShowBuyMoreBanner } from "@/lib/usageNearCap";

const navLinkStyle = {
  fontSize: "0.8125rem",
  color: "var(--text-muted-dark)",
  textDecoration: "none" as const,
  fontFamily: "var(--font-body), sans-serif",
  fontWeight: 500,
};

const footerLinkStyle = {
  fontSize: "0.75rem",
  color: "var(--gold-muted)",
  textDecoration: "none" as const,
  fontFamily: "var(--font-mono)",
};

type Props = {
  children: React.ReactNode;
  /** Extra top padding below fixed nav (px) */
  contentTopPadding?: number;
  showFooter?: boolean;
};

export default function AppShell({
  children,
  contentTopPadding = 88,
  showFooter = true,
}: Props) {
  const { user } = useAuth();
  const usage = useSubscriptionUsage();
  const showBuyMore =
    Boolean(user) &&
    !usage.loading &&
    !usage.isLifetime &&
    (usage.tier === "pro" || usage.tier === "family") &&
    shouldShowBuyMoreBanner(usage.remaining, usage.tier, usage.isLifetime);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--obsidian)", color: "var(--text-on-dark)" }}
    >
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid var(--obsidian-muted)",
          background: "rgba(8,12,20,0.9)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0">
          <img
            src="/OrixLink AI Logo (1).svg"
            alt=""
            width={32}
            height={32}
            style={{ borderRadius: "50%" }}
          />
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
        </Link>
        <div
          className="flex items-center gap-4 md:gap-6 overflow-x-auto max-w-[min(52vw,320px)] sm:max-w-none scrollbar-none"
          style={{
            flexWrap: "nowrap",
            justifyContent: "flex-end",
            WebkitOverflowScrolling: "touch",
            maskImage:
              "linear-gradient(to right, transparent, black 8px, black calc(100% - 8px), transparent)",
          }}
        >
          {(
            [
              ["Home", "/"],
              ["Pricing", "/pricing"],
              ["Assessment", "/assessment"],
              ["Legal", "/legal"],
              ...(Boolean(user) && !usage.loading && usage.tier === "family"
                ? ([["Family", "/family"]] as [string, string][])
                : []),
              ["Dash", "/dashboard"],
              ["History", "/history"],
            ] as [string, string][]
          ).map(([label, href]) => (
            <Link key={href + label} href={href} style={{ ...navLinkStyle, whiteSpace: "nowrap" }}>
              {label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <HeaderAuth variant="dark" />
        </div>
      </nav>

      <div className="flex-1 w-full" style={{ paddingTop: contentTopPadding }}>
        {showBuyMore ? (
          <BuyMorePrompt
            remaining={usage.remaining}
            tier={usage.tier as "pro" | "family"}
            resetDate={usage.resetDate}
          />
        ) : null}
        {children}
      </div>

      {showFooter && (
        <footer
          style={{
            borderTop: "1px solid var(--obsidian-muted)",
            padding: "24px",
            marginTop: "auto",
            background: "var(--obsidian)",
          }}
        >
          <div
            className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-5 items-center justify-center"
          >
            {[
              ["Home", "/"],
              ["Pricing", "/pricing"],
              ["Assessment", "/assessment"],
              ["Legal", "/legal"],
              ["Dashboard", "/dashboard"],
              ["History", "/history"],
              ["Account", "/account"],
            ].map(([label, href]) => (
              <Link key={href} href={href} style={footerLinkStyle}>
                {label}
              </Link>
            ))}
          </div>
          <p
            className="text-center mt-4"
            style={{
              fontSize: "0.6875rem",
              color: "var(--text-muted-dark)",
              fontFamily: "var(--font-mono)",
            }}
          >
            For informational use only. Not a substitute for professional medical advice.
          </p>
        </footer>
      )}
    </div>
  );
}
