import type { Metadata } from "next";

import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Analysrapport",
  description: "Privat AI-analysrapport från BrainStats.",
  path: "/report",
  noIndex: true,
});

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
