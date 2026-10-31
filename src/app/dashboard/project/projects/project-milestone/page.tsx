"use client";

import React, {
  Suspense, useCallback, useEffect, useMemo, useState, type FormEvent,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  Activity, CalendarDays, CheckCircle2, Clock3, Edit3, Loader2, Plus,
  RefreshCw, Search, Trash2, X, ChevronRight, Home
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                  TYPES                                     */
/* -------------------------------------------------------------------------- */
type MilestoneStatus = "Planned" | "In Progress" | "Completed" | "Delayed" | "Cancelled";

interface Milestone {
  uuid: string;
  projectUuid: string;
  milestoneCode: string;
  milestoneName: string;
  plannedDate: string;
  actualDate: string | null;
  progress: number;
  status: MilestoneStatus;
  varianceDays: string;
  addedBy: string;
}

interface MilestoneForm {
  milestoneCode: string;
  milestoneName: string;
  plannedDate: string;
  actualDate: string;
  progress: number;
  status: MilestoneStatus;
  varianceDays: string;
  addedBy: string;
  projectUuid: string;
}

/* -------------------------------------------------------------------------- */
/*                                  CONFIG                                    */
/* -------------------------------------------------------------------------- */
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002/realbizpro/api/v1").replace(/\/+$/, "");
const API_URL = `${API_BASE_URL}/project-milestone`;
const STATUSES: MilestoneStatus[] = ["Planned", "In Progress", "Completed", "Delayed", "Cancelled"];

const getToday = () => new Date().toISOString().slice(0, 10);
const EMPTY_FORM: MilestoneForm = {
  milestoneCode: "", milestoneName: "", plannedDate: getToday(), actualDate: "",
  progress: 0, status: "Planned", varianceDays: "0", addedBy: "Shamim Khan", projectUuid: "",
};

/* -------------------------------------------------------------------------- */
/*                              API UTILITIES                                 */
/* -------------------------------------------------------------------------- */
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });

    let result: any = null;
    const text = await response.text();

    if (text) {
      try {
        result = JSON.parse(text);
      } catch {
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        return null as unknown as T;
      }
    }

    if (!response.ok) {
      throw new Error(result?.message || `Request failed (${response.status})`);
    }

    if (result && typeof result === "object" && "success" in result && result.success === false) {
      const msg = Array.isArray(result.message) ? result.message.join(", ") : result.message;
      throw new Error(msg || "API request failed.");
    }

    return result as T;
  } catch (error) {
    throw error;
  }
}

function extractArray(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.data)) return res.data.data;
  if (Array.isArray(res.rows)) return res.rows;
  if (Array.isArray(res.items)) return res.items;
  if (Array.isArray(res.data?.rows)) return res.data.rows;
  if (Array.isArray(res.data?.items)) return res.data.items;
  return [];
}

function normalizeStatus(value: unknown): MilestoneStatus {
  const normalized = String(value ?? "Planned").toLowerCase().replace(/[_-]+/g, " ");
  return STATUSES.find((s) => s.toLowerCase() === normalized) ?? "Planned";
}

function toDateInput(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function normalizeMilestone(item: any): Milestone {
  return {
    uuid: String(item.uuid ?? item.id ?? ""),
    projectUuid: String(item.projectUuid ?? ""),
    milestoneCode: String(item.milestoneCode ?? ""),
    milestoneName: String(item.milestoneName ?? ""),
    plannedDate: String(item.plannedDate ?? ""),
    actualDate: item.actualDate ? String(item.actualDate) : null,
    progress: Number(item.progress ?? 0),
    status: normalizeStatus(item.status),
    varianceDays: String(item.varianceDays ?? "0"),
    addedBy: String(item.addedBy ?? ""),
  };
}

/* -------------------------------------------------------------------------- */
/*                               MAIN PAGE                                    */
/* -------------------------------------------------------------------------- */
function MilestonesInner() {
  const searchParams = useSearchParams();
  const projectUuidFromUrl = searchParams.get("projectUuid") || undefined;

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null);
  const [form, setForm] = useState<MilestoneForm>(EMPTY_FORM);

  // ✅ GET
  const loadMilestones = useCallback(async (showToast = false) => {
    setLoading(true);
    try {
      const res = await apiRequest<any>(`${API_URL}?page=1&limit=100`);
      const arrayData = extractArray(res);
      setMilestones(arrayData.map(normalizeMilestone));
      if (showToast) toast.success("Milestones refreshed.");
    } catch (error: any) {
      toast.error(error.message || "Failed to load milestones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadMilestones(); }, [loadMilestones]);

  // ✅ অটো projectUuid
  const getFirstProjectUuid = async (): Promise<string | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/project?limit=1`, {
        headers: { Accept: "application/json" }
      });
      if (!res.ok) return null;
      const text = await res.text();
      if (!text) return null;
      const result = JSON.parse(text);
      const list = extractArray(result);
      if (list.length > 0) {
        return String(list[0].uuid ?? list[0].id ?? "");
      }
      return null;
    } catch { 
      return null; 
    }
  };

  const filteredMilestones = useMemo(() => {
    const q = search.trim().toLowerCase();
    return milestones.filter((item) => {
      const matchesSearch = !q || item.milestoneName.toLowerCase().includes(q) || item.milestoneCode.toLowerCase().includes(q);
      return matchesSearch && (statusFilter === "All" || item.status === statusFilter);
    });
  }, [milestones, search, statusFilter]);

  const stats = useMemo(() => ({
    total: milestones.length,
    completed: milestones.filter((m) => m.status === "Completed").length,
    inProgress: milestones.filter((m) => m.status === "In Progress").length,
    delayed: milestones.filter((m) => m.status === "Delayed").length,
  }), [milestones]);

  function openCreateModal() {
    setEditingMilestone(null);
    setForm({ ...EMPTY_FORM, projectUuid: projectUuidFromUrl || "" });
    setIsModalOpen(true);
  }

  function openEditModal(item: Milestone) {
    setEditingMilestone(item);
    setForm({
      milestoneCode: item.milestoneCode,
      milestoneName: item.milestoneName,
      plannedDate: toDateInput(item.plannedDate),
      actualDate: toDateInput(item.actualDate),
      progress: item.progress,
      status: item.status,
      varianceDays: String(item.varianceDays ?? "0"),
      addedBy: item.addedBy || "Shamim Khan",
      projectUuid: item.projectUuid || projectUuidFromUrl || "",
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setIsModalOpen(false);
    setEditingMilestone(null);
    setForm(EMPTY_FORM);
  }

  function updateForm<K extends keyof MilestoneForm>(key: K, value: MilestoneForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ✅ CREATE / UPDATE (সব এরর ফিক্স করা)
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    let finalProjectUuid = form.projectUuid.trim() || projectUuidFromUrl || "";
    if (!finalProjectUuid) {
      const autoUuid = await getFirstProjectUuid();
      if (autoUuid) {
        finalProjectUuid = autoUuid;
      } else {
        return toast.error("No project found. Please create a project first.");
      }
    }

    if (!form.milestoneCode.trim()) return toast.error("Milestone code is required.");
    if (!form.milestoneName.trim()) return toast.error("Milestone name is required.");
    if (!form.plannedDate) return toast.error("Planned date is required.");
    if (form.progress < 0 || form.progress > 100) return toast.error("Progress must be 0-100.");

    const isEditing = Boolean(editingMilestone);
    const payload = {
      projectUuid: finalProjectUuid,
      milestoneCode: form.milestoneCode.trim(),
      milestoneName: form.milestoneName.trim(),
      plannedDate: new Date(`${form.plannedDate}T00:00:00`).toISOString(),
      actualDate: form.actualDate ? new Date(`${form.actualDate}T00:00:00`).toISOString() : null,
      progress: Number(form.progress),
      status: form.status,
      varianceDays: String(form.varianceDays || "0"),
      addedBy: form.addedBy.trim() || "Shamim Khan",
    };

    setSaving(true);
    const toastId = toast.loading(isEditing ? "Updating..." : "Creating...");

    try {
      const url = isEditing ? `${API_URL}/${encodeURIComponent(editingMilestone!.uuid)}` : API_URL;
      const method = isEditing ? "PATCH" : "POST";
      
      let finalPayload: any = payload;
      if (isEditing) {
        // ✅ PATCH এর সময় projectUuid, milestoneCode, addedBy বাদ দিন
        const { projectUuid, milestoneCode, addedBy, ...rest } = payload;
        finalPayload = rest;
      }

      await apiRequest(url, { method, body: JSON.stringify(finalPayload) });
      
      toast.dismiss(toastId);
      toast.success(isEditing ? "Milestone updated!" : "Milestone created!");
      
      setIsModalOpen(false);
      setEditingMilestone(null);
      setForm(EMPTY_FORM);
      await loadMilestones();
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(error.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // ✅ DELETE
  async function handleDelete(item: Milestone) {
    if (!item.uuid) return toast.error("Invalid ID");
    if (!confirm(`Delete "${item.milestoneName}"?`)) return;
    setDeletingUuid(item.uuid);
    const toastId = toast.loading("Deleting...");
    try {
      await apiRequest(`${API_URL}/${encodeURIComponent(item.uuid)}`, { method: "DELETE" });
      setMilestones((prev) => prev.filter((m) => m.uuid !== item.uuid));
      toast.dismiss(toastId);
      toast.success("Deleted!");
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(error.message || "Failed to delete");
    } finally {
      setDeletingUuid(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Toaster position="top-right" />
      
      <div className="p-3 sm:p-4 lg:p-5 space-y-4 max-w-full">
        
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <nav className="mb-1 flex items-center gap-2 text-sm text-slate-500">
              <Link href="/projects" className="flex items-center hover:text-blue-600"><Home className="mr-1 h-4 w-4" /> Projects</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="font-semibold text-slate-900">Milestones</span>
            </nav>
            <h1 className="text-2xl font-bold">Project Milestones</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void loadMilestones(true)} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button onClick={openCreateModal} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" /> Add Milestone
            </button>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total" value={stats.total} icon={<CalendarDays size={20} />} iconClass="bg-blue-50 text-blue-700" />
          <StatCard title="Completed" value={stats.completed} icon={<CheckCircle2 size={20} />} iconClass="bg-emerald-50 text-emerald-700" />
          <StatCard title="In Progress" value={stats.inProgress} icon={<Clock3 size={20} />} iconClass="bg-amber-50 text-amber-700" />
          <StatCard title="Delayed" value={stats.delayed} icon={<Activity size={20} />} iconClass="bg-rose-50 text-rose-700" />
        </section>

        {/* Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-bold">All Milestones ({filteredMilestones.length})</h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500 sm:w-64" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border px-3 py-2 text-sm outline-none">
                <option value="All">All Statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Milestone</th>
                  <th className="px-4 py-3.5">Planned Date</th>
                  <th className="px-4 py-3.5">Actual Date</th>
                  <th className="px-4 py-3.5">Progress</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" /></td></tr>
                ) : filteredMilestones.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-slate-400">No milestones found.</td></tr>
                ) : (
                  filteredMilestones.map((item) => (
                    <tr key={item.uuid} className="hover:bg-slate-50">
                      <td className="px-4 py-3.5">
                        <p className="font-semibold">{item.milestoneName}</p>
                        <p className="text-xs text-slate-500">{item.milestoneCode}</p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{item.plannedDate || "—"}</td>
                      <td className="px-4 py-3.5 text-slate-600">{item.actualDate || "—"}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600" style={{ width: `${item.progress}%` }} />
                          </div>
                          <span className="text-xs">{item.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge status={item.status} /></td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEditModal(item)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"><Edit3 size={16} /></button>
                          <button onClick={() => void handleDelete(item)} disabled={deletingUuid === item.uuid} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-50">
                            {deletingUuid === item.uuid ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{editingMilestone ? "Edit Milestone" : "Create Milestone"}</h2>
              <button onClick={closeModal}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Code" required><input required value={form.milestoneCode} onChange={(e) => updateForm("milestoneCode", e.target.value)} className={inputClass} disabled={!!editingMilestone} /></FormField>
                <FormField label="Status" required>
                  <select value={form.status} onChange={(e) => updateForm("status", normalizeStatus(e.target.value))} className={inputClass}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>
              </div>
              <FormField label="Name" required><input required value={form.milestoneName} onChange={(e) => updateForm("milestoneName", e.target.value)} className={inputClass} /></FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Planned Date" required><input type="date" required value={form.plannedDate} onChange={(e) => updateForm("plannedDate", e.target.value)} className={inputClass} /></FormField>
                <FormField label="Actual Date"><input type="date" value={form.actualDate} onChange={(e) => updateForm("actualDate", e.target.value)} className={inputClass} /></FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Progress (%)" required><input type="number" min="0" max="100" required value={form.progress} onChange={(e) => updateForm("progress", Math.min(100, Math.max(0, Number(e.target.value))))} className={inputClass} /></FormField>
                <FormField label="Variance (days)"><input type="number" value={form.varianceDays} onChange={(e) => updateForm("varianceDays", e.target.value)} className={inputClass} /></FormField>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={closeModal} className="rounded-xl border px-4 py-2 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm">{saving ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*                              REUSABLE UI                                  */
/* -------------------------------------------------------------------------- */
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500";

function FormField({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="block text-xs font-semibold text-slate-700">{label}{required && <span className="ml-1 text-rose-500">*</span>}</span>
      {children}
    </label>
  );
}

function StatCard({ title, value, icon, iconClass }: { title: string; value: number; icon: React.ReactNode; iconClass: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className={`rounded-xl p-2.5 ${iconClass}`}>{icon}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: MilestoneStatus }) {
  const styles: Record<MilestoneStatus, string> = {
    Planned: "bg-slate-100 text-slate-700 ring-slate-200",
    "In Progress": "bg-blue-50 text-blue-700 ring-blue-200",
    Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Delayed: "bg-rose-50 text-rose-700 ring-rose-200",
    Cancelled: "bg-amber-50 text-amber-700 ring-amber-200",
  };
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}>{status}</span>;
}

export default function ProjectMilestonePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}>
      <MilestonesInner />
    </Suspense>
  );
}