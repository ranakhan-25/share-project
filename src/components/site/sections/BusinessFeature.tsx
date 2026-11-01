"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Check, ArrowRight } from "lucide-react";
import { useLang } from "@/lib/i18n";

export function BusinessFeature() {
  const { t } = useLang();

  const features = [
    {
      bn: "স্বয়ংক্রিয়ভাবে প্রতিটি এজেন্টের কাজ এবং লিড অ্যাসাইন করুন",
      en: "Assign and track leads across every agent automatically",
    },
    {
      bn: "একটি ইনভেন্টরিতে ফাইল, জমি এবং বুকিং পরিচালনা করুন",
      en: "Manage files, land, and bookings in one inventory",
    },
    {
      bn: "স্প্রেডশিট ছাড়াই ইনভয়েস এবং পেমেন্ট ট্র্যাক করুন",
      en: "Generate invoices and track payments without spreadsheets",
    },
    {
      bn: "এক নজরে টিম পারফরম্যান্স এবং পাইপলাইনের স্বাস্থ্য দেখুন",
      en: "See team performance and pipeline health at a glance",
    },
  ];

  return (
    <section className="bg-[#F4F5F4] py-20 px-5">
      {/* 🎯 max-w-7xl এবং px-5 sm:px-8 আপনার অন্যান্য সেকশনের সাথে মিল রাখা হয়েছে */}
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-emerald-600">
            {t({ bn: "এজেন্সিগুলোর জন্য", en: "FOR AGENCIES" })}
          </p>

          <h2 className="font-serif text-6xl italic tracking-tight text-[#C8A265] sm:text-7xl">
            {t({ bn: "ব্যবসা", en: "Business" })}
          </h2>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-600">
            {t({
              bn: "প্রথম ধাপ থেকে শেষ হ্যান্ডওভার পর্যন্ত, আপনার পুরো দলকে একটি শেয়ার্ড সিস্টেম দিন—বিক্রয়, বিলিং এবং রিপোর্টিংয়ের জন্য। আর পাঁচটি ভিন্ন টুল ব্যবহার করে জটিলতা বাড়ানোর দরকার নেই।",
              en: "From the first lead to the final handover, give your entire team one shared system for sales, billing, and reporting — no more juggling five different tools.",
            })}
          </p>

          <ul className="mt-8 space-y-4">
            {features.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-700">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  strokeWidth={3}
                />
                <span className="text-sm">{t(item)}</span>
              </li>
            ))}
          </ul>

          {/* 🎯 বাটনটি rounded-full করা হয়েছে এবং শ্যাডো যোগ করা হয়েছে */}
          <button className="mt-10 flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:scale-[1.02] hover:bg-emerald-700 active:scale-95">
            {t({ bn: "ফ্রি ট্রায়াল শুরু করুন", en: "Start Free Trial" })}
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>

        {/* Right Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          {/* মেইন ড্যাশবোর্ড ইমেজ */}
          <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl shadow-black/5 ring-1 ring-black/5">
            <Image
              src="/image/images8.jpg" // আপনার ইমেজের পাথ দিন
              alt="Dashboard"
              width={800}
              height={500}
              className="w-full object-cover"
            />
          </div>

          {/* ছোট ওভারল্যাপিং ইমেজ (ঐচ্ছিক) */}
          <div className="absolute -bottom-6 -left-6 h-32 w-48 overflow-hidden rounded-xl border-4 border-white shadow-lg shadow-black/10 sm:h-40 sm:w-64">
            <Image
              src="/image/images7.jpg" // আপনার ইমেজের পাথ দিন
              alt="Team member"
              fill
              className="object-cover"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
