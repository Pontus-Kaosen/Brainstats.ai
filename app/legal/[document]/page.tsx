import LegalDocumentView from "@/components/LegalDocumentView";
import { getLegalDocument } from "@/lib/legalContent";
import { isLegalSlug } from "@/lib/legalSlugs";
import { createPageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type LegalDocumentPageProps = {
  params: Promise<{ document: string }>;
};

export async function generateMetadata({
  params,
}: LegalDocumentPageProps): Promise<Metadata> {
  const { document } = await params;

  if (!isLegalSlug(document)) {
    return createPageMetadata({
      title: "Juridisk information",
      path: "/legal",
    });
  }

  const legalDoc = getLegalDocument("sv", document);

  return createPageMetadata({
    title: legalDoc.title,
    description: legalDoc.description,
    path: `/legal/${document}`,
  });
}

export default async function LegalDocumentPage({
  params,
}: LegalDocumentPageProps) {
  const { document } = await params;

  if (!isLegalSlug(document)) {
    notFound();
  }

  return <LegalDocumentView slug={document} />;
}
