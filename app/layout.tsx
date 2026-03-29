import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, DM_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import LegalOverlay from "@/components/LegalOverlay";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OrixLink AI — Where every symptom finds its answer",
  description:
    "Universal clinical triage and AI-assisted symptom assessment. Any symptom. Any person. No prior medical context required.",
  keywords: [
    "symptom checker",
    "clinical triage",
    "health triage",
    "clinical triage AI",
    "AI symptom assessment",
    "symptom analysis",
    "AI health guidance",
    "medical symptom tool",
    "healthcare AI",
    "OrixLink",
    "Rohimaya Health AI",
  ],
  openGraph: {
    title: "OrixLink AI",
    description: "Where every symptom finds its answer.",
    type: "website",
    siteName: "OrixLink AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "OrixLink AI",
    description: "Where every symptom finds its answer.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml", sizes: "any" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable} antialiased`}
      >
        <AuthProvider>
          <LegalOverlay />
          {children}
        </AuthProvider>
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js')})}`,
          }}
        />
      </body>
    </html>
  );
}
