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

type UserPlan = "free" | "pro" | "elite";

function getInitials(email: string) {
  const name = email.split("@")[0] || "";
  const parts = name.split(/[._-]+/).filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

export default function Navbar() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [email, setEmail] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
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

      if (cancelled) {
        return;
      }

      setEmail(session?.user?.email || null);

      if (!session?.user?.id) {
        setUserPlan(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", session.user.id)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      const plan = profile?.plan;

      setUserPlan(
        plan === "free" || plan === "pro" || plan === "elite" ? plan : "free"
      );
    }

    function startAuth() {
      void loadUser();

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setEmail(session?.user?.email || null);

        if (!session?.user?.id) {
          setUserPlan(null);
          return;
        }

        void supabase
          .from("profiles")
          .select("plan")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            const plan = profile?.plan;

            setUserPlan(
              plan === "free" || plan === "pro" || plan === "elite"
                ? plan
                : "free"
            );
          });
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
    setUserPlan(null);
    window.location.href = "/";
  }

  const navLinks = [
    { title: t.navbar.home, href: "/" },
    { title: t.navbar.analyze, href: "/analyze" },
    { title: t.navbar.builder, href: "/builder" },
    { title: t.navbar.aiTips, href: "/dashboard#ai-tips", highlight: true },
    { title: t.navbar.dashboard, href: "/dashboard" },
    { title: t.navbar.premium, href: "/premium" },
    { title: t.navbar.legal, href: "/legal" },
  ];

  const memberBadgeLabel =
    userPlan === "elite"
      ? t.navbar.planElite
      : userPlan === "pro"
        ? t.navbar.planPro
        : t.navbar.memberBadge;

  const profileButtonClass = isHomePage
    ? "flex items-center gap-2.5 rounded-[15px] bg-[#0a0a0a] px-3 py-2.5 font-semibold text-white transition hover:bg-[#111111] sm:px-4 sm:py-3"
    : "flex items-center gap-2 rounded-2xl border border-[#18ff6d33] bg-[#121212]/80 px-3 py-3 font-semibold text-white shadow-[0_0_30px_rgba(24,255,109,.12)] transition hover:border-[#18ff6d88] hover:bg-[#18ff6d]/10 sm:px-5";

  const avatarClass = isHomePage
    ? "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#18ff6d] via-[#E8DCC8] to-[#2fbfff] text-xs font-black tracking-wide text-black shadow-[0_0_24px_rgba(232,220,200,.35)]"
    : "flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-[#18ff6d] to-[#2fbfff] text-black";

  const loginLinkClass = isHomePage
    ? "relative inline-flex items-center gap-2 overflow-hidden rounded-[15px] bg-[#0a0a0a] px-4 py-3 text-sm font-bold text-[#E8DCC8] transition hover:bg-[#111111] sm:px-6 sm:text-base"
    : "rounded-2xl border border-[#18ff6d55] bg-[#18ff6d]/10 px-3 py-3 text-sm font-bold text-[#18ff6d] transition hover:bg-[#18ff6d] hover:text-black sm:px-6 sm:text-base";

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
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
                link.highlight
                  ? "border-[#E8DCC8]/30 bg-gradient-to-r from-[#18ff6d]/10 via-[#E8DCC8]/10 to-[#2fbfff]/10 text-[#E8DCC8] hover:border-[#E8DCC8]/50 hover:bg-[#18ff6d]/15"
                  : "border-transparent text-[#D8D8D8] hover:border-[#18ff6d55] hover:bg-[#18ff6d]/10 hover:text-[#18ff6d]"
              }`}
            >
              {link.highlight ? "🎯 " : ""}
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
                {isHomePage ? (
                  <div className="navbar-profile-exclusive rounded-2xl p-[1px] shadow-[0_0_40px_rgba(232,220,200,.12)]">
                    <button
                      type="button"
                      onClick={() => setMenuOpen(!menuOpen)}
                      className={profileButtonClass}
                    >
                      <span className={avatarClass}>
                        {getInitials(email)}
                      </span>

                      <span className="hidden min-w-0 sm:block">
                        <span className="block max-w-28 truncate text-sm text-white">
                          {email.split("@")[0]}
                        </span>
                        <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.22em] text-[#E8DCC8]">
                          {memberBadgeLabel}
                        </span>
                      </span>

                      <span className="hidden text-[#E8DCC8]/80 sm:inline">
                        ▼
                      </span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className={profileButtonClass}
                  >
                    <span className={avatarClass}>👤</span>

                    <span className="hidden max-w-28 truncate sm:inline">
                      {email.split("@")[0]}
                    </span>

                    <span className="hidden text-[#18ff6d] sm:inline">▼</span>
                  </button>
                )}

                {menuOpen && (
                  <div
                    className={`absolute right-0 z-[90] mt-4 w-[min(18rem,calc(100vw-1.5rem))] rounded-3xl border p-3 max-md:backdrop-blur-none backdrop-blur-xl ${
                      isHomePage
                        ? "border-[#E8DCC8]/25 bg-[#0b0b0b] shadow-[0_0_80px_rgba(232,220,200,.16)]"
                        : "border-[#18ff6d33] bg-[#101010] shadow-[0_0_60px_rgba(24,255,109,.18)]"
                    }`}
                  >
                    <div
                      className={`rounded-2xl p-4 ${
                        isHomePage
                          ? "border border-[#E8DCC8]/15 bg-gradient-to-br from-[#18ff6d]/10 via-[#E8DCC8]/5 to-[#2fbfff]/10"
                          : "bg-[#18ff6d]/10"
                      }`}
                    >
                      <p className="text-xs text-[#A9A9A9]">
                        {t.navbar.loggedInAs}
                      </p>

                      <p
                        className={`mt-1 truncate font-bold ${
                          isHomePage ? "text-[#E8DCC8]" : "text-[#18ff6d]"
                        }`}
                      >
                        {email}
                      </p>

                      {isHomePage ? (
                        <span className="mt-2 inline-flex rounded-full border border-[#E8DCC8]/25 bg-black/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#E8DCC8]">
                          {memberBadgeLabel}
                        </span>
                      ) : null}
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
            ) : isHomePage ? (
              <div className="navbar-profile-exclusive rounded-2xl p-[1px] shadow-[0_0_40px_rgba(232,220,200,.12)]">
                <Link href={loginHref} className={loginLinkClass}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#18ff6d] via-[#E8DCC8] to-[#2fbfff] text-sm text-black">
                    💎
                  </span>
                  <span>{t.navbar.memberArea}</span>
                </Link>
              </div>
            ) : (
              <Link href={loginHref} className={loginLinkClass}>
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
                  pathname === link.href ||
                  (link.href.includes("#") &&
                    pathname === link.href.split("#")[0])
                    ? "bg-[#18ff6d]/10 text-[#18ff6d]"
                    : link.highlight
                      ? "text-[#E8DCC8]"
                      : "text-[#D8D8D8]"
                }`}
              >
                {link.highlight ? "🎯 " : ""}
                {link.title}
              </Link>
            ))}

            {!email && (
              <Link
                href={loginHref}
                className={`mt-2 rounded-2xl px-4 py-3 text-center text-sm font-bold ${
                  isHomePage
                    ? "border border-[#E8DCC8]/25 bg-gradient-to-r from-[#18ff6d]/10 via-[#E8DCC8]/10 to-[#2fbfff]/10 text-[#E8DCC8]"
                    : "border border-[#18ff6d55] bg-[#18ff6d]/10 text-[#18ff6d]"
                }`}
              >
                {isHomePage ? `💎 ${t.navbar.memberArea}` : t.navbar.login}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
