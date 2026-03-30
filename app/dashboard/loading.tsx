import AppShell from "@/components/AppShell";
import { SkeletonBlock } from "@/components/SkeletonBlock";

export default function DashboardLoading() {
  return (
    <AppShell contentTopPadding={96}>
      <div className="px-5 sm:px-8 pb-20" style={{ maxWidth: 640, margin: "0 auto" }}>
        <SkeletonBlock width="72px" height="14px" style={{ marginBottom: 8 }} />
        <SkeletonBlock width="220px" height="40px" style={{ marginBottom: 24 }} />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: "#0D1220",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12,
              padding: "1.25rem",
              marginBottom: 20,
            }}
          >
            <SkeletonBlock width="55%" height="18px" style={{ marginBottom: 12 }} />
            <SkeletonBlock width="100%" height="10px" style={{ marginBottom: 8 }} />
            <SkeletonBlock width="90%" height="10px" style={{ marginBottom: 16 }} />
            <SkeletonBlock width="40%" height="14px" />
          </div>
        ))}
      </div>
    </AppShell>
  );
}
