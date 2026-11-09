"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  Calendar,
  Download,
  Eye,
  Landmark,
  MoreVertical,
  NotebookText,
  Receipt,
  Search,
  ShoppingCart,
  Wallet,
  WalletCards,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ---------- Types & Interfaces ----------

interface StatCard {
  id: string;
  label: string;
  value: string;
  changeLabel: string;
  changeTone: "up" | "neutral";
  icon: React.ElementType;
  accent: string;
  cardBg: string;
  darkCardBg: string;
  sparkColor: string;
  sparkline: number[];
  path: string;
}

const timeFilterOptions = ["Today", "Weekly", "Monthly", "Yearly", "All"] as const;
type TimeFilter = (typeof timeFilterOptions)[number];

const statCards: StatCard[] = [
  {
    id: "expense",
    label: "Total Expense",
    value: "৳ 80,272",
    changeLabel: "12% vs last month",
    changeTone: "up",
    icon: Wallet,
    accent: "bg-rose-500",
    cardBg: "bg-rose-50/70 border-rose-100 hover:border-rose-300",
    darkCardBg: "dark:bg-rose-950/20 dark:border-rose-900/30 dark:hover:border-rose-800",
    sparkColor: "#f43f5e",
    sparkline: [10, 14, 9, 16, 12, 20, 15, 22, 18, 26],
    path: "/expenses",
  },
  {
    id: "payment",
    label: "Payment",
    value: "1",
    changeLabel: "0% vs last month",
    changeTone: "neutral",
    icon: WalletCards,
    accent: "bg-blue-500",
    cardBg: "bg-blue-50/70 border-blue-100 hover:border-blue-300",
    darkCardBg: "dark:bg-blue-950/20 dark:border-blue-900/30 dark:hover:border-blue-800",
    sparkColor: "#3b82f6",
    sparkline: [8, 10, 9, 12, 11, 13, 12, 14, 13, 15],
    path: "/payments",
  },
  {
    id: "sales",
    label: "Sales",
    value: "৳ 153,310",
    changeLabel: "24% vs last month",
    changeTone: "up",
    icon: ShoppingCart,
    accent: "bg-emerald-500",
    cardBg: "bg-emerald-50/70 border-emerald-100 hover:border-emerald-300",
    darkCardBg: "dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:hover:border-emerald-800",
    sparkColor: "#10b981",
    sparkline: [12, 10, 14, 13, 18, 16, 22, 20, 26, 30],
    path: "/sales",
  },
  {
    id: "purchases",
    label: "Purchases",
    value: "৳ 883,342",
    changeLabel: "18% vs last month",
    changeTone: "up",
    icon: Receipt,
    accent: "bg-violet-500",
    cardBg: "bg-violet-50/70 border-violet-100 hover:border-violet-300",
    darkCardBg: "dark:bg-violet-950/20 dark:border-violet-900/30 dark:hover:border-violet-800",
    sparkColor: "#8b5cf6",
    sparkline: [14, 12, 16, 15, 13, 18, 16, 20, 17, 22],
    path: "/purchases",
  },
  {
    id: "receipt",
    label: "Receipt",
    value: "9",
    changeLabel: "50% vs last month",
    changeTone: "up",
    icon: NotebookText,
    accent: "bg-amber-500",
    cardBg: "bg-amber-50/70 border-amber-100 hover:border-amber-300",
    darkCardBg: "dark:bg-amber-950/20 dark:border-amber-900/30 dark:hover:border-amber-800",
    sparkColor: "#f59e0b",
    sparkline: [6, 9, 8, 12, 10, 15, 13, 18, 16, 20],
    path: "/receipts",
  },
  {
    id: "journal",
    label: "Journal",
    value: "1",
    changeLabel: "0% vs last month",
    changeTone: "neutral",
    icon: BarChart3,
    accent: "bg-teal-500",
    cardBg: "bg-teal-50/70 border-teal-100 hover:border-teal-300",
    darkCardBg: "dark:bg-teal-950/20 dark:border-teal-900/30 dark:hover:border-teal-800",
    sparkColor: "#14b8a6",
    sparkline: [10, 11, 10, 12, 11, 13, 12, 13, 12, 13],
    path: "/journals",
  },
];

const cashBankVouchers = [
  {
    sl: 1,
    voucherNo: "R00013",
    description: "Sagor kumar",
    bank: "Cash",
    date: "03 Sept 2026",
    chequeDate: "03 Sept 2026",
    amount: "122,320.00",
    status: "Honour",
  },
];

const pendingCheques = [
  {
    sl: 1,
    voucherNo: "R00013",
    description: "Sagor kumar",
    bank: "Cash",
    date: "03 Sept 2026",
    chequeDate: "03 Sept 2026",
    amount: "122,320.00",
    status: "Honour",
  },
  {
    sl: 2,
    voucherNo: "R00014",
    description: "Office Rent",
    bank: "Bank of BDT",
    date: "05 Sept 2026",
    chequeDate: "05 Sept 2026",
    amount: "85,000.00",
    status: "Dishonour",
  },
  {
    sl: 3,
    voucherNo: "R00015",
    description: "Supplier Payment",
    bank: "DBBL",
    date: "08 Sept 2026",
    chequeDate: "08 Sept 2026",
    amount: "420,000.00",
    status: "Honour",
  },
  {
    sl: 4,
    voucherNo: "R00016",
    description: "Material Purchase",
    bank: "Agrani Bank",
    date: "10 Sept 2026",
    chequeDate: "10 Sept 2026",
    amount: "250,000.00",
    status: "Pending",
  },
];

const months = [
  "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", 
  "Mar", "Apr", "May", "Jun", "Jul", "Aug"
];

const expenseOverview = [
  { month: "Sep", expense: 2500000 },
  { month: "Oct", expense: 1050000 },
  { month: "Nov", expense: 400000 },
  { month: "Dec", expense: 350000 },
  { month: "Jan", expense: 200000 },
  { month: "Feb", expense: 900000 },
  { month: "Mar", expense: 700000 },
  { month: "Apr", expense: 1500000 },
  { month: "May", expense: 1750000 },
  { month: "Jun", expense: 1300000 },
  { month: "Jul", expense: 1600000 },
  { month: "Aug", expense: 1450000 },
];

const inflowOutflow = months.map((m, i) => ({
  month: m,
  inflow: [1500, 2800, 2600, 900, 1500, 1000, 1800, 2900, 2600, 2500, 1900, 1300][i],
  outflow: [1200, 1500, 900, 500, 700, 600, 900, 1600, 1900, 1700, 1400, 900][i],
}));

const pendingVouchers = [
  {
    id: 1,
    reference: "-",
    project: "Sheba Eyecon Tower",
    contact: "Mr. Raju raz",
    addedBy: "Admin",
    date: "03-Sept-2026",
    code: "SaleOffer-5154844",
    note: "Approval Layer has not been set yet.",
  },
  {
    id: 2,
    reference: "-",
    project: "Lake Garden",
    contact: "Mr. Raju raz",
    addedBy: "Admin",
    date: "03-Sept-2026",
    code: "SaleOffer-4181717",
    note: "Approval Layer has not been set yet.",
  },
  {
    id: 3,
    reference: "-",
    project: "Lake Garden",
    contact: "Mr. Raju raz",
    addedBy: "Admin",
    date: "03-Sept-2026",
    code: "SaleOffer-566922",
    note: "Approval Layer has not been set yet.",
  },
];

const statusStyles: Record<string, string> = {
  Honour: "bg-emerald-500 text-white dark:bg-emerald-600",
  Dishonour: "bg-rose-500 text-white dark:bg-rose-600",
  Pending: "bg-amber-400 text-slate-900 dark:bg-amber-500",
};

const currencyBDT = (n: number) =>
  "৳ " + new Intl.NumberFormat("en-US").format(n);

// ---------- Helper Components ----------

const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  const chartData = data.map((v, i) => ({ i, v }));
  const gradId = `spark-${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={38}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradId})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const StatCardItem = ({ stat, onClick }: { stat: StatCard; onClick: () => void }) => {
  const Icon = stat.icon;
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={`group cursor-pointer rounded-2xl border ${stat.cardBg} ${stat.darkCardBg} p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] flex flex-col justify-between`}
    >
      <div>
        <div className="flex items-center justify-between">
          <div className={`flex items-center justify-center w-8 h-8 rounded-xl ${stat.accent} shadow-sm group-hover:scale-110 transition-transform`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
        </div>
        <p className="mt-3 text-[12px] font-medium text-slate-500 dark:text-slate-400">
          {stat.label}
        </p>
        <p className="text-[19px] font-bold text-slate-800 dark:text-slate-100 tracking-tight my-0.5">
          {stat.value}
        </p>
        <div className="flex items-center gap-1 text-[11px] font-medium">
          <ArrowUpRight
            className={`w-3.5 h-3.5 ${
              stat.changeTone === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
            }`}
          />
          <span
            className={
              stat.changeTone === "up"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-500 dark:text-slate-400"
            }
          >
            {stat.changeLabel}
          </span>
        </div>
      </div>
      <div className="mt-1 -mx-1">
        <Sparkline data={stat.sparkline} color={stat.sparkColor} />
      </div>
    </div>
  );
};

const CardShell = ({
  icon: Icon,
  iconBg,
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  icon: React.ElementType;
  iconBg: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-5 flex flex-col justify-between h-full transition-colors duration-200 ${className}`}>
    <div className="w-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`flex items-center justify-center w-8 h-8 rounded-xl ${iconBg}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-[14.5px] font-semibold text-slate-800 dark:text-slate-100 leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  </div>
);

const CustomChartTooltip = ({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (v: number) => string;
}) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-lg px-3 py-2 text-[12px]">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label} 2026</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

// ---------- Main Dashboard Component ----------

const AccountsDashboard = () => {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<TimeFilter>("Monthly");
  const [dateRange] = useState("03 Sep 2026 - 03 Oct 2026");

  const cashTotal = 32431996.66;
  const cashOnly = 12431996.66;
  const bankOnly = 20000000.0;

  const handleCardClick = (path: string) => {
    // router.push(path);
    console.log("Navigating to:", path);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 transition-colors duration-300 p-4 sm:p-6 space-y-5">
      
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md shadow-indigo-200 dark:shadow-none">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[19px] font-bold text-slate-800 dark:text-white tracking-tight">
              Accounts Dashboard
            </h1>
            <p className="text-[12px] text-slate-400 dark:text-slate-400">
              Overview of financial activities and key metrics
            </p>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Filter Tabs */}
          <div className="flex items-center bg-slate-200/70 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
            {timeFilterOptions.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-all ${
                  activeFilter === filter
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Date Range Picker */}
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11.5px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {dateRange}
          </button>

          {/* Export Button */}
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11.5px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Top 6 Clickable Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {statCards.map((stat) => (
          <StatCardItem
            key={stat.id}
            stat={stat}
            onClick={() => handleCardClick(stat.path)}
          />
        ))}
      </div>

      {/* Middle Section: 3 Equal Width & Height Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        
        {/* 1. Cash Bank Balance */}
        <div className="h-full">
          <CardShell
            icon={Landmark}
            iconBg="bg-indigo-500"
            title="Cash Bank Balance"
            action={
              <button className="text-[12px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-0.5">
                See more <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            <p className="text-[22px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {currencyBDT(cashTotal)}
            </p>
            <p className="text-[11.5px] text-slate-400 dark:text-slate-500 mb-3.5">
              Total Cash & Bank Balance
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-2.5">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500 text-white shrink-0">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Cash</p>
                  <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {currencyBDT(cashOnly)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-2.5">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500 text-white shrink-0">
                  <Landmark className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Bank</p>
                  <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {currencyBDT(bankOnly)}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[380px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                    {["SL", "VOUCHER", "DESC", "BANK", "DATE", "AMOUNT", "STATUS"].map((h) => (
                      <th
                        key={h}
                        className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cashBankVouchers.map((v) => (
                    <tr key={v.sl} className="border-b border-slate-100 dark:border-slate-800/60">
                      <td className="px-2 py-2 text-[11.5px]">{v.sl}</td>
                      <td className="px-2 py-2 text-[11.5px] text-indigo-600 dark:text-indigo-400 font-medium whitespace-nowrap">
                        {v.voucherNo}
                      </td>
                      <td className="px-2 py-2 text-[11.5px] whitespace-nowrap">{v.description}</td>
                      <td className="px-2 py-2 text-[11.5px]">
                        <span className="px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-[10px] font-medium border border-sky-100 dark:border-sky-900/30">
                          {v.bank}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {v.date}
                      </td>
                      <td className="px-2 py-2 text-[11.5px] font-medium whitespace-nowrap">{v.amount}</td>
                      <td className="px-2 py-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${statusStyles[v.status]}`}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400 dark:text-slate-500">
              <p>Showing 1 to 1 entries</p>
              <span className="px-2 py-0.5 rounded bg-rose-500 text-white text-[10px] font-medium">
                Dishonour
              </span>
            </div>
          </CardShell>
        </div>

        {/* 2. Expense Overview */}
        <div className="h-full">
          <CardShell
            icon={Receipt}
            iconBg="bg-amber-500"
            title="Expense Overview"
            subtitle="Last 12 Months"
            action={
              <button aria-label="More" className="text-slate-300 hover:text-slate-500 dark:hover:text-slate-300">
                <MoreVertical className="w-4 h-4" />
              </button>
            }
          >
            <div className="pt-2">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={expenseOverview} margin={{ left: -25, right: 0, top: 10 }}>
                  <CartesianGrid vertical={false} stroke="#334155" strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `${v / 100000}L`}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomChartTooltip formatter={(v) => currencyBDT(v)} />} />
                  <Bar
                    dataKey="expense"
                    name="Expense"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={14}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11.5px] text-slate-500 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Expense
            </div>
          </CardShell>
        </div>

        {/* 3. Pending Voucher/Invoice */}
        <div className="h-full">
          <CardShell
            icon={NotebookText}
            iconBg="bg-teal-500"
            title="Pending Voucher/Invoice"
            action={
              <button className="text-[12px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                View All
              </button>
            }
          >
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search with Project/Code/Reference..."
                className="w-full pl-8 pr-3 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {pendingVouchers.map((v) => (
                <div
                  key={v.id}
                  className="rounded-xl border border-slate-100 dark:border-slate-800/80 p-2.5 bg-slate-50/50 dark:bg-slate-800/30 hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[11px] space-y-0.5 text-slate-500 dark:text-slate-400">
                      <p>
                        Reference: <span className="text-slate-700 dark:text-slate-300">{v.reference}</span>
                      </p>
                      <p>
                        Project:{" "}
                        <span className="text-slate-800 dark:text-slate-200 font-medium">{v.project}</span>
                      </p>
                      <p>
                        Contact: <span className="text-slate-700 dark:text-slate-300">{v.contact}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2 py-0.5 rounded text-[9.5px] font-semibold bg-amber-400 text-slate-900">
                        Offer
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {v.code}
                      </span>
                      <button
                        aria-label="View Details"
                        className="flex items-center justify-center w-5 h-5 rounded bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10.5px] text-rose-500 dark:text-rose-400 mt-1 font-medium">
                    {v.note}
                  </p>
                </div>
              ))}
            </div>
          </CardShell>
        </div>

      </div>

      {/* Bottom Section: Pending Cheque (Strict container fit, No scroll) & Inflow vs Outflow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        
        {/* Pending Cheque (Fixed layout - strictly contained within card boundary) */}
        <div className="lg:col-span-2 h-full min-w-0">
          <CardShell
            icon={Building2}
            iconBg="bg-slate-700 dark:bg-slate-600"
            title="Pending Cheque"
            action={
              <button className="text-[12px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                View All
              </button>
            }
          >
            <div className="w-full overflow-hidden">
              <table className="w-full table-fixed text-left border-collapse">
                <thead>
                  <tr className="bg-[#1e293b] text-white">
                    <th className="w-[5%] px-1.5 py-2 text-[9.5px] font-semibold tracking-wider rounded-l-lg text-center">SL</th>
                    <th className="w-[15%] px-1.5 py-2 text-[9.5px] font-semibold tracking-wider">VOUCHER NO</th>
                    <th className="w-[21%] px-1.5 py-2 text-[9.5px] font-semibold tracking-wider">DESCRIPTION</th>
                    <th className="w-[14%] px-1.5 py-2 text-[9.5px] font-semibold tracking-wider">BANK</th>
                    <th className="w-[13%] px-1.5 py-2 text-[9.5px] font-semibold tracking-wider">DATE</th>
                    <th className="w-[13%] px-1.5 py-2 text-[9.5px] font-semibold tracking-wider">CHEQUE DATE</th>
                    <th className="w-[11%] px-1.5 py-2 text-[9.5px] font-semibold tracking-wider text-right">AMOUNT</th>
                    <th className="w-[8%] px-1.5 py-2 text-[9.5px] font-semibold tracking-wider text-center rounded-r-lg">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCheques.map((c) => (
                    <tr key={c.sl} className="border-b border-slate-100 dark:border-slate-800/80">
                      <td className="px-1.5 py-2.5 text-[10.5px] text-center">{c.sl}</td>
                      <td className="px-1.5 py-2.5 text-[10.5px] text-indigo-600 dark:text-indigo-400 font-medium truncate">
                        {c.voucherNo}
                      </td>
                      <td className="px-1.5 py-2.5 text-[10.5px] text-slate-700 dark:text-slate-300 truncate" title={c.description}>
                        {c.description}
                      </td>
                      <td className="px-1.5 py-2.5 text-[10.5px] truncate">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9.5px] font-medium inline-block truncate max-w-full">
                          {c.bank}
                        </span>
                      </td>
                      <td className="px-1.5 py-2.5 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {c.date}
                      </td>
                      <td className="px-1.5 py-2.5 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {c.chequeDate}
                      </td>
                      <td className="px-1.5 py-2.5 text-[10.5px] font-semibold text-slate-800 dark:text-slate-200 text-right truncate">
                        {c.amount}
                      </td>
                      <td className="px-1.5 py-2.5 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-medium inline-block ${statusStyles[c.status]}`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
              Showing 1 to {pendingCheques.length} of {pendingCheques.length} entries
            </p>
          </CardShell>
        </div>

        {/* Inflow vs Outflow */}
        <div className="lg:col-span-1 h-full min-w-0">
          <CardShell
            icon={BarChart3}
            iconBg="bg-emerald-500"
            title="Inflow vs Outflow"
            subtitle="Last 12 Months"
            action={
              <button aria-label="More" className="text-slate-300 hover:text-slate-500 dark:hover:text-slate-300">
                <MoreVertical className="w-4 h-4" />
              </button>
            }
          >
            <div className="pt-2">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={inflowOutflow} margin={{ left: -25, right: 0, top: 10 }}>
                  <CartesianGrid vertical={false} stroke="#334155" strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `${v / 100}L`}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomChartTooltip formatter={(v) => currencyBDT(v)} />} />
                  <Bar
                    dataKey="inflow"
                    name="In Flow"
                    fill="#10b981"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={7}
                  />
                  <Bar
                    dataKey="outflow"
                    name="Out Flow"
                    fill="#3b82f6"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={7}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-2 text-[11.5px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                In Flow
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Out Flow
              </span>
            </div>
          </CardShell>
        </div>

      </div>

    </div>
  );
};

export default AccountsDashboard;