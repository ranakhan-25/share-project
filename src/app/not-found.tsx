"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Home, Search, Compass } from "lucide-react";
import { useLang, type Bi } from "@/lib/i18n";
import { Reveal } from "@/components/ui/Reveal";

export default function NotFound() {
  const { t } = useLang();

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-5 py-20 sm:px-8">
      {/* Soft background glows */}
      <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="relative mx-auto max-w-2xl text-center">
        <Reveal>
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-[110px] font-black leading-none tracking-tight text-transparent sm:text-[160px]"
          >
            404
          </motion.p>
        </Reveal>

        <Reveal delay={0.1}>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {t({ bn: "পেজটি খুঁজে পাওয়া যায়নি", en: "Page not found" })}
          </h1>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-500 sm:text-base">
            {t({
              bn: "দুঃখিত, আপনি যে পেজটি খুঁজছেন সেটি সরানো হয়েছে, নাম পরিবর্তন করা হয়েছে অথবা কখনোই ছিল না।",
              en: "Sorry, the page you're looking for has been moved, renamed, or never existed.",
            })}
          </p>
        </Reveal>

        {/* Decorative card / compass */}
        <Reveal delay={0.25}>
          <div className="mx-auto mt-10 flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
            <Compass className="h-9 w-9 animate-spin-slow text-emerald-500" />
          </div>
        </Reveal>

        {/* Actions */}
        <Reveal delay={0.35}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-600 sm:w-auto"
            >
              <Home className="h-4 w-4" />
              {t({ bn: "হোমে ফিরুন", en: "Back to home" })}
            </Link>

            <Link
              href="/projects"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-emerald-500 hover:text-emerald-600 sm:w-auto"
            >
              <Search className="h-4 w-4" />
              {t({ bn: "প্রজেক্ট দেখুন", en: "Browse projects" })}
            </Link>

            <button
              onClick={() => window.history.back()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-slate-500 transition hover:text-slate-900 sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              {t({ bn: "পিছনে যান", en: "Go back" })}
            </button>
          </div>
        </Reveal>

        <Reveal delay={0.45}>
          <p className="mt-12 text-xs text-slate-400">
            {t({
              bn: "সাহায্য প্রয়োজন? আমাদের সাথে যোগাযোগ করুন।",
              en: "Need help? Get in touch with our team.",
            })}{" "}
            <Link
              href="/contact"
              className="font-semibold text-emerald-600 hover:underline"
            >
              {t({ bn: "যোগাযোগ", en: "Contact" })}
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
