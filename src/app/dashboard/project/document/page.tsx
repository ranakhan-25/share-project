/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  FileText,
  Search,
  Save,
  Loader2,
  ChevronRight,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import PredictiveSearchSelect from "@/components/ui/PredictiveSearchSelect";
import { getStoredUser, getStoredAccessToken } from "@/lib/admin-auth/adminAuthStorage";

interface DocumentItem {
  uuid: string;
  projectId: string;
  project?: { uuid: string; code: string; name: string };
  documentName: string;
  documentType: string;
  details?: string | null;
  rajuk?: string | null;
  createdBy?: string;
  createdAt?: string;
}

interface ProjectOption {
  uuid: string;
  name: string;
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"}/realbizpro/api/v1`
).replace(/\/+$/, "");

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

const DOC_TYPE_OPTIONS = [
  { value: "Legal", label: "Legal Document" },
  { value: "RAJUK Approval", label: "RAJUK Approval" },
  { value: "Architectural Drawing", label: "Architectural Drawing" },
  { value: "Structural Drawing", label: "Structural Drawing" },
  { value: "Soil Test Report", label: "Soil Test Report" },
  { value: "Fire Safety Clearance", label: "Fire Safety Clearance" },
  { value: "General", label: "General" },
];

const entriesOptions = [
  { value: "10", label: "10 entries" },
  { value: "25", label: "25 entries" },
  { value: "50", label: "50 entries" },
];

export default function DocumentationPage() {
  const [storedUser, setStoredUser] = useState<any>(null);
  useEffect(() => {
    setStoredUser(getStoredUser());
  }, []);
  const userEmail = (storedUser?.email || "").toLowerCase().trim();

  const [docList, setDocList] = useState<DocumentItem[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    projectId: "",
    documentName: "",
    documentType: "Legal",
    details: "",
    rajuk: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Load Projects
  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/project?page=1&limit=100`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const rows = json?.data?.data ?? json?.data ?? [];
        if (Array.isArray(rows)) {
          setProjects(
            rows
              .filter((p: any) => p?.uuid || p?.id)
              .map((p: any) => ({
                uuid: String(p.uuid || p.id),
                name: String(p.name || p.projectName || p.code || "Unnamed"),
              }))
          );
        }
      }
    } catch (err) {
      console.error("fetchProjects error:", err);
    }
  };

  // Load Documents
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/project-documents?page=1&limit=100`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Failed to load documents");
      }
      const json = await res.json();
      const rows = json?.data?.data ?? json?.data ?? [];
      const activeEmail = (getStoredUser()?.email || userEmail || "").toLowerCase().trim();

      const mapped: DocumentItem[] = (Array.isArray(rows) ? rows : [])
        .filter((item: any) => !item.deletedAt)
        .filter((item: any) => {
          if (!activeEmail) return true;
          const creator = String(item.createdBy || "").toLowerCase().trim();
          const pClient = String(item.project?.clientEmail || item.project?.createdBy || "").toLowerCase().trim();
          return !creator || creator === activeEmail || pClient === activeEmail;
        })
        .map((item: any) => ({
          uuid: item.uuid,
          projectId: item.projectId || item.project?.uuid || "",
          project: item.project
            ? { uuid: item.project.uuid, code: item.project.code || "", name: item.project.name || "" }
            : undefined,
          documentName: item.documentName || item.title || "",
          documentType: item.documentType || "General",
          details: item.details || null,
          rajuk: item.rajuk || null,
          createdBy: item.createdBy || activeEmail,
          createdAt: item.createdAt,
        }));

      setDocList(mapped);
    } catch (cause: any) {
      setError(cause?.message || "Could not load documents.");
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchProjects();
  }, [userEmail]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredDocuments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return docList.filter((item) => {
      const matchesProject = !projectFilter || item.projectId === projectFilter;
      const matchesSearch =
        !query ||
        [
          item.project?.name,
          item.documentName,
          item.documentType,
          item.details,
          item.rajuk,
        ].some((value) => value?.toLowerCase().includes(query));
      return matchesProject && matchesSearch;
    });
  }, [docList, projectFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedDocs = filteredDocuments.slice(startIndex, startIndex + entriesPerPage);

  const projectOptions = projects.map((p) => ({ value: p.uuid, label: p.name }));
  const filterProjectOptions = [{ value: "", label: "All Projects" }, ...projectOptions];

  const resetForm = () => {
    setFormData({
      projectId: projects[0]?.uuid || "",
      documentName: "",
      documentType: "Legal",
      details: "",
      rajuk: "",
    });
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc: DocumentItem) => {
    setEditingDoc(doc);
    setFormData({
      projectId: doc.projectId || projects[0]?.uuid || "",
      documentName: doc.documentName,
      documentType: doc.documentType || "Legal",
      details: doc.details || "",
      rajuk: doc.rajuk || "",
    });
    setFormError(null);
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId) {
      setFormError("Project is required.");
      return;
    }
    if (!formData.documentName.trim()) {
      setFormError("Document Name is required.");
      return;
    }

    try {
      setSaving(true);
      setFormError(null);
      const activeEmail = (getStoredUser()?.email || userEmail || "sharetest@realbiz.com").toLowerCase().trim();

      const payload = {
        projectId: formData.projectId,
        documentName: formData.documentName.trim(),
        documentType: formData.documentType || "General",
        details: formData.details.trim() || undefined,
        rajuk: formData.rajuk.trim() || undefined,
        createdBy: activeEmail,
      };

      const res = await fetch(`${API_BASE_URL}/project-documents`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Create document failed");
      }

      toast.success("Document created successfully!");
      setIsModalOpen(false);
      resetForm();
      await loadData();
    } catch (cause: any) {
      setFormError(cause?.message || "Could not save document.");
    } finally {
      setSaving(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc?.uuid) return;
    if (!formData.projectId) {
      setFormError("Project is required.");
      return;
    }
    if (!formData.documentName.trim()) {
      setFormError("Document Name is required.");
      return;
    }

    try {
      setSaving(true);
      setFormError(null);
      const activeEmail = (getStoredUser()?.email || userEmail || "sharetest@realbiz.com").toLowerCase().trim();

      const payload = {
        projectId: formData.projectId,
        documentName: formData.documentName.trim(),
        documentType: formData.documentType || "General",
        details: formData.details.trim() || undefined,
        rajuk: formData.rajuk.trim() || undefined,
        updatedBy: activeEmail,
      };

      const res = await fetch(`${API_BASE_URL}/project-documents/${editingDoc.uuid}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Update document failed");
      }

      toast.success("Document updated successfully!");
      setEditingDoc(null);
      resetForm();
      await loadData();
    } catch (cause: any) {
      setFormError(cause?.message || "Could not update document.");
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async (doc: DocumentItem) => {
    if (!doc.uuid) return;
    if (!window.confirm(`Delete document "${doc.documentName}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/project-documents/${doc.uuid}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Document deleted successfully!");
      setDocList((prev) => prev.filter((d) => d.uuid !== doc.uuid));
    } catch (cause: any) {
      toast.error(cause?.message || "Could not delete document.");
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
              <span className="font-semibold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                Documents
              </span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Project Documentation / প্রজেক্ট ডকুমেন্ট
            </h1>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 hover:shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> + Add New Document
          </button>
        </div>

        {/* Table Container */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-36">
                <PredictiveSearchSelect
                  options={entriesOptions}
                  value={String(entriesPerPage)}
                  onChange={(val) => {
                    setEntriesPerPage(Number(val));
                    setCurrentPage(1);
                  }}
                  placeholder="Show entries"
                />
              </div>

              <div className="w-56">
                <PredictiveSearchSelect
                  options={filterProjectOptions}
                  value={projectFilter}
                  onChange={(val) => {
                    setProjectFilter(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Filter by Project"
                />
              </div>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100/80 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">PROJECT NAME</th>
                  <th className="py-3 px-4">DOCUMENT NAME</th>
                  <th className="py-3 px-4">DOCUMENT TYPE</th>
                  <th className="py-3 px-4">DETAILS / APPROVAL</th>
                  <th className="py-3 px-4">ADDED BY</th>
                  <th className="py-3 px-4 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                    </td>
                  </tr>
                ) : paginatedDocs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No project document records available
                    </td>
                  </tr>
                ) : (
                  paginatedDocs.map((item, idx) => (
                    <tr key={item.uuid} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-medium text-slate-500">{startIndex + idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{item.project?.name || "—"}</td>
                      <td className="py-3 px-4 font-medium text-indigo-700 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        {item.documentName}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {item.documentType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">{item.details || item.rajuk || "—"}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{item.createdBy || "-"}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit"
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            title="Delete"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
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

          <div className="p-4 bg-slate-50/70 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-500">
            <div>
              Showing {filteredDocuments.length === 0 ? 0 : startIndex + 1} to{" "}
              {Math.min(startIndex + entriesPerPage, filteredDocuments.length)} of {filteredDocuments.length} entries
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition font-medium"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-lg font-medium transition ${
                    currentPage === p
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition font-medium"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== ADD / EDIT MODAL ==================== */}
      {(isModalOpen || editingDoc) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">
                {editingDoc ? `Edit Document: ${editingDoc.documentName}` : "Add New Document"}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingDoc(null);
                }}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingDoc ? handleEditSubmit : handleCreateSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Project Name <span className="text-rose-500">*</span>
                </label>
                <PredictiveSearchSelect
                  options={projectOptions}
                  value={formData.projectId}
                  onChange={(val) => setFormData({ ...formData, projectId: val })}
                  placeholder="Select Project"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Document Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.documentName}
                  onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
                  placeholder="e.g. Land Mutation & Deed Copy"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Document Type</label>
                <PredictiveSearchSelect
                  options={DOC_TYPE_OPTIONS}
                  value={formData.documentType}
                  onChange={(val) => setFormData({ ...formData, documentType: val })}
                  placeholder="Select Document Type"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">RAJUK / Authority Clearance</label>
                <input
                  type="text"
                  value={formData.rajuk}
                  onChange={(e) => setFormData({ ...formData, rajuk: e.target.value })}
                  placeholder="e.g. RAJUK Memo # 2026-X49"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Details / Description</label>
                <textarea
                  rows={3}
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  placeholder="Additional document notes or archives location..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingDoc(null);
                  }}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingDoc ? "Update Document" : "Save Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
