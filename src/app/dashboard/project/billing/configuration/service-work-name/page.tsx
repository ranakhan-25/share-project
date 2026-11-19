/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ChevronRight,
  Plus,
  Edit,
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
export interface ServiceWorkName {
  id: number | string;
  uuid: string;
  projectId: string;
  projectName?: string;
  productType: string;
  code: string;
  name: string;
  purchasePrice: number;
  salePrice: number;
  categoryId: string;
  categoryName: string;
  subCategoryId: string;
  subCategoryName: string;
  unit: string;
  brand: string;
  createdBy?: string;
  updatedBy?: string;
}

interface RelatedOption {
  uuid: string;
  name: string;
  categoryId?: string;
}

interface ProjectOption {
  uuid: string;
  name: string;
}

// ==================== API CONFIG ====================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PREFIX = "/realbizpro/api/v1";

const SERVICE_WORK_NAME_API = `${API_BASE_URL}${API_PREFIX}/project-billing/service-work-names`;
const CATEGORY_API = `${API_BASE_URL}${API_PREFIX}/category`;
const SUB_CATEGORY_API = `${API_BASE_URL}${API_PREFIX}/billing-sub-category`;
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

const generateCode = () => {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SW${String(rand).padStart(4, "0")}`;
};

const toYMD = (d?: string | null) => {
  if (!d) return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
    return date.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

const UNIT_OPTIONS = [
  { value: "Sft", label: "Sft" },
  { value: "Cft", label: "Cft" },
  { value: "Rft", label: "Rft" },
  { value: "Set", label: "Set" },
  { value: "Bag", label: "Bag" },
  { value: "Kg", label: "Kg" },
  { value: "Job", label: "Job" },
  { value: "Day labour", label: "Day labour" },
  { value: "Nos", label: "Nos" },
  { value: "Pcs", label: "Pcs" },
];

const entriesOptions = [
  { value: "10", label: "10 entries" },
  { value: "25", label: "25 entries" },
  { value: "50", label: "50 entries" },
];

// ==================== MAIN PAGE ====================
export default function ServiceWorkNameListPage() {
  const [storedUser, setStoredUser] = useState<any>(null);
  useEffect(() => {
    setStoredUser(getStoredUser());
  }, []);
  const userEmail = (storedUser?.email || "").toLowerCase().trim();

  const [items, setItems] = useState<ServiceWorkName[]>([]);
  const [categories, setCategories] = useState<RelatedOption[]>([]);
  const [subCategories, setSubCategories] = useState<RelatedOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceWorkName | null>(null);

  // Form
  const [formData, setFormData] = useState({
    projectId: "",
    code: generateCode(),
    name: "",
    purchasePrice: "",
    salePrice: "",
    categoryId: "",
    subCategoryId: "",
    unit: "Job",
    brand: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ==================== FETCH OPTIONS ====================
  const fetchOptions = async () => {
    try {
      const headers = getAuthHeaders();
      const [catRes, subRes, projRes] = await Promise.all([
        fetch(`${CATEGORY_API}?page=1&limit=100`, { headers }).catch(() => null),
        fetch(`${SUB_CATEGORY_API}?page=1&limit=100`, { headers }).catch(() => null),
        fetch(`${PROJECT_API}?page=1&limit=100`, { headers }).catch(() => null),
      ]);

      if (catRes?.ok) {
        const catJson = await catRes.json();
        const rows = catJson?.data?.data ?? catJson?.data ?? [];
        if (Array.isArray(rows)) {
          setCategories(
            rows
              .filter((r: any) => r?.uuid || r?.id)
              .map((r: any) => ({
                uuid: String(r.uuid || r.id),
                name: String(r.name || r.categoryName || "Unnamed"),
              }))
          );
        }
      }

      if (subRes?.ok) {
        const subJson = await subRes.json();
        const rows = subJson?.data?.data ?? subJson?.data ?? [];
        if (Array.isArray(rows)) {
          setSubCategories(
            rows
              .filter((r: any) => r?.uuid || r?.id)
              .map((r: any) => ({
                uuid: String(r.uuid || r.id),
                name: String(r.name || r.subCategoryName || "Unnamed"),
                categoryId: r.categoryId ? String(r.categoryId) : undefined,
              }))
          );
        }
      }

      if (projRes?.ok) {
        const projJson = await projRes.json();
        const rows = projJson?.data?.data ?? projJson?.data ?? [];
        if (Array.isArray(rows)) {
          setProjects(
            rows
              .filter((r: any) => r?.uuid)
              .map((r: any) => ({
                uuid: String(r.uuid),
                name: String(r.name || r.projectName || r.code || "Unnamed"),
              }))
          );
        }
      }
    } catch (err) {
      console.error("fetchOptions error:", err);
    }
  };

  // ==================== FETCH ITEMS ====================
  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${SERVICE_WORK_NAME_API}?page=1&limit=100`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || `Failed to fetch service/work names: ${res.status}`);
      }
      const json = await res.json();
      const rows = json?.data?.data ?? json?.data ?? [];
      const activeEmail = (getStoredUser()?.email || userEmail || "").toLowerCase().trim();

      const parsed: ServiceWorkName[] = Array.isArray(rows)
        ? rows
            .filter((item: any) => !item.deletedAt)
            .filter((item: any) => {
              if (!activeEmail) return true;
              const creator = String(item.createdBy || item.details?.createdBy || "").toLowerCase().trim();
              return !creator || creator === activeEmail;
            })
            .map((item: any) => {
              const details = item.details || {};
              return {
                id: item.id ?? item.uuid,
                uuid: item.uuid,
                projectId: item.projectId || item.project?.uuid || "",
                projectName: item.project?.name || "",
                productType: item.productType || "Service",
                code: item.code || "",
                name: item.title || item.name || "",
                purchasePrice: Number(details.purchasePrice ?? item.amount ?? 0),
                salePrice: Number(details.salePrice ?? 0),
                categoryId: details.categoryId || item.categoryId || "",
                categoryName: item.category?.name || details.categoryName || "",
                subCategoryId: details.subCategoryId || item.subCategoryId || "",
                subCategoryName: item.subCategory?.name || details.subCategoryName || "",
                unit: details.unit || item.unit || "Job",
                brand: details.brand || item.brand || "",
                createdBy: item.createdBy || activeEmail,
                updatedBy: item.updatedBy || "",
              };
            })
        : [];
      setItems(parsed);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load service/work names");
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchOptions();
  }, [userEmail]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // ==================== FILTER ====================
  const filtered = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.categoryName.toLowerCase().includes(q) ||
      item.brand.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginated = filtered.slice(startIndex, startIndex + entriesPerPage);

  const projectOptions = projects.map((p) => ({ value: p.uuid, label: p.name }));
  const categoryOptions = [{ value: "", label: "Select Category" }, ...categories.map((c) => ({ value: c.uuid, label: c.name }))];
  const filteredSubCategories = formData.categoryId
    ? subCategories.filter((s) => !s.categoryId || s.categoryId === formData.categoryId)
    : subCategories;
  const subCategoryOptions = [{ value: "", label: "Select Sub Category" }, ...filteredSubCategories.map((s) => ({ value: s.uuid, label: s.name }))];

  // ==================== RESET ====================
  const resetForm = () => {
    setFormData({
      projectId: projects[0]?.uuid || "",
      code: generateCode(),
      name: "",
      purchasePrice: "",
      salePrice: "",
      categoryId: categories[0]?.uuid || "",
      subCategoryId: "",
      unit: "Job",
      brand: "",
      description: "",
    });
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item: ServiceWorkName) => {
    setEditingItem(item);
    setFormData({
      projectId: item.projectId || projects[0]?.uuid || "",
      code: item.code || generateCode(),
      name: item.name || "",
      purchasePrice: String(item.purchasePrice || ""),
      salePrice: String(item.salePrice || ""),
      categoryId: item.categoryId || "",
      subCategoryId: item.subCategoryId || "",
      unit: item.unit || "Job",
      brand: item.brand || "",
      description: "",
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
    if (!formData.name.trim()) {
      setFormError("Service Name is required");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const activeEmail = (getStoredUser()?.email || userEmail || "sharetest@realbiz.com").toLowerCase().trim();

      const payload = {
        projectId: formData.projectId,
        title: formData.name,
        code: formData.code,
        recordDate: toYMD(new Date().toISOString()),
        amount: Number(formData.purchasePrice) || 0,
        status: "active",
        description: formData.description || "",
        createdBy: activeEmail,
        details: {
          purchasePrice: Number(formData.purchasePrice) || 0,
          salePrice: Number(formData.salePrice) || 0,
          categoryId: formData.categoryId || "",
          subCategoryId: formData.subCategoryId || "",
          unit: formData.unit || "",
          brand: formData.brand || "",
          createdBy: activeEmail,
        },
      };

      const res = await fetch(SERVICE_WORK_NAME_API, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Create service/work name failed");
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
    if (!formData.projectId) {
      setFormError("Project is required");
      return;
    }
    if (!formData.name.trim()) {
      setFormError("Service Name is required");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const activeEmail = (getStoredUser()?.email || userEmail || "sharetest@realbiz.com").toLowerCase().trim();

      const payload = {
        projectId: formData.projectId,
        title: formData.name,
        code: formData.code,
        recordDate: toYMD(new Date().toISOString()),
        amount: Number(formData.purchasePrice) || 0,
        status: "active",
        description: formData.description || "",
        updatedBy: activeEmail,
        details: {
          purchasePrice: Number(formData.purchasePrice) || 0,
          salePrice: Number(formData.salePrice) || 0,
          categoryId: formData.categoryId || "",
          subCategoryId: formData.subCategoryId || "",
          unit: formData.unit || "",
          brand: formData.brand || "",
          updatedBy: activeEmail,
        },
      };

      const res = await fetch(`${SERVICE_WORK_NAME_API}/${editingItem.uuid}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Update service/work name failed");
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
  const handleDelete = async (item: ServiceWorkName) => {
    if (!item.uuid) return;
    if (!window.confirm(`Delete service/work name "${item.name}"?`)) return;
    try {
      const res = await fetch(`${SERVICE_WORK_NAME_API}/${item.uuid}`, {
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
                Service/Work Name
              </span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Service/Work Name Configuration / সার্ভিস ও ওয়ার্ক নাম
            </h1>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 hover:shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> + Service/Work Name Add
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
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
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
                  <th className="py-3 px-4">CODE</th>
                  <th className="py-3 px-4">NAME</th>
                  <th className="py-3 px-4 text-right">COST</th>
                  <th className="py-3 px-4 text-right">SALE PRICE</th>
                  <th className="py-3 px-4">UNIT</th>
                  <th className="py-3 px-4">BRAND</th>
                  <th className="py-3 px-4">ADDED BY</th>
                  <th className="py-3 px-4 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      No service/work name records available
                    </td>
                  </tr>
                ) : (
                  paginated.map((item, idx) => (
                    <tr key={item.uuid} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-medium text-slate-500">{startIndex + idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">{item.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{item.name}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800">৳{item.purchasePrice.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800">৳{item.salePrice.toLocaleString()}</td>
                      <td className="py-3 px-4 text-slate-700">{item.unit || "-"}</td>
                      <td className="py-3 px-4 text-slate-700">{item.brand || "-"}</td>
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
              Showing {filtered.length === 0 ? 0 : startIndex + 1} to{" "}
              {Math.min(startIndex + entriesPerPage, filtered.length)} of {filtered.length} entries
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
      {(isAddOpen || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">
                {editingItem ? `Edit Service/Work: ${editingItem.name}` : "New Service/Work Name"}
              </h3>
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingItem(null);
                }}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingItem ? handleEditSubmit : handleCreateSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Project <span className="text-rose-500">*</span>
                </label>
                <PredictiveSearchSelect
                  options={projectOptions}
                  value={formData.projectId}
                  onChange={(val) => setFormData({ ...formData, projectId: val })}
                  placeholder="Select Project"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Category</label>
                  <PredictiveSearchSelect
                    options={categoryOptions}
                    value={formData.categoryId}
                    onChange={(val) => setFormData({ ...formData, categoryId: val, subCategoryId: "" })}
                    placeholder="Select Category"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Sub Category</label>
                  <PredictiveSearchSelect
                    options={subCategoryOptions}
                    value={formData.subCategoryId}
                    onChange={(val) => setFormData({ ...formData, subCategoryId: val })}
                    placeholder="Select Sub Category"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-semibold text-slate-700">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Service Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Electrical Conduit Wiring"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Unit</label>
                  <PredictiveSearchSelect
                    options={UNIT_OPTIONS}
                    value={formData.unit}
                    onChange={(val) => setFormData({ ...formData, unit: val })}
                    placeholder="Select Unit"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Cost Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Sale Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Brand / Spec</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. BRB / Standard"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional notes or details"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
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
                    setIsAddOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingItem ? "Update Service" : "Save Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
