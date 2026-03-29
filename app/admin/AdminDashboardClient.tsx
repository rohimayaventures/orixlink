"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import type { AdminDashboardPayload } from "@/lib/admin/dashboardData";
import { PAID_TIERS_FOR_ADMIN } from "@/lib/admin/tierCaps";

const OBS = "#080C14";
const GOLD = "#C8A96E";
const CREAM = "#F4EFE6";
const CARD = "#0D1117";
const CARD_BORDER = "rgba(200, 169, 110, 0.15)";

function trunc(s: string | null | undefined, n = 20) {
  if (!s) return "—";
  return s.length <= n ? s : `${s.slice(0, n)}…`;
}

function tierBadgeStyle(tier: string) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    free: {
      bg: "rgba(107, 114, 128, 0.22)",
      color: "#9CA3AF",
      border: "rgba(156,163,175,0.45)",
    },
    pro: {
      bg: "rgba(200,169,110,0.18)",
      color: GOLD,
      border: "rgba(200,169,110,0.45)",
    },
    family: {
      bg: "rgba(20, 184, 166, 0.18)",
      color: "#5EEAD4",
      border: "rgba(94,234,212,0.45)",
    },
    clinical: {
      bg: "rgba(192, 57, 43, 0.2)",
      color: "#F87171",
      border: "rgba(248,113,113,0.45)",
    },
    lifetime: {
      bg: "rgba(139, 92, 246, 0.2)",
      color: "#C4B5FD",
      border: "rgba(196,181,253,0.45)",
    },
  };
  return map[tier] ?? map.free;
}

function statusBadgeStyle(status: string) {
  const s = status.toLowerCase();
  if (s === "active")
    return { bg: "rgba(34,197,94,0.18)", color: "#4ADE80", border: "rgba(74,222,128,0.4)" };
  if (s === "cancelled" || s === "canceled")
    return { bg: "rgba(239,68,68,0.18)", color: "#F87171", border: "rgba(248,113,113,0.4)" };
  if (s === "past_due")
    return { bg: "rgba(245,158,11,0.2)", color: "#FBBF24", border: "rgba(251,191,36,0.45)" };
  if (s === "frozen")
    return { bg: "rgba(107,114,128,0.25)", color: "#9CA3AF", border: "rgba(156,163,175,0.4)" };
  return { bg: "rgba(107,114,128,0.2)", color: "#9CA3AF", border: "rgba(156,163,175,0.35)" };
}

const URGENCY_LABEL: Record<string, string> = {
  MONITOR_AT_HOME: "Tier 1 — Monitor at home",
  CONTACT_DOCTOR_TODAY: "Tier 2 — Contact doctor today",
  URGENT_CARE: "Tier 3 — Urgent care",
  EMERGENCY_DEPARTMENT_NOW: "Tier 4 — Emergency (ED now)",
  unknown: "Unknown / unset",
};

type Props = { data: AdminDashboardPayload };

export default function AdminDashboardClient({ data }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(data.usersQ);
  const [tierEditId, setTierEditId] = useState<string | null>(null);
  const [tierDraft, setTierDraft] = useState<string>("free");
  const [creditEditId, setCreditEditId] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState<number>(25);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setSearchInput(data.usersQ);
  }, [data.usersQ]);

  useEffect(() => {
    const t = setTimeout(() => {
      const q = searchInput.trim();
      if (q === (data.usersQ ?? "")) return;
      const sp = new URLSearchParams(searchParams.toString());
      if (q) sp.set("q", q);
      else sp.delete("q");
      sp.set("p", "1");
      router.replace(`/admin?${sp.toString()}`);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput, data.usersQ, router, searchParams]);

  const usersMaxPage = Math.max(1, Math.ceil(data.usersTotal / 25) || 1);
  const subsMaxPage = Math.max(1, Math.ceil(data.paidCount / 25) || 1);

  const langSorted = useMemo(
    () =>
      Object.entries(data.langCounts).sort((a, b) => b[1] - a[1]),
    [data.langCounts]
  );

  const urgSorted = useMemo(
    () =>
      Object.entries(data.urgCounts).sort((a, b) => b[1] - a[1]),
    [data.urgCounts]
  );

  const buildHref = useCallback(
    (next: { p?: number; sp?: number }) => {
      const sp = new URLSearchParams();
      if (data.usersQ) sp.set("q", data.usersQ);
      sp.set("p", String(next.p ?? data.usersPage));
      sp.set("sp", String(next.sp ?? data.subsPage));
      return `/admin?${sp.toString()}`;
    },
    [data.usersPage, data.subsPage, data.usersQ]
  );

  async function saveTier(userId: string) {
    setBusy(`tier-${userId}`);
    try {
      const res = await fetch("/api/admin/set-tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, tier: tierDraft }),
      });
      if (!res.ok) throw new Error();
      setTierEditId(null);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function saveCredits(userId: string) {
    setBusy(`cred-${userId}`);
    try {
      const res = await fetch("/api/admin/add-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount: creditAmount }),
      });
      if (!res.ok) throw new Error();
      setCreditEditId(null);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const card: CSSProperties = {
    background: CARD,
    border: `1px solid ${CARD_BORDER}`,
    borderRadius: 12,
    padding: 20,
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: OBS,
        color: CREAM,
        padding: "32px 24px 80px",
        fontFamily: "var(--font-body), DM Sans, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h1
          className="font-display"
          style={{
            fontSize: "2rem",
            fontWeight: 500,
            color: GOLD,
            marginBottom: 8,
          }}
        >
          Admin
        </h1>
        <p
          style={{
            fontSize: "0.9rem",
            color: "rgba(244,239,230,0.65)",
            marginBottom: 28,
          }}
        >
          OrixLink operations overview
        </p>

        {/* Overview */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 36,
          }}
        >
          {[
            {
              label: "Registered users",
              value: data.stats.registeredUsers,
            },
            {
              label: "Assessments today",
              value: data.stats.assessmentsToday,
            },
            {
              label: "Active Pro+ subscribers",
              value: data.stats.activePaidSubs,
            },
            {
              label: "Total assessments this month",
              value: data.stats.totalAssessmentsMonth,
            },
          ].map((m) => (
            <div key={m.label} style={card}>
              <p
                style={{
                  fontSize: "0.65rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(244,239,230,0.5)",
                  marginBottom: 10,
                  fontFamily: "var(--font-body), sans-serif",
                }}
              >
                {m.label}
              </p>
              <p
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  fontFamily: "var(--font-mono), DM Mono, monospace",
                  color: CREAM,
                }}
              >
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* Users table */}
        <section style={{ marginBottom: 40 }}>
          <h2
            className="font-display"
            style={{ fontSize: "1.35rem", color: GOLD, marginBottom: 16 }}
          >
            Users
          </h2>
          <div style={{ ...card, padding: 16 }}>
            <input
              type="search"
              placeholder="Search by email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                width: "100%",
                maxWidth: 360,
                marginBottom: 16,
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${CARD_BORDER}`,
                background: "rgba(13,17,23,0.8)",
                color: CREAM,
                fontFamily: "var(--font-body), sans-serif",
              }}
            />
            <div style={{ overflowX: "auto", maxHeight: 520, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "rgba(244,239,230,0.55)" }}>
                    <th style={{ padding: "10px 8px", fontWeight: 600 }}>User</th>
                    <th style={{ padding: "10px 8px", fontWeight: 600 }}>Tier</th>
                    <th style={{ padding: "10px 8px", fontWeight: 600 }}>Used / cap</th>
                    <th style={{ padding: "10px 8px", fontWeight: 600 }}>Credits</th>
                    <th style={{ padding: "10px 8px", fontWeight: 600 }}>Signed up</th>
                    <th style={{ padding: "10px 8px", fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => {
                    const tb = tierBadgeStyle(u.tier);
                    const cap = u.assessments_cap ?? "—";
                    return (
                      <tr
                        key={u.id}
                        style={{ borderTop: `1px solid ${CARD_BORDER}` }}
                      >
                        <td style={{ padding: "12px 8px", verticalAlign: "top" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: "rgba(200,169,110,0.2)",
                                border: `1px solid ${GOLD}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                color: GOLD,
                                fontFamily: "var(--font-mono), monospace",
                              }}
                            >
                              {(u.email ?? "?").slice(0, 2).toUpperCase()}
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--font-mono), monospace",
                                fontSize: "0.78rem",
                                wordBreak: "break-all",
                              }}
                            >
                              {u.email}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 8px", verticalAlign: "top" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 10px",
                              borderRadius: 100,
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              textTransform: "capitalize",
                              background: tb.bg,
                              color: tb.color,
                              border: `1px solid ${tb.border}`,
                            }}
                          >
                            {u.tier}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "12px 8px",
                            fontFamily: "var(--font-mono), monospace",
                            fontSize: "0.78rem",
                          }}
                        >
                          {u.assessments_used} / {cap}
                        </td>
                        <td
                          style={{
                            padding: "12px 8px",
                            fontFamily: "var(--font-mono), monospace",
                            fontSize: "0.78rem",
                          }}
                        >
                          {u.credits_total}
                        </td>
                        <td
                          style={{
                            padding: "12px 8px",
                            fontFamily: "var(--font-mono), monospace",
                            fontSize: "0.72rem",
                            color: "rgba(244,239,230,0.75)",
                          }}
                        >
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString()
                            : "—"}
                        </td>
                        <td style={{ padding: "12px 8px", verticalAlign: "top" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {tierEditId === u.id ? (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                                <select
                                  value={tierDraft}
                                  onChange={(e) => setTierDraft(e.target.value)}
                                  style={{
                                    padding: "6px 8px",
                                    borderRadius: 6,
                                    background: CARD,
                                    color: CREAM,
                                    border: `1px solid ${CARD_BORDER}`,
                                  }}
                                >
                                  {PAID_TIERS_FOR_ADMIN.map((t) => (
                                    <option key={t} value={t}>
                                      {t}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => saveTier(u.id)}
                                  disabled={busy === `tier-${u.id}`}
                                  style={btnGold}
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTierEditId(null)}
                                  style={btnGhost}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setTierEditId(u.id);
                                  setTierDraft(u.tier);
                                }}
                                style={btnGhost}
                              >
                                Edit tier
                              </button>
                            )}
                            {creditEditId === u.id ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                  {[25, 75, 150, 300].map((n) => (
                                    <button
                                      key={n}
                                      type="button"
                                      onClick={() => setCreditAmount(n)}
                                      style={{
                                        ...btnGhost,
                                        opacity: creditAmount === n ? 1 : 0.7,
                                        borderColor:
                                          creditAmount === n ? GOLD : CARD_BORDER,
                                      }}
                                    >
                                      {n}
                                    </button>
                                  ))}
                                </div>
                                <input
                                  type="number"
                                  min={1}
                                  value={creditAmount}
                                  onChange={(e) =>
                                    setCreditAmount(Number(e.target.value) || 0)
                                  }
                                  style={{
                                    maxWidth: 120,
                                    padding: "6px 8px",
                                    borderRadius: 6,
                                    background: CARD,
                                    color: CREAM,
                                    border: `1px solid ${CARD_BORDER}`,
                                    fontFamily: "var(--font-mono), monospace",
                                  }}
                                />
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button
                                    type="button"
                                    onClick={() => saveCredits(u.id)}
                                    disabled={busy === `cred-${u.id}`}
                                    style={btnGold}
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCreditEditId(null)}
                                    style={btnGhost}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setCreditEditId(u.id);
                                  setCreditAmount(25);
                                }}
                                style={btnGhost}
                              >
                                Add credits
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 16,
                fontSize: "0.8rem",
                color: "rgba(244,239,230,0.55)",
                fontFamily: "var(--font-mono), monospace",
              }}
            >
              <span>
                Page {data.usersPage} / {usersMaxPage} · {data.usersTotal} users
              </span>
              <div style={{ display: "flex", gap: 12 }}>
                <Link
                  href={buildHref({ p: Math.max(1, data.usersPage - 1) })}
                  style={{ color: GOLD, opacity: data.usersPage <= 1 ? 0.35 : 1, pointerEvents: data.usersPage <= 1 ? "none" : "auto" }}
                >
                  Prev
                </Link>
                <Link
                  href={buildHref({ p: Math.min(usersMaxPage, data.usersPage + 1) })}
                  style={{
                    color: GOLD,
                    opacity: data.usersPage >= usersMaxPage ? 0.35 : 1,
                    pointerEvents: data.usersPage >= usersMaxPage ? "none" : "auto",
                  }}
                >
                  Next
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Paid subscriptions */}
        <section style={{ marginBottom: 40 }}>
          <h2
            className="font-display"
            style={{ fontSize: "1.35rem", color: GOLD, marginBottom: 16 }}
          >
            Paid subscriptions
          </h2>
          <div style={{ ...card, padding: 16, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "rgba(244,239,230,0.55)" }}>
                  <th style={{ padding: "10px 8px" }}>Email</th>
                  <th style={{ padding: "10px 8px" }}>Tier</th>
                  <th style={{ padding: "10px 8px" }}>Status</th>
                  <th style={{ padding: "10px 8px" }}>Stripe sub ID</th>
                  <th style={{ padding: "10px 8px" }}>Stripe customer</th>
                  <th style={{ padding: "10px 8px" }}>Period end</th>
                  <th style={{ padding: "10px 8px" }}>Cancel at end</th>
                </tr>
              </thead>
              <tbody>
                {data.paidRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 16, color: "rgba(244,239,230,0.45)" }}>
                      No paid subscriptions.
                    </td>
                  </tr>
                ) : (
                  data.paidRows.map((r) => {
                    const tb = tierBadgeStyle(r.tier);
                    const sb = statusBadgeStyle(r.status);
                    return (
                      <tr key={r.user_id} style={{ borderTop: `1px solid ${CARD_BORDER}` }}>
                        <td style={{ padding: "12px 8px", fontFamily: "var(--font-mono), monospace", fontSize: "0.75rem" }}>
                          {r.email}
                        </td>
                        <td style={{ padding: "12px 8px" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: 100,
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              textTransform: "capitalize",
                              background: tb.bg,
                              color: tb.color,
                              border: `1px solid ${tb.border}`,
                            }}
                          >
                            {r.tier}
                          </span>
                        </td>
                        <td style={{ padding: "12px 8px" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: 100,
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              background: sb.bg,
                              color: sb.color,
                              border: `1px solid ${sb.border}`,
                            }}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 8px", fontFamily: "var(--font-mono), monospace", fontSize: "0.72rem" }}>
                          {trunc(r.stripe_subscription_id)}
                        </td>
                        <td style={{ padding: "12px 8px", fontFamily: "var(--font-mono), monospace", fontSize: "0.72rem" }}>
                          {trunc(r.stripe_customer_id)}
                        </td>
                        <td style={{ padding: "12px 8px", fontFamily: "var(--font-mono), monospace", fontSize: "0.72rem" }}>
                          {r.current_period_end
                            ? new Date(r.current_period_end).toLocaleString()
                            : "—"}
                        </td>
                        <td style={{ padding: "12px 8px" }}>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: 6,
                              fontSize: "0.7rem",
                              background: r.cancel_at_period_end
                                ? "rgba(245,158,11,0.2)"
                                : "rgba(107,114,128,0.2)",
                              color: r.cancel_at_period_end ? "#FBBF24" : "#9CA3AF",
                            }}
                          >
                            {r.cancel_at_period_end ? "Yes" : "No"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 16,
                fontSize: "0.8rem",
                fontFamily: "var(--font-mono), monospace",
                color: "rgba(244,239,230,0.55)",
              }}
            >
              <span>
                Page {data.subsPage} / {subsMaxPage} · {data.paidCount} rows
              </span>
              <div style={{ display: "flex", gap: 12 }}>
                <Link
                  href={buildHref({ sp: Math.max(1, data.subsPage - 1) })}
                  style={{
                    color: GOLD,
                    opacity: data.subsPage <= 1 ? 0.35 : 1,
                    pointerEvents: data.subsPage <= 1 ? "none" : "auto",
                  }}
                >
                  Prev
                </Link>
                <Link
                  href={buildHref({ sp: Math.min(subsMaxPage, data.subsPage + 1) })}
                  style={{
                    color: GOLD,
                    opacity: data.subsPage >= subsMaxPage ? 0.35 : 1,
                    pointerEvents: data.subsPage >= subsMaxPage ? "none" : "auto",
                  }}
                >
                  Next
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Usage stats */}
        <section style={{ marginBottom: 40 }}>
          <h2
            className="font-display"
            style={{ fontSize: "1.35rem", color: GOLD, marginBottom: 16 }}
          >
            Usage (this month)
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            <div style={card}>
              <p style={{ color: GOLD, fontSize: "0.8rem", marginBottom: 12 }}>
                Assessments by language
              </p>
              <table style={{ width: "100%", fontSize: "0.78rem" }}>
                <tbody>
                  {langSorted.length === 0 ? (
                    <tr>
                      <td style={{ color: "rgba(244,239,230,0.45)" }}>No sessions</td>
                    </tr>
                  ) : (
                    langSorted.map(([lang, c]) => (
                      <tr key={lang} style={{ borderTop: `1px solid ${CARD_BORDER}` }}>
                        <td style={{ padding: "8px 0", fontFamily: "var(--font-mono), monospace" }}>{lang}</td>
                        <td style={{ padding: "8px 0", textAlign: "right", fontFamily: "var(--font-mono), monospace" }}>{c}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div style={card}>
              <p style={{ color: GOLD, fontSize: "0.8rem", marginBottom: 12 }}>
                Urgency distribution
              </p>
              <table style={{ width: "100%", fontSize: "0.78rem" }}>
                <tbody>
                  {urgSorted.length === 0 ? (
                    <tr>
                      <td style={{ color: "rgba(244,239,230,0.45)" }}>No sessions</td>
                    </tr>
                  ) : (
                    urgSorted.map(([k, c]) => (
                      <tr key={k} style={{ borderTop: `1px solid ${CARD_BORDER}` }}>
                        <td style={{ padding: "8px 0" }}>{URGENCY_LABEL[k] ?? k}</td>
                        <td
                          style={{
                            padding: "8px 0",
                            textAlign: "right",
                            fontFamily: "var(--font-mono), monospace",
                          }}
                        >
                          {c}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div style={card}>
              <p style={{ color: GOLD, fontSize: "0.8rem", marginBottom: 12 }}>
                Top 10 users (assessments used)
              </p>
              <table style={{ width: "100%", fontSize: "0.78rem" }}>
                <tbody>
                  {data.topUsers.map((t, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${CARD_BORDER}` }}>
                      <td style={{ padding: "8px 0", fontFamily: "var(--font-mono), monospace", wordBreak: "break-all" }}>
                        {t.email}
                      </td>
                      <td
                        style={{
                          padding: "8px 0",
                          textAlign: "right",
                          fontFamily: "var(--font-mono), monospace",
                        }}
                      >
                        {t.assessments_used}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Credit history */}
        <section>
          <h2
            className="font-display"
            style={{ fontSize: "1.35rem", color: GOLD, marginBottom: 16 }}
          >
            Credit pack history (latest 50)
          </h2>
          <div style={{ ...card, padding: 16, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "rgba(244,239,230,0.55)" }}>
                  <th style={{ padding: "10px 8px" }}>Email</th>
                  <th style={{ padding: "10px 8px" }}>Pack</th>
                  <th style={{ padding: "10px 8px" }}>Purchased</th>
                  <th style={{ padding: "10px 8px" }}>Remaining</th>
                  <th style={{ padding: "10px 8px" }}>Purchased at</th>
                  <th style={{ padding: "10px 8px" }}>Frozen</th>
                </tr>
              </thead>
              <tbody>
                {data.creditHistory.map((c) => (
                  <tr key={c.id} style={{ borderTop: `1px solid ${CARD_BORDER}` }}>
                    <td style={{ padding: "12px 8px", fontFamily: "var(--font-mono), monospace", fontSize: "0.72rem" }}>
                      {c.email}
                    </td>
                    <td style={{ padding: "12px 8px" }}>{c.pack_name ?? "—"}</td>
                    <td style={{ padding: "12px 8px", fontFamily: "var(--font-mono), monospace" }}>
                      {c.credits_purchased}
                    </td>
                    <td style={{ padding: "12px 8px", fontFamily: "var(--font-mono), monospace" }}>
                      {c.credits_remaining}
                    </td>
                    <td style={{ padding: "12px 8px", fontFamily: "var(--font-mono), monospace", fontSize: "0.72rem" }}>
                      {c.purchased_at ? new Date(c.purchased_at).toLocaleString() : "—"}
                    </td>
                    <td style={{ padding: "12px 8px" }}>{c.frozen ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

const btnGold: CSSProperties = {
  padding: "6px 12px",
  borderRadius: 6,
  border: "none",
  background: GOLD,
  color: OBS,
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.75rem",
};

const btnGhost: CSSProperties = {
  padding: "6px 12px",
  borderRadius: 6,
  border: `1px solid ${CARD_BORDER}`,
  background: "transparent",
  color: CREAM,
  cursor: "pointer",
  fontSize: "0.75rem",
};
