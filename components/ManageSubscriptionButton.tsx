"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/components/LanguageProvider";

type PortalResponse = {
  url?: string;
  error?: string;
};

export default function ManageSubscriptionButton() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openPortal() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(t.manageSubscription.sessionError);
      }

      if (!session?.user) {
        window.location.href = "/login?next=/dashboard";
        return;
      }

      const response = await fetch("/api/stripe/customer-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
        }),
      });

      const responseText = await response.text();

      let data: PortalResponse;

      try {
        data = JSON.parse(responseText) as PortalResponse;
      } catch {
        throw new Error(t.manageSubscription.invalidResponse);
      }

      if (!response.ok || !data.url) {
        throw new Error(
          data.error || t.manageSubscription.portalError
        );
      }

      window.location.assign(data.url);
    } catch (portalError) {
      console.error("Customer Portal error:", portalError);

      setError(
        portalError instanceof Error
          ? portalError.message
          : t.manageSubscription.portalError
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={openPortal}
        disabled={loading}
        className="w-full rounded-2xl border border-[#18ff6d55] bg-[#18ff6d]/10 px-5 py-4 font-bold text-[#18ff6d] transition hover:bg-[#18ff6d] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? t.manageSubscription.opening : t.manageSubscription.button}
      </button>

      {error && (
        <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
