"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setEmail(session?.user?.email || null);
    }

    loadUser();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email || null);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setEmail(null);
    window.location.href = "/";
  }

  const navLinks = [
    { title: "Startsida", href: "/" },
    { title: "Builder", href: "/builder" },
    { title: "Dashboard", href: "/dashboard" },
    { title: "Premium", href: "/premium" },
  ];

  return (
    <nav className="border-b border-[#18ff6d22] bg-black/35 px-8 py-5 text-[#FAFAF8] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#18ff6d44] bg-[#18ff6d]/10 shadow-[0_0_30px_rgba(24,255,109,.25)]">
            🧠
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight">
              BrainStats
            </h1>
            <p className="text-xs text-[#18ff6d]">Football Intelligence</p>
          </div>
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-transparent px-5 py-3 text-base font-semibold text-[#D8D8D8] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#18ff6d55] hover:bg-[#18ff6d]/10 hover:text-[#18ff6d] hover:shadow-[0_0_30px_rgba(24,255,109,.18)]"
            >
              {link.title}
            </Link>
          ))}
        </div>

        <div className="relative" ref={menuRef}>
          {email ? (
            <>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-3 rounded-2xl border border-[#18ff6d33] bg-[#121212]/80 px-5 py-3 font-semibold text-white shadow-[0_0_30px_rgba(24,255,109,.12)] transition hover:-translate-y-0.5 hover:border-[#18ff6d88] hover:bg-[#18ff6d]/10"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-[#18ff6d] to-[#2fbfff] text-black">
                  👤
                </span>
                <span>{email.split("@")[0]}</span>
                <span className="text-[#18ff6d]">▼</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 z-50 mt-4 w-64 rounded-3xl border border-[#18ff6d33] bg-[#101010]/95 p-3 shadow-[0_0_60px_rgba(24,255,109,.18)] backdrop-blur-xl">
                  <div className="rounded-2xl bg-[#18ff6d]/10 p-4">
                    <p className="text-xs text-[#A9A9A9]">Inloggad som</p>
                    <p className="mt-1 truncate font-bold text-[#18ff6d]">
                      {email}
                    </p>
                  </div>

                  <div className="mt-3 space-y-2">
                    <Link href="/dashboard" className="block rounded-2xl px-4 py-3 hover:bg-white/5">
                      📊 Dashboard
                    </Link>
                    <Link href="/builder" className="block rounded-2xl px-4 py-3 hover:bg-white/5">
                      ⚽ Builder
                    </Link>
                    <Link href="/premium" className="block rounded-2xl px-4 py-3 hover:bg-white/5">
                      💎 Premium
                    </Link>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="mt-3 w-full rounded-2xl border border-red-500/40 px-4 py-3 text-left text-red-400 transition hover:bg-red-500 hover:text-white"
                  >
                    🚪 Logga ut
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-2xl border border-[#18ff6d55] bg-[#18ff6d]/10 px-6 py-3 font-bold text-[#18ff6d] transition hover:bg-[#18ff6d] hover:text-black"
            >
              Logga in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}