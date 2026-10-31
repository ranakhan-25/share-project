"use client";

import Link from "next/link";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  Handshake,
  Lightbulb,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Rocket,
  Send,
  Target,
} from "lucide-react";
import { useRef, useState } from "react";
import { useLang, type Bi } from "@/lib/i18n";
import { Reveal } from "@/components/ui/Reveal";
import { CountUp } from "@/components/ui/CountUp";
import { SectionHeading } from "@/components/ui/SectionHeading";

/* ═════════════ ABOUT 1: story + mission/vision ═════════════ */
export function AboutStory() {
  const { t } = useLang();
  const stats = [
    { to: 2019, label: { bn: "প্রতিষ্ঠা", en: "Founded" }, plain: true },
    { to: 12000, suffix: "+", label: { bn: "শেয়ারহোল্ডার", en: "Shareholders" } },
    { to: 48, suffix: "+", label: { bn: "প্রজেক্ট", en: "Projects" } },
    { to: 64, label: { bn: "দলের সদস্য", en: "Team members" } },
  ];
  const cards: { icon: typeof Target; title: Bi; text: Bi; g: string }[] = [
    { icon: Target, title: { bn: "আমাদের মিশন", en: "Our mission" }, text: { bn: "প্রতিটি মানুষের জন্য প্রজেক্ট-মালিকানা সহজলভ্য ও স্বচ্ছ করা।", en: "Make project ownership accessible and transparent for everyone." }, g: "from-emerald-400 to-teal-500" },
    { icon: Eye, title: { bn: "আমাদের ভিশন", en: "Our vision" }, text: { bn: "দক্ষিণ এশিয়ার সবচেয়ে বিশ্বস্ত শেয়ার-ভিত্তিক প্রজেক্ট প্ল্যাটফর্ম হওয়া।", en: "Become South Asia’s most trusted share-based project platform." }, g: "from-sky-400 to-indigo-500" },
    { icon: Handshake, title: { bn: "আমাদের মূল্যবোধ", en: "Our values" }, text: { bn: "সততা, স্বচ্ছতা ও দায়বদ্ধতা — প্রতিটি সিদ্ধান্তের কেন্দ্রে।", en: "Integrity, transparency and accountability at the core of every decision." }, g: "from-amber-300 to-orange-500" },
  ];
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <span className="rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 ring-1 ring-emerald-200">
              {t({ bn: "আমাদের গল্প", en: "Our story" })}
            </span>
            <h2 className="mt-5 text-3xl font-bold leading-tight text-slate-900 sm:text-5xl">
              {t({ bn: "একটি সহজ ধারণা থেকে", en: "From a simple idea to" })}{" "}
              <span className="text-gradient-dark">{t({ bn: "হাজারো মালিকের প্ল্যাটফর্ম", en: "a platform of thousands of owners" })}</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              {t({
                bn: "আমরা দেখেছি, ভালো প্রজেক্টে বিনিয়োগের সুযোগ অনেকের নাগালের বাইরে ছিল — জটিল প্রক্রিয়া আর অস্পষ্ট হিসাবের কারণে। Share Project তৈরি হয়েছে সেই দূরত্ব ঘোচাতে।",
                en: "We saw that investing in good projects was out of reach for many — because of complex processes and unclear accounting. Share Project was built to close that gap.",
              })}
            </p>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              {t({
                bn: "আজ আমাদের প্ল্যাটফর্মে প্রতিটি শেয়ার, প্রতিটি কিস্তি ও প্রতিটি রিপোর্ট ডিজিটালভাবে ট্র্যাক হয় — যাতে মালিকানা হয় সহজ, আস্থা হয় অটুট।",
                en: "Today every share, instalment and report on our platform is tracked digitally — so ownership is simple and trust is unbreakable.",
              })}
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s, i) => (
                <div
                  key={i}
                  className={`rounded-3xl p-7 ${i === 0 ? "bg-ink-950 text-white" : i === 3 ? "bg-gradient-to-br from-emerald-400 to-sky-500 text-ink-950" : "bg-slate-50 text-slate-900 ring-1 ring-slate-200"} ${i % 2 ? "translate-y-6" : ""}`}
                >
                  <p className="text-4xl font-extrabold tracking-tight">
                    {s.plain ? <PlainYear year={s.to} /> : <CountUp to={s.to} suffix={s.suffix} />}
                  </p>
                  <p className="mt-1 text-sm opacity-70">{t(s.label)}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="mt-28 grid gap-6 md:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="group h-full rounded-3xl border border-slate-200 p-8 transition duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-900/10">
                <span className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${c.g} text-white transition-transform duration-500 group-hover:rotate-6`}>
                  <c.icon className="h-7 w-7" />
                </span>
                <h3 className="mt-6 text-xl font-bold text-slate-900">{t(c.title)}</h3>
                <p className="mt-3 leading-relaxed text-slate-600">{t(c.text)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlainYear({ year }: { year: number }) {
  const { num } = useLang();
  return <>{num(year, { useGrouping: false })}</>;
}

/* ═════════════ ABOUT 2: timeline ═════════════ */
export function AboutTimeline() {
  const { t, num } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  const events: { year: number; icon: typeof Lightbulb; title: Bi; text: Bi }[] = [
    { year: 2019, icon: Lightbulb, title: { bn: "ধারণার জন্ম", en: "The idea" }, text: { bn: "ছোট বিনিয়োগকারীদের জন্য স্বচ্ছ শেয়ার-মডেলের পরিকল্পনা শুরু।", en: "Planning begins for a transparent share model for small investors." } },
    { year: 2021, icon: Rocket, title: { bn: "প্রথম প্রজেক্ট লঞ্চ", en: "First project launch" }, text: { bn: "প্রথম আবাসিক প্রজেক্টে ১,০০০ শেয়ার সফলভাবে বরাদ্দ।", en: "1,000 shares successfully allocated in the first residential project." } },
    { year: 2023, icon: Target, title: { bn: "ডিজিটাল প্ল্যাটফর্ম", en: "Digital platform" }, text: { bn: "ড্যাশবোর্ড, রিপোর্ট ও পয়েন্ট সিস্টেমসহ পূর্ণাঙ্গ প্ল্যাটফর্ম চালু।", en: "Full platform launched with dashboard, reports and points system." } },
    { year: 2026, icon: Handshake, title: { bn: "১২ হাজার+ শেয়ারহোল্ডার", en: "12,000+ shareholders" }, text: { bn: "দেশজুড়ে ৪৮টির বেশি প্রজেক্টে আমাদের সঙ্গী ১২ হাজারেরও বেশি মানুষ।", en: "Over 12,000 people are partnering with us across 48+ projects nationwide." } },
  ];
  return (
    <section className="relative overflow-hidden bg-ink-950 py-24 text-white sm:py-32">
      <div className="bg-grid absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-4xl px-5 sm:px-8">
        <SectionHeading dark eyebrow={{ bn: "যাত্রাপথ", en: "Our journey" }} title={{ bn: "বছর বছর এগিয়ে চলা", en: "Growing, year after year" }} />
        <div ref={ref} className="relative mt-20">
          <div className="absolute bottom-0 left-5 top-0 w-px bg-white/10 sm:left-1/2" />
          <motion.div style={{ scaleY, transformOrigin: "top" }} className="absolute bottom-0 left-5 top-0 w-px bg-gradient-to-b from-emerald-300 to-sky-400 sm:left-1/2" />
          <div className="space-y-14">
            {events.map((e, i) => (
              <Reveal key={i} x={i % 2 ? 40 : -40} y={0}>
                <div className={`relative flex items-start gap-6 pl-14 sm:pl-0 ${i % 2 ? "sm:flex-row-reverse" : ""}`}>
                  <span className="absolute left-0 top-0 grid h-10 w-10 place-items-center rounded-full bg-ink-950 ring-2 ring-emerald-300 sm:left-1/2 sm:-translate-x-1/2">
                    <e.icon className="h-4 w-4 text-emerald-300" />
                  </span>
                  <div className="glass w-full rounded-3xl p-6 sm:w-[calc(50%-40px)]">
                    <p className="text-sm font-bold text-emerald-300">{num(e.year, { useGrouping: false })}</p>
                    <h3 className="mt-1 text-xl font-bold">{t(e.title)}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-white/60">{t(e.text)}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═════════════ ABOUT 3: team ═════════════ */
export function AboutTeam() {
  const { t } = useLang();
  const team = [
    { name: { bn: "আরিফ রহমান", en: "Arif Rahman" }, role: { bn: "প্রতিষ্ঠাতা ও সিইও", en: "Founder & CEO" }, g: "from-emerald-400 to-teal-600", init: "AR" },
    { name: { bn: "নাজনীন সুলতানা", en: "Nazneen Sultana" }, role: { bn: "প্রধান অপারেশন কর্মকর্তা", en: "Chief Operating Officer" }, g: "from-sky-400 to-indigo-600", init: "NS" },
    { name: { bn: "ফয়সাল করিম", en: "Faisal Karim" }, role: { bn: "প্রধান প্রযুক্তি কর্মকর্তা", en: "Chief Technology Officer" }, g: "from-violet-400 to-fuchsia-600", init: "FK" },
    { name: { bn: "মেহের নিগার", en: "Meher Nigar" }, role: { bn: "হেড অব ফাইন্যান্স", en: "Head of Finance" }, g: "from-amber-300 to-orange-600", init: "MN" },
  ];
  return (
    <section className="bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading eyebrow={{ bn: "আমাদের দল", en: "Our team" }} title={{ bn: "যাঁরা আপনার আস্থার পেছনে", en: "The people behind your trust" }} />
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((m, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="group overflow-hidden rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200 transition duration-500 hover:-translate-y-2 hover:shadow-2xl">
                <div className={`relative grid h-56 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br ${m.g}`}>
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 transition-transform duration-700 group-hover:scale-150" />
                  <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-black/10" />
                  <span className="relative text-5xl font-black tracking-tight text-white/95">{m.init}</span>
                </div>
                <div className="p-5 text-center">
                  <h3 className="text-lg font-bold text-slate-900">{t(m.name)}</h3>
                  <p className="mt-1 text-sm text-slate-500">{t(m.role)}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═════════════ CONTACT 1: info + form ═════════════ */
export function ContactBlock() {
  const { t } = useLang();
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const info = [
    { icon: MapPin, title: { bn: "ঠিকানা", en: "Address" }, text: { bn: "গুলশান-২, ঢাকা ১২১২, বাংলাদেশ", en: "Gulshan-2, Dhaka 1212, Bangladesh" } },
    { icon: Phone, title: { bn: "ফোন", en: "Phone" }, text: { bn: "+৮৮০ ১৭০০-০০০০০০", en: "+880 1700-000000" } },
    { icon: Mail, title: { bn: "ইমেইল", en: "Email" }, text: { bn: "hello@shareproject.com", en: "hello@shareproject.com" } },
    { icon: Clock, title: { bn: "অফিস সময়", en: "Office hours" }, text: { bn: "শনি–বৃহস্পতি, সকাল ৯টা – বিকাল ৬টা", en: "Sat–Thu, 9:00 AM – 6:00 PM" } },
  ];

  const inputCls =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

  return (
    <section className="relative -mt-12 pb-24 sm:pb-28">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          {info.map((it, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div className="group flex items-center gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-500 text-white transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                  <it.icon className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t(it.title)}</p>
                  <p className="mt-0.5 font-semibold text-slate-900">{t(it.text)}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-900/5 sm:p-10">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-100 blur-3xl" />
            <AnimatePresence mode="wait">
              {state === "sent" ? (
                <motion.div key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative flex min-h-[420px] flex-col items-center justify-center text-center">
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }} className="grid h-20 w-20 place-items-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/30">
                    <CheckCircle2 className="h-10 w-10" />
                  </motion.span>
                  <h3 className="mt-6 text-2xl font-bold text-slate-900">{t({ bn: "বার্তা পাঠানো হয়েছে!", en: "Message sent!" })}</h3>
                  <p className="mt-2 max-w-sm text-slate-600">{t({ bn: "ধন্যবাদ। আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।", en: "Thank you. Our team will get back to you shortly." })}</p>
                  <button onClick={() => setState("idle")} className="mt-6 text-sm font-semibold text-emerald-600 hover:underline">
                    {t({ bn: "আরেকটি বার্তা পাঠান", en: "Send another message" })}
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    setState("sending");
                    // Demo only: wire this to your backend / email service.
                    setTimeout(() => setState("sent"), 1200);
                  }}
                  className="relative space-y-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><MessageSquare className="h-5 w-5" /></span>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{t({ bn: "আমাদের লিখুন", en: "Send us a message" })}</h2>
                      <p className="text-sm text-slate-500">{t({ bn: "২৪ ঘণ্টার মধ্যে উত্তর দেওয়া হবে।", en: "We reply within 24 hours." })}</p>
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <input required className={inputCls} placeholder={t({ bn: "আপনার নাম", en: "Your name" })} />
                    <input required type="email" className={inputCls} placeholder={t({ bn: "ইমেইল", en: "Email" })} />
                  </div>
                  <input className={inputCls} placeholder={t({ bn: "ফোন নম্বর (ঐচ্ছিক)", en: "Phone (optional)" })} />
                  <select className={inputCls} defaultValue="">
                    <option value="" disabled>{t({ bn: "বিষয় নির্বাচন করুন", en: "Choose a topic" })}</option>
                    <option>{t({ bn: "শেয়ার কেনা", en: "Buying shares" })}</option>
                    <option>{t({ bn: "কিস্তি / কালেকশন", en: "Instalments / collection" })}</option>
                    <option>{t({ bn: "টেকনিক্যাল সহায়তা", en: "Technical support" })}</option>
                    <option>{t({ bn: "অন্যান্য", en: "Other" })}</option>
                  </select>
                  <textarea required rows={5} className={`${inputCls} resize-none`} placeholder={t({ bn: "আপনার বার্তা লিখুন…", en: "Write your message…" })} />
                  <button
                    type="submit"
                    disabled={state === "sending"}
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-[15px] font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-70 sm:w-auto sm:px-10"
                  >
                    {state === "sending" ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />{t({ bn: "পাঠানো হচ্ছে…", en: "Sending…" })}</>
                    ) : (
                      <>{t({ bn: "বার্তা পাঠান", en: "Send message" })}<Send className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-1" /></>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ═════════════ CONTACT 2: FAQ ═════════════ */
export function ContactFaq() {
  const { t } = useLang();
  const [open, setOpen] = useState<number | null>(0);
  const faqs: { q: Bi; a: Bi }[] = [
    { q: { bn: "ন্যূনতম কতটি শেয়ার কেনা যায়?", en: "What is the minimum number of shares?" }, a: { bn: "প্রতিটি প্রজেক্টের নির্ধারিত শর্ত অনুযায়ী আপনি এক বা একাধিক শেয়ার নিতে পারবেন।", en: "Depending on each project’s terms, you can start with one or more shares." } },
    { q: { bn: "কিস্তিতে শেয়ার কেনা কি সম্ভব?", en: "Can I buy shares in instalments?" }, a: { bn: "হ্যাঁ। প্রজেক্ট কনফিগারেশন অনুযায়ী কিস্তির সুবিধা পাওয়া যায় এবং ড্যাশবোর্ডে প্রতিটি কিস্তি ট্র্যাক করা যায়।", en: "Yes. Instalment plans follow the project configuration and every instalment is tracked on the dashboard." } },
    { q: { bn: "দেরিতে পরিশোধ করলে কী হয়?", en: "What happens if I pay late?" }, a: { bn: "নির্ধারিত নিয়ম অনুযায়ী পেনাল্টি যুক্ত হয়, যা পেনাল্টি রিপোর্টে স্বচ্ছভাবে দেখা যায়।", en: "A penalty is applied per the defined rules and is shown transparently in the penalty report." } },
    { q: { bn: "আমার তথ্য কি নিরাপদ?", en: "Is my data safe?" }, a: { bn: "সব সেশন টোকেন-ভিত্তিক এবং অ্যাক্সেস ভূমিকা অনুযায়ী নিয়ন্ত্রিত।", en: "All sessions are token-based and access is controlled by role." } },
  ];
  return (
    <section className="bg-slate-50 py-24 sm:py-28">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <SectionHeading eyebrow={{ bn: "প্রশ্নোত্তর", en: "FAQ" }} title={{ bn: "সচরাচর জিজ্ঞাসা", en: "Frequently asked questions" }} />
        <div className="mt-12 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={i} delay={i * 0.06}>
                <div className={`overflow-hidden rounded-2xl border bg-white transition ${isOpen ? "border-emerald-300 shadow-lg shadow-emerald-500/5" : "border-slate-200"}`}>
                  <button onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
                    <span className="font-semibold text-slate-900">{t(f.q)}</span>
                    <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${isOpen ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                      <ChevronDown className="h-4 w-4" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                        <p className="px-6 pb-6 leading-relaxed text-slate-600">{t(f.a)}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
        <Reveal className="mt-12 text-center">
          <Link href="/login" className="group inline-flex items-center gap-2 font-semibold text-emerald-700 hover:text-emerald-800">
            {t({ bn: "ইতিমধ্যে সদস্য? লগইন করুন", en: "Already a member? Log in" })}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
