"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowRight, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { investorProjects } from "@/data/investorProjects";
import { PageHero } from "@/components/site/sections/PageHero";

export default function ProjectsPage() {
  const { t, taka, num } = useLang();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("featured");

  const categories = useMemo(() => ["all", ...Array.from(new Set(investorProjects.map((p) => p.category.en)))], []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = investorProjects.filter((p) => {
      const search = `${t(p.name)} ${t(p.location)} ${t(p.category)}`.toLowerCase();
      return (!q || search.includes(q)) && (category === "all" || p.category.en === category);
    });
    if (sort === "price-low") rows.sort((a, b) => a.pricePerShare - b.pricePerShare);
    if (sort === "return-high") rows.sort((a, b) => b.returnRate - a.returnRate);
    if (sort === "availability") rows.sort((a, b) => (b.totalShares - b.soldShares) - (a.totalShares - a.soldShares));
    return rows;
  }, [category, query, sort, t]);

  return (
    <>
      <PageHero variant="features" eyebrow={{ bn: "শেয়ার প্রজেক্ট", en: "Share projects" }} title={{ bn: "প্রজেক্ট খুঁজুন ও", en: "Find and" }} highlight={{ bn: "বিনিয়োগ করুন", en: "invest in projects" }} subtitle={{ bn: "স্বচ্ছ তথ্য, স্পষ্ট ঝুঁকি এবং প্রজেক্টভিত্তিক রিটার্ন বিশ্লেষণ।", en: "Clear information, transparent risks and project-based return analysis." }} />
      <section className="bg-slate-50 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_220px]">
            <label className="relative"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t({ bn: "প্রজেক্ট বা স্থান খুঁজুন...", en: "Search project or location..." })} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-emerald-500" /></label>
            <label className="relative"><SlidersHorizontal className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><select value={category} onChange={(e) => setCategory(e.target.value)} className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-11 text-sm outline-none"><option value="all">{t({ bn: "সব ক্যাটাগরি", en: "All categories" })}</option>{categories.slice(1).map((c) => <option key={c}>{c}</option>)}</select></label>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none"><option value="featured">{t({ bn: "ফিচার্ড", en: "Featured" })}</option><option value="price-low">{t({ bn: "কম শেয়ার মূল্য", en: "Lowest share price" })}</option><option value="return-high">{t({ bn: "বেশি সম্ভাব্য রিটার্ন", en: "Highest return" })}</option><option value="availability">{t({ bn: "বেশি উপলব্ধ শেয়ার", en: "Most available shares" })}</option></select>
          </div>

          <div className="mt-8 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => {
              const percent = Math.round((project.soldShares / project.totalShares) * 100);
              return (
                <article key={project.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative h-52"><Image src={project.image} alt={t(project.name)} fill sizes="(max-width:768px) 100vw, (max-width:1024px) 50vw, 33vw" className="object-cover" /><span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700">{t(project.category)}</span></div>
                  <div className="p-6">
                    <p className="flex items-center gap-1.5 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" />{t(project.location)}</p>
                    <h2 className="mt-2 text-xl font-bold text-slate-900">{t(project.name)}</h2>
                    <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 text-center"><div><p className="text-[11px] text-slate-400">{t({ bn: "শেয়ার মূল্য", en: "Share price" })}</p><p className="mt-1 font-bold text-slate-900">{taka(project.pricePerShare, true)}</p></div><div><p className="text-[11px] text-slate-400">{t({ bn: "রিটার্ন", en: "Return" })}</p><p className="mt-1 font-bold text-emerald-600">{num(project.returnRate)}%</p></div><div><p className="text-[11px] text-slate-400">{t({ bn: "মেয়াদ", en: "Duration" })}</p><p className="mt-1 font-bold text-slate-900">{t(project.duration)}</p></div></div>
                    <div className="mt-5"><div className="flex justify-between text-xs"><span className="text-slate-500">{t({ bn: "বিক্রিত", en: "Sold" })}</span><span className="font-bold text-slate-700">{percent}%</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-500" style={{ width: `${percent}%` }} /></div></div>
                    <Link href={`/projects/${project.id}`} className="mt-5 flex items-center justify-between rounded-2xl bg-ink-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-ink-800">{t({ bn: "বিস্তারিত দেখুন", en: "View details" })}<ArrowRight className="h-4 w-4" /></Link>
                  </div>
                </article>
              );
            })}
          </div>
          {filtered.length === 0 && <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white py-16 text-center"><p className="font-bold text-slate-700">{t({ bn: "কোনো প্রজেক্ট পাওয়া যায়নি", en: "No projects found" })}</p><button onClick={() => { setQuery(""); setCategory("all"); }} className="mt-4 text-sm font-semibold text-emerald-600">{t({ bn: "ফিল্টার সরান", en: "Clear filters" })}</button></div>}
        </div>
      </section>
    </>
  );
}
