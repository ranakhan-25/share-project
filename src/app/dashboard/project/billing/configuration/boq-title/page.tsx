/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Home,
  ChevronRight,
  Plus,
  ArrowLeft,
  Edit3,
  Trash2,
  X,
  Loader2,
  Save,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import PredictiveSearchSelect from "@/components/ui/PredictiveSearchSelect";
import { getStoredUser, getStoredAccessToken } from "@/lib/admin-auth/adminAuthStorage";

// ==================== TYPES ====================
export interface BoqTitleItem {
  id: number | string;
  uuid: string;
  projectId: string;
  projectName?: string;
  title: string;
  status?: string;
  createdBy?: string;
}

interface ProjectOption {
  uuid: string;
  name: string;
}

// ==================== API CONFIG ====================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PREFIX = "/realbizpro/api/v1";

const BOQ_API = `${API_BASE_URL}${API_PREFIX}/boq`;
const PROJECT_API = `${API_BASE_URL}${API_PREFIX}/project`;

function getAuthHeaders(): Record<string, string> {
  const token =
    getStoredAccessToken() ||
    (typeof window !== "undefined"
      ? localStorage.getItem("share-project:access-token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken")
      : null);
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const entriesOptions = [
  { value: "10", label: "10 entries" },
  { value: "25", label: "25 entries" },
  { value: "50", label: "50 entries" },
];

export default function BoqTitleListPage() {
  const [storedUser, setStoredUser] = useState<any>(null);
  useEffect(() => {
    setStoredUser(getStoredUser());
  }, []);
  const userEmail = (storedUser?.email || "").toLowerCase().trim();

  const [items, setItems] = useState<BoqTitleItem[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BoqTitleItem | null>(null);

  const [formData, setFormData] = useState({
    projectId: "",
    title: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ==================== FETCH PROJECTS ====================
  const fetchProjectsList = async (): Promise<ProjectOption[]> => {
    try {
      const res = await fetch(`${PROJECT_API}?page=1&limit=100`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return [];
      const json = await res.json();
      const rows = json?.data?.data ?? (Array.isArray(json?.data) ? json.data : null) ?? [];
      const activeEmail = (getStoredUser()?.email || userEmail || "").toLowerCase().trim();
      const userProjects = activeEmail
        ? rows.filter((p: any) => {
            const raw = p.raw || p || {};
            const creator = String(
              raw.createdBy || raw.clientEmail || raw.email || raw.userEmail || ""
            ).toLowerCase().trim();
            return creator === activeEmail;
          })
        : rows;

      return Array.isArray(userProjects)
        ? userProjects
            .filter((p: any) => p?.uuid || p?.id)
            .map((p: any) => ({
              uuid: String(p.uuid || p.id),
              name: String(p.name || p.projectName || p.code || "Unnamed"),
            }))
        : [];
    } catch (err) {
      console.error("fetchProjects error:", err);
      return [];
    }
  };

  // ==================== FETCH BOQ TITLES ====================
  const fetchBoqTitlesList = async (): Promise<BoqTitleItem[]> => {
    const res = await fetch(`${BOQ_API}?page=1&limit=100`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || `Failed to fetch boq titles: ${res.status}`);
    }
    const json = await res.json();
    const rows = json?.data?.data ?? json?.data ?? [];
    const activeEmail = (getStoredUser()?.email || userEmail || "").toLowerCase().trim();
    const userProjUuids = new Set(projects.map(p => p.uuid));

    return Array.isArray(rows)
      ? rows
          .filter((item: any) => !item.deletedAt)
          .filter((item: any) => {
            if (!activeEmail) return true;
            const belongsToProj = item.projectId && userProjUuids.has(item.projectId);
            const creator = String(item.createdBy || "").toLowerCase().trim();
            return belongsToProj || creator === activeEmail;
          })
          .map((item: any) => ({
            id: item.id ?? item.uuid,
            uuid: item.uuid,
            projectId: item.projectId || item.project?.uuid || "",
            projectName: item.project?.name || "Share Tower 1",
            title: item.titleOfWork || item.title || "",
            status: item.status || "active",
            createdBy: item.createdBy || activeEmail,
          }))
      : [];
  };

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBoqTitlesList();
      setItems(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load boq titles");
    } finally {
      setLoading(false);
    }
  }, [projects.length, userEmail]);

  useEffect(() => {
    fetchProjectsList().then(setProjects);
  }, [userEmail]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // ==================== FILTER ====================
  const filtered = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.projectName?.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginated = filtered.slice(startIndex, startIndex + entriesPerPage);

  const projectOptions = projects.map(p => ({ value: p.uuid, label: p.name }));

  // ==================== RESET ====================
  const resetForm = () => {
    setFormData({ projectId: projects[0]?.uuid || "", title: "" });
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item: BoqTitleItem) => {
    setEditingItem(item);
    setFormData({
      projectId: item.projectId || projects[0]?.uuid || "",
      title: item.title || "",
    });
    setFormError(null);
  };

  // ==================== CREATE ====================
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const projectId = formData.projectId || projects[0]?.uuid;
    if (!projectId) {
      setFormError("Project is required");
      return;
    }
    if (!formData.title.trim()) {
      setFormError("BOQ Title is required");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const activeEmail = (getStoredUser()?.email || userEmail || "sharetest@realbiz.com").toLowerCase().trim();

      const payload = {
        projectId,
        titleOfWork: formData.title,
        task: formData.title,
        date: new Date().toISOString().slice(0, 10),
        budget: 0,
        percentageOfTotalBudget: 0,
        perSftBudget: 0,
        cost: 0,
        available: 0,
        createdBy: activeEmail,
      };

      const res = await fetch(BOQ_API, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Create BOQ title failed");
      }

      toast.success("Created successfully!");
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

    const projectId = formData.projectId || projects[0]?.uuid;
    if (!projectId) {
      setFormError("Project is required");
      return;
    }
    if (!formData.title.trim()) {
      setFormError("BOQ Title is required");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const activeEmail = (getStoredUser()?.email || userEmail || "sharetest@realbiz.com").toLowerCase().trim();

      const payload = {
        projectId,
        titleOfWork: formData.title,
        task: formData.title,
        date: new Date().toISOString().slice(0, 10),
        createdBy: activeEmail,
      };

      const res = await fetch(`${BOQ_API}/${editingItem.uuid}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Update BOQ title failed");
      }

      toast.success("Updated successfully!");
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
    if (!window.confirm(`Delete BOQ title "${item.title}"?`)) return;
    try {
      const res = await fetch(`${BOQ_API}/${item.uuid}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Deleted successfully!");
      setItems((prev) => prev.filter((c) => c.uuid !== item.uuid));
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      <div className="mx-auto max-w-[1600px] space-y-5">
        
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <nav className="flex items-center text-xs sm:text-sm text-slate-500 gap-1.5 sm:gap-2 mb-1">
              <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Dashboard</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Project</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Billing Configuration</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                BOQ Title
              </span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              BOQ Title Configuration / বিওকিউ টাইটেল কনফিগারেশন
            </h1>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 hover:shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> + BOQ Title Add
          </button>
        </div>

        {/* Table Container */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="w-36">
              <PredictiveSearchSelect
                options={entriesOptions}
                value={String(entriesPerPage)}
                onChange={(val) => {
                  setEntriesPerPage(Number(val));
                  setCurrentPage(1);
                }}
                placeholder="Entries"
              />
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search..."
                className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
          ) : (
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-xs sm:text-sm text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white text-xs font-bold uppercase tracking-wider">
                    {["ID", "PROJECT", "BOQ TITLE / WORK NAME", "STATUS", "ADDED BY", "ACTION"].map(h => (
                      <th key={h} className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700 font-medium">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-slate-400">
                        No BOQ title records available
                      </td>
                    </tr>
                  ) : (
                    paginated.map((item, index) => (
                      <tr key={item.uuid || index} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">{startIndex + index + 1}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{item.projectName || "Share Tower 1"}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{item.title}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {item.status || "active"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{item.createdBy || userEmail}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="rounded-lg bg-teal-50 p-1.5 text-teal-600 transition hover:bg-teal-100 active:scale-95"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="rounded-lg bg-rose-50 p-1.5 text-rose-600 transition hover:bg-rose-100 active:scale-95"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer / Pagination */}
          <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
            <div>
              Showing {filtered.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + entriesPerPage, filtered.length)} of {filtered.length} entries
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
              >
                Previous
              </button>
              <button className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold">{currentPage}</button>
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: ADD / EDIT */}
      {(isAddOpen || editingItem) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-100 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-800">
                {editingItem ? "Edit BOQ Title" : "New BOQ Title"}
              </h3>
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingItem(null);
                }}
                className="p-1 hover:bg-slate-200 rounded-lg transition text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingItem ? handleEditSubmit : handleCreateSubmit} className="p-6 space-y-4 text-xs bg-white">
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project *</label>
                  <PredictiveSearchSelect
                    options={projectOptions}
                    value={formData.projectId}
                    onChange={(val) => setFormData(prev => ({ ...prev, projectId: val }))}
                    placeholder="Select Project"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">BOQ Title / Name of Work *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Sub-structure RCC Works"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition shadow-xs flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Save Title
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
