/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  FileText,
  Save,
  Loader2,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import PredictiveSearchSelect from "@/components/ui/PredictiveSearchSelect";
import { getStoredUser, getStoredAccessToken } from "@/lib/admin-auth/adminAuthStorage";

// ---------- Types ----------
export interface ShareConfig {
  id: number | string;
  uuid: string;
  projectId: string;
  investorId: string;
  projectName: string;
  investorName: string;
  investmentAmount: string;
  profitPercent: string;
  profitAmount: string;
  isProfitDistribute: boolean;
  status: string;
  createdBy?: string;
  addedById?: string;
}

interface OptionItem {
  uuid: string;
  name: string;
  code?: string;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002").replace(/\/+$/, "");
const API_PREFIX = "/realbizpro/api/v1";
const SHARE_CONFIG_API = `${API_BASE}${API_PREFIX}/share-configuration`;
const PROJECT_API = `${API_BASE}${API_PREFIX}/project`;
const INVESTOR_API = `${API_BASE}${API_PREFIX}/investor`;

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

export default function InvestmentConfigurationPage() {
  const [storedUser, setStoredUser] = useState<any>(null);
  useEffect(() => {
    setStoredUser(getStoredUser());
  }, []);
  const userEmail = (storedUser?.email || "").toLowerCase().trim();

  const [configs, setConfigs] = useState<ShareConfig[]>([]);
  const [projects, setProjects] = useState<OptionItem[]>([]);
  const [investors, setInvestors] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ShareConfig | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    projectId: "",
    investorId: "",
    investmentAmount: "",
    profitPercent: "15",
    profitAmount: "",
    isProfitDistribute: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Options
  const fetchOptions = async () => {
    try {
      const headers = getAuthHeaders();
      const [projRes, invRes] = await Promise.all([
        fetch(`${PROJECT_API}?page=1&limit=100`, { headers }).catch(() => null),
        fetch(`${INVESTOR_API}?page=1&limit=100&status=active`, { headers }).catch(() => null),
      ]);

      if (projRes?.ok) {
        const json = await projRes.json();
        const rows = json?.data?.data ?? json?.data ?? [];
        if (Array.isArray(rows)) {
          setProjects(
            rows
              .filter((p: any) => p?.uuid || p?.id)
              .map((p: any) => ({
                uuid: String(p.uuid || p.id),
                name: String(p.name || p.projectName || p.code || "Unnamed"),
                code: p.code,
              }))
          );
        }
      }

      if (invRes?.ok) {
        const json = await invRes.json();
        const rows = json?.data?.data ?? json?.data ?? [];
        if (Array.isArray(rows)) {
          setInvestors(
            rows
              .filter((i: any) => i?.uuid || i?.id)
              .map((i: any) => ({
                uuid: String(i.uuid || i.id),
                name: String(i.name || i.code || "Unnamed"),
                code: i.code,
              }))
          );
        }
      }
    } catch (err) {
      console.error("fetchOptions error:", err);
    }
  };

  // Fetch Configs
  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${SHARE_CONFIG_API}?page=1&limit=100&sortBy=createdAt&sortOrder=DESC`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || `Failed to fetch share configurations: ${res.status}`);
      }
      const json = await res.json();
      const rows = json?.data?.data ?? json?.data ?? [];
      const activeEmail = (getStoredUser()?.email || userEmail || "").toLowerCase().trim();

      const mapped: ShareConfig[] = (Array.isArray(rows) ? rows : [])
        .filter((item: any) => !item.deletedAt)
        .filter((item: any) => {
          if (!activeEmail) return true;
          const creator = String(item.createdBy || item.addedById || "").toLowerCase().trim();
          return !creator || creator === activeEmail;
        })
        .map((item: any) => ({
          id: item.id ?? item.uuid,
          uuid: item.uuid,
          projectId: item.projectId || item.project?.uuid || "",
          investorId: item.investorId || item.investor?.uuid || "",
          projectName: item.project?.name || item.projectName || "Project",
          investorName: item.investor?.name || item.investorName || "Investor",
          investmentAmount: String(item.investmentAmount ?? "0"),
          profitPercent: String(item.profitPercent ?? "0"),
          profitAmount: String(item.fixedProfitAmount ?? item.profitAmount ?? "0"),
          isProfitDistribute: Boolean(item.isProfitDistribute),
          status: item.status || "active",
          createdBy: item.createdBy || activeEmail,
          addedById: item.addedById || activeEmail,
        }));

      setConfigs(mapped);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load share configurations");
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchOptions();
  }, [userEmail]);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const filtered = configs.filter(
    (item) =>
      item.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.investorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.investmentAmount.includes(searchQuery)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginated = filtered.slice(startIndex, startIndex + entriesPerPage);

  const projectOptions = projects.map((p) => ({ value: p.uuid, label: p.name }));
  const investorOptions = investors.map((i) => ({ value: i.uuid, label: i.name }));

  const resetForm = () => {
    setFormData({
      projectId: projects[0]?.uuid || "",
      investorId: investors[0]?.uuid || "",
      investmentAmount: "",
      profitPercent: "15",
      profitAmount: "",
      isProfitDistribute: true,
    });
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item: ShareConfig) => {
    setEditingConfig(item);
    setFormData({
      projectId: item.projectId || projects[0]?.uuid || "",
      investorId: item.investorId || investors[0]?.uuid || "",
      investmentAmount: item.investmentAmount,
      profitPercent: item.profitPercent,
      profitAmount: item.profitAmount,
      isProfitDistribute: item.isProfitDistribute,
    });
    setFormError(null);
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId || !formData.investorId) {
      setFormError("Please select both Project and Investor.");
      return;
    }
    if (!formData.investmentAmount || Number(formData.investmentAmount) <= 0) {
      setFormError("Please enter a valid investment amount.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const activeEmail = (getStoredUser()?.email || userEmail || "sharetest@realbiz.com").toLowerCase().trim();

      const payload = {
        projectId: formData.projectId,
        investorId: formData.investorId,
        investmentAmount: Number(formData.investmentAmount),
        profitPercent: Number(formData.profitPercent) || 0,
        fixedProfitAmount: Number(formData.profitAmount) || 0,
        isProfitDistribute: formData.isProfitDistribute,
        status: "active",
        addedById: activeEmail,
        createdBy: activeEmail,
      };

      const res = await fetch(SHARE_CONFIG_API, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Create investment config failed");
      }

      toast.success("Investment configuration created successfully!");
      setIsAddOpen(false);
      resetForm();
      await loadConfigs();
    } catch (err: any) {
      setFormError(err?.message || "Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Update
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig?.uuid) return;
    if (!formData.projectId || !formData.investorId) {
      setFormError("Please select both Project and Investor.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const activeEmail = (getStoredUser()?.email || userEmail || "sharetest@realbiz.com").toLowerCase().trim();

      const payload = {
        projectId: formData.projectId,
        investorId: formData.investorId,
        investmentAmount: Number(formData.investmentAmount),
        profitPercent: Number(formData.profitPercent) || 0,
        fixedProfitAmount: Number(formData.profitAmount) || 0,
        isProfitDistribute: formData.isProfitDistribute,
        status: "active",
        updatedBy: activeEmail,
      };

      const res = await fetch(`${SHARE_CONFIG_API}/${editingConfig.uuid}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Update investment config failed");
      }

      toast.success("Investment configuration updated successfully!");
      setEditingConfig(null);
      resetForm();
      await loadConfigs();
    } catch (err: any) {
      setFormError(err?.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async (item: ShareConfig) => {
    if (!item.uuid) return;
    if (!window.confirm(`Delete configuration for "${item.investorName}"?`)) return;
    try {
      const res = await fetch(`${SHARE_CONFIG_API}/${item.uuid}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Configuration deleted successfully!");
      setConfigs((prev) => prev.filter((c) => c.uuid !== item.uuid));
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
              <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Investments</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                Investment Configuration
              </span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Investment Configuration / ইনভেস্টমেন্ট কনফিগারেশন
            </h1>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 hover:shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> + New Configuration
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
                placeholder="Search configurations..."
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
                  <th className="py-3 px-4">PROJECT</th>
                  <th className="py-3 px-4">INVESTOR</th>
                  <th className="py-3 px-4 text-right">INVESTMENT AMOUNT</th>
                  <th className="py-3 px-4 text-right">PROFIT (%)</th>
                  <th className="py-3 px-4 text-right">FIXED PROFIT</th>
                  <th className="py-3 px-4 text-center">DISTRIBUTE</th>
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
                      No investment configuration records available
                    </td>
                  </tr>
                ) : (
                  paginated.map((item, idx) => (
                    <tr key={item.uuid} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-medium text-slate-500">{startIndex + idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{item.projectName}</td>
                      <td className="py-3 px-4 font-medium text-indigo-700">{item.investorName}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800">
                        ৳{Number(item.investmentAmount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">{item.profitPercent}%</td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        ৳{Number(item.profitAmount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.isProfitDistribute
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {item.isProfitDistribute ? "Yes" : "No"}
                        </span>
                      </td>
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
      {(isAddOpen || editingConfig) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">
                {editingConfig ? `Edit Investment Config` : "New Investment Configuration"}
              </h3>
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingConfig(null);
                }}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingConfig ? handleEditSubmit : handleCreateSubmit} className="p-6 space-y-4">
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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Investor <span className="text-rose-500">*</span>
                </label>
                <PredictiveSearchSelect
                  options={investorOptions}
                  value={formData.investorId}
                  onChange={(val) => setFormData({ ...formData, investorId: val })}
                  placeholder="Select Investor"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Investment Amount (৳) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1000"
                    required
                    value={formData.investmentAmount}
                    onChange={(e) => setFormData({ ...formData, investmentAmount: e.target.value })}
                    placeholder="e.g. 5000000"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Profit Percent (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.profitPercent}
                    onChange={(e) => setFormData({ ...formData, profitPercent: e.target.value })}
                    placeholder="e.g. 15"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Fixed Profit Amount (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.profitAmount}
                    onChange={(e) => setFormData({ ...formData, profitAmount: e.target.value })}
                    placeholder="Optional fixed profit"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isProfitDistribute"
                    checked={formData.isProfitDistribute}
                    onChange={(e) => setFormData({ ...formData, isProfitDistribute: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="isProfitDistribute" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Distribute Profit Automatically
                  </label>
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
                    setEditingConfig(null);
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
                  {editingConfig ? "Update Configuration" : "Save Configuration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
