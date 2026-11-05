"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Landmark,
  LogIn,
  Search,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import {
  getPublicPortfolio,
  getShareProjectNotifications,
  getShareProjectPortfolio,
  getShareUserProfile,
  updateShareUserProfile,
} from "@/lib/share-project-api";
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredUser,
  setStoredTokens,
} from "@/lib/admin-auth/adminAuthStorage";

export type InvestorFeature =
  | "profile"
  | "kyc"
  | "investments"
  | "shares"
  | "profits"
  | "payments"
  | "reports"
  | "notifications";

const titles: Record<InvestorFeature, { bn: string; en: string }> = {
  profile: { bn: "আমার প্রোফাইল", en: "My profile" },
  kyc: { bn: "KYC যাচাই", en: "KYC verification" },
  investments: { bn: "আমার বিনিয়োগ", en: "My investments" },
  shares: { bn: "আমার শেয়ার", en: "My shares" },
  profits: { bn: "লাভ ও ডিভিডেন্ড", en: "Profit & dividend" },
  payments: { bn: "পেমেন্ট ইতিহাস", en: "Payment history" },
  reports: { bn: "রিপোর্ট ও ডকুমেন্ট", en: "Statements & documents" },
  notifications: { bn: "নোটিফিকেশন", en: "Notifications" },
};

const card =
  "rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.04)] sm:p-6";
const input =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10";

export function InvestorFeaturePage({ feature }: { feature: InvestorFeature }) {
  const { t } = useLang();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [portfolio, setPortfolio] = useState<Record<string, unknown[]>>({});
  const [notifications, setNotifications] = useState<Array<Record<string, unknown>>>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const isGuest = typeof window !== "undefined" && !getStoredAccessToken();

  const loadData = async (query = searchQuery) => {
    setLoading(true);
    setError("");
    try {
      const hasToken = typeof window !== "undefined" && !!getStoredAccessToken();
      if (feature === "profile" || feature === "kyc") {
        if (hasToken) {
          const value = await getShareUserProfile();
          setProfile({
            name: String(value.name || ""),
            email: String(value.email || ""),
            phone: String(value.phone || ""),
          });
        }
      } else if (["investments", "shares", "profits", "payments", "reports"].includes(feature)) {
        if (hasToken && !query.trim()) {
          const data = await getShareProjectPortfolio();
          setPortfolio(data);
        } else {
          const data = await getPublicPortfolio(
            query.trim()
              ? { email: query.trim(), phone: query.trim(), code: query.trim() }
              : undefined,
          );
          setPortfolio(data);
        }
      } else if (feature === "notifications") {
        if (hasToken) {
          const data = await getShareProjectNotifications();
          setNotifications(data);
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let initialQuery = "";
    if (typeof window !== "undefined" && !getStoredAccessToken()) {
      try {
        const savedGuest = localStorage.getItem("share-project:guest-investor");
        if (savedGuest) {
          const parsed = JSON.parse(savedGuest);
          initialQuery = parsed.email || parsed.phone || "";
          setSearchQuery(initialQuery);
        }
      } catch {
        /* ignore */
      }
    }
    void loadData(initialQuery);
  }, [feature]);

  const handleSearch = (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    void loadData(searchQuery);
  };

  const handleResetSearch = () => {
    setSearchQuery("");
    void loadData("");
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(false);
    setError("");
    try {
      await updateShareUserProfile({ name: profile.name.trim(), phone: profile.phone.trim() });
      const stored = getStoredUser();
      setStoredTokens(
        getStoredAccessToken() || "",
        getStoredRefreshToken(),
        stored ? { ...stored, name: profile.name.trim(), phone: profile.phone.trim() } : null,
      );
      setSaved(true);
      toast.success("Profile saved successfully.");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not save profile.";
      setError(message);
      toast.error(message);
    }
  };

  const portfolioKey =
    feature === "profits"
      ? "profits"
      : feature === "payments"
      ? "payments"
      : feature === "reports"
      ? "reports"
      : feature === "shares"
      ? "shares"
      : "investments";
  const rows = (portfolio[portfolioKey] || []) as any[];

  const totalQuantity = rows.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
  const totalAmount = rows.reduce(
    (sum, r) => sum + Number(r.totalAmount || r.shareValue || 0),
    0,
  );

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-white p-6 ring-1 ring-slate-200 sm:p-8">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
            {t({ bn: "ইনভেস্টর পোর্টাল", en: "Investor portal" })}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {t(titles[feature])}
          </h1>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {(feature === "profile" || feature === "kyc") && !isGuest && (
        <form onSubmit={saveProfile} className={card}>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                {feature === "kyc"
                  ? t({ bn: "পরিচয় যাচাই তথ্য", en: "Identity verification" })
                  : t({ bn: "ব্যক্তিগত তথ্য", en: "Personal information" })}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {feature === "kyc"
                  ? t({ bn: "KYC নথি আপলোড API এখন তৈরি হচ্ছে।", en: "The KYC document API is not implemented yet." })
                  : t({ bn: "আপনার যোগাযোগ এবং ব্যক্তিগত তথ্য হালনাগাদ করুন।", en: "Update your contact and personal details." })}
              </p>
            </div>
            {feature === "kyc" && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                {t({ bn: "যাচাই বাকি", en: "Pending" })}
              </span>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              required
              className={input}
              value={profile.name}
              onChange={(event) =>
                setProfile((current) => ({ ...current, name: event.target.value }))
              }
              placeholder={t({ bn: "পুরো নাম", en: "Full name" })}
            />
            <input
              required
              type="email"
              readOnly
              className={`${input} bg-slate-100 text-slate-500`}
              value={profile.email}
              placeholder="Email"
            />
            <input
              type="tel"
              className={input}
              value={profile.phone}
              onChange={(event) =>
                setProfile((current) => ({ ...current, phone: event.target.value }))
              }
              placeholder={t({ bn: "মোবাইল", en: "Mobile" })}
            />
          </div>
          {feature === "profile" && (
            <button
              disabled={loading}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-ink-950 px-5 py-3 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              {saved
                ? t({ bn: "সংরক্ষিত হয়েছে", en: "Saved successfully" })
                : t({ bn: "পরিবর্তন সংরক্ষণ", en: "Save changes" })}
            </button>
          )}
        </form>
      )}

      {(feature === "profile" || feature === "kyc") && isGuest && (
        <div className={`${card} py-12 text-center`}>
          <p className="text-base font-semibold text-slate-800">
            {t({
              bn: "প্রোফাইল দেখতে আপনাকে লগইন করতে হবে",
              en: "Please log in to view and edit your profile",
            })}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {t({
              bn: "ইনভেস্টমেন্ট ও শেয়ার হিস্ট্রি লগইন ছাড়াই দেখতে পারবেন।",
              en: "Investments and shares can be viewed without logging in.",
            })}
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <LogIn className="h-4 w-4" />
            {t({ bn: "লগইন করুন", en: "Log in" })}
          </Link>
        </div>
      )}

      {["investments", "shares", "profits", "payments", "reports"].includes(feature) && (
        <section className={card}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-500">
                {feature === "payments" ? (
                  <WalletCards className="h-5 w-5" />
                ) : feature === "investments" ? (
                  <Landmark className="h-5 w-5" />
                ) : (
                  <ShieldCheck className="h-5 w-5" />
                )}
              </span>
              <div>
                <h2 className="font-bold text-slate-900">{t(titles[feature])}</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {loading
                    ? t({ bn: "ডেটা লোড হচ্ছে...", en: "Loading data..." })
                    : rows.length > 0
                    ? `${rows.length} ${t({ bn: "টি রেকর্ড পাওয়া গেছে", en: "records found" })}`
                    : t({ bn: "কোনো রেকর্ড পাওয়া যায়নি।", en: "No records found." })}
                </p>
              </div>
            </div>
            {isGuest && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t({ bn: "পাবলিক ভিউ (লগইন ছাড়া)", en: "Public view (No login required)" })}
              </span>
            )}
          </div>

          {/* Search bar for guest or filtering */}
          <form
            onSubmit={handleSearch}
            className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t({
                  bn: "ইমেইল, ফোন অথবা ইনভেস্টমেন্ট কোড দিয়ে খুঁজুন (যেমন: IN-...)",
                  en: "Search by email, phone, or investment code (e.g. IN-...)",
                })}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </div>
            <button
              type="submit"
              className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              {t({ bn: "অনুসন্ধান", en: "Search" })}
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                {t({ bn: "সব দেখুন", en: "View all" })}
              </button>
            )}
          </form>

          {/* Quick KPIs */}
          {!loading && rows.length > 0 && (
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-400">{t({ bn: "মোট রেকর্ড", en: "Total records" })}</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{rows.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-400">
                  {t({ bn: "মোট শেয়ার সংখ্যা", en: "Total shares" })}
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900">{totalQuantity}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 col-span-2 sm:col-span-1">
                <p className="text-xs text-slate-400">{t({ bn: "মোট পরিমাণ", en: "Total amount" })}</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  ৳ {totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {!loading && rows.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-slate-600">
                {t({ bn: "কোনো ইনভেস্টমেন্ট রেকর্ড পাওয়া যায়নি", en: "No investment records found" })}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {t({
                  bn: "আপনার সঠিক ইমেইল, ফোন অথবা ইনভেস্টমেন্ট কোড লিখে খুঁজুন।",
                  en: "Search with your email, phone, or investment code.",
                })}
              </p>
              <Link
                href="/projects"
                className="mt-4 inline-block rounded-xl bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
              >
                {t({ bn: "প্রজেক্ট দেখুন ও বিনিয়োগ করুন", en: "Browse projects & invest" })}
              </Link>
            </div>
          )}

          {!loading && rows.length > 0 && (feature === "investments" || feature === "shares") && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-400">
                    <th className="py-3 pr-4">{t({ bn: "কোড", en: "Code" })}</th>
                    <th className="py-3 pr-4">{t({ bn: "প্রজেক্ট", en: "Project" })}</th>
                    <th className="py-3 pr-4">
                      {feature === "shares"
                        ? t({ bn: "শেয়ার সংখ্যা", en: "Shares owned" })
                        : t({ bn: "শেয়ার", en: "Shares" })}
                    </th>
                    <th className="py-3 pr-4">{t({ bn: "মোট টাকা", en: "Total amount" })}</th>
                    <th className="py-3 pr-4">{t({ bn: "স্ট্যাটাস", en: "Status" })}</th>
                    <th className="py-3">{t({ bn: "তারিখ", en: "Date" })}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row: any) => (
                    <tr
                      key={String(row.uuid || row.id || row.code)}
                      className="border-b border-slate-100 hover:bg-slate-50/50"
                    >
                      <td className="py-3 pr-4 font-mono text-xs font-semibold text-slate-500">
                        {row.code || "-"}
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-800">
                        {row.projectUuid ? (
                          <Link
                            href={`/projects/${row.projectUuid}`}
                            className="text-emerald-600 hover:underline"
                          >
                            {row.projectName || t({ bn: "প্রজেক্ট দেখুন", en: "View project" })}
                          </Link>
                        ) : (
                          <span>{row.projectName || "-"}</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 font-semibold text-slate-800">{row.quantity}</td>
                      <td className="py-3 pr-4 font-bold text-slate-900">
                        ৳ {Number(row.totalAmount || row.shareValue || 0).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            row.status === "confirmed"
                              ? "bg-emerald-50 text-emerald-700"
                              : row.status === "cancelled"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-slate-500">
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
        </section>
      )}

      {feature === "notifications" && (
        <section className={card}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-slate-900">{t(titles.notifications)}</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {loading ? t({ bn: "লোড হচ্ছে...", en: "Loading..." }) : `${notifications.length}`}
              </p>
            </div>
          </div>
          {!loading && notifications.length === 0 && (
            <p className="py-12 text-center text-sm text-slate-500">
              {t({ bn: "কোনো নোটিফিকেশন নেই।", en: "No notifications." })}
            </p>
          )}
          {!loading &&
            notifications.map((notification, index) => (
              <div
                key={String(notification.uuid || index)}
                className="flex gap-3 border-b border-slate-100 py-4 last:border-b-0"
              >
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {String(notification.title || "")}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {String(notification.message || "")}
                  </p>
                </div>
              </div>
            ))}
        </section>
      )}
    </div>
  );
}
