import { SkeletonBlock } from "@/components/SkeletonBlock";

const BG = "#080C14";

export default function AssessmentSessionLoading() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: BG,
        color: "#F4EFE6",
        padding: "88px 20px 48px",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      <SkeletonBlock width="140px" height="16px" style={{ marginBottom: 20 }} />
      <div
        style={{
          padding: "1rem 1.25rem",
          borderRadius: 12,
          background: "#0D1220",
          border: "1px solid rgba(255,255,255,0.07)",
          marginBottom: 20,
        }}
      >
        <SkeletonBlock width="100px" height="28px" borderRadius="100px" style={{ marginBottom: 12 }} />
        <SkeletonBlock width="70%" height="14px" />
      </div>
      <SkeletonBlock width="100px" height="18px" style={{ marginBottom: 16 }} />
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <SkeletonBlock width="75%" height="48px" borderRadius="16px 16px 4px 16px" />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
          <SkeletonBlock width="80%" height="56px" borderRadius="4px 16px 16px 16px" />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <SkeletonBlock width="65%" height="44px" borderRadius="16px 16px 4px 16px" />
        </div>
      </div>
      <SkeletonBlock width="100%" height="48px" borderRadius="12px" />
    </main>
  );
}
