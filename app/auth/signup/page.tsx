"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

function AuthSignUpInner() {
  const { user, loading, openAuthModal } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/assessment";

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
        Create your account
      </p>
      <Link
        href="/"
        className="text-sm underline"
        style={{ color: "#C8A96E", fontFamily: "var(--font-body), sans-serif" }}
      >
        Back to home
      </Link>
    </main>
  );
}

export default function AuthSignUpPage() {
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
      <AuthSignUpInner />
    </Suspense>
  );
}
