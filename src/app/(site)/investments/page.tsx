"use client";

import Link from "next/link";
import { Landmark, PieChart, ReceiptText, ShieldCheck, WalletCards } from "lucide-react";
import { useLang } from "@/lib/i18n";

export default function InvestmentMenuPage() {
  const { t } = useLang();
  const items = [
    { href: "/projects", icon: PieChart, bn: "প্রজেক্টে বিনিয়োগ", en: "Invest in projects" },
    { href: "/dashboard/investments", icon: Landmark, bn: "আমার বিনিয়োগ", en: "My investments" },
    { href: "/dashboard/shares", icon: ShieldCheck, bn: "আমার শেয়ার", en: "My shares" },
    { href: "/dashboard/profits", icon: WalletCards, bn: "লাভ ও ডিভিডেন্ড", en: "Profit & dividend" },
    { href: "/dashboard/payments", icon: ReceiptText, bn: "পেমেন্ট ও স্টেটমেন্ট", en: "Payments & statements" },
  ];
  return (
    <main className="bg-slate-50 pb-20 pt-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">{t({ bn: "ইনভেস্টমেন্ট", en: "Investment" })}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">{t({ bn: "ইনভেস্টমেন্ট সেন্টার", en: "Investment center" })}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">{t({ bn: "প্রজেক্ট থেকে বিনিয়োগ, শেয়ার, লাভ, পেমেন্ট ও স্টেটমেন্ট এক জায়গায় দেখুন।", en: "View projects, investments, shares, profit and payment records in one place." })}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Link key={item.href} href={item.href} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-emerald-200 hover:bg-emerald-50">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-slate-600 ring-1 ring-slate-200 group-hover:text-emerald-600"><item.icon className="h-5 w-5" /></span>
                <span className="font-bold text-slate-800">{t({ bn: item.bn, en: item.en })}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
