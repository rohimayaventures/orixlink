"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { FAMILY_MAX_MEMBERS } from "@/lib/family";
import {
  FAMILY_DAILY_LIMIT,
  type FamilyUsagePayload,
} from "@/lib/familyUsage";

export type FamilyMemberRow = {
  id: string;
  invited_email: string | null;
  status: string;
  joined_at: string | null;
  invited_at: string | null;
  invite_code: string;
};

type Props = {
  isFamily: boolean;
  isMemberNotOwner?: boolean;
  ownerInviteLabel?: string;
  memberMonthlyUsage?: number;
  memberPoolUsage?: FamilyUsagePayload | null;
  initialMembers: FamilyMemberRow[];
  initialShareCode: string | null;
  initialUsage: FamilyUsagePayload | null;
};

function seatCount(members: FamilyMemberRow[]): number {
  return members.filter(
    (m) =>
      (m.status === "pending" || m.status === "active") && m.invited_email
  ).length;
}

function memberRowLabel(
  email: string,
  displayName: string | null | undefined,
  max = 24
): string {
  const base = (displayName?.trim() || email || "—").trim();
  if (base.length <= max) return base;
  return `${base.slice(0, max)}…`;
}

function memberInitial(
  email: string,
  displayName: string | null | undefined
): string {
  const n = displayName?.trim();
  if (n) return n.charAt(0).toUpperCase();
  const e = email?.trim();
  if (e) return e.charAt(0).toUpperCase();
  return "?";
}

function statusBadge(status: string) {
  if (status === "pending") {
    return (
      <span
        className="font-mono text-[0.625rem] uppercase tracking-wider px-2.5 py-1 rounded-full"
        style={{
          border: "1px solid rgba(200,169,110,0.45)",
          color: "#C8A96E",
          background: "transparent",
        }}
      >
        Pending
      </span>
    );
  }
  if (status === "active") {
    return (
      <span
        className="font-mono text-[0.625rem] uppercase tracking-wider px-2.5 py-1 rounded-full"
        style={{
          border: "1px solid rgba(74,222,128,0.4)",
          color: "#86EFAC",
          background: "rgba(34,197,94,0.1)",
        }}
      >
        Active
      </span>
    );
  }
  return (
    <span
      className="font-mono text-[0.625rem] uppercase tracking-wider px-2.5 py-1 rounded-full"
      style={{ color: "rgba(244,239,230,0.35)" }}
    >
      Removed
    </span>
  );
}

export default function FamilyManageClient({
  isFamily,
  isMemberNotOwner = false,
  ownerInviteLabel = "Plan owner",
  memberMonthlyUsage = 0,
  memberPoolUsage = null,
  initialMembers,
  initialShareCode,
  initialUsage,
}: Props) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [usage, setUsage] = useState<FamilyUsagePayload | null>(initialUsage);
  const [shareCode, setShareCode] = useState(initialShareCode);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string } | null>(
    null
  );
  const [inviteLoading, setInviteLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const generateCodeAttempted = useRef(false);

  const listedMembers = useMemo(
    () => members.filter((m) => m.invited_email),
    [members]
  );

  const count = seatCount(members);
  const atCap = count >= FAMILY_MAX_MEMBERS;

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  useEffect(() => {
    setShareCode(initialShareCode);
  }, [initialShareCode]);

  useEffect(() => {
    setUsage(initialUsage);
  }, [initialUsage]);

  useEffect(() => {
    if (!isFamily || initialUsage != null) return;
    let cancelled = false;
    void fetch("/api/family/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: unknown) => {
        if (cancelled || !data || typeof data !== "object") return;
        const d = data as Record<string, unknown>;
        if (typeof d.totalUsed !== "number" || typeof d.cap !== "number")
          return;
        setUsage({
          totalUsed: d.totalUsed,
          cap: d.cap,
          resetDate: (d.resetDate as string | null) ?? null,
          creditsBalance: Number(d.creditsBalance) || 0,
          members: Array.isArray(d.members)
            ? (d.members as FamilyUsagePayload["members"])
            : [],
        });
      });
    return () => {
      cancelled = true;
    };
  }, [isFamily, initialUsage]);

  useEffect(() => {
    if (!isFamily) return;
    if (shareCode || initialShareCode) return;
    if (generateCodeAttempted.current) return;
    generateCodeAttempted.current = true;
    let cancelled = false;
    setCodeLoading(true);
    void (async () => {
      try {
        const res = await fetch("/api/family/generate-code", { method: "POST" });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.code) setShareCode(String(data.code).toUpperCase());
      } finally {
        if (!cancelled) setCodeLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isFamily, shareCode, initialShareCode]);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteMsg(null);
    if (atCap) return;
    setInviteLoading(true);
    try {
      const res = await fetch("/api/family/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const code = (data.inviteCode as string)?.toUpperCase() ?? shareCode;
        if (code) setShareCode(code);
        setInviteMsg({ ok: true, text: `Invite sent to ${inviteEmail.trim()}` });
        setInviteEmail("");
        router.refresh();
      } else {
        setInviteMsg({
          ok: false,
          text: (data.error as string) || "Invite failed",
        });
      }
    } finally {
      setInviteLoading(false);
    }
  }

  async function removeMember(id: string) {
    const res = await fetch("/api/family/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: id }),
    });
    if (res.ok) {
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "removed" } : m))
      );
    }
  }

  async function copyCode() {
    if (!shareCode) return;
    await navigator.clipboard.writeText(shareCode);
    setCopyDone(true);
    window.setTimeout(() => setCopyDone(false), 2000);
  }

  if (isMemberNotOwner) {
    const pool = memberPoolUsage;
    const poolPct =
      pool && pool.cap > 0
        ? Math.min(100, (pool.totalUsed / pool.cap) * 100)
        : 0;
    const poolHigh = poolPct > 80;
    const resetLabel =
      pool?.resetDate != null
        ? new Date(pool.resetDate).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : null;

    return (
      <AppShell contentTopPadding={96}>
        <div className="px-5 sm:px-8 pb-16 max-w-2xl mx-auto">
          <h1
            className="font-display mb-2"
            style={{ fontSize: "28px", color: "var(--text-on-dark)" }}
          >
            Family membership
          </h1>
          <p
            className="mb-6 flex flex-wrap items-center gap-2"
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: 14,
              color: "rgba(244,239,230,0.55)",
              lineHeight: 1.5,
            }}
          >
            <span>
              Invited by <strong style={{ color: "var(--text-on-dark)" }}>{ownerInviteLabel}</strong>
            </span>
            {statusBadge("active")}
          </p>

          <section className="mb-8">
            <h2
              className="font-mono text-xs uppercase tracking-widest mb-4"
              style={{ color: "var(--gold-muted)" }}
            >
              Your usage this month
            </h2>
            <div
              className="rounded-xl border p-5"
              style={{
                borderColor: "var(--obsidian-muted)",
                background: "var(--obsidian-mid)",
              }}
            >
              <p
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: 15,
                  color: "var(--text-on-dark)",
                  margin: 0,
                }}
              >
                {memberMonthlyUsage} assessment
                {memberMonthlyUsage === 1 ? "" : "s"} used
              </p>
            </div>
          </section>

          {pool ? (
            <section className="mb-10">
              <h2
                className="font-mono text-xs uppercase tracking-widest mb-4"
                style={{ color: "var(--gold-muted)" }}
              >
                Family pool this month
              </h2>
              <div
                className="rounded-xl border p-5"
                style={{
                  borderColor: "var(--obsidian-muted)",
                  background: "var(--obsidian-mid)",
                }}
              >
                <div
                  style={{
                    height: 8,
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.07)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${poolPct}%`,
                      borderRadius: 4,
                      background: poolHigh
                        ? "rgba(220,50,50,0.7)"
                        : "#C8A96E",
                      transition: "width 0.35s ease",
                    }}
                  />
                </div>
                <p
                  className="mt-3 mb-1"
                  style={{
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: 14,
                    color: "var(--text-on-dark)",
                  }}
                >
                  {pool.totalUsed} of {pool.cap} used this month
                </p>
                {resetLabel ? (
                  <p
                    style={{
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: 13,
                      color: "rgba(244,239,230,0.5)",
                      margin: 0,
                    }}
                  >
                    Resets {resetLabel}
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="mb-10">
            <h2
              className="font-mono text-xs uppercase tracking-widest mb-4"
              style={{ color: "var(--gold-muted)" }}
            >
              Your plan features
            </h2>
            <ul
              className="rounded-xl border p-5 space-y-3"
              style={{
                borderColor: "var(--obsidian-muted)",
                background: "var(--obsidian-mid)",
                listStyle: "none",
                margin: 0,
                padding: "1.25rem",
              }}
            >
              {[
                "Deep analysis",
                "Full history",
                "Reminders",
              ].map((label) => (
                <li
                  key={label}
                  style={{
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: 14,
                    color: "var(--text-on-dark)",
                  }}
                >
                  {label}
                </li>
              ))}
            </ul>
          </section>

          <p
            className="text-sm leading-relaxed"
            style={{
              color: "var(--text-muted-dark)",
              fontFamily: "var(--font-body), sans-serif",
            }}
          >
            To manage plan settings, contact the plan owner.
          </p>
        </div>
      </AppShell>
    );
  }

  if (!isFamily) {
    return (
      <AppShell contentTopPadding={96}>
        <div className="px-5 sm:px-8 pb-16 max-w-xl mx-auto">
          <h1
            className="font-display mb-2"
            style={{ fontSize: "28px", color: "var(--text-on-dark)" }}
          >
            Family plan
          </h1>
          <p
            className="mb-6"
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: 14,
              color: "rgba(244,239,230,0.55)",
              lineHeight: 1.5,
            }}
          >
            Share OrixLink with your household
          </p>
          <div
            className="card-dark p-8 rounded-xl border"
            style={{ borderColor: "var(--obsidian-muted)" }}
          >
            <p
              className="mb-4 leading-relaxed"
              style={{
                color: "var(--text-muted-dark)",
                fontFamily: "var(--font-body), sans-serif",
              }}
            >
              The Family plan includes up to 6 members, 600 assessments per month,
              separate history per profile, and shared billing—ideal for parents,
              partners, and dependents.
            </p>
            <Link href="/pricing" className="btn-gold inline-block text-center px-6 py-3 rounded-lg font-semibold">
              View Family pricing
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const poolPct =
    usage && usage.cap > 0
      ? Math.min(100, (usage.totalUsed / usage.cap) * 100)
      : 0;
  const poolHigh = poolPct > 80;
  const resetLabel =
    usage?.resetDate != null
      ? new Date(usage.resetDate).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : null;

  return (
    <AppShell contentTopPadding={96}>
      <div className="px-5 sm:px-8 pb-16 max-w-2xl mx-auto">
        <h1
          className="font-display mb-2"
          style={{ fontSize: "28px", color: "var(--text-on-dark)" }}
        >
          Family plan
        </h1>
        <p
          className="mb-8"
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: 14,
            color: "rgba(244,239,230,0.55)",
            lineHeight: 1.5,
          }}
        >
          Manage your family&apos;s OrixLink access
        </p>

        {usage && (
          <>
            <section className="mb-10">
              <h2
                className="font-mono text-xs uppercase tracking-widest mb-4"
                style={{ color: "var(--gold-muted)" }}
              >
                Family usage this month
              </h2>
              <div
                className="rounded-xl border p-5"
                style={{
                  borderColor: "var(--obsidian-muted)",
                  background: "var(--obsidian-mid)",
                }}
              >
                <div className="flex justify-between items-baseline gap-3 mb-2">
                  <span
                    style={{
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: 13,
                      color: "rgba(244,239,230,0.75)",
                    }}
                  >
                    Family pool
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.07)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${poolPct}%`,
                      borderRadius: 4,
                      background: poolHigh
                        ? "rgba(220,50,50,0.7)"
                        : "#C8A96E",
                      transition: "width 0.35s ease",
                    }}
                  />
                </div>
                <p
                  className="mt-3 mb-1"
                  style={{
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: 14,
                    color: "var(--text-on-dark)",
                  }}
                >
                  {usage.totalUsed} of {usage.cap} used this month
                </p>
                {resetLabel ? (
                  <p
                    style={{
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: 13,
                      color: "rgba(244,239,230,0.5)",
                      margin: 0,
                    }}
                  >
                    Resets {resetLabel}
                  </p>
                ) : null}
              </div>
            </section>

            <section className="mb-10">
              <h2
                className="font-mono text-xs uppercase tracking-widest mb-4"
                style={{ color: "var(--gold-muted)" }}
              >
                Per-member breakdown
              </h2>
              <div
                className="rounded-xl border overflow-hidden divide-y"
                style={{
                  borderColor: "rgba(255,255,255,0.06)",
                  background: "var(--obsidian-mid)",
                }}
              >
                {(() => {
                  const n = Math.max(1, usage.members.length);
                  const fairShare = usage.cap / n;
                  return usage.members.map((m) => {
                    const sharePct =
                      fairShare > 0
                        ? Math.min(100, (m.assessmentsUsed / fairShare) * 100)
                        : 0;
                    return (
                      <div
                        key={m.userId}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className="shrink-0 flex items-center justify-center font-semibold text-sm"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: "rgba(200,169,110,0.15)",
                              color: "#C8A96E",
                              fontFamily: "var(--font-body), sans-serif",
                            }}
                          >
                            {memberInitial(m.email, m.displayName)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className="truncate font-medium"
                                style={{
                                  color: "var(--text-on-dark)",
                                  maxWidth: "100%",
                                }}
                                title={
                                  m.displayName?.trim() || m.email || undefined
                                }
                              >
                                {memberRowLabel(m.email, m.displayName)}
                              </span>
                              {m.isOwner ? (
                                <span
                                  className="font-mono text-[0.625rem] uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
                                  style={{
                                    border: "1px solid rgba(200,169,110,0.35)",
                                    color: "#C8A96E",
                                  }}
                                >
                                  Owner
                                </span>
                              ) : null}
                            </div>
                            <p
                              className="mt-1 text-sm"
                              style={{
                                fontFamily: "DM Sans, sans-serif",
                                color: "rgba(244,239,230,0.55)",
                              }}
                            >
                              {m.assessmentsUsed} assessments
                            </p>
                            <p
                              className="mt-1 text-xs"
                              style={{
                                fontFamily: "DM Sans, sans-serif",
                                color: "rgba(200,169,110,0.85)",
                              }}
                            >
                              {m.dailyUsed} of {FAMILY_DAILY_LIMIT} used today
                            </p>
                          </div>
                        </div>
                        <div
                          className="w-full sm:w-40 shrink-0"
                          style={{
                            height: 6,
                            borderRadius: 4,
                            background: "rgba(255,255,255,0.07)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${sharePct}%`,
                              borderRadius: 4,
                              background: "#C8A96E",
                              transition: "width 0.35s ease",
                            }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </section>

            {usage.creditsBalance > 0 ? (
              <p
                className="mb-10"
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: 13,
                  color: "#C8A96E",
                  marginTop: -8,
                }}
              >
                {usage.creditsBalance} assessment credits available
              </p>
            ) : null}
          </>
        )}

        <p
          className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase mb-2"
          style={{ color: "var(--gold-muted)" }}
        >
          Members
        </p>
        <p
          className="mb-6"
          style={{
            color: "var(--text-muted-dark)",
            fontFamily: "var(--font-body), sans-serif",
            fontSize: 14,
          }}
        >
          {count} of {FAMILY_MAX_MEMBERS} seats
        </p>

        <section className="mb-10">
          <h2
            className="font-mono text-xs uppercase tracking-widest mb-4"
            style={{ color: "var(--gold-muted)" }}
          >
            Member list
          </h2>
          <div
            className="rounded-xl border overflow-hidden"
            style={{
              borderColor: "var(--obsidian-muted)",
              background: "var(--obsidian-mid)",
            }}
          >
            {listedMembers.length === 0 ? (
              <p
                className="p-6 text-sm"
                style={{
                  color: "var(--text-muted-dark)",
                  fontFamily: "var(--font-body), sans-serif",
                }}
              >
                No invites yet. Send an email invite or share your code below.
              </p>
            ) : (
              <ul className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                {listedMembers.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4"
                  >
                    <div>
                      <p style={{ color: "var(--text-on-dark)", fontWeight: 600 }}>
                        {m.invited_email}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {statusBadge(m.status)}
                        {m.status === "active" && m.joined_at && (
                          <span
                            className="text-xs"
                            style={{ color: "var(--text-muted-dark)" }}
                          >
                            Joined{" "}
                            {new Date(m.joined_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    {(m.status === "pending" || m.status === "active") && (
                      <button
                        type="button"
                        onClick={() => removeMember(m.id)}
                        className="text-sm font-medium self-start sm:self-center"
                        style={{
                          color: "rgba(248,113,113,0.85)",
                          fontFamily: "var(--font-body), sans-serif",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="mb-10">
          <h2
            className="font-mono text-xs uppercase tracking-widest mb-4"
            style={{ color: "var(--gold-muted)" }}
          >
            Invite by email
          </h2>
          <form onSubmit={sendInvite} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={atCap || inviteLoading}
              placeholder="family@example.com"
              className="flex-1 rounded-lg px-4 py-3 border text-[var(--text-on-dark)]"
              style={{
                background: "#141824",
                borderColor: "rgba(255,255,255,0.1)",
                fontFamily: "var(--font-body), sans-serif",
              }}
            />
            <button
              type="submit"
              disabled={atCap || inviteLoading}
              className="btn-gold px-6 py-3 rounded-lg font-semibold disabled:opacity-40"
              style={{ color: "var(--obsidian)" }}
            >
              {inviteLoading ? "Sending…" : "Send invite"}
            </button>
          </form>
          {inviteMsg && (
            <p
              aria-live="polite"
              className="mt-3 text-sm"
              style={{
                color: inviteMsg.ok ? "#86EFAC" : "#FCA5A5",
                fontFamily: "var(--font-body), sans-serif",
              }}
            >
              {inviteMsg.text}
            </p>
          )}
        </section>

        <section>
          <h2
            className="font-mono text-xs uppercase tracking-widest mb-4"
            style={{ color: "var(--gold-muted)" }}
          >
            Shareable invite code
          </h2>
          {shareCode ? (
            <>
              <div
                className="mb-3 flex flex-col sm:flex-row sm:items-center gap-3"
                style={{
                  background: "rgba(200,169,110,0.06)",
                  border: "1px solid rgba(200,169,110,0.2)",
                  borderRadius: 8,
                  padding: "12px 16px",
                }}
              >
                <span
                  className="font-mono text-lg tracking-widest"
                  style={{ color: "#C8A96E", letterSpacing: "0.12em" }}
                >
                  {shareCode}
                </span>
                <button
                  type="button"
                  onClick={() => void copyCode()}
                  className="text-sm font-semibold px-4 py-2 rounded-lg border shrink-0"
                  style={{
                    borderColor: "rgba(200,169,110,0.35)",
                    color: "#C8A96E",
                    background: "transparent",
                    fontFamily: "var(--font-body), sans-serif",
                  }}
                >
                  {copyDone ? "Copied" : "Copy code"}
                </button>
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{
                  color: "var(--text-muted-dark)",
                  fontFamily: "var(--font-body), sans-serif",
                }}
              >
                Share this code with family members. They enter it when signing up or in
                their account settings.
              </p>
            </>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-muted-dark)" }}>
              {codeLoading ? "Generating your code…" : "Preparing invite code…"}
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
