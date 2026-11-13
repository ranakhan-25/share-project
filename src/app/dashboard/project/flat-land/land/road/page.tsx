/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Loader2, Edit3, Trash2, Search, ChevronLeft, ChevronRight, Navigation } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PATH = `${API_BASE}/realbizpro/api/v1`;

const getAuthHeaders = (): Record<string, string> => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("share-project:access-token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken")
      : null;
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ====================== TYPES ======================
interface ProjectRoad {
  id: string;
  uuid: string;
  projectId: string;
  kind: string;
  name: string;
  size: string;
  details: string;
  project?: { name: string; uuid: string };
  deletedAt?: string;
}

export default function PropertyRoadPage() {
  const [dataList, setDataList] = useState<ProjectRoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectRoad | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [entriesLimit, setEntriesLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Dropdown Data
  const [projects, setProjects] = useState<any[]>([]);

  // Form Data
  const [formData, setFormData] = useState({
    projectId: "",
    name: "",
    size: "",
    details: "",
  });

  // ====================== FETCH LISTS ======================
  const fetchRoads = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_PATH}/land-infrastructure/roads`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setDataList((json.data?.data || json.data || []).filter((item: any) => !item.deletedAt));
      }
    } catch (err) {
      toast.error("Failed to load roads");
    } finally {
      setLoading(false);
    }
  };

  // ====================== FETCH DROPDOWNS ======================
  const fetchDropdowns = async () => {
    try {
      const resProj = await fetch(`${API_PATH}/project`, {
        headers: getAuthHeaders(),
      });
      const jsonProj = await resProj.json();
      if (jsonProj.success) setProjects(jsonProj.data?.data || jsonProj.data || []);
    } catch (err) {
      console.error("Error fetching dropdowns:", err);
    }
  };

  useEffect(() => {
    fetchRoads();
    fetchDropdowns();
  }, []);

  // ====================== SUBMIT (POST / PATCH) ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      projectId: formData.projectId,
      kind: "road",
      name: formData.name,
      size: formData.size || null,
      details: formData.details || null,
    };

    try {
      const isEdit = !!editingItem;
      const url = isEdit
        ? `${API_PATH}/land-infrastructure/roads/${editingItem!.uuid}`
        : `${API_PATH}/land-infrastructure/roads`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok || json.success) {
        toast.success(isEdit ? "Updated successfully!" : "Created successfully!");
        setIsModalOpen(false);
        setEditingItem(null);
        fetchRoads();
      } else {
        toast.error(json.message || "Failed to save");
      }
    } catch (err: any) {
      toast.error("Network Error");
    } finally {
      setSubmitting(false);
    }
  };

  // ====================== DELETE ======================
  const handleDelete = async (item: ProjectRoad) => {
    if (!window.confirm(`Delete Road "${item.name}"?`)) return;
    try {
      const res = await fetch(`${API_PATH}/land-infrastructure/roads/${item.uuid}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        toast.success("Deleted successfully!");
        setDataList((prev) => prev.filter((row) => row.uuid !== item.uuid));
      } else {
        toast.error("Failed to delete");
      }
    } catch (err) {
      toast.error("Error deleting");
    }
  };

  // ====================== OPEN MODAL ======================
  const handleCreate = () => {
    setFormData({
      projectId: "",
      name: "",
      size: "",
      details: "",
    });
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: ProjectRoad) => {
    setEditingItem(item);
    setFormData({
      projectId: item.projectId || "",
      name: item.name || "",
      size: item.size || "",
      details: item.details || "",
    });
    setIsModalOpen(true);
  };

  // ====================== FILTERING & PAGINATION ======================
  const filteredData = dataList.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.project?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredData.length / entriesLimit));
  const startIndex = (currentPage - 1) * entriesLimit;
  const paginatedData = filteredData.slice(startIndex, startIndex + entriesLimit);

  // ====================== RENDER ======================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 p-4 sm:p-6 font-sans text-slate-800">
      <div className="mx-auto max-w-7xl space-y-5">
        
        {/* Top Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Home</span>
              <span>/</span>
              <span>Flat/Land</span>
              <span>/</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                Property Road List
              </span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Property Road List
            </h1>
          </div>
          <button 
            onClick={handleCreate} 
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-100 transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" /> 
            <span>Road Add</span>
          </button>
        </header>

        {/* Filter / Search Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span>Show</span>
            <select 
              value={entriesLimit} 
              onChange={(e) => {
                setEntriesLimit(Number(e.target.value));
                setCurrentPage(1);
              }} 
              className="h-9 rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </label>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search road or project..." 
              value={search} 
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }} 
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
            />
          </div>
        </div>

        {/* List Table */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Loading roads...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5 text-center w-14">SL</th>
                    <th className="px-4 py-3.5">PROJECT NAME</th>
                    <th className="px-4 py-3.5">ROAD NO</th>
                    <th className="px-4 py-3.5 text-center w-28">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-500 text-xs font-medium">
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((item, index) => (
                      <tr key={item.uuid} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="px-4 py-3 text-center font-medium text-slate-500">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {item.project?.name || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                            <Navigation className="w-3 h-3 text-indigo-500" />
                            {item.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button 
                              onClick={() => handleEdit(item)} 
                              className="rounded-lg p-1.5 text-teal-600 hover:bg-teal-50 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(item)} 
                              className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
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

          {/* Footer Pagination Info */}
          <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs text-slate-600 font-medium">
            <div>
              Showing {filteredData.length ? startIndex + 1 : 0} to {Math.min(startIndex + entriesLimit, filteredData.length)} of {filteredData.length} entries
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-600 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>
              <span className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1 text-white font-semibold shadow-sm">
                {currentPage} / {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-600 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </footer>
        </div>
      </div>

      {/* ====================== ADD/EDIT MODAL ====================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editingItem ? "Edit Property Road" : "Property Road Add"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Name <span className="text-rose-500">*</span>
                </label>
                <select 
                  required 
                  value={formData.projectId} 
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })} 
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p.uuid} value={p.uuid}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Road No <span className="text-rose-500">*</span>
                </label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="Enter Road No (e.g., Road 1, Road 2)" 
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Size (Optional)
                </label>
                <input 
                  type="text" 
                  value={formData.size} 
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })} 
                  placeholder="e.g., 30 ft" 
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Details (Optional)
                </label>
                <textarea 
                  value={formData.details} 
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })} 
                  placeholder="Additional details" 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                  rows={3}
                />
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-100 transition-all hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} 
                  <span>Submit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
