"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/components/LanguageProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import BrainStatsLogo from "@/components/BrainStatsLogo";

export default function Navbar() {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const loginHref =
    pathname && pathname !== "/login"
      ? `/login?next=${encodeURIComponent(pathname)}`
      : "/login";

  useEffect(() => {
    let cancelled = false;
    let authSubscription: { unsubscribe: () => void } | null = null;

    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!cancelled) {
        setEmail(session?.user?.email || null);
      }
    }

    function startAuth() {
      void loadUser();

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setEmail(session?.user?.email || null);
      });

      authSubscription = data.subscription;
    }

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(startAuth, {
        timeout: 2500,
      });

      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
        authSubscription?.unsubscribe();
      };
    }

    const timeoutId = window.setTimeout(startAuth, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      authSubscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setEmail(null);
    window.location.href = "/";
  }

  const navLinks = [
    { title: t.navbar.home, href: "/" },
    { title: t.navbar.analyze, href: "/analyze" },
    { title: t.navbar.builder, href: "/builder" },
    { title: t.navbar.dashboard, href: "/dashboard" },
    { title: t.navbar.premium, href: "/premium" },
    { title: t.navbar.legal, href: "/legal" },
  ];

  return (
    <nav className="relative border-b border-[#18ff6d22] bg-black/95 px-3 py-3 text-[#FAFAF8] max-md:backdrop-blur-none backdrop-blur-xl sm:px-8 sm:py-5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center">
          <BrainStatsLogo variant="nav" />
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
          <button
            type="button"
            onClick={() => setMobileNavOpen((open) => !open)}
            className="rounded-2xl border border-[#18ff6d33] bg-[#121212]/80 px-3 py-3 text-sm font-bold text-[#18ff6d] transition hover:border-[#18ff6d88] hover:bg-[#18ff6d]/10 lg:hidden"
            aria-expanded={mobileNavOpen}
            aria-label={mobileNavOpen ? t.navbar.menuClose : t.navbar.menuOpen}
          >
            {mobileNavOpen ? "✕" : "☰"}
          </button>

          <LanguageSwitcher />

          <div className="relative" ref={menuRef}>
            {email ? (
              <>
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 rounded-2xl border border-[#18ff6d33] bg-[#121212]/80 px-3 py-3 font-semibold text-white shadow-[0_0_30px_rgba(24,255,109,.12)] transition hover:border-[#18ff6d88] hover:bg-[#18ff6d]/10 sm:px-5"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-[#18ff6d] to-[#2fbfff] text-black">
                    👤
                  </span>

                  <span className="hidden max-w-28 truncate sm:inline">
                    {email.split("@")[0]}
                  </span>

                  <span className="hidden text-[#18ff6d] sm:inline">▼</span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 z-[90] mt-4 w-[min(18rem,calc(100vw-1.5rem))] rounded-3xl border border-[#18ff6d33] bg-[#101010] p-3 shadow-[0_0_60px_rgba(24,255,109,.18)] max-md:backdrop-blur-none backdrop-blur-xl">
                    <div className="rounded-2xl bg-[#18ff6d]/10 p-4">
                      <p className="text-xs text-[#A9A9A9]">
                        {t.navbar.loggedInAs}
                      </p>

                      <p className="mt-1 truncate font-bold text-[#18ff6d]">
                        {email}
                      </p>
                    </div>

                    <div className="mt-3 space-y-2">
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="block rounded-2xl px-4 py-3 hover:bg-white/5"
                        >
                          {link.title}
                        </Link>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-3 w-full rounded-2xl border border-red-500/40 px-4 py-3 text-left text-red-400 transition hover:bg-red-500 hover:text-white"
                    >
                      🚪 {t.navbar.logout}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                href={loginHref}
                className="rounded-2xl border border-[#18ff6d55] bg-[#18ff6d]/10 px-3 py-3 text-sm font-bold text-[#18ff6d] transition hover:bg-[#18ff6d] hover:text-black sm:px-6 sm:text-base"
              >
                {t.navbar.login}
              </Link>
            )}
          </div>
        </div>
      </div>

      {mobileNavOpen && (
        <div className="border-t border-[#18ff6d22] bg-black/95 px-3 py-4 lg:hidden sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition hover:bg-[#18ff6d]/10 ${
                  pathname === link.href
                    ? "bg-[#18ff6d]/10 text-[#18ff6d]"
                    : "text-[#D8D8D8]"
                }`}
              >
                {link.title}
              </Link>
            ))}

            {!email && (
              <Link
                href={loginHref}
                className="mt-2 rounded-2xl border border-[#18ff6d55] bg-[#18ff6d]/10 px-4 py-3 text-center text-sm font-bold text-[#18ff6d]"
              >
                {t.navbar.login}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
