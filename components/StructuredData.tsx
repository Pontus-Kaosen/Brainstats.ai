import { companyInfo } from "@/lib/companyInfo";
import {
  getSiteUrl,
  siteDescriptionEn,
  siteDescriptionSv,
  siteName,
} from "@/lib/site";

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
    description: siteDescriptionEn,
    inLanguage: ["sv-SE", "en"],
    publisher: {
      "@type": "Organization",
      name: siteName,
    },
  };

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteName,
    applicationCategory: "SportsApplication",
    operatingSystem: "Web",
    url: siteUrl,
    description: siteDescriptionSv,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "SEK",
    },
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Vad är value bets inom fotboll?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Value bets är spel där oddsen hos spelbolaget kan vara högre än den sannolikhet BrainStats AI bedömer. BrainStats Elite visar dagliga value bets för fotboll med transparent logg.",
        },
      },
      {
        "@type": "Question",
        name: "Kan jag få AI-analys av mina fotbollsbets?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ja. Klistra in din spelidé, ladda upp en kupong eller bygg i Brain Builder. BrainStats ger AI-analys med BrainScore, form, skador och risk — 3 gratis analyser per dag.",
        },
      },
      {
        "@type": "Question",
        name: "Erbjuder BrainStats AI-speltips för fotboll?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ja. Pro och Elite inkluderar dagliga AI-kuponger och speltips baserat på statistik och odds. Elite inkluderar även value bets.",
        },
      },
      {
        "@type": "Question",
        name: "Is BrainStats a bookmaker?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. BrainStats is an AI football analysis tool. We do not accept bets, stakes or payouts.",
        },
      },
      {
        "@type": "Question",
        name: "Can I upload a bet slip screenshot?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Upload a screenshot on the Analyze page and BrainStats AI reads the match and markets automatically.",
        },
      },
      {
        "@type": "Question",
        name: "How many free analyses do I get?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Free accounts include 3 AI analyses per day with BrainScore and basic reports.",
        },
      },
    ],
  };

  const jsonLd = [organization, website, software, faq];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
