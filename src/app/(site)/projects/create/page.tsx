"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImagePlus, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { useLang } from "@/lib/i18n";
import { createPublicShareProject, getPublicCategories } from "@/lib/share-project-api";

const locations = ["Dhaka", "Chattogram", "Rajshahi", "Khulna", "Barishal", "Sylhet", "Rangpur", "Mymensingh"];

export default function CreatePublicProjectPage() {
  const { t } = useLang();
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", categoryId: 0, description: "", location: "", totalInvestmentAmount: 0,
    totalShares: 0, pricePerShare: 0, minimumInvestment: 0, expectedAnnualReturn: 0,
    startDate: "", endDate: "", creatorName: "", creatorEmail: "", creatorPhone: "",
    creatorPassword: "", companyName: "",
  });
  const [images, setImages] = useState<Array<{ url: string; title: string }>>([]);
  const [documents, setDocuments] = useState<Array<{ url: string; title: string }>>([]);

  useEffect(() => {
    void getPublicCategories()
      .then((rows) => setCategories(rows.map((row) => ({ id: row.id, name: row.name }))))
      .catch(() => setCategories([]));
  }, []);

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
    if (!form.name || !form.categoryId || !form.description || !form.location || !form.creatorName || !form.creatorEmail || !form.creatorPhone || !form.creatorPassword) {
      toast.error(t({ bn: "সব প্রয়োজনীয় তথ্য দিন", en: "Enter all required information" }));
      return;
    }
    if (form.totalShares <= 0 || form.pricePerShare <= 0 || form.totalInvestmentAmount <= 0) {
      toast.error(t({ bn: "বৈধ বিনিয়োগ তথ্য দিন", en: "Enter valid investment information" }));
      return;
    }
    setSaving(true);
    try {
      await createPublicShareProject({ ...form, images, documents });
      toast.success(t({ bn: "প্রজেক্ট সাবমিট হয়েছে ও পেন্ডিং আছে", en: "Project submitted and is pending review" }));
      setForm((current) => ({ ...current, name: "", description: "" }));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t({ bn: "প্রজেক্ট তৈরি করা যায়নি", en: "Could not create project" }));
    } finally {
      setSaving(false);
    }
  };

  const input = "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:bg-white";
  return (
    <main className="bg-slate-50 pb-20 pt-28">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <Link href="/projects" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />{t({ bn: "প্রজেক্টে ফিরে যান", en: "Back to projects" })}</Link>
        <form onSubmit={submit} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">{t({ bn: "নতুন প্রজেক্ট তৈরি করুন", en: "Create a new project" })}</h1>
          <p className="mt-2 text-sm text-slate-500">{t({ bn: "প্রজেক্টটি সুপার অ্যাডমিন অনুমোদনের জন্য পাঠানো হবে।", en: "The project will be sent for Super Admin review." })}</p>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <input required placeholder={t({ bn: "প্রজেক্টের নাম", en: "Project name" })} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
            <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })} className={input}>
              <option value={0}>{t({ bn: "ক্যাটাগরি নির্বাচন", en: "Select category" })}</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <select required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={input}>
              <option value="">{t({ bn: "লোকেশন নির্বাচন", en: "Select location" })}</option>
              {locations.map((location) => <option key={location}>{location}</option>)}
            </select>
            <input required type="text" placeholder={t({ bn: "কোম্পানি নাম", en: "Company name" })} value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className={input} />
            <textarea required placeholder={t({ bn: "প্রজেক্ট বিবরণ", en: "Project description" })} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${input} min-h-28 md:col-span-2`} />
          </div>

          <h2 className="mt-8 border-t border-slate-100 pt-6 font-bold text-slate-900">{t({ bn: "প্রজেক্ট ক্রিয়েটার তথ্য", en: "Project creator information" })}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input required placeholder={t({ bn: "আপনার নাম", en: "Your name" })} value={form.creatorName} onChange={(e) => setForm({ ...form, creatorName: e.target.value })} className={input} />
            <input required type="email" placeholder="Email" value={form.creatorEmail} onChange={(e) => setForm({ ...form, creatorEmail: e.target.value })} className={input} />
            <input required type="tel" placeholder={t({ bn: "ফোন নাম্বার", en: "Phone number" })} value={form.creatorPhone} onChange={(e) => setForm({ ...form, creatorPhone: e.target.value })} className={input} />
            <input required type="password" minLength={6} placeholder={t({ bn: "পাসওয়ার্ড", en: "Password" })} value={form.creatorPassword} onChange={(e) => setForm({ ...form, creatorPassword: e.target.value })} className={input} />
          </div>

          <h2 className="mt-8 border-t border-slate-100 pt-6 font-bold text-slate-900">{t({ bn: "বিনিয়োগ ও মেয়াদ", en: "Investment and duration" })}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {([
              ["totalInvestmentAmount", t({ bn: "মোট বিনিয়োগ", en: "Total investment" })],
              ["totalShares", t({ bn: "মোট শেয়ার", en: "Total shares" })],
              ["pricePerShare", t({ bn: "প্রতি শেয়ার মূল্য", en: "Price per share" })],
              ["minimumInvestment", t({ bn: "সর্বনিম্ন বিনিয়োগ", en: "Minimum investment" })],
              ["expectedAnnualReturn", t({ bn: "বার্ষিক রিটার্ন (%)", en: "Annual return (%)" })],
            ] as const).map(([key, label]) => (
              <input key={key} required min={0} type="number" placeholder={label} value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })} className={input} />
            ))}
            <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={input} />
            <input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={input} />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <label className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600"><span className="mb-3 flex items-center gap-2 font-semibold"><ImagePlus className="h-4 w-4" />{t({ bn: "একাধিক ছবি", en: "Multiple images" })}</span><input multiple type="file" accept="image/*" onChange={(e) => readFiles(e.target.files, "image")} className="block w-full text-xs" /></label>
            <label className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600"><span className="mb-3 flex items-center gap-2 font-semibold"><Upload className="h-4 w-4" />{t({ bn: "একাধিক ডকুমেন্ট", en: "Multiple documents" })}</span><input multiple type="file" accept=".pdf,.doc,.docx,image/*" onChange={(e) => readFiles(e.target.files, "document")} className="block w-full text-xs" /></label>
          </div>
          {(images.length > 0 || documents.length > 0) && <p className="mt-3 text-xs text-slate-500">{images.length} images, {documents.length} documents selected</p>}

          <button disabled={saving} className="mt-8 w-full rounded-2xl bg-ink-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50">
            {saving ? t({ bn: "সাবমিট হচ্ছে...", en: "Submitting..." }) : t({ bn: "প্রজেক্ট সাবমিট করুন", en: "Submit project" })}
          </button>
        </form>
      </div>
    </main>
  );
}
