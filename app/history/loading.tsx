import AppShell from "@/components/AppShell";
import { SkeletonBlock } from "@/components/SkeletonBlock";

export default function HistoryLoading() {
  return (
    <AppShell contentTopPadding={96}>
      <div className="px-5 sm:px-8 pb-16" style={{ maxWidth: 720, margin: "0 auto" }}>
        <SkeletonBlock width="140px" height="14px" style={{ marginBottom: 8 }} />
        <SkeletonBlock width="120px" height="36px" style={{ marginBottom: 8 }} />
        <SkeletonBlock width="90%" height="18px" style={{ marginBottom: 24 }} />
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <li
              key={i}
              style={{
                padding: "1rem 1.25rem",
                marginBottom: 10,
                background: "#0D1220",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                minHeight: 88,
              }}
            >
              <div style={{ flex: 1, minWidth: 200 }}>
                <SkeletonBlock width="72px" height="22px" borderRadius="100px" style={{ marginBottom: 8 }} />
                <SkeletonBlock width="180px" height="12px" style={{ marginBottom: 8 }} />
                <SkeletonBlock width="85%" height="16px" />
              </div>
              <SkeletonBlock width="72px" height="36px" borderRadius="8px" />
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
