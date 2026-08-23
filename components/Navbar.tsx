"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/components/LanguageProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import BrainStatsLogo from "@/components/BrainStatsLogo";
import {
  dispatchCloseOverlays,
  subscribeCloseOverlays,
} from "@/lib/overlayEvents";
import { ANALYZE_INPUT_MODE_KEY } from "@/lib/safeRedirect";

type UserPlan = "free" | "pro" | "elite";

type NavHighlight = "aiTips" | "valueBets";

type NavLinkItem = {
  title: string;
  href: string;
  highlight?: NavHighlight;
  cta?: boolean;
};

function navPath(href: string) {
  return href.split("?")[0];
}

function isNavActive(pathname: string, href: string) {
  const path = navPath(href);

  if (path === "/") {
    return pathname === "/";
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}

function getInitials(email: string) {
  const name = email.split("@")[0] || "";
  const parts = name.split(/[._-]+/).filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

function getPlanStyles(plan: UserPlan | null) {
  if (plan === "elite") {
    return {
      shell:
        "border-[#E8DCC8]/35 bg-[#0c0b09] shadow-[0_0_28px_rgba(232,220,200,.14)]",
      accent: "from-[#E8DCC8] via-[#f5ead8] to-[#c9b896]",
      avatarRing: "ring-[#E8DCC8]/55",
      badge: "border-[#E8DCC8]/35 bg-[#E8DCC8]/12 text-[#F5EAD8]",
      dot: "bg-[#E8DCC8]",
      menuAccent: "from-[#E8DCC8]/80 via-[#E8DCC8]/20 to-transparent",
    };
  }

  if (plan === "pro") {
    return {
      shell:
        "border-[#18ff6d]/35 bg-[#08110c] shadow-[0_0_28px_rgba(24,255,109,.12)]",
      accent: "from-[#18ff6d] via-[#7dffb0] to-[#2fbfff]",
      avatarRing: "ring-[#18ff6d]/45",
      badge: "border-[#18ff6d]/35 bg-[#18ff6d]/12 text-[#9dffc4]",
      dot: "bg-[#18ff6d]",
      menuAccent: "from-[#18ff6d]/80 via-[#18ff6d]/20 to-transparent",
    };
  }

  return {
    shell: "border-white/15 bg-[#0a0a0a] shadow-[0_0_20px_rgba(0,0,0,.35)]",
    accent: "from-[#666] via-[#888] to-[#555]",
    avatarRing: "ring-white/20",
    badge: "border-white/12 bg-white/6 text-[#B8B8B8]",
    dot: "bg-[#777]",
    menuAccent: "from-white/30 via-white/10 to-transparent",
  };
}

export default function Navbar() {
  const pathname = usePathname();
  const overlayId = useId();
  const [email, setEmail] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loginNext, setLoginNext] = useState(pathname || "/dashboard");
  const menuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    function syncAnalyzeLoginNext() {
      if (pathname !== "/analyze") {
        setLoginNext(pathname || "/dashboard");
        return;
      }

      const saved = sessionStorage.getItem(ANALYZE_INPUT_MODE_KEY);
      setLoginNext(saved === "image" ? "/analyze?mode=image" : "/analyze");
    }

    syncAnalyzeLoginNext();
    window.addEventListener("brainstats-analyze-mode", syncAnalyzeLoginNext);

    return () => {
      window.removeEventListener("brainstats-analyze-mode", syncAnalyzeLoginNext);
    };
  }, [pathname]);

  const loginHref =
    pathname && pathname !== "/login"
      ? `/login?next=${encodeURIComponent(loginNext)}`
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

    startAuth();

    return () => {
      cancelled = true;
      authSubscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
    setMenuOpen(false);
    setMoreMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    return subscribeCloseOverlays(overlayId, () => {
      setMenuOpen(false);
      setMoreMenuOpen(false);
    });
  }, [overlayId]);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  function toggleProfileMenu() {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }

    setMobileNavOpen(false);
    setMoreMenuOpen(false);
    dispatchCloseOverlays(overlayId);
    setMenuOpen(true);
  }

  function toggleMoreMenu() {
    if (moreMenuOpen) {
      setMoreMenuOpen(false);
      return;
    }

    setMobileNavOpen(false);
    setMenuOpen(false);
    dispatchCloseOverlays(overlayId);
    setMoreMenuOpen(true);
  }

  function toggleMobileNav() {
    const nextOpen = !mobileNavOpen;
    setMenuOpen(false);
    setMoreMenuOpen(false);
    dispatchCloseOverlays();

    if (nextOpen) {
      setMobileNavOpen(true);
      return;
    }

    setMobileNavOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }

      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setMoreMenuOpen(false);
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

  const primaryNavLinks: NavLinkItem[] = [
    { title: t.navbar.analyze, href: "/analyze?mode=image", cta: true },
    { title: t.navbar.builder, href: "/builder" },
    {
      title: t.navbar.aiTips,
      href: "/ai-tips",
      highlight: "aiTips",
    },
    {
      title: t.navbar.valueBets,
      href: "/value-bets",
      highlight: "valueBets",
    },
    { title: t.navbar.standings, href: "/standings" },
  ];

  const exploreNavLinks: NavLinkItem[] = [
    { title: t.navbar.home, href: "/" },
    { title: t.navbar.trackRecord, href: "/track-record" },
  ];

  const accountNavLinks: NavLinkItem[] = [
    { title: t.navbar.dashboard, href: "/dashboard" },
    { title: t.navbar.premium, href: "/premium" },
  ];

  const secondaryNavLinks = [...exploreNavLinks, ...accountNavLinks];

  function navLinkClass(
    link: NavLinkItem,
    active: boolean,
    compact = false
  ) {
    if (link.cta) {
      return active
        ? "brain-nav-cta brain-nav-cta-active"
        : "brain-nav-cta";
    }

    const base = compact
      ? "brain-nav-link px-3 py-2 text-sm"
      : "brain-nav-link";

    if (active) {
      return `${base} brain-nav-link-active`;
    }

    if (link.highlight === "aiTips") {
      return `${base} border-[#E8DCC8]/25 text-[#E8DCC8] hover:border-[#E8DCC8]/45 hover:bg-[#18ff6d]/10`;
    }

    if (link.highlight === "valueBets") {
      return `${base} border-[#72d5ff]/25 text-[#72d5ff] hover:border-[#72d5ff]/45 hover:bg-[#2fbfff]/10`;
    }

    return `${base} text-[#D8D8D8] hover:border-[#18ff6d]/35 hover:bg-[#18ff6d]/8 hover:text-[#18ff6d]`;
  }

  function renderNavLink(link: NavLinkItem, compact = false) {
    const active = isNavActive(pathname, link.href);

    return (
      <Link
        key={link.href}
        href={link.href}
        className={navLinkClass(link, active, compact)}
      >
        {link.title}
      </Link>
    );
  }
  const memberBadgeLabel =
    userPlan === "elite"
      ? t.navbar.planElite
      : userPlan === "pro"
        ? t.navbar.planPro
        : t.navbar.memberBadge;

  const planStyles = getPlanStyles(userPlan);

  const profileMenuLinks = accountNavLinks;

  const moreMenuActive = secondaryNavLinks.some((link) =>
    isNavActive(pathname, link.href)
  );

  return (
    <nav className="app-navbar brain-navbar relative px-4 py-3 text-[#FAFAF8] sm:px-8 sm:py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <BrainStatsLogo variant="nav" />
          <span className="hidden min-w-0 flex-col lg:flex">
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#18ff6d]/75 transition group-hover:text-[#18ff6d]">
              {t.navbar.footballIntelligence}
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-1.5 xl:gap-2 lg:flex">
          {primaryNavLinks.map((link) => renderNavLink(link))}

          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={toggleMoreMenu}
              aria-expanded={moreMenuOpen}
              aria-haspopup="menu"
              className={`brain-nav-link inline-flex items-center gap-1.5 ${
                moreMenuActive ? "brain-nav-link-active" : "text-[#D8D8D8] hover:border-[#18ff6d]/35 hover:bg-[#18ff6d]/8 hover:text-[#18ff6d]"
              }`}
            >
              {t.navbar.more}
              <svg
                aria-hidden
                viewBox="0 0 20 20"
                className={`h-3.5 w-3.5 transition ${moreMenuOpen ? "rotate-180" : ""}`}
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {moreMenuOpen ? (
              <div className="app-dropdown-layer absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1410]/95 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                <div className="h-1 bg-gradient-to-r from-[#18ff6d]/70 via-[#2fbfff]/40 to-transparent" />
                <div className="p-2">
                  <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#777]">
                    {t.navbar.navGroupExplore}
                  </p>
                  {exploreNavLinks.map((link) => {
                    const active = isNavActive(pathname, link.href);

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`block rounded-xl px-3 py-2.5 text-sm transition ${
                          active
                            ? "bg-[#18ff6d]/12 text-[#18ff6d]"
                            : "text-[#D8D8D8] hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {link.title}
                      </Link>
                    );
                  })}

                  <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#777]">
                    {t.navbar.navGroupAccount}
                  </p>
                  {accountNavLinks.map((link) => {
                    const active = isNavActive(pathname, link.href);

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`block rounded-xl px-3 py-2.5 text-sm transition ${
                          active
                            ? "bg-[#18ff6d]/12 text-[#18ff6d]"
                            : "text-[#D8D8D8] hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {link.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleMobileNav}
            className="rounded-2xl border border-[#18ff6d33] bg-[#0a1612]/90 px-3 py-3 text-[#18ff6d] transition hover:border-[#18ff6d88] hover:bg-[#18ff6d]/10 lg:hidden"
            aria-expanded={mobileNavOpen}
            aria-label={mobileNavOpen ? t.navbar.menuClose : t.navbar.menuOpen}
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {mobileNavOpen ? (
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <>
                  <path strokeLinecap="round" d="M4 7h16" />
                  <path strokeLinecap="round" d="M4 12h16" />
                  <path strokeLinecap="round" d="M4 17h16" />
                </>
              )}
            </svg>
          </button>

          <LanguageSwitcher />

          <div className="relative" ref={menuRef}>
            {email ? (
              <>
                <button
                  type="button"
                  onClick={toggleProfileMenu}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className={`group relative flex items-center gap-2 overflow-hidden rounded-full border py-1 pl-1 pr-2.5 transition hover:brightness-110 sm:gap-2.5 sm:pr-3 ${planStyles.shell}`}
                >
                  <span
                    className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${planStyles.accent}`}
                  />

                  <span
                    className={`relative ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#111111] text-xs font-semibold tracking-wide text-[#F5EAD8] ring-1 ring-inset ${planStyles.avatarRing}`}
                  >
                    {getInitials(email)}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0a0a0a] ${planStyles.dot}`}
                    />
                  </span>

                  <span className="min-w-0">
                    <span className="block max-w-[6.5rem] truncate text-left text-xs font-medium text-white">
                      {email.split("@")[0]}
                    </span>
                    <span
                      className={`mt-0.5 inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] ${planStyles.badge}`}
                    >
                      {memberBadgeLabel}
                    </span>
                  </span>

                  <svg
                    aria-hidden
                    viewBox="0 0 20 20"
                    className={`h-3.5 w-3.5 shrink-0 text-[#888] transition group-hover:text-[#E8DCC8] ${
                      menuOpen ? "rotate-180" : ""
                    }`}
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="app-dropdown-layer absolute right-0 mt-3 w-[min(16rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0b]/95 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                    <div
                      className={`h-1 bg-gradient-to-r ${planStyles.menuAccent}`}
                    />

                    <div className="border-b border-white/8 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#141414] text-xs font-semibold text-[#E8DCC8] ring-1 ring-inset ${planStyles.avatarRing}`}
                        >
                          {getInitials(email)}
                        </span>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {email.split("@")[0]}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-[#777]">
                            {email}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${planStyles.badge}`}
                      >
                        {memberBadgeLabel}
                      </span>
                    </div>

                    <div className="p-2">
                      {profileMenuLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="block rounded-xl px-3 py-2.5 text-sm text-[#D8D8D8] transition hover:bg-white/5 hover:text-white"
                        >
                          {link.title}
                        </Link>
                      ))}

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-sm text-[#A9A9A9] transition hover:bg-white/5 hover:text-red-300"
                      >
                        {t.navbar.logout}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Link
                href={loginHref}
                className="inline-flex items-center gap-2 rounded-full border border-[#E8DCC8]/30 bg-[#0a0a0a] px-3 py-2 text-sm font-medium text-[#F5EAD8] shadow-[0_0_24px_rgba(232,220,200,.08)] transition hover:border-[#E8DCC8]/50 hover:bg-[#111111]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E8DCC8]/25 bg-[#141414] text-[10px] font-bold tracking-wider text-[#E8DCC8]">
                  BS
                </span>
                <span>{pathname === "/" ? t.navbar.memberArea : t.navbar.login}</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {mobileNavOpen && (
        <>
          <button
            type="button"
            aria-label={t.navbar.menuClose}
            onClick={() => setMobileNavOpen(false)}
            className="app-nav-overlay fixed inset-0 bg-black/70 lg:hidden"
          />

          <div className="app-nav-overlay relative border-t border-[#18ff6d]/15 bg-[#071210]/98 px-4 py-4 lg:hidden sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4">
            <Link
              href="/analyze?mode=image"
              className={`flex w-full items-center justify-center rounded-2xl py-3.5 text-sm font-bold transition ${
                isNavActive(pathname, "/analyze?mode=image")
                  ? "brain-nav-cta brain-nav-cta-active"
                  : "brain-nav-cta"
              }`}
            >
              {t.navbar.analyze}
            </Link>

            <div>
              <p className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#777]">
                {t.navbar.navGroupTools}
              </p>
              <div className="mt-2 flex flex-col gap-1">
                {primaryNavLinks
                  .filter((link) => !link.cta)
                  .map((link) => {
                    const active = isNavActive(pathname, link.href);

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                          active
                            ? "bg-[#18ff6d]/12 text-[#18ff6d]"
                            : link.highlight === "aiTips"
                              ? "text-[#E8DCC8] hover:bg-[#18ff6d]/8"
                              : link.highlight === "valueBets"
                                ? "text-[#72d5ff] hover:bg-[#2fbfff]/10"
                                : "text-[#D8D8D8] hover:bg-white/5"
                        }`}
                      >
                        {link.title}
                      </Link>
                    );
                  })}
              </div>
            </div>

            <div>
              <p className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#777]">
                {t.navbar.navGroupExplore}
              </p>
              <div className="mt-2 flex flex-col gap-1">
                {exploreNavLinks.map((link) => {
                  const active = isNavActive(pathname, link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        active
                          ? "bg-[#18ff6d]/12 text-[#18ff6d]"
                          : "text-[#D8D8D8] hover:bg-white/5"
                      }`}
                    >
                      {link.title}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#777]">
                {t.navbar.navGroupAccount}
              </p>
              <div className="mt-2 flex flex-col gap-1">
                {accountNavLinks.map((link) => {
                  const active = isNavActive(pathname, link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        active
                          ? "bg-[#18ff6d]/12 text-[#18ff6d]"
                          : "text-[#D8D8D8] hover:bg-white/5"
                      }`}
                    >
                      {link.title}
                    </Link>
                  );
                })}
              </div>
            </div>

            {!email && (
              <Link
                href={loginHref}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E8DCC8]/30 bg-[#0a0a0a] px-4 py-3 text-sm font-medium text-[#F5EAD8] transition hover:border-[#E8DCC8]/50 hover:bg-[#111111]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E8DCC8]/25 bg-[#141414] text-[10px] font-bold tracking-wider text-[#E8DCC8]">
                  BS
                </span>
                <span>{pathname === "/" ? t.navbar.memberArea : t.navbar.login}</span>
              </Link>
            )}
          </div>
        </div>
        </>
      )}
    </nav>
  );
}
