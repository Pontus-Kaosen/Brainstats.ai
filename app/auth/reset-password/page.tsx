"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/components/LanguageProvider";
import { supabase } from "@/lib/supabase";

function ResetPasswordForm() {
  const { t } = useLanguage();
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
        setInvalidLink(false);
      }
    });

    async function verifyRecoverySession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      if (session) {
        setReady(true);
        setInvalidLink(false);
        return;
      }

      window.setTimeout(async () => {
        const {
          data: { session: retrySession },
        } = await supabase.auth.getSession();

        if (cancelled) {
          return;
        }

        if (retrySession) {
          setReady(true);
          setInvalidLink(false);
          return;
        }

        setInvalidLink(true);
      }, 800);
    }

    void verifyRecoverySession();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit() {
    setMessage("");

    if (password.length < 6) {
      setMessage(t.login.resetPasswordTooShort);
      return;
    }

    if (password !== confirmPassword) {
      setMessage(t.login.resetPasswordMismatch);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      await supabase.auth.signOut();
      setMessage(t.login.resetSuccess);
      window.setTimeout(() => {
        router.replace("/login");
      }, 1800);
    } catch (error) {
      console.error(error);
      setMessage(t.login.somethingWrong);
    } finally {
      setLoading(false);
    }
  }

  if (!ready && !invalidLink) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0E0E0E] px-6">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1A1A1A] p-8 text-center">
          <p className="font-semibold text-[#E8DCC8]">{t.login.resetLoading}</p>
        </div>
      </main>
    );
  }

  if (invalidLink) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0E0E0E] px-6">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1A1A1A] p-8">
          <h1 className="text-3xl font-bold text-white">{t.login.forgotTitle}</h1>
          <p className="mt-4 text-[#A9A9A9]">{t.login.resetInvalidLink}</p>

          <Link
            href="/login"
            className="mt-6 inline-flex rounded-full bg-[#E8DCC8] px-5 py-3 text-sm font-bold text-black"
          >
            {t.login.backToLogin}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0E0E0E] px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1A1A1A] p-8">
        <p className="text-[#E8DCC8]">{t.login.accountLabel}</p>

        <h1 className="mt-3 text-4xl font-bold text-white">
          {t.login.resetTitle}
        </h1>

        <p className="mt-4 text-[#A9A9A9]">{t.login.resetDescription}</p>

        <input
          type="password"
          placeholder={t.login.resetNewPassword}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-8 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none"
        />

        <input
          type="password"
          placeholder={t.login.resetConfirmPassword}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full rounded-full bg-[#E8DCC8] py-4 font-bold text-black disabled:opacity-40"
        >
          {loading ? t.login.wait : t.login.resetSubmit}
        </button>

        {message ? (
          <div className="mt-5 rounded-2xl bg-black/30 p-4 text-[#E8DCC8]">
            {message}
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
