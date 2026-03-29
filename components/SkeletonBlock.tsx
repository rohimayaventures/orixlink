import type { CSSProperties } from "react";

export function SkeletonBlock({
  width = "100%",
  height = "16px",
  borderRadius = "4px",
  style = {},
}: {
  width?: string;
  height?: string;
  borderRadius?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: "rgba(200,169,110,0.08)",
        animation: "pulse 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}
