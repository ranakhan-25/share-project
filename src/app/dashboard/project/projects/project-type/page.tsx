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

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"
).replace(/\/+$/, "");
const API_URL = `${API_BASE}/realbizpro/api/v1/project-type`;

type ProjectTypeItem = {
  id: number;
  uuid: string;
  code: string;
  name: string;
};

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
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

function getRows(value: unknown): ProjectTypeItem[] {
  let data = value;
  if (data && typeof data === "object" && "data" in data) {
    data = (data as { data: unknown }).data;
  }
  if (data && typeof data === "object" && "data" in data) {
    data = (data as { data: unknown }).data;
  }
  return Array.isArray(data) ? (data as ProjectTypeItem[]) : [];
}

export default function ProjectTypePage() {
  const [projectTypes, setProjectTypes] = useState<ProjectTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectTypeItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectTypeItem | null>(null);
  const [codeValue, setCodeValue] = useState("");
  const [nameValue, setNameValue] = useState("");

  const loadProjectTypes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await request<unknown>(`${API_URL}?page=1&limit=100`);
      setProjectTypes(getRows(response));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not load project types.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjectTypes();
  }, [loadProjectTypes]);

  const filteredProjectTypes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return projectTypes;
    return projectTypes.filter((item) =>
      [item.id, item.code, item.name].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [projectTypes, searchTerm]);

  function handleOpenCreate() {
    setEditingItem(null);
    setCodeValue(`P${Math.floor(1000000 + Math.random() * 9000000)}`);
    setNameValue("");
    setError("");
    setIsModalOpen(true);
  }

  function handleOpenEdit(item: ProjectTypeItem) {
    setEditingItem(item);
    setCodeValue(item.code);
    setNameValue(item.name);
    setError("");
    setIsModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await request(
        editingItem
          ? `${API_URL}/${encodeURIComponent(editingItem.uuid)}`
          : API_URL,
        {
          method: editingItem ? "PATCH" : "POST",
          body: JSON.stringify({
            code: codeValue.trim(),
            name: nameValue.trim(),
          }),
        },
      );
      setIsModalOpen(false);
      setEditingItem(null);
      await loadProjectTypes();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save project type.",
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
        `${API_URL}/${encodeURIComponent(deleteTarget.uuid)}`,
        { method: "DELETE" },
      );
      setDeleteTarget(null);
      await loadProjectTypes();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not delete project type.",
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
                Project Type
              </span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Project Type
            </h1>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 hover:shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Project Type</span>
          </button>
        </div>

        {error && !isModalOpen && !deleteTarget && (
          <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="Dismiss error" className="text-rose-500 hover:text-rose-700">×</button>
          </div>
        )}

        {/* ====================== TABLE CONTAINER ====================== */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button type="button" className="inline-flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 sm:w-auto">
              Select Columns <ChevronDown className="ml-2 h-4 w-4 text-slate-500" />
            </button>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search..."
                className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10"
                aria-label="Search project types"
              />
            </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-xs sm:text-sm text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white text-xs font-bold uppercase tracking-wider">
                  <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">ID</th>
                  <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">CODE</th>
                  <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">NAME</th>
                  <th className="px-4 py-3.5 font-semibold text-white text-center tracking-wide">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700 font-medium">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-16 text-center text-slate-400">Loading project types...</td></tr>
                ) : filteredProjectTypes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-16 text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p className="text-sm font-medium">No matching records found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProjectTypes.map((item) => (
                    <tr key={item.uuid} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{item.id}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.code}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{item.name}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button type="button" onClick={() => handleOpenEdit(item)} className="rounded-lg bg-teal-50 p-1.5 text-teal-600 transition hover:bg-teal-100 active:scale-95" title="Edit">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => { setError(""); setDeleteTarget(item); }} className="rounded-lg bg-rose-50 p-1.5 text-rose-600 transition hover:bg-rose-100 active:scale-95" title="Delete">
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
              Showing {filteredProjectTypes.length > 0 ? 1 : 0} to {filteredProjectTypes.length} of {filteredProjectTypes.length} entries
            </span>
            <div className="flex items-center gap-1.5">
              <button
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed"
                disabled
              >
                Previous
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold shadow-2xs">
                1
              </button>
              <button
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed"
                disabled
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs">
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editingItem ? "Edit Project Type" : "Create Project Type"}</h2>
              <button type="button" disabled={saving} onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Code</label>
                <input value={codeValue} maxLength={50} onChange={(event) => setCodeValue(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name *</label>
                <input required maxLength={255} value={nameValue} onChange={(event) => setNameValue(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10" />
              </div>
              <div className="flex justify-end gap-2 border-t pt-4">
                <button type="button" disabled={saving} onClick={() => setIsModalOpen(false)} className="rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 transition">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition disabled:opacity-50">{saving ? "Saving..." : editingItem ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Delete Project Type</h2>
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
