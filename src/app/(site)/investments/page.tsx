"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Building2,
  Calculator,
  CheckCircle2,
  Coins,
  FileCheck2,
  HelpCircle,
  Landmark,
  Lock,
  MapPin,
  Percent,
  PieChart,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { getPublicProjects, getPublicCategories, type ShareApiProject } from "@/lib/share-project-api";

export default function InvestmentMenuPage() {
  const { t, taka, num } = useLang();

  // Dynamic projects & categories
  const [projects, setProjects] = useState<ShareApiProject[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Dynamic ROI Calculator state
  const [calcAmount, setCalcAmount] = useState<number>(100000);
  const [calcReturnRate, setCalcReturnRate] = useState<number>(16);
  const [calcYears, setCalcYears] = useState<number>(3);

  useEffect(() => {
    Promise.all([
      getPublicProjects(1, 4).catch(() => ({ data: [] })),
      getPublicCategories().catch(() => []),
    ])
      .then(([projRes, catRes]) => {
        setProjects(projRes.data || []);
        setCategories(catRes || []);
      })
      .finally(() => setLoadingProjects(false));
  }, []);

  // ROI calculations
  const annualProfit = useMemo(() => (calcAmount * calcReturnRate) / 100, [calcAmount, calcReturnRate]);
  const monthlyProfit = useMemo(() => Math.round(annualProfit / 12), [annualProfit]);
  const totalMaturityReturn = useMemo(() => Math.round(calcAmount + annualProfit * calcYears), [calcAmount, annualProfit, calcYears]);

  // Fallback demo projects if none returned by API
  // const displayProjects = projects.length > 0 ? projects : [
  //   {
  //     uuid: "sample-1",
  //     name: "Riverfront Business Center",
  //     location: "Gulshan-2, Dhaka",
  //     pricePerShare: 25000,
  //     totalShares: 100,
  //     expectedAnnualReturn: 18.5,
  //     thumbnailUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85",
  //     category: { id: 1, name: "Commercial" },
  //   },
  //   {
  //     uuid: "sample-2",
  //     name: "Pinecrest Eco Resort & Villas",
  //     location: "Sreemangal, Sylhet",
  //     pricePerShare: 35000,
  //     totalShares: 80,
  //     expectedAnnualReturn: 21.0,
  //     thumbnailUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85",
  //     category: { id: 2, name: "Resort & Hotel" },
  //   },
  //   {
  //     uuid: "sample-3",
  //     name: "Smart Logistics & Tech Park",
  //     location: "Gazipur, Dhaka",
  //     pricePerShare: 15000,
  //     totalShares: 200,
  //     expectedAnnualReturn: 16.0,
  //     thumbnailUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=85",
  //     category: { id: 3, name: "Industrial" },
  //   },
  // ];

  // Core navigation items
  const items = [
    {
      href: "/projects",
      icon: PieChart,
      color: "from-emerald-500 to-teal-600",
      badge: { bn: "লাইভ প্রজেক্ট", en: "Live Projects" },
      bn: "প্রজেক্টে বিনিয়োগ",
      en: "Invest in Projects",
      desc: { bn: "চলমান লাভজনক প্রকল্পসমূহ ব্রাউজ করুন ও শেয়ার কিনুন।", en: "Browse verified high-yield projects and acquire shares." },
    },
    {
      href: "/my-investments",
      icon: Landmark,
      color: "from-sky-500 to-blue-600",
      badge: { bn: "নো লগইন পাবলিক", en: "No Login Public" },
      bn: "আমার বিনিয়োগ",
      en: "My Investments",
      desc: { bn: "লগইন ছাড়াই আপনার সকল ইনভেস্টমেন্ট ট্র্যাক ও ভেরিফাই করুন।", en: "Track and verify all your investment records without login." },
    },
    {
      href: "/my-shares",
      icon: ShieldCheck,
      color: "from-indigo-500 to-purple-600",
      badge: { bn: "পোর্টফোলিও", en: "Portfolio" },
      bn: "আমার শেয়ার",
      en: "My Shares",
      desc: { bn: "আপনার অর্জিত শেয়ার সংখ্যা, মূল্য ও বর্তমান স্থিতি দেখুন।", en: "View your accumulated shares, valuation, and live status." },
    },
    {
      href: "/dashboard/profits",
      icon: WalletCards,
      color: "from-amber-500 to-orange-600",
      badge: { bn: "ডিভিডেন্ড", en: "Dividends" },
      bn: "লাভ ও ডিভিডেন্ড",
      en: "Profit & Dividend",
      desc: { bn: "ত্রৈমাসিক ভাড়াভিত্তিক লাভ ও বাৎসরিক ক্যাপিটাল গ্রোথ।", en: "Quarterly rental payout and annual capital growth returns." },
    },
    {
      href: "/dashboard/payments",
      icon: ReceiptText,
      color: "from-rose-500 to-pink-600",
      badge: { bn: "লেনদেন", en: "Transactions" },
      bn: "পেমেন্ট ও স্টেটমেন্ট",
      en: "Payments & Statements",
      desc: { bn: "সকল জমার রশিদ, কিস্তির বিবরণ ও ডিজিটাল চালানপত্র।", en: "Complete payment history, installments, and invoices." },
    },
    {
      href: "/contact",
      icon: HelpCircle,
      color: "from-emerald-600 to-cyan-600",
      badge: { bn: "২৪/৭ সহায়তা", en: "24/7 Support" },
      bn: "ইনভেস্টর হেল্পডেস্ক",
      en: "Investor Support",
      desc: { bn: "বিনিয়োগ সংক্রান্ত যেকোনো আইনি বা আর্থিক পরামর্শ নিন।", en: "Get expert advice regarding property shares & legal deeds." },
    },
  ];

  return (
    <main className="bg-slate-50/60 pb-28 pt-24 sm:pt-28">
      {/* ───────────────── 1. HERO BANNER WITH IMAGE ───────────────── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[36px] border border-slate-200/90 bg-gradient-to-br from-white via-emerald-50/20 to-sky-50/30 text-slate-900 shadow-xl shadow-slate-200/40">
            {/* Background Image with Overlay (Light Mode) */}
            <div className="absolute inset-0 z-0">
              <Image
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=85"
                alt="Investment Center Hero"
                fill
                priority
                className="object-cover object-right sm:object-center opacity-15 mix-blend-multiply scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/40 via-transparent to-transparent pointer-events-none" />
            </div>

            <div className="relative z-10 p-8 sm:p-12 lg:p-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-4 py-1.5 text-xs font-bold text-emerald-800 shadow-sm backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                {t({ bn: "স্মার্ট ইনভেস্টমেন্ট পোর্টাল • রিয়েল এস্টেট কো-ওনারশিপ", en: "Smart Investment Portal • Real Estate Co-Ownership" })}
              </div>

              <h1 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.15] text-slate-900">
                {t({
                  bn: "আপনার ক্ষুদ্র সঞ্চয় রূপান্তর করুন লাভজনক মেগা প্রজেক্টে",
                  en: "Transform Small Savings into Profitable Commercial Assets",
                })}
              </h1>

              <p className="mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600">
                {t({
                  bn: "নিরাপদ যৌথ মালিকানা, নিয়মিত ভাড়াভিত্তিক রিটার্ন ও দীর্ঘমেয়াদী মূলধন বৃদ্ধি — প্রজেক্ট শেয়ারিং এখন আরও সহজ, আইনি ও সম্পূর্ণ স্বচ্ছ।",
                  en: "Secure fractional ownership, recurring rental yields, and strong capital appreciation — verified, legally backed, and transparent.",
                })}
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-600 hover:to-teal-700 hover:scale-[1.02] active:scale-95"
                >
                  <PieChart className="h-4 w-4" />
                  {t({ bn: "প্রজেক্টসমূহ দেখুন", en: "Browse Live Projects" })}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard/my-investments"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
                >
                  <Search className="h-4 w-4 text-emerald-600" />
                  {t({ bn: "আমার ইনভেস্টমেন্ট দেখুন", en: "My Investments Dashboard" })}
                </Link>
              </div>

              {/* Dynamic Stats Row (Light Mode) */}
              <div className="mt-12 grid grid-cols-2 gap-4 border-t border-slate-200/80 pt-8 sm:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t({ bn: "মোট প্রজেক্ট", en: "Active Projects" })}</p>
                  <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {loadingProjects ? "..." : projects.length > 0 ? `${projects.length}+` : "12+"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t({ bn: "গড় বার্ষিক রিটার্ন", en: "Avg. Annual ROI" })}</p>
                  <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-emerald-600">18.5%</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t({ bn: "সক্রিয় শেয়ারহোল্ডার", en: "Verified Investors" })}</p>
                  <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">1,500+</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t({ bn: "সম্পদ ব্যবস্থাপনা", en: "Managed Assets" })}</p>
                  <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-sky-600">৳ ৫০+ কোটি</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── 2. CORE HUB ACTION CARDS ───────────────── */}
      <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
            {t({ bn: "পোর্টাল হাব", en: "Quick Navigation" })}
          </span>
          <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900">
            {t({ bn: "ইনভেস্টমেন্ট সেন্টার কার্যক্রম", en: "Investment Operations Center" })}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t({
              bn: "আপনার প্রয়োজন অনুযায়ী নিচের যেকোনো সেকশনে সরাসরি প্রবেশ করুন।",
              en: "Select from the operations below to manage or review investments.",
            })}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-md shadow-emerald-500/10 transition group-hover:scale-110`}
                >
                  <item.icon className="h-6 w-6" />
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition">
                  {t(item.badge)}
                </span>
              </div>

              <div className="mt-5">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition">
                  {t({ bn: item.bn, en: item.en })}
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-500">
                  {t(item.desc)}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition">
                <span>{t({ bn: "প্রবেশ করুন", en: "Open Section" })}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ───────────────── 3. FEATURED ACTIVE PROJECTS (DYNAMIC) ───────────────── */}
      {/* <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
              <Building2 className="h-3.5 w-3.5" />
              {t({ bn: "চলমান প্রজেক্ট", en: "Active Projects" })}
            </span>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900">
              {t({ bn: "লাইভ ইনভেস্টমেন্ট প্রজেক্টসমূহ", en: "Featured Investment Projects" })}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t({
                bn: "সরকারি অনুমোদনপ্রাপ্ত এবং ভেরিফাইড মেগা রিয়েল এস্টেট প্রজেক্টে এখনই শেয়ার নিশ্চিত করুন।",
                en: "Secure your share in government approved and audited high-yield assets.",
              })}
            </p>
          </div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 self-start sm:self-auto"
          >
            {t({ bn: "সব প্রজেক্ট দেখুন", en: "View All Projects" })}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayProjects.slice(0, 3).map((proj) => (
            <div
              key={proj.uuid}
              className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              
              <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                <Image
                  src={
                    proj.thumbnailUrl ||
                    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85"
                  }
                  alt={proj.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-emerald-800 backdrop-blur-md shadow-sm">
                  {proj.category?.name || "Commercial"}
                </span>
                {proj.expectedAnnualReturn && (
                  <span className="absolute right-4 top-4 rounded-full bg-emerald-600 px-3 py-1 text-xs font-extrabold text-white shadow-md">
                    ROI {proj.expectedAnnualReturn}%
                  </span>
                )}
                {proj.location && (
                  <p className="absolute bottom-3 left-4 flex items-center gap-1.5 text-xs font-medium text-white/90">
                    <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                    {proj.location}
                  </p>
                )}
              </div>

              
              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition line-clamp-1">
                    {proj.name}
                  </h3>
                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3.5 text-xs">
                    <div>
                      <p className="text-slate-400">{t({ bn: "প্রতি শেয়ার মূল্য", en: "Share Price" })}</p>
                      <p className="mt-1 font-extrabold text-slate-900">
                        ৳ {Number(proj.pricePerShare || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">{t({ bn: "প্রত্যাশিত রিটার্ন", en: "Expected Return" })}</p>
                      <p className="mt-1 font-extrabold text-emerald-600">
                        {proj.expectedAnnualReturn || 18}% / yr
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div>
                    <span className="block text-[11px] text-slate-400">
                      {t({ bn: "উপলব্ধ শেয়ার", en: "Total Available" })}
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {proj.totalShares || 100} {t({ bn: "টি শেয়ার", en: "Shares" })}
                    </span>
                  </div>
                  <Link
                    href={`/projects/${proj.uuid}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-600"
                  >
                    <span>{t({ bn: "বিনিয়োগ করুন", en: "Invest Now" })}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section> */}

      {/* ───────────────── 4. THREE PILLARS INVESTMENT MODEL (STATIC WITH IMAGES) ───────────────── */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
            {t({ bn: "বিনিয়োগ মডেল", en: "Investment Framework" })}
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900">
            {t({ bn: "শেয়ার প্রজেক্টের তিনটি মূল শক্তি", en: "Three Pillars of Share Project" })}
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            {t({
              bn: "প্রচলিত রিয়েল এস্টেটের জটিলতা বাদ দিয়ে আধুনিক ফ্র্যাকশনাল ওনারশিপের মাধ্যমে নিশ্চিত করুন আপনার বিনিয়োগের নিরাপত্তা।",
              en: "Eliminate conventional property hurdles with modern institutional fractional ownership.",
            })}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Card 1 */}
          <div className="group overflow-hidden rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-xl">
            <div className="relative h-48 w-full overflow-hidden rounded-2xl">
              <Image
                src="https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80"
                alt="Co-Ownership"
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-slate-950/20" />
            </div>
            <div className="p-4 sm:p-5">
              <span className="inline-block text-xs font-bold uppercase text-emerald-600">
                {t({ bn: "০১. যৌথ মালিকানা", en: "01. Co-Ownership" })}
              </span>
              <h3 className="mt-2 text-xl font-bold text-slate-900">
                {t({ bn: "ক্ষুদ্র পুঁজিতে মেগা সম্পত্তিতে মালিকানা", en: "Fractional Ownership in Prime Assets" })}
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-500">
                {t({
                  bn: "কোটি টাকার বাণিজ্যিক ভবন বা রিসোর্টে এখন মাত্র ২৫,০০০ টাকা থেকেই শেয়ারের মাধ্যমে আইনি অংশীদার হওয়া সম্ভব।",
                  en: "Own legally certified fractions of multi-crore commercial towers and resorts starting from small units.",
                })}
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group overflow-hidden rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-xl">
            <div className="relative h-48 w-full overflow-hidden rounded-2xl">
              <Image
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
                alt="Rental Yield"
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-slate-950/20" />
            </div>
            <div className="p-4 sm:p-5">
              <span className="inline-block text-xs font-bold uppercase text-sky-600">
                {t({ bn: "০২. ক্যাশফ্লো ও মুনাফা", en: "02. Rental Cashflow" })}
              </span>
              <h3 className="mt-2 text-xl font-bold text-slate-900">
                {t({ bn: "নিয়মিত ভাড়া এবং ক্যাপিটাল গ্রোথ", en: "Quarterly Rental & Capital Appreciation" })}
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-500">
                {t({
                  bn: "প্রজেক্ট চালুর পর থেকে নিয়মিত লভ্যাংশ সরাসরি ব্যাংকে জমা এবং জমির মূল্য বৃদ্ধির সাথে সাথে শেয়ারের মূলধন বৃদ্ধি।",
                  en: "Receive quarterly dividends directly to your account while asset appreciation steadily lifts share value.",
                })}
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group overflow-hidden rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-xl">
            <div className="relative h-48 w-full overflow-hidden rounded-2xl">
              <Image
                src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80"
                alt="Security & Deed"
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-slate-950/20" />
            </div>
            <div className="p-4 sm:p-5">
              <span className="inline-block text-xs font-bold uppercase text-purple-600">
                {t({ bn: "০৩. আইনি সুরক্ষা", en: "03. Legal Assurance" })}
              </span>
              <h3 className="mt-2 text-xl font-bold text-slate-900">
                {t({ bn: "রেজিস্টার্ড চুক্তি ও সহজ ট্রান্সফার", en: "Deed Registration & Easy Exit" })}
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-500">
                {t({
                  bn: "প্রত্যেক ইনভেস্টর পাবেন রেজিস্টার্ড শেয়ার সার্টিফিকেট। যেকোনো সময় অন্য ইনভেস্টরের কাছে শেয়ার বিক্রয় বা হস্তান্তরের সুবিধা।",
                  en: "Receive registered share certificates and enjoy seamless liquidity to transfer or sell shares anytime.",
                })}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── 5. INTERACTIVE ROI CALCULATOR ───────────────── */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 p-8 sm:p-12 lg:p-16 text-white shadow-2xl">
          <div className="relative z-10 grid gap-10 lg:grid-cols-12 items-center">
            {/* Left Column: Calculator Controls */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-400">
                  <Calculator className="h-3.5 w-3.5" />
                  {t({ bn: "স্মার্ট ইনভেস্টমেন্ট ক্যালকুলেটর", en: "Smart ROI Calculator" })}
                </span>
                <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold">
                  {t({ bn: "আপনার বিনিয়োগের ভবিষ্যৎ আয় হিসাব করুন", en: "Calculate Projected Investment Returns" })}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-400">
                  {t({
                    bn: "আপনার বিনিয়োগের পরিমাণ এবং মেয়াদ নির্ধারণ করে সম্ভাব্য মাসিক ও বাৎসরিক লাভ দেখে নিন।",
                    en: "Adjust investment size and tenure to estimate projected monthly and cumulative profits.",
                  })}
                </p>
              </div>

              {/* Slider 1: Amount */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 font-medium">{t({ bn: "বিনিয়োগের পরিমাণ", en: "Investment Amount" })}</span>
                  <span className="font-extrabold text-emerald-400 text-lg">৳ {calcAmount.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={20000}
                  max={2000000}
                  step={10000}
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Number(e.target.value))}
                  className="mt-3 w-full accent-emerald-500 cursor-pointer h-2 rounded-lg bg-white/20"
                />
                <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                  <span>৳ ২০,০০০</span>
                  <span>৳ ১০,০০,০০০</span>
                  <span>৳ ২০,০০,০০০</span>
                </div>
              </div>

              {/* Slider 2: Return Rate */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 font-medium">{t({ bn: "প্রত্যাশিত বাৎসরিক রিটার্ন (ROI)", en: "Expected Annual Return (ROI)" })}</span>
                  <span className="font-extrabold text-sky-400 text-lg">{calcReturnRate}% / yr</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={25}
                  step={0.5}
                  value={calcReturnRate}
                  onChange={(e) => setCalcReturnRate(Number(e.target.value))}
                  className="mt-3 w-full accent-sky-400 cursor-pointer h-2 rounded-lg bg-white/20"
                />
                <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                  <span>১০% (সাধারণ)</span>
                  <span>১৮% (বাণিজ্যিক গড়)</span>
                  <span>২৫% (সর্বোচ্চ)</span>
                </div>
              </div>

              {/* Tenure selector */}
              <div>
                <span className="block text-xs font-semibold text-slate-300 mb-2">
                  {t({ bn: "বিনিয়োগের মেয়াদকাল", en: "Investment Horizon" })}
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 5].map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setCalcYears(y)}
                      className={`rounded-xl py-2.5 text-xs font-bold transition ${
                        calcYears === y
                          ? "bg-emerald-500 text-slate-950 shadow-md"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      {y} {t({ bn: "বছর", en: "Years" })}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Projected Returns Summary Card */}
            <div className="lg:col-span-5 rounded-3xl border border-white/15 bg-white/10 p-6 sm:p-8 backdrop-blur-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {t({ bn: "আনুমানিক রিটার্ন সামারি", en: "Projected Payout Summary" })}
              </span>

              <div className="mt-6 space-y-5 divide-y divide-white/10">
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-sm text-slate-300">{t({ bn: "মাসিক আনুমানিক আয়", en: "Monthly Estimated Yield" })}</span>
                  <span className="text-lg font-bold text-white">৳ {monthlyProfit.toLocaleString()}</span>
                </div>
                <div className="pt-4 flex items-center justify-between">
                  <span className="text-sm text-slate-300">{t({ bn: "বাৎসরিক মোট লাভ", en: "Annual Total Return" })}</span>
                  <span className="text-lg font-bold text-emerald-400">৳ {annualProfit.toLocaleString()}</span>
                </div>
                <div className="pt-4 flex items-center justify-between">
                  <span className="text-sm text-slate-300">{t({ bn: "মেয়াদান্তে মোট মুনাফা", en: `Total Profit (${calcYears} Yrs)` })}</span>
                  <span className="text-lg font-bold text-sky-400">৳ {(annualProfit * calcYears).toLocaleString()}</span>
                </div>
                <div className="pt-5 flex items-center justify-between border-t border-emerald-400/30">
                  <div>
                    <span className="text-xs uppercase text-slate-400 block">{t({ bn: "মেয়াদান্তে মোট প্রাপ্তি", en: "Total Maturity Value" })}</span>
                    <span className="text-2xl font-black text-white">৳ {totalMaturityReturn.toLocaleString()}</span>
                  </div>
                  <Coins className="h-8 w-8 text-emerald-400" />
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href="/projects"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-sky-400 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02]"
                >
                  <TrendingUp className="h-4 w-4" />
                  {t({ bn: "এই হারে বিনিয়োগ করুন", en: "Invest with This Yield" })}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── 6. STEP-BY-STEP INVESTMENT PROCESS ───────────────── */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
            {t({ bn: "সহজ প্রক্রিয়া", en: "How It Works" })}
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900">
            {t({ bn: "৪ ধাপে বিনিয়োগ ও নিয়মিত আয় লাভ", en: "4 Simple Steps to Earn Returns" })}
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            {t({
              bn: "জটিল দাপ্তরিক ঝামেলা ছাড়া ঘরে বসেই আপনার পছন্দের রিয়েল এস্টেট প্রজেক্টের শেয়ারহোল্ডার হোন।",
              en: "Become a verified property shareholder from anywhere with straightforward digital steps.",
            })}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: "০১",
              title: { bn: "প্রজেক্ট নির্বাচন", en: "Select Project" },
              desc: { bn: "আমাদের লাইভ তালিকা থেকে অবস্থান, শেয়ার মূল্য ও রিটার্ন বিশ্লেষণ করে প্রজেক্ট বাছাই করুন।", en: "Compare location, expected ROI, and share valuation from our active listings." },
              icon: Building2,
            },
            {
              step: "০২",
              title: { bn: "অনুরোধ ও পেমেন্ট", en: "Booking & Payment" },
              desc: { bn: "আপনার প্রয়োজনীয় শেয়ার সংখ্যা নির্ধারণ করে সরাসরি অনলাইন বা ব্যাংকের মাধ্যমে পেমেন্ট সম্পন্ন করুন।", en: "Choose your desired share quantity and complete deposit via bank or secure transfer." },
              icon: Coins,
            },
            {
              step: "০৩",
              title: { bn: "ডিজিটাল চুক্তিপত্র", en: "Digital Deed & Cert." },
              desc: { bn: "এডমিন অনুমোদনের পর পান আইনি ডিজিটাল শেয়ার সার্টিফিকেট ও মালিকানার প্রামাণ্য দলিল।", en: "Receive your digitally verified ownership share certificate and signed agreement deed." },
              icon: FileCheck2,
            },
            {
              step: "০৪",
              title: { bn: "মুনাফা ও বৃদ্ধি", en: "Earn Payouts" },
              desc: { bn: "প্রতি তিন মাস অন্তর নিয়মিত ভাড়া ও প্রজেক্ট সমাপ্তিতে মূলধনী মুনাফা আপনার ব্যাংক অ্যাকাউন্টে জমা।", en: "Collect steady quarterly rental distributions directly into your bank account." },
              icon: TrendingUp,
            },
          ].map((s) => (
            <div
              key={s.step}
              className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="text-3xl font-black text-slate-100 group-hover:text-emerald-100">{s.step}</span>
              <div className="mt-4 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">{t(s.title)}</h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-500">{t(s.desc)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────── 7. SECURITY & TRUST HIGHLIGHTS ───────────────── */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[36px] border border-slate-200 bg-white p-8 sm:p-12 shadow-sm">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                <Lock className="h-3.5 w-3.5" />
                {t({ bn: "১০০% বিশ্বস্ততা ও স্বচ্ছতা", en: "100% Trust & Compliance" })}
              </span>
              <h2 className="mt-4 text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                {t({
                  bn: "আপনার প্রতিটি টাকার বিপরীতে পূর্ণাঙ্গ আইনি ও কাঠামোগত নিরাপত্তা",
                  en: "Comprehensive Legal and Asset Protection for Every Share",
                })}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                {t({
                  bn: "শেয়ার প্রজেক্ট কোনো কাল্পনিক তহবিল নয়; এটি বাস্তব বাণিজ্যিক এবং আবাসিক জমিসমূহের সরাসরি শেয়ারহোল্ডিং প্ল্যাটফর্ম।",
                  en: "Share Project operates strictly on real-world registered land titles, commercial leases, and auditable financial statements.",
                })}
              </p>

              <div className="mt-8 space-y-4">
                {[
                  {
                    title: { bn: "রেজিস্টার্ড দলিল ও শারীরিক চুক্তি", en: "Registered Land Titles & Legal Deeds" },
                    desc: { bn: "প্রতিটি প্রজেক্টের নামে পৃথক জমির দলিল ও সরকারের প্রচলিত ভূমি আইন মেনে ব্যবস্থাপনা।", en: "Direct land ownership documents backed by national land registration acts." },
                  },
                  {
                    title: { bn: "তৃতীয় পক্ষ নিরপেক্ষ অডিট", en: "Independent Third-Party Audit" },
                    desc: { bn: "চার্টার্ড একাউন্টেন্টস ফার্ম কর্তৃক নিয়মিত আয় ও ব্যয়ের নিরীক্ষা এবং পাবলিক রিপোর্ট।", en: "Audited financial reports by certified CA firms accessible to all shareholders." },
                  },
                  {
                    title: { bn: "শরিয়াহ সম্মত নীতিমালা", en: "Shariah Compliant Framework" },
                    desc: { bn: "সুদমুক্ত লাভ-লোকসান ভিত্তিক রিয়েল এস্টেট কো-ওনারশিপ বিনিয়োগ ব্যবস্থা।", en: "Strictly interest-free, profit-and-loss sharing real estate equity model." },
                  },
                ].map((sec, idx) => (
                  <div key={idx} className="flex items-start gap-3.5">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{t(sec.title)}</h4>
                      <p className="mt-0.5 text-xs text-slate-500">{t(sec.desc)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative h-[340px] sm:h-[420px] w-full overflow-hidden rounded-3xl bg-slate-100 shadow-lg">
              <Image
                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80"
                alt="Security and Trust Architecture"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/95 p-5 backdrop-blur-md shadow-lg border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white font-bold">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {t({ bn: "আইনি ও অডিট নিশ্চয়তা সনদ", en: "Institutional Grade Assurance" })}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {t({ bn: "সকল শেয়ারহোল্ডারদের জন্য সুরক্ষিত ডিজিটাল কাস্টডি।", en: "Secure digital custody for all registered shareholders." })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── 8. BOTTOM CTA BANNER ───────────────── */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[36px] bg-slate-950 p-8 sm:p-14 text-white text-center shadow-2xl">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-400">
              {t({ bn: "আজই শুরু করুন", en: "Get Started Today" })}
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {t({
                bn: "আপনার বিনিয়োগ যাত্রা শুরু করতে প্রস্তুত?",
                en: "Ready to Build Your Passive Property Portfolio?",
              })}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              {t({
                bn: "আমাদের বিশেষজ্ঞদের সাথে সরাসরি কথা বলুন অথবা এখনই আমাদের সক্রিয় প্রজেক্টগুলোর শেয়ার ব্রাউজ করুন।",
                en: "Speak directly with our investment advisors or browse our active live project shares now.",
              })}
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-sky-400 px-8 py-4 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:scale-105"
              >
                <PieChart className="h-4 w-4" />
                {t({ bn: "প্রজেক্ট তালিকা দেখুন", en: "Explore Projects" })}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-8 py-4 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                {t({ bn: "আমাদের সাথে কথা বলুন", en: "Contact Our Advisors" })}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
