"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LegalLinksSection from "@/components/LegalLinksSection";
import { useLanguage } from "@/components/LanguageProvider";
import { getSafeRedirectPath } from "@/lib/safeRedirect";

type AuthMode = "login" | "signup" | "forgot";

function getPasswordResetRedirectUrl() {
  const next = encodeURIComponent("/auth/reset-password");
  return `${window.location.origin}/auth/callback?next=${next}`;
}

function LoginForm() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const nextPath = getSafeRedirectPath(searchParams.get("next"));

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage("");
    setLoginFailed(false);

    if (nextMode !== "forgot") {
      setPassword("");
    }
  }

  async function handleForgotPassword() {
    setMessage("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setMessage(t.login.forgotEnterEmail);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: getPasswordResetRedirectUrl(),
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setMessage(t.login.forgotEmailSent);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setMessage(t.login.somethingWrong);
      setLoading(false);
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setMessage("");
    setLoginFailed(false);

    if (mode === "forgot") {
      await handleForgotPassword();
      return;
    }

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
        switchMode("login");
        setAcceptedTerms(false);
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoginFailed(true);
        setMessage(t.login.loginFailedHint);
        setLoading(false);
        return;
      }

      window.location.href = nextPath;
    } catch (err) {
      console.error(err);
      setMessage(t.login.somethingWrong);
      setLoading(false);
    }
  }

  const title =
    mode === "forgot" ? t.login.forgotTitle : mode === "login" ? t.login.loginTitle : t.login.signupTitle;

  const description =
    mode === "forgot"
      ? t.login.forgotDescription
      : mode === "login"
        ? t.login.loginDescription
        : t.login.signupDescription;

  const submitLabel =
    mode === "forgot"
      ? t.login.forgotSubmit
      : mode === "login"
        ? t.login.login
        : t.login.signup;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0E0E0E] px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1A1A1A] p-8">
        <p className="text-[#E8DCC8]">{t.login.accountLabel}</p>

        <h1 className="mt-3 text-5xl font-bold text-white">{title}</h1>

        <p className="mt-4 text-[#A9A9A9]">{description}</p>

        <input
          type="email"
          placeholder={t.login.email}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-8 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none"
        />

        {mode !== "forgot" ? (
          <>
            <input
              type="password"
              placeholder={t.login.password}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none"
            />

            {mode === "login" && loginFailed ? (
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="mt-4 text-sm font-semibold text-[#18ff6d] transition hover:text-[#9dffc4]"
              >
                {t.login.forgotPassword}
              </button>
            ) : null}
          </>
        ) : null}

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
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full rounded-full bg-[#E8DCC8] py-4 font-bold text-black disabled:opacity-40"
        >
          {loading ? t.login.wait : submitLabel}
        </button>

        {mode === "forgot" ? (
          <button
            type="button"
            onClick={() => switchMode("login")}
            className="mt-5 w-full text-[#E8DCC8]"
          >
            {t.login.backToLogin}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => switchMode(mode === "login" ? "signup" : "login")}
            className="mt-5 w-full text-[#E8DCC8]"
          >
            {mode === "login"
              ? t.login.switchToSignup
              : t.login.switchToLogin}
          </button>
        )}

        {message ? (
          <div
            className={`mt-5 rounded-2xl p-4 ${
              loginFailed
                ? "border border-red-500/30 bg-red-500/10 text-red-200"
                : "bg-black/30 text-[#E8DCC8]"
            }`}
          >
            {message}
          </div>
        ) : null}

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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
