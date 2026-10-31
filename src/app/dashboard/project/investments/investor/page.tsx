/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit3,
  User,
  Trash2,
  X,
  Upload,
  FileText,
  Check,
  Loader2,
} from "lucide-react";

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
  imageFile?: File | null;
};

// ---------- API helpers ----------
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

async function fetchInvestors(): Promise<{ data: Investor[]; meta: any }> {
  const res = await fetch(
    `${API_BASE}/realbizpro/api/v1/investor?page=1&limit=100&skip=0&sortBy=createdAt&sortOrder=DESC&withDeleted=false&status=active`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error(`Failed to fetch investors: ${res.status}`);
  const json = await res.json();

  const mapped: Investor[] = (json?.data?.data || []).map((item: any) => ({
    id: Number(item.id) || item.uuid,
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
    nominees: (item.nominees || []).map((n: any) => ({
      id: n.id,
      uuid: n.uuid,
      nomineeName: n.nomineeName || "",
      nomineeNid: n.nomineeNid || "",
      relation: n.relation || "",
      percentage: String(n.percentage ?? ""),
    })),
  }));

  return { data: mapped, meta: json?.data?.meta };
}

function buildFormData(payload: Record<string, any>, imageFile?: File | null) {
  const fd = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key === "nominees") {
      fd.append(key, JSON.stringify(value));
    } else if (value !== undefined && value !== null) {
      fd.append(key, String(value));
    }
  });
  if (imageFile) fd.append("image", imageFile);
  return fd;
}

async function createInvestor(payload: Record<string, any>, imageFile?: File | null) {
  const res = await fetch(`${API_BASE}/realbizpro/api/v1/investor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = "Create failed";
    try {
      const body = await res.json();
      msg = body?.message || body?.error || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json();
}

async function updateInvestor(uuid: string, payload: Record<string, any>, imageFile?: File | null) {
  const res = await fetch(`${API_BASE}/realbizpro/api/v1/investor/${uuid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = "Update failed";
    try {
      const body = await res.json();
      msg = body?.message || body?.error || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json();
}

async function softDeleteInvestor(uuid: string) {
  const res = await fetch(`${API_BASE}/realbizpro/api/v1/investor/${uuid}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Delete failed");
  return res.json().catch(() => ({}));
}

// ---------- Form Modal ----------
function InvestorFormModal({
  title,
  initialData,
  onClose,
  onSubmit,
}: {
  title: string;
  initialData?: Investor;
  onClose: () => void;
  onSubmit: (data: InvestorFormData) => Promise<void>;
}) {
  const [formData, setFormData] = useState<InvestorFormData>({
    code:
      initialData?.code ||
      `INV-${new Date().getFullYear()}-${String(
        Math.floor(100 + Math.random() * 900),
      ).padStart(3, "0")}`,
    name: initialData?.name || "",
    mobile: initialData?.mobile || "",
    email: initialData?.email || "",
    nid: initialData?.nid || "",
    address: initialData?.address || "",
    chartOfGroups: initialData?.chartOfGroups || "",
    under: initialData?.under || "Corporate",
    nominees: initialData?.nominees?.length
      ? initialData.nominees
      : [{ nomineeName: "", nomineeNid: "", relation: "", percentage: "" }],
    imageFile: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleNomineeChange = (
    index: number,
    field: keyof Nominee,
    value: string,
  ) => {
    const updated = [...formData.nominees];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, nominees: updated });
  };

  const addNomineeRow = () => {
    setFormData({
      ...formData,
      nominees: [
        ...formData.nominees,
        {
          nomineeName: formData.name || "", // uporer Name copy
          nomineeNid: formData.nid || "", // uporer NID copy
          relation: "",
          percentage: "",
        },
      ],
    });
  };

  const removeNomineeRow = (index: number) => {
    setFormData({
      ...formData,
      nominees: formData.nominees.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900 text-base">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                disabled={!!initialData}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-50 disabled:opacity-70"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mobile <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Mobile"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({ ...formData, mobile: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                placeholder="E-mail"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                NID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="NID"
                value={formData.nid}
                onChange={(e) =>
                  setFormData({ ...formData, nid: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Address
              </label>
              <input
                type="text"
                placeholder="Address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Image
              </label>
              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-3 py-2 cursor-pointer border-r border-slate-300 transition-colors flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-slate-500" /> Choose File
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        imageFile: e.target.files?.[0] || null,
                      })
                    }
                  />
                </label>
                <span className="px-3 text-xs text-slate-400 truncate max-w-[140px]">
                  {formData.imageFile
                    ? formData.imageFile.name
                    : initialData?.image
                      ? "Current image"
                      : "No file chosen"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Chart Of Groups <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.chartOfGroups}
                onChange={(e) =>
                  setFormData({ ...formData, chartOfGroups: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Select One Option</option>
                <option value="Tier 1 - Primary Investor">
                  Tier 1 - Primary Investor
                </option>
                <option value="Tier 2 - Strategic Partner">
                  Tier 2 - Strategic Partner
                </option>
                <option value="Tier 3 - Regional Affiliate">
                  Tier 3 - Regional Affiliate
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Under Group
              </label>
              <select
                value={formData.under}
                onChange={(e) =>
                  setFormData({ ...formData, under: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Corporate">Corporate</option>
                <option value="General Group">General Group</option>
                <option value="Individual">Individual</option>
              </select>
            </div>

            <button
              type="button"
              onClick={addNomineeRow}
              className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-semibold self-end"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </button>
          </div>

          {/* Nominee Details */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <div className="bg-indigo-600 text-white font-medium px-4 py-2 text-sm">
              Nominee Details
            </div>
            <div className="p-4 space-y-3">
              {formData.nominees.map((nominee, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-2 first:pt-0"
                >
                  <div className="sm:col-span-3">
                    <label className="block text-xs text-slate-500 mb-1">
                      Nominee Name
                    </label>
                    <input
                      type="text"
                      placeholder="Nominee Name"
                      value={nominee.nomineeName}
                      onChange={(e) =>
                        handleNomineeChange(idx, "nomineeName", e.target.value)
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs text-slate-500 mb-1">
                      Nominee NID
                    </label>
                    <input
                      type="text"
                      placeholder="Nominee NID"
                      value={nominee.nomineeNid}
                      onChange={(e) =>
                        handleNomineeChange(idx, "nomineeNid", e.target.value)
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs text-slate-500 mb-1">
                      Relation
                    </label>
                    <input
                      type="text"
                      placeholder="Relation"
                      value={nominee.relation}
                      onChange={(e) =>
                        handleNomineeChange(idx, "relation", e.target.value)
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">
                      Percentage (%)
                    </label>
                    <input
                      type="text"
                      placeholder="Percentage"
                      value={nominee.percentage}
                      onChange={(e) =>
                        handleNomineeChange(idx, "percentage", e.target.value)
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-end justify-center pt-5">
                    {idx === 0 ? (
                      <button
                        type="button"
                        onClick={addNomineeRow}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-xs"
                        title="Add Nominee"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => removeNomineeRow(idx)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                        title="Remove Nominee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-400 hover:bg-slate-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-1.5"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- Main Page ----------
export default function InvestorManagementPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(
    null,
  );

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await fetchInvestors();
      setInvestors(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load investors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reset to first page when search or entries change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, entriesPerPage]);

  const filteredInvestors = investors.filter(
    (inv) =>
      inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.mobile.includes(searchQuery) ||
      inv.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.nid.includes(searchQuery),
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInvestors.length / entriesPerPage),
  );
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedInvestors = filteredInvestors.slice(
    startIndex,
    startIndex + entriesPerPage,
  );

  const handleDelete = async (investor: Investor) => {
    if (!confirm(`Delete ${investor.name}?`)) return;
    try {
      if (investor.uuid) {
        await softDeleteInvestor(investor.uuid);
      }
      setInvestors((prev) => prev.filter((i) => i.uuid !== investor.uuid));
    } catch (err) {
      console.error(err);
      alert("Delete failed. Please try again.");
    }
  };

  // Form → API payload
  const toApiPayload = (data: InvestorFormData) => ({
    code: data.code || "",
    name: data.name || "",
    mobileNo: data.mobile || "",
    email: data.email || "",
    nid: data.nid || "",
    address: data.address || "",
    groupTier: data.chartOfGroups || "",
    underGroup: data.under || "Corporate",
    status: "active",
    nominees: (data.nominees || [])
      .filter((n) => n.nomineeName.trim())
      .map((n) => ({
        nomineeName: n.nomineeName,
        nomineeNid: n.nomineeNid,
        relation: n.relation,
        percentage: n.percentage || "0",
      })),
  });

  return (
    <div className="min-h-screen bg-white text-slate-900 p-4 sm:p-6 flex flex-col justify-between">
      <div className="space-y-4">
        {/* Breadcrumb & Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="text-xs text-slate-500 flex items-center gap-1 mb-1">
              <span>Home</span> /{" "}
              <span className="text-indigo-600 font-medium">Investor</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Investor Management
            </h1>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Investor
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/70 p-3 rounded-xl border border-slate-200/60">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="border border-slate-300 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm text-slate-600">Search:</span>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search investor records..."
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading investors...
          </div>
        )}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-indigo-600 text-white font-medium text-xs tracking-wider uppercase">
                    <th className="py-3 px-4">SL</th>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Mobile</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">NID</th>
                    <th className="py-3 px-4">Under</th>
                    <th className="py-3 px-4 text-center">Image</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedInvestors.length > 0 ? (
                    paginatedInvestors.map((investor, index) => (
                      <tr
                        key={investor.uuid || investor.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-slate-600">
                          {startIndex + index + 1}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-indigo-600 font-semibold">
                          {investor.code}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {investor.name}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {investor.mobile}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {investor.email || "—"}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-600">
                          {investor.nid}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {investor.under || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {investor.image ? (
                            <img
                              src={
                                investor.image.startsWith("http")
                                  ? investor.image
                                  : `${API_BASE}/${investor.image}`
                              }
                              alt={investor.name}
                              className="w-9 h-9 rounded-full object-cover mx-auto border border-slate-200 shadow-xs"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-200 mx-auto flex items-center justify-center text-xs font-bold text-slate-500">
                              {investor.name?.charAt(0) || "?"}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedInvestor(investor)}
                              title="View Profile / Details"
                              className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors"
                            >
                              <User className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingInvestor(investor)}
                              title="Edit Investor"
                              className="p-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-md transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(investor)}
                              title="Delete Investor"
                              className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={9}
                        className="text-center py-10 text-slate-400 font-medium"
                      >
                        No matching records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between p-3 border-t border-slate-200 bg-white gap-2 text-xs text-slate-500">
              <div>
                Showing {filteredInvestors.length === 0 ? 0 : startIndex + 1} to{" "}
                {Math.min(
                  startIndex + entriesPerPage,
                  filteredInvestors.length,
                )}{" "}
                of {filteredInvestors.length} entries
              </div>
              <div className="inline-flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border border-slate-200 bg-slate-50 text-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed hover:bg-slate-100"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 rounded border font-medium ${
                      currentPage === i + 1
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border border-slate-200 bg-slate-50 text-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed hover:bg-slate-100"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <InvestorFormModal
          title="Add New Investor"
          onClose={() => setIsAddOpen(false)}
          onSubmit={async (data) => {
            try {
              await createInvestor(toApiPayload(data), data.imageFile);
              setIsAddOpen(false);
              await loadData();
            } catch (err: any) {
              alert(err.message || "Create failed");
            }
          }}
        />
      )}

      {/* Edit Modal */}
      {editingInvestor && (
        <InvestorFormModal
          title="Edit Investor"
          initialData={editingInvestor}
          onClose={() => setEditingInvestor(null)}
          onSubmit={async (data) => {
            try {
              await updateInvestor(
                editingInvestor.uuid,
                toApiPayload(data),
                data.imageFile,
              );
              setEditingInvestor(null);
              await loadData();
            } catch (err: any) {
              alert(err.message || "Update failed");
            }
          }}
        />
      )}

      {/* Profile Modal */}
      {selectedInvestor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> Investor Full
                Profile Details
              </span>
              <button
                onClick={() => setSelectedInvestor(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 bg-white">
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                {selectedInvestor.image ? (
                  <img
                    src={
                      selectedInvestor.image.startsWith("http")
                        ? selectedInvestor.image
                        : `${API_BASE}/${selectedInvestor.image}`
                    }
                    alt={selectedInvestor.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-500 border-4 border-white shadow-md">
                    {selectedInvestor.name?.charAt(0) || "?"}
                  </div>
                )}
                <div className="space-y-1 text-center sm:text-left">
                  <h2 className="text-xl font-bold text-slate-900">
                    {selectedInvestor.name}
                  </h2>
                  <p className="text-xs font-mono text-indigo-600 font-semibold">
                    {selectedInvestor.code}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedInvestor.address}
                  </p>
                  <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Group: {selectedInvestor.chartOfGroups || "—"}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Under: {selectedInvestor.under || "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
                  Contact & Identification Info
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-xs">
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mobile:</span>
                      <span className="font-medium text-slate-800">
                        {selectedInvestor.mobile}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-medium text-slate-800">
                        {selectedInvestor.email || "—"}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">NID Number:</span>
                      <span className="font-mono font-medium text-slate-800">
                        {selectedInvestor.nid}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Address:</span>
                      <span className="font-medium text-slate-800">
                        {selectedInvestor.address || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800">
                  Nominee Information
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-indigo-600 text-white font-medium uppercase tracking-wider">
                        <th className="py-2.5 px-3">SL</th>
                        <th className="py-2.5 px-3">Nominee Name</th>
                        <th className="py-2.5 px-3">Nominee NID</th>
                        <th className="py-2.5 px-3">Relation</th>
                        <th className="py-2.5 px-3">Percentage (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvestor.nominees?.length > 0 ? (
                        selectedInvestor.nominees.map((nom, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-2.5 px-3 font-medium text-slate-600">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-900">
                              {nom.nomineeName}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">
                              {nom.nomineeNid}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {nom.relation}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-indigo-600">
                              {nom.percentage}%
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center py-6 text-slate-400"
                          >
                            No nominee records registered.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
