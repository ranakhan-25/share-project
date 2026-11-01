"use client";

import { useState, useMemo, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Minus,
  Plus,
  Wallet,
  CheckCircle2,
  Share2,
  Clock,
  Building2,
  Users,
  BadgeCheck,
} from "lucide-react";
import { useLang, type Bi } from "@/lib/i18n";
import { Reveal } from "@/components/ui/Reveal";
import { SkylineArt } from "@/components/ui/SkylineArt";

/* ---------- SHARED DATA (move to /data/projects.js ideally) ---------- */
const PROJECTS = [
  {
    id: 1,
    name: { bn: "সী ভিউ হোটেল ও রিসোর্ট", en: "Sea View Hotel & Resort" },
    place: { bn: "কক্সবাজার, চট্টগ্রাম", en: "Cox's Bazar, Chattogram" },
    type: { bn: "হোটেল ও রিসোর্ট", en: "Hotel & resort" },
    price: 35000,
    sold: 74,
    ret: 15,
    hue: 190,
    totalShares: 10000,
    minShares: 1,
    duration: { bn: "৫ বছর", en: "5 years" },
    payout: { bn: "বার্ষিক", en: "Yearly" },
    description: {
      bn: "কক্সবাজারের সমুদ্র সৈকতের পাশে একটি প্রিমিয়াম রিসোর্ট প্রজেক্ট। শেয়ারহোল্ডাররা বার্ষিক লভ্যাংশ এবং রিসোর্টের রেভিনিউ থেকে রিটার্ন পাবেন।",
      en: "A premium beachfront resort project beside Cox's Bazar sea beach. Shareholders receive annual dividends and returns from resort revenue.",
    },
    highlights: [
      { bn: "সমুদ্র সৈকতের কাছেই", en: "Walking distance to beach" },
      { bn: "পরিচালিত রিসোর্ট", en: "Professionally managed" },
      { bn: "বার্ষিক লভ্যাংশ", en: "Annual dividend" },
      { bn: "বিমা-covered", en: "Insured asset" },
    ],
    investors: 1284,
  },
  {
    id: 2,
    name: { bn: "প্রিমিয়াম কার শেয়ার", en: "Premium Car Share" },
    place: { bn: "বনানী, ঢাকা", en: "Banani, Dhaka" },
    type: { bn: "গাড়ি শেয়ারিং", en: "Car sharing" },
    price: 12000,
    sold: 58,
    ret: 11,
    hue: 210,
    totalShares: 8000,
    minShares: 1,
    duration: { bn: "৩ বছর", en: "3 years" },
    payout: { bn: "মাসিক", en: "Monthly" },
    description: {
      bn: "প্রিমিয়াম গাড়ির ফ্লিটে বিনিয়োগ করুন এবং রাইড-শেয়ারিং আয় থেকে মাসিক রিটার্ন উপভোগ করুন।",
      en: "Invest in a premium car fleet and enjoy monthly returns from ride-sharing income.",
    },
    highlights: [
      { bn: "মাসিক পেআউট", en: "Monthly payout" },
      { bn: "পূর্ণ-বিমা", en: "Fully insured" },
      { bn: "ফ্লিট ম্যানেজমেন্ট", en: "Fleet managed" },
      { bn: "কম রিস্ক", en: "Lower risk" },
    ],
    investors: 862,
  },
  {
    id: 3,
    name: { bn: "সোলার পাওয়ার প্লান্ট", en: "Solar Power Plant" },
    place: { bn: "সাভার, ঢাকা", en: "Savar, Dhaka" },
    type: { bn: "নবায়নযোগ্য জ্বালানি", en: "Renewable energy" },
    price: 22000,
    sold: 69,
    ret: 18,
    hue: 160,
    totalShares: 12000,
    minShares: 1,
    duration: { bn: "৭ বছর", en: "7 years" },
    payout: { bn: "বার্ষিক", en: "Yearly" },
    description: {
      bn: "সাভারে একটি ৫ মেগাওয়াট সোলার পাওয়ার প্লান্টে বিনিয়োগ করুন। বিদ্যুৎ বিক্রয় থেকে দীর্ঘমেয়াদি স্থিতিশীল রিটার্ন।",
      en: "Invest in a 5 MW solar power plant in Savar. Long-term stable returns from electricity sales.",
    },
    highlights: [
      { bn: "সবুজ জ্বালানি", en: "Green energy" },
      { bn: "সরকার-অনুমোদিত", en: "Govt approved" },
      { bn: "দীর্ঘমেয়াদি", en: "Long-term" },
      { bn: "স্থিতিশীল আয়", en: "Stable income" },
    ],
    investors: 1547,
  },
];

const STAT_ICONS = {
  invested: Wallet,
  investors: Users,
  duration: Clock,
  payout: TrendingUp,
};

export default function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params); // ✅ unwrap the promise
  const { t, taka, num } = useLang();
   const project = PROJECTS.find((p) => p.id === Number(id));

  const [quantity, setQuantity] = useState(1);
  const [done, setDone] = useState(false);

  const remaining = project
    ? project.totalShares -
      Math.round((project.sold / 100) * project.totalShares)
    : 0;

  const total = useMemo(
    () => (project ? project.price * quantity : 0),
    [project, quantity],
  );

  /* ---------- NOT FOUND ---------- */
  if (!project) {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-5 text-center">
        <h1 className="text-3xl font-bold text-slate-900">
          {t({ bn: "প্রজেক্ট পাওয়া যায়নি", en: "Project not found" })}
        </h1>
        <p className="mt-3 text-slate-500">
          {t({
            bn: "এই আইডির কোনো প্রজেক্ট নেই।",
            en: "No project exists with this id.",
          })}
        </p>
        <Link
          href="/features"
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" />
          {t({ bn: "সব প্রজেক্টে ফিরুন", en: "Back to projects" })}
        </Link>
      </section>
    );
  }

  const canDec = quantity > project.minShares;
  const canInc = quantity < remaining;
  const percReturn = Math.round(project.price * (project.ret / 100));

  return (
    <section className="bg-slate-50 pb-20 pt-25">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Breadcrumb / back */}
        <Reveal>
          <Link
            href="/features"
            className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            {t({ bn: "সব প্রজেক্ট", en: "All projects" })}
          </Link>
        </Reveal>

        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          {/* ---------------- LEFT ---------------- */}
          <div>
            {/* Hero */}
            <Reveal>
              <div className="relative overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                <div className="relative h-64 overflow-hidden sm:h-80">
                  <SkylineArt
                    hue={project.hue}
                    variant={project.id}
                    className="h-full w-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

                  <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800 backdrop-blur">
                    {t(project.type)}
                  </span>
                  <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
                    <Sparkles className="h-3 w-3" />
                    {num(project.ret)}% {t({ bn: "রিটার্ন", en: "return" })}
                  </span>

                  <div className="absolute bottom-5 left-5 right-5">
                    <h1 className="text-2xl font-bold text-white sm:text-3xl">
                      {t(project.name)}
                    </h1>
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/90">
                      <MapPin className="h-4 w-4" />
                      {t(project.place)}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Stats row */}
            <Reveal delay={0.1}>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    icon: Wallet,
                    label: { bn: "প্রতি শেয়ার", en: "Per share" },
                    value: taka(project.price),
                  },
                  {
                    icon: TrendingUp,
                    label: { bn: "বার্ষিক রিটার্ন", en: "Annual return" },
                    value: `${num(project.ret)}%`,
                  },
                  {
                    icon: Clock,
                    label: { bn: "মেয়াদ", en: "Duration" },
                    value: t(project.duration),
                  },
                  {
                    icon: Users,
                    label: { bn: "বিনিয়োগকারী", en: "Investors" },
                    value: num(project.investors),
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <s.icon className="h-4 w-4 text-emerald-500" />
                    <p className="mt-2 text-[11px] text-slate-500">
                      {t(s.label)}
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Description */}
            <Reveal delay={0.15}>
              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">
                  {t({ bn: "প্রজেক্ট সম্পর্কে", en: "About this project" })}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {t(project.description)}
                </p>

                <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {project.highlights.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      {t(h)}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Funding progress */}
            <Reveal delay={0.2}>
              <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-slate-500">
                      {t({ bn: "ফান্ডিং অগ্রগতি", en: "Funding progress" })}
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {num(project.sold)}%
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-600">
                    {num(remaining)}{" "}
                    {t({ bn: "শেয়ার বাকি", en: "shares left" })}
                  </p>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${project.sold}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-500"
                  />
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  {num(project.sold)}%{" "}
                  {t({ bn: "ইতিমধ্যে বিক্রিত", en: "already sold" })}
                </p>
              </div>
            </Reveal>
          </div>

          {/* ---------------- RIGHT (INVEST CARD) ---------------- */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <Reveal delay={0.15}>
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-500 to-sky-500 px-6 py-5">
                  <p className="text-xs font-medium text-white/90">
                    {t({ bn: "শেয়ার কিনুন", en: "Buy shares" })}
                  </p>
                  <p className="mt-1 text-3xl font-bold text-white">
                    {taka(project.price)}
                    <span className="ml-1 text-sm font-medium text-white/80">
                      / {t({ bn: "শেয়ার", en: "share" })}
                    </span>
                  </p>
                </div>

                <div className="p-6">
                  {/* Quantity stepper */}
                  <label className="text-xs font-semibold text-slate-500">
                    {t({ bn: "শেয়ার সংখ্যা", en: "Number of shares" })}
                  </label>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      onClick={() =>
                        setQuantity((q) => Math.max(project.minShares, q - 1))
                      }
                      disabled={!canDec}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:border-emerald-500 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="decrease"
                    >
                      <Minus className="h-4 w-4" />
                    </button>

                    <input
                      type="number"
                      min={project.minShares}
                      max={remaining}
                      value={quantity}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (Number.isNaN(v)) return;
                        setQuantity(
                          Math.min(remaining, Math.max(project.minShares, v)),
                        );
                      }}
                      className="h-12 w-full rounded-2xl border border-slate-200 text-center text-lg font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />

                    <button
                      onClick={() =>
                        setQuantity((q) => Math.min(remaining, q + 1))
                      }
                      disabled={!canInc}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:border-emerald-500 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="increase"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Quick amount */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[1, 5, 10, 25].map((n) => (
                      <button
                        key={n}
                        onClick={() => setQuantity(Math.min(remaining, n))}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-emerald-500 hover:text-emerald-600"
                      >
                        +{num(n)}
                      </button>
                    ))}
                    <button
                      onClick={() => setQuantity(remaining)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-emerald-500 hover:text-emerald-600"
                    >
                      Max
                    </button>
                  </div>

                  {/* Summary */}
                  <div className="mt-6 space-y-2.5 rounded-2xl bg-slate-50 p-4 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>{t({ bn: "প্রতি শেয়ার", en: "Per share" })}</span>
                      <span className="font-semibold text-slate-900">
                        {taka(project.price)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>{t({ bn: "শেয়ার", en: "Shares" })}</span>
                      <span className="font-semibold text-slate-900">
                        × {num(quantity)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>
                        {t({
                          bn: "সম্ভাব্য বার্ষিক রিটার্ন",
                          en: "Est. annual return",
                        })}
                      </span>
                      <span className="font-semibold text-emerald-600">
                        +{taka(percReturn * quantity)}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between border-t border-slate-200 pt-2.5">
                      <span className="font-semibold text-slate-900">
                        {t({ bn: "মোট", en: "Total" })}
                      </span>
                      <span className="text-lg font-bold text-slate-900">
                        {taka(total)}
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => setDone(true)}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-600 active:scale-[0.99]"
                  >
                    <Wallet className="h-4 w-4" />
                    {t({ bn: "বিনিয়োগ করুন", en: "Invest now" })}
                  </button>

                  {done && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700"
                    >
                      <BadgeCheck className="h-4 w-4" />
                      {t({
                        bn: "ধন্যবাদ! আপনার অনুরোধ গ্রহণ করা হয়েছে।",
                        en: "Thanks! Your request has been received.",
                      })}
                    </motion.div>
                  )}

                  <p className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {t({
                      bn: "নিরাপদ লেনদেন · নিয়ন্ত্রিত প্ল্যাটফর্ম",
                      en: "Secure transaction · Regulated platform",
                    })}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
