"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Home, ChevronRight, Plus, Search, FileText, DollarSign, X, 
  CheckCircle2, AlertTriangle, Ban, Eye, Edit, Trash2, RefreshCw, 
  Undo2, AlertCircle, Loader2, CalendarDays,
} from "lucide-react";

/* ==========================================================================
   API CONFIG & TYPES
   ========================================================================== */

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002/realbizpro/api/v1"
).replace(/\/+$/, "");

type AgreementType = "Service" | "Partnership" | "Investment" | "Other";
type AgreementStatus = "Active" | "Expired" | "Terminated";

interface ProjectAgreement {
  id?: string;
  uuid: string;
  projectUuid?: string;
  code: string;
  partyUuid?: string;
  party: string;
  type: AgreementType;
  signedAt: string;
  startAt: string;
  endAt?: string;
  value: number;
  status: AgreementStatus;
  notes?: string;
  agreementFile?: string;
}

interface AgreementForm {
  code: string;
  partyUuid: string;
  type: AgreementType;
  signedAt: string;
  startAt: string;
  endAt: string;
  value: string;
  status: AgreementStatus;
  notes: string;
  agreementFile: string;
  projectUuid: string;
}

interface PartyOption {
  uuid: string;
  label: string;
}

const today = () => {
  const date = new Date();
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

const day = (value?: string | null) => (value ? String(value).slice(0, 10) : "");

const emptyForm = (projectUuid = ""): AgreementForm => ({
  code: "",
  partyUuid: "",
  type: "Service",
  signedAt: today(),
  startAt: today(),
  endAt: "",
  value: "",
  status: "Active",
  notes: "",
  agreementFile: "",
  projectUuid,
});

/* ==========================================================================
   API HELPERS
   ========================================================================== */

async function request<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });

    const raw = response.status === 204 ? "" : await response.text();
    let result: any = undefined;
    if (raw) {
      try { result = JSON.parse(raw); } catch { throw new Error("Invalid JSON response."); }
    }

    if (!response.ok || result?.success === false) {
      const message = Array.isArray(result?.message)
        ? result.message.join(", ")
        : result?.message || `Request failed (${response.status})`;
      throw new Error(message);
    }
    return result as T;
  } catch (error) {
    console.error(`[Project Agreement API] ${path}`, error);
    throw error;
  }
}

function unwrapList(response: any): any[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  return [];
}

function unwrapOne(response: any): any {
  let current = response;
  for (let i = 0; i < 3; i++) {
    if (current && typeof current === "object" && !Array.isArray(current) && current.data && !Array.isArray(current.data)) {
      current = current.data;
    } else break;
  }
  return current;
}

function normalizeStatus(value: unknown): AgreementStatus {
  const status = String(value ?? "Active").toLowerCase();
  if (status === "expired") return "Expired";
  if (status === "terminated") return "Terminated";
  return "Active";
}

function normalize(value: any): ProjectAgreement {
  const agreement = value ?? {};
  return {
    id: agreement.id != null ? String(agreement.id) : undefined,
    uuid: String(agreement.uuid ?? agreement.id ?? ""),
    projectUuid: agreement.projectUuid ?? agreement.project?.uuid ?? "",
    code: String(agreement.agreementCode ?? agreement.code ?? ""),
    partyUuid: agreement.partyUuid ?? agreement.party?.uuid ?? "",
    party: agreement.party?.partyBusinessName ?? agreement.partyBusinessName ?? "",
    type: (agreement.agreementType ?? "Service") as AgreementType,
    signedAt: day(agreement.signedDate ?? agreement.signedAt),
    startAt: day(agreement.startDate ?? agreement.startAt),
    endAt: day(agreement.endDate ?? agreement.endAt) || undefined,
    value: Number(agreement.contractValue ?? agreement.value ?? 0),
    status: normalizeStatus(agreement.status),
    notes: agreement.notes ?? "",
    agreementFile: agreement.agreementFile ?? "",
  };
}

function toPayload(form: AgreementForm, isCreate: boolean) {
  return {
    // ✅ projectUuid সবসময় পাঠাবে (তৈরির সময়)
    ...(isCreate ? { projectUuid: form.projectUuid.trim(), agreementCode: form.code.trim() } : {}),
    partyUuid: form.partyUuid.trim(),
    agreementType: form.type,
    signedDate: form.signedAt,
    startDate: form.startAt,
    ...(form.endAt ? { endDate: form.endAt } : {}),
    contractValue: Number(form.value) || 0,
    status: form.status,
    ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    ...(form.agreementFile.trim() ? { agreementFile: form.agreementFile.trim() } : {}),
  };
}

const api = {
  list: async (projectUuid?: string) => {
    const params = new URLSearchParams({ page: "1", limit: "100" });
    if (projectUuid) params.set("projectUuid", projectUuid);
    const response = await request(`/project-agreement?${params.toString()}`);
    return unwrapList(response).map(normalize);
  },

  get: async (uuid: string) => {
    const response = await request(`/project-agreement/${encodeURIComponent(uuid)}`);
    return normalize(unwrapOne(response));
  },

  // ✅ পার্টি লিস্ট
  parties: async (): Promise<PartyOption[]> => {
    const response = await request("/project-parties?limit=100");
    return unwrapList(response)
      .map((party: any) => ({
        uuid: String(party.uuid ?? party.id ?? ""),
        label: String(party.partyBusinessName ?? party.name ?? party.partyCode ?? ""),
      }))
      .filter((p) => p.uuid);
  },

  // ✅ অটো projectUuid জেনারেট করার জন্য
  projects: async (): Promise<string | null> => {
    try {
      const response = await request("/project?limit=1");
      const list = unwrapList(response);
      if (list.length > 0) return String(list[0].uuid ?? list[0].id ?? "");
      return null;
    } catch {
      return null;
    }
  },

  create: (form: AgreementForm) =>
    request("/project-agreement", { method: "POST", body: JSON.stringify(toPayload(form, true)) }),

  update: (uuid: string, form: AgreementForm) =>
    request(`/project-agreement/${encodeURIComponent(uuid)}`, {
      method: "PATCH",
      body: JSON.stringify(toPayload(form, false)),
    }),

  remove: (uuid: string) =>
    request(`/project-agreement/${encodeURIComponent(uuid)}`, { method: "DELETE" }),

  restore: (uuid: string) =>
    request(`/project-agreement/${encodeURIComponent(uuid)}/restore`, { method: "PATCH" }),
};

/* ==========================================================================
   UI CONSTANTS & HELPERS
   ========================================================================== */

const typeLabel: Record<AgreementType, string> = {
  Service: "Service", Partnership: "Partnership", Investment: "Investment", Other: "Other",
};
const typeTone: Record<AgreementType, string> = {
  Service: "bg-sky-50 text-sky-700 ring-sky-200",
  Partnership: "bg-violet-50 text-violet-700 ring-violet-200",
  Investment: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Other: "bg-amber-50 text-amber-700 ring-amber-200",
};
const statusMeta: Record<AgreementStatus, { label: string; cls: string; dot: string; icon: any }> = {
  Active: { label: "Active", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", icon: CheckCircle2 },
  Expired: { label: "Expired", cls: "bg-slate-100 text-slate-600 ring-slate-300", dot: "bg-slate-400", icon: AlertTriangle },
  Terminated: { label: "Terminated", cls: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-500", icon: Ban },
};

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";
const labelCls = "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500";
const money = (value: number) => `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Modal({ title, subtitle, onClose, children, maxW = "max-w-xl" }: any) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`flex max-h-[90vh] w-full ${maxW} flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 break-all font-mono text-[11px] text-slate-400">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ==========================================================================
   PAGE COMPONENT
   ========================================================================== */

function AgreementsInner() {
  const searchParams = useSearchParams();
  const projectUuid = searchParams.get("projectUuid") || undefined;

  const [items, setItems] = useState<ProjectAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  
  const [parties, setParties] = useState<PartyOption[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [form, setForm] = useState<AgreementForm>(emptyForm(projectUuid));
  const [viewItem, setViewItem] = useState<ProjectAgreement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectAgreement | null>(null);
  const [notice, setNotice] = useState<{ id: number; type: "ok" | "err"; msg: string; undo?: () => Promise<void> } | null>(null);

  const notify = useCallback((type: "ok" | "err", msg: string, undo?: () => Promise<void>) => {
    setNotice({ id: Date.now(), type, msg, undo });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await api.list(projectUuid));
    } catch (err: any) {
      setError(err.message || "Failed to load agreements");
    } finally {
      setLoading(false);
    }
  }, [projectUuid]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    let mounted = true;
    api.parties().then((result) => { if (mounted) setParties(result); }).catch(() => { if (mounted) setParties([]); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice((cur) => (cur?.id === notice.id ? null : cur)), notice.undo ? 7000 : 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const partyMap = useMemo(() => {
    const map: Record<string, string> = {};
    parties.forEach((p) => { map[p.uuid] = p.label; });
    return map;
  }, [parties]);

  const openCreate = () => {
    setEditingUuid(null);
    setForm(emptyForm(projectUuid));
    setFormOpen(true);
  };

  const openEdit = (agreement: ProjectAgreement) => {
    setEditingUuid(agreement.uuid);
    setForm({
      code: agreement.code,
      partyUuid: agreement.partyUuid || "",
      type: agreement.type,
      signedAt: agreement.signedAt || today(),
      startAt: agreement.startAt || today(),
      endAt: agreement.endAt || "",
      value: String(agreement.value),
      status: agreement.status,
      notes: agreement.notes || "",
      agreementFile: agreement.agreementFile || "",
      projectUuid: agreement.projectUuid || projectUuid || "",
    });
    setFormOpen(true);
  };

  const closeForm = () => { if (!busy) { setFormOpen(false); setEditingUuid(null); } };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // ✅ অটো projectUuid (যদি ফর্মে ফাঁকা থাকে)
    let finalProjectUuid = form.projectUuid.trim();
    if (!finalProjectUuid) {
      const autoUuid = await api.projects();
      if (autoUuid) {
        finalProjectUuid = autoUuid;
      } else {
        return notify("err", "No project found. Please create a project first.");
      }
    }

    if (!form.code.trim()) return notify("err", "Agreement code is required.");
    if (!form.partyUuid.trim()) return notify("err", "Please select a Party from the dropdown.");
    if (!form.signedAt || !form.startAt) return notify("err", "Dates are required.");
    if (form.endAt && form.endAt < form.startAt) return notify("err", "End date cannot be earlier than start date.");

    setBusy(true);
    try {
      const finalForm = { ...form, projectUuid: finalProjectUuid };
      if (editingUuid) await api.update(editingUuid, finalForm);
      else await api.create(finalForm);
      
      setFormOpen(false);
      setEditingUuid(null);
      notify("ok", editingUuid ? "Agreement updated successfully." : "Agreement created successfully.");
      await load();
    } catch (err: any) {
      notify("err", err.message || "Failed to save agreement.");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setBusy(true);
    try {
      await api.remove(target.uuid);
      setDeleteTarget(null);
      setItems((prev) => prev.filter((item) => item.uuid !== target.uuid));
      notify("ok", "Agreement deleted.", async () => {
        try { await api.restore(target.uuid); notify("ok", "Restored successfully."); await load(); }
        catch (err: any) { notify("err", err.message || "Restore failed."); }
      });
    } catch (err: any) {
      notify("err", err.message || "Failed to delete.");
    } finally {
      setBusy(false);
    }
  };

  const openView = async (agreement: ProjectAgreement) => {
    setViewItem(agreement);
    try { setViewItem(await api.get(agreement.uuid)); }
    catch (err: any) { notify("err", err.message || "Could not load details."); }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !query || item.code.toLowerCase().includes(query) || item.party.toLowerCase().includes(query) || (item.notes || "").toLowerCase().includes(query);
      return matchesSearch && (typeFilter === "All" || item.type === typeFilter) && (statusFilter === "All" || item.status === statusFilter);
    });
  }, [items, search, typeFilter, statusFilter]);

  const totalValue = filtered.reduce((sum, item) => sum + item.value, 0);
  const activeCount = items.filter((item) => item.status === "Active").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 p-4 font-sans text-slate-800 sm:p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <nav className="mb-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link href="/projects" className="flex items-center hover:text-indigo-600"><Home className="mr-1 h-4 w-4" /> Projects</Link>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <span>{projectUuid || "All projects"}</span>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <span className="font-semibold text-slate-900">Agreements</span>
          </nav>
          <h1 className="bg-gradient-to-r from-slate-900 to-indigo-700 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">Agreements & Contracts</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:-translate-y-0.5">
            <Plus className="h-4 w-4" /> Create Agreement
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Portfolio Value", value: loading ? "—" : money(totalValue), icon: DollarSign, tone: "from-indigo-500 to-violet-500" },
          { label: "Active Contracts", value: loading ? "—" : activeCount, icon: CheckCircle2, tone: "from-emerald-500 to-teal-500" },
          { label: "Total Agreements", value: loading ? "—" : items.length, icon: FileText, tone: "from-sky-500 to-cyan-500" },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{kpi.label}</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">{kpi.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${kpi.tone} text-white shadow-md`}><Icon className="h-6 w-6" /></div>
            </div>
          );
        })}
      </div>

      {/* Table Area */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/60 ring-1 ring-slate-200/70">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`${inputCls} !w-auto`}>
              <option value="All">All Types</option>
              {Object.keys(typeLabel).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputCls} !w-auto`}>
              <option value="All">All Statuses</option>
              {Object.keys(statusMeta).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input placeholder="Search party, code..." value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputCls} pl-10`} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">Code</th>
                <th className="px-5 py-3.5">Party</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Term</th>
                <th className="px-5 py-3.5">Value</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr><td colSpan={7} className="py-14 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-600" /></td></tr>
              ) : filtered.length > 0 ? (
                filtered.map((a) => (
                  <tr key={a.uuid} className="hover:bg-indigo-50/40">
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-indigo-600">{a.code || a.uuid.slice(0, 8)}</td>
                    
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-sm font-bold text-indigo-700">
                          {(partyMap[a.partyUuid || ""] || a.party || "?")[0].toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900">
                          {partyMap[a.partyUuid || ""] || a.party || a.partyUuid?.slice(0, 8) || "—"}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4"><span className={`rounded-lg px-2 py-1 text-xs font-semibold ring-1 ${typeTone[a.type]}`}>{a.type}</span></td>
                    <td className="px-5 py-4 text-xs text-slate-600">{a.startAt} → {a.endAt || "Open"}</td>
                    <td className="px-5 py-4 font-bold text-slate-900">{money(a.value)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ring-1 ${statusMeta[a.status].cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusMeta[a.status].dot}`} /> {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => void openView(a)} className="p-2 text-indigo-600 hover:bg-indigo-50"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => openEdit(a)} className="p-2 text-slate-600 hover:bg-slate-100"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteTarget(a)} className="p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="py-14 text-center text-slate-400">No agreements found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {formOpen && (
        <Modal title={editingUuid ? "Edit Agreement" : "Create Agreement"} onClose={closeForm}>
          <form onSubmit={submit} className="p-6 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Agreement Code *</label><input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputCls} placeholder="AGR-001" /></div>
              <div>
                <label className={labelCls}>Status *</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AgreementStatus })} className={inputCls}>
                  {Object.keys(statusMeta).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            
            <div>
              <label className={labelCls}>Party *</label>
              <select required value={form.partyUuid} onChange={(e) => setForm({ ...form, partyUuid: e.target.value })} className={inputCls}>
                <option value="">Select party...</option>
                {parties.map((p) => <option key={p.uuid} value={p.uuid}>{p.label}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>Agreement Type *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AgreementType })} className={inputCls}>
                {Object.keys(typeLabel).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div><label className={labelCls}>Signed Date *</label><input type="date" required value={form.signedAt} onChange={(e) => setForm({ ...form, signedAt: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Start Date *</label><input type="date" required value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>End Date</label><input type="date" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} className={inputCls} /></div>
            </div>

            <div><label className={labelCls}>Contract Value ($) *</label><input type="number" min="0" step="0.01" required value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>Notes</label><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} /></div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <button type="button" onClick={closeForm} className="rounded-xl border px-5 py-2.5 text-sm">Cancel</button>
              <button type="submit" disabled={busy} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm text-white">{busy ? "Saving..." : "Save Agreement"}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Modal */}
      {viewItem && (
        <Modal title="Agreement Details" onClose={() => setViewItem(null)}>
          <div className="p-6 space-y-2">
            <p><b>Code:</b> {viewItem.code}</p>
            <p><b>Party:</b> {partyMap[viewItem.partyUuid || ""] || viewItem.party || "—"}</p>
            <p><b>Type:</b> {viewItem.type}</p>
            <p><b>Status:</b> {viewItem.status}</p>
            <p><b>Value:</b> {money(viewItem.value)}</p>
            <p><b>Dates:</b> {viewItem.startAt} to {viewItem.endAt || "Open"}</p>
            <button onClick={() => setViewItem(null)} className="mt-4 w-full border py-2 rounded-xl text-sm">Close</button>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <Modal title="Delete Agreement?" onClose={() => setDeleteTarget(null)}>
          <div className="p-6 text-center">
            <p>Delete <b>{deleteTarget.code}</b>?</p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="rounded-xl border px-4 py-2 text-sm">Cancel</button>
              <button onClick={() => void confirmDelete()} disabled={busy} className="rounded-xl bg-rose-600 px-4 py-2 text-sm text-white">{busy ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {notice && (
        <div className="fixed bottom-6 right-6 flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl">
          {notice.type === "ok" ? <CheckCircle2 className="text-emerald-400" /> : <AlertCircle className="text-rose-400" />}
          <span>{notice.msg}</span>
        </div>
      )}
    </div>
  );
}

export default function ProjectAgreementsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>}>
      <AgreementsInner />
    </Suspense>
  );
}