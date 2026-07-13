import { companyInfo } from "@/lib/companyInfo";
import { getSiteUrl, siteDescriptionSv, siteName } from "@/lib/site";

export default function StructuredData() {
  const siteUrl = getSiteUrl();

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    email: companyInfo.email,
    description: siteDescriptionSv,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Stockholm",
      addressCountry: "SE",
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    description: siteDescriptionSv,
    inLanguage: "sv-SE",
    publisher: {
      "@type": "Organization",
      name: siteName,
    },
  };

  const jsonLd = [organization, website];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
