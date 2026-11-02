"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Bell, ChevronDown, Command, LogOut, Menu, Search, Settings, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { LangSwitch } from "@/components/site/LangSwitch";
import { clearStoredTokens, getStoredUser, type StoredUser } from "@/lib/admin-auth/adminAuthStorage";
import { findTitle } from "./sidebar-data";

function useClickAway<T extends HTMLElement>(onAway: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onAway();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onAway]);
  return ref;
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { t } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [menu, setMenu] = useState<"user" | "bell" | null>(null);
  const awayRef = useClickAway<HTMLDivElement>(() => setMenu(null));

  useEffect(() => setUser(getStoredUser()), []);

  const title = findTitle(pathname);
  const name = user?.name || user?.username || "Admin";
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  const logout = () => {
    clearStoredTokens();
    router.replace("/login");
  };

  const notes = [
    { c: "bg-emerald-400", text: { bn: "নতুন শেয়ার অ্যাসাইন সম্পন্ন হয়েছে", en: "A new share assignment was completed" }, time: { bn: "২ মিনিট আগে", en: "2 min ago" } },
    { c: "bg-amber-400", text: { bn: "৫টি কিস্তি আগামীকাল ডিউ", en: "5 instalments are due tomorrow" }, time: { bn: "১ ঘণ্টা আগে", en: "1 hour ago" } },
    { c: "bg-sky-400", text: { bn: "মাসিক কালেকশন রিপোর্ট প্রস্তুত", en: "Monthly collection report is ready" }, time: { bn: "গতকাল", en: "Yesterday" } },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-xl sm:px-6">
      <button onClick={onMenu} aria-label="Menu" className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden min-w-0 sm:block">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{t({ bn: "ওয়ার্কস্পেস", en: "Workspace" })}</p>
        <h1 className="truncate text-base font-bold text-slate-900">{title ? t(title) : t({ bn: "ড্যাশবোর্ড", en: "Dashboard" })}</h1>
      </div>

      <div className="relative mx-auto hidden w-full max-w-md md:block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          placeholder={t({ bn: "শেয়ার, প্রজেক্ট বা হোল্ডার খুঁজুন…", en: "Search shares, projects or holders…" })}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-16 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
        />
        <kbd className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </div>

      <div ref={awayRef} className="ml-auto flex items-center gap-2 sm:gap-3">
        <LangSwitch id="dash-lang" tone="light" />

        <div className="relative">
          <button onClick={() => setMenu(menu === "bell" ? null : "bell")} aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>
          <AnimatePresence>
            {menu === "bell" && (
              <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} className="absolute right-0 mt-3 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-900">{t({ bn: "নোটিফিকেশন", en: "Notifications" })}</div>
                {notes.map((n, i) => (
                  <div key={i} className="flex gap-3 px-4 py-3 transition hover:bg-slate-50">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.c}`} />
                    <div>
                      <p className="text-sm text-slate-700">{t(n.text)}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{t(n.time)}</p>
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/notifications" onClick={() => setMenu(null)} className="block border-t border-slate-100 px-4 py-3 text-center text-xs font-semibold text-emerald-600 hover:bg-slate-50">
                  {t({ bn: "সব নোটিফিকেশন", en: "View all notifications" })}
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button onClick={() => setMenu(menu === "user" ? null : "user")} className="flex items-center gap-2.5 rounded-2xl py-1 pl-1 pr-2 transition hover:bg-slate-100">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-sky-500 text-xs font-bold text-white">{initials || "A"}</span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block max-w-[120px] truncate text-sm font-semibold text-slate-900">{name}</span>
              <span className="block text-[11px] text-slate-400">{user?.role || "Admin"}</span>
            </span>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </button>
          <AnimatePresence>
            {menu === "user" && (
              <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl">
                <div className="px-3 py-2.5">
                  <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
                  <p className="truncate text-xs text-slate-400">{user?.email || ""}</p>
                </div>
                <div className="my-1 h-px bg-slate-100" />
                <Link href="/dashboard/profile" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"><UserRound className="h-4 w-4" />{t({ bn: "প্রোফাইল", en: "Profile" })}</Link>
                <Link href="/dashboard/kyc" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"><Settings className="h-4 w-4" />{t({ bn: "KYC যাচাই", en: "KYC verification" })}</Link>
                <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50"><LogOut className="h-4 w-4" />{t({ bn: "লগআউট", en: "Log out" })}</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
