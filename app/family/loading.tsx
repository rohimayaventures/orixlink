import AppShell from "@/components/AppShell";
import { SkeletonBlock } from "@/components/SkeletonBlock";

export default function FamilyLoading() {
  return (
    <AppShell contentTopPadding={96}>
      <div className="px-5 sm:px-8 pb-16 max-w-2xl mx-auto">
        <SkeletonBlock width="200px" height="32px" style={{ marginBottom: 12 }} />
        <SkeletonBlock width="85%" height="16px" style={{ marginBottom: 32 }} />
        <SkeletonBlock
          width="160px"
          height="12px"
          style={{ marginBottom: 16 }}
        />
        <div
          className="rounded-xl border p-5 mb-10"
          style={{
            borderColor: "var(--obsidian-muted)",
            background: "var(--obsidian-mid)",
          }}
        >
          <SkeletonBlock width="100%" height="8px" style={{ marginBottom: 16 }} />
          <SkeletonBlock width="50%" height="16px" />
        </div>
        <SkeletonBlock width="120px" height="12px" style={{ marginBottom: 16 }} />
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            borderColor: "var(--obsidian-muted)",
            background: "var(--obsidian-mid)",
            minHeight: 120,
            padding: "1.25rem",
          }}
        >
          <SkeletonBlock width="70%" height="14px" style={{ marginBottom: 12 }} />
          <SkeletonBlock width="90%" height="14px" />
        </div>
      </div>
    </AppShell>
  );
}
