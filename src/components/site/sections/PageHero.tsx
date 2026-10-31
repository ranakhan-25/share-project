"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { useLang, type Bi } from "@/lib/i18n";

type Variant = "features" | "about" | "contact";

function Decoration({ variant }: { variant: Variant }) {
  if (variant === "about") {
    return (
      <div className="pointer-events-none absolute -right-24 top-1/2 hidden h-[520px] w-[520px] -translate-y-1/2 lg:block">
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-0 m-auto rounded-full border border-emerald-300/20"
            style={{ width: 140 + i * 110, height: 140 + i * 110 }}
            animate={{ rotate: i % 2 ? 360 : -360 }}
            transition={{ duration: 40 + i * 12, repeat: Infinity, ease: "linear" }}
          >
            <span
              className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-emerald-300"
              style={{ boxShadow: "0 0 18px #6ee7b7" }}
            />
          </motion.span>
        ))}
        <div className="absolute inset-0 m-auto h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 blur-xl" />
      </div>
    );
  }
  if (variant === "contact") {
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <motion.svg
            key={i}
            viewBox="0 0 1440 160"
            className="absolute bottom-0 w-[200%]"
            preserveAspectRatio="none"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 22 + i * 8, repeat: Infinity, ease: "linear" }}
            style={{ opacity: 0.18 - i * 0.05 }}
          >
            <path
              d="M0,80 C120,20 240,140 360,80 C480,20 600,140 720,80 C840,20 960,140 1080,80 C1200,20 1320,140 1440,80 L1440,160 L0,160 Z"
              fill="#34d399"
            />
          </motion.svg>
        ))}
      </div>
    );
  }
  // features
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute rounded-2xl border border-white/10 bg-white/[0.04]"
          style={{
            width: 36 + (i % 4) * 14,
            height: 36 + (i % 4) * 14,
            left: `${(i * 37) % 100}%`,
            top: `${12 + ((i * 53) % 70)}%`,
          }}
          animate={{ y: [0, -22, 0], rotate: [0, 12, 0] }}
          transition={{ duration: 6 + (i % 5), repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export function PageHero({
  variant,
  eyebrow,
  title,
  highlight,
  subtitle,
}: {
  variant: Variant;
  eyebrow: Bi;
  title: Bi;
  highlight: Bi;
  subtitle: Bi;
}) {
  const { t } = useLang();
  return (
    <section className="relative isolate overflow-hidden bg-ink-950 pb-24 pt-36 text-white sm:pb-28 sm:pt-44">
      <div className="bg-grid absolute inset-0 -z-10" />
      <div
        className={`absolute -z-10 h-[30rem] w-[30rem] rounded-full blur-[120px] ${
          variant === "about"
            ? "-left-20 top-0 bg-sky-500/20"
            : variant === "contact"
              ? "right-0 top-0 bg-emerald-500/20"
              : "left-1/3 -top-20 bg-emerald-500/20"
        }`}
      />
      <Decoration variant={variant} />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <motion.nav
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 text-sm text-white/50"
        >
          <Link href="/" className="transition hover:text-white">
            {t({ bn: "হোম", en: "Home" })}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-emerald-300">{t(eyebrow)}</span>
        </motion.nav>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.15] tracking-tight sm:text-6xl"
        >
          {t(title)} <span className="text-gradient">{t(highlight)}</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60"
        >
          {t(subtitle)}
        </motion.p>
      </div>
    </section>
  );
}
