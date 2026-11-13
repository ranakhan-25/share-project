"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { getStoredAccessToken } from "@/lib/admin-auth/adminAuthStorage";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"
).replace(/\/+$/, "");
const API_ROOT = `${API_BASE}/realbizpro/api/v1`;
const SITES_API = `${API_ROOT}/project-sites`;
const PROJECTS_API = `${API_ROOT}/project`;

type ProjectOption = {
  uuid: string;
  name: string;
  code?: string;
};

type SiteItem = {
  id: number;
  uuid: string;
  code: string;
  projectId: string;
  project?: ProjectOption;
  name: string;
  description?: string | null;
  location?: string | null;
};

type SiteForm = {
  code: string;
  projectId: string;
  name: string;
  description: string;
  location: string;
};

const EMPTY_FORM: SiteForm = {
  code: "",
  projectId: "",
  name: "",
  description: "",
  location: "",
};

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? getStoredAccessToken() : null;
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const text = await response.text();
  let body: unknown;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    const payload =
      body && typeof body === "object"
        ? (body as Record<string, unknown>)
        : undefined;
    const message = payload?.message;
    throw new Error(
      Array.isArray(message)
        ? message.join(", ")
        : typeof message === "string"
          ? message
          : typeof body === "string"
            ? body
            : `Request failed (${response.status})`,
    );
  }

  return body as T;
}

function unwrap(value: unknown): unknown {
  if (value && typeof value === "object" && "data" in value) {
    return (value as { data: unknown }).data;
  }
  return value;
}

function rowsFrom<T>(value: unknown): T[] {
  const data = unwrap(value);
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "data" in data) {
    const rows = (data as { data: unknown }).data;
    return Array.isArray(rows) ? (rows as T[]) : [];
  }
  return [];
}

export default function SitePage() {
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesCount, setEntriesCount] = useState(10);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SiteItem | null>(null);
  const [form, setForm] = useState<SiteForm>(EMPTY_FORM);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [siteResponse, projectResponse] = await Promise.all([
        request<unknown>(`${SITES_API}?page=1&limit=100`),
        request<unknown>(`${PROJECTS_API}?page=1&limit=100`),
      ]);
      setSites(rowsFrom<SiteItem>(siteResponse));
      setProjects(rowsFrom<ProjectOption>(projectResponse));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load project sites.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredSites = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return sites;
    return sites.filter((site) =>
      [
        site.id,
        site.code,
        site.name,
        site.location,
        site.description,
        site.project?.name,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [sites, searchTerm]);

  const pageCount = Math.max(1, Math.ceil(filteredSites.length / entriesCount));
  const currentPage = Math.min(page, pageCount);
  const visibleSites = filteredSites.slice(
    (currentPage - 1) * entriesCount,
    currentPage * entriesCount,
  );

  function openCreate() {
    setEditingSite(null);
    setForm({
      ...EMPTY_FORM,
      code: `P${Math.floor(1000000 + Math.random() * 9000000)}`,
    });
    setError("");
    setIsModalOpen(true);
  }

  function openEdit(site: SiteItem) {
    setEditingSite(site);
    setForm({
      code: site.code ?? "",
      projectId: site.projectId ?? "",
      name: site.name ?? "",
      description: site.description ?? "",
      location: site.location ?? "",
    });
    setError("");
    setIsModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");

    const payload = {
      code: form.code.trim(),
      projectId: form.projectId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      location: form.location.trim() || null,
    };

    try {
      await request(
        editingSite
          ? `${SITES_API}/${encodeURIComponent(editingSite.uuid)}`
          : SITES_API,
        {
          method: editingSite ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      setIsModalOpen(false);
      setEditingSite(null);
      setForm(EMPTY_FORM);
      await loadData();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save the site.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setError("");
    try {
      await request(
        `${SITES_API}/${encodeURIComponent(deleteTarget.uuid)}`,
        { method: "DELETE" },
      );
      setDeleteTarget(null);
      await loadData();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not delete the site.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      <div className="mx-auto max-w-[1600px] space-y-5">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <nav className="flex items-center text-xs sm:text-sm text-slate-500 gap-1.5 sm:gap-2 mb-1">
              <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Home</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Project</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                Site
              </span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Project Sites
            </h1>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 hover:shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Site</span>
          </button>
        </div>

        {error && !isModalOpen && !deleteTarget && (
          <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="Dismiss error" className="text-rose-500 hover:text-rose-700">
              ×
            </button>
          </div>
        )}

        {/* ====================== TABLE CONTAINER ====================== */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center text-xs sm:text-sm text-slate-600 space-x-2">
              <span>Show</span>
              <select
                value={entriesCount}
                onChange={(event) => {
                  setEntriesCount(Number(event.target.value));
                  setPage(1);
                }}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
              >
                {[10, 25, 50, 100].map((count) => (
                  <option key={count} value={count}>{count}</option>
                ))}
              </select>
              <span>entries</span>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                placeholder="Search..."
                className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10"
                aria-label="Search sites"
              />
            </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-xs sm:text-sm text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white text-xs font-bold uppercase tracking-wider">
                  <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">ID</th>
                  <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">CODE</th>
                  <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">PROJECT</th>
                  <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">NAME</th>
                  <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">DESCRIPTION</th>
                  <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">LOCATION</th>
                  <th className="px-4 py-3.5 font-semibold text-white text-center tracking-wide">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700 font-medium">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-16 text-center text-slate-400">Loading sites...</td></tr>
                ) : visibleSites.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p className="text-sm font-medium">No project sites found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleSites.map((site) => (
                    <tr key={site.uuid} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{site.id}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{site.code}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{site.project?.name ?? "—"}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{site.name}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{site.description ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{site.location ?? "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button type="button" onClick={() => openEdit(site)} className="rounded-lg bg-teal-50 p-1.5 text-teal-600 transition hover:bg-teal-100 active:scale-95" title="Edit">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => { setError(""); setDeleteTarget(site); }} className="rounded-lg bg-rose-50 p-1.5 text-rose-600 transition hover:bg-rose-100 active:scale-95" title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
            <span>
              Showing {filteredSites.length ? (currentPage - 1) * entriesCount + 1 : 0} to{" "}
              {Math.min(currentPage * entriesCount, filteredSites.length)} of {filteredSites.length} entries
            </span>
            <div className="flex items-center gap-1.5">
              <button 
                type="button" 
                disabled={currentPage <= 1} 
                onClick={() => setPage((value) => value - 1)} 
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold shadow-2xs">
                {currentPage} / {pageCount}
              </span>
              <button 
                type="button" 
                disabled={currentPage >= pageCount} 
                onClick={() => setPage((value) => value + 1)} 
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs">
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">{editingSite ? "Edit Site" : "Add Site"}</h2>
              <button type="button" disabled={saving} onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="max-h-[75vh] space-y-4 overflow-y-auto px-6 py-5">
                {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Code *</label>
                    <input required maxLength={50} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Project *</label>
                    <select required value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 cursor-pointer">
                      <option value="">Select Project</option>
                      {projects.map((project) => <option key={project.uuid} value={project.uuid}>{project.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Name *</label>
                    <input required maxLength={255} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Location</label>
                    <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Description</label>
                  <textarea rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10" />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t px-6 py-4">
                <button type="button" disabled={saving} onClick={() => setIsModalOpen(false)} className="rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 transition">Close</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition disabled:opacity-50">{saving ? "Saving..." : "Submit"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Delete Site</h2>
            <p className="mt-2 text-sm text-slate-600">Are you sure you want to delete <strong>{deleteTarget.name}</strong>?</p>
            {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" disabled={deleting} onClick={() => { setDeleteTarget(null); setError(""); }} className="rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 transition">Cancel</button>
              <button type="button" disabled={deleting} onClick={() => void handleDelete()} className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition disabled:opacity-50">{deleting ? "Deleting..." : "Confirm Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
