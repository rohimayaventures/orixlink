"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Cross2Icon } from "@radix-ui/react-icons";
import AppShell from "@/components/AppShell";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import {
  DEPENDENT_AGE_RANGES,
  dependentCapForTier,
  type DependentRow,
} from "@/lib/dependents";

type Props = {
  user: User;
  profile: { full_name: string | null } | null;
  subscription: {
    tier: string;
    status: string;
    is_lifetime: boolean;
    stripe_customer_id: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
  } | null;
  usage: {
    assessments_used: number;
    assessments_cap: number;
    period_month: string;
  };
  creditSum: number;
  frozenCreditsSum: number;
  /** Count from billing portal return_url when user had unfrozen credits before opening portal. */
  portalCreditsFrozenHint: number | null;
  joinFamilyInitialCode: string | null;
  initialDependents: DependentRow[];
};

export default function AccountClient({
  user,
  profile,
  subscription,
  usage,
  creditSum,
  frozenCreditsSum,
  portalCreditsFrozenHint,
  joinFamilyInitialCode,
  initialDependents,
}: Props) {
  const router = useRouter();
  const [portalLoading, setPortalLoading] = useState(false);
  const [accountUiReady, setAccountUiReady] = useState(false);
  const [portalFrozenBannerDismissed, setPortalFrozenBannerDismissed] =
    useState(false);
  const [joinCode, setJoinCode] = useState(() => joinFamilyInitialCode ?? "");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMessage, setJoinMessage] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);
  const tier = subscription?.tier ?? "free";

  const [dependents, setDependents] = useState<DependentRow[]>(initialDependents);
  const [depFormOpen, setDepFormOpen] = useState(false);
  const [editingDependentId, setEditingDependentId] = useState<string | null>(
    null
  );
  const [depDisplayName, setDepDisplayName] = useState("");
  const [depAgeRange, setDepAgeRange] = useState("");
  const [depConditions, setDepConditions] = useState("");
  const [depSaving, setDepSaving] = useState(false);
  const [depFormError, setDepFormError] = useState<string | null>(null);

  const subStatusNorm = (subscription?.status ?? "").toLowerCase();
  const showDependentsSection =
    (tier === "pro" || tier === "family") &&
    (subStatusNorm === "active" || subStatusNorm === "trialing");
  const dependentCap = dependentCapForTier(tier);

  useEffect(() => {
    setDependents(initialDependents);
  }, [initialDependents]);
  const showFrozenCreditsNotice =
    (subStatusNorm === "canceled" ||
      subStatusNorm === "cancelled" ||
      subStatusNorm === "past_due") &&
    frozenCreditsSum > 0;

  const showPortalFrozenBanner =
    portalCreditsFrozenHint != null &&
    portalCreditsFrozenHint > 0 &&
    !portalFrozenBannerDismissed;

  useEffect(() => {
    setAccountUiReady(true);
  }, []);

  useEffect(() => {
    setJoinCode(joinFamilyInitialCode ?? "");
  }, [joinFamilyInitialCode]);

  const depFieldStyle: CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    background: "#141824",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    color: "#F4EFE6",
    fontFamily: "var(--font-body), sans-serif",
    fontSize: "0.9375rem",
    boxSizing: "border-box",
  };

  function truncateConditions(s: string | null, max = 60) {
    if (!s) return null;
    const t = s.trim();
    if (!t) return null;
    return t.length > max ? `${t.slice(0, max)}…` : t;
  }

  function openAddDependent() {
    setEditingDependentId(null);
    setDepDisplayName("");
    setDepAgeRange("");
    setDepConditions("");
    setDepFormError(null);
    setDepFormOpen(true);
  }

  function openEditDependent(d: DependentRow) {
    setEditingDependentId(d.id);
    setDepDisplayName(d.display_name);
    setDepAgeRange(d.age_range ?? "");
    setDepConditions(d.relevant_conditions ?? "");
    setDepFormError(null);
    setDepFormOpen(true);
  }

  function closeDepForm() {
    setDepFormOpen(false);
    setEditingDependentId(null);
    setDepFormError(null);
  }

  async function saveDependent() {
    const name = depDisplayName.trim();
    if (!name) {
      setDepFormError("Display name is required");
      return;
    }
    setDepSaving(true);
    setDepFormError(null);
    try {
      const payload = {
        display_name: name,
        age_range: depAgeRange.trim() || null,
        relevant_conditions: depConditions.trim() || null,
      };
      if (editingDependentId) {
        const res = await fetch(`/api/dependents/${editingDependentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setDepFormError((data.error as string) || "Could not update");
          return;
        }
      } else {
        const res = await fetch("/api/dependents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setDepFormError((data.error as string) || "Could not create");
          return;
        }
      }
      closeDepForm();
      router.refresh();
    } finally {
      setDepSaving(false);
    }
  }

  async function deleteDependent(id: string) {
    if (!window.confirm("Remove this dependent profile?")) return;
    const res = await fetch(`/api/dependents/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      window.alert((data.error as string) || "Could not delete");
      return;
    }
    router.refresh();
  }

  const used = usage.assessments_used;
  const cap = usage.assessments_cap;

  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const isLifetimeNoEnd =
    (subscription?.is_lifetime || subscription?.tier === "lifetime") &&
    subscription?.current_period_end == null;

  const billingLines = (() => {
    if (isLifetimeNoEnd) {
      return { kind: "lifetime" as const };
    }
    const start = subscription?.current_period_start;
    const end = subscription?.current_period_end;
    if (start && end) {
      return {
        kind: "period" as const,
        current: `Current period: ${dateFmt(start)} -- ${dateFmt(end)}`,
        renews: `Renews: ${dateFmt(end)}`,
      };
    }
    if (end) {
      return { kind: "renewsOnly" as const, renews: `Renews: ${dateFmt(end)}` };
    }
    const [y, m] = (usage.period_month ?? "").split("-").map(Number);
    if (!y || !m) {
      return { kind: "fallback" as const, renews: "Renews: —" };
    }
    const d = new Date(y, m, 1);
    return {
      kind: "fallback" as const,
      renews: `Renews: ${d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })}`,
    };
  })();

  async function submitJoinFamily() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setJoinLoading(true);
    setJoinMessage(null);
    try {
      const res = await fetch("/api/family/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setJoinMessage({
          kind: "ok",
          text: "You have joined the family plan. Your account has been updated.",
        });
        router.refresh();
        router.replace("/account");
      } else {
        setJoinMessage({
          kind: "err",
          text: (data.error as string) || "Could not join family plan.",
        });
      }
    } finally {
      setJoinLoading(false);
    }
  }

  async function openBillingPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing-portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setPortalLoading(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth/signout", {
      method: "POST",
      credentials: "same-origin",
      redirect: "manual",
    });
    router.refresh();
    window.location.href = "/";
  }

  if (!accountUiReady) {
    return (
      <AppShell contentTopPadding={96}>
        <div className="px-5 sm:px-8 pb-16" style={{ maxWidth: 560, margin: "0 auto" }}>
          <SkeletonBlock width="100px" height="14px" style={{ marginBottom: 8 }} />
          <SkeletonBlock width="180px" height="32px" style={{ marginBottom: "0.5rem" }} />
          <SkeletonBlock width="100%" height="20px" style={{ marginBottom: "2rem" }} />
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-dark" style={{ padding: "24px", marginBottom: 16 }}>
              <SkeletonBlock width="72px" height="12px" style={{ marginBottom: 12 }} />
              <SkeletonBlock width="55%" height="26px" style={{ marginBottom: 8 }} />
              <SkeletonBlock width="100%" height="16px" />
            </div>
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell contentTopPadding={96}>
      <div className="px-5 sm:px-8 pb-16" style={{ maxWidth: 560, margin: "0 auto" }}>
        {joinFamilyInitialCode && (
          <div
            style={{
              padding: "14px 16px",
              marginBottom: 16,
              borderRadius: 10,
              background: "rgba(200,169,110,0.08)",
              border: "1px solid rgba(200,169,110,0.2)",
            }}
          >
            <p
              style={{
                margin: "0 0 12px",
                fontFamily: "var(--font-body), sans-serif",
                fontSize: 13,
                lineHeight: 1.45,
                color: "rgba(244,239,230,0.75)",
              }}
            >
              You have been invited to join a family plan. Enter your invite code to join.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Invite code"
                className="flex-1 rounded-lg px-3 py-2 border text-sm"
                style={{
                  background: "#141824",
                  borderColor: "rgba(255,255,255,0.12)",
                  color: "var(--text-on-dark)",
                  fontFamily: "var(--font-mono), monospace",
                  letterSpacing: "0.08em",
                }}
              />
              <button
                type="button"
                disabled={joinLoading || !joinCode.trim()}
                onClick={() => void submitJoinFamily()}
                className="btn-gold px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
                style={{ color: "var(--obsidian)" }}
              >
                {joinLoading ? "Joining…" : "Join family"}
              </button>
            </div>
            {joinMessage && (
              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: 13,
                  fontFamily: "var(--font-body), sans-serif",
                  color: joinMessage.kind === "ok" ? "#86EFAC" : "#FCA5A5",
                }}
              >
                {joinMessage.text}
              </p>
            )}
          </div>
        )}
        {showPortalFrozenBanner && (
          <div
            role="status"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "12px 14px",
              marginBottom: 16,
              borderRadius: 10,
              background: "rgba(200,169,110,0.08)",
              border: "1px solid rgba(200,169,110,0.2)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-body), sans-serif",
                fontSize: 13,
                lineHeight: 1.45,
                color: "rgba(244,239,230,0.7)",
                flex: 1,
              }}
            >
              Your {portalCreditsFrozenHint} unused credits are frozen. They will be
              waiting when you return.
            </p>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => {
                setPortalFrozenBannerDismissed(true);
                router.replace("/account");
              }}
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                border: "none",
                borderRadius: 8,
                background: "rgba(200,169,110,0.12)",
                color: "#C8A96E",
                cursor: "pointer",
              }}
            >
              <Cross2Icon style={{ width: 16, height: 16 }} />
            </button>
          </div>
        )}
        <p
          className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase mb-2"
          style={{ color: "var(--gold-muted)" }}
        >
          Your profile
        </p>
        <h1
          className="font-display"
          style={{
            fontSize: "2rem",
            color: "var(--text-on-dark)",
            marginBottom: "0.5rem",
          }}
        >
          Account
        </h1>
        <p style={{ color: "var(--text-muted-dark)", marginBottom: "2rem" }}>
          {profile?.full_name || "—"} · {user.email}
        </p>

        <div className="card-dark" style={{ padding: "24px", marginBottom: 16 }}>
          <p
            style={{
              fontSize: "0.6875rem",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--gold-muted)",
              marginBottom: 8,
            }}
          >
            Plan
          </p>
          <p
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "var(--text-on-dark)",
              textTransform: "capitalize",
            }}
          >
            {tier}
            {subscription?.is_lifetime ? " · Lifetime" : ""}
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted-dark)" }}>
            Status: {subscription?.status ?? "—"}
          </p>
        </div>

        <div className="card-dark" style={{ padding: "24px", marginBottom: 16 }}>
          <p
            style={{
              fontSize: "0.6875rem",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--gold-muted)",
              marginBottom: 8,
            }}
          >
            Assessments this month
          </p>
          <p
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "var(--text-on-dark)",
            }}
          >
            {used} / {cap} used
          </p>
          {billingLines.kind === "lifetime" ? (
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted-dark)" }}>
              Lifetime access -- never expires
            </p>
          ) : billingLines.kind === "period" ? (
            <>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted-dark)" }}>
                {billingLines.current}
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted-dark)" }}>
                {billingLines.renews}
              </p>
            </>
          ) : (
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted-dark)" }}>
              {billingLines.renews}
            </p>
          )}
        </div>

        <div className="card-dark" style={{ padding: "24px", marginBottom: 24 }}>
          <p
            style={{
              fontSize: "0.6875rem",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--gold-muted)",
              marginBottom: 8,
            }}
          >
            Credits balance
          </p>
          <p
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "var(--text-on-dark)",
            }}
          >
            {creditSum}
          </p>
          {showFrozenCreditsNotice && (
            <p
              style={{
                fontFamily: "var(--font-body), sans-serif",
                fontSize: "12px",
                color: "rgba(244,239,230,0.4)",
                marginTop: "8px",
                marginBottom: 0,
                lineHeight: 1.5,
              }}
            >
              You have {frozenCreditsSum} frozen credits. They will restore when you
              reactivate your subscription.
            </p>
          )}
        </div>

        {showDependentsSection && (
          <div className="card-dark" style={{ padding: "24px", marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <p
                style={{
                  fontSize: "0.6875rem",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--gold-muted)",
                  margin: 0,
                }}
              >
                Dependent profiles
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--font-body), sans-serif",
                  fontSize: 13,
                  color: "rgba(244,239,230,0.55)",
                }}
              >
                {dependents.length} of {dependentCap} profiles
              </p>
            </div>

            {dependents.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                {dependents.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      padding: "16px 18px",
                      borderRadius: 10,
                      background: "#141824",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <p
                      className="font-display"
                      style={{
                        margin: "0 0 6px",
                        fontSize: "1.125rem",
                        fontWeight: 600,
                        color: "var(--text-on-dark)",
                      }}
                    >
                      {d.display_name}
                    </p>
                    {d.age_range ? (
                      <p
                        style={{
                          margin: "0 0 4px",
                          fontFamily: "var(--font-body), sans-serif",
                          fontSize: 12,
                          color: "rgba(244,239,230,0.5)",
                        }}
                      >
                        {d.age_range}
                      </p>
                    ) : null}
                    {truncateConditions(d.relevant_conditions) ? (
                      <p
                        style={{
                          margin: "0 0 10px",
                          fontFamily: "var(--font-body), sans-serif",
                          fontSize: 12,
                          color: "rgba(244,239,230,0.5)",
                          lineHeight: 1.45,
                        }}
                      >
                        {truncateConditions(d.relevant_conditions)}
                      </p>
                    ) : null}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => openEditDependent(d)}
                        className="btn-ghost-gold"
                        style={{ padding: "6px 14px", fontSize: 13, borderRadius: 8 }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteDependent(d.id)}
                        className="btn-ghost-gold"
                        style={{
                          padding: "6px 14px",
                          fontSize: 13,
                          borderRadius: 8,
                          borderColor: "rgba(248,113,113,0.35)",
                          color: "#FCA5A5",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!depFormOpen ? (
              <button
                type="button"
                className="btn-gold"
                style={{
                  width: "100%",
                  color: "var(--obsidian)",
                  opacity: dependents.length >= dependentCap ? 0.45 : 1,
                }}
                disabled={dependents.length >= dependentCap}
                onClick={openAddDependent}
              >
                Add dependent
              </button>
            ) : null}

            {depFormOpen && (
              <div
                style={{
                  marginTop: dependents.length > 0 ? 16 : 0,
                  paddingTop: 16,
                  borderTop:
                    dependents.length > 0
                      ? "1px solid rgba(255,255,255,0.08)"
                      : "none",
                }}
              >
                <p
                  style={{
                    margin: "0 0 14px",
                    fontFamily: "var(--font-body), sans-serif",
                    fontSize: 14,
                    color: "rgba(244,239,230,0.75)",
                  }}
                >
                  {editingDependentId ? "Edit dependent" : "New dependent"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label
                      htmlFor="dep-display-name"
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--gold-muted)",
                        marginBottom: 6,
                      }}
                    >
                      Display name
                    </label>
                    <input
                      id="dep-display-name"
                      type="text"
                      value={depDisplayName}
                      onChange={(e) => setDepDisplayName(e.target.value)}
                      style={depFieldStyle}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="dep-age"
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--gold-muted)",
                        marginBottom: 6,
                      }}
                    >
                      Age range (optional)
                    </label>
                    <select
                      id="dep-age"
                      value={depAgeRange}
                      onChange={(e) => setDepAgeRange(e.target.value)}
                      style={{ ...depFieldStyle, cursor: "pointer" }}
                    >
                      <option value="">—</option>
                      {DEPENDENT_AGE_RANGES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="dep-conditions"
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--gold-muted)",
                        marginBottom: 6,
                      }}
                    >
                      Relevant conditions (optional)
                    </label>
                    <textarea
                      id="dep-conditions"
                      value={depConditions}
                      onChange={(e) => setDepConditions(e.target.value)}
                      placeholder="e.g. asthma, diabetes, heart condition"
                      rows={3}
                      style={{ ...depFieldStyle, resize: "vertical", lineHeight: 1.55 }}
                    />
                  </div>
                </div>
                {depFormError ? (
                  <p style={{ margin: "12px 0 0", fontSize: 13, color: "#FCA5A5" }}>
                    {depFormError}
                  </p>
                ) : null}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
                  <button
                    type="button"
                    className="btn-gold"
                    style={{ flex: "1 1 120px", color: "var(--obsidian)" }}
                    disabled={depSaving}
                    onClick={() => void saveDependent()}
                  >
                    {depSaving ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost-gold"
                    style={{ flex: "1 1 120px", borderRadius: 8 }}
                    disabled={depSaving}
                    onClick={closeDepForm}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {subscription?.stripe_customer_id && (
          <button
            type="button"
            className="btn-gold"
            style={{ width: "100%", marginBottom: 12 }}
            disabled={portalLoading}
            onClick={openBillingPortal}
          >
            {portalLoading ? "Opening…" : "Manage billing"}
          </button>
        )}

        <div style={{ marginBottom: 20 }}>
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: 13,
              color: "rgba(244,239,230,0.65)",
              margin: "0 0 8px",
            }}
          >
            Delete account
          </p>
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: 12,
              color: "rgba(244,239,230,0.45)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            To permanently delete your account and all associated data, email{" "}
            <a
              href="mailto:support@rohimaya.ai?subject=Delete%20my%20account"
              style={{ color: "#C8A96E", textDecoration: "underline" }}
            >
              support@rohimaya.ai
            </a>{" "}
            with the subject line &apos;Delete my account&apos;. Deletion is processed
            within 30 days.
          </p>
        </div>

        <button
          type="button"
          className="btn-ghost-gold"
          style={{ width: "100%" }}
          onClick={signOut}
        >
          Sign out
        </button>
      </div>
    </AppShell>
  );
}
