"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, BadgeCheck, PlayCircle, ShieldCheck, TrendingUp } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { CountUp } from "@/components/ui/CountUp";

const AVATARS = ["from-emerald-400 to-teal-500", "from-sky-400 to-indigo-500", "from-amber-300 to-orange-500", "from-fuchsia-400 to-purple-500"];

function HeroVisual() {
  const { t, taka } = useLang();
  const line = "M0,150 C40,140 60,120 100,124 C140,128 160,80 205,86 C250,92 262,40 300,46 C330,50 340,28 360,20";
  return (
    <div className="relative mx-auto h-[460px] w-full max-w-[560px]">
      {/* glow */}
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/25 blur-[90px]" />

      {/* main portfolio card */}
      <motion.div
        initial={{ opacity: 0, y: 40, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="glass absolute left-0 top-10 w-[88%] rounded-3xl p-6 shadow-2xl shadow-black/40"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-white/50">
              {t({ bn: "আপনার পোর্টফোলিও", en: "Your portfolio" })}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white">{taka(2458000)}</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
            <TrendingUp className="h-3.5 w-3.5" /> +12.4%
          </span>
        </div>
        <svg viewBox="0 0 360 170" className="mt-5 w-full">
          <defs>
            <linearGradient id="hero-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#34d399" stopOpacity=".35" />
              <stop offset="1" stopColor="#34d399" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="hero-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#34d399" />
              <stop offset="1" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          {[40, 80, 120].map((y) => (
            <line key={y} x1="0" x2="360" y1={y} y2={y} stroke="white" strokeOpacity=".07" strokeDasharray="4 6" />
          ))}
          <motion.path
            d={`${line} L360,170 L0,170 Z`}
            fill="url(#hero-fill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
          />
          <motion.path
            d={line}
            fill="none"
            stroke="url(#hero-line)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.6, duration: 1.8, ease: "easeInOut" }}
          />
          <motion.circle
            cx="360"
            cy="20"
            r="5"
            fill="#fff"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2.3 }}
          />
        </svg>
        <div className="mt-2 flex justify-between text-[11px] text-white/40">
          {["জানু", "মার্চ", "মে", "জুলাই", "সেপ্টে", "নভে"].map((m, i) => (
            <span key={i}>{t({ bn: m, en: ["Jan", "Mar", "May", "Jul", "Sep", "Nov"][i] })}</span>
          ))}
        </div>
      </motion.div>

      {/* share certificate card */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="absolute -right-2 bottom-4 w-[64%] animate-float"
      >
        <div className="rounded-2xl bg-gradient-to-br from-gold-300 via-gold-400 to-amber-500 p-px shadow-2xl shadow-amber-500/20">
          <div className="rounded-[15px] bg-ink-900/95 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-300">
                {t({ bn: "শেয়ার সার্টিফিকেট", en: "Share certificate" })}
              </span>
              <BadgeCheck className="h-4 w-4 text-emerald-300" />
            </div>
            <p className="mt-3 text-sm font-semibold text-white">
              {t({ bn: "স্কাইলাইন হাইটস", en: "Skyline Heights" })}
            </p>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] text-white/40">{t({ bn: "শেয়ার সংখ্যা", en: "Shares held" })}</p>
                <p className="text-xl font-bold text-white">
                  <CountUp to={48} />
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/40">ID</p>
                <p className="font-mono text-xs text-white/70">SP-2048-0091</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* floating chips */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.1, type: "spring" }}
        className="absolute -top-1 right-4 animate-float-slow"
      >
        <div className="glass flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-xl">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/20 text-emerald-300">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] text-white/50">{t({ bn: "নিরাপত্তা", en: "Security" })}</p>
            <p className="text-sm font-semibold text-white">{t({ bn: "যাচাইকৃত", en: "Verified" })}</p>
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.4, type: "spring" }}
        className="absolute bottom-0 left-6 animate-float"
        style={{ animationDelay: "-2s" }}
      >
        <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl">
          <div className="relative grid h-10 w-10 place-items-center">
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-emerald-400/50" />
            <span className="relative h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <div>
            <p className="text-[11px] text-white/50">{t({ bn: "আজকের কালেকশন", en: "Collected today" })}</p>
            <p className="text-sm font-semibold text-white">{taka(184500)}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function Hero() {
  const { t } = useLang();
  return (
    <section className="relative isolate overflow-hidden bg-ink-950 pb-24 pt-32 text-white sm:pt-36 lg:pb-32">
      {/* backgrounds */}
      <div className="bg-grid absolute inset-0 -z-10" />
      <motion.div
        animate={{ x: [0, 60, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-40 top-0 -z-10 h-[34rem] w-[34rem] rounded-full bg-emerald-500/20 blur-[120px]"
      />
      <motion.div
        animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-32 top-24 -z-10 h-[30rem] w-[30rem] rounded-full bg-sky-500/20 blur-[120px]"
      />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-ink-950 to-transparent" />

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.07] py-1.5 pl-2 pr-4 text-sm text-white/80 ring-1 ring-white/15"
          >
            <span className="rounded-full bg-emerald-400 px-2.5 py-0.5 text-[11px] font-bold uppercase text-ink-950">
              {t({ bn: "নতুন", en: "New" })}
            </span>
            {t({ bn: "নতুন প্রজেক্টে শেয়ার এখন উন্মুক্ত", en: "Shares open in new projects" })}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 text-[40px] font-extrabold leading-[1.15] tracking-tight sm:text-6xl lg:text-[68px]"
          >
            {t({ bn: "বিশ্বস্ত শেয়ারে", en: "Own a share of" })}
            <br />
            <span className="text-gradient">{t({ bn: "গড়ুন আপনার ভবিষ্যৎ", en: "tomorrow’s best projects" })}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-white/65"
          >
            {t({
              bn: "ছোট অংকে প্রজেক্টের মালিকানা নিন। শেয়ার কেনা থেকে কিস্তি, রিপোর্ট ও রিটার্ন — সবকিছু স্বচ্ছভাবে ট্র্যাক করুন এক ড্যাশবোর্ডে।",
              en: "Take ownership in real projects with small amounts. Track everything from share purchase to instalments, reports and returns — transparently, in one dashboard.",
            })}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 px-7 py-4 text-[15px] font-semibold text-ink-950 shadow-xl shadow-emerald-500/30 transition hover:scale-[1.04] active:scale-95"
            >
              {t({ bn: "শুরু করুন", en: "Get started" })}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/features"
              className="inline-flex items-center gap-2 rounded-full px-5 py-4 text-[15px] font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/10"
            >
              <PlayCircle className="h-5 w-5 text-emerald-300" />
              {t({ bn: "ফিচার দেখুন", en: "Explore features" })}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 flex items-center gap-4"
          >
            <div className="flex -space-x-3">
              {AVATARS.map((g, i) => (
                <span key={i} className={`h-10 w-10 rounded-full bg-gradient-to-br ${g} ring-2 ring-ink-950`} />
              ))}
            </div>
            <p className="text-sm leading-snug text-white/60">
              <b className="text-white">
                <CountUp to={12000} suffix="+" />
              </b>{" "}
              {t({ bn: "শেয়ারহোল্ডার আমাদের উপর আস্থা রেখেছেন", en: "shareholders trust Share Project" })}
            </p>
          </motion.div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

export function StatsStrip() {
  const { t, taka } = useLang();
  const items = [
    { node: <CountUp to={12000} suffix="+" />, label: { bn: "সক্রিয় শেয়ারহোল্ডার", en: "Active shareholders" } },
    { node: <CountUp to={48} suffix="+" />, label: { bn: "চলমান প্রজেক্ট", en: "Live projects" } },
    { node: <span>{taka(320000000, true)}</span>, label: { bn: "মোট শেয়ার মূল্য", en: "Total share value" } },
    { node: <CountUp to={99.8} decimals={1} suffix="%" />, label: { bn: "সময়মতো কালেকশন", en: "On-time collection" } },
  ];
  return (
    <section className="relative z-10 bg-ink-950 pb-4">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-white/10 ring-1 ring-white/10 lg:grid-cols-4">
          {items.map((it, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-ink-900/80 px-6 py-7 text-center backdrop-blur"
            >
              <p className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{it.node}</p>
              <p className="mt-1.5 text-sm text-white/50">{t(it.label)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
