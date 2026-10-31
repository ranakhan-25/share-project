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
export interface CategoryItem {
  id: number | string;
  uuid: string;
  type: string;
  code: string;
  name: string;
  createdBy?: string;
  updatedBy?: string;
  status?: string;
}

interface RelatedOption {
  uuid: string;
  name: string;
}

// ==================== API CONFIG ====================
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PREFIX = "/realbizpro/api/v1";

const CATEGORY_API = `${API_BASE_URL}${API_PREFIX}/category`;
const CATEGORY_TYPE_API = `${API_BASE_URL}${API_PREFIX}/category-type`;

// ✅ Backend enum — shudhu ei 2 ta value allowed
const ALLOWED_CATEGORY_TYPES = ["Service", "Product"];

// ==================== HELPERS ====================
const generateCategoryCode = () => {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `C${rand}`;
};

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
                row.typeName ||
                row.categoryName ||
                "Unnamed",
            ),
          }))
      : [];
  } catch (err) {
    console.error(`fetchRelatedOptions(${label}) error:`, err);
    return [];
  }
}

// ==================== API FUNCTIONS ====================
async function fetchCategories(): Promise<CategoryItem[]> {
  const query = new URLSearchParams({ page: "1", limit: "100" });
  const res = await fetch(`${CATEGORY_API}?${query}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.message || `Failed to fetch categories: ${res.status}`,
    );
  }
  const json = await res.json();
  const rows = json?.data?.data ?? json?.data ?? [];

  return Array.isArray(rows)
    ? rows.map((item: any) => ({
        id: item.id ?? item.uuid,
        uuid: item.uuid,
        type: item.type || item.categoryType || "",
        code: item.code || "",
        name: item.name || item.categoryName || "",
        createdBy: item.createdBy || "",
        updatedBy: item.updatedBy || "",
        status: item.status || "active",
      }))
    : [];
}

async function createCategory(payload: Record<string, any>) {
  const res = await fetch(CATEGORY_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Create category failed");
  }
  return res.json();
}

async function updateCategory(uuid: string, payload: Record<string, any>) {
  const res = await fetch(`${CATEGORY_API}/${uuid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Update category failed");
  }
  return res.json();
}

async function deleteCategory(uuid: string) {
  const res = await fetch(`${CATEGORY_API}/${uuid}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Delete category failed");
  }
  return res.json().catch(() => ({}));
}

// ==================== MAIN PAGE ====================
export default function CategoryListPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categoryTypes, setCategoryTypes] = useState<RelatedOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CategoryItem | null>(null);

  // Form
  const [formData, setFormData] = useState({
    type: "",
    code: generateCategoryCode(),
    name: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ==================== LOAD DATA ====================
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCategories();
      setCategories(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    fetchRelatedOptions(CATEGORY_TYPE_API, "category types")
      .then((types) => {
        // ✅ Shudhu allowed type gulo rakhi
        const filtered = types.filter((t) =>
          ALLOWED_CATEGORY_TYPES.includes(t.name),
        );
        setCategoryTypes(filtered);
      })
      .catch((e) => console.error("category types:", e));
  }, [loadCategories]);

  // ==================== FILTER ====================
  const filtered = categories.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q);
    const matchesType = typeFilter ? item.type === typeFilter : true;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filtered.length / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginated = filtered.slice(startIndex, startIndex + entriesPerPage);

  // ==================== RESET ====================
  const resetForm = () => {
    setFormData({
      type: "",
      code: generateCategoryCode(),
      name: "",
    });
    setFormError(null);
  };

  // ==================== OPEN ADD ====================
  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  // ==================== OPEN EDIT ====================
  const handleOpenEdit = (item: CategoryItem) => {
    setEditingItem(item);
    setFormData({
      type: item.type || "",
      code: item.code || "",
      name: item.name || "",
    });
    setFormError(null);
  };

  // ==================== CREATE ====================
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type) {
      setFormError("Type is required");
      return;
    }
    if (!ALLOWED_CATEGORY_TYPES.includes(formData.type)) {
      setFormError(`Type must be one of: ${ALLOWED_CATEGORY_TYPES.join(", ")}`);
      return;
    }
    if (!formData.name.trim()) {
      setFormError("Category Name is required");
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);

      await createCategory({
        type: formData.type,
        code: formData.code,
        name: formData.name,
      });

      setIsAddOpen(false);
      resetForm();
      await loadCategories();
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
    if (!formData.type) {
      setFormError("Type is required");
      return;
    }
    if (!ALLOWED_CATEGORY_TYPES.includes(formData.type)) {
      setFormError(`Type must be one of: ${ALLOWED_CATEGORY_TYPES.join(", ")}`);
      return;
    }
    if (!formData.name.trim()) {
      setFormError("Category Name is required");
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);

      await updateCategory(editingItem.uuid, {
        type: formData.type,
        code: formData.code,
        name: formData.name,
      });

      setEditingItem(null);
      resetForm();
      await loadCategories();
    } catch (err: any) {
      setFormError(err?.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== DELETE ====================
  const handleDelete = async (item: CategoryItem) => {
    if (!item.uuid) return;
    if (!confirm(`Delete category "${item.name}"?`)) return;
    try {
      setActionLoading(true);
      await deleteCategory(item.uuid);
      setCategories((prev) => prev.filter((c) => c.uuid !== item.uuid));
    } catch (err: any) {
      alert(err?.message || "Delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* BREADCRUMB + HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1 hover:text-indigo-600 cursor-pointer">
                <Home className="w-3.5 h-3.5" />
                Home
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-600">Billing</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-indigo-600 font-semibold">
                Category List
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 bg-[#5949d6] hover:bg-[#4d3ec2] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-1.5 bg-[#1e7e34] hover:bg-[#155d27] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Previous
            </button>
          </div>
        </div>

        {/* FILTER */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="max-w-xs">
            <label className="block font-semibold text-slate-700 mb-1 text-xs">
              Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select One Option</option>
              {categoryTypes.length === 0 ? (
                <>
                  <option value="Service">Service</option>
                  <option value="Product">Product</option>
                </>
              ) : (
                categoryTypes.map((t) => (
                  <option key={t.uuid} value={t.name}>
                    {t.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadCategories} className="underline text-xs">
              Retry
            </button>
          </div>
        )}

        {/* TABLE */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs">
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
                className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-56 px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* TABLE BODY */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[#5949d6] text-white font-semibold">
                  <th className="py-2.5 px-3 w-16">SL</th>
                  <th className="py-2.5 px-3">TYPE</th>
                  <th className="py-2.5 px-3">CODE</th>
                  <th className="py-2.5 px-3">NAME</th>
                  <th className="py-2.5 px-3 text-center w-24">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
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
                        {item.type}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">
                        {item.code}
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                        >
                          {item.name}
                        </button>
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
                      colSpan={5}
                      className="text-center py-10 text-slate-400 font-medium"
                    >
                      No categories found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* FOOTER */}
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
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-100 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800">Category</h3>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* TYPE */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select One Option</option>
                    {categoryTypes.length === 0 ? (
                      <>
                        <option value="Service">Service</option>
                        <option value="Product">Product</option>
                      </>
                    ) : (
                      categoryTypes.map((t) => (
                        <option key={t.uuid} value={t.name}>
                          {t.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* CODE — auto-generated */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Category Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* NAME */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Category Name"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded text-xs">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#5949d6] hover:bg-[#4d3ec2] text-white rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
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
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-100 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800">
                Edit Category — {editingItem.name}
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
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select One Option</option>
                    {categoryTypes.length === 0 ? (
                      <>
                        <option value="Service">Service</option>
                        <option value="Product">Product</option>
                      </>
                    ) : (
                      categoryTypes.map((t) => (
                        <option key={t.uuid} value={t.name}>
                          {t.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Category Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded text-xs">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#5949d6] hover:bg-[#4d3ec2] text-white rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
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
    </div>
  );
}
