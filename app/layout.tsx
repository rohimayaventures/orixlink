import type { Metadata, Viewport } from "next";
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
    "OrixLink AI provides AI-powered symptom triage and health guidance. Any symptom, any person, no prior diagnosis required. Start free at triage.rohimaya.ai.",
  keywords: [
    "symptom checker",
    "symptom triage",
    "clinical triage",
    "health triage",
    "clinical triage AI",
    "symptom assessment",
    "AI symptom assessment",
    "symptom analysis",
    "AI health guidance",
    "health guidance",
    "medical symptom tool",
    "healthcare AI",
    "OrixLink",
    "Rohimaya Health AI",
  ],
  openGraph: {
    title: "OrixLink AI",
    description:
      "OrixLink AI provides AI-powered symptom triage and health guidance. Any symptom, any person, no prior diagnosis required. Start free at triage.rohimaya.ai.",
    type: "website",
    siteName: "OrixLink AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "OrixLink AI",
    description:
      "OrixLink AI provides AI-powered symptom triage and health guidance. Any symptom, any person, no prior diagnosis required. Start free at triage.rohimaya.ai.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#080C14",
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
