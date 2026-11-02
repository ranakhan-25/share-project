"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { PageHero } from "@/components/site/sections/PageHero";
import type { OwnerProject } from "@/lib/owner-projects";
import type { InvestorProject } from "@/data/investorProjects";

export default function ProjectsPage() {
  const { t, taka, num } = useLang();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("featured");
  const [ownerPublished, setOwnerPublished] = useState<OwnerProject[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 6;

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
    setLoading(true);
    fetch(`${API_BASE}/realbizpro/api/v1/share-project/public/projects?page=${currentPage}&limit=${pageSize}`)
      .then((res) => res.ok ? res.json() : null)
      .then((payload: unknown) => {
        const root = payload && typeof payload === "object" ? payload as { data?: unknown } : {};
        const inner = root.data && typeof root.data === "object" ? root.data as { data?: unknown; meta?: { total?: number; page?: number; totalPages?: number } } : {};
        const data = Array.isArray(root.data) ? root.data : Array.isArray(inner.data) ? inner.data : [];
        const meta = inner.meta;
        const rows = (data as Record<string, unknown>[]).map((project) => ({
          id: String(project.uuid || project.id || ""),
          name: String(project.name || ""),
          location: String(project.location || ""),
          category: String((project.category as { name?: string } | undefined)?.name || ""),
          thumbnail: String(project.thumbnailUrl || ""),
          pricePerShare: Number(project.pricePerShare || 0),
          totalShares: Number(project.totalShares || 0),
          expectedAnnualReturn: Number(project.expectedAnnualReturn || 0),
          startDate: String(project.startDate || ""),
          endDate: String(project.endDate || ""),
          description: String(project.description || ""),
          documents: Array.isArray(project.documents) ? project.documents.map((document) => String((document as { title?: string }).title || "")) : [],
          status: "published",
        })) as OwnerProject[];
        setOwnerPublished(rows);
        setTotalProjects(Number(meta?.total || rows.length));
        setTotalPages(Math.max(1, Number(meta?.totalPages || Math.ceil(Number(meta?.total || rows.length) / pageSize))));
      })
      .catch(() => {
        setOwnerPublished([]);
        setTotalProjects(0);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  }, [currentPage]);

  const publishedProjects: InvestorProject[] = useMemo(
    () => ownerPublished.map((project) => ({
      id: project.id,
      name: { bn: project.name, en: project.name },
      location: { bn: project.location, en: project.location },
      category: { bn: project.category, en: project.category },
      status: "funding",
      image: project.thumbnail || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85",
      pricePerShare: project.pricePerShare,
      totalShares: project.totalShares,
      soldShares: 0,
      returnRate: project.expectedAnnualReturn,
      duration: {
        bn: project.startDate && project.endDate ? `${project.startDate} - ${project.endDate}` : "উল্লেখ নেই",
        en: project.startDate && project.endDate ? `${project.startDate} - ${project.endDate}` : "Not specified",
      },
      description: { bn: project.description, en: project.description },
      documents: project.documents,
    })),
    [ownerPublished],
  );

  const visibleProjects = useMemo(
    () => publishedProjects,
    [publishedProjects],
  );

  const categories = useMemo(() => ["all", ...Array.from(new Set(visibleProjects.map((p) => p.category.en)))], [visibleProjects]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = visibleProjects.filter((p) => {
      const search = `${t(p.name)} ${t(p.location)} ${t(p.category)}`.toLowerCase();
      return (!q || search.includes(q)) && (category === "all" || p.category.en === category);
    });
    if (sort === "price-low") rows.sort((a, b) => a.pricePerShare - b.pricePerShare);
    if (sort === "return-high") rows.sort((a, b) => b.returnRate - a.returnRate);
    if (sort === "availability") rows.sort((a, b) => (b.totalShares - b.soldShares) - (a.totalShares - a.soldShares));
    return rows;
  }, [category, query, sort, t, visibleProjects]);

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
            {loading && (
              <div className="col-span-full rounded-[28px] border border-dashed border-slate-300 bg-white py-16 text-center">
                <p className="font-bold text-slate-700">{t({ bn: "প্রজেক্ট লোড হচ্ছে...", en: "Loading projects..." })}</p>
              </div>
            )}
            {!loading && filtered.map((project) => {
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
          {!loading && totalPages > 1 && (
            <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row">
              <p className="text-sm text-slate-500">
                {t({ bn: `মোট ${totalProjects}টি প্রজেক্ট • পৃষ্ঠা ${currentPage}/${totalPages}`, en: `${totalProjects} projects • Page ${currentPage} of ${totalPages}` })}
              </p>
              <nav className="flex items-center gap-2" aria-label={t({ bn: "প্রজেক্ট পেজিনেশন", en: "Project pagination" })}>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1 || loading}
                  className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t({ bn: "আগে", en: "Previous" })}
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    disabled={loading}
                    aria-current={page === currentPage ? "page" : undefined}
                    className={`h-10 min-w-10 rounded-xl px-3 text-sm font-semibold transition ${
                      page === currentPage
                        ? "bg-ink-950 text-white"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t({ bn: "পরবর্তী", en: "Next" })}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            </div>
          )}
          {!loading && filtered.length === 0 && <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white py-16 text-center"><p className="font-bold text-slate-700">{t({ bn: "কোনো প্রজেক্ট পাওয়া যায়নি", en: "No projects found" })}</p><button onClick={() => { setQuery(""); setCategory("all"); }} className="mt-4 text-sm font-semibold text-emerald-600">{t({ bn: "ফিল্টার সরান", en: "Clear filters" })}</button></div>}
        </div>
      </section>
    </>
  );
}
