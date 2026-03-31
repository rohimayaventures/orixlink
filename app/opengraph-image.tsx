import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";
export const alt = "OrixLink AI";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(
    join(process.cwd(), "public", "OrixLink AI Logo (1).svg")
  );
  const logoBase64 = `data:image/svg+xml;base64,${Buffer.from(logoData).toString(
    "base64"
  )}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#080C14",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <img
          src={logoBase64}
          width={160}
          height={160}
          style={{ marginBottom: 32 }}
        />
        <div
          style={{
            color: "#C8A96E",
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          OrixLink AI
        </div>
        <div
          style={{
            color: "#F4EFE6",
            fontSize: 26,
            fontWeight: 400,
            opacity: 0.85,
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          Where every symptom finds its answer.
        </div>
        <div
          style={{
            color: "#C8A96E",
            fontSize: 16,
            marginTop: 36,
            opacity: 0.5,
            letterSpacing: "0.1em",
          }}
        >
          triage.rohimaya.ai
        </div>
      </div>
    ),
    { ...size }
  );
}
