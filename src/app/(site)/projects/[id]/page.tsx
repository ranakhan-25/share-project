"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Download, FileText, MapPin, Minus, Plus } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { getPublicProject, prepareShareProjectInvestment } from "@/lib/share-project-api";
import type { InvestorProject } from "@/data/investorProjects";

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t, taka, num } = useLang();
  const [project, setProject] = useState<InvestorProject | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [investmentError, setInvestmentError] = useState("");
  const available = project ? project.totalShares - project.soldShares : 0;
  const total = project ? project.pricePerShare * quantity : 0;
  const fee = Math.round(total * 0.01);
  useEffect(() => {
    void getPublicProject(params.id).then((row) => {
      setProject({
        id: row.uuid,
        name: { bn: row.name, en: row.name },
        location: { bn: row.location || "", en: row.location || "" },
        category: { bn: row.category?.name || "", en: row.category?.name || "" },
        status: "funding",
        image: row.thumbnailUrl || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85",
        pricePerShare: Number(row.pricePerShare),
        totalShares: Number(row.totalShares),
        soldShares: 0,
        returnRate: Number(row.expectedAnnualReturn || 0),
        duration: { bn: row.startDate && row.endDate ? `${row.startDate} - ${row.endDate}` : "", en: row.startDate && row.endDate ? `${row.startDate} - ${row.endDate}` : "" },
        description: { bn: row.description, en: row.description },
        documents: (row.documents || []).map((document) => document.title || document.url),
      });
    }).catch(() => setProject(null));
  }, [params.id]);
  const percent = useMemo(() => project && project.totalShares ? Math.round((project.soldShares / project.totalShares) * 100) : 0, [project]);
  if (!project) return <main className="min-h-[60vh] pt-28 text-center text-sm text-slate-500">Loading project...</main>;

  return (
    <main className="bg-slate-50 pb-20 pt-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <button onClick={() => router.back()} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />{t({ bn: "পেছনে", en: "Back" })}</button>
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="relative h-[280px] sm:h-[420px]"><Image src={project.image} alt={t(project.name)} fill sizes="100vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent" /><div className="absolute bottom-0 left-0 p-6 text-white sm:p-10"><span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-emerald-700">{t(project.category)}</span><h1 className="mt-4 text-3xl font-bold sm:text-5xl">{t(project.name)}</h1><p className="mt-2 flex items-center gap-1.5 text-sm text-white/80"><MapPin className="h-4 w-4" />{t(project.location)}</p></div></div>
          <div className="grid gap-8 p-6 lg:grid-cols-[1fr_380px] sm:p-10">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{t({ bn: "প্রজেক্ট পরিচিতি", en: "Project overview" })}</h2><p className="mt-3 max-w-3xl leading-relaxed text-slate-600">{t(project.description)}</p>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">{[{ l: { bn: "শেয়ার মূল্য", en: "Share price" }, v: taka(project.pricePerShare) }, { l: { bn: "প্রত্যাশিত রিটার্ন", en: "Expected return" }, v: `${num(project.returnRate)}%` }, { l: { bn: "মেয়াদ", en: "Duration" }, v: t(project.duration) }, { l: { bn: "উপলব্ধ শেয়ার", en: "Available shares" }, v: num(available) }].map((x) => <div key={x.l.en} className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">{t(x.l)}</p><p className="mt-2 font-bold text-slate-900">{x.v}</p></div>)}</div>
              <h3 className="mt-8 text-lg font-bold text-slate-900">{t({ bn: "প্রজেক্ট ডকুমেন্ট", en: "Project documents" })}</h3>
              <div className="mt-3 space-y-2">{project.documents.map((document) => <div key={document} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"><span className="flex items-center gap-2 text-sm font-medium text-slate-700"><FileText className="h-4 w-4 text-emerald-500" />{document}</span><button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Download"><Download className="h-4 w-4" /></button></div>)}</div>
            </div>
            <aside className="h-fit rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex justify-between text-xs"><span className="text-slate-500">{t({ bn: "শেয়ার বিক্রয়", en: "Shares sold" })}</span><span className="font-bold">{percent}%</span></div><div className="mt-2 h-2 rounded-full bg-white"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-500" style={{ width: `${percent}%` }} /></div>
              <label className="mt-6 block text-sm font-semibold text-slate-700">{t({ bn: "শেয়ার পরিমাণ", en: "Share quantity" })}</label>
              <div className="mt-2 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-2"><button type="button" onClick={() => setQuantity((v) => Math.max(1, v - 1))} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100"><Minus className="h-4 w-4" /></button><strong className="text-lg">{num(quantity)}</strong><button type="button" onClick={() => setQuantity((v) => Math.min(available, v + 1))} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100"><Plus className="h-4 w-4" /></button></div>
              <div className="mt-5 space-y-3 border-t border-slate-200 pt-4 text-sm"><div className="flex justify-between text-slate-500"><span>{t({ bn: "শেয়ার মূল্য", en: "Share value" })}</span><span>{taka(total)}</span></div><div className="flex justify-between text-slate-500"><span>{t({ bn: "সেবা ফি", en: "Service fee" })}</span><span>{taka(fee)}</span></div><div className="flex justify-between border-t border-slate-200 pt-3 font-bold text-slate-900"><span>{t({ bn: "সর্বমোট", en: "Total" })}</span><span>{taka(total + fee)}</span></div></div>
              {investmentError && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{investmentError}</div>}
              {confirmed ? <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-center text-sm font-semibold text-emerald-700"><CheckCircle2 className="mx-auto mb-2 h-6 w-6" />{t({ bn: "বিনিয়োগ সফলভাবে নিশ্চিত হয়েছে", en: "Investment confirmed successfully" })}</div> : <button onClick={async () => { setInvestmentError(""); try { await prepareShareProjectInvestment(params.id, quantity); setConfirmed(true); } catch (cause) { setInvestmentError(cause instanceof Error ? cause.message : "Could not prepare investment."); } }} className="mt-5 w-full rounded-2xl bg-ink-950 px-5 py-3.5 text-sm font-semibold text-white hover:bg-ink-800">{t({ bn: "বিনিয়োগ নিশ্চিত করুন", en: "Confirm investment" })}</button>}
              <Link href="/dashboard/payments" className="mt-3 block text-center text-xs font-semibold text-emerald-600">{t({ bn: "পেমেন্ট পদ্ধতি দেখুন", en: "View payment methods" })}</Link>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
