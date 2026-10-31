/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Home,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Save,
  Folder,
} from "lucide-react";

// ==================== TYPES ====================
export interface BoqTitleItem {
  id: number | string;
  uuid: string;
  projectId: string;
  title: string;
  status?: string;
}

interface ProjectOption {
  uuid: string;
  name: string;
}

// ==================== API CONFIG ====================
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PREFIX = "/realbizpro/api/v1";

const BOQ_API = `${API_BASE_URL}${API_PREFIX}/boq`;
const PROJECT_API = `${API_BASE_URL}${API_PREFIX}/project`;

// ==================== API FUNCTIONS ====================
async function fetchProjects(): Promise<ProjectOption[]> {
  try {
    const query = new URLSearchParams({ page: "1", limit: "100" });
    const res = await fetch(`${PROJECT_API}?${query}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    const rows =
      json?.data?.data ?? (Array.isArray(json?.data) ? json.data : null) ?? [];
    return Array.isArray(rows)
      ? rows
          .filter((p: any) => p?.uuid)
          .map((p: any) => ({
            uuid: String(p.uuid),
            name: String(p.name || p.projectName || p.code || "Unnamed"),
          }))
      : [];
  } catch (err) {
    console.error("fetchProjects error:", err);
    return [];
  }
}

async function fetchBoqTitles(): Promise<BoqTitleItem[]> {
  const query = new URLSearchParams({ page: "1", limit: "100" });
  const res = await fetch(`${BOQ_API}?${query}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.message || `Failed to fetch boq titles: ${res.status}`,
    );
  }
  const json = await res.json();
  const rows = json?.data?.data ?? json?.data ?? [];

  return Array.isArray(rows)
    ? rows.map((item: any) => ({
        id: item.id ?? item.uuid,
        uuid: item.uuid,
        projectId: item.projectId || item.project?.uuid || "",
        title: item.titleOfWork || item.title || "",
        status: item.status || "active",
      }))
    : [];
}

async function createBoqTitle(payload: Record<string, any>) {
  console.log("POST payload →", payload);
  const res = await fetch(BOQ_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("POST error →", err);
    throw new Error(err?.message || "Create boq title failed");
  }
  return res.json();
}

async function updateBoqTitle(uuid: string, payload: Record<string, any>) {
  console.log("PUT", uuid, "payload →", payload);
  const res = await fetch(`${BOQ_API}/${uuid}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("PUT error →", err);
    throw new Error(err?.message || "Update boq title failed");
  }
  return res.json();
}

async function deleteBoqTitle(uuid: string) {
  const res = await fetch(`${BOQ_API}/${uuid}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Delete boq title failed");
  }
  return res.json().catch(() => ({}));
}

// ==================== MAIN PAGE ====================
export default function BoqTitleListPage() {
  const [items, setItems] = useState<BoqTitleItem[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [actionLoading, setActionLoading] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BoqTitleItem | null>(null);

  const [formData, setFormData] = useState({
    projectId: "",
    title: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ==================== LOAD ====================
  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBoqTitles();
      setItems(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load boq titles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
    fetchProjects()
      .then(setProjects)
      .catch((e) => console.error("projects:", e));
  }, [loadItems]);

  // ==================== FILTER ====================
  const filtered = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginated = filtered.slice(startIndex, startIndex + entriesPerPage);

  // ==================== RESET ====================
  const resetForm = () => {
    setFormData({ projectId: "", title: "" });
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item: BoqTitleItem) => {
    setEditingItem(item);
    setFormData({
      projectId: item.projectId || "",
      title: item.title || "",
    });
    setFormError(null);
  };

  // ==================== CREATE ====================
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectId) {
      setFormError("Project is required");
      return;
    }
    if (!formData.title.trim()) {
      setFormError("Boq Title is required");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const now = new Date().toISOString();

      await createBoqTitle({
        projectId: formData.projectId,
        titleOfWork: formData.title,
        task: formData.title,
        date: now,
        budget: 0,
        percentageOfTotalBudget: 0,
        perSftBudget: 0,
        cost: 0,
        available: 0,
      });

      setIsAddOpen(false);
      resetForm();
      await loadItems();
    } catch (err: any) {
      setFormError(err?.message || "Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== UPDATE ====================
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.uuid) return;

    if (!formData.projectId) {
      setFormError("Project is required");
      return;
    }
    if (!formData.title.trim()) {
      setFormError("Boq Title is required");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      await updateBoqTitle(editingItem.uuid, {
        projectId: formData.projectId,
        titleOfWork: formData.title,
        task: formData.title,
      });

      setEditingItem(null);
      resetForm();
      await loadItems();
    } catch (err: any) {
      setFormError(err?.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== DELETE ====================
  const handleDelete = async (item: BoqTitleItem) => {
    if (!item.uuid) return;
    if (!confirm(`Delete boq title "${item.title}"?`)) return;
    try {
      setActionLoading(true);
      await deleteBoqTitle(item.uuid);
      setItems((prev) => prev.filter((c) => c.uuid !== item.uuid));
    } catch (err: any) {
      alert(err?.message || "Delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-4">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1 hover:text-indigo-600 cursor-pointer">
              <Home className="w-3.5 h-3.5" />
              Home
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600">Accounts</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-indigo-600 font-semibold">
              Bog Title List
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 bg-[#5949d6] hover:bg-[#4d3ec2] text-white text-xs font-semibold px-4 py-2 rounded shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            +Title Add
          </button>
        </div>

        {/* TABLE CARD */}
        <div className="bg-white rounded border border-slate-200 shadow-2xs">
          {/* SHOW + SEARCH */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-3 gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">Search:</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-48 px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mx-3 mb-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded text-xs flex items-center justify-between">
              <span>{error}</span>
              <button onClick={loadItems} className="underline text-xs">
                Retry
              </button>
            </div>
          )}

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[#5949d6] text-white font-semibold uppercase tracking-wide">
                  <th className="py-2.5 px-3 w-16">SL</th>
                  <th className="py-2.5 px-3">PROJECT TYPE</th>
                  <th className="py-2.5 px-3">TITLE</th>
                  <th className="py-2.5 px-3 text-center w-28">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-10 text-slate-400"
                    >
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : paginated.length > 0 ? (
                  paginated.map((item, index) => (
                    <tr
                      key={item.uuid || item.id}
                      className="hover:bg-indigo-50/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-slate-600">
                        {startIndex + index + 1}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {item.projectId
                          ? projects.find((p) => p.uuid === item.projectId)
                              ?.name || "-"
                          : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800">
                        <div className="flex items-center gap-2">
                          <Folder className="w-3.5 h-3.5 text-slate-700" />
                          <span className="font-medium">{item.title}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit"
                            className="bg-cyan-400 hover:bg-cyan-500 text-white p-1.5 rounded transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            disabled={actionLoading}
                            title="Delete"
                            className="bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-10 text-slate-400 font-medium"
                    >
                      No boq titles found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-3 border-t border-slate-200 gap-2 text-xs text-slate-500">
            <div>
              Showing {filtered.length === 0 ? 0 : startIndex + 1} to{" "}
              {Math.min(startIndex + entriesPerPage, filtered.length)} of{" "}
              {filtered.length} entries
            </div>
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`px-3 py-1 rounded font-semibold ${
                    currentPage === p
                      ? "bg-[#5949d6] text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="px-3 py-1 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== ADD MODAL ==================== */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-800">Boq</h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateSubmit}
              className="p-5 space-y-4 text-xs"
            >
              {/* PROJECT */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Project <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) =>
                    setFormData({ ...formData, projectId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p.uuid} value={p.uuid}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* BOQ TITLE */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Boq Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Boq Title"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-5 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-[#5949d6] hover:bg-[#4d3ec2] text-white rounded font-semibold disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EDIT MODAL ==================== */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-800">
                Edit Boq — {editingItem.title}
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Project <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) =>
                    setFormData({ ...formData, projectId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p.uuid} value={p.uuid}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Boq Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Boq Title"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-5 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-[#5949d6] hover:bg-[#4d3ec2] text-white rounded font-semibold disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
