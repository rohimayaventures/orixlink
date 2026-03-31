import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account — OrixLink AI",
  description: "Sign up free or choose Pro or Family plan.",
  openGraph: {
    title: "Join OrixLink AI",
    description: "Start free. Universal clinical triage for everyone.",
    url: "https://triage.rohimaya.ai/auth/signup",
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
