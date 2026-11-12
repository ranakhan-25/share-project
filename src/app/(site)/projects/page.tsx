"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Building2,
  Coins,
  FileCheck2,
  MapPin,
  PlusCircle,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from "lucide-react";
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
    const API_BASE =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
    setLoading(true);
    fetch(
      `${API_BASE}/realbizpro/api/v1/share-project/public/projects?page=${currentPage}&limit=${pageSize}`,
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: unknown) => {
        const root =
          payload && typeof payload === "object"
            ? (payload as { data?: unknown })
            : {};
        const inner =
          root.data && typeof root.data === "object"
            ? (root.data as {
                data?: unknown;
                meta?: { total?: number; page?: number; totalPages?: number };
              })
            : {};
        const data = Array.isArray(root.data)
          ? root.data
          : Array.isArray(inner.data)
            ? inner.data
            : [];
        const meta = inner.meta;
        const rows = (data as Record<string, unknown>[]).map((project) => ({
          id: String(project.uuid || project.id || ""),
          name: String(project.name || ""),
          location: String(project.location || ""),
          category: String(
            (project.category as { name?: string } | undefined)?.name || "",
          ),
          thumbnail: String(project.thumbnailUrl || ""),
          pricePerShare: Number(project.pricePerShare || 0),
          totalShares: Number(project.totalShares || 0),
          expectedAnnualReturn: Number(project.expectedAnnualReturn || 0),
          startDate: String(project.startDate || ""),
          endDate: String(project.endDate || ""),
          description: String(project.description || ""),
          documents: Array.isArray(project.documents)
            ? project.documents.map((document) =>
                String((document as { title?: string }).title || ""),
              )
            : [],
          status: "published",
        })) as OwnerProject[];
        setOwnerPublished(rows);
        setTotalProjects(Number(meta?.total || rows.length));
        setTotalPages(
          Math.max(
            1,
            Number(
              meta?.totalPages ||
                Math.ceil(Number(meta?.total || rows.length) / pageSize),
            ),
          ),
        );
      })
      .catch(() => {
        setOwnerPublished([]);
        setTotalProjects(0);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  }, [currentPage]);

  const publishedProjects: InvestorProject[] = useMemo(
    () =>
      ownerPublished.map((project) => ({
        id: project.id,
        name: { bn: project.name, en: project.name },
        location: { bn: project.location, en: project.location },
        category: { bn: project.category, en: project.category },
        status: "funding",
        image:
          project.thumbnail ||
          "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85",
        pricePerShare: project.pricePerShare,
        totalShares: project.totalShares,
        soldShares: 0,
        returnRate: project.expectedAnnualReturn,
        duration: {
          bn:
            project.startDate && project.endDate
              ? `${project.startDate.slice(0, 10)} - ${project.endDate.slice(0, 10)}`
              : "উল্লেখ নেই",
          en:
            project.startDate && project.endDate
              ? `${project.startDate.slice(0, 10)} - ${project.endDate.slice(0, 10)}`
              : "Not specified",
        },
        description: { bn: project.description, en: project.description },
        documents: project.documents,
      })),
    [ownerPublished],
  );

  const visibleProjects = useMemo(() => publishedProjects, [publishedProjects]);

  const categories = useMemo(
    () => [
      "all",
      ...Array.from(new Set(visibleProjects.map((p) => p.category.en))),
    ],
    [visibleProjects],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = visibleProjects.filter((p) => {
      const search =
        `${t(p.name)} ${t(p.location)} ${t(p.category)}`.toLowerCase();
      return (
        (!q || search.includes(q)) &&
        (category === "all" || p.category.en === category)
      );
    });
    if (sort === "price-low")
      rows.sort((a, b) => a.pricePerShare - b.pricePerShare);
    if (sort === "return-high")
      rows.sort((a, b) => b.returnRate - a.returnRate);
    if (sort === "availability")
      rows.sort(
        (a, b) => b.totalShares - b.soldShares - (a.totalShares - a.soldShares),
      );
    return rows;
  }, [category, query, sort, t, visibleProjects]);

  return (
    <>
      {/* ───────────────── HERO BANNER ───────────────── */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-white via-slate-50/60 to-emerald-50/40 pt-28 pb-14 lg:pt-32 lg:pb-16 border-b border-slate-200/80">
        <div className="bg-grid absolute inset-0 -z-10 opacity-[0.1]" />
        <div className="pointer-events-none absolute -top-24 -left-24 -z-10 h-96 w-96 rounded-full bg-emerald-400/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 right-0 -z-10 h-96 w-96 rounded-full bg-sky-400/10 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-10">
            {/* Left Side: Content & CTA */}
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-3.5 py-1.5 text-xs font-bold text-emerald-800 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                {t({
                  bn: "১০০% যাচাইকৃত বাণিজ্যিক প্রজেক্ট",
                  en: "100% Vetted Commercial Projects",
                })}
              </div>

              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl leading-[1.18]">
                {t({
                  bn: "সেরা বাণিজ্যিক প্রজেক্টে ",
                  en: "Invest in Verified ",
                })}
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 bg-clip-text text-transparent">
                  {t({
                    bn: "নিরাপদে বিনিয়োগ করুন",
                    en: "Commercial Assets",
                  })}
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
                {t({
                  bn: "প্রতিটি প্রজেক্ট আইনি অডিট ও আর্থিক যাচাইয়ের পর লাইভ করা হয়। স্বচ্ছ হিসাব ও নিয়মিত রিটার্নের মাধ্যমে সহজেই যৌথ মালিকানায় যুক্ত হোন।",
                  en: "Every project is legally audited and financially vetted before going live. Co-own commercial assets with transparent reporting and steady returns.",
                })}
              </p>

              {/* Compact, Readable Highlights */}
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 max-w-xl">
                {[
                  {
                    icon: ShieldCheck,
                    text: { bn: "আইনি চুক্তি ও সুরক্ষা", en: "Legally Backed Deeds" },
                  },
                  {
                    icon: TrendingUp,
                    text: { bn: "নিয়মিত ভাড়া ও লভ্যাংশ", en: "Predictable Rental Yields" },
                  },
                  {
                    icon: Coins,
                    text: { bn: "স্বল্প পুঁজিতে শেয়ার মালিকানা", en: "Low-Entry Fractional Shares" },
                  },
                  {
                    icon: FileCheck2,
                    text: { bn: "অডিটকৃত আর্থিক রিপোর্ট", en: "Audited Financial Reports" },
                  },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white/80 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-700 shadow-xs"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{t(item.text)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Submit Project CTA below Left Content */}
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link
                  href="/projects/create"
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-600 hover:scale-[1.01] active:scale-95"
                >
                  <PlusCircle className="h-4 w-4" />
                  {t({ bn: "সাবমিট প্রজেক্ট", en: "Submit a Project" })}
                </Link>
              </div>
            </div>

            {/* Right Side: Banner Image */}
            <div className="lg:col-span-6">
              <div className="relative h-[340px] sm:h-[420px] lg:h-[460px] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-lg">
                <Image
                  src="/image/images1.jpg"
                  alt={t({ bn: "বাণিজ্যিক প্রজেক্ট ব্যানার", en: "Commercial Projects Banner" })}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />

                {/* Subtle bottom summary overlay */}
                <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-md backdrop-blur-md">
                  <div className="grid grid-cols-3 divide-x divide-slate-200 text-center">
                    <div>
                      <p className="text-base font-extrabold text-slate-900">
                        {loading ? "..." : totalProjects > 0 ? `${totalProjects}+` : "10+"}
                      </p>
                      <p className="text-[11px] font-medium text-slate-500">
                        {t({ bn: "লাইভ প্রজেক্ট", en: "Live Projects" })}
                      </p>
                    </div>
                    <div>
                      <p className="text-base font-extrabold text-emerald-600">১৫–২৫%</p>
                      <p className="text-[11px] font-medium text-slate-500">
                        {t({ bn: "বার্ষিক রিটার্ন", en: "Annual ROI" })}
                      </p>
                    </div>
                    <div>
                      <p className="text-base font-extrabold text-slate-900">১০০%</p>
                      <p className="text-[11px] font-medium text-slate-500">
                        {t({ bn: "যাচাইকৃত", en: "Audited" })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-slate-50 pt-7 pb-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          {/* Header Title & Showing Count above Search */}
          <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {/* <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-900 mb-1.5">
                <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                {t({ bn: "সক্রিয় বাণিজ্যিক প্রকল্পসমূহ", en: "Active Commercial Projects" })}
              </div> */}
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {t({ bn: "উপলব্ধ সকল প্রজেক্ট তালিকা", en: "All Available Projects" })}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {t({
                  bn: "আপনার পছন্দ অনুযায়ী ফিল্টার করে লাভজনক প্রজেক্ট বেছে নিন এবং সরাসরি শেয়ার ক্রয় করুন।",
                  en: "Filter by category or location to discover high-yield commercial assets and invest instantly.",
                })}
              </p>
            </div>

            {/* Total / Showing Count Badge */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 shadow-xs text-xs font-semibold text-slate-700 w-fit shrink-0">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {t({
                  bn: `মোট ${num(totalProjects || filtered.length)} টির মধ্যে ${num(filtered.length)} টি প্রদর্শিত হচ্ছে`,
                  en: `Showing ${filtered.length} of ${totalProjects || filtered.length} projects`,
                })}
              </span>
            </div>
          </div>

          {/* Compact Filter Bar */}
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xs sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t({
                  bn: "প্রজেক্ট বা স্থান খুঁজুন...",
                  en: "Search project or location...",
                })}
                className="h-10 w-full rounded-xl border border-transparent bg-slate-50 pl-10 pr-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
              <div className="relative min-w-[150px] sm:min-w-[180px]">
                <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 text-xs sm:text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-100/70 focus:border-emerald-500 focus:bg-white"
                >
                  <option value="all">
                    {t({ bn: "সব ক্যাটাগরি", en: "All categories" })}
                  </option>
                  {categories.slice(1).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <ChevronRight className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-slate-400" />
              </div>

              <div className="relative min-w-[140px] sm:min-w-[170px]">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-3.5 pr-8 text-xs sm:text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-100/70 focus:border-emerald-500 focus:bg-white"
                >
                  <option value="featured">
                    {t({ bn: "ফিচার্ড", en: "Featured" })}
                  </option>
                  <option value="price-low">
                    {t({ bn: "কম শেয়ার মূল্য", en: "Lowest share price" })}
                  </option>
                  <option value="return-high">
                    {t({ bn: "বেশি সম্ভাব্য রিটার্ন", en: "Highest return" })}
                  </option>
                  <option value="availability">
                    {t({ bn: "বেশি উপলব্ধ শেয়ার", en: "Most available shares" })}
                  </option>
                </select>
                <ChevronRight className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {loading && (
              <div className="col-span-full rounded-[28px] border border-dashed border-slate-300 bg-white py-16 text-center">
                <p className="font-bold text-slate-700">
                  {t({
                    bn: "প্রজেক্ট লোড হচ্ছে...",
                    en: "Loading projects...",
                  })}
                </p>
              </div>
            )}
            {!loading &&
              filtered.map((project) => {
                const percent = Math.round(
                  (project.soldShares / project.totalShares) * 100,
                );
                return (
                  <article
                    key={project.id}
                    className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative h-52">
                      <Image
                        src={project.image}
                        alt={t(project.name)}
                        fill
                        sizes="(max-width:768px) 100vw, (max-width:1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {t(project.category)}
                      </span>
                    </div>
                    <div className="p-6">
                      <p className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {t(project.location)}
                      </p>
                      <h2 className="mt-2 text-xl font-bold text-slate-900">
                        {t(project.name)}
                      </h2>
                      <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 text-center">
                        <div>
                          <p className="text-[11px] text-slate-400">
                            {t({ bn: "শেয়ার মূল্য", en: "Share price" })}
                          </p>
                          <p className="mt-1 font-bold text-slate-900">
                            {taka(project.pricePerShare, true)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-400">
                            {t({ bn: "রিটার্ন", en: "Return" })}
                          </p>
                          <p className="mt-1 font-bold text-emerald-600">
                            {num(project.returnRate)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-400">
                            {t({ bn: "মেয়াদ", en: "Duration" })}
                          </p>
                          <p className="mt-1 font-bold text-slate-900">
                            {t(project.duration).split(" - ")[0]}
                          </p>
                        </div>
                      </div>
                      <div className="mt-5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">
                            {t({ bn: "বিক্রিত", en: "Sold" })}
                          </span>
                          <span className="font-bold text-slate-700">
                            {percent}%
                          </span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                      <Link
                        href={`/projects/${project.id}`}
                        className="mt-5 flex items-center justify-between rounded-2xl bg-ink-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
                      >
                        {t({ bn: "বিস্তারিত দেখুন", en: "View details" })}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                );
              })}
          </div>
          {!loading && totalPages > 1 && (
            <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row">
              <p className="text-sm text-slate-500">
                {t({
                  bn: `মোট ${totalProjects}টি প্রজেক্ট • পৃষ্ঠা ${currentPage}/${totalPages}`,
                  en: `${totalProjects} projects • Page ${currentPage} of ${totalPages}`,
                })}
              </p>
              <nav
                className="flex items-center gap-2"
                aria-label={t({
                  bn: "প্রজেক্ট পেজিনেশন",
                  en: "Project pagination",
                })}
              >
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage === 1 || loading}
                  className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t({ bn: "আগে", en: "Previous" })}
                </button>
                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1,
                ).map((page) => (
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
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages || loading}
                  className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t({ bn: "পরবর্তী", en: "Next" })}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white py-16 text-center">
              <p className="font-bold text-slate-700">
                {t({
                  bn: "কোনো প্রজেক্ট পাওয়া যায়নি",
                  en: "No projects found",
                })}
              </p>
              <button
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                }}
                className="mt-4 text-sm font-semibold text-emerald-600"
              >
                {t({ bn: "ফিল্টার সরান", en: "Clear filters" })}
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
