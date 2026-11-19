/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Check,
  Loader2,
  ChevronRight,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import PredictiveSearchSelect from "@/components/ui/PredictiveSearchSelect";
import { getStoredUser, getStoredAccessToken } from "@/lib/admin-auth/adminAuthStorage";

// ---------- Types ----------
export interface Nominee {
  id?: number | string;
  uuid?: string;
  nomineeName: string;
  nomineeNid: string;
  relation: string;
  percentage: string;
}

export interface Investor {
  id: number | string;
  uuid: string;
  code: string;
  name: string;
  mobile: string;
  email: string;
  nid: string;
  address: string;
  image?: string;
  chartOfGroups: string;
  under: string;
  status: string;
  createdBy?: string;
  addedById?: string;
  nominees: Nominee[];
}

type InvestorFormData = {
  code: string;
  name: string;
  mobile: string;
  email: string;
  nid: string;
  address: string;
  chartOfGroups: string;
  under: string;
  nominees: Nominee[];
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002").replace(/\/+$/, "");
const API_PREFIX = "/realbizpro/api/v1";
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

const TIER_OPTIONS = [
  { value: "Tier 1 - Primary Investor", label: "Tier 1 - Primary Investor" },
  { value: "Tier 2 - Strategic Partner", label: "Tier 2 - Strategic Partner" },
  { value: "Tier 3 - Regional Affiliate", label: "Tier 3 - Regional Affiliate" },
];

const UNDER_OPTIONS = [
  { value: "Corporate", label: "Corporate" },
  { value: "General Group", label: "General Group" },
  { value: "Individual", label: "Individual" },
];

const entriesOptions = [
  { value: "10", label: "10 entries" },
  { value: "25", label: "25 entries" },
  { value: "50", label: "50 entries" },
];

const generateInvestorCode = () => {
  const rand = Math.floor(100 + Math.random() * 900);
  return `INV-${new Date().getFullYear()}-${rand}`;
};

// ---------- Main Page ----------
export default function InvestorManagementPage() {
  const [storedUser, setStoredUser] = useState<any>(null);
  useEffect(() => {
    setStoredUser(getStoredUser());
  }, []);
  const userEmail = (storedUser?.email || "").toLowerCase().trim();

  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
  const [viewingInvestor, setViewingInvestor] = useState<Investor | null>(null);

  // Form State
  const [formData, setFormData] = useState<InvestorFormData>({
    code: generateInvestorCode(),
    name: "",
    mobile: "",
    email: "",
    nid: "",
    address: "",
    chartOfGroups: "Tier 1 - Primary Investor",
    under: "Corporate",
    nominees: [{ nomineeName: "", nomineeNid: "", relation: "", percentage: "100" }],
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${INVESTOR_API}?page=1&limit=100&sortBy=createdAt&sortOrder=DESC`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || `Failed to fetch investors: ${res.status}`);
      }
      const json = await res.json();
      const rows = json?.data?.data ?? json?.data ?? [];
      const activeEmail = (getStoredUser()?.email || userEmail || "").toLowerCase().trim();

      const mapped: Investor[] = (Array.isArray(rows) ? rows : [])
        .filter((item: any) => !item.deletedAt)
        .filter((item: any) => {
          if (!activeEmail) return true;
          const creator = String(item.createdBy || item.addedById || "").toLowerCase().trim();
          const email = String(item.email || "").toLowerCase().trim();
          return !creator || creator === activeEmail || email === activeEmail;
        })
        .map((item: any) => ({
          id: item.id || item.uuid,
          uuid: item.uuid,
          code: item.code || "",
          name: item.name || "",
          mobile: item.mobileNo || "",
          email: item.email || "",
          nid: item.nid || "",
          address: item.address || "",
          image: item.image || "",
          chartOfGroups: item.groupTier || "",
          under: item.underGroup || "",
          status: item.status || "active",
          createdBy: item.createdBy || activeEmail,
          addedById: item.addedById || activeEmail,
          nominees: (item.nominees || []).map((n: any) => ({
            id: n.id,
            uuid: n.uuid,
            nomineeName: n.nomineeName || "",
            nomineeNid: n.nomineeNid || "",
            relation: n.relation || "",
            percentage: String(n.percentage ?? ""),
          })),
        }));

      setInvestors(mapped);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load investors");
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredInvestors = investors.filter(
    (inv) =>
      inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.mobile.includes(searchQuery) ||
      inv.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.nid.includes(searchQuery)
  );

  const totalPages = Math.max(1, Math.ceil(filteredInvestors.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedInvestors = filteredInvestors.slice(startIndex, startIndex + entriesPerPage);

  const resetForm = () => {
    setFormData({
      code: generateInvestorCode(),
      name: "",
      mobile: "",
      email: "",
      nid: "",
      address: "",
      chartOfGroups: "Tier 1 - Primary Investor",
      under: "Corporate",
      nominees: [{ nomineeName: "", nomineeNid: "", relation: "", percentage: "100" }],
    });
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (inv: Investor) => {
    setEditingInvestor(inv);
    setFormData({
      code: inv.code,
      name: inv.name,
      mobile: inv.mobile,
      email: inv.email,
      nid: inv.nid,
      address: inv.address,
      chartOfGroups: inv.chartOfGroups || "Tier 1 - Primary Investor",
      under: inv.under || "Corporate",
      nominees: inv.nominees?.length
        ? inv.nominees
        : [{ nomineeName: "", nomineeNid: "", relation: "", percentage: "100" }],
    });
    setFormError(null);
  };

  const handleNomineeChange = (index: number, field: keyof Nominee, value: string) => {
    const updated = [...formData.nominees];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, nominees: updated });
  };

  const addNomineeRow = () => {
    setFormData({
      ...formData,
      nominees: [...formData.nominees, { nomineeName: "", nomineeNid: "", relation: "", percentage: "0" }],
    });
  };

  const removeNomineeRow = (idx: number) => {
    setFormData({
      ...formData,
      nominees: formData.nominees.filter((_, i) => i !== idx),
    });
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.mobile.trim() || !formData.nid.trim()) {
      setFormError("Name, Mobile number and NID are required.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const activeEmail = (getStoredUser()?.email || userEmail || "sharetest@realbiz.com").toLowerCase().trim();

      const payload = {
        code: formData.code,
        name: formData.name,
        mobileNo: formData.mobile,
        email: formData.email || undefined,
        nid: formData.nid,
        address: formData.address || undefined,
        groupTier: formData.chartOfGroups,
        underGroup: formData.under,
        status: "active",
        addedById: activeEmail,
        createdBy: activeEmail,
        nominees: formData.nominees
          .filter((n) => n.nomineeName.trim())
          .map((n) => ({
            nomineeName: n.nomineeName,
            nomineeNid: n.nomineeNid || "N/A",
            relation: n.relation || "Nominee",
            percentage: Number(n.percentage) || 100,
          })),
      };

      const res = await fetch(INVESTOR_API, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Create investor failed");
      }

      toast.success("Investor created successfully!");
      setIsAddOpen(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || "Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Update
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvestor?.uuid) return;
    if (!formData.name.trim() || !formData.mobile.trim() || !formData.nid.trim()) {
      setFormError("Name, Mobile number and NID are required.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const activeEmail = (getStoredUser()?.email || userEmail || "sharetest@realbiz.com").toLowerCase().trim();

      const payload = {
        name: formData.name,
        mobileNo: formData.mobile,
        email: formData.email || undefined,
        nid: formData.nid,
        address: formData.address || undefined,
        groupTier: formData.chartOfGroups,
        underGroup: formData.under,
        updatedBy: activeEmail,
        nominees: formData.nominees
          .filter((n) => n.nomineeName.trim())
          .map((n) => ({
            nomineeName: n.nomineeName,
            nomineeNid: n.nomineeNid || "N/A",
            relation: n.relation || "Nominee",
            percentage: Number(n.percentage) || 100,
          })),
      };

      const res = await fetch(`${INVESTOR_API}/${editingInvestor.uuid}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Update investor failed");
      }

      toast.success("Investor updated successfully!");
      setEditingInvestor(null);
      resetForm();
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async (inv: Investor) => {
    if (!inv.uuid) return;
    if (!window.confirm(`Delete investor "${inv.name}"?`)) return;
    try {
      const res = await fetch(`${INVESTOR_API}/${inv.uuid}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Investor deleted successfully!");
      setInvestors((prev) => prev.filter((i) => i.uuid !== inv.uuid));
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
                Investor
              </span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Investor Management / ইনভেস্টর ম্যানেজমেন্ট
            </h1>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 hover:shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> + Add New Investor
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
                placeholder="Search investors..."
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
                  <th className="py-3 px-4">INVESTOR NAME</th>
                  <th className="py-3 px-4">MOBILE</th>
                  <th className="py-3 px-4">EMAIL</th>
                  <th className="py-3 px-4">GROUP TIER</th>
                  <th className="py-3 px-4">STATUS</th>
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
                ) : paginatedInvestors.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      No investor records available
                    </td>
                  </tr>
                ) : (
                  paginatedInvestors.map((inv, idx) => (
                    <tr key={inv.uuid} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-medium text-slate-500">{startIndex + idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">{inv.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{inv.name}</td>
                      <td className="py-3 px-4 text-slate-700">{inv.mobile}</td>
                      <td className="py-3 px-4 text-slate-700">{inv.email || "-"}</td>
                      <td className="py-3 px-4 text-slate-700 text-xs">{inv.chartOfGroups || "-"}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{inv.createdBy || "-"}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(inv)}
                            title="Edit"
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(inv)}
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
              Showing {filteredInvestors.length === 0 ? 0 : startIndex + 1} to{" "}
              {Math.min(startIndex + entriesPerPage, filteredInvestors.length)} of {filteredInvestors.length} entries
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
      {(isAddOpen || editingInvestor) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">
                {editingInvestor ? `Edit Investor: ${editingInvestor.name}` : "Add New Investor"}
              </h3>
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingInvestor(null);
                }}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingInvestor ? handleEditSubmit : handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Investor Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Investor Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Mobile <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="017xxxxxxxx"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="investor@example.com"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    NID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nid}
                    onChange={(e) => setFormData({ ...formData, nid: e.target.value })}
                    placeholder="National ID"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Chart Of Groups (Group Tier) <span className="text-rose-500">*</span>
                  </label>
                  <PredictiveSearchSelect
                    options={TIER_OPTIONS}
                    value={formData.chartOfGroups}
                    onChange={(val) => setFormData({ ...formData, chartOfGroups: val })}
                    placeholder="Select Group Tier"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Under Group</label>
                  <PredictiveSearchSelect
                    options={UNDER_OPTIONS}
                    value={formData.under}
                    onChange={(val) => setFormData({ ...formData, under: val })}
                    placeholder="Select Under Group"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street / Area, City"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Nominee details */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Nominee Details</span>
                  <button
                    type="button"
                    onClick={addNomineeRow}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Nominee
                  </button>
                </div>

                {formData.nominees.map((nominee, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Nominee Name"
                      value={nominee.nomineeName}
                      onChange={(e) => handleNomineeChange(idx, "nomineeName", e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Nominee NID"
                      value={nominee.nomineeNid}
                      onChange={(e) => handleNomineeChange(idx, "nomineeNid", e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Relation"
                      value={nominee.relation}
                      onChange={(e) => handleNomineeChange(idx, "relation", e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="%"
                        min="0"
                        max="100"
                        value={nominee.percentage}
                        onChange={(e) => handleNomineeChange(idx, "percentage", e.target.value)}
                        className="w-16 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => removeNomineeRow(idx)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
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
                    setEditingInvestor(null);
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
                    <Check className="w-4 h-4" />
                  )}
                  {editingInvestor ? "Update Investor" : "Save Investor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
