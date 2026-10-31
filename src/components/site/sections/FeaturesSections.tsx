"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Award,
  Bell,
  Check,
  FileBarChart,
  Fingerprint,
  Languages,
  Layers,
  LineChart,
  PieChart,
  ReceiptText,
  Repeat2,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useState, type MouseEvent } from "react";
import { useLang, type Bi } from "@/lib/i18n";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

/* ── 1. Core feature grid with mouse spotlight ── */
const FEATURES: { icon: typeof PieChart; title: Bi; text: Bi; color: string }[] = [
  { icon: PieChart, title: { bn: "শেয়ার অ্যাসাইনমেন্ট", en: "Share assignment" }, text: { bn: "প্রজেক্ট, সাইট ও ফ্ল্যাট/প্লট অনুযায়ী শেয়ার বরাদ্দ ও সার্টিফিকেট তৈরি।", en: "Allocate shares by project, site and flat/plot with auto-generated certificates." }, color: "from-emerald-400 to-teal-500" },
  { icon: Wallet, title: { bn: "কালেকশন ম্যানেজমেন্ট", en: "Collection management" }, text: { bn: "কিস্তি, বকেয়া ও জমার সম্পূর্ণ হিসাব এক নজরে।", en: "Instalments, dues and deposits — the full picture at a glance." }, color: "from-sky-400 to-blue-500" },
  { icon: FileBarChart, title: { bn: "অ্যাডভান্সড রিপোর্ট", en: "Advanced reports" }, text: { bn: "শেয়ার, কালেকশন, পেনাল্টি ও পয়েন্ট রিপোর্ট — ফিল্টার ও প্রিন্টসহ।", en: "Share, collection, penalty and points reports — with filters and print." }, color: "from-violet-400 to-purple-500" },
  { icon: Award, title: { bn: "পয়েন্ট সিস্টেম", en: "Points system" }, text: { bn: "সময়মতো পরিশোধে পয়েন্ট এবং বিলম্বে স্বয়ংক্রিয় পেনাল্টি।", en: "Points for on-time payment and automatic penalties for delays." }, color: "from-amber-300 to-orange-500" },
  { icon: Fingerprint, title: { bn: "নিরাপদ অ্যাক্সেস", en: "Secure access" }, text: { bn: "টোকেন-ভিত্তিক লগইন ও ভূমিকা-ভিত্তিক অনুমতি।", en: "Token-based login with role-based permissions." }, color: "from-rose-400 to-pink-500" },
  { icon: Languages, title: { bn: "দ্বিভাষিক ইন্টারফেস", en: "Bilingual interface" }, text: { bn: "বাংলা ও ইংরেজির মধ্যে এক ক্লিকে পরিবর্তন।", en: "Switch between Bangla and English in one click." }, color: "from-lime-400 to-emerald-500" },
];

function SpotlightCard({ children }: { children: React.ReactNode }) {
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div
      onMouseMove={onMove}
      className="group relative h-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 transition duration-500 hover:-translate-y-1.5 hover:border-transparent hover:shadow-2xl hover:shadow-emerald-500/10"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(360px circle at var(--mx,50%) var(--my,50%), rgba(52,211,153,0.16), transparent 60%)" }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export function FeatureGrid() {
  const { t } = useLang();
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow={{ bn: "মূল ফিচার", en: "Core features" }}
          title={{ bn: "শেয়ার ব্যবস্থাপনার সবকিছু, একটি প্ল্যাটফর্মে", en: "Everything for share management, on one platform" }}
        />
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={i} delay={(i % 3) * 0.1}>
              <SpotlightCard>
                <span className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${f.color} text-white shadow-lg transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110`}>
                  <f.icon className="h-7 w-7" />
                </span>
                <h3 className="mt-6 text-xl font-bold text-slate-900">{t(f.title)}</h3>
                <p className="mt-3 leading-relaxed text-slate-600">{t(f.text)}</p>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 2. Interactive lifecycle tabs ── */
const STAGES: { id: string; icon: typeof Users; tab: Bi; title: Bi; text: Bi; points: Bi[] }[] = [
  {
    id: "assign", icon: Layers, tab: { bn: "বরাদ্দ", en: "Assign" },
    title: { bn: "শেয়ার বরাদ্দ করুন", en: "Assign shares" },
    text: { bn: "প্রজেক্ট ও শেয়ারহোল্ডার বেছে নিন, শেয়ার সংখ্যা দিন — সার্টিফিকেট ও কোড স্বয়ংক্রিয়ভাবে তৈরি হবে।", en: "Pick a project and shareholder, set the quantity — certificate and codes are generated automatically." },
    points: [{ bn: "প্রজেক্ট ও সাইট ভিত্তিক বরাদ্দ", en: "Project and site based allocation" }, { bn: "ইউনিক শেয়ার কোড", en: "Unique share codes" }, { bn: "NID ও ছবি সংযুক্তি", en: "NID and photo attachment" }],
  },
  {
    id: "collect", icon: Wallet, tab: { bn: "কালেকশন", en: "Collect" },
    title: { bn: "কিস্তি সংগ্রহ করুন", en: "Collect instalments" },
    text: { bn: "প্রতিটি পরিশোধ রেকর্ড হয়, বকেয়া ও ব্যালেন্স রিয়েল-টাইমে আপডেট হয়।", en: "Every payment is recorded, with dues and balance updated in real time." },
    points: [{ bn: "বকেয়া ও অগ্রিম হিসাব", en: "Dues and advance tracking" }, { bn: "স্বয়ংক্রিয় ব্যালেন্স", en: "Automatic balance" }, { bn: "পেনাল্টি গণনা", en: "Penalty calculation" }],
  },
  {
    id: "report", icon: FileBarChart, tab: { bn: "রিপোর্ট", en: "Report" },
    title: { bn: "রিপোর্ট দেখুন ও প্রিন্ট করুন", en: "View & print reports" },
    text: { bn: "শেয়ার রিপোর্ট, কালেকশন রিপোর্ট, হোল্ডার পয়েন্ট — এক ক্লিকে প্রস্তুত।", en: "Share, collection and holder-point reports — ready in one click." },
    points: [{ bn: "ফিল্টারযোগ্য টেবিল", en: "Filterable tables" }, { bn: "প্রিন্ট-রেডি লেআউট", en: "Print-ready layout" }, { bn: "চার্টসহ সারসংক্ষেপ", en: "Summaries with charts" }],
  },
  {
    id: "reward", icon: Award, tab: { bn: "পয়েন্ট", en: "Reward" },
    title: { bn: "পয়েন্ট অর্জন করুন", en: "Earn points" },
    text: { bn: "নিয়মিত পরিশোধকারীরা পয়েন্ট পান, যা তাঁদের বাড়তি সুবিধার ভিত্তি।", en: "Consistent payers earn points that unlock additional benefits." },
    points: [{ bn: "পয়েন্ট লিডারবোর্ড", en: "Points leaderboard" }, { bn: "পেনাল্টি রিপোর্ট", en: "Penalty report" }, { bn: "স্বচ্ছ নিয়ম", en: "Transparent rules" }],
  },
];

export function LifecycleTabs() {
  const { t } = useLang();
  const [active, setActive] = useState(STAGES[0].id);
  const stage = STAGES.find((s) => s.id === active)!;
  return (
    <section className="relative overflow-hidden bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow={{ bn: "শেয়ারের জীবনচক্র", en: "Share lifecycle" }}
          title={{ bn: "বরাদ্দ থেকে রিওয়ার্ড — প্রতিটি ধাপ নিয়ন্ত্রণে", en: "From assignment to reward — every step under control" }}
        />
        <div className="mx-auto mt-12 flex max-w-2xl justify-center">
          <div className="relative flex w-full gap-1 rounded-full bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
            {STAGES.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`relative flex-1 rounded-full px-3 py-2.5 text-sm font-semibold transition-colors ${active === s.id ? "text-white" : "text-slate-500 hover:text-slate-900"}`}
              >
                {active === s.id && (
                  <motion.span layoutId="stage-pill" className="absolute inset-0 rounded-full bg-slate-900" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                )}
                <span className="relative z-10">{t(s.tab)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <AnimatePresence mode="wait">
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.35 }}
              className="grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-2"
            >
              <div>
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <stage.icon className="h-7 w-7" />
                </span>
                <h3 className="mt-5 text-3xl font-bold text-slate-900">{t(stage.title)}</h3>
                <p className="mt-3 text-lg leading-relaxed text-slate-600">{t(stage.text)}</p>
                <ul className="mt-6 space-y-3">
                  {stage.points.map((p, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }} className="flex items-center gap-3 text-slate-700">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white"><Check className="h-3.5 w-3.5" /></span>
                      {t(p)}
                    </motion.li>
                  ))}
                </ul>
              </div>
              <StagePreview id={stage.id} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function StagePreview({ id }: { id: string }) {
  const { t, taka, num } = useLang();
  const rows = [
    { n: { bn: "রাকিবুল ইসলাম", en: "Rakibul Islam" }, v: 120000, s: 80 },
    { n: { bn: "সাবরিনা আহমেদ", en: "Sabrina Ahmed" }, v: 75000, s: 100 },
    { n: { bn: "তানভীর হোসেন", en: "Tanvir Hossain" }, v: 50000, s: 45 },
    { n: { bn: "নুসরাত জাহান", en: "Nusrat Jahan" }, v: 200000, s: 62 },
  ];
  return (
    <div className="rounded-3xl bg-ink-950 p-5 shadow-2xl">
      <div className="mb-4 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-3 rounded-md bg-white/10 px-3 py-1 text-[11px] text-white/50">shareproject.app / {id}</span>
      </div>
      <div className="space-y-3">
        {rows.map((r, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }} className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-white">{t(r.n)}</span>
              <span className="font-semibold text-emerald-300">{taka(r.v)}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div initial={{ width: 0 }} animate={{ width: `${r.s}%` }} transition={{ duration: 1, delay: 0.2 + i * 0.1 }} className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400" />
            </div>
            <p className="mt-1.5 text-right text-[11px] text-white/40">{num(r.s)}%</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── 3. Security + CTA ── */
export function SecurityCta() {
  const { t } = useLang();
  const items = [
    { icon: ShieldCheck, text: { bn: "এনক্রিপটেড সেশন ও টোকেন", en: "Encrypted sessions & tokens" } },
    { icon: Bell, text: { bn: "কিস্তির আগাম নোটিফিকেশন", en: "Advance instalment alerts" } },
    { icon: ReceiptText, text: { bn: "প্রতিটি লেনদেনের অডিট ট্রেইল", en: "Audit trail for every transaction" } },
    { icon: LineChart, text: { bn: "পোর্টফোলিও পারফরম্যান্স ট্র্যাকিং", en: "Portfolio performance tracking" } },
    { icon: Repeat2, text: { bn: "নিরাপদ শেয়ার ট্রান্সফার", en: "Safe share transfers" } },
    { icon: Users, text: { bn: "রোল-ভিত্তিক অ্যাক্সেস", en: "Role-based access" } },
  ];
  return (
    <section className="relative overflow-hidden bg-ink-950 py-24 text-white sm:py-32">
      <div className="bg-grid absolute inset-0 opacity-70" />
      <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-emerald-500/20 blur-[110px]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
        <Reveal>
          <h2 className="text-3xl font-extrabold leading-tight sm:text-5xl">
            {t({ bn: "নিরাপত্তা ও স্বচ্ছতা", en: "Security and transparency" })}{" "}
            <span className="text-gradient">{t({ bn: "আমাদের ভিত্তি", en: "are our foundation" })}</span>
          </h2>
          <p className="mt-5 max-w-lg text-lg text-white/60">
            {t({ bn: "আপনার তথ্য ও বিনিয়োগ সুরক্ষিত রাখতে আমরা প্রতিটি স্তরে নিরাপত্তা নিশ্চিত করি।", en: "We secure your data and investments at every layer of the platform." })}
          </p>
          <Link href="/login" className="group mt-9 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 font-semibold text-ink-950 transition hover:scale-105">
            {t({ bn: "ড্যাশবোর্ডে যান", en: "Go to dashboard" })}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((it, i) => (
            <Reveal key={i} delay={i * 0.07}>
              <div className="glass flex items-center gap-4 rounded-2xl p-5 transition duration-300 hover:-translate-y-1 hover:bg-white/10">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300"><it.icon className="h-5 w-5" /></span>
                <span className="text-sm font-medium text-white/90">{t(it.text)}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
