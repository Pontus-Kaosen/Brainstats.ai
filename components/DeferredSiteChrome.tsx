"use client";

import dynamic from "next/dynamic";

const Footer = dynamic(() => import("@/components/Footer"), {
  loading: () => null,
});

const CookieConsent = dynamic(() => import("@/components/CookieConsent"), {
  ssr: false,
  loading: () => null,
});

export default function DeferredSiteChrome() {
  return (
    <>
      <Footer />
      <CookieConsent />
    </>
  );
}
