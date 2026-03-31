import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — OrixLink AI",
  description: "Start free or upgrade to Pro or Family. Plans from $0/month.",
  openGraph: {
    title: "OrixLink AI Pricing",
    description: "Universal clinical triage for individuals and families.",
    url: "https://triage.rohimaya.ai/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
