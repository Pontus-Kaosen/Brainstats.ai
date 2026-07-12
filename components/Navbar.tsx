"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/components/LanguageProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Navbar() {
  const [email, setEmail] =
    useState<string | null>(null);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const menuRef =
    useRef<HTMLDivElement>(null);

  const { t } = useLanguage();

  useEffect(() => {
    async function loadUser() {
      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      setEmail(
        session?.user?.email || null
      );
    }

    loadUser();

    const { data } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          setEmail(
            session?.user?.email ||
              null
          );
        }
      );

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();

    setEmail(null);

    window.location.href = "/";
  }

  const navLinks = [
    {
      title: t.navbar.home,
      href: "/",
    },
    {
      title: t.navbar.builder,
      href: "/builder",
    },
    {
      title: t.navbar.dashboard,
      href: "/dashboard",
    },
    {
      title: t.navbar.premium,
      href: "/premium",
    },
    {
      title: t.navbar.legal,
      href: "/legal",
    },
  ];

  return (
    <nav className="border-b border-[#18ff6d22] bg-black/35 px-3 py-4 text-[#FAFAF8] backdrop-blur-xl sm:px-8 sm:py-5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 sm:gap-3"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#18ff6d44] bg-[#18ff6d]/10 shadow-[0_0_30px_rgba(24,255,109,.25)] sm:h-11 sm:w-11 sm:rounded-2xl">
            🧠
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-xl font-black tracking-tight sm:text-2xl">
              BrainStats
            </h1>

            <p className="hidden text-xs text-[#18ff6d] sm:block">
              {
                t.navbar
                  .footballIntelligence
              }
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold text-[#D8D8D8] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#18ff6d55] hover:bg-[#18ff6d]/10 hover:text-[#18ff6d]"
            >
              {link.title}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageSwitcher />

          <div
            className="relative"
            ref={menuRef}
          >
            {email ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setMenuOpen(
                      !menuOpen
                    )
                  }
                  className="flex items-center gap-2 rounded-2xl border border-[#18ff6d33] bg-[#121212]/80 px-3 py-3 font-semibold text-white shadow-[0_0_30px_rgba(24,255,109,.12)] transition hover:border-[#18ff6d88] hover:bg-[#18ff6d]/10 sm:px-5"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-[#18ff6d] to-[#2fbfff] text-black">
                    👤
                  </span>

                  <span className="hidden max-w-28 truncate sm:inline">
                    {email.split("@")[0]}
                  </span>

                  <span className="hidden text-[#18ff6d] sm:inline">
                    ▼
                  </span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 z-[90] mt-4 w-[min(18rem,calc(100vw-1.5rem))] rounded-3xl border border-[#18ff6d33] bg-[#101010]/98 p-3 shadow-[0_0_60px_rgba(24,255,109,.18)] backdrop-blur-xl">
                    <div className="rounded-2xl bg-[#18ff6d]/10 p-4">
                      <p className="text-xs text-[#A9A9A9]">
                        {
                          t.navbar
                            .loggedInAs
                        }
                      </p>

                      <p className="mt-1 truncate font-bold text-[#18ff6d]">
                        {email}
                      </p>
                    </div>

                    <div className="mt-3 space-y-2">
                      <Link
                        href="/"
                        className="block rounded-2xl px-4 py-3 hover:bg-white/5"
                      >
                        🏠{" "}
                        {t.navbar.home}
                      </Link>

                      <Link
                        href="/dashboard"
                        className="block rounded-2xl px-4 py-3 hover:bg-white/5"
                      >
                        📊{" "}
                        {
                          t.navbar
                            .dashboard
                        }
                      </Link>

                      <Link
                        href="/builder"
                        className="block rounded-2xl px-4 py-3 hover:bg-white/5"
                      >
                        ⚽{" "}
                        {
                          t.navbar.builder
                        }
                      </Link>

                      <Link
                        href="/premium"
                        className="block rounded-2xl px-4 py-3 hover:bg-white/5"
                      >
                        💎{" "}
                        {
                          t.navbar.premium
                        }
                      </Link>

                      <Link
                        href="/legal"
                        className="block rounded-2xl px-4 py-3 hover:bg-white/5"
                      >
                        📜 {t.navbar.legal}
                      </Link>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-3 w-full rounded-2xl border border-red-500/40 px-4 py-3 text-left text-red-400 transition hover:bg-red-500 hover:text-white"
                    >
                      🚪{" "}
                      {t.navbar.logout}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-2xl border border-[#18ff6d55] bg-[#18ff6d]/10 px-3 py-3 text-sm font-bold text-[#18ff6d] transition hover:bg-[#18ff6d] hover:text-black sm:px-6 sm:text-base"
              >
                {t.navbar.login}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}