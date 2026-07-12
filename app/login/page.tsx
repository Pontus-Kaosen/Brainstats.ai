"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import LegalLinksSection from "@/components/LegalLinksSection";
import { useLanguage } from "@/components/LanguageProvider";

export default function LoginPage() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setMessage("");

    if (mode === "signup" && !acceptedTerms) {
      setMessage(t.login.acceptTermsRequired);
      setLoading(false);
      return;
    }

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setMessage(error.message);
          setLoading(false);
          return;
        }

        setMessage(t.login.accountCreated);
        setMode("login");
        setAcceptedTerms(false);
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      setMessage(t.login.somethingWrong);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0E0E0E] px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1A1A1A] p-8">
        <p className="text-[#E8DCC8]">{t.login.accountLabel}</p>

        <h1 className="mt-3 text-5xl font-bold text-white">
          {mode === "login" ? t.login.loginTitle : t.login.signupTitle}
        </h1>

        <p className="mt-4 text-[#A9A9A9]">
          {mode === "login"
            ? t.login.loginDescription
            : t.login.signupDescription}
        </p>

        <input
          type="email"
          placeholder={t.login.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-8 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none"
        />

        <input
          type="password"
          placeholder={t.login.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none"
        />

        {mode === "signup" && (
          <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-[#A9A9A9]">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30"
            />

            <span>
              {t.login.acceptTermsLabel}{" "}
              <Link
                href="/legal/terms"
                className="font-semibold text-[#18ff6d] hover:underline"
              >
                {t.login.termsLink}
              </Link>{" "}
              {t.login.and}{" "}
              <Link
                href="/legal/privacy"
                className="font-semibold text-[#18ff6d] hover:underline"
              >
                {t.login.privacyLink}
              </Link>
              .
            </span>
          </label>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full rounded-full bg-[#E8DCC8] py-4 font-bold text-black disabled:opacity-40"
        >
          {loading
            ? t.login.wait
            : mode === "login"
              ? t.login.login
              : t.login.signup}
        </button>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setMessage("");
            setAcceptedTerms(false);
          }}
          className="mt-5 w-full text-[#E8DCC8]"
        >
          {mode === "login"
            ? t.login.switchToSignup
            : t.login.switchToLogin}
        </button>

        {message && (
          <div className="mt-5 rounded-2xl bg-black/30 p-4 text-[#E8DCC8]">
            {message}
          </div>
        )}

        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="text-center text-xs leading-6 text-[#777]">
            {t.login.legalFooter}
          </p>
          <div className="mt-4">
            <LegalLinksSection compact />
          </div>
        </div>
      </div>
    </main>
  );
}
