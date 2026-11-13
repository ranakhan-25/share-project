"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  FileText,
  Filter,
  FolderKanban,
  ImageIcon,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  Search,
  Send,
  UserRound,
  AlertCircle,
  TrendingUp,
  Layers,
  ChevronRight,
  Loader2,
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
  feature?: OwnerFeature;
  status?: OwnerProjectStatus;
  projectId?: string;
};

const card = "rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden";

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
  draft: "bg-slate-100 text-slate-700 border border-slate-200",
  pending: "bg-amber-50 text-amber-700 border border-amber-200/60",
  approved: "bg-sky-50 text-sky-700 border border-sky-200/60",
  rejected: "bg-rose-50 text-rose-700 border border-rose-200/60",
  published: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
};

function StatusBadge({ status }: { status: OwnerProjectStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClasses[status]}`}>
      {statusLabel(status)}
    </span>
  );
}

export function OwnerFeaturePage({ feature = "dashboard", status, projectId }: Props) {
  const [projects, setProjects] = useState<OwnerProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Dropdown filter: all, draft, pending, approved, rejected, published, history, profile
  const [activeFilter, setActiveFilter] = useState<string>(
    status ?? (feature === "history" ? "history" : feature === "profile" ? "profile" : "all")
  );

  const [categories, setCategories] = useState<string[]>([
    "Hotel & Resort",
    "Commercial Real Estate",
    "Renewable Energy",
    "Transport",
    "Technology",
  ]);
  const [categoryIds, setCategoryIds] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyProject);

  useEffect(() => {
    setLoading(true);
    setProjects([]);
    void Promise.all([
      getOwnerProjects(undefined, 1, 100).catch(() => ({ data: [] })),
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
          status: "pending" as OwnerProjectStatus,
          note: item.type === "resubmission" ? "Rejected project resubmitted." : "Project submitted for approval.",
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

  // Filter projects by search & dropdown status
  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      const statusMatches =
        activeFilter === "all" ||
        activeFilter === "history" ||
        activeFilter === "profile" ||
        project.status === activeFilter;
      const searchMatches =
        !query ||
        `${project.name} ${project.category} ${project.location}`.toLowerCase().includes(query);
      return statusMatches && searchMatches;
    });
  }, [projects, search, activeFilter]);

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
    const existing = selectedProject;

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
      const reloaded = await getOwnerProjects(undefined, 1, 100).catch(() => ({ data: [] }));
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
      toast.success(submit ? "Project submitted for approval." : "Project draft saved successfully.");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not save the project.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function changeStatus(project: OwnerProject, nextStatus: OwnerProjectStatus) {
    if (!window.confirm(`${statusLabel(nextStatus)} "${project.name}"?`)) return;
    void (nextStatus === "pending"
      ? (project.status === "rejected" ? resubmitOwnerProject(project.id) : submitOwnerProject(project.id))
      : Promise.reject(new Error("This status transition is managed by Super Admin"))
    ).then(async () => {
      const reloaded = await getOwnerProjects(undefined, 1, 100).catch(() => ({ data: [] }));
      const updated = (reloaded.data || []).map((row: ShareApiProject): OwnerProject => ({
        ...project,
        id: row.uuid,
        name: row.name,
        status: row.status.toLowerCase() as OwnerProjectStatus,
        rejectionReason: row.rejectionReason || undefined,
      }));
      setProjects(updated);
      setMessage(`Project moved to ${statusLabel(nextStatus)}.`);
      toast.success(`Project moved to ${statusLabel(nextStatus)}.`);
    }).catch((cause) => {
      const message = cause instanceof Error ? cause.message : "Status change failed.";
      setError(message);
      toast.error(message);
    });
  }

  // Handle Create or Edit View
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

  // Handle Detail View
  if (feature === "detail" && selectedProject) {
    const project = selectedProject;
    return (
      <div className="space-y-6">
        <Link href="/dashboard/owner" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-4 w-4" />Back to Owner Portal
        </Link>
        <div className={`${card} overflow-hidden`}>
          <div className="relative h-60 sm:h-80 bg-slate-100">
            {project.thumbnail && <Image src={project.thumbnail} alt={project.name} fill sizes="100vw" className="object-cover" />}
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <StatusBadge status={project.status} />
                <h1 className="mt-3 text-2xl font-bold text-slate-900">{project.name}</h1>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="h-4 w-4 text-slate-400" />{project.location}
                </p>
              </div>
              {(project.status === "draft" || project.status === "rejected") && (
                <Link href={`/dashboard/owner/projects/${project.id}/edit`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all">
                  <Edit3 className="h-4 w-4" />Edit Project
                </Link>
              )}
            </div>
            {project.status === "rejected" && project.rejectionReason && (
              <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Rejection Reason</p>
                <p className="mt-1 text-xs text-rose-600">{project.rejectionReason}</p>
              </div>
            )}
            <p className="mt-5 text-xs leading-relaxed text-slate-600">{project.description}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Total Investment", `৳${project.totalInvestmentAmount.toLocaleString()}`],
                ["Total Shares", project.totalShares.toLocaleString()],
                ["Price / Share", `৳${project.pricePerShare.toLocaleString()}`],
                ["Annual Return", `${project.expectedAnnualReturn}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                  <p className="mt-1 text-base font-bold text-slate-900">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {project.status === "draft" && (
                <button onClick={() => changeStatus(project, "pending")} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all">
                  <Send className="h-4 w-4" />Submit for Approval
                </button>
              )}
              {project.status === "rejected" && (
                <button onClick={() => changeStatus(project, "pending")} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all">
                  <Send className="h-4 w-4" />Resubmit Project
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate status counts for metric cards
  const counts = {
    all: projects.length,
    draft: projects.filter((p) => p.status === "draft").length,
    pending: projects.filter((p) => p.status === "pending").length,
    approved: projects.filter((p) => p.status === "approved").length,
    rejected: projects.filter((p) => p.status === "rejected").length,
    published: projects.filter((p) => p.status === "published").length,
  };

  // UNIFIED SINGLE-PAGE OWNER PORTAL
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 p-4 sm:p-6 font-sans text-slate-800 space-y-6">
      
      {/* 1. Header with Breadcrumb & Create Project Button */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>Home</span>
            <span>/</span>
            <span>Project Owner</span>
            <span>/</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              Owner Portal
            </span>
          </nav>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Owner Portal
          </h1>
        </div>

        {/* Create Project Button as explicitly requested */}
        <Link
          href="/dashboard/owner/projects/create"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-indigo-100 transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Create Project</span>
        </Link>
      </header>

      {/* 2. Interactive Metric Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { key: "all", label: "All Projects", count: counts.all, bg: "from-slate-500/10 to-slate-500/5", color: "text-slate-800" },
          { key: "draft", label: "Draft", count: counts.draft, bg: "from-slate-500/10 to-slate-500/5", color: "text-slate-600" },
          { key: "pending", label: "Pending", count: counts.pending, bg: "from-amber-500/10 to-amber-500/5", color: "text-amber-700" },
          { key: "approved", label: "Approved", count: counts.approved, bg: "from-sky-500/10 to-sky-500/5", color: "text-sky-700" },
          { key: "rejected", label: "Rejected", count: counts.rejected, bg: "from-rose-500/10 to-rose-500/5", color: "text-rose-700" },
          { key: "published", label: "Published", count: counts.published, bg: "from-emerald-500/10 to-emerald-500/5", color: "text-emerald-700" },
        ].map((item) => {
          const isActive = activeFilter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveFilter(item.key)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                isActive
                  ? "border-indigo-500 bg-white ring-2 ring-indigo-100 shadow-md scale-[1.02]"
                  : "border-slate-200/90 bg-white hover:border-indigo-200 hover:shadow-sm"
              }`}
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {item.label}
              </p>
              <p className={`mt-2 text-2xl font-bold ${item.color}`}>
                {item.count}
              </p>
            </button>
          );
        })}
      </div>

      {/* 3. Filter Dropdown and Search Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
        
        {/* Dropdown filter matching the nested submenus */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Filter Section:</label>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="h-10 w-full sm:w-56 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">My Projects (All)</option>
            <option value="draft">Draft Projects</option>
            <option value="pending">Pending Projects</option>
            <option value="approved">Approved Projects</option>
            <option value="rejected">Rejected Projects</option>
            <option value="published">Published Projects</option>
            <option value="history">Submission History</option>
            <option value="profile">Profile Settings</option>
          </select>
        </div>

        {/* Search input (when in project view) */}
        {activeFilter !== "profile" && (
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={
                  activeFilter === "history"
                    ? "Search history..."
                    : "Search projects by name, location, category..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* View Mode Switcher */}
            {activeFilter !== "history" && (
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/50 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === "table" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Table View"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === "grid" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Grid Cards View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feedback Messages */}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700 shadow-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 shadow-sm">
          {error}
        </div>
      )}

      {/* 4. DYNAMIC VIEW BASED ON DROPDOWN SELECTION */}
      {activeFilter === "profile" ? (
        /* Profile Settings Form */
        <ProfileSettings />
      ) : activeFilter === "history" ? (
        /* Submission History Table */
        <div className={card}>
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <h2 className="text-sm font-bold text-slate-900">Project Submission History</h2>
            <p className="text-xs text-slate-500 mt-0.5">Audit log of your submitted and resubmitted projects</p>
          </div>
          <div className="divide-y divide-slate-100">
            {projects.flatMap((project) =>
              project.submissionHistory
                .map((item, index) => ({ project, item, index }))
                .filter(({ item }) => item.status !== "draft")
            ).length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No submission history available.
              </div>
            ) : (
              projects
                .flatMap((project) =>
                  project.submissionHistory
                    .map((item, index) => ({ project, item, index }))
                    .filter(({ item }) => item.status !== "draft")
                )
                .map(({ project, item, index }) => (
                  <div key={`${project.id}-${item.status}-${index}`} className="flex flex-wrap items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Clock3 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900">{project.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{item.note}</p>
                    </div>
                    <StatusBadge status={item.status} />
                    <p className="text-xs text-slate-400 font-medium">
                      {item.date ? new Date(item.date).toLocaleDateString() : "Recent"}
                    </p>
                  </div>
                ))
            )}
          </div>
        </div>
      ) : (
        /* Projects List (Table or Grid View) */
        <div className={card}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Loading projects...</span>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-16 text-center">
              <FolderKanban className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-700">No projects found</p>
              <p className="mt-1 text-xs text-slate-400">
                {activeFilter !== "all"
                  ? `There are no ${activeFilter} projects at the moment.`
                  : "Click 'Create Project' above to create your first project."}
              </p>
            </div>
          ) : viewMode === "table" ? (
            /* Modern Table View */
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">PROJECT</th>
                    <th className="px-4 py-3.5">CATEGORY</th>
                    <th className="px-4 py-3.5">LOCATION</th>
                    <th className="px-4 py-3.5">INVESTMENT</th>
                    <th className="px-4 py-3.5">SHARES / PRICE</th>
                    <th className="px-4 py-3.5">ANNUAL RETURN</th>
                    <th className="px-4 py-3.5">STATUS</th>
                    <th className="px-4 py-3.5 text-center w-28">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                            {project.thumbnail ? (
                              <Image src={project.thumbnail} alt="" fill sizes="56px" className="object-cover" />
                            ) : (
                              <Building2 className="h-5 w-5 absolute inset-0 m-auto text-slate-400" />
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/dashboard/owner/projects/${project.id}`}
                              className="font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                            >
                              {project.name}
                            </Link>
                            {project.rejectionReason && project.status === "rejected" && (
                              <p className="text-[11px] text-rose-600 line-clamp-1 max-w-xs mt-0.5">
                                Reason: {project.rejectionReason}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{project.category || "General"}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {project.location || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">
                        ৳{project.totalInvestmentAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {project.totalShares.toLocaleString()} shares @ ৳{project.pricePerShare.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-600">
                        {project.expectedAnnualReturn}%
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={project.status} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/dashboard/owner/projects/${project.id}`}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 transition-colors"
                            title="View Project"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {(project.status === "draft" || project.status === "rejected") && (
                            <Link
                              href={`/dashboard/owner/projects/${project.id}/edit`}
                              className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Edit Project"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Link>
                          )}
                          {project.status === "draft" && (
                            <button
                              type="button"
                              onClick={() => changeStatus(project, "pending")}
                              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Submit for Approval"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}
                          {project.status === "rejected" && (
                            <button
                              type="button"
                              onClick={() => changeStatus(project, "pending")}
                              className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Resubmit for Approval"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Modern Grid Cards View */
            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <article
                  key={project.id}
                  className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                >
                  <div className="relative h-44 bg-slate-100">
                    {project.thumbnail ? (
                      <Image src={project.thumbnail} alt={project.name} fill sizes="300px" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <Building2 className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <StatusBadge status={project.status} />
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 line-clamp-1">{project.name}</h3>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {project.location || "—"}
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50/80 p-2.5 text-xs">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400">Investment</p>
                          <p className="mt-0.5 font-bold text-slate-800">৳{project.totalInvestmentAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400">Return</p>
                          <p className="mt-0.5 font-bold text-emerald-600">{project.expectedAnnualReturn}%</p>
                        </div>
                      </div>
                      {project.rejectionReason && project.status === "rejected" && (
                        <div className="mt-2.5 rounded-lg border border-rose-200 bg-rose-50 p-2 text-[11px] text-rose-700">
                          <strong>Reason:</strong> {project.rejectionReason}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        href={`/dashboard/owner/projects/${project.id}`}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                      >
                        View Details <ChevronRight className="h-3 w-3" />
                      </Link>
                      <div className="flex items-center gap-1">
                        {(project.status === "draft" || project.status === "rejected") && (
                          <Link
                            href={`/dashboard/owner/projects/${project.id}/edit`}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
                            title="Edit"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Link>
                        )}
                        {(project.status === "draft" || project.status === "rejected") && (
                          <button
                            type="button"
                            onClick={() => changeStatus(project, "pending")}
                            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                            title="Submit"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectForm({
  title,
  subtitle,
  form,
  categories,
  saving,
  error,
  message,
  updateForm,
  onBack,
  onSave,
  onSubmit,
}: {
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
  const field =
    "h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100";
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 p-4 sm:p-6 font-sans text-slate-800 space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </button>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
          {message}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-slate-700">Project Name *</span>
            <input
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              className={field}
              placeholder="Enter project name"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-slate-700">Category *</span>
            <select
              value={form.category}
              onChange={(event) => updateForm("category", event.target.value)}
              className={field}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-slate-700">Location *</span>
            <input
              value={form.location}
              onChange={(event) => updateForm("location", event.target.value)}
              className={field}
              placeholder="City, Country"
            />
          </label>
          <label className="md:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-slate-700">Description *</span>
            <textarea
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="Describe the project and investment opportunity"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-slate-700">Thumbnail URL</span>
            <input
              value={form.thumbnail}
              onChange={(event) => updateForm("thumbnail", event.target.value)}
              className={field}
              placeholder="https://..."
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-slate-700">Documents (comma separated)</span>
            <input
              value={form.documents.join(", ")}
              onChange={(event) =>
                updateForm(
                  "documents",
                  event.target.value
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean)
                )
              }
              className={field}
              placeholder="Prospectus.pdf, Valuation.pdf"
            />
          </label>

          {[
            ["totalInvestmentAmount", "Total Investment Amount", "number"],
            ["totalShares", "Total Shares", "number"],
            ["pricePerShare", "Price Per Share", "number"],
            ["minimumInvestment", "Minimum Investment", "number"],
            ["expectedAnnualReturn", "Expected Annual Return (%)", "number"],
            ["startDate", "Start Date", "date"],
            ["endDate", "End Date", "date"],
          ].map(([key, label, type]) => (
            <label key={key}>
              <span className="mb-1 block text-xs font-semibold text-slate-700">{label}</span>
              <input
                type={type}
                value={String(form[key as keyof typeof form] ?? "")}
                onChange={(event) => {
                  const fieldKey = key as keyof typeof form;
                  if (type === "number") updateForm(fieldKey as keyof typeof form, Number(event.target.value) as never);
                  else updateForm(fieldKey as keyof typeof form, event.target.value as never);
                }}
                className={field}
              />
            </label>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            disabled={saving}
            onClick={onSave}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Save Draft
          </button>
          <button
            disabled={saving}
            onClick={onSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-100 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all"
          >
            <Send className="h-4 w-4" />
            <span>Submit for Approval</span>
          </button>
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
      .then((profile) =>
        setForm({
          name: String(profile.name || ""),
          email: String(profile.email || ""),
          phone: String(profile.phone || ""),
          organization: "",
          bio: "",
        })
      )
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
      toast.success("Profile saved successfully.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save profile.");
      toast.error("Could not save profile.");
    }
  };

  const field =
    "mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100";

  return (
    <form onSubmit={save} className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-900">Profile Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage your personal information and contact details</p>
      </div>

      {saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
          Profile saved successfully.
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["name", "Full Name"],
          ["email", "Email Address"],
          ["phone", "Phone Number"],
          ["organization", "Organization"],
        ].map(([keyName, label]) => (
          <label key={keyName}>
            <span className="text-xs font-semibold text-slate-700">{label}</span>
            <input
              type={keyName === "email" ? "email" : "text"}
              required={keyName !== "organization"}
              readOnly={keyName === "email" || keyName === "organization"}
              value={form[keyName as keyof typeof form]}
              onChange={(event) =>
                setForm((current) => ({ ...current, [keyName]: event.target.value }))
              }
              className={`${field} ${
                keyName === "email" || keyName === "organization" ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""
              }`}
            />
          </label>
        ))}
        <label className="md:col-span-2">
          <span className="text-xs font-semibold text-slate-700">Bio</span>
          <textarea
            value={form.bio}
            onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
            rows={3}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            placeholder="Tell us about yourself or your organization..."
          />
        </label>
      </div>

      <div className="flex justify-end pt-3 border-t border-slate-100">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-100 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Save Profile</span>
        </button>
      </div>
    </form>
  );
}
