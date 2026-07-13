import type { Metadata } from "next";

import { createPageMetadata, pageSeo } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata(pageSeo.legal);

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
