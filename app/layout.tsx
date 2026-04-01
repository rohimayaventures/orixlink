import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, DM_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import LegalOverlay from "@/components/LegalOverlay";
import { AuthProvider } from "@/components/AuthProvider";
import { SubscriptionUsageProvider } from "@/components/SubscriptionUsageProvider";
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
  metadataBase: new URL("https://triage.rohimaya.ai"),
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
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "OrixLink AI — Where every symptom finds its answer.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OrixLink AI",
    description:
      "OrixLink AI provides AI-powered symptom triage and health guidance. Any symptom, any person, no prior diagnosis required. Start free at triage.rohimaya.ai.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "wAKe_JMk4_9hSQBaVdYjuodJeT5n1fS19XRO_2Arat0",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
          <SubscriptionUsageProvider>
            <LegalOverlay />
            {children}
          </SubscriptionUsageProvider>
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
