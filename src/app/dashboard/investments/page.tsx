"use client";

import Link from "next/link";
import { Building2, Landmark, PieChart, ReceiptText, ShieldCheck } from "lucide-react";
import { useLang } from "@/lib/i18n";

const cards = [
  {
    icon: Building2,
    label: { bn: "প্রজেক্টে বিনিয়োগ", en: "Invest in projects" },
    desc: { bn: "চলমান প্রজেক্টগুলো দেখুন ও বিনিয়োগ করুন।", en: "Browse running projects and invest." },
    href: "/projects",
    color: "#2ed573",
  },
  {
    icon: Landmark,
    label: { bn: "আমার বিনিয়োগ", en: "My investments" },
    desc: { bn: "আপনার সব বিনিয়োগের তালিকা দেখুন।", en: "View all your investment records." },
    href: "/dashboard/my-investments",
    color: "#1e90ff",
  },
  {
    icon: ShieldCheck,
    label: { bn: "আমার শেয়ার", en: "My shares" },
    desc: { bn: "আপনার শেয়ার পোর্টফোলিও দেখুন।", en: "View your share portfolio." },
    href: "/dashboard/shares",
    color: "#ffa502",
  },
  {
    icon: PieChart,
    label: { bn: "লাভ ও ডিভিডেন্ড", en: "Profit & dividend" },
    desc: { bn: "প্রজেক্ট থেকে আপনার লাভ ও ডিভিডেন্ড।", en: "Your profits and dividends from projects." },
    href: "/dashboard/profits",
    color: "#ff4757",
  },
  {
    icon: ReceiptText,
    label: { bn: "পেমেন্ট ও স্টেটমেন্ট", en: "Payment & statement" },
    desc: { bn: "পেমেন্ট ইতিহাস ও স্টেটমেন্ট দেখুন।", en: "View payment history and statements." },
    href: "/dashboard/payments",
    color: "#747d8c",
  },
] as const;

export default function InvestmentsHubPage() {
  const { t } = useLang();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-9">
        <span className="text-sm font-semibold text-emerald-600">
          {t({ bn: "ইনভেস্টমেন্ট", en: "Investment" })}
        </span>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {t({ bn: "ইনভেস্টমেন্ট সেন্টার", en: "Investment Centre" })}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {t({
            bn: "প্রজেক্ট থেকে বিনিয়োগ, শেয়ার, লাভ, পেমেন্ট ও স্টেটমেন্ট এক জায়গায় দেখুন।",
            en: "Investments, shares, profits, payments, and statements — all in one place.",
          })}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-md"
            >
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition group-hover:scale-110"
                style={{ background: `${card.color}18`, color: card.color }}
              >
                <card.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-slate-800 transition group-hover:text-emerald-700">
                  {t(card.label)}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{t(card.desc)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
