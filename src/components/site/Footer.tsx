"use client";

import Link from "next/link";
import { ArrowRight, Globe, Link as LinkIcon, Mail, MapPin, Phone, Play } from "lucide-react";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { Logo } from "./Logo";
import { NAV_LINKS } from "./Navbar";

export function Footer() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <footer className="relative overflow-hidden bg-ink-950 text-white">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-5 pb-8 pt-20 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Logo />
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/60">
              {t({
                bn: "প্রজেক্টের শেয়ার কেনা, ট্র্যাক করা এবং বাড়ানোর জন্য একটি স্বচ্ছ ও নিরাপদ প্ল্যাটফর্ম। আপনার প্রতিটি শেয়ার, প্রতিটি কিস্তি — সবকিছু এক জায়গায়।",
                en: "A transparent and secure platform to buy, track and grow project shares. Every share, every instalment — in one place.",
              })}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email.trim()) setDone(true);
              }}
              className="mt-7 flex max-w-md items-center gap-2 rounded-full bg-white/[0.06] p-1.5 ring-1 ring-white/10 focus-within:ring-emerald-400/60"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setDone(false);
                }}
                placeholder={t({ bn: "আপনার ইমেইল", en: "Your email" })}
                className="min-w-0 flex-1 bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/40"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-emerald-300"
              >
                {done ? t({ bn: "ধন্যবাদ ✓", en: "Thanks ✓" }) : t({ bn: "সাবস্ক্রাইব", en: "Subscribe" })}
                {!done && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                {t({ bn: "মেনু", en: "Menu" })}
              </h4>
              <ul className="mt-5 space-y-3 text-sm">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-white/70 transition hover:text-emerald-300">
                      {t(l.label)}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/login" className="text-white/70 transition hover:text-emerald-300">
                    {t({ bn: "লগইন", en: "Login" })}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                {t({ bn: "প্ল্যাটফর্ম", en: "Platform" })}
              </h4>
              <ul className="mt-5 space-y-3 text-sm text-white/70">
                <li>{t({ bn: "শেয়ার অ্যাসাইনমেন্ট", en: "Share assignment" })}</li>
                <li>{t({ bn: "কালেকশন রিপোর্ট", en: "Collection reports" })}</li>
                <li>{t({ bn: "পেনাল্টি ও পয়েন্ট", en: "Penalty & points" })}</li>
                <li>{t({ bn: "বিনিয়োগকারী ড্যাশবোর্ড", en: "Investor dashboard" })}</li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                {t({ bn: "যোগাযোগ", en: "Contact" })}
              </h4>
              <ul className="mt-5 space-y-3.5 text-sm text-white/70">
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  {t({ bn: "গুলশান-২, ঢাকা ১২১২", en: "Gulshan-2, Dhaka 1212" })}
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-emerald-300" />
                  <span dir="ltr">+880 1700-000000</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-emerald-300" />
                  hello@shareproject.com
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-5 border-t border-white/10 pt-7 text-xs text-white/45 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Share Project.{" "}
            {t({ bn: "সর্বস্বত্ব সংরক্ষিত।", en: "All rights reserved." })}
          </p>
          <div className="flex items-center gap-3">
            {[Globe, LinkIcon, Play].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="social"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.06] text-white/70 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-emerald-400 hover:text-ink-950"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
