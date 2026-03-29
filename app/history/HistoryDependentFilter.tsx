"use client";

import { useRouter } from "next/navigation";

type Dep = { id: string; display_name: string };

export default function HistoryDependentFilter({
  dependents,
  value,
}: {
  dependents: Dep[];
  value: string;
}) {
  const router = useRouter();

  return (
    <div style={{ marginBottom: 20 }}>
      <label
        htmlFor="history-dependent-filter"
        style={{
          display: "block",
          fontSize: 11,
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--gold-muted)",
          marginBottom: 8,
        }}
      >
        Showing
      </label>
      <select
        id="history-dependent-filter"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "all") {
            router.push("/history");
          } else {
            router.push(`/history?dependent=${encodeURIComponent(v)}`);
          }
        }}
        style={{
          width: "100%",
          maxWidth: 360,
          padding: "10px 14px",
          background: "#141824",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          color: "#F4EFE6",
          fontFamily: "var(--font-body), sans-serif",
          fontSize: "0.9375rem",
          cursor: "pointer",
        }}
      >
        <option value="all">All</option>
        {dependents.map((d) => (
          <option key={d.id} value={d.id}>
            {d.display_name}&apos;s assessments
          </option>
        ))}
        <option value="mine">My assessments only</option>
      </select>
    </div>
  );
}
