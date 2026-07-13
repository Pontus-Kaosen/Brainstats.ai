import type { Metadata } from "next";

import { createPageMetadata, pageSeo } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata(pageSeo.builder);

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
