import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import { Analytics } from "@vercel/analytics/next";
import LanguageProvider from "@/components/LanguageProvider";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BrainStats",
    template: "%s | BrainStats",
  },

  description:
    "AI-driven football intelligence, match analysis and data insights.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <LanguageProvider>
          <div className="flex min-h-full flex-col">
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
          <CookieConsent />
        </LanguageProvider>

        <Analytics />
      </body>
    </html>
  );
}