"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, Download, Landmark, ReceiptText, ShieldCheck, Upload, WalletCards } from "lucide-react";
import { useLang, type Bi } from "@/lib/i18n";

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
  const { t, taka, num } = useLang();
  const [saved, setSaved] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("bkash");
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSaved(true); };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-white p-6 ring-1 ring-slate-200 sm:p-8">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="relative"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">{t({ bn: "ইনভেস্টর পোর্টাল", en: "Investor portal" })}</p><h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{t(titles[feature])}</h1></div>
      </div>

      {(feature === "profile" || feature === "kyc") && (
        <form onSubmit={submit} className={card}>
          <div className="mb-6 flex items-center justify-between"><div><h2 className="font-bold text-slate-900">{feature === "kyc" ? t({ bn: "পরিচয় যাচাই তথ্য", en: "Identity verification" }) : t({ bn: "ব্যক্তিগত তথ্য", en: "Personal information" })}</h2><p className="mt-1 text-sm text-slate-500">{feature === "kyc" ? t({ bn: "NID, ঠিকানা ও প্রমাণপত্র আপলোড করুন।", en: "Upload your NID, address and supporting documents." }) : t({ bn: "আপনার যোগাযোগ এবং ব্যক্তিগত তথ্য হালনাগাদ করুন।", en: "Update your contact and personal details." })}</p></div>{feature === "kyc" && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{t({ bn: "যাচাই বাকি", en: "Pending" })}</span>}</div>
          <div className="grid gap-4 md:grid-cols-2">
            <input required className={input} defaultValue="Rakibul Islam" placeholder={t({ bn: "পুরো নাম", en: "Full name" })} />
            <input required type="email" className={input} defaultValue="rakib@example.com" placeholder="Email" />
            <input required type="tel" className={input} defaultValue="+880 1700-000000" placeholder={t({ bn: "মোবাইল", en: "Mobile" })} />
            <input className={input} defaultValue="গুলশান-২, ঢাকা" placeholder={t({ bn: "ঠিকানা", en: "Address" })} />
            {feature === "kyc" && <><input className={input} placeholder={t({ bn: "NID নম্বর", en: "NID number" })} /><label className={`${input} flex cursor-pointer items-center gap-2 text-slate-500`}><Upload className="h-4 w-4" />{t({ bn: "NID / ঠিকানা প্রমাণ আপলোড", en: "Upload NID / address proof" })}<input type="file" accept=".pdf,.jpg,.png" className="hidden" /></label></>}
          </div>
          <button className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-ink-950 px-5 py-3 text-sm font-semibold text-white hover:bg-ink-800"><ShieldCheck className="h-4 w-4" />{saved ? t({ bn: "সংরক্ষিত হয়েছে", en: "Saved successfully" }) : feature === "kyc" ? t({ bn: "যাচাইয়ের জন্য পাঠান", en: "Submit for verification" }) : t({ bn: "পরিবর্তন সংরক্ষণ", en: "Save changes" })}</button>
        </form>
      )}

      {(feature === "investments" || feature === "shares") && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">{[
            { icon: Landmark, l: { bn: "মোট বিনিয়োগ", en: "Total investment" }, v: taka(950000) },
            { icon: CheckCircle2, l: { bn: "সক্রিয় বিনিয়োগ", en: "Active investments" }, v: num(3) },
            { icon: WalletCards, l: { bn: "শেয়ার মূল্য", en: "Current share value" }, v: taka(1050000) },
          ].map((x) => <div key={x.l.en} className={card}><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><x.icon className="h-5 w-5" /></span><div><p className="text-xs text-slate-400">{t(x.l)}</p><p className="mt-1 text-lg font-bold text-slate-900">{x.v}</p></div></div></div>)}</div>
          <div className="grid gap-5 md:grid-cols-3">{[
            ["Sea View Hotel", "২৪ শেয়ার", "৳840,000", "সক্রিয়"],
            ["Solar Power Plant", "১০ শেয়ার", "৳220,000", "সক্রিয়"],
            ["Lakeview Plaza", "২৫ শেয়ার", "৳450,000", "মক্কম"],
          ].map((row, index) => <div key={row[0]} className={card}><div className="flex items-start justify-between"><div><p className="text-lg font-bold text-slate-900">{row[0]}</p><p className="mt-1 text-sm text-slate-500">{feature === "shares" ? row[1] : t({ bn: "বিনিয়োগ সময়কাল", en: "Investment period" })}: {index === 0 ? "৩ বছর" : index === 1 ? "৫ বছর" : "৪ বছর"}</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{row[3]}</span></div><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-sm text-slate-500">{feature === "shares" ? t({ bn: "মোট মূল্য", en: "Share value" }) : t({ bn: "বিনিয়োগ", en: "Investment" })}</span><strong className="text-slate-900">{row[2]}</strong></div>{feature === "shares" && <button className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">{t({ bn: "সার্টিফিকেট দেখুন", en: "View certificate" })}</button>}<Link href="/projects" className="mt-4 block text-center text-xs font-semibold text-emerald-600">{t({ bn: "প্রজেক্ট বিবরণ", en: "Project details" })}</Link></div>)}</div>
        </>
      )}

      {feature === "profits" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]"><div className={card}><h2 className="font-bold text-slate-900">{t({ bn: "লাভের ইতিহাস", en: "Dividend history" })}</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead><tr className="border-b border-slate-100 text-xs text-slate-400"><th className="py-3">{t({ bn: "তারিখ", en: "Date" })}</th><th>{t({ bn: "প্রজেক্ট", en: "Project" })}</th><th>{t({ bn: "পরিমাণ", en: "Amount" })}</th><th>{t({ bn: "স্ট্যাটাস", en: "Status" })}</th></tr></thead><tbody>{[["০১ নভেম্বর ২০২৬","Solar Power Plant","৳8,500","Paid"],["০১ সেপ্টেম্বর ২০২৬","Sea View Hotel","৳12,400","Paid"]].map((r) => <tr key={r[0]} className="border-b border-slate-100"><td className="py-4 text-slate-500">{r[0]}</td><td className="font-medium">{r[1]}</td><td className="font-bold text-emerald-700">{r[2]}</td><td><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">Paid</span></td></tr>)}</tbody></table></div></div><aside className={card}><p className="text-sm text-slate-500">{t({ bn: "উপলব্ধ ব্যালেন্স", en: "Available balance" })}</p><p className="mt-2 text-3xl font-bold text-slate-900">{taka(42000)}</p><button className="mt-5 w-full rounded-2xl bg-ink-950 py-3 text-sm font-semibold text-white">{t({ bn: "উইথড্রয়াল অনুরোধ", en: "Request withdrawal" })}</button></aside></div>
      )}

      {feature === "payments" && (
        <div className="grid gap-5 lg:grid-cols-[360px_1fr]"><div className={card}><h2 className="font-bold text-slate-900">{t({ bn: "নতুন পেমেন্ট", en: "Make a payment" })}</h2><div className="mt-4 grid grid-cols-2 gap-2">{[{ id:"bkash",n:"bKash"},{id:"nagad",n:"Nagad"},{id:"bank",n:t({bn:"ব্যাংক",en:"Bank"})},{id:"installment",n:t({bn:"কিস্তি",en:"Installment"})}].map((m)=><button key={m.id} type="button" onClick={()=>setPaymentMethod(m.id)} className={`rounded-2xl border px-3 py-4 text-sm font-semibold ${paymentMethod===m.id?"border-emerald-400 bg-emerald-50 text-emerald-700":"border-slate-200 text-slate-600"}`}>{m.n}</button>)}</div><form onSubmit={submit} className="mt-4 space-y-3"><input required className={input} placeholder={t({bn:"লেনদেন নম্বর",en:"Transaction number"})}/><input required type="number" min="1" className={input} placeholder={t({bn:"পরিমাণ",en:"Amount"})}/><button className="w-full rounded-2xl bg-ink-950 py-3 text-sm font-semibold text-white">{saved?t({bn:"পেমেন্ট সাবমিট হয়েছে",en:"Payment submitted"}):t({bn:"পেমেন্ট নিশ্চিত করুন",en:"Confirm payment"})}</button></form></div><div className={card}><h2 className="font-bold text-slate-900">{t({bn:"পেমেন্ট ইতিহাস",en:"Payment history"})}</h2><div className="mt-4 space-y-3">{[["INV-2026-1042","Sea View Hotel","৳125,000","Paid"],["INV-2026-0981","Solar Power Plant","৳220,000","Paid"],["INV-2026-1120","Lakeview Plaza","৳75,000","Pending"]].map((r)=><div key={r[0]} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 p-4"><div><p className="font-semibold text-slate-800">{r[0]}</p><p className="text-xs text-slate-400">{r[1]}</p></div><strong>{r[2]}</strong><span className={`rounded-full px-2.5 py-1 text-xs ${r[3]==="Paid"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{r[3]}</span></div>)}</div></div></div>
      )}

      {(feature === "reports" || feature === "notifications") && (feature === "reports" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{["Investment statement","Payment statement","Transaction history","Invoice preview","Receipt download","Investment documents"].map((name)=><div key={name} className={card}><ReceiptText className="h-6 w-6 text-emerald-500"/><h2 className="mt-4 font-bold text-slate-900">{name}</h2><button className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700"><Download className="h-4 w-4"/>{t({bn:"ডাউনলোড / প্রিভিউ",en:"Download / preview"})}</button></div>)}</div>
      ) : (
        <div className={card}><div className="space-y-2">{[
          {c:"bg-emerald-500",bn:"নতুন ডিভিডেন্ড জমা হয়েছে।",en:"A new dividend has been credited.",time:"২ মিনিট আগে"},
          {c:"bg-sky-500",bn:"Solar Power Plant-এ নতুন আপডেট আছে।",en:"There is a new Solar Power Plant update.",time:"১ ঘণ্টা আগে"},
          {c:"bg-amber-500",bn:"আগামীকাল একটি কিস্তি পেমেন্ট বকেয়া।",en:"An instalment payment is due tomorrow.",time:"গতকাল"},
        ].map((n)=><button key={n.en} className="flex w-full items-start gap-3 rounded-2xl border border-slate-100 px-4 py-4 text-left hover:bg-slate-50"><span className={`mt-1.5 h-2 w-2 rounded-full ${n.c}`}/><span className="flex-1"><span className="block text-sm text-slate-700">{t({bn:n.bn,en:n.en})}</span><span className="mt-1 block text-xs text-slate-400">{n.time}</span></span><Bell className="h-4 w-4 text-slate-300"/></button>)}</div></div>
      ))}
    </div>
  );
}
