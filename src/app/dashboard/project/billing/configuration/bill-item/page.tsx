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
export interface BillItem {
  id: number | string;
  uuid: string;
  code: string;
  name: string;
  purchasePrice: number;
  salePrice: number;
  description: string;
  categoryId: string;
  categoryName: string;
  subCategoryId: string;
  subCategoryName: string;
  brand: string;
  unit: string;
  projectId: string;
  projectName?: string;
  createdBy?: string;
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

const BILL_ITEM_API = `${API_BASE_URL}${API_PREFIX}/project-billing/bill-items`;
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

const generateItemCode = () => {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `P${String(rand).padStart(4, "0")}`;
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

const unitOptions = [
  { value: "Nos", label: "Nos" },
  { value: "Pcs", label: "Pcs" },
  { value: "Kg", label: "Kg" },
  { value: "Bag", label: "Bag" },
  { value: "Sft", label: "Sft" },
  { value: "Cft", label: "Cft" },
  { value: "Day", label: "Day" },
  { value: "Hour", label: "Hour" },
  { value: "Job", label: "Job" },
];

const entriesOptions = [
  { value: "10", label: "10 entries" },
  { value: "25", label: "25 entries" },
  { value: "50", label: "50 entries" },
];

export default function BillItemListPage() {
  const [storedUser, setStoredUser] = useState<any>(null);
  useEffect(() => {
    setStoredUser(getStoredUser());
  }, []);
  const userEmail = (storedUser?.email || "").toLowerCase().trim();

  const [billItems, setBillItems] = useState<BillItem[]>([]);
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
  const [editingItem, setEditingItem] = useState<BillItem | null>(null);

  // Form
  const [formData, setFormData] = useState({
    projectId: "",
    code: generateItemCode(),
    name: "",
    purchasePrice: "100",
    salePrice: "150",
    description: "",
    categoryId: "",
    subCategoryId: "",
    brand: "",
    unit: "Nos",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ==================== GENERIC OPTIONS FETCHER ====================
  const fetchRelatedOptions = async (endpoint: string, label: string): Promise<RelatedOption[]> => {
    try {
      const res = await fetch(`${endpoint}?page=1&limit=100`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return [];
      const json = await res.json();
      const rows =
        json?.data?.data ??
        (Array.isArray(json?.data) ? json.data : null) ??
        json?.rows ??
        [];
      return Array.isArray(rows)
        ? rows
            .filter((row: any) => row?.uuid || row?.id)
            .map((row: any) => ({
              uuid: String(row.uuid || row.id),
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
  };

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

  const fetchBillItemsList = async (): Promise<BillItem[]> => {
    const res = await fetch(`${BILL_ITEM_API}?page=1&limit=100`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || `Failed to fetch bill items: ${res.status}`);
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
            const creator = String(item.createdBy || item.details?.createdBy || "").toLowerCase().trim();
            return belongsToProj || creator === activeEmail;
          })
          .map((item: any) => {
            const details = item.details || {};
            return {
              id: item.id ?? item.uuid,
              uuid: item.uuid,
              projectId: item.projectId || item.project?.uuid || "",
              projectName: item.project?.name || "Share Tower 1",
              code: item.code || "",
              name: item.title || item.name || "",
              purchasePrice: Number(details.purchasePrice ?? item.amount ?? 0),
              salePrice: Number(details.salePrice ?? 0),
              description: item.description || "",
              categoryId: details.categoryId || item.categoryId || "",
              categoryName:
                item.category?.name ||
                details.categoryName ||
                details.categoryId ||
                "-",
              subCategoryId: details.subCategoryId || item.subCategoryId || "",
              subCategoryName:
                item.subCategory?.name ||
                details.subCategoryName ||
                details.subCategoryId ||
                "-",
              brand: details.brand || item.brand || "-",
              unit: details.unit || item.unit || "Nos",
              createdBy: item.createdBy || details.createdBy || activeEmail,
            };
          })
      : [];
  };

  // ==================== LOAD DATA ====================
  const loadBillItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBillItemsList();
      setBillItems(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load bill items");
    } finally {
      setLoading(false);
    }
  }, [projects.length, userEmail]);

  useEffect(() => {
    fetchRelatedOptions(CATEGORY_API, "categories").then(setCategories);
    fetchRelatedOptions(SUB_CATEGORY_API, "sub categories").then(setSubCategories);
    fetchProjectsList().then(setProjects);
  }, [userEmail]);

  useEffect(() => {
    loadBillItems();
  }, [loadBillItems]);

  // ==================== FILTER ====================
  const filtered = billItems.filter((item) => {
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

  const filteredSubCategories = formData.categoryId
    ? subCategories.filter(
        (s) => !s.categoryId || s.categoryId === formData.categoryId,
      )
    : subCategories;

  // Options
  const projectOptions = projects.map(p => ({ value: p.uuid, label: p.name }));
  const categoryOptions = categories.map(c => ({ value: c.uuid, label: c.name }));
  const subCategoryOptions = filteredSubCategories.map(s => ({ value: s.uuid, label: s.name }));

  // ==================== RESET ====================
  const resetForm = () => {
    setFormData({
      projectId: projects[0]?.uuid || "",
      code: generateItemCode(),
      name: "",
      purchasePrice: "100",
      salePrice: "150",
      description: "",
      categoryId: categories[0]?.uuid || "",
      subCategoryId: subCategories[0]?.uuid || "",
      brand: "Standard",
      unit: "Nos",
    });
    setFormError(null);
  };

  // ==================== OPEN ADD / EDIT ====================
  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item: BillItem) => {
    setEditingItem(item);
    setFormData({
      projectId: item.projectId || projects[0]?.uuid || "",
      code: item.code || generateItemCode(),
      name: item.name || "",
      purchasePrice: String(item.purchasePrice || ""),
      salePrice: String(item.salePrice || ""),
      description: item.description || "",
      categoryId: item.categoryId || "",
      subCategoryId: item.subCategoryId || "",
      brand: item.brand || "",
      unit: item.unit || "Nos",
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
    if (!formData.name.trim()) {
      setFormError("Item Name is required");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const activeEmail = (getStoredUser()?.email || userEmail || "sharetest@realbiz.com").toLowerCase().trim();

      const payload = {
        projectId,
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
          brand: formData.brand || "",
          unit: formData.unit || "",
          createdBy: activeEmail,
        },
      };

      const res = await fetch(BILL_ITEM_API, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Create bill item failed");
      }

      toast.success("Created successfully!");
      setIsAddOpen(false);
      resetForm();
      await loadBillItems();
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
    if (!formData.name.trim()) {
      setFormError("Item Name is required");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const activeEmail = (getStoredUser()?.email || userEmail || "sharetest@realbiz.com").toLowerCase().trim();

      const payload = {
        projectId,
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
          brand: formData.brand || "",
          unit: formData.unit || "",
          createdBy: activeEmail,
        },
      };

      const res = await fetch(`${BILL_ITEM_API}/${editingItem.uuid}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Update bill item failed");
      }

      toast.success("Updated successfully!");
      setEditingItem(null);
      resetForm();
      await loadBillItems();
    } catch (err: any) {
      setFormError(err?.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== DELETE ====================
  const handleDelete = async (item: BillItem) => {
    if (!item.uuid) return;
    if (!window.confirm(`Delete bill item "${item.name}"?`)) return;
    try {
      const res = await fetch(`${BILL_ITEM_API}/${item.uuid}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Deleted successfully!");
      setBillItems((prev) => prev.filter((c) => c.uuid !== item.uuid));
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
                Bill Items
              </span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Bill Item Configuration / বিল আইটেম কনফিগারেশন
            </h1>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 hover:shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> + Bill Item Add
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
                    {["ID", "CODE", "ITEM NAME", "PROJECT", "CATEGORY", "SUB-CATEGORY", "BRAND", "PURCHASE PRICE", "SALE PRICE", "ADDED BY", "ACTION"].map(h => (
                      <th key={h} className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700 font-medium">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-16 text-slate-400">
                        No bill item records available
                      </td>
                    </tr>
                  ) : (
                    paginated.map((item, index) => (
                      <tr key={item.uuid || index} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">{startIndex + index + 1}</td>
                        <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-semibold">{item.code}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{item.name}</td>
                        <td className="px-4 py-3 text-slate-600">{item.projectName || "Share Tower 1"}</td>
                        <td className="px-4 py-3 text-slate-600">{item.categoryName}</td>
                        <td className="px-4 py-3 text-slate-600">{item.subCategoryName}</td>
                        <td className="px-4 py-3 text-slate-600">{item.brand}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">৳{Number(item.purchasePrice || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 font-bold text-emerald-600">৳{Number(item.salePrice || 0).toLocaleString()}</td>
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
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-100 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-800">
                {editingItem ? "Edit Bill Item" : "New Bill Item"}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block font-semibold text-slate-700 mb-1">Item Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    readOnly
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 text-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Portland Cement 50kg"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <PredictiveSearchSelect
                    options={categoryOptions}
                    value={formData.categoryId}
                    onChange={(val) => setFormData(prev => ({ ...prev, categoryId: val, subCategoryId: "" }))}
                    placeholder="Select Category"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sub-Category</label>
                  <PredictiveSearchSelect
                    options={subCategoryOptions}
                    value={formData.subCategoryId}
                    onChange={(val) => setFormData(prev => ({ ...prev, subCategoryId: val }))}
                    placeholder="Select Sub-Category"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="e.g. Holcim / BSRM"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit</label>
                  <PredictiveSearchSelect
                    options={unitOptions}
                    value={formData.unit}
                    onChange={(val) => setFormData(prev => ({ ...prev, unit: val }))}
                    placeholder="Unit"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Purchase Price (৳)</label>
                  <input
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sale Price (৳)</label>
                  <input
                    type="number"
                    value={formData.salePrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, salePrice: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Item details or specifications"
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
                      <Save className="w-3.5 h-3.5" /> Save Item
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
