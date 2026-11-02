"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  FileText,
  FolderKanban,
  ImageIcon,
  MapPin,
  Plus,
  Search,
  Send,
  UserRound,
} from "lucide-react";
import {
  statusLabel,
  type OwnerProject,
  type OwnerProjectStatus,
} from "@/lib/owner-projects";
import {
  createOwnerProject,
  getOwnerProjects,
  getPublicCategories,
  resubmitOwnerProject,
  submitOwnerProject,
  updateOwnerProject,
  getShareUserProfile,
  updateShareUserProfile,
  type ShareApiProject,
} from "@/lib/share-project-api";

type OwnerFeature =
  | "dashboard"
  | "projects"
  | "create"
  | "detail"
  | "edit"
  | "history"
  | "profile";

type Props = {
  feature: OwnerFeature;
  status?: OwnerProjectStatus;
  projectId?: string;
};

const card = "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

const emptyProject: Omit<OwnerProject, "id" | "createdAt" | "updatedAt" | "submissionHistory" | "status"> = {
  name: "",
  category: "",
  description: "",
  location: "",
  thumbnail: "",
  gallery: [],
  documents: [],
  totalInvestmentAmount: 0,
  totalShares: 0,
  pricePerShare: 0,
  minimumInvestment: 0,
  expectedAnnualReturn: 0,
  startDate: "",
  endDate: "",
};

const statusClasses: Record<OwnerProjectStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-sky-50 text-sky-700",
  rejected: "bg-red-50 text-red-700",
  published: "bg-emerald-50 text-emerald-700",
};

function StatusBadge({ status }: { status: OwnerProjectStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}>{statusLabel(status)}</span>;
}

export function OwnerFeaturePage({ feature, status, projectId }: Props) {
  const [projects, setProjects] = useState<OwnerProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>(["Hotel & Resort", "Commercial Real Estate", "Renewable Energy", "Transport", "Technology"]);
  const [categoryIds, setCategoryIds] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyProject);

  useEffect(() => {
    setLoading(true);
    setProjects([]);

    void Promise.all([
      getOwnerProjects(status, 1, 100).catch(() => ({ data: [] })),
      getPublicCategories().catch(() => []),
    ]).then(([projectBody, categoryRows]) => {
      const rows = Array.isArray(projectBody.data) ? projectBody.data : [];
      const mapped = rows.map((row: ShareApiProject): OwnerProject => ({
        id: row.uuid,
        name: row.name,
        category: row.category?.name || "",
        description: row.description,
        location: row.location || "",
        thumbnail: row.thumbnailUrl || "",
        gallery: (row.images || []).map((image) => image.url),
        documents: (row.documents || []).map((document) => document.title || document.url),
        totalInvestmentAmount: Number(row.totalInvestmentAmount || 0),
        totalShares: Number(row.totalShares || 0),
        pricePerShare: Number(row.pricePerShare || 0),
        minimumInvestment: Number(row.minimumInvestment || 0),
        expectedAnnualReturn: Number(row.expectedAnnualReturn || 0),
        startDate: row.startDate || "",
        endDate: row.endDate || "",
        status: row.status.toLowerCase() as OwnerProjectStatus,
        rejectionReason: row.rejectionReason || undefined,
        createdAt: "",
        updatedAt: "",
        submissionHistory: (row.submissions || []).map((item) => ({
          status: item.type === "resubmission" ? "pending" as OwnerProjectStatus : "pending" as OwnerProjectStatus,
          note: item.type === "resubmission" ? "Rejected project resubmitted." : "Project submitted.",
          date: item.createdAt || item.submittedAt || "",
        })),
      }));
      setProjects(mapped);
      const names = categoryRows.map((item) => item.name);
      if (names.length) {
        setCategories(names);
        setCategoryIds(Object.fromEntries(categoryRows.map((item) => [item.name, item.id])));
      }
      const selected = rows.find((item) => item.uuid === projectId);
      if (selected && (feature === "edit" || feature === "detail")) {
        setForm({
          name: selected.name,
          category: selected.category?.name || "",
          description: selected.description,
          location: selected.location || "",
          thumbnail: selected.thumbnailUrl || "",
          gallery: (selected.images || []).map((image) => image.url),
          documents: (selected.documents || []).map((document) => document.title || document.url),
          totalInvestmentAmount: Number(selected.totalInvestmentAmount || 0),
          totalShares: Number(selected.totalShares || 0),
          pricePerShare: Number(selected.pricePerShare || 0),
          minimumInvestment: Number(selected.minimumInvestment || 0),
          expectedAnnualReturn: Number(selected.expectedAnnualReturn || 0),
          startDate: selected.startDate || "",
          endDate: selected.endDate || "",
        });
      }
    }).finally(() => setLoading(false));
  }, [feature, projectId]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      const statusMatches = status ? project.status === status : true;
      const searchMatches = !query || `${project.name} ${project.category} ${project.location}`.toLowerCase().includes(query);
      return statusMatches && searchMatches;
    });
  }, [projects, search, status]);

  const selectedProject = projects.find((project) => project.id === projectId);

  function updateForm<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveProject(submit: boolean) {
    setError("");
    setMessage("");
    if (!form.name.trim()) return setError("Project name is required.");
    if (!form.category) return setError("Category is required.");
    if (!form.description.trim()) return setError("Description is required.");
    if (!form.location.trim()) return setError("Location is required.");
    if (form.totalInvestmentAmount <= 0 || form.totalShares <= 0 || form.pricePerShare <= 0) {
      return setError("Investment amount, share quantity and price must be greater than zero.");
    }
    if (!form.startDate || !form.endDate || form.endDate < form.startDate) {
      return setError("Please provide a valid start and end date.");
    }

    setSaving(true);
    const now = new Date().toISOString();
    const existing = selectedProject;
    const nextStatus: OwnerProjectStatus = submit ? "pending" : existing && existing.status !== "draft" && existing.status !== "rejected" ? existing.status : "draft";
    const nextProject: OwnerProject = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      id: existing?.id || `owner-${Date.now()}`,
      status: nextStatus,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      rejectionReason: submit ? undefined : existing?.rejectionReason,
      submissionHistory: submit
        ? [...(existing?.submissionHistory || []), { status: "pending", note: existing?.status === "rejected" ? "Rejected project resubmitted for approval." : "Submitted for approval.", date: now }]
        : existing?.submissionHistory || [{ status: "draft", note: "Project draft created.", date: now }],
    };

    try {
      const categoryId = categoryIds[form.category];
      if (!categoryId) return setError("The selected category is not available from the server.");
      const body = {
        name: form.name.trim(),
        categoryId,
        description: form.description.trim(),
        location: form.location.trim(),
        thumbnailUrl: form.thumbnail || undefined,
        totalInvestmentAmount: form.totalInvestmentAmount,
        totalShares: form.totalShares,
        pricePerShare: form.pricePerShare,
        minimumInvestment: form.minimumInvestment,
        expectedAnnualReturn: form.expectedAnnualReturn,
        startDate: form.startDate,
        endDate: form.endDate,
        images: form.gallery.map((url, index) => ({ url, sortOrder: index })),
        documents: form.documents.map((url, index) => ({ title: url, url, sortOrder: index })),
      };
      let saved: ShareApiProject;
      if (existing) saved = await updateOwnerProject(existing.id, body);
      else saved = await createOwnerProject(body);
      if (submit) {
        saved = existing && existing.status === "rejected"
          ? await resubmitOwnerProject(saved.uuid)
          : await submitOwnerProject(saved.uuid);
      }
      const reloaded = await getOwnerProjects(status, 1, 100).catch(() => ({ data: [] }));
      const updated = (reloaded.data || []).map((row: ShareApiProject): OwnerProject => ({
        id: row.uuid,
        name: row.name,
        category: row.category?.name || form.category,
        description: row.description,
        location: row.location || "",
        thumbnail: row.thumbnailUrl || "",
        gallery: (row.images || []).map((image) => image.url),
        documents: (row.documents || []).map((document) => document.title || document.url),
        totalInvestmentAmount: Number(row.totalInvestmentAmount || 0),
        totalShares: Number(row.totalShares || 0),
        pricePerShare: Number(row.pricePerShare || 0),
        minimumInvestment: Number(row.minimumInvestment || 0),
        expectedAnnualReturn: Number(row.expectedAnnualReturn || 0),
        startDate: row.startDate || "",
        endDate: row.endDate || "",
        status: row.status.toLowerCase() as OwnerProjectStatus,
        rejectionReason: row.rejectionReason || undefined,
        createdAt: "",
        updatedAt: "",
        submissionHistory: [],
      }));
      setProjects(updated);
      setMessage(submit ? "Project submitted for approval." : "Project draft saved successfully.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the project.");
    } finally {
      setSaving(false);
    }
  }

  function changeStatus(project: OwnerProject, nextStatus: OwnerProjectStatus, note: string) {
    if (!window.confirm(`${statusLabel(nextStatus)} "${project.name}"?`)) return;
    void (nextStatus === "pending"
      ? (project.status === "rejected" ? resubmitOwnerProject(project.id) : submitOwnerProject(project.id))
      : Promise.reject(new Error("This status transition is managed by Super Admin"))
    ).then(async () => {
      const reloaded = await getOwnerProjects(status, 1, 100).catch(() => ({ data: [] }));
      const updated = (reloaded.data || []).map((row: ShareApiProject): OwnerProject => ({
        ...project,
        id: row.uuid,
        name: row.name,
        status: row.status.toLowerCase() as OwnerProjectStatus,
        rejectionReason: row.rejectionReason || undefined,
      }));
      setProjects(updated);
      setMessage(`Project moved to ${statusLabel(nextStatus)}.`);
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "Status change failed."));
  }

  if (feature === "dashboard") {
    const counts = (["draft", "pending", "approved", "rejected", "published"] as OwnerProjectStatus[]).map((value) => ({
      value,
      count: projects.filter((project) => project.status === value).length,
    }));
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm text-slate-500">Project Owner</p><h1 className="text-2xl font-bold text-slate-900">Owner Dashboard</h1></div>
          <Link href="/dashboard/owner/projects/create" className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-3 text-sm font-semibold text-white hover:bg-ink-800"><Plus className="h-4 w-4" />Create Project</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {counts.map(({ value, count }) => (
            <Link key={value} href={`/dashboard/owner/status/${value}`} className={`${card} p-5 transition hover:-translate-y-0.5 hover:shadow-md`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{statusLabel(value)}</p><p className="mt-3 text-3xl font-bold text-slate-900">{count}</p>
            </Link>
          ))}
        </div>
        <div className={`${card} overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-slate-900">Recent Projects</h2><Link href="/dashboard/owner/projects" className="text-sm font-semibold text-emerald-600">View all</Link></div>
          <div className="divide-y divide-slate-100">{projects.slice(0, 5).map((project) => <Link key={project.id} href={`/dashboard/owner/projects/${project.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50"><div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">{project.thumbnail && <Image src={project.thumbnail} alt="" fill sizes="64px" className="object-cover" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{project.name}</p><p className="mt-1 text-xs text-slate-500">{project.location}</p></div><StatusBadge status={project.status} /></Link>)}</div>
        </div>
      </div>
    );
  }

  if (feature === "profile") {
    return <ProfileSettings />;
  }

  if (feature === "history") {
    return (
      <div className="space-y-5">
        <div><p className="text-sm text-slate-500">Project Owner</p><h1 className="text-2xl font-bold text-slate-900">Submission History</h1></div>
        <div className={`${card} divide-y divide-slate-100`}>
          {projects.flatMap((project) => project.submissionHistory.map((item, index) => ({ project, item, index })).filter(({ item }) => item.status !== "draft")).map(({ project, item, index }) => (
            <div key={`${project.id}-${item.status}-${index}`} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-500"><Clock3 className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">{project.name}</p><p className="mt-1 text-xs text-slate-500">{item.note}</p></div><StatusBadge status={item.status} /><p className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (feature === "create" || feature === "edit") {
    return (
      <ProjectForm
        title={feature === "edit" ? "Edit Project" : "Create Project"}
        subtitle={feature === "edit" ? "Update project details and resubmit if rejected." : "Add project information and save it as a draft or submit it for approval."}
        form={form}
        categories={categories}
        saving={saving}
        error={error}
        message={message}
        updateForm={updateForm}
        onBack={() => window.history.back()}
        onSave={() => void saveProject(false)}
        onSubmit={() => void saveProject(true)}
      />
    );
  }

  if (feature === "detail" && selectedProject) {
    const project = selectedProject;
    return (
      <div className="space-y-6">
        <Link href="/dashboard/owner/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />Back to My Projects</Link>
        <div className={`${card} overflow-hidden`}>
          <div className="relative h-56 sm:h-72 bg-slate-100">{project.thumbnail && <Image src={project.thumbnail} alt={project.name} fill sizes="100vw" className="object-cover" />}</div>
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4"><div><StatusBadge status={project.status} /><h1 className="mt-3 text-2xl font-bold text-slate-900">{project.name}</h1><p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="h-4 w-4" />{project.location}</p></div>
              {(project.status === "draft" || project.status === "rejected") && <Link href={`/dashboard/owner/projects/${project.id}/edit`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Edit3 className="h-4 w-4" />Edit</Link>}
            </div>
            {project.status === "rejected" && project.rejectionReason && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4"><p className="text-sm font-bold text-red-700">Rejection Reason</p><p className="mt-1 text-sm text-red-600">{project.rejectionReason}</p></div>}
            <p className="mt-5 text-sm leading-6 text-slate-600">{project.description}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[["Investment", `৳${project.totalInvestmentAmount.toLocaleString()}`], ["Total Shares", project.totalShares.toLocaleString()], ["Price / Share", `৳${project.pricePerShare.toLocaleString()}`], ["Annual Return", `${project.expectedAnnualReturn}%`]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 font-bold text-slate-900">{value}</p></div>)}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {project.status === "draft" && <button onClick={() => changeStatus(project, "pending", "Submitted for approval.")} className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-3 text-sm font-semibold text-white"><Send className="h-4 w-4" />Submit for Approval</button>}
              {project.status === "rejected" && <button onClick={() => changeStatus(project, "pending", "Rejected project resubmitted for approval.")} className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-3 text-sm font-semibold text-white"><Send className="h-4 w-4" />Resubmit Project</button>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm text-slate-500">Project Owner</p><h1 className="text-2xl font-bold text-slate-900">{status ? `${statusLabel(status)} Projects` : "My Projects"}</h1></div>
        <Link href="/dashboard/owner/projects/create" className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-3 text-sm font-semibold text-white hover:bg-ink-800"><Plus className="h-4 w-4" />Create Project</Link>
      </div>
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <label className="relative block max-w-md"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects..." className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-emerald-500" /></label>
      {loading ? <div className={`${card} py-16 text-center text-sm text-slate-500`}>Loading projects...</div> : filteredProjects.length === 0 ? <div className={`${card} py-16 text-center`}><FolderKanban className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">No projects found</p></div> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredProjects.map((project) => (
            <article key={project.id} className={`${card} overflow-hidden`}>
              <Link href={`/dashboard/owner/projects/${project.id}`} className="grid sm:grid-cols-[180px_1fr]">
                <div className="relative h-44 bg-slate-100 sm:h-full">{project.thumbnail && <Image src={project.thumbnail} alt={project.name} fill sizes="180px" className="object-cover" />}</div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3"><StatusBadge status={project.status} />{(project.status === "draft" || project.status === "rejected") && <Edit3 className="h-4 w-4 text-slate-400" />}</div>
                  <h2 className="mt-3 font-bold text-slate-900">{project.name}</h2><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" />{project.location}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3"><div><p className="text-[11px] text-slate-400">Shares</p><p className="mt-1 text-sm font-bold text-slate-800">{project.totalShares.toLocaleString()}</p></div><div><p className="text-[11px] text-slate-400">Return</p><p className="mt-1 text-sm font-bold text-emerald-600">{project.expectedAnnualReturn}%</p></div></div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectForm({ title, subtitle, form, categories, saving, error, message, updateForm, onBack, onSave, onSubmit }: {
  title: string;
  subtitle: string;
  form: typeof emptyProject;
  categories: string[];
  saving: boolean;
  error: string;
  message: string;
  updateForm: <K extends keyof typeof emptyProject>(key: K, value: (typeof emptyProject)[K]) => void;
  onBack: () => void;
  onSave: () => void;
  onSubmit: () => void;
}) {
  const field = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500";
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />Back</button>
      <div><p className="text-sm text-slate-500">Project Owner</p><h1 className="text-2xl font-bold text-slate-900">{title}</h1><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
      <div className={`${card} p-5 sm:p-7`}>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="md:col-span-2"><span className="mb-2 block text-xs font-semibold text-slate-600">Project Name</span><input value={form.name} onChange={(event) => updateForm("name", event.target.value)} className={field} placeholder="Enter project name" /></label>
          <label><span className="mb-2 block text-xs font-semibold text-slate-600">Category</span><select value={form.category} onChange={(event) => updateForm("category", event.target.value)} className={field}><option value="">Select category</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label><span className="mb-2 block text-xs font-semibold text-slate-600">Location</span><input value={form.location} onChange={(event) => updateForm("location", event.target.value)} className={field} placeholder="City, country" /></label>
          <label className="md:col-span-2"><span className="mb-2 block text-xs font-semibold text-slate-600">Description</span><textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} rows={5} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500" placeholder="Describe the project and investment opportunity" /></label>
          <label><span className="mb-2 block text-xs font-semibold text-slate-600">Thumbnail URL</span><input value={form.thumbnail} onChange={(event) => updateForm("thumbnail", event.target.value)} className={field} placeholder="https://..." /></label>
          <label><span className="mb-2 block text-xs font-semibold text-slate-600">Documents (comma separated)</span><input value={form.documents.join(", ")} onChange={(event) => updateForm("documents", event.target.value.split(",").map((value) => value.trim()).filter(Boolean))} className={field} placeholder="Prospectus.pdf, Valuation.pdf" /></label>
          {[["totalInvestmentAmount", "Total Investment Amount", "number"], ["totalShares", "Total Shares", "number"], ["pricePerShare", "Price Per Share", "number"], ["minimumInvestment", "Minimum Investment", "number"], ["expectedAnnualReturn", "Expected Annual Return (%)", "number"], ["startDate", "Start Date", "date"], ["endDate", "End Date", "date"]].map(([key, label, type]) => (
            <label key={key}><span className="mb-2 block text-xs font-semibold text-slate-600">{label}</span><input type={type} value={String(form[key as keyof typeof form] ?? "")} onChange={(event) => {
              const fieldKey = key as keyof typeof form;
              if (type === "number") updateForm(fieldKey as keyof typeof form, Number(event.target.value) as never);
              else updateForm(fieldKey as keyof typeof form, event.target.value as never);
            }} className={field} /></label>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
          <button disabled={saving} onClick={onSave} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Save Draft</button>
          <button disabled={saving} onClick={onSubmit} className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-5 py-3 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-50"><Send className="h-4 w-4" />Submit for Approval</button>
        </div>
      </div>
    </div>
  );
}

function ProfileSettings() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", organization: "", bio: "" });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    void getShareUserProfile()
      .then((profile) => setForm({
        name: String(profile.name || ""),
        email: String(profile.email || ""),
        phone: String(profile.phone || ""),
        organization: "",
        bio: "",
      }))
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load profile."))
      .finally(() => setLoading(false));
  }, []);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSaved(false);
    try {
      await updateShareUserProfile({ name: form.name.trim(), phone: form.phone.trim() });
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save profile.");
    }
  };
  const field = "mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500";
  return (
    <form onSubmit={save} className="space-y-5">
      <div><p className="text-sm text-slate-500">Project Owner</p><h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1></div>
      {saved && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Profile saved successfully.</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className={`${card} grid gap-5 p-5 sm:p-7 md:grid-cols-2`}>
        {[["name", "Full Name"], ["email", "Email Address"], ["phone", "Phone Number"], ["organization", "Organization"]].map(([keyName, label]) => <label key={keyName}><span className="text-xs font-semibold text-slate-600">{label}</span><input type={keyName === "email" ? "email" : "text"} required={keyName !== "organization"} readOnly={keyName === "email" || keyName === "organization"} value={form[keyName as keyof typeof form]} onChange={(event) => setForm((current) => ({ ...current, [keyName]: event.target.value }))} className={`${field} ${keyName === "email" || keyName === "organization" ? "bg-slate-100 text-slate-500" : ""}`} /></label>)}
        <label className="md:col-span-2"><span className="text-xs font-semibold text-slate-600">Bio</span><textarea value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} rows={4} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500" /></label>
      </div>
      <div className="flex justify-end"><button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />Save Profile</button></div>
    </form>
  );
}
