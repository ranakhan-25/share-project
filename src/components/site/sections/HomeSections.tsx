"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  Award,
  Banknote,
  BarChart3,
  Building2,
  LineChart,
  MapPin,
  PieChart,
  Quote,
  Repeat2,
  ShieldCheck,
  Sparkles,
  Star,
  UserPlus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLang, type Bi } from "@/lib/i18n";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SkylineArt } from "@/components/ui/SkylineArt";
import { CountUp } from "@/components/ui/CountUp";

/* ─────────────── 1. How it works ─────────────── */
export function HowItWorks() {
  const { t } = useLang();
  const steps: { icon: typeof UserPlus; title: Bi; text: Bi }[] = [
    {
      icon: UserPlus,
      title: { bn: "অ্যাকাউন্ট খুলুন", en: "Create account" },
      text: {
        bn: "মাত্র কয়েক মিনিটে পরিচয় যাচাই করে আপনার শেয়ারহোল্ডার প্রোফাইল তৈরি করুন।",
        en: "Verify your identity and set up your shareholder profile in minutes.",
      },
    },
    {
      icon: Building2,
      title: { bn: "প্রজেক্ট বাছাই করুন", en: "Pick a project" },
      text: {
        bn: "লোকেশন, শেয়ার মূল্য ও প্রত্যাশিত রিটার্ন দেখে আপনার পছন্দের প্রজেক্ট নির্বাচন করুন।",
        en: "Compare location, share price and expected return, then choose your project.",
      },
    },
    {
      icon: PieChart,
      title: { bn: "শেয়ার নিন", en: "Get shares" },
      text: {
        bn: "এককালীন বা কিস্তিতে শেয়ার কিনুন — প্রতিটি শেয়ারের জন্য ডিজিটাল সার্টিফিকেট পাবেন।",
        en: "Buy outright or in instalments — every share comes with a digital certificate.",
      },
    },
    {
      icon: Banknote,
      title: { bn: "রিটার্ন ট্র্যাক করুন", en: "Track returns" },
      text: {
        bn: "ড্যাশবোর্ডে কালেকশন, পয়েন্ট ও রিপোর্ট দেখুন এবং সময়মতো রিটার্ন বুঝে নিন।",
        en: "Follow collections, points and reports on your dashboard and receive returns on time.",
      },
    },
  ];
  return (
    <section className="relative overflow-hidden bg-white py-24 sm:py-32">
      <div className="bg-grid-light absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow={{ bn: "কীভাবে কাজ করে", en: "How it works" }}
          title={{
            bn: "চার ধাপেই শুরু হোক আপনার শেয়ার যাত্রা",
            en: "Your share journey in four simple steps",
          }}
          subtitle={{
            bn: "জটিল কাগজপত্র ছাড়াই, সম্পূর্ণ ডিজিটাল প্রক্রিয়ায়।",
            en: "No heavy paperwork — a completely digital process.",
          }}
        />

        <div className="relative mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* connecting line */}
          <div className="absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent lg:block" />
          {steps.map((s, i) => (
            <Reveal key={i} delay={i * 0.12}>
              <div className="group relative h-full rounded-3xl border border-slate-200 bg-white p-7 pt-14 shadow-sm transition duration-500 hover:-translate-y-2 hover:border-emerald-300 hover:shadow-2xl hover:shadow-emerald-500/10">
                <div className="absolute -top-0 left-7 -translate-y-1/2">
                  <div className="relative grid h-[72px] w-[72px] place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-500 text-white shadow-lg shadow-emerald-500/30 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                    <s.icon className="h-8 w-8" />
                  </div>
                </div>
                <span className="absolute right-6 top-5 text-5xl font-black text-slate-100 transition group-hover:text-emerald-100">
                  0{i + 1}
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  {t(s.title)}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                  {t(s.text)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── 2. Featured projects ─────────────── */
const PROJECTS = [
  {
    name: { bn: "সী ভিউ হোটেল ও রিসোর্ট", en: "Sea View Hotel & Resort" },
    place: { bn: "কক্সবাজার, চট্টগ্রাম", en: "Cox's Bazar, Chattogram" },
    type: { bn: "হোটেল ও রিসোর্ট", en: "Hotel & resort" },
    price: 35000,
    sold: 74,
    ret: 15,
    hue: 190,
  },
  {
    name: { bn: "প্রিমিয়াম কার শেয়ার", en: "Premium Car Share" },
    place: { bn: "বনানী, ঢাকা", en: "Banani, Dhaka" },
    type: { bn: "গাড়ি শেয়ারিং", en: "Car sharing" },
    price: 12000,
    sold: 58,
    ret: 11,
    hue: 210,
  },
  {
    name: { bn: "সোলার পাওয়ার প্লান্ট", en: "Solar Power Plant" },
    place: { bn: "সাভার, ঢাকা", en: "Savar, Dhaka" },
    type: { bn: "নবায়নযোগ্য জ্বালানি", en: "Renewable energy" },
    price: 22000,
    sold: 69,
    ret: 18,
    hue: 160,
  },
];

export function FeaturedProjects() {
  const { t, taka, num } = useLang();
  return (
    <section className="bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            align="left"
            eyebrow={{ bn: "ফিচার্ড প্রজেক্ট", en: "Featured projects" }}
            title={{
              bn: "যেসব প্রজেক্টে এখন শেয়ার পাওয়া যাচ্ছে",
              en: "Projects with shares available now",
            }}
          />
          <Reveal>
            <Link
              href="/projects"
              className="group inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              {t({ bn: "সব প্রজেক্ট দেখুন", en: "View all projects" })}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-7 lg:grid-cols-3">
          {PROJECTS.map((p, i) => (
            <Reveal key={i} delay={i * 0.12}>
              <article className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-900/10">
                <div className="relative h-52 overflow-hidden">
                  <SkylineArt
                    hue={p.hue}
                    variant={i}
                    className="h-full w-full transition-transform duration-700 group-hover:scale-110"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800 backdrop-blur">
                    {t(p.type)}
                  </span>
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
                    <Sparkles className="h-3 w-3" />
                    {num(p.ret)}% {t({ bn: "রিটার্ন", en: "return" })}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900">
                    {t(p.name)}
                  </h3>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" />
                    {t(p.place)}
                  </p>

                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-slate-500">
                        {t({ bn: "প্রতি শেয়ার", en: "Per share" })}
                      </p>
                      <p className="text-2xl font-bold text-slate-900">
                        {taka(p.price)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-600">
                      {num(p.sold)}% {t({ bn: "বিক্রিত", en: "sold" })}
                    </p>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${p.sold}%` }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 1.4,
                        delay: 0.3 + i * 0.1,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-500"
                    />
                  </div>

                  <div className="mt-6 flex gap-3">
                    {/* <Link
                      href="/login"
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3.5 text-sm font-semibold text-slate-800 transition group-hover:border-emerald-500 group-hover:bg-emerald-500 group-hover:text-white"
                    >
                      {t({ bn: "শেয়ার নিন", en: "Get shares" })}
                      <ArrowRight className="h-4 w-4" />
                    </Link> */}
                    <Link
                      href={`/features/${i + 1}`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-sky-500 hover:bg-sky-500 hover:text-white"
                    >
                      {t({ bn: "বিস্তারিত দেখুন", en: "View details" })}
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">
          {t({
            bn: "* প্রদর্শিত তথ্য নমুনা মাত্র।",
            en: "* Figures shown are illustrative samples.",
          })}
        </p>
      </div>
    </section>
  );
}

/* ─────────────── 3. Benefits bento ─────────────── */
export function BenefitsBento() {
  const { t } = useLang();
  return (
    <section className="relative overflow-hidden bg-ink-950 py-24 text-white sm:py-32">
      <div className="absolute left-1/2 top-0 h-96 w-[56rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[110px]" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          dark
          eyebrow={{ bn: "কেন Share Project", en: "Why Share Project" }}
          title={{
            bn: "শেয়ার মালিকানা হোক সহজ, স্বচ্ছ ও নিরাপদ",
            en: "Share ownership — simple, transparent, secure",
          }}
        />

        <div className="mt-16 grid auto-rows-[minmax(220px,auto)] gap-5 md:grid-cols-6">
          {/* big transparent reporting tile */}
          <Reveal className="md:col-span-4">
            <div className="glass relative h-full overflow-hidden rounded-[28px] p-8">
              <BarChart3 className="h-7 w-7 text-emerald-300" />
              <h3 className="mt-4 text-2xl font-bold">
                {t({
                  bn: "রিয়েল-টাইম স্বচ্ছ রিপোর্ট",
                  en: "Real-time transparent reports",
                })}
              </h3>
              <p className="mt-2 max-w-md text-white/60">
                {t({
                  bn: "শেয়ার কালেকশন, বকেয়া, পয়েন্ট ও পেনাল্টি — সব রিপোর্ট আপনার হাতের মুঠোয়।",
                  en: "Share collection, dues, points and penalties — every report at your fingertips.",
                })}
              </p>
              <div className="absolute bottom-0 right-6 flex h-36 items-end gap-2.5">
                {[40, 62, 48, 80, 66, 100, 84, 120].map((h, i) => (
                  <motion.span
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: h }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.9,
                      delay: 0.1 * i,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="w-6 rounded-t-lg bg-gradient-to-t from-emerald-500/30 to-emerald-300"
                  />
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="md:col-span-2">
            <div className="relative h-full overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-400 to-sky-500 p-8 text-ink-950">
              <ShieldCheck className="h-7 w-7" />
              <h3 className="mt-4 text-2xl font-bold">
                {t({ bn: "নিরাপদ লেনদেন", en: "Secure payments" })}
              </h3>
              <p className="mt-2 text-ink-900/75">
                {t({
                  bn: "এনক্রিপটেড সেশন ও যাচাইকৃত অ্যাক্সেস।",
                  en: "Encrypted sessions and verified access.",
                })}
              </p>
              <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full border-[18px] border-white/25" />
              <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full border-[18px] border-white/15" />
            </div>
          </Reveal>

          <Reveal delay={0.05} className="md:col-span-2">
            <div className="glass h-full rounded-[28px] p-8">
              <Repeat2 className="h-7 w-7 text-sky-300" />
              <h3 className="mt-4 text-xl font-bold">
                {t({ bn: "সহজ শেয়ার ট্রান্সফার", en: "Easy share transfer" })}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                {t({
                  bn: "প্রয়োজনে শেয়ার অন্যের নামে স্থানান্তর করুন, কাগজপত্র ছাড়াই।",
                  en: "Transfer shares to another holder when needed — paperless.",
                })}
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="md:col-span-2">
            <div className="glass h-full rounded-[28px] p-8">
              <Award className="h-7 w-7 text-gold-400" />
              <h3 className="mt-4 text-xl font-bold">
                {t({ bn: "পয়েন্ট ও রিওয়ার্ড", en: "Points & rewards" })}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                {t({
                  bn: "সময়মতো কিস্তি পরিশোধে পয়েন্ট জমান, বাড়ান আপনার সুবিধা।",
                  en: "Earn points for on-time instalments and unlock more benefits.",
                })}
              </p>
              <p className="mt-5 text-3xl font-bold text-gold-300">
                <CountUp to={2480} />{" "}
                <span className="text-sm font-medium text-white/40">pts</span>
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="md:col-span-2">
            <div className="glass h-full rounded-[28px] p-8">
              <LineChart className="h-7 w-7 text-emerald-300" />
              <h3 className="mt-4 text-xl font-bold">
                {t({ bn: "ছোট অংকে শুরু", en: "Start small" })}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                {t({
                  bn: "একটি মাত্র শেয়ার দিয়েই শুরু করুন এবং ধীরে ধীরে পোর্টফোলিও বড় করুন।",
                  en: "Begin with a single share and grow your portfolio steadily.",
                })}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── 4. Returns calculator ─────────────── */
export function ReturnsCalculator() {
  const { t, taka, num } = useLang();
  const SHARE_PRICE = 25000;
  const [shares, setShares] = useState(20);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(5);

  const { invested, projected, series } = useMemo(() => {
    const invested = shares * SHARE_PRICE;
    const series = Array.from(
      { length: years },
      (_, i) => invested * Math.pow(1 + rate / 100, i + 1),
    );
    return {
      invested,
      projected: series[series.length - 1] ?? invested,
      series,
    };
  }, [shares, rate, years]);
  const max = Math.max(...series, 1);

  const Slider = ({
    label,
    value,
    min,
    max: mx,
    onChange,
    display,
  }: {
    label: Bi;
    value: number;
    min: number;
    max: number;
    onChange: (n: number) => void;
    display: string;
  }) => (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-600">{t(label)}</span>
        <span className="rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-700">
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={mx}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right,#10b981 ${((value - min) / (mx - min)) * 100}%,#e2e8f0 0)`,
        }}
        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full accent-emerald-500"
      />
    </div>
  );

  return (
    <section className="relative overflow-hidden bg-white py-24 sm:py-32">
      <div className="absolute -right-40 top-20 h-96 w-96 rounded-full bg-sky-100 blur-3xl" />
      <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-emerald-100 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow={{ bn: "রিটার্ন ক্যালকুলেটর", en: "Returns calculator" }}
          title={{
            bn: "আপনার শেয়ার কতদূর যেতে পারে?",
            en: "How far can your shares go?",
          }}
          subtitle={{
            bn: "স্লাইডার টেনে দেখুন আনুমানিক ভবিষ্যৎ মূল্য।",
            en: "Drag the sliders to see an estimated future value.",
          }}
        />

        <Reveal className="mt-14">
          <div className="grid overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl shadow-slate-900/5 lg:grid-cols-2">
            <div className="space-y-8 p-8 sm:p-12">
              <Slider
                label={{ bn: "শেয়ার সংখ্যা", en: "Number of shares" }}
                value={shares}
                min={1}
                max={100}
                onChange={setShares}
                display={num(shares)}
              />
              <Slider
                label={{
                  bn: "বার্ষিক রিটার্ন (আনুমানিক)",
                  en: "Annual return (estimated)",
                }}
                value={rate}
                min={5}
                max={25}
                onChange={setRate}
                display={`${num(rate)}%`}
              />
              <Slider
                label={{ bn: "মেয়াদ (বছর)", en: "Duration (years)" }}
                value={years}
                min={1}
                max={10}
                onChange={setYears}
                display={`${num(years)} ${t({ bn: "বছর", en: "yrs" })}`}
              />
              <p className="rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
                {t({
                  bn: "প্রতি শেয়ারের মূল্য ৳২৫,০০০ ধরা হয়েছে। এটি কেবল একটি আনুমানিক হিসাব; প্রকৃত রিটার্ন নিশ্চিত নয়।",
                  en: "Assumes ৳25,000 per share. This is an estimate only; actual returns are not guaranteed.",
                })}
              </p>
            </div>

            <div className="relative overflow-hidden bg-ink-950 p-8 text-white sm:p-12">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/25 blur-[80px]" />
              <p className="relative text-sm text-white/50">
                {t({
                  bn: "আনুমানিক ভবিষ্যৎ মূল্য",
                  en: "Estimated future value",
                })}
              </p>
              <motion.p
                key={projected}
                initial={{ opacity: 0.4, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl"
              >
                <span className="text-gradient">
                  {taka(Math.round(projected))}
                </span>
              </motion.p>
              <div className="relative mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
                  <p className="text-xs text-white/50">
                    {t({ bn: "মোট বিনিয়োগ", en: "Invested" })}
                  </p>
                  <p className="mt-1 text-lg font-bold">{taka(invested)}</p>
                </div>
                <div className="rounded-2xl bg-emerald-400/10 p-4 ring-1 ring-emerald-400/30">
                  <p className="text-xs text-emerald-200/70">
                    {t({ bn: "আনুমানিক লাভ", en: "Est. gain" })}
                  </p>
                  <p className="mt-1 text-lg font-bold text-emerald-300">
                    +{taka(Math.round(projected - invested))}
                  </p>
                </div>
              </div>

              <div className="relative mt-8 flex h-40 items-end gap-2">
                {series.map((v, i) => (
                  <div
                    key={i}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                  >
                    <motion.div
                      layout
                      animate={{ height: `${(v / max) * 100}%` }}
                      transition={{
                        type: "spring",
                        stiffness: 160,
                        damping: 22,
                      }}
                      className="w-full rounded-t-lg bg-gradient-to-t from-emerald-500/40 to-emerald-300"
                    />
                    <span className="text-[10px] text-white/40">
                      {num(i + 1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────── 5. Testimonials + CTA ─────────────── */
export function TestimonialsCta() {
  const { t } = useLang();
  const items = [
    {
      name: { bn: "রাকিবুল ইসলাম", en: "Rakibul Islam" },
      role: { bn: "ব্যবসায়ী, ঢাকা", en: "Businessman, Dhaka" },
      text: {
        bn: "প্রতিটি কিস্তির হিসাব ড্যাশবোর্ডে পরিষ্কার দেখতে পারি। এই স্বচ্ছতাই আমাকে সবচেয়ে বেশি আস্থা দিয়েছে।",
        en: "I can see every instalment clearly on the dashboard. That transparency gives me the most confidence.",
      },
      g: "from-emerald-400 to-teal-500",
    },
    {
      name: { bn: "সাবরিনা আহমেদ", en: "Sabrina Ahmed" },
      role: { bn: "ব্যাংকার, চট্টগ্রাম", en: "Banker, Chattogram" },
      text: {
        bn: "ছোট অংকে শুরু করে এখন আমার তিনটি প্রজেক্টে শেয়ার আছে। রিপোর্টগুলো সত্যিই পেশাদার।",
        en: "I started small and now hold shares in three projects. The reports are truly professional.",
      },
      g: "from-sky-400 to-indigo-500",
    },
    {
      name: { bn: "তানভীর হোসেন", en: "Tanvir Hossain" },
      role: { bn: "প্রবাসী বিনিয়োগকারী", en: "Expat investor" },
      text: {
        bn: "দেশের বাইরে থেকেও পুরো পোর্টফোলিও নিয়ন্ত্রণে রাখতে পারি — বাংলা ইন্টারফেসটা বড় সুবিধা।",
        en: "I manage my whole portfolio from abroad — the Bangla interface is a big plus.",
      },
      g: "from-amber-300 to-orange-500",
    },
  ];
  return (
    <section className="bg-slate-50 pb-24 pt-24 sm:pt-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow={{ bn: "শেয়ারহোল্ডারদের কথা", en: "Shareholder stories" }}
          title={{
            bn: "যাঁরা আমাদের সঙ্গে পথ চলছেন",
            en: "Voices from those walking with us",
          }}
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <figure className="relative h-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition duration-500 hover:-translate-y-1.5 hover:shadow-xl">
                <Quote className="absolute right-7 top-7 h-9 w-9 text-emerald-100" />
                <div className="flex gap-0.5 text-gold-500">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-5 text-[15px] leading-relaxed text-slate-700">
                  “{t(it.text)}”
                </blockquote>
                <figcaption className="mt-7 flex items-center gap-3">
                  <span
                    className={`h-11 w-11 rounded-full bg-gradient-to-br ${it.g}`}
                  />
                  <span>
                    <b className="block text-sm text-slate-900">{t(it.name)}</b>
                    <span className="text-xs text-slate-500">{t(it.role)}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        {/* CTA */}
        <Reveal className="mt-24">
          <div className="relative overflow-hidden rounded-[36px] bg-ink-950 px-8 py-16 text-center text-white sm:px-16 sm:py-20">
            <div className="bg-grid absolute inset-0 opacity-60" />
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute left-1/2 top-0 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-500/40 to-sky-500/40 blur-[90px]"
            />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl">
                {t({
                  bn: "আজই আপনার প্রথম শেয়ার নিন",
                  en: "Take your first share today",
                })}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-white/60">
                {t({
                  bn: "লগইন করুন এবং আপনার ড্যাশবোর্ডে শেয়ার পোর্টফোলিও গড়ে তুলুন।",
                  en: "Log in and start building your share portfolio on your dashboard.",
                })}
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-4">
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-[15px] font-semibold text-ink-950 transition hover:scale-105"
                >
                  {t({ bn: "লগইন করুন", en: "Login now" })}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/contact"
                  className="rounded-full px-8 py-4 text-[15px] font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/10"
                >
                  {t({ bn: "আমাদের সাথে কথা বলুন", en: "Talk to us" })}
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
