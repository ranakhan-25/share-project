"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Landmark,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import {
  getShareProjectNotifications,
  getShareProjectPortfolio,
  getShareUserProfile,
  updateShareUserProfile,
} from "@/lib/share-project-api";
import { getStoredUser, setStoredTokens, getStoredAccessToken, getStoredRefreshToken } from "@/lib/admin-auth/adminAuthStorage";

export type InvestorFeature =
  | "profile" | "kyc" | "investments" | "shares" | "profits"
  | "payments" | "reports" | "notifications";

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

const card = "rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.04)] sm:p-6";
const input = "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10";

export function InvestorFeaturePage({ feature }: { feature: InvestorFeature }) {
  const { t, taka } = useLang();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [portfolio, setPortfolio] = useState<Record<string, unknown[]>>({});
  const [notifications, setNotifications] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    setLoading(true);
    setError("");
    const loadProfile = (feature === "profile" || feature === "kyc")
      ? getShareUserProfile().then((value) => {
          setProfile({
            name: String(value.name || ""),
            email: String(value.email || ""),
            phone: String(value.phone || ""),
          });
        })
      : Promise.resolve();
    const loadPortfolio = ["investments", "shares", "profits", "payments", "reports"].includes(feature)
      ? getShareProjectPortfolio().then(setPortfolio)
      : Promise.resolve();
    const loadNotifications = feature === "notifications"
      ? getShareProjectNotifications().then(setNotifications)
      : Promise.resolve();

    void Promise.all([loadProfile, loadPortfolio, loadNotifications])
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load data."))
      .finally(() => setLoading(false));
  }, [feature]);

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
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save profile.");
    }
  };

  const portfolioKey = feature === "profits" ? "profits"
    : feature === "payments" ? "payments"
    : feature === "reports" ? "reports"
    : feature === "shares" ? "shares"
    : "investments";
  const rows = portfolio[portfolioKey] || [];

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-white p-6 ring-1 ring-slate-200 sm:p-8">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">{t({ bn: "ইনভেস্টর পোর্টাল", en: "Investor portal" })}</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{t(titles[feature])}</h1>
        </div>
      </div>

      {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {(feature === "profile" || feature === "kyc") && (
        <form onSubmit={saveProfile} className={card}>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">{feature === "kyc" ? t({ bn: "পরিচয় যাচাই তথ্য", en: "Identity verification" }) : t({ bn: "ব্যক্তিগত তথ্য", en: "Personal information" })}</h2>
              <p className="mt-1 text-sm text-slate-500">{feature === "kyc" ? t({ bn: "KYC নথি আপলোড API এখন তৈরি হচ্ছে।", en: "The KYC document API is not implemented yet." }) : t({ bn: "আপনার যোগাযোগ এবং ব্যক্তিগত তথ্য হালনাগাদ করুন।", en: "Update your contact and personal details." })}</p>
            </div>
            {feature === "kyc" && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{t({ bn: "যাচাই বাকি", en: "Pending" })}</span>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input required className={input} value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} placeholder={t({ bn: "পুরো নাম", en: "Full name" })} />
            <input required type="email" readOnly className={`${input} bg-slate-100 text-slate-500`} value={profile.email} placeholder="Email" />
            <input type="tel" className={input} value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} placeholder={t({ bn: "মোবাইল", en: "Mobile" })} />
          </div>
          {feature === "profile" && (
            <button disabled={loading} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-ink-950 px-5 py-3 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-50">
              <ShieldCheck className="h-4 w-4" />
              {saved ? t({ bn: "সংরক্ষিত হয়েছে", en: "Saved successfully" }) : t({ bn: "পরিবর্তন সংরক্ষণ", en: "Save changes" })}
            </button>
          )}
        </form>
      )}

      {["investments", "shares", "profits", "payments", "reports"].includes(feature) && (
        <section className={card}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-500">
              {feature === "payments" ? <WalletCards className="h-5 w-5" /> : feature === "investments" ? <Landmark className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            </span>
            <div>
              <h2 className="font-bold text-slate-900">{t(titles[feature])}</h2>
              <p className="mt-0.5 text-sm text-slate-500">{loading ? t({ bn: "ডেটা লোড হচ্ছে...", en: "Loading data..." }) : t({ bn: "কোনো রেকর্ড পাওয়া যায়নি।", en: "No records found." })}</p>
            </div>
          </div>
          {!loading && rows.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-slate-600">{t({ bn: "রিয়েল ডেটা এখনো যুক্ত নয়", en: "No real data has been connected yet" })}</p>
              <Link href="/projects" className="mt-3 inline-block text-sm font-semibold text-emerald-600">{t({ bn: "প্রজেক্ট দেখুন", en: "View projects" })}</Link>
            </div>
          )}
          {!loading && rows.length > 0 && feature === "investments" && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-slate-100 text-xs text-slate-500"><th className="py-3 pr-4">Project</th><th className="py-3 pr-4">Shares</th><th className="py-3 pr-4">Total</th><th className="py-3 pr-4">Status</th><th className="py-3">Date</th></tr></thead>
                <tbody>{rows.map((row: any) => <tr key={String(row.uuid)} className="border-b border-slate-100"><td className="py-3 pr-4 font-medium">{row.projectName}</td><td className="py-3 pr-4">{row.quantity}</td><td className="py-3 pr-4 font-semibold">৳{Number(row.totalAmount || 0).toLocaleString()}</td><td className="py-3 pr-4"><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{row.status}</span></td><td className="py-3 text-slate-500">{row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {feature === "notifications" && (
        <section className={card}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Bell className="h-5 w-5" /></span>
            <div><h2 className="font-bold text-slate-900">{t(titles.notifications)}</h2><p className="mt-0.5 text-sm text-slate-500">{loading ? t({ bn: "লোড হচ্ছে...", en: "Loading..." }) : `${notifications.length}`}</p></div>
          </div>
          {!loading && notifications.length === 0 && <p className="py-12 text-center text-sm text-slate-500">{t({ bn: "কোনো নোটিফিকেশন নেই।", en: "No notifications." })}</p>}
          {!loading && notifications.map((notification, index) => (
            <div key={String(notification.uuid || index)} className="flex gap-3 border-b border-slate-100 py-4 last:border-b-0">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
              <div><p className="text-sm font-semibold text-slate-800">{String(notification.title || "")}</p><p className="mt-1 text-sm text-slate-500">{String(notification.message || "")}</p></div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
