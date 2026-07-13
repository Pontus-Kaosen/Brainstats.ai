import type { Metadata } from "next";

import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Betalning genomförd",
  description: "BrainStats Premium-betalning.",
  path: "/premium/success",
  noIndex: true,
});

export default function PremiumSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
