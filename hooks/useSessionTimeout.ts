"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
const WARNING_BEFORE_MS = 2 * 60 * 1000;

export function useSessionTimeout(isAuthenticated: boolean) {
  const router = useRouter();
  const timeoutRef = useRef<number | undefined>(undefined);
  const warningRef = useRef<number | undefined>(undefined);
  const warningShownRef = useRef(false);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "same-origin",
        redirect: "manual",
      });
    } catch {
      /* still sign out locally */
    }
    await supabase.auth.signOut();
    try {
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
    router.replace("/?session=expired");
  }, [router]);

  const resetTimers = useCallback(() => {
    if (!isAuthenticated) return;

    window.clearTimeout(timeoutRef.current);
    window.clearTimeout(warningRef.current);
    warningShownRef.current = false;

    warningRef.current = window.setTimeout(() => {
      warningShownRef.current = true;
      window.dispatchEvent(new CustomEvent("session-warning"));
    }, INACTIVITY_LIMIT_MS - WARNING_BEFORE_MS);

    timeoutRef.current = window.setTimeout(() => {
      void signOut();
    }, INACTIVITY_LIMIT_MS);
  }, [isAuthenticated, signOut]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ] as const;

    const opts: AddEventListenerOptions = { passive: true };
    events.forEach((e) =>
      window.addEventListener(e, resetTimers, opts)
    );

    const handleManualReset = () => resetTimers();
    window.addEventListener("session-reset", handleManualReset);

    resetTimers();

    return () => {
      events.forEach((e) =>
        window.removeEventListener(e, resetTimers)
      );
      window.removeEventListener("session-reset", handleManualReset);
      window.clearTimeout(timeoutRef.current);
      window.clearTimeout(warningRef.current);
    };
  }, [isAuthenticated, resetTimers]);
}
