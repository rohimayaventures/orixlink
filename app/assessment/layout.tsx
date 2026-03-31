import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start Assessment — OrixLink AI",
  description:
    "Describe your symptoms. OrixLink assesses urgency and tells you exactly what to do next.",
  openGraph: {
    title: "OrixLink AI Assessment",
    description: "Any symptom, any person, no diagnosis required.",
    url: "https://triage.rohimaya.ai/assessment",
  },
};

export default function AssessmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
