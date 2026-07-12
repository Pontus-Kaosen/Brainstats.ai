"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import FootballBackground from "@/components/FootballBackground";
import Button from "@/components/Button";
import { useLanguage } from "@/components/LanguageProvider";
import { formatTranslation } from "@/lib/locale";

type Status = "loading" | "success" | "error";

function PremiumSuccessPageContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setMessage(t.premiumSuccess.missingSession);
      return;
    }

    async function verifyCheckout() {
      try {
        const response = await fetch(
          `/api/stripe/checkout-session?session_id=${encodeURIComponent(
            sessionId!
          )}`
        );

        const text = await response.text();

        let data: {
          success?: boolean;
          paid?: boolean;
          plan?: string;
          error?: string;
        };

        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(t.premiumSuccess.invalidResponse);
        }

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || t.premiumSuccess.verifyFailed
          );
        }

        if (!data.paid) {
          throw new Error(t.premiumSuccess.notPaid);
        }

        setStatus("success");
        setMessage(
          data.plan
            ? formatTranslation(t.premiumSuccess.planActivated, {
                plan: data.plan,
              })
            : t.premiumSuccess.planActivatedGeneric
        );
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : t.premiumSuccess.verifyFailed
        );
      }
    }

    verifyCheckout();
  }, [sessionId, t.premiumSuccess]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-[#FAFAF8]">
      <FootballBackground />

      <div className="relative z-10">
        <Navbar />

        <div className="mx-auto flex min-h-[75vh] max-w-4xl items-center justify-center px-4 py-16 sm:px-8">
          <section className="brain-card w-full rounded-[2rem] p-8 text-center sm:p-12">
            {status === "loading" && (
              <>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 text-4xl">
                  ⏳
                </div>

                <h1 className="mt-6 text-3xl font-black sm:text-5xl">
                  {t.premiumSuccess.loadingTitle}
                </h1>

                <p className="mt-4 text-[#A9A9A9]">
                  {t.premiumSuccess.loadingText}
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#18ff6d55] bg-[#18ff6d]/15 text-4xl">
                  ✓
                </div>

                <p className="brain-title mt-6 font-semibold">
                  {t.premiumSuccess.successBadge}
                </p>

                <h1 className="mt-3 text-4xl font-black sm:text-6xl">
                  {t.premiumSuccess.successTitle}
                </h1>

                <p className="mx-auto mt-5 max-w-xl text-lg text-[#D8D8D8]">
                  {message}
                </p>

                <p className="mx-auto mt-3 max-w-xl text-sm text-[#888]">
                  {t.premiumSuccess.testModeNote}
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <Button
                    onClick={() => {
                      window.location.href = "/builder";
                    }}
                    className="w-full"
                  >
                    {t.premiumSuccess.openBuilder}
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => {
                      window.location.href = "/dashboard";
                    }}
                    className="w-full"
                  >
                    {t.premiumSuccess.goDashboard}
                  </Button>
                </div>
              </>
            )}

            {status === "error" && (
              <>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 text-4xl">
                  !
                </div>

                <h1 className="mt-6 text-3xl font-black sm:text-5xl">
                  {t.premiumSuccess.errorTitle}
                </h1>

                <p className="mx-auto mt-5 max-w-xl text-red-200/80">
                  {message}
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <Button
                    onClick={() => {
                      window.location.href = "/premium";
                    }}
                    className="w-full"
                  >
                    {t.premiumSuccess.backPremium}
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => window.location.reload()}
                    className="w-full"
                  >
                    {t.premiumSuccess.retry}
                  </Button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default function PremiumSuccessPage() {
  const { t } = useLanguage();

  return (
    <Suspense
      fallback={
        <main className="relative min-h-screen overflow-hidden bg-[#050505] text-[#FAFAF8]">
          <FootballBackground />
          <div className="relative z-10">
            <Navbar />
            <div className="flex min-h-[75vh] items-center justify-center">
              <p className="text-[#A9A9A9]">{t.login.wait}</p>
            </div>
          </div>
        </main>
      }
    >
      <PremiumSuccessPageContent />
    </Suspense>
  );
}
