"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useAuth } from "@/components/AuthProvider";

function AuthSignInInner() {
  const { user, loading, supabase } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    if (loading) return;
    if (user) router.replace(redirect);
  }, [loading, user, redirect, router]);

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : "";

  if (!supabase) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#080C14" }}
      >
        <p
          style={{
            color: "rgba(244,239,230,0.5)",
            fontFamily: "DM Sans, sans-serif",
            fontSize: 14,
          }}
        >
          Loading…
        </p>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-5 py-12"
      style={{ background: "#080C14" }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#0D1220",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16,
          padding: "2.5rem",
        }}
      >
        <p
          className="font-display text-center"
          style={{ fontSize: "1.35rem", color: "#C8A96E", marginBottom: 8 }}
        >
          OrixLink <span style={{ fontStyle: "italic" }}>AI</span>
        </p>
        <h1
          className="font-display text-center"
          style={{
            fontSize: 28,
            color: "#F4EFE6",
            marginBottom: 8,
            fontWeight: 500,
            lineHeight: 1.2,
          }}
        >
          Sign in
        </h1>
        <p
          style={{
            textAlign: "center",
            fontSize: 14,
            color: "rgba(244,239,230,0.5)",
            marginBottom: 28,
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          Welcome back.
        </p>

        <div style={{ fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "#C8A96E",
                    brandAccent: "#080C14",
                    brandButtonText: "#080C14",
                    defaultButtonBackground: "#C8A96E",
                    defaultButtonText: "#080C14",
                    anchorTextColor: "#C8A96E",
                    inputBackground: "#141824",
                    inputText: "#F4EFE6",
                    inputPlaceholder: "rgba(244,239,230,0.45)",
                    messageText: "rgba(244,239,230,0.85)",
                    messageTextDanger: "#C0392B",
                    dividerBackground: "rgba(200,169,110,0.25)",
                  },
                  borderWidths: {
                    buttonBorderWidth: "1px",
                    inputBorderWidth: "1px",
                  },
                  radii: {
                    borderRadiusButton: "8px",
                    inputBorderRadius: "8px",
                  },
                  fonts: {
                    bodyFontFamily: "var(--font-body), DM Sans, sans-serif",
                    buttonFontFamily: "var(--font-body), DM Sans, sans-serif",
                    inputFontFamily: "var(--font-body), DM Sans, sans-serif",
                    labelFontFamily: "var(--font-body), DM Sans, sans-serif",
                  },
                },
              },
              style: {
                button: {
                  borderColor: "rgba(200,169,110,0.5)",
                  borderRadius: "8px",
                },
                input: {
                  borderColor: "rgba(255,255,255,0.1)",
                  color: "#F4EFE6",
                },
                label: { color: "rgba(244,239,230,0.85)" },
                anchor: { color: "#C8A96E", fontWeight: 500 },
                message: { color: "rgba(244,239,230,0.8)" },
              },
            }}
            providers={["google"]}
            redirectTo={redirectTo}
            onlyThirdPartyProviders={false}
            magicLink={false}
            showLinks={true}
            view="sign_in"
          />
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: 28,
            fontSize: 14,
            color: "rgba(244,239,230,0.5)",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          New to OrixLink?{" "}
          <Link
            href={`/auth/signup?redirect=${encodeURIComponent(redirect)}`}
            style={{ color: "#C8A96E", textDecoration: "none", fontWeight: 600 }}
          >
            Sign up
          </Link>
        </p>
        <p style={{ textAlign: "center", marginTop: 16 }}>
          <Link
            href="/pricing"
            style={{
              fontSize: 13,
              color: "rgba(244,239,230,0.3)",
              fontFamily: "DM Sans, sans-serif",
              textDecoration: "none",
            }}
          >
            Back to pricing
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function AuthSignInPage() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen flex items-center justify-center"
          style={{ background: "#080C14" }}
        >
          <p
            style={{
              color: "rgba(244,239,230,0.5)",
              fontFamily: "DM Sans, sans-serif",
              fontSize: 14,
            }}
          >
            Loading…
          </p>
        </main>
      }
    >
      <AuthSignInInner />
    </Suspense>
  );
}
