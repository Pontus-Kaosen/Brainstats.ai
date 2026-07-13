import type { Metadata } from "next";

import { createPageMetadata, pageSeo } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata(pageSeo.premium);

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
