"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Coins,
  FileSearch,
  Landmark,
  PieChart,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { getPublicPortfolio } from "@/lib/share-project-api";

export function PublicPortfolioView({ mode = "investments" }: { mode?: "investments" | "shares" }) {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState<"investments" | "shares">(mode);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [portfolio, setPortfolio] = useState<{ investments: any[]; shares: any[] }>({
    investments: [],
    shares: [],
  });

  const fetchData = async (query = searchQuery) => {
    setLoading(true);
    setError("");
    try {
      const q = query.trim();
      const data = await getPublicPortfolio(
        q ? { email: q, phone: q, code: q } : undefined,
      );
      setPortfolio({
        investments: (data.investments || []) as any[],
        shares: (data.shares || []) as any[],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load investment data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let initialQuery = "";
    try {
      const saved = localStorage.getItem("share-project:guest-investor");
      if (saved) {
        const parsed = JSON.parse(saved);
        initialQuery = parsed.email || parsed.phone || "";
        setSearchQuery(initialQuery);
      }
    } catch {
      /* ignore */
    }
    void fetchData(initialQuery);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchData(searchQuery);
  };

  const handleReset = () => {
    setSearchQuery("");
    void fetchData("");
  };

  const rows = activeTab === "shares" ? portfolio.shares : portfolio.investments;
  const totalShares = rows.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
  const totalAmount = rows.reduce(
    (sum, r) => sum + Number(r.totalAmount || r.shareValue || 0),
    0,
  );

  return (
    <main className="min-h-screen bg-slate-50/70 pb-24 pt-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/investments"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            {t({ bn: "ইনভেস্টমেন্ট সেন্টারে ফিরুন", en: "Back to Investment Center" })}
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/projects"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              {t({ bn: "নতুন প্রজেক্ট ব্রাউজ করুন", en: "Browse Projects" })}
            </Link>
          </div>
        </div>

        {/* Hero Card */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-slate-100 pb-8">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t({ bn: "পাবলিক ভেরিফিকেশন পোর্টাল", en: "Public Verification Portal" })}
              </span>
              <h1 className="mt-3 text-2xl sm:text-4xl font-extrabold text-slate-900">
                {activeTab === "shares"
                  ? t({ bn: "আমার শেয়ার (My Shares)", en: "My Shares" })
                  : t({ bn: "আমার বিনিয়োগ (My Investments)", en: "My Investments" })}
              </h1>
              <p className="mt-2 text-sm text-slate-500 max-w-2xl">
                {t({
                  bn: "লগইন ছাড়াই আপনার ইনভেস্টমেন্ট ও শেয়ারের বিস্তারিত তথ্য দেখুন এবং ট্র্যাক করুন।",
                  en: "View and track your investments and shares without needing to log in.",
                })}
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 p-1.5 self-start md:self-center">
              <button
                type="button"
                onClick={() => setActiveTab("investments")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition ${
                  activeTab === "investments"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Landmark className="h-4 w-4 text-emerald-600" />
                {t({ bn: "বিনিয়োগ সমূহ", en: "Investments" })}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("shares")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition ${
                  activeTab === "shares"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <ShieldCheck className="h-4 w-4 text-sky-600" />
                {t({ bn: "শেয়ার সমূহ", en: "My Shares" })}
              </button>
            </div>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="mt-8">
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t({
                    bn: "আপনার ইমেইল, ফোন নাম্বার অথবা ইনভেস্টমেন্ট কোড লিখুন (যেমন: IN-...)",
                    en: "Enter your email, phone, or investment code (e.g. IN-...)",
                  })}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-7 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-emerald-700 transition"
              >
                <Search className="h-4 w-4" />
                {t({ bn: "অনুসন্ধান করুন", en: "Search" })}
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  {t({ bn: "সব দেখুন", en: "View All" })}
                </button>
              )}
            </div>
          </form>

          {/* Error notice */}
          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* KPI Summary Cards */}
          {!loading && rows.length > 0 && (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    {t({ bn: "মোট রেকর্ড", en: "Total Records" })}
                  </span>
                  <FileSearch className="h-4 w-4 text-slate-400" />
                </div>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">{rows.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    {t({ bn: "মোট শেয়ার সংখ্যা", en: "Total Shares" })}
                  </span>
                  <PieChart className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">{totalShares}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    {t({ bn: "মোট পরিমাণ", en: "Total Investment Amount" })}
                  </span>
                  <Coins className="h-4 w-4 text-amber-600" />
                </div>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  ৳ {totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Table Area */}
          <div className="mt-8">
            {loading ? (
              <div className="py-16 text-center text-sm text-slate-500">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                {t({ bn: "ইনভেস্টমেন্ট ডাটা লোড হচ্ছে...", en: "Loading investment records..." })}
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 py-16 text-center">
                <FileSearch className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-4 text-base font-bold text-slate-800">
                  {t({ bn: "কোনো রেকর্ড পাওয়া যায়নি", en: "No investment records found" })}
                </h3>
                <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                  {t({
                    bn: "আপনার সঠিক ইমেইল, মোবাইল নাম্বার অথবা ইনভেস্টমেন্ট কোড লিখে আবার অনুসন্ধান করুন।",
                    en: "Try searching with your registered email, phone number, or investment code.",
                  })}
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/projects"
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                  >
                    {t({ bn: "প্রজেক্টে বিনিয়োগ করুন", en: "Invest in a project" })}
                  </Link>
                  <Link
                    href="/contact"
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    {t({ bn: "সহায়তা প্রয়োজন?", en: "Need help?" })}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">{t({ bn: "কোড", en: "Code" })}</th>
                      <th className="py-3.5 px-4">{t({ bn: "প্রজেক্টের নাম", en: "Project Name" })}</th>
                      <th className="py-3.5 px-4">{t({ bn: "ইনভেস্টর", en: "Investor" })}</th>
                      <th className="py-3.5 px-4 text-center">
                        {activeTab === "shares"
                          ? t({ bn: "শেয়ার সংখ্যা", en: "Shares Owned" })
                          : t({ bn: "শেয়ার", en: "Shares" })}
                      </th>
                      <th className="py-3.5 px-4 text-right">
                        {activeTab === "shares"
                          ? t({ bn: "শেয়ার ভ্যালু", en: "Share Value" })
                          : t({ bn: "মোট টাকা", en: "Total Amount" })}
                      </th>
                      <th className="py-3.5 px-4 text-center">{t({ bn: "স্ট্যাটাস", en: "Status" })}</th>
                      <th className="py-3.5 px-4 text-right">{t({ bn: "তারিখ", en: "Date" })}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {rows.map((row) => (
                      <tr
                        key={String(row.uuid || row.id || row.code)}
                        className="hover:bg-slate-50/70 transition"
                      >
                        <td className="py-4 px-4 font-mono text-xs font-semibold text-slate-600">
                          {row.code || "-"}
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-900">
                          {row.projectUuid ? (
                            <Link
                              href={`/projects/${row.projectUuid}`}
                              className="text-emerald-700 hover:underline flex items-center gap-1.5"
                            >
                              {row.projectName || t({ bn: "প্রজেক্ট দেখুন", en: "View Project" })}
                            </Link>
                          ) : (
                            <span>{row.projectName || "-"}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-slate-600 text-xs">
                          {row.investorName ? (
                            <span className="font-medium text-slate-800">{row.investorName}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-slate-800">
                          {row.quantity}
                        </td>
                        <td className="py-4 px-4 text-right font-extrabold text-slate-900">
                          ৳ {Number(row.totalAmount || row.shareValue || 0).toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                              row.status === "confirmed"
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                : row.status === "cancelled"
                                ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                                : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                            }`}
                          >
                            {row.status === "confirmed" ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : row.status === "cancelled" ? (
                              <XCircle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {row.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right text-xs text-slate-500 whitespace-nowrap">
                          {row.createdAt
                            ? new Date(row.createdAt).toLocaleDateString("en-GB")
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

