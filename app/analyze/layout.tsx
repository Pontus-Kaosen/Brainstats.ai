import type { Metadata } from "next";

import { createPageMetadata, pageSeo } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata(pageSeo.analyze);

export default function AnalyzeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
