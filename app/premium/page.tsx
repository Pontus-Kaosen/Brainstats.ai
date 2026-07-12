"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import FootballBackground from "@/components/FootballBackground";
import { supabase } from "@/lib/supabase";

type PaidPlan = "pro" | "elite";

type Plan = {
  id: "free" | PaidPlan;
  name: string;
  price: string;
  tag: string;
  description: string;
  features: string[];
  popular?: boolean;
  elite?: boolean;
};

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "0 kr",
    tag: "Start",
    description: "För dig som vill testa BrainStats.",
    features: [
      "3 analyser per dag",
      "BrainScore™",
      "Grundrapport",
      "Enkel risknivå",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "99 kr/mån",
    tag: "Mest populär",
    description: "För dig som vill analysera mer seriöst.",
    popular: true,
    features: [
      "Obegränsade analyser",
      "Djupare AI-rapporter",
      "Full Brain Builder",
      "Sparad historik",
      "Form och statistik",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    price: "149 kr/mån",
    tag: "Max",
    description: "För dig som vill ha maximal insikt.",
    elite: true,
    features: [
      "Allt i Pro",
      "AI Match of the Day",
      "Daily Brain Picks",
      "Value Bets",
      "Prioriterad AI",
      "Tidiga nya funktioner",
    ],
  },
];

export default function PremiumPage() {
  const [loadingPlan, setLoadingPlan] = useState<PaidPlan | null>(null);
  const [error, setError] = useState("");

  async function startCheckout(plan: PaidPlan) {
    setLoadingPlan(plan);
    setError("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error("Kunde inte kontrollera din inloggning.");
      }

      if (!session?.user) {
        window.location.href = "/login?next=/premium";
        return;
      }

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          email: session.user.email || "",
          userId: session.user.id,
        }),
      });

      const responseText = await response.text();

let data: {
  success?: boolean;
  url?: string;
  error?: string;
};

try {
  data = JSON.parse(responseText);
} catch {
  console.error("Stripe returnerade inte JSON:", responseText);

  throw new Error(
    "Checkout-routen kunde inte öppnas. Kontrollera terminalen och att route.ts ligger i rätt mapp."
  );
}

if (!response.ok || !data.success || !data.url) {
  throw new Error(
    data.error || "Stripe Checkout kunde inte startas."
  );
}

      window.location.assign(data.url);
    } catch (checkoutError) {
      console.error("Checkout error:", checkoutError);

      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Något gick fel när betalningen skulle startas."
      );

      setLoadingPlan(null);
    }
  }

  function openFreePlan() {
    window.location.href = "/builder";
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-[#FAFAF8]">
      <FootballBackground />

      <div className="relative z-10">
        <Navbar />

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-16">
          <section className="text-center">
            <div className="inline-flex rounded-full border border-[#18ff6d33] bg-[#18ff6d]/10 px-5 py-2 text-sm font-semibold text-[#18ff6d]">
              💎 BrainStats Plans
            </div>

            <h1 className="mt-6 text-4xl font-black sm:text-6xl">
              Välj din analysnivå.
            </h1>

            <p className="mx-auto mt-5 max-w-2xl leading-8 text-[#A9A9A9]">
              Börja gratis eller lås upp fler analyser, djupare rapporter och
              avancerade AI-insikter.
            </p>

            <p className="mx-auto mt-3 max-w-2xl text-sm text-[#747474]">
              BrainStats erbjuder analys och information. Vi tar inte emot
              spel, insatser eller utbetalningar.
            </p>
          </section>

          {error && (
            <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-center">
              <p className="font-semibold text-red-300">
                Betalningen kunde inte startas
              </p>

              <p className="mt-2 text-sm text-red-200/80">
                {error}
              </p>
            </div>
          )}

          <section className="mt-12 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
              const isLoading =
                plan.id !== "free" && loadingPlan === plan.id;

              return (
                <article
                  key={plan.id}
                  className={`relative flex min-h-[560px] flex-col overflow-hidden rounded-[2rem] border p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 sm:p-8 ${
                    plan.popular
                      ? "border-[#18ff6d] bg-[#07140d]/90 shadow-[0_0_65px_rgba(24,255,109,0.2)]"
                      : plan.elite
                        ? "border-[#2fbfff66] bg-[#071016]/90 shadow-[0_0_55px_rgba(47,191,255,0.12)]"
                        : "border-white/10 bg-[#111]/85 hover:border-[#18ff6d66]"
                  }`}
                >
                  <div
                    className={`pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full blur-[80px] ${
                      plan.elite
                        ? "bg-[#2fbfff]/15"
                        : "bg-[#18ff6d]/10"
                    }`}
                  />

                  {plan.popular && (
                    <div className="absolute right-6 top-6 rounded-full bg-[#18ff6d] px-4 py-2 text-xs font-black text-black">
                      POPULÄR
                    </div>
                  )}

                  {plan.elite && (
                    <div className="absolute right-6 top-6 rounded-full border border-[#2fbfff66] bg-[#2fbfff]/10 px-4 py-2 text-xs font-black text-[#72d5ff]">
                      👑 ELITE
                    </div>
                  )}

                  <div className="relative flex h-full flex-col">
                    <div className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-[#A9A9A9]">
                      {plan.tag}
                    </div>

                    <h2 className="mt-7 text-4xl font-black">
                      {plan.name}
                    </h2>

                    <p className="mt-3 min-h-12 text-[#A9A9A9]">
                      {plan.description}
                    </p>

                    <p
                      className={`mt-8 text-4xl font-black ${
                        plan.elite
                          ? "text-[#72d5ff]"
                          : "text-[#18ff6d]"
                      }`}
                    >
                      {plan.price}
                    </p>

                    <div className="mt-8">
                      {plan.id === "free" ? (
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={openFreePlan}
                          disabled={loadingPlan !== null}
                        >
                          Börja gratis
                        </Button>
                      ) : (
                        <Button
                          variant={
                            plan.popular ? "primary" : "secondary"
                          }
                          className="w-full"
                          onClick={() => {
                            if (plan.id !== "free") {
                              void startCheckout(plan.id);
                            }
                          }}
                          disabled={loadingPlan !== null}
                        >
                          {isLoading
                            ? "Öppnar Checkout..."
                            : `Välj ${plan.name}`}
                        </Button>
                      )}
                    </div>

                    <div className="my-8 h-px bg-white/10" />

                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#747474]">
                      Detta ingår
                    </p>

                    <ul className="mt-5 space-y-4 text-sm text-[#D8D8D8]">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-3"
                        >
                          <span
                            className={
                              plan.elite
                                ? "text-[#72d5ff]"
                                : "text-[#18ff6d]"
                            }
                          >
                            ✓
                          </span>

                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="mt-12 rounded-[2rem] border border-white/10 bg-black/30 p-7 text-center backdrop-blur-xl sm:p-10">
            <h2 className="text-2xl font-black">
              Every match deserves a BrainScore™
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-[#A9A9A9]">
              Du kan börja gratis och uppgradera när du behöver fler analyser.
              Prenumerationerna förnyas månadsvis.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}