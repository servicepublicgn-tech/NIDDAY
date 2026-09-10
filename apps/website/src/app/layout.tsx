import "@/styles/globals.css";
import { cn } from "@midday/ui/cn";
import "@midday/ui/globals.css";
import { Provider as Analytics } from "@midday/events/client";
import type { Metadata } from "next";
import { Hedvig_Letters_Sans, Hedvig_Letters_Serif } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactElement } from "react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SunsetBanner } from "@/components/sunset-banner";
import { ThemeProvider } from "@/components/theme-provider";
import { baseUrl } from "./sitemap";

const hedvigSans = Hedvig_Letters_Sans({
  weight: "400",
  subsets: ["latin"],
  display: "optional",
  variable: "--font-hedvig-sans",
  preload: true,
  adjustFontFallback: true,
  fallback: ["system-ui", "arial"],
});

const hedvigSerif = Hedvig_Letters_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "optional",
  variable: "--font-hedvig-serif",
  preload: true,
  adjustFontFallback: true,
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "NIDDAY — Financial Intelligence & Public Traceability",
    template: "%s | NIDDAY",
  },
  description:
    "Financial intelligence and public traceability for accountable organizations, projects, documents, and evidence.",
  openGraph: {
    title: "NIDDAY — Financial Intelligence & Public Traceability",
    description:
      "Financial intelligence and public traceability for accountable organizations, projects, documents, and evidence.",
    url: baseUrl,
    siteName: "NIDDAY",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/api/og?title=NIDDAY&description=Financial%20Intelligence%20%26%20Public%20Traceability",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    title: "NIDDAY — Financial Intelligence & Public Traceability",
    description:
      "Financial intelligence and public traceability for accountable organizations, projects, documents, and evidence.",
    images: [
      {
        url: "/api/og?title=NIDDAY&description=Financial%20Intelligence%20%26%20Public%20Traceability",
        width: 1200,
        height: 630,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)" },
    { media: "(prefers-color-scheme: dark)" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "NIDDAY",
  url: baseUrl,
  description:
    "Financial intelligence and public traceability for accountable organizations, projects, documents, and evidence.",
};

export default function Layout({ children }: { children: ReactElement }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body
        className={cn(
          `${hedvigSans.variable} ${hedvigSerif.variable} font-sans`,
          "bg-background overflow-x-hidden font-sans antialiased",
        )}
      >
        <NuqsAdapter>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SunsetBanner />
            <Header />
            <main className="container mx-auto px-4 pt-9 overflow-hidden md:overflow-visible">
              {children}
            </main>
            <Footer />
            <Analytics />
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
