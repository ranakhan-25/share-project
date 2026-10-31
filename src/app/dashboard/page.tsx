"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, CalendarDays, Download, Plus, Trophy, Users, Wallet, AlertTriangle, PieChart } from "lucide-react";
import { useMemo, useState } from "react";
import { useLang, type Bi } from "@/lib/i18n";
import { CountUp } from "@/components/ui/CountUp";
import { AreaChart } from "@/components/dashboard/charts/AreaChart";
import { BarChart } from "@/components/dashboard/charts/BarChart";
import { DonutChart } from "@/components/dashboard/charts/DonutChart";
import { Gauge } from "@/components/dashboard/charts/Gauge";
import { Sparkline } from "@/components/dashboard/charts/Sparkline";
import { PALETTE } from "@/components/dashboard/charts/utils";

/* ───────── demo data (replace with API data) ───────── */
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_BN = ["জানু", "ফেব", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];
const VALUE = [14.2, 15.1, 15.8, 17.4, 18.2, 19.6, 20.1, 21.5, 22.4, 23.1, 24.0, 24.6].map((v) => v * 1e6);
const COLLECTED = [6.1, 6.8, 7.2, 8.4, 8.9, 9.8, 10.2, 11.1, 11.9, 12.6, 13.4, 14.1].map((v) => v * 1e6);
const MONTH_COLLECT = [2.1, 2.4, 2.2, 3.1, 2.8, 3.4, 3.0, 3.6, 3.3, 3.9, 3.7, 4.2].map((v) => v * 1e6);
const MONTH_TARGET = [2.4, 2.4, 2.6, 2.8, 3.0, 3.2, 3.2, 3.4, 3.6, 3.6, 3.8, 4.0].map((v) => v * 1e6);

const ALLOC: { name: Bi; value: number }[] = [
  { name: { bn: "স্কাইলাইন হাইটস", en: "Skyline Heights" }, value: 9.8e6 },
  { name: { bn: "গ্রিন ভ্যালি", en: "Green Valley" }, value: 6.4e6 },
  { name: { bn: "হার্বার পয়েন্ট", en: "Harbor Point" }, value: 4.9e6 },
  { name: { bn: "লেকভিউ প্লাজা", en: "Lakeview Plaza" }, value: 2.6e6 },
  { name: { bn: "অন্যান্য", en: "Others" }, value: 0.9e6 },
];

const TOP_PROJECTS: { name: Bi; sold: number }[] = [
  { name: { bn: "স্কাইলাইন হাইটস", en: "Skyline Heights" }, sold: 82 },
  { name: { bn: "গ্রিন ভ্যালি", en: "Green Valley" }, sold: 64 },
  { name: { bn: "লেকভিউ প্লাজা", en: "Lakeview Plaza" }, sold: 58 },
  { name: { bn: "হার্বার পয়েন্ট", en: "Harbor Point" }, sold: 47 },
];

const TX: { who: Bi; project: Bi; amount: number; status: "paid" | "pending" | "overdue"; date: Bi }[] = [
  { who: { bn: "রাকিবুল ইসলাম", en: "Rakibul Islam" }, project: { bn: "স্কাইলাইন হাইটস", en: "Skyline Heights" }, amount: 125000, status: "paid", date: { bn: "আজ", en: "Today" } },
  { who: { bn: "সাবরিনা আহমেদ", en: "Sabrina Ahmed" }, project: { bn: "গ্রিন ভ্যালি", en: "Green Valley" }, amount: 75000, status: "paid", date: { bn: "আজ", en: "Today" } },
  { who: { bn: "তানভীর হোসেন", en: "Tanvir Hossain" }, project: { bn: "হার্বার পয়েন্ট", en: "Harbor Point" }, amount: 50000, status: "pending", date: { bn: "গতকাল", en: "Yesterday" } },
  { who: { bn: "নুসরাত জাহান", en: "Nusrat Jahan" }, project: { bn: "লেকভিউ প্লাজা", en: "Lakeview Plaza" }, amount: 200000, status: "paid", date: { bn: "২ দিন আগে", en: "2 days ago" } },
  { who: { bn: "মাহমুদ হাসান", en: "Mahmud Hasan" }, project: { bn: "স্কাইলাইন হাইটস", en: "Skyline Heights" }, amount: 25000, status: "overdue", date: { bn: "৫ দিন আগে", en: "5 days ago" } },
];

const LEADERS: { name: Bi; pts: number }[] = [
  { name: { bn: "সাবরিনা আহমেদ", en: "Sabrina Ahmed" }, pts: 2480 },
  { name: { bn: "রাকিবুল ইসলাম", en: "Rakibul Islam" }, pts: 2210 },
  { name: { bn: "নুসরাত জাহান", en: "Nusrat Jahan" }, pts: 1960 },
  { name: { bn: "তানভীর হোসেন", en: "Tanvir Hossain" }, pts: 1740 },
];

const card = "rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

function CardHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: i.color }} />{i.label}</span>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { t, num, taka, lang } = useLang();
  const [range, setRange] = useState<6 | 12>(12);

  const months = lang === "bn" ? MONTHS_BN : MONTHS_EN;
  const sl = <T,>(a: T[]) => a.slice(12 - range);
  const labels = sl(months);

  const kpis = useMemo(
    () => [
      { icon: Wallet, label: { bn: "মোট শেয়ার মূল্য", en: "Total share value" } as Bi, node: <CountUp to={24.6e6} compact prefix="৳" decimals={1} />, delta: 8.4, spark: VALUE, color: PALETTE[0], good: true },
      { icon: Users, label: { bn: "সক্রিয় শেয়ারহোল্ডার", en: "Active shareholders" } as Bi, node: <CountUp to={12480} />, delta: 3.2, spark: [9.8, 10.2, 10.9, 11.3, 11.6, 12.0, 12.48].map((v) => v * 1e3), color: PALETTE[1], good: true },
      { icon: PieChart, label: { bn: "এই মাসের কালেকশন", en: "Collected this month" } as Bi, node: <CountUp to={4.2e6} compact prefix="৳" decimals={1} />, delta: 13.5, spark: MONTH_COLLECT, color: PALETTE[2], good: true },
      { icon: AlertTriangle, label: { bn: "বকেয়া ও পেনাল্টি", en: "Dues & penalties" } as Bi, node: <CountUp to={1.38e6} compact prefix="৳" decimals={2} />, delta: -4.1, spark: [2.1, 1.9, 2.0, 1.8, 1.6, 1.5, 1.38].map((v) => v * 1e6), color: PALETTE[3], good: true },
    ],
    [],
  );

  const statusStyle = {
    paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    overdue: "bg-rose-50 text-rose-700 ring-rose-200",
  } as const;
  const statusLabel = { paid: { bn: "পরিশোধিত", en: "Paid" }, pending: { bn: "অপেক্ষমাণ", en: "Pending" }, overdue: { bn: "বকেয়া", en: "Overdue" } };

  const today = new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      {/* header */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl bg-ink-950 p-7 text-white sm:p-9">
        <div className="bg-grid absolute inset-0 opacity-50" />
        <div className="absolute -right-10 -top-16 h-64 w-64 rounded-full bg-emerald-500/30 blur-[90px]" />
        <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-sky-500/25 blur-[90px]" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="flex items-center gap-2 text-sm text-white/55"><CalendarDays className="h-4 w-4" />{today}</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">
              {t({ bn: "স্বাগতম, আপনার শেয়ার পোর্টফোলিও", en: "Welcome — your share portfolio" })}{" "}
              <span className="text-gradient">{t({ bn: "বাড়ছে", en: "is growing" })}</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/60">{t({ bn: "গত মাসের তুলনায় মোট শেয়ার মূল্য ৮.৪% বেড়েছে। নিচে বিস্তারিত দেখুন।", en: "Total share value is up 8.4% versus last month. Details below." })}</p>
          </div>
          <div className="flex gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold ring-1 ring-white/15 transition hover:bg-white/20"><Download className="h-4 w-4" />{t({ bn: "এক্সপোর্ট", en: "Export" })}</button>
            <Link href="/dashboard/project/share-project/assign-share" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-sky-400 px-4 py-2.5 text-sm font-semibold text-ink-950 shadow-lg shadow-emerald-500/25 transition hover:scale-[1.03]"><Plus className="h-4 w-4" />{t({ bn: "শেয়ার অ্যাসাইন", en: "Assign share" })}</Link>
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }} className={`${card} group transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5`}>
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: `${k.color}14`, color: k.color }}><k.icon className="h-5 w-5" /></span>
              <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-bold ${k.delta >= 0 === k.good ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                {k.delta >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {num(Math.abs(k.delta), { maximumFractionDigits: 1 })}%
              </span>
            </div>
            <p className="mt-5 text-sm text-slate-500">{t(k.label)}</p>
            <div className="mt-1 flex items-end justify-between">
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">{k.node}</p>
              <Sparkline values={k.spark} color={k.color} width={96} height={40} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* growth + allocation */}
      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <section className={card}>
          <CardHead
            title={t({ bn: "শেয়ার মূল্য ও কালেকশন প্রবৃদ্ধি", en: "Share value & collection growth" })}
            sub={t({ bn: "সময়ের সাথে পোর্টফোলিওর পরিবর্তন", en: "Portfolio change over time" })}
            right={
              <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                {([6, 12] as const).map((r) => (
                  <button key={r} onClick={() => setRange(r)} className={`rounded-lg px-3 py-1.5 transition ${range === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>
                    {num(r)} {t({ bn: "মাস", en: "mo" })}
                  </button>
                ))}
              </div>
            }
          />
          <div className="mb-3"><Legend items={[{ color: PALETTE[0], label: t({ bn: "মোট শেয়ার মূল্য", en: "Total share value" }) }, { color: PALETTE[1], label: t({ bn: "মোট কালেকশন", en: "Total collected" }) }]} /></div>
          <AreaChart
            labels={labels}
            series={[
              { name: t({ bn: "শেয়ার মূল্য", en: "Share value" }), values: sl(VALUE) },
              { name: t({ bn: "কালেকশন", en: "Collected" }), values: sl(COLLECTED) },
            ]}
          />
        </section>

        <section className={card}>
          <CardHead title={t({ bn: "প্রজেক্ট অনুযায়ী বণ্টন", en: "Allocation by project" })} sub={t({ bn: "মোট শেয়ার মূল্যের ভাগ", en: "Share of total value" })} />
          <DonutChart data={ALLOC.map((a) => ({ name: t(a.name), value: a.value }))} centerLabel={t({ bn: "মোট", en: "Total" })} />
        </section>
      </div>

      {/* bar + gauge + top projects */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr_1fr]">
        <section className={card}>
          <CardHead title={t({ bn: "মাসিক কালেকশন বনাম টার্গেট", en: "Monthly collection vs target" })} />
          <div className="mb-3"><Legend items={[{ color: PALETTE[0], label: t({ bn: "প্রকৃত", en: "Actual" }) }, { color: PALETTE[1], label: t({ bn: "টার্গেট", en: "Target" }) }]} /></div>
          <BarChart labels={labels} actual={sl(MONTH_COLLECT)} target={sl(MONTH_TARGET)} names={[t({ bn: "প্রকৃত", en: "Actual" }), t({ bn: "টার্গেট", en: "Target" })]} />
        </section>

        <section className={`${card} flex flex-col`}>
          <CardHead title={t({ bn: "শেয়ার বিক্রয় অগ্রগতি", en: "Share sales progress" })} sub={t({ bn: "সব চলমান প্রজেক্ট", en: "All live projects" })} />
          <div className="flex flex-1 flex-col justify-center gap-6">
            <Gauge value={0.78} label={t({ bn: "বিক্রিত শেয়ার", en: "shares sold" })} />
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{t({ bn: "বিক্রিত", en: "Sold" })}</p><p className="font-bold text-slate-900">{num(7800)}</p></div>
              <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{t({ bn: "অবশিষ্ট", en: "Remaining" })}</p><p className="font-bold text-slate-900">{num(2200)}</p></div>
            </div>
          </div>
        </section>

        <section className={card}>
          <CardHead title={t({ bn: "শীর্ষ প্রজেক্ট", en: "Top projects" })} sub={t({ bn: "শেয়ার বিক্রির হার", en: "Share sell-through" })} />
          <ul className="space-y-5">
            {TOP_PROJECTS.map((p, i) => (
              <li key={i}>
                <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium text-slate-700">{t(p.name)}</span><span className="font-bold text-slate-900">{num(p.sold)}%</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${p.sold}%` }} viewport={{ once: true }} transition={{ duration: 1.2, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full" style={{ background: PALETTE[i] }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* table + leaderboard */}
      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <section className={`${card} overflow-hidden`}>
          <CardHead title={t({ bn: "সাম্প্রতিক লেনদেন", en: "Recent transactions" })} right={<Link href="/dashboard/project/share-project/share-collection-report" className="text-xs font-semibold text-emerald-600 hover:underline">{t({ bn: "সব দেখুন", en: "View all" })}</Link>} />
          <div className="scroll-thin -mx-2 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-400">
                <tr><th className="px-2 pb-3 font-semibold">{t({ bn: "শেয়ারহোল্ডার", en: "Shareholder" })}</th><th className="px-2 pb-3 font-semibold">{t({ bn: "প্রজেক্ট", en: "Project" })}</th><th className="px-2 pb-3 font-semibold">{t({ bn: "পরিমাণ", en: "Amount" })}</th><th className="px-2 pb-3 font-semibold">{t({ bn: "অবস্থা", en: "Status" })}</th><th className="px-2 pb-3 text-right font-semibold">{t({ bn: "তারিখ", en: "Date" })}</th></tr>
              </thead>
              <tbody>
                {TX.map((r, i) => (
                  <tr key={i} className="border-t border-slate-100 transition hover:bg-slate-50">
                    <td className="px-2 py-3.5"><span className="flex items-center gap-3 font-semibold text-slate-900"><span className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: PALETTE[i % 5] }}>{t(r.who).slice(0, 1)}</span>{t(r.who)}</span></td>
                    <td className="px-2 py-3.5 text-slate-600">{t(r.project)}</td>
                    <td className="px-2 py-3.5 font-semibold text-slate-900">{taka(r.amount)}</td>
                    <td className="px-2 py-3.5"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusStyle[r.status]}`}>{t(statusLabel[r.status])}</span></td>
                    <td className="px-2 py-3.5 text-right text-slate-500">{t(r.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={card}>
          <CardHead title={t({ bn: "পয়েন্ট লিডারবোর্ড", en: "Points leaderboard" })} sub={t({ bn: "সময়মতো পরিশোধে শীর্ষ", en: "Top on-time payers" })} right={<Trophy className="h-5 w-5 text-amber-500" />} />
          <ol className="space-y-3">
            {LEADERS.map((l, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex items-center gap-4 rounded-2xl bg-slate-50 p-3.5">
                <span className={`grid h-9 w-9 place-items-center rounded-xl text-sm font-extrabold ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-white text-slate-500 ring-1 ring-slate-200"}`}>{num(i + 1)}</span>
                <span className="flex-1 font-semibold text-slate-800">{t(l.name)}</span>
                <span className="font-bold text-slate-900">{num(l.pts)} <span className="text-xs font-medium text-slate-400">pts</span></span>
              </motion.li>
            ))}
          </ol>
        </section>
      </div>

      <p className="pb-2 text-center text-xs text-slate-400">{t({ bn: "* এই পেজের সব ডেটা নমুনা; API সংযোগ করলে বাস্তব ডেটা দেখাবে।", en: "* All data on this page is sample data; connect your API to show real figures." })}</p>
    </div>
  );
}
