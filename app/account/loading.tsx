import AppShell from "@/components/AppShell";
import { SkeletonBlock } from "@/components/SkeletonBlock";

export default function AccountLoading() {
  return (
    <AppShell contentTopPadding={96}>
      <div className="px-5 sm:px-8 pb-16" style={{ maxWidth: 560, margin: "0 auto" }}>
        <SkeletonBlock width="100px" height="14px" style={{ marginBottom: 8 }} />
        <SkeletonBlock width="180px" height="32px" style={{ marginBottom: "0.5rem" }} />
        <SkeletonBlock width="100%" height="20px" style={{ marginBottom: "2rem" }} />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="card-dark"
            style={{ padding: "24px", marginBottom: 16 }}
          >
            <SkeletonBlock width="72px" height="12px" style={{ marginBottom: 12 }} />
            <SkeletonBlock width="55%" height="26px" style={{ marginBottom: 8 }} />
            <SkeletonBlock width="100%" height="16px" />
          </div>
        ))}
      </div>
    </AppShell>
  );
}
