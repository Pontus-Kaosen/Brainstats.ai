import type { Metadata } from "next";
import {
  Geist,
} from "next/font/google";

import { Analytics } from "@vercel/analytics/next";
import LanguageProvider from "@/components/LanguageProvider";
import DeferredSiteChrome from "@/components/DeferredSiteChrome";
import StructuredData from "@/components/StructuredData";
import { createPageMetadata } from "@/lib/seo";
import { getSiteUrl, siteDescriptionSv, siteName } from "@/lib/site";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  ...createPageMetadata({
    title: siteName,
    description: siteDescriptionSv,
    path: "/",
  }),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  applicationName: siteName,
  category: "sports",
  keywords: [
    "fotbollsanalys",
    "AI fotboll",
    "spelanalys",
    "BrainStats",
    "matchanalys",
    "fotbollsstatistik",
  ],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sv"
      suppressHydrationWarning
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <StructuredData />
        <LanguageProvider>
          <div className="flex min-h-full flex-col">
            <div className="flex-1">{children}</div>
            <DeferredSiteChrome />
          </div>
        </LanguageProvider>

        <Analytics />
      </body>
    </html>
  );
}