"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

function AuthSignInInner() {
  const { user, loading, openAuthModal } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/pricing";

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace(redirect);
      return;
    }
    openAuthModal();
  }, [loading, user, redirect, router, openAuthModal]);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "#F4EFE6" }}
    >
      <p
        className="font-mono text-sm mb-4"
        style={{ color: "#6B6159" }}
      >
        Sign in to continue
      </p>
      <Link
        href="/"
        className="text-sm underline"
        style={{ color: "#C8A96E", fontFamily: "var(--font-body), sans-serif" }}
      >
        Back to home
      </Link>
      <p
        className="text-center text-sm mt-8"
        style={{ color: "#6B6159", fontFamily: "var(--font-body), sans-serif" }}
      >
        Don&apos;t have an account?{" "}
        <Link
          href={`/auth/signup?redirect=${encodeURIComponent(redirect)}`}
          className="underline font-medium"
          style={{ color: "#C8A96E" }}
        >
          Sign up
        </Link>
      </p>
    </main>
  );
}

export default function AuthSignInPage() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen flex flex-col items-center justify-center px-6"
          style={{ background: "#F4EFE6" }}
        >
          <p className="font-mono text-sm" style={{ color: "#6B6159" }}>
            Loading…
          </p>
        </main>
      }
    >
      <AuthSignInInner />
    </Suspense>
  );
}
