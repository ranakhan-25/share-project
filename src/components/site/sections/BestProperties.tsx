"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useLang } from "@/lib/i18n";

export function BestProperties() {
  const { t, taka } = useLang();

  return (
    <section className="bg-white py-10 text-ink-950 ">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 sm:mb-14"
        >
          <h2 className="flex flex-wrap gap-x-3 text-4xl tracking-tight sm:text-5xl lg:text-6xl">
            {/* Serif Font for "Best" */}
            <span className="font-serif text-ink-950">
              {t({ bn: "সেরা", en: "Best" })}
            </span>
            {/* Italic Serif Font for "properties" */}
            <span className="font-serif italic text-ink-950/60">
              {t({ bn: "প্রপার্টিসমূহ", en: "properties" })}
            </span>
          </h2>
        </motion.div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.3fr_0.7fr] md:gap-8">
          {/* Left Large Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="group cursor-pointer"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-black/5 sm:rounded-3xl">
              <Image
                src="/image/images5.jpg"
                alt="Apartment"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 60vw"
              />
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-ink-950/50">
                {taka(312000, true)}
              </p>
              <h3 className="mt-1 text-xl font-medium text-ink-950 sm:text-2xl">
                {t({
                  bn: "৫৬.৮ বর্গমিটার অ্যাপার্টমেন্ট",
                  en: "56.8 m² apartment",
                })}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {/* 🎯 লাইট মোডে ট্যাগগুলোকে হালকা ধূসর করা হয়েছে */}
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-ink-950/70">
                  {t({ bn: "২ বেডরুম", en: "2 bedrooms" })}
                </span>
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-ink-950/70">
                  {t({ bn: "১ বাথরুম", en: "1 bathroom" })}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right Small Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="group cursor-pointer"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-black/5 sm:rounded-3xl md:aspect-[3/2]">
              <Image
                src="/image/images4.jpg" // আপনার ইমেজের পাথ দিন
                alt="House"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-ink-950/50">
                {taka(370000, true)}
              </p>
              <h3 className="mt-1 text-xl font-medium text-ink-950 sm:text-2xl">
                {t({ bn: "৫৬.৮ বর্গমিটার বাড়ি", en: "56.8 m² house" })}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-ink-950/70">
                  {t({ bn: "৩ বেডরুম", en: "3 bedrooms" })}
                </span>
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-ink-950/70">
                  {t({ bn: "৩ বাথরুম", en: "3 bathrooms" })}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
