"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImagePlus, Upload, ShieldCheck, Info, FileText, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { useLang } from "@/lib/i18n";
import { createPublicShareProject, getPublicCategories, getPublicLocations, LocationDivision } from "@/lib/share-project-api";
import { BANGLADESH_DIVISIONS_DATA } from "@/lib/locations-data";

export default function CreatePublicProjectPage() {
  const { t } = useLang();
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [divisions, setDivisions] = useState<LocationDivision[]>(BANGLADESH_DIVISIONS_DATA);
  const [loadingLocations, setLoadingLocations] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", categoryId: 0, description: "", location: "", totalInvestmentAmount: 0,
    totalShares: 0, pricePerShare: 0, minimumInvestment: 0, expectedAnnualReturn: 0,
    startDate: "", endDate: "", creatorName: "", creatorEmail: "", creatorPhone: "",
    companyName: "",
  });
  const [images, setImages] = useState<Array<{ url: string; title: string }>>([]);
  const [documents, setDocuments] = useState<Array<{ url: string; title: string }>>([]);

  useEffect(() => {
    void getPublicCategories()
      .then((rows) => setCategories(rows.map((row) => ({ id: row.id, name: row.name }))))
      .catch(() => setCategories([]));

    setLoadingLocations(true);
    void getPublicLocations()
      .then((res: any) => {
        const list = res?.divisions || res?.data?.divisions || (Array.isArray(res) ? res : []);
        if (list && list.length > 0) {
          setDivisions(list);
        }
      })
      .catch((err) => {
        console.warn("Locations API fallback used:", err);
      })
      .finally(() => {
        setLoadingLocations(false);
      });
  }, []);

  const allDistricts = divisions.flatMap((d) => d.districts);

  const readFiles = (files: FileList | null, kind: "image" | "document") => {
    if (!files?.length) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const asset = { url: String(reader.result || ""), title: file.name };
        if (kind === "image") setImages((current) => [...current, asset]);
        else setDocuments((current) => [...current, asset]);
      };
      reader.readAsDataURL(file);
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.categoryId || !form.description || !form.location || !form.creatorName || !form.creatorEmail || !form.creatorPhone) {
      toast.error(t({ bn: "সবগুলো প্রয়োজনীয় ফিল্ড পূরণ করুন", en: "Please fill in all required fields" }));
      return;
    }
    if (form.totalShares <= 0 || form.pricePerShare <= 0 || form.totalInvestmentAmount <= 0) {
      toast.error(t({ bn: "সঠিক বিনিয়োগ ও শেয়ার সংখ্যা প্রদান করুন", en: "Please provide valid investment and share details" }));
      return;
    }
    setSaving(true);
    try {
      await createPublicShareProject({ ...form, images, documents });
      setSubmitted(true);
      toast.success(t({ bn: "প্রজেক্ট সাবমিট হয়েছে ও অনুমোদনের অপেক্ষায় রয়েছে", en: "Project submitted and is pending Super Admin review" }));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t({ bn: "প্রজেক্ট তৈরি করা যায়নি", en: "Could not create project" }));
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20";
  const labelStyle = "block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide";

  if (submitted) {
    return (
      <main className="bg-slate-50 pb-20 pt-28 min-h-[70vh] flex items-center">
        <div className="mx-auto max-w-xl px-5 text-center">
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {t({ bn: "প্রজেক্ট সফলভাবে জমা হয়েছে!", en: "Project Submitted Successfully!" })}
            </h1>
            <p className="text-sm text-slate-600 mb-6">
              {t({
                bn: "আপনার প্রজেক্টটি সুপার অ্যাডমিন রিভিউ করবেন। অনুমোদিত হলে এটি পাবলিক প্রজেক্ট তালিকায় দৃশ্যমান হবে।",
                en: "Your project has been submitted for Super Admin review. Once approved, it will be published to the public portal."
              })}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/projects"
                className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                {t({ bn: "অন্যান্য প্রজেক্ট দেখুন", en: "Browse Projects" })}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setForm({
                    name: "", categoryId: 0, description: "", location: "", totalInvestmentAmount: 0,
                    totalShares: 0, pricePerShare: 0, minimumInvestment: 0, expectedAnnualReturn: 0,
                    startDate: "", endDate: "", creatorName: "", creatorEmail: "", creatorPhone: "",
                    companyName: "",
                  });
                  setImages([]);
                  setDocuments([]);
                }}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                {t({ bn: "আরেকটি প্রজেক্ট তৈরি করুন", en: "Create Another Project" })}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-slate-50 pb-20 pt-28">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <Link href="/projects" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition">
          <ArrowLeft className="h-4 w-4" />
          {t({ bn: "সকল প্রজেক্টে ফিরে যান", en: "Back to projects" })}
        </Link>

        <form onSubmit={submit} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="border-b border-slate-100 pb-6 mb-8">
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="h-4 w-4" />
              {t({ bn: "পাবলিক প্রজেক্ট সাবমিশন পোর্টাল", en: "Public Project Submission Portal" })}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {t({ bn: "নতুন প্রজেক্ট তৈরি ও প্রস্তাব করুন", en: "Create and Submit a New Project" })}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {t({
                bn: "প্রজেক্টের তথ্য, বিনিয়োগ পরিকল্পনা এবং ক্রিয়েটার পরিচিতি প্রদান করুন। সুপার অ্যাডমিন যাচাই-বাছাইয়ের পর অনুমোদন প্রদান করবেন।",
                en: "Provide project details, investment structure, and creator details. Super Admin will verify and publish."
              })}
            </p>
          </div>

          {/* Section 1: Basic Information */}
          <div className="mb-10">
            <h2 className="mb-5 text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">1</span>
              {t({ bn: "প্রজেক্টের সাধারণ তথ্য (Basic Information)", en: "Basic Project Information" })}
            </h2>

            <div className="grid gap-5 md:grid-cols-3">
              {/* Field: Project Name */}
              <div>
                <label className={labelStyle}>
                  {t({ bn: "প্রজেক্টের নাম (Project Name)", en: "Project Name" })} <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  placeholder={t({ bn: "যেমন: ধানমন্ডি কমার্শিয়াল স্কয়ার", en: "e.g., Dhanmondi Commercial Square" })}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputStyle}
                />
              </div>

              {/* Field: Category */}
              <div>
                <label className={labelStyle}>
                  {t({ bn: "প্রজেক্ট ক্যাটাগরি (Category)", en: "Project Category" })} <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
                  className={inputStyle}
                >
                  <option value={0}>{t({ bn: "-- ক্যাটাগরি নির্বাচন করুন --", en: "-- Select Category --" })}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              {/* Field: Location / District with Division */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700">
                    {t({ bn: "লোকেশন / জেলা ও বিভাগ (District & Division)", en: "Location (District & Division)" })}{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    {loadingLocations ? t({ bn: "API লোড হচ্ছে...", en: "API Loading..." }) : `${allDistricts.length}টি জেলা`}
                  </span>
                </div>
                <select
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className={inputStyle}
                >
                  <option value="">
                    {loadingLocations
                      ? t({ bn: "লোকেশন এপিআই থেকে জেলা লোড হচ্ছে...", en: "Loading districts from API..." })
                      : t({ bn: "-- জেলা ও বিভাগ নির্বাচন করুন (Select District) --", en: "-- Select District & Division --" })}
                  </option>
                  {divisions.map((div) => (
                    <optgroup
                      key={div.id}
                      label={`${div.name} Division (${div.bnName} বিভাগ) — ${div.districts.length}টি জেলা`}
                    >
                      {div.districts.map((dis) => (
                        <option key={dis.id} value={dis.name}>
                          {dis.name} — {dis.bnName} ({div.name} / {div.bnName} বিভাগ)
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Field: Company Name */}
              <div>
                <label className={labelStyle}>
                  {t({ bn: "কোম্পানি বা উদ্যোগের নাম (Company Name)", en: "Company / Venture Name" })}
                </label>
                <input
                  type="text"
                  placeholder={t({ bn: "যেমন: গ্রিন প্রপার্টিজ লিমিটেড", en: "e.g., Green Properties Ltd." })}
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className={inputStyle}
                />
              </div>

              {/* Field: Description */}
              <div className="md:col-span-2">
                <label className={labelStyle}>
                  {t({ bn: "প্রজেক্টের পূর্ণ বিবরণ (Project Description)", en: "Project Description" })} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder={t({
                    bn: "প্রজেক্টের অবস্থান, সুবিধা, সম্ভাব্য ভবিষ্যৎ রিটার্ন এবং ব্যবসায়িক পরিকল্পনার বিস্তারিত বিবরণ লিখুন...",
                    en: "Write detailed overview, location advantages, potential returns, and business plans..."
                  })}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`${inputStyle} min-h-28`}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Creator Information */}
          <div className="mb-10 border-t border-slate-100 pt-8">
            <h2 className="mb-5 text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">2</span>
              {t({ bn: "প্রজেক্ট ক্রিয়েটার ও ওনার তথ্য (Creator Information)", en: "Project Creator / Owner Details" })}
            </h2>

            <div className="grid gap-5 md:grid-cols-3">
              {/* Field: Creator Name */}
              <div>
                <label className={labelStyle}>
                  {t({ bn: "আপনার পূর্ণ নাম (Full Name)", en: "Full Name" })} <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  placeholder={t({ bn: "যেমন: মোহাম্মদ রহিম", en: "e.g., Mohammad Rahim" })}
                  value={form.creatorName}
                  onChange={(e) => setForm({ ...form, creatorName: e.target.value })}
                  className={inputStyle}
                />
              </div>

              {/* Field: Email */}
              <div>
                <label className={labelStyle}>
                  {t({ bn: "ইমেইল অ্যাড্রেস (Email Address)", en: "Email Address" })} <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="email"
                  placeholder="name@example.com"
                  value={form.creatorEmail}
                  onChange={(e) => setForm({ ...form, creatorEmail: e.target.value })}
                  className={inputStyle}
                />
              </div>

              {/* Field: Phone */}
              <div>
                <label className={labelStyle}>
                  {t({ bn: "মোবাইল নাম্বার (Phone Number)", en: "Phone Number" })} <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="tel"
                  placeholder="017xxxxxxxx"
                  value={form.creatorPhone}
                  onChange={(e) => setForm({ ...form, creatorPhone: e.target.value })}
                  className={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Investment and Duration */}
          <div className="mb-10 border-t border-slate-100 pt-8">
            <h2 className="mb-5 text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">3</span>
              {t({ bn: "বিনিয়োগ ও মেয়াদ পরিকল্পনা (Investment & Timeline)", en: "Investment & Timeline" })}
            </h2>

            <div className="grid gap-5 md:grid-cols-3">
              {/* Field: Total Investment */}
              <div>
                <label className={labelStyle}>
                  {t({ bn: "মোট বিনিয়োগ লক্ষ্য (টাকা)", en: "Total Target (BDT)" })} <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  min={1}
                  type="number"
                  placeholder="5000000"
                  value={form.totalInvestmentAmount || ""}
                  onChange={(e) => setForm({ ...form, totalInvestmentAmount: Number(e.target.value) })}
                  className={inputStyle}
                />
              </div>

              {/* Field: Total Shares */}
              <div>
                <label className={labelStyle}>
                  {t({ bn: "মোট শেয়ার সংখ্যা (Total Shares)", en: "Total Shares" })} <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  min={1}
                  type="number"
                  placeholder="100"
                  value={form.totalShares || ""}
                  onChange={(e) => setForm({ ...form, totalShares: Number(e.target.value) })}
                  className={inputStyle}
                />
              </div>

              {/* Field: Price Per Share */}
              <div>
                <label className={labelStyle}>
                  {t({ bn: "প্রতি শেয়ারের মূল্য (টাকা)", en: "Price Per Share (BDT)" })} <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  min={1}
                  type="number"
                  placeholder="50000"
                  value={form.pricePerShare || ""}
                  onChange={(e) => setForm({ ...form, pricePerShare: Number(e.target.value) })}
                  className={inputStyle}
                />
              </div>

              {/* Field: Minimum Investment */}
              <div>
                <label className={labelStyle}>
                  {t({ bn: "সর্বনিম্ন বিনিয়োগ (টাকা)", en: "Minimum Investment (BDT)" })}
                </label>
                <input
                  min={0}
                  type="number"
                  placeholder="50000"
                  value={form.minimumInvestment || ""}
                  onChange={(e) => setForm({ ...form, minimumInvestment: Number(e.target.value) })}
                  className={inputStyle}
                />
              </div>

              {/* Field: Expected Return */}
              <div>
                <label className={labelStyle}>
                  {t({ bn: "প্রত্যাশিত বাৎসরিক রিটার্ন (%)", en: "Expected Return (%)" })}
                </label>
                <input
                  min={0}
                  max={100}
                  step="0.1"
                  type="number"
                  placeholder="18.5"
                  value={form.expectedAnnualReturn || ""}
                  onChange={(e) => setForm({ ...form, expectedAnnualReturn: Number(e.target.value) })}
                  className={inputStyle}
                />
              </div>

              {/* Spacer or additional info */}
              <div className="hidden md:block" />

              {/* Field: Start Date */}
              <div>
                <label className={labelStyle}>
                  {t({ bn: "প্রজেক্ট শুরুর তারিখ (Start Date)", en: "Start Date" })} <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className={inputStyle}
                />
              </div>

              {/* Field: End Date */}
              <div>
                <label className={labelStyle}>
                  {t({ bn: "প্রজেক্ট সমাপ্তির তারিখ (End Date)", en: "End Date" })} <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Project Media and Documents */}
          <div className="mb-10 border-t border-slate-100 pt-8">
            <h2 className="mb-5 text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">4</span>
              {t({ bn: "প্রজেক্টের ছবি ও কাগজপত্র (Media & Documents)", en: "Project Media & Documents" })}
            </h2>

            <div className="grid gap-5 md:grid-cols-3">
              {/* Field: Images */}
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-5 transition hover:bg-slate-50">
                <label className="block cursor-pointer">
                  <div className="mb-2 flex items-center gap-2 font-bold text-slate-800 text-sm">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <ImagePlus className="h-4 w-4" />
                    </div>
                    <span>{t({ bn: "প্রজেক্টের ছবি সমূহ (Multiple Images)", en: "Project Images (Multiple)" })}</span>
                  </div>
                  <p className="mb-3 text-xs text-slate-500">
                    {t({
                      bn: "উচ্চমানের ছবি যুক্ত করুন (PNG, JPG, WEBP). একাধিক ফাইল একসাথে নির্বাচন করা যাবে।",
                      en: "Upload high-quality images (PNG, JPG, WEBP). Multiple files can be selected."
                    })}
                  </p>
                  <input
                    multiple
                    type="file"
                    accept="image/*"
                    onChange={(e) => readFiles(e.target.files, "image")}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </label>
                {images.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-3">
                    <span className="inline-flex items-center rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                      ✓ {images.length} {t({ bn: "টি ছবি সিলেক্ট করা হয়েছে", en: "images selected" })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setImages([])}
                      className="text-xs font-medium text-rose-500 hover:underline"
                    >
                      {t({ bn: "মুছে ফেলুন", en: "Remove All" })}
                    </button>
                  </div>
                )}
              </div>

              {/* Field: Documents */}
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-5 transition hover:bg-slate-50">
                <label className="block cursor-pointer">
                  <div className="mb-2 flex items-center gap-2 font-bold text-slate-800 text-sm">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <Upload className="h-4 w-4" />
                    </div>
                    <span>{t({ bn: "কাগজপত্র ও প্রসপেক্টাস (Documents / PDF)", en: "Documents / Prospectus (PDF)" })}</span>
                  </div>
                  <p className="mb-3 text-xs text-slate-500">
                    {t({
                      bn: "ট্রেড লাইসেন্স, জমির দলিল বা বিনিয়োগ প্রস্তাবনা (PDF, DOCX).",
                      en: "Trade license, land deeds, or project brochure (PDF, DOCX)."
                    })}
                  </p>
                  <input
                    multiple
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={(e) => readFiles(e.target.files, "document")}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </label>
                {documents.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-3">
                    <span className="inline-flex items-center rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                      ✓ {documents.length} {t({ bn: "টি ডকুমেন্ট সিলেক্ট করা হয়েছে", en: "documents selected" })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDocuments([])}
                      className="text-xs font-medium text-rose-500 hover:underline"
                    >
                      {t({ bn: "মুছে ফেলুন", en: "Remove All" })}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit button */}
          <div className="border-t border-slate-100 pt-6">
            <button
              disabled={saving}
              className="w-full rounded-2xl bg-ink-950 px-6 py-4 text-base font-bold text-white shadow-lg transition hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t({ bn: "প্রজেক্ট সাবমিট হচ্ছে...", en: "Submitting Project..." })}
                </>
              ) : (
                t({ bn: "প্রজেক্ট সাবমিট করুন", en: "Submit Project for Approval" })
              )}
            </button>
            <p className="mt-3 text-center text-xs text-slate-400">
              {t({
                bn: "সাবমিট করার পর আপনার ইমেইল ও পাসওয়ার্ড দিয়ে আপনি পোর্টাল ব্যবহার করতে পারবেন।",
                en: "After submission, you can access your account using your provided email and password."
              })}
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
