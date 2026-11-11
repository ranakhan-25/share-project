"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, CalendarDays, Download, Plus, Trophy, Users, Wallet, AlertTriangle, PieChart, FolderKanban } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLang, type Bi } from "@/lib/i18n";
import { CountUp } from "@/components/ui/CountUp";
import { AreaChart } from "@/components/dashboard/charts/AreaChart";
import { BarChart } from "@/components/dashboard/charts/BarChart";
import { DonutChart } from "@/components/dashboard/charts/DonutChart";
import { Gauge } from "@/components/dashboard/charts/Gauge";
import { Sparkline } from "@/components/dashboard/charts/Sparkline";
import { PALETTE } from "@/components/dashboard/charts/utils";
import { getShareProjectUserDashboard, type ShareUserDashboardData } from "@/lib/share-project-api";
import api from "@/lib/api";

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_BN = ["জানু", "ফেব", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];

const card = "rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

function buildEmptyMonthlySeries() {
  const now = new Date();
  return Array.from({ length: 12 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - idx), 1);
    return {
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      shareValue: 0,
      collected: 0,
      monthlyCollected: 0,
      monthlyTarget: 0,
      projectCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
    };
  });
}

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

type ShareAssignmentRow = {
  uuid: string;
  customerName?: string;
  projectName?: string;
  project?: { name?: string };
  noOfShares?: number | string;
  shareAmount?: number | string;
  paidAmount?: number | string;
  totalCost?: number | string;
  due?: number | string;
  points?: number | string;
  assignedAt?: string;
  createdAt?: string;
  status?: string;
};

export default function DashboardPage() {
  const { t, num, taka, lang } = useLang();
  const [range, setRange] = useState<6 | 12>(12);
  const [dashboard, setDashboard] = useState<ShareUserDashboardData>({});
  const [assignments, setAssignments] = useState<ShareAssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      getShareProjectUserDashboard().catch(() => ({} as ShareUserDashboardData)),
      api
        .get("/realbizpro/api/v1/project-share-assignments?page=1&limit=100")
        .then((res) => {
          const payload = res.data?.data ?? res.data;
          return Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
        })
        .catch(() => []),
    ])
      .then(([dashData, assignmentRows]) => {
        if (!active) return;
        setDashboard(dashData || {});
        setAssignments(Array.isArray(assignmentRows) ? assignmentRows : []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const months = lang === "bn" ? MONTHS_BN : MONTHS_EN;
  const fullSeries = useMemo(() => {
    const base =
      dashboard.monthlySeries && dashboard.monthlySeries.length === 12
        ? dashboard.monthlySeries.map((m) => ({ ...m }))
        : buildEmptyMonthlySeries();

    if (!assignments.length) return base;

    for (const a of assignments) {
      const dt = new Date(a.assignedAt || a.createdAt || Date.now());
      if (Number.isNaN(dt.getTime())) continue;
      const paid = Number(a.paidAmount || 0);
      const endMatchIdx = base.findIndex((m) => m.year === dt.getFullYear() && m.monthIndex === dt.getMonth());
      if (endMatchIdx >= 0) {
        base[endMatchIdx].monthlyCollected += Math.round(paid);
      }
      for (const m of base) {
        const endOfMonth = new Date(m.year, m.monthIndex + 1, 0, 23, 59, 59, 999);
        if (dt <= endOfMonth) {
          m.collected += Math.round(paid);
        }
      }
    }
    return base;
  }, [dashboard.monthlySeries, assignments]);

  const sl = <T,>(a: T[]) => a.slice(12 - range);
  const slicedSeries = sl(fullSeries);
  const labels = slicedSeries.map((m) => months[m.monthIndex] ?? MONTHS_EN[m.monthIndex] ?? "");

  const shareValueSeries = slicedSeries.map((m) => m.shareValue);
  const collectedSeries = slicedSeries.map((m) => m.collected);
  const monthCollectSeries = slicedSeries.map((m) => m.monthlyCollected);
  const monthTargetSeries = slicedSeries.map((m) => m.monthlyTarget);

  const allocationData = useMemo(
    () =>
      (dashboard.allocation || [])
        .filter((a) => Number(a.value) > 0)
        .map((a) => ({
          name: a.name === "Others" ? t({ bn: "অন্যান্য", en: "Others" }) : a.name,
          value: Number(a.value || 0),
        })),
    [dashboard.allocation, t],
  );

  const assignmentSoldShares = useMemo(
    () => assignments.reduce((s, a) => s + Number(a.noOfShares || 0), 0),
    [assignments],
  );

  const totalShares = Number(dashboard.totalShares || 0);
  const soldShares = Number(dashboard.soldShares || 0) + assignmentSoldShares;
  const remainingShares = Math.max(0, totalShares - soldShares);
  const soldRatio = totalShares > 0 ? Math.min(1, soldShares / totalShares) : 0;

  const topProjects = dashboard.topProjects || [];

  const recentTransactions = useMemo(() => {
    const shareTx = (dashboard.recentTransactions || []).map((tx) => ({
      uuid: tx.uuid,
      who: tx.shareholderName || "-",
      project: tx.projectName || "-",
      amount: Number(tx.amount || 0),
      status: tx.status || ("pending" as const),
      createdAt: tx.createdAt,
    }));

    const assignTx = assignments.map((a) => {
      const due = Number(a.due || 0);
      const paid = Number(a.paidAmount || 0);
      const total = Number(a.shareAmount || paid || 0);
      const st: "paid" | "pending" | "overdue" =
        due <= 0 && paid > 0 ? "paid" : a.status === "overdue" ? "overdue" : "pending";
      return {
        uuid: `assign-${a.uuid}`,
        who: a.customerName || "-",
        project: a.project?.name || a.projectName || "-",
        amount: paid > 0 ? paid : total,
        status: st,
        createdAt: a.assignedAt || a.createdAt || new Date().toISOString(),
      };
    });

    return [...shareTx, ...assignTx]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [dashboard.recentTransactions, assignments]);

  const leaderboard = useMemo(() => {
    const merged = new Map<string, { name: string; pts: number }>();
    for (const l of dashboard.leaderboard || []) {
      const k = l.name.trim().toLowerCase();
      const prev = merged.get(k) || { name: l.name, pts: 0 };
      prev.pts += Number(l.pts || 0);
      merged.set(k, prev);
    }
    for (const a of assignments) {
      const name = (a.customerName || "").trim();
      if (!name) continue;
      const k = name.toLowerCase();
      const prev = merged.get(k) || { name, pts: 0 };
      prev.pts += Number(a.points || 0);
      merged.set(k, prev);
    }
    return Array.from(merged.values())
      .sort((a, b) => b.pts - a.pts)
      .slice(0, 5);
  }, [dashboard.leaderboard, assignments]);

  const growthPct = Number(dashboard.growth?.shareValueDeltaPct || 0);

  const kpis = useMemo(
    () => [
      {
        icon: Wallet,
        label: { bn: "মোট শেয়ার মূল্য", en: "Total share value" } as Bi,
        node: <CountUp to={Number(dashboard.totalShareValue || 0)} compact prefix="৳" decimals={1} />,
        delta: Number(dashboard.growth?.shareValueDeltaPct || 0),
        spark: fullSeries.map((m) => m.shareValue),
        color: PALETTE[0],
        good: true,
      },
      {
        icon: FolderKanban,
        label: { bn: "মোট প্রজেক্ট", en: "Total projects" } as Bi,
        node: <CountUp to={Number(dashboard.totalProjects || 0)} />,
        delta: Number(dashboard.growth?.projectDeltaPct || 0),
        spark: fullSeries.map((m) => m.projectCount),
        color: PALETTE[1],
        good: true,
      },
      {
        icon: PieChart,
        label: { bn: "পেন্ডিং প্রজেক্ট", en: "Pending projects" } as Bi,
        node: <CountUp to={Number(dashboard.counts?.pending || 0)} />,
        delta: Number(dashboard.growth?.pendingDeltaPct || 0),
        spark: fullSeries.map((m) => m.pendingCount),
        color: PALETTE[2],
        good: true,
      },
      {
        icon: AlertTriangle,
        label: { bn: "রিজেক্টেড প্রজেক্ট", en: "Rejected projects" } as Bi,
        node: <CountUp to={Number(dashboard.counts?.rejected || 0)} />,
        delta: Number(dashboard.growth?.rejectedDeltaPct || 0),
        spark: fullSeries.map((m) => m.rejectedCount),
        color: PALETTE[3],
        good: false,
      },
    ],
    [dashboard, fullSeries],
  );

  const statusStyle = {
    paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    overdue: "bg-rose-50 text-rose-700 ring-rose-200",
  } as const;
  const statusLabel = { paid: { bn: "পরিশোধিত", en: "Paid" }, pending: { bn: "অপেক্ষমাণ", en: "Pending" }, overdue: { bn: "বকেয়া", en: "Overdue" } };

  const formatTxDate = (iso: string) => {
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return "-";
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dtStart = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
    const diffDays = Math.round((todayStart - dtStart) / 86400000);
    if (diffDays === 0) return t({ bn: "আজ", en: "Today" });
    if (diffDays === 1) return t({ bn: "গতকাল", en: "Yesterday" });
    if (diffDays > 1 && diffDays < 7) return `${num(diffDays)} ${t({ bn: "দিন আগে", en: "days ago" })}`;
    return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-US", { day: "numeric", month: "short", year: "numeric" }).format(dt);
  };

  const handleExportCsv = () => {
    const rows = [
      ["Shareholder", "Project", "Amount", "Status", "Date"],
      ...recentTransactions.map((r) => [r.who, r.project, String(r.amount), r.status, r.createdAt]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "share-portfolio-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const today = new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  const growthText = num(Math.abs(growthPct), { maximumFractionDigits: 1 });

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      {/* header */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 sm:p-9">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="flex items-center gap-2 text-sm text-slate-400"><CalendarDays className="h-4 w-4" />{today}</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {t({ bn: "স্বাগতম, আপনার শেয়ার পোর্টফোলিও", en: "Welcome — your share portfolio" })}{" "}
              <span className="text-emerald-600">{t({ bn: "বাড়ছে", en: "is growing" })}</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              {growthPct > 0
                ? t({
                    bn: `গত মাসের তুলনায় মোট শেয়ার মূল্য ${growthText}% বেড়েছে। নিচে বিস্তারিত দেখুন।`,
                    en: `Total share value is up ${growthText}% versus last month. Details below.`,
                  })
                : growthPct < 0
                  ? t({
                      bn: `গত মাসের তুলনায় মোট শেয়ার মূল্য ${growthText}% কমেছে। নিচে বিস্তারিত দেখুন।`,
                      en: `Total share value is down ${growthText}% versus last month. Details below.`,
                    })
                  : t({
                      bn: "গত মাসের তুলনায় মোট শেয়ার মূল্য স্থিতিশীল রয়েছে। নিচে বিস্তারিত দেখুন।",
                      en: "Total share value is steady versus last month. Details below.",
                    })}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExportCsv} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"><Download className="h-4 w-4" />{t({ bn: "এক্সপোর্ট", en: "Export" })}</button>
            <Link href="/dashboard/project/share-project/assign-share" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:scale-[1.03]"><Plus className="h-4 w-4" />{t({ bn: "শেয়ার অ্যাসাইন", en: "Assign share" })}</Link>
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
              { name: t({ bn: "শেয়ার মূল্য", en: "Share value" }), values: shareValueSeries },
              { name: t({ bn: "কালেকশন", en: "Collected" }), values: collectedSeries },
            ]}
          />
        </section>

        <section className={card}>
          <CardHead title={t({ bn: "প্রজেক্ট অনুযায়ী বণ্টন", en: "Allocation by project" })} sub={t({ bn: "মোট শেয়ার মূল্যের ভাগ", en: "Share of total value" })} />
          {allocationData.length > 0 ? (
            <DonutChart data={allocationData} centerLabel={t({ bn: "মোট", en: "Total" })} />
          ) : (
            <p className="py-16 text-center text-sm text-slate-400">{loading ? t({ bn: "লোড হচ্ছে...", en: "Loading..." }) : t({ bn: "কোনো প্রজেক্ট ডেটা নেই", en: "No project allocation data yet" })}</p>
          )}
        </section>
      </div>

      {/* bar + gauge + top projects */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr_1fr]">
        <section className={card}>
          <CardHead title={t({ bn: "মাসিক কালেকশন বনাম টার্গেট", en: "Monthly collection vs target" })} />
          <div className="mb-3"><Legend items={[{ color: PALETTE[0], label: t({ bn: "প্রকৃত", en: "Actual" }) }, { color: PALETTE[1], label: t({ bn: "টার্গেট", en: "Target" }) }]} /></div>
          <BarChart labels={labels} actual={monthCollectSeries} target={monthTargetSeries} names={[t({ bn: "প্রকৃত", en: "Actual" }), t({ bn: "টার্গেট", en: "Target" })]} />
        </section>

        <section className={`${card} flex flex-col`}>
          <CardHead title={t({ bn: "শেয়ার বিক্রয় অগ্রগতি", en: "Share sales progress" })} sub={t({ bn: "সব চলমান প্রজেক্ট", en: "All live projects" })} />
          <div className="flex flex-1 flex-col justify-center gap-6">
            <Gauge value={soldRatio} label={t({ bn: "বিক্রিত শেয়ার", en: "shares sold" })} />
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{t({ bn: "বিক্রিত", en: "Sold" })}</p><p className="font-bold text-slate-900">{num(soldShares)}</p></div>
              <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{t({ bn: "অবশিষ্ট", en: "Remaining" })}</p><p className="font-bold text-slate-900">{num(remainingShares)}</p></div>
            </div>
          </div>
        </section>

        <section className={card}>
          <CardHead title={t({ bn: "শীর্ষ প্রজেক্ট", en: "Top projects" })} sub={t({ bn: "শেয়ার বিক্রির হার", en: "Share sell-through" })} />
          {topProjects.length > 0 ? (
            <ul className="space-y-5">
              {topProjects.map((p, i) => (
                <li key={p.uuid || i}>
                  <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium text-slate-700">{p.name}</span><span className="font-bold text-slate-900">{num(p.soldPercent)}%</span></div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${p.soldPercent}%` }} viewport={{ once: true }} transition={{ duration: 1.2, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-12 text-center text-sm text-slate-400">{loading ? t({ bn: "লোড হচ্ছে...", en: "Loading..." }) : t({ bn: "কোনো প্রজেক্ট পাওয়া যায়নি", en: "No projects found" })}</p>
          )}
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
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((r, i) => (
                    <tr key={r.uuid || i} className="border-t border-slate-100 transition hover:bg-slate-50">
                      <td className="px-2 py-3.5"><span className="flex items-center gap-3 font-semibold text-slate-900"><span className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: PALETTE[i % 5] }}>{r.who.slice(0, 1).toUpperCase()}</span>{r.who}</span></td>
                      <td className="px-2 py-3.5 text-slate-600">{r.project}</td>
                      <td className="px-2 py-3.5 font-semibold text-slate-900">{taka(r.amount)}</td>
                      <td className="px-2 py-3.5"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusStyle[r.status]}`}>{t(statusLabel[r.status])}</span></td>
                      <td className="px-2 py-3.5 text-right text-slate-500">{formatTxDate(r.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-slate-100">
                    <td colSpan={5} className="px-2 py-8 text-center text-sm text-slate-400">{loading ? t({ bn: "লোড হচ্ছে...", en: "Loading..." }) : t({ bn: "এখনও কোনো লেনদেন হয়নি", en: "No transactions yet" })}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={card}>
          <CardHead title={t({ bn: "পয়েন্ট লিডারবোর্ড", en: "Points leaderboard" })} sub={t({ bn: "সময়মতো পরিশোধে শীর্ষ", en: "Top on-time payers" })} right={<Trophy className="h-5 w-5 text-amber-500" />} />
          {leaderboard.length > 0 ? (
            <ol className="space-y-3">
              {leaderboard.map((l, i) => (
                <motion.li key={l.name + i} initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex items-center gap-4 rounded-2xl bg-slate-50 p-3.5">
                  <span className={`grid h-9 w-9 place-items-center rounded-xl text-sm font-extrabold ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-white text-slate-500 ring-1 ring-slate-200"}`}>{num(i + 1)}</span>
                  <span className="flex-1 font-semibold text-slate-800">{l.name}</span>
                  <span className="font-bold text-slate-900">{num(l.pts)} <span className="text-xs font-medium text-slate-400">pts</span></span>
                </motion.li>
              ))}
            </ol>
          ) : (
            <p className="py-12 text-center text-sm text-slate-400">{loading ? t({ bn: "লোড হচ্ছে...", en: "Loading..." }) : t({ bn: "এখনও কোনো লিডারবোর্ড ডেটা নেই", en: "No leaderboard entries yet" })}</p>
          )}
        </section>
      </div>
    </div>
  );
}
