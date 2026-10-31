"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, LogIn, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLang, type Bi } from "@/lib/i18n";
import { Logo } from "./Logo";
import { LangSwitch } from "./LangSwitch";

export const NAV_LINKS: { href: string; label: Bi }[] = [
  { href: "/", label: { bn: "হোম", en: "Home" } },
  { href: "/features", label: { bn: "ফিচার", en: "Features" } },
  { href: "/about", label: { bn: "আমাদের সম্পর্কে", en: "About" } },
  { href: "/contact", label: { bn: "যোগাযোগ", en: "Contact" } },
];

export function Navbar() {
  const pathname = usePathname();
  const { t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-white/10 bg-ink-950/75 py-2.5 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent py-4"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8">
        <Logo />

        {/* desktop menu */}
        <ul className="relative hidden items-center gap-1 rounded-full bg-white/[0.06] p-1 ring-1 ring-white/10 md:flex">
          {NAV_LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`relative block rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active ? "text-ink-950" : "text-white/75 hover:text-white"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-0 rounded-full bg-white"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{t(l.label)}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <LangSwitch id="nav-lang" />
          </div>
          <Link
            href="/login"
            className="group relative hidden items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-lg shadow-emerald-500/25 transition-transform hover:scale-[1.03] active:scale-95 sm:inline-flex"
          >
            <LogIn className="h-4 w-4" />
            {t({ bn: "লগইন", en: "Login" })}
            <span className="absolute inset-0 -translate-x-full bg-white/30 skew-x-12 transition-transform duration-700 group-hover:translate-x-full" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-3 top-[68px] z-50 rounded-3xl border border-white/10 bg-ink-900/95 p-4 shadow-2xl backdrop-blur-2xl md:hidden"
          >
            <ul className="space-y-1">
              {NAV_LINKS.map((l, i) => {
                const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
                return (
                  <motion.li
                    key={l.href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                  >
                    <Link
                      href={l.href}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-base font-medium ${
                        active ? "bg-white text-ink-950" : "text-white/85 hover:bg-white/5"
                      }`}
                    >
                      {t(l.label)}
                      <ArrowUpRight className="h-4 w-4 opacity-60" />
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <LangSwitch id="nav-lang-m" />
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 px-5 py-2.5 text-sm font-semibold text-ink-950"
              >
                <LogIn className="h-4 w-4" />
                {t({ bn: "লগইন", en: "Login" })}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
