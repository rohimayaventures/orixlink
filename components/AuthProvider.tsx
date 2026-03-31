"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import type { User, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  clearAnonSessionData,
  getAnonSessionData,
} from "@/lib/anonSession";
import AuthModal from "@/components/AuthModal";
import { SessionWarningBanner } from "@/components/SessionWarningBanner";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  supabase: SupabaseClient | null;
  openAuthModal: (reason?: "anonymous_cap") => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  refreshUser: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}

function SessionTimeoutShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  useSessionTimeout(Boolean(user) && !loading);
  return (
    <>
      {children}
      <SessionWarningBanner />
    </>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const client = createClient();
    setSupabase(client);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    setUser(data.user ?? null);
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    refreshUser().finally(() => setLoading(false));
  }, [supabase, refreshUser]);

  useEffect(() => {
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (event !== "SIGNED_IN" || !session?.user) return;

      const last = getAnonSessionData();
      if (last) {
        try {
          const res = await fetch("/api/migrate-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionData: last,
              userId: session.user.id,
            }),
          });
          if (res.ok) {
            clearAnonSessionData();
          }
        } catch (e) {
          console.error("migrate-session", e);
        }
      }

      try {
        await fetch("/api/auth/bootstrap", { method: "POST" });
      } catch (e) {
        console.error("bootstrap", e);
      }

      setAuthModalOpen(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const openAuthModal = useCallback(
    (reason?: "anonymous_cap") => {
      if (pathname?.startsWith("/auth")) return;
      if (reason !== "anonymous_cap") return;
      setAuthModalOpen(true);
    },
    [pathname]
  );
  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  const value = useMemo(
    () => ({
      user,
      loading,
      supabase,
      openAuthModal,
      closeAuthModal,
      authModalOpen,
      refreshUser,
    }),
    [
      user,
      loading,
      supabase,
      openAuthModal,
      closeAuthModal,
      authModalOpen,
      refreshUser,
    ]
  );

  return (
    <Ctx.Provider value={value}>
      <SessionTimeoutShell>{children}</SessionTimeoutShell>
      {supabase && (
        <AuthModal
          open={authModalOpen}
          onClose={closeAuthModal}
          supabaseClient={supabase}
        />
      )}
    </Ctx.Provider>
  );
}
