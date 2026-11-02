"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useLang } from "@/lib/i18n";

const experiences = [
  {
    title: {
      bn: "আর্কিটেকচার এক্সপেরিয়েন্স",
      en: "ARCHITECTURE EXPERIENCE",
    },
    years: "20+ Year",
    desc: {
      bn: "ইউনিক ও এসথেটিক বিবেচনায় রেখে বিভিন্ন আর্কিটেকচারাল সমাধান তৈরি করা",
      en: "Menyusun berbagai solusi arsitektur dengan mempertimbangkan keunikan dan estetika",
    },
  },
  {
    title: {
      bn: "প্রজেক্ট ম্যানেজিং এক্সপেরিয়েন্স",
      en: "PROJECT MANAGING EXPERIENCE",
    },
    years: "25+ Year",
    desc: {
      bn: "প্রজেক্ট সঠিকভাবে চালানোর জন্য সেরা পরিকল্পনা নিশ্চিত করা",
      en: "Memastikan perencanaan terbaik untuk memastikan berjalannya proyek",
    },
  },
  {
    title: {
      bn: "কনস্ট্রাকশন এক্সপেরিয়েন্স",
      en: "CONSTRUCTION EXPERIENCE",
    },
    years: "15+ Year",
    desc: {
      bn: "সেরা ফলাফল ও মানসম্পন্ন নির্মাণ সমাধান তৈরি করা",
      en: "Membangun berbagai solusi konstruksi dengan hasil yang memuaskan dan terbaik",
    },
  },
];

const services = [
  {
    id: "01",
    title: {
      bn: "বিল্ডিং প্ল্যানিং ও ডিজাইন",
      en: "Building planning and design",
    },
  },
  {
    id: "02",
    title: {
      bn: "আর্কিটেকচারাল ডিজাইন কনসাল্টিং",
      en: "Architectural design consulting",
    },
  },
  {
    id: "03",
    title: {
      bn: "কনস্ট্রাকশন সুপারভিশন",
      en: "Construction supervision",
    },
  },
  {
    id: "04",
    title: {
      bn: "রেসিডেনশিয়াল ও কমার্শিয়াল ইন্টেরিয়র ডিজাইন",
      en: "Interior design for residential and commercial spaces",
    },
  },
  {
    id: "05",
    title: {
      bn: "রিনোভেশন ও রিমডেলিং",
      en: "Renovation and Remodelling",
    },
  },
  {
    id: "06",
    title: {
      bn: "পুরনো স্পেস রিনোভেট করে কার্যকারিতা ও সৌন্দর্য বৃদ্ধি",
      en: "Renovating old spaces for improved functionality and aesthetics",
    },
  },
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function ArchitectureServices() {
  const { t } = useLang();

  return (
    <section className="bg-white py-16 text-ink-950 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Experience Stats */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mb-16 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8"
        >
          {experiences.map((exp) => (
            <motion.div
              key={exp.title.en}
              variants={item}
              className="text-center md:text-left"
            >
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-950/50">
                {t(exp.title)}
              </p>
              <h3 className="mb-3 text-4xl font-light tracking-tight text-ink-950 md:text-5xl">
                {exp.years}
              </h3>
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-ink-950/60 md:mx-0">
                {t(exp.desc)}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          {/* Left Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative overflow-hidden rounded-2xl lg:col-span-5 shadow-lg shadow-black/5"
          >
            <div className="relative aspect-[4/5] w-full">
              <Image
                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop"
                alt="Building planning and design"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 42vw"
                priority
              />
              {/* Overlay card */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-20">
                <h4 className="mb-1 text-lg font-medium text-white">
                  {t({
                    bn: "বিল্ডিং প্ল্যানিং ও ডিজাইন",
                    en: "Building planning and design",
                  })}
                </h4>
                <p className="text-sm text-white/80">
                  PTE Design & Build Co. Associates Independent Design & Build
                  60+ Years
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Services List */}
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="flex flex-col justify-center lg:col-span-7"
          >
            {services.map((service) => (
              <motion.a
                key={service.id}
                variants={item}
                href="#"
                className="group flex items-center justify-between border-b border-black/10 py-5 transition-colors hover:border-black/30"
              >
                <div className="flex items-start gap-5">
                  <span className="mt-0.5 text-sm font-medium text-ink-950/40 transition-colors group-hover:text-ink-950">
                    {service.id}
                  </span>
                  <span className="text-base font-medium text-ink-950/80 transition-colors group-hover:text-ink-950 md:text-lg">
                    {t(service.title)}
                  </span>
                </div>

                <div className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 transition-all duration-300 group-hover:border-ink-950 group-hover:bg-ink-950">
                  <ArrowUpRight
                    size={16}
                    className="text-ink-950/50 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
                  />
                </div>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
