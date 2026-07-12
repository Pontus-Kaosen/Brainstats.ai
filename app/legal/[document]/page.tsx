import LegalDocumentView from "@/components/LegalDocumentView";
import { isLegalSlug } from "@/lib/legalSlugs";
import { notFound } from "next/navigation";

type LegalDocumentPageProps = {
  params: Promise<{ document: string }>;
};

export default async function LegalDocumentPage({
  params,
}: LegalDocumentPageProps) {
  const { document } = await params;

  if (!isLegalSlug(document)) {
    notFound();
  }

  return <LegalDocumentView slug={document} />;
}
