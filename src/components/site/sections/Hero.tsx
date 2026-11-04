"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, PlayCircle } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { CountUp } from "@/components/ui/CountUp";
import Image from "next/image";

const AVATARS = [
  "from-emerald-400 to-teal-500",
  "from-sky-400 to-indigo-500",
  "from-amber-300 to-orange-500",
  "from-fuchsia-400 to-purple-500",
];

function HeroVisual() {
  return (
    <div className="relative mx-auto flex h-[400px] w-full max-w-[600px] items-center justify-center lg:h-[500px]">
      {/* Soft glow */}
      <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/15 blur-[110px]" />

      {/* Full Image */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.9,
          delay: 0.2,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative w-full overflow-hidden rounded-3xl shadow-2xl shadow-black/10"
      >
        <div className="relative aspect-[4/3] w-full min-h-[300px] lg:min-h-[480px]">
          <Image
            src="/image/images1.jpg"
            alt="Portfolio growth chart"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
            priority
          />
        </div>
      </motion.div>
    </div>
  );
}

export function Hero() {
  const { t } = useLang();

  return (
    <section className="relative isolate overflow-hidden bg-white pb-14 pt-32 text-ink-950">
      {/* Backgrounds */}
      <div className="bg-grid absolute inset-0 -z-10 opacity-[0.15]" />

      <motion.div
        animate={{ x: [0, 60, 0], y: [0, 30, 0] }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -left-40 top-0 -z-10 h-[34rem] w-[34rem] rounded-full bg-emerald-400/15 blur-[120px]"
      />

      <motion.div
        animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -right-32 top-24 -z-10 h-[30rem] w-[30rem] rounded-full bg-sky-400/15 blur-[120px]"
      />

      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-white to-transparent" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-8">
        {/* Left Content */}
        <div className="z-10 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex w-fit items-center gap-2.5 rounded-full bg-black/[0.04] py-1.5 pl-2 pr-4 text-sm text-ink-950/70 ring-1 ring-black/10"
          >
            <span className="rounded-full bg-emerald-400 px-2.5 py-0.5 text-[11px] font-bold uppercase text-ink-950">
              {t({ bn: "নতুন", en: "New" })}
            </span>

            {t({
              bn: "নতুন প্রজেক্টে শেয়ার এখন উন্মুক্ত",
              en: "Shares open in new projects",
            })}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-6 flex flex-col"
          >
            {/* First Title - Marko One */}
            <span
              className="text-[44px] font-normal leading-[1.2] tracking-tight text-ink-950 sm:text-6xl lg:text-[68px]"
              style={{ fontFamily: '"Marko One", serif' }}
            >
              {t({ bn: "বিশ্বস্ত শেয়ারে", en: "Own a share of" })}
            </span>

            {/* Second Title - Marko One */}
            <span
              className=" block text-[54px] font-normal leading-[1.3] text-emerald-600 sm:text-7xl lg:text-[96px]"
              style={{ fontFamily: '"Marko One", serif' }}
            >
              {t({
                bn: "গড়ুন আপনার ভবিষ্যৎ",
                en: "tomorrow’s best projects",
              })}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.25,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-6 max-w-lg text-base leading-relaxed text-ink-950/70 sm:text-lg"
          >
            {t({
              bn: "ছোট অংকে প্রজেক্টের মালিকানা নিন। শেয়ার কেনা থেকে কিস্তি, রিপোর্ট ও রিটার্ন — সবকিছু স্বচ্ছভাবে ট্র্যাক করুন এক ড্যাশবোর্ডে।",
              en: "Take ownership in real projects with small amounts. Track everything from share purchase to instalments, reports and returns — transparently, in one dashboard.",
            })}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 px-7 py-4 text-[15px] font-semibold text-ink-950 shadow-lg shadow-emerald-500/20 transition hover:scale-[1.04] active:scale-95"
            >
              {t({ bn: "শুরু করুন", en: "Get started" })}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/features"
              className="inline-flex items-center gap-2 rounded-full px-5 py-4 text-[15px] font-semibold text-ink-950 ring-1 ring-black/15 transition hover:bg-black/5"
            >
              <PlayCircle className="h-5 w-5 text-emerald-600" />
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
                <span
                  key={i}
                  className={`h-10 w-10 rounded-full bg-gradient-to-br ${g} ring-2 ring-white`}
                />
              ))}
            </div>

            <p className="text-sm leading-snug text-ink-950/60">
              <b className="text-ink-950">
                <CountUp to={12000} suffix="+" />
              </b>{" "}
              {t({
                bn: "শেয়ারহোল্ডার আমাদের উপর আস্থা রেখেছেন",
                en: "shareholders trust Share Project",
              })}
            </p>
          </motion.div>
        </div>

        {/* Right Side - Image */}
        <HeroVisual />
      </div>
    </section>
  );
}

export function StatsStrip() {
  const { t, taka } = useLang();

  const items = [
    {
      node: <CountUp to={12000} suffix="+" />,
      label: { bn: "সক্রিয় শেয়ারহোল্ডার", en: "Active shareholders" },
    },
    {
      node: <CountUp to={48} suffix="+" />,
      label: { bn: "চলমান প্রজেক্ট", en: "Live projects" },
    },
    {
      node: <span>{taka(320000000, true)}</span>,
      label: { bn: "মোট শেয়ার মূল্য", en: "Total share value" },
    },
    {
      node: <CountUp to={99.8} decimals={1} suffix="%" />,
      label: { bn: "সময়মতো কালেকশন", en: "On-time collection" },
    },
  ];

  return (
    <section className="relative z-10 bg-white pb-4">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-black/8 ring-1 ring-black/10 lg:grid-cols-4">
          {items.map((it, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white px-6 py-7 text-center"
            >
              <p className="text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">
                {it.node}
              </p>

              <p className="mt-1.5 text-sm text-ink-950/50">{t(it.label)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
