/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prettier/prettier */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Home,
  ChevronRight,
  Plus,
  ArrowLeft,
  Edit,
  Trash2,
  X,
  Loader2,
  Save,
} from "lucide-react";

// ==================== TYPES ====================
export interface ServiceWorkName {
  id: number | string;
  uuid: string;
  projectId: string;
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
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PREFIX = "/realbizpro/api/v1";

const SERVICE_WORK_NAME_API = `${API_BASE_URL}${API_PREFIX}/project-billing/service-work-names`;
const CATEGORY_API = `${API_BASE_URL}${API_PREFIX}/category`;
const SUB_CATEGORY_API = `${API_BASE_URL}${API_PREFIX}/billing-sub-category`;
const PROJECT_API = `${API_BASE_URL}${API_PREFIX}/project`;

// ==================== HELPERS ====================
const generateCode = () => {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `S${String(rand).padStart(4, "0")}`;
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

// ==================== API PAYLOAD BUILDER ====================
// Backend DTO onujayi — screenshot er schema
const toApiPayload = (data: {
  projectId: string;
  code: string;
  name: string;
  purchasePrice: string;
  salePrice: string;
  categoryId: string;
  subCategoryId: string;
  unit: string;
  brand: string;
  description?: string;
}) => ({
  projectId: data.projectId,
  title: data.name, // name → title
  code: data.code,
  recordDate: toYMD(new Date().toISOString()),
  amount: Number(data.purchasePrice) || 0, // cost → amount
  status: "active",
  description: data.description || "",
  details: {
    purchasePrice: Number(data.purchasePrice) || 0,
    salePrice: Number(data.salePrice) || 0,
    categoryId: data.categoryId || "",
    subCategoryId: data.subCategoryId || "",
    unit: data.unit || "",
    brand: data.brand || "",
  },
  // ❌ additionalProp: {},  — backend ei field reject korche
});

// ==================== GENERIC OPTIONS FETCHER ====================
async function fetchRelatedOptions(
  endpoint: string,
  label: string,
): Promise<RelatedOption[]> {
  try {
    const query = new URLSearchParams({ page: "1", limit: "100" });
    const res = await fetch(`${endpoint}?${query}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`Failed to fetch ${label}: ${res.status}`);
      return [];
    }
    const json = await res.json();
    const rows =
      json?.data?.data ??
      (Array.isArray(json?.data) ? json.data : null) ??
      json?.rows ??
      [];
    return Array.isArray(rows)
      ? rows
          .filter((row: any) => row?.uuid)
          .map((row: any) => ({
            uuid: String(row.uuid),
            name: String(
              row.name ||
                row.title ||
                row.categoryName ||
                row.subCategoryName ||
                "Unnamed",
            ),
            categoryId: row.categoryId ? String(row.categoryId) : undefined,
          }))
      : [];
  } catch (err) {
    console.error(`fetchRelatedOptions(${label}) error:`, err);
    return [];
  }
}

async function fetchProjects(): Promise<ProjectOption[]> {
  try {
    const query = new URLSearchParams({ page: "1", limit: "100" });
    const res = await fetch(`${PROJECT_API}?${query}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`Failed to fetch projects: ${res.status}`);
      return [];
    }
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

// ==================== API FUNCTIONS ====================
async function fetchServiceWorkNames(): Promise<ServiceWorkName[]> {
  const query = new URLSearchParams({ page: "1", limit: "100" });
  const res = await fetch(`${SERVICE_WORK_NAME_API}?${query}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.message || `Failed to fetch service/work names: ${res.status}`,
    );
  }
  const json = await res.json();
  const rows = json?.data?.data ?? json?.data ?? [];

  return Array.isArray(rows)
    ? rows.map((item: any) => {
        const details = item.details || {};
        return {
          id: item.id ?? item.uuid,
          uuid: item.uuid,
          projectId: item.projectId || item.project?.uuid || "",
          productType: item.productType || "Service",
          code: item.code || "",
          name: item.title || item.name || "",
          purchasePrice: Number(details.purchasePrice ?? item.amount ?? 0),
          salePrice: Number(details.salePrice ?? 0),
          categoryId: details.categoryId || item.categoryId || "",
          categoryName:
            item.category?.name ||
            details.categoryName ||
            details.categoryId ||
            "",
          subCategoryId: details.subCategoryId || item.subCategoryId || "",
          subCategoryName:
            item.subCategory?.name ||
            details.subCategoryName ||
            details.subCategoryId ||
            "",
          unit: details.unit || item.unit || "",
          brand: details.brand || item.brand || "",
        };
      })
    : [];
}

async function createServiceWorkName(payload: Record<string, any>) {
  console.log("POST payload →", payload);
  const res = await fetch(SERVICE_WORK_NAME_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("POST error →", err);
    throw new Error(err?.message || "Create service/work name failed");
  }
  return res.json();
}

async function updateServiceWorkName(
  uuid: string,
  payload: Record<string, any>,
) {
  console.log("PATCH", uuid, "payload →", payload);
  const res = await fetch(`${SERVICE_WORK_NAME_API}/${uuid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("PATCH error →", err);
    throw new Error(err?.message || "Update service/work name failed");
  }
  return res.json();
}

async function deleteServiceWorkName(uuid: string) {
  const res = await fetch(`${SERVICE_WORK_NAME_API}/${uuid}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Delete service/work name failed");
  }
  return res.json().catch(() => ({}));
}

// ==================== MAIN PAGE ====================
export default function ServiceWorkNameListPage() {
  const [items, setItems] = useState<ServiceWorkName[]>([]);
  const [categories, setCategories] = useState<RelatedOption[]>([]);
  const [subCategories, setSubCategories] = useState<RelatedOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [actionLoading, setActionLoading] = useState(false);

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
    unit: "",
    brand: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ==================== LOAD DATA ====================
  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchServiceWorkNames();
      setItems(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load service/work names");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
    fetchRelatedOptions(CATEGORY_API, "categories")
      .then(setCategories)
      .catch((e) => console.error("categories:", e));
    fetchRelatedOptions(SUB_CATEGORY_API, "sub categories")
      .then(setSubCategories)
      .catch((e) => console.error("sub categories:", e));
    fetchProjects()
      .then(setProjects)
      .catch((e) => console.error("projects:", e));
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

  // ==================== FILTERED OPTIONS ====================
  const filteredSubCategories = formData.categoryId
    ? subCategories.filter(
        (s) => !s.categoryId || s.categoryId === formData.categoryId,
      )
    : subCategories;

  // ==================== RESET ====================
  const resetForm = () => {
    setFormData({
      projectId: "",
      code: generateCode(),
      name: "",
      purchasePrice: "",
      salePrice: "",
      categoryId: "",
      subCategoryId: "",
      unit: "",
      brand: "",
      description: "",
    });
    setFormError(null);
  };

  // ==================== OPEN ADD / EDIT ====================
  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item: ServiceWorkName) => {
    setEditingItem(item);
    setFormData({
      projectId: item.projectId || "",
      code: item.code || "",
      name: item.name || "",
      purchasePrice: String(item.purchasePrice || ""),
      salePrice: String(item.salePrice || ""),
      categoryId: item.categoryId || "",
      subCategoryId: item.subCategoryId || "",
      unit: item.unit || "",
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

      const payload = toApiPayload(formData);
      await createServiceWorkName(payload);

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

      const payload = toApiPayload(formData);
      await updateServiceWorkName(editingItem.uuid, payload);

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
    if (!confirm(`Delete service/work name "${item.name}"?`)) return;
    try {
      setActionLoading(true);
      await deleteServiceWorkName(item.uuid);
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
            <span className="text-slate-600">Labour/Worker</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-indigo-600 font-semibold">
              Service/Work Name
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 bg-[#5949d6] hover:bg-[#4d3ec2] text-white text-xs font-semibold px-4 py-2 rounded shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              +Service/Work Name Add
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-1.5 bg-[#1e7e34] hover:bg-[#155d27] text-white text-xs font-semibold px-4 py-2 rounded shadow-sm transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Previous
            </button>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadItems} className="underline text-xs">
              Retry
            </button>
          </div>
        )}

        {/* TABLE CARD */}
        <div className="bg-white rounded border border-slate-200 shadow-2xs">
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
                className="w-56 px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[#5949d6] text-white font-semibold uppercase">
                  <th className="py-2.5 px-3 w-12">ID</th>
                  <th className="py-2.5 px-3">PRODUCT TYPE</th>
                  <th className="py-2.5 px-3">CODE</th>
                  <th className="py-2.5 px-3">NAME</th>
                  <th className="py-2.5 px-3 text-right">PURCHASE PRICE</th>
                  <th className="py-2.5 px-3 text-right">SALE PRICE</th>
                  <th className="py-2.5 px-3">CATEGORY</th>
                  <th className="py-2.5 px-3">UNIT</th>
                  <th className="py-2.5 px-3">BRAND</th>
                  <th className="py-2.5 px-3 text-center w-28">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={10}
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
                      <td className="py-2.5 px-3 font-medium text-slate-600">
                        {startIndex + index + 1}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {item.productType}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono">
                        {item.code}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {item.name}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700">
                        {item.purchasePrice}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700">
                        {item.salePrice}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {item.categoryName || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {item.unit || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {item.brand || "-"}
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
                      colSpan={10}
                      className="text-center py-10 text-slate-400 font-medium"
                    >
                      No service/work names found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

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
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-800">
                Service/Work Name Add
              </h3>
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
              {/* ROW 0: Project */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
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
              </div>

              {/* ROW 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        categoryId: e.target.value,
                        subCategoryId: "",
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.uuid} value={c.uuid}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Sub Category
                  </label>
                  <select
                    value={formData.subCategoryId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subCategoryId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select Sub Category</option>
                    {filteredSubCategories.map((s) => (
                      <option key={s.uuid} value={s.uuid}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Service Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Service Name"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* ROW 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select Unit</option>
                    <option value="Sft">Sft</option>
                    <option value="Cft">Cft</option>
                    <option value="Rft">Rft</option>
                    <option value="Set">Set</option>
                    <option value="Bag">Bag</option>
                    <option value="Kg">Kg</option>
                    <option value="Job">Job</option>
                    <option value="Day labour">Day labour</option>
                    <option value="Nos">Nos</option>
                    <option value="Pcs">Pcs</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Cost
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchasePrice: e.target.value,
                      })
                    }
                    placeholder="Enter Cost"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Sale Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salePrice: e.target.value,
                      })
                    }
                    placeholder="Sale Price"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* ROW 3: Brand + Description */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                    placeholder="Brand"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Description"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
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
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-800">
                Edit Service/Work Name — {editingItem.name}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        categoryId: e.target.value,
                        subCategoryId: "",
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.uuid} value={c.uuid}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Sub Category
                  </label>
                  <select
                    value={formData.subCategoryId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subCategoryId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select Sub Category</option>
                    {filteredSubCategories.map((s) => (
                      <option key={s.uuid} value={s.uuid}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Service Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select Unit</option>
                    <option value="Sft">Sft</option>
                    <option value="Cft">Cft</option>
                    <option value="Rft">Rft</option>
                    <option value="Set">Set</option>
                    <option value="Bag">Bag</option>
                    <option value="Kg">Kg</option>
                    <option value="Job">Job</option>
                    <option value="Day labour">Day labour</option>
                    <option value="Nos">Nos</option>
                    <option value="Pcs">Pcs</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Cost
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchasePrice: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Sale Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salePrice: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
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
