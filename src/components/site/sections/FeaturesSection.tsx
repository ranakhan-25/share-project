"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Gem, User, ArrowRight, PieChart, FileCheck, TrendingUp, ShieldCheck } from "lucide-react";
import { useLang } from "@/lib/i18n";

// ডেমো ডাটা - শেয়ার প্রজেক্টের জন্য আপডেট করা হয়েছে
const FEATURES_DAILY = [
  {
    icon: <PieChart className="h-6 w-6 text-emerald-600" />,
    title: { bn: "সহজ শেয়ার ক্রয়", en: "Easy Share Purchase" },
    desc: {
      bn: "খুব অল্প পরিমাণ অর্থ দিয়ে যেকোনো প্রজেক্টের শেয়ার কিনুন। কোনো লুকানো চার্জ নেই, সম্পূর্ণ স্বচ্ছ প্রক্রিয়া।",
      en: "Buy shares in any project with a very small amount. No hidden charges, completely transparent process.",
    },
  },
  {
    icon: <FileCheck className="h-6 w-6 text-emerald-600" />,
    title: { bn: "স্বয়ংক্রিয় কিস্তি ও রিপোর্ট", en: "Automated Instalments & Reports" },
    desc: {
      bn: "শেয়ার কেনার পর কিস্তি পরিশোধ থেকে শুরু করে প্রতিদিনের লাভ-ক্ষতির রিপোর্ট—সবকিছু ট্র্যাক করুন এক ড্যাশবোর্ডে।",
      en: "From paying instalments to tracking daily profit-loss reports — manage everything in one dashboard.",
    },
  },
];

const FEATURES_SMART = [
  {
    icon: <TrendingUp className="h-6 w-6 text-emerald-600" />,
    title: { bn: "রিয়েল-টাইম রিটার্ন", en: "Real-time Returns" },
    desc: {
      bn: "আপনার বিনিয়োগকৃত প্রজেক্টের অগ্রগতি এবং সম্ভাব্য রিটার্ন রিয়েল-টাইমে পর্যবেক্ষণ করুন।",
      en: "Monitor the progress and potential returns of your invested projects in real-time.",
    },
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-emerald-600" />,
    title: { bn: "লিগ্যাল ও ভেরিফাইড প্রজেক্ট", en: "Legal & Verified Projects" },
    desc: {
      bn: "আমরা শুধুমাত্র লিগ্যালি ভেরিফাইড এবং নিরাপদ প্রজেক্টেই শেয়ার বিনিয়োগের সুযোগ দিই।",
      en: "We only offer share investment opportunities in legally verified and secure projects.",
    },
  },
];

export function ShareProjectFeatures() {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState<"daily" | "smart">("daily");

  const activeFeatures = activeTab === "daily" ? FEATURES_DAILY : FEATURES_SMART;

  return (
    <section className="relative overflow-hidden bg-white text-ink-950 pt-10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        
        {/* Top Heading */}
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
          >
            {t({ 
              bn: "শেয়ার বিনিয়োগে সফল হতে যা যা প্রয়োজন", 
              en: "Everything You Need to Master Share Investing" 
            })}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="max-w-sm text-sm leading-relaxed text-ink-950/60 md:text-right"
          >
            {t({
              bn: "Share Project-এর সাথে আপনি পাচ্ছেন সম্পূর্ণ স্বচ্ছ ও নিরাপদ বিনিয়োগ ব্যবস্থা—যা আপনার আর্থিক ভবিষ্যৎ গড়তে সাহায্য করবে।",
              en: "With Share Project, you get a fully transparent and secure investment system — built to help shape your financial future.",
            })}
          </motion.p>
        </div>

        {/* Toggle Switch */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-12 flex justify-center"
        >
          <div className="inline-flex items-center rounded-full bg-black/[0.04] p-1.5 ring-1 ring-black/10">
            <button
              onClick={() => setActiveTab("daily")}
              className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all ${
                activeTab === "daily"
                  ? "bg-white text-ink-950 shadow-sm ring-1 ring-black/5"
                  : "text-ink-950/60 hover:text-ink-950"
              }`}
            >
              <Gem className="h-4 w-4" />
              {t({ bn: "নতুন বিনিয়োগকারী", en: "New Investor" })}
            </button>
            <button
              onClick={() => setActiveTab("smart")}
              className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all ${
                activeTab === "smart"
                  ? "bg-white text-ink-950 shadow-sm ring-1 ring-black/5"
                  : "text-ink-950/60 hover:text-ink-950"
              }`}
            >
              <User className="h-4 w-4" />
              {t({ bn: "স্মার্ট বিনিয়োগকারী", en: "Smart Investor" })}
            </button>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
          
          {/* Left Side: Image Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative flex min-h-[400px] flex-col justify-end overflow-hidden rounded-3xl bg-slate-200 p-8 shadow-sm"
          >
            <Image
              src="/image/images6.jpg" // আপনার ইমেজের পাথ দিন
              alt="People investing"
              fill
              className="object-cover"
            />
            {/* Overlay Gradient - ছবি ও টেক্সট আলাদা করার জন্য */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            
            <div className="relative z-10 flex items-end justify-between gap-4">
              <p className="max-w-[280px] text-sm leading-relaxed text-white/90">
                {t({
                  bn: "ছোট অংকে প্রজেক্টের মালিকানা নিন। শেয়ার কেনা থেকে কিস্তি, রিপোর্ট ও রিটার্ন — সবকিছু স্বচ্ছভাবে ট্র্যাক করুন এক ড্যাশবোর্ডে।",
                  en: "Take ownership in real projects with small amounts. Track everything from share purchase to instalments, reports and returns — transparently, in one dashboard.",
                })}
              </p>
              <button className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#d1f366] px-6 py-3 text-sm font-semibold text-ink-950 transition hover:scale-105 active:scale-95">
                {t({ bn: "শেয়ার কিনুন", en: "Buy Shares" })}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>

          {/* Right Side: Features List & Bottom Card */}
          <div className="flex flex-col gap-6">
            
            {/* Feature Cards (Lime Green) */}
            <div className="flex flex-col gap-3 rounded-3xl bg-[#d1f366] p-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-2"
                >
                  {activeFeatures.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 rounded-2xl bg-transparent p-6 transition hover:bg-black/5"
                    >
                      {/* আইকন ব্যাকগ্রাউন্ড সাদা করা হয়েছে */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                        {feature.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-ink-950">
                          {t(feature.title)}
                        </h4>
                        <p className="mt-1 text-sm leading-relaxed text-ink-950/70">
                          {t(feature.desc)}
                        </p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Card - এখন হালকা ধূসর বা সাদা শ্যাডো যুক্ত */}
            <div className="flex flex-1 flex-col justify-center rounded-3xl bg-slate-50 p-8 ring-1 ring-black/5 shadow-sm">
              <p className="text-sm leading-relaxed text-ink-950/70">
                {t({
                  bn: "Share Project-এর মাধ্যমে আপনার বিনিয়োগ সম্পূর্ণ ডিজিটাল এবং স্বচ্ছ। প্রতিটি টাকা কোথায় যাচ্ছে এবং কতটা রিটার্ন আসছে, তা জানুন মুহূর্তেই।",
                  en: "Your investments are fully digital and transparent with Share Project. Know exactly where every penny goes and how much return is generated, instantly.",
                })}
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}