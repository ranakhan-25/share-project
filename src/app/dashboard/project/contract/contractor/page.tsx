/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  FileSpreadsheet,
  FileText,
  User,
  Edit3,
  Trash2,
  X,
  Check,
  Loader2,
  Printer,
} from "lucide-react";

// ---------- Types ----------
interface Contractor {
  id: number | string;
  uuid: string;
  code: string;
  name: string;
  business: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: string | number;
  dueDate: string;
  under: string;
  status: string;
  ledgerEntries?: LedgerEntry[];
}

interface LedgerEntry {
  id: number;
  date: string;
  project: string;
  description: string;
  voucherNo: string;
  debit: number;
  credit: number;
  balance: number;
  note: string;
}

// ---------- API helpers ----------
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

async function fetchContractors(): Promise<{
  data: Contractor[];
  meta: any;
}> {
  const res = await fetch(
    `${API_BASE}/realbizpro/api/v1/contractor?page=1&limit=100&skip=0&sortBy=createdAt&sortOrder=DESC&withDeleted=false&status=active`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${token}`  // add if needed
      },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch contractors: ${res.status}`);
  }
  const json = await res.json();

  const mapped: Contractor[] = (json?.data?.data || []).map((item: any) => ({
    id: Number(item.id) || item.uuid,
    uuid: item.uuid,
    code: item.code || "",
    name: item.name || "",
    business: item.businessName || "",
    phone: item.mobileNo || item.phone || "",
    email: item.email || "",
    address: item.address || "",
    creditLimit: item.creditLimit ?? "",
    dueDate: item.dueDate ? String(item.dueDate).slice(0, 10) : "",
    under: item.under
      ? item.under.charAt(0).toUpperCase() + item.under.slice(1).toLowerCase()
      : "Worker",
    status: item.status || "active",
    ledgerEntries: item.ledgerEntries || [],
  }));

  return { data: mapped, meta: json?.data?.meta };
}

async function createContractor(payload: Record<string, any>) {
  const res = await fetch(`${API_BASE}/realbizpro/api/v1/contractor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = "Create failed";
    try {
      const body = await res.json();
      msg = body?.message || body?.error || msg;
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : String(e));
    }
    throw new Error(msg);
  }
  return res.json();
}

async function updateContractor(uuid: string, payload: Record<string, any>) {
  const res = await fetch(
    `${API_BASE}/realbizpro/api/v1/contractor/${uuid}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    let msg = "Update failed";
    try {
      const body = await res.json();
      msg = body?.message || body?.error || msg;
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : String(e));
    }
    throw new Error(msg);
  }
  return res.json();
}

async function softDeleteContractor(uuid: string) {
  const res = await fetch(
    `${API_BASE}/realbizpro/api/v1/contractor/${uuid}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    },
  );
  if (!res.ok) throw new Error("Delete failed");
  return res.json().catch(() => ({}));
}

// ---------- Form Modal ----------
function ContractorFormModal({
  title,
  initialData,
  onClose,
  onSubmit,
}: {
  title: string;
  initialData?: Contractor;
  onClose: () => void;
  onSubmit: (data: Partial<Contractor>) => void;
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    business: initialData?.business || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    address: initialData?.address || "",
    creditLimit: String(initialData?.creditLimit ?? ""),
    dueDate: initialData?.dueDate || "",
    under: initialData?.under || "Worker",
    code:
      initialData?.code ||
      `CON-${new Date().getFullYear()}-${String(
        Math.floor(100 + Math.random() * 900),
      ).padStart(3, "0")}`,
  });
  const [submitting, setSubmitting] = useState(false);

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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-100 flex flex-col">
        <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-indigo-700 rounded-full transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Code
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                disabled={!!initialData}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-50 font-mono text-indigo-600 font-semibold disabled:opacity-70"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Phone/Mobile *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="017xxxxxxxx"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="example@gmail.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Business / Organization
              </label>
              <input
                type="text"
                value={formData.business}
                onChange={(e) =>
                  setFormData({ ...formData, business: e.target.value })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Business name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Credit Limit
              </label>
              <input
                type="number"
                value={formData.creditLimit}
                onChange={(e) =>
                  setFormData({ ...formData, creditLimit: e.target.value })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Under Group
              </label>
              <select
                value={formData.under}
                onChange={(e) =>
                  setFormData({ ...formData, under: e.target.value })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="Worker">Worker</option>
                <option value="Contractor">Contractor</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Full address"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-medium text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg font-medium text-xs shadow-sm transition cursor-pointer flex items-center"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-1.5" />
              )}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- Main Page ----------
export default function WorkerContractorPage() {
  const [workers, setWorkers] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(20);

  // Modals
  const [selectedProfile, setSelectedProfile] = useState<Contractor | null>(
    null,
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Contractor | null>(null);

  // Load data from API
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await fetchContractors();
      setWorkers(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load contractors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredWorkers = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.phone.includes(searchTerm) ||
      (w.business &&
        w.business.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const handleDelete = async (worker: Contractor) => {
    if (!confirm(`Delete ${worker.name}?`)) return;
    try {
      const uuid = worker.uuid;
      if (uuid) {
        await softDeleteContractor(uuid);
      }
      // Optimistic UI update
      setWorkers((prev) => prev.filter((w) => w.uuid !== worker.uuid));
    } catch (err) {
      console.error(err);
      alert("Delete failed. Please try again.");
    }
  };

  // Map form → API payload (matches your sample response)
  const toApiPayload = (data: Partial<Contractor>) => ({
    code: data.code || "",
    name: data.name || "",
    businessName: data.business || "",
    email: data.email || "",
    mobileNo: data.phone || "",
    address: data.address || "",
    creditLimit: Number(data.creditLimit) || 0,
    dueDate: data.dueDate ? new Date(data.dueDate).toISOString().slice(0, 10) : null,
    under: (data.under || "Worker").toLowerCase(),
    status: "active",
  });

  return (
    <div className="min-h-screen bg-white text-slate-800 p-4 md:p-6 space-y-4 antialiased">
      {/* Breadcrumbs & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-4">
        <div className="flex items-center text-sm text-slate-500 space-x-2">
          <span className="hover:text-indigo-600 cursor-pointer font-medium">
            Home
          </span>
          <span>›</span>
          <span className="hover:text-indigo-600 cursor-pointer font-medium">
            Labour/Worker
          </span>
          <span>›</span>
          <span className="text-slate-800 font-semibold">
            Contractor List
          </span>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Labour/Worker Add
        </button>
      </div>

      {/* Export & Control Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div className="flex items-center space-x-2">
          <button className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded shadow-sm transition">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" /> Excel
          </button>
          <button className="inline-flex items-center px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded shadow-sm transition">
            <FileText className="w-3.5 h-3.5 mr-1.5" /> PDF
          </button>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-4">
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading contractors...
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
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-indigo-600 text-white text-xs font-semibold tracking-wider uppercase">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4">Under</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredWorkers.length > 0 ? (
                  filteredWorkers
                    .slice(0, entriesPerPage)
                    .map((worker, index) => (
                      <tr
                        key={worker.uuid || worker.id}
                        className="hover:bg-indigo-50/40 transition-colors"
                      >
                        <td className="py-3 px-4 text-slate-500 font-medium">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-indigo-600 font-semibold">
                          {worker.code}
                        </td>
                        <td className="py-3 px-4 text-slate-900 font-medium">
                          {worker.name}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {worker.business || "-"}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {worker.phone}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {worker.email || "-"}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {worker.address || "-"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              worker.under === "Contractor"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {worker.under || "Worker"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => setSelectedProfile(worker)}
                              title="View Profile / Ledger"
                              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-xs transition cursor-pointer"
                            >
                              <User className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingWorker(worker)}
                              title="Edit"
                              className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded shadow-xs transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(worker)}
                              title="Delete"
                              className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded shadow-xs transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-400">
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
              <span className="font-semibold text-slate-700 text-sm">
                Account Ledger Profile
              </span>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all">
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="h-28 bg-gradient-to-r from-cyan-400 to-indigo-600 relative flex items-center justify-center">
                  <div className="absolute -bottom-8 w-20 h-20 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center shadow-md overflow-hidden text-slate-500 font-bold text-xl">
                    {selectedProfile.name?.charAt(0) || "?"}
                  </div>
                </div>
                <div className="pt-10 pb-4 px-6 text-center">
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedProfile.name}
                  </h2>
                  <div className="mt-3 border-t border-slate-100 divide-y divide-slate-100 text-xs text-left">
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-400">ID / Code</span>
                      <span className="font-medium text-slate-800">
                        {selectedProfile.code}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-400">Company</span>
                      <span className="font-medium text-slate-800">
                        {selectedProfile.business || "—"}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-400">Phone</span>
                      <span className="font-medium text-slate-800">
                        {selectedProfile.phone || "—"}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-400">Email</span>
                      <span className="font-medium text-slate-800">
                        {selectedProfile.email || "—"}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-400">Address</span>
                      <span className="font-medium text-slate-800">
                        {selectedProfile.address || "—"}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-400">Credit Limit</span>
                      <span className="font-medium text-slate-800">
                        {selectedProfile.creditLimit ?? "—"}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-400">Under</span>
                      <span className="font-medium text-slate-800">
                        {selectedProfile.under || "—"}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-400">Status</span>
                      <span className="font-medium text-slate-800">
                        {selectedProfile.status || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800">Ledger</h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-indigo-600 text-white font-medium">
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">DATE</th>
                        <th className="py-2.5 px-3">PROJECT</th>
                        <th className="py-2.5 px-3">DESCRIPTION</th>
                        <th className="py-2.5 px-3">VOUCHER NO</th>
                        <th className="py-2.5 px-3">DEBIT</th>
                        <th className="py-2.5 px-3">CREDIT</th>
                        <th className="py-2.5 px-3">BALANCE</th>
                        <th className="py-2.5 px-3">NOTE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="bg-slate-50/50 font-medium text-slate-600">
                        <td colSpan={7} className="py-2 px-3 text-right">
                          Opening
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          0.00
                        </td>
                        <td></td>
                      </tr>
                      {selectedProfile.ledgerEntries &&
                      selectedProfile.ledgerEntries.length > 0 ? (
                        selectedProfile.ledgerEntries.map((entry, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-2.5 px-3">{entry.id}</td>
                            <td className="py-2.5 px-3">{entry.date}</td>
                            <td className="py-2.5 px-3">{entry.project}</td>
                            <td className="py-2.5 px-3 text-indigo-600 font-medium">
                              {entry.description}
                            </td>
                            <td className="py-2.5 px-3 text-indigo-600 font-mono">
                              {entry.voucherNo}
                            </td>
                            <td className="py-2.5 px-3">
                              {entry.debit.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3">
                              {entry.credit.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 font-semibold">
                              {entry.balance.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3">{entry.note || ""}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={9}
                            className="text-center py-6 text-slate-400"
                          >
                            No ledger transactions recorded.
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

      {/* Add Modal */}
      {isAddModalOpen && (
        <ContractorFormModal
          title="Labour/Worker Add"
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={async (newData) => {
            try {
              await createContractor(toApiPayload(newData));
              setIsAddModalOpen(false);
              await loadData();
            } catch (err: any) {
              alert(err.message || "Create failed");
            }
          }}
        />
      )}

      {/* Edit Modal */}
      {editingWorker && (
        <ContractorFormModal
          title="Edit Labour/Worker"
          initialData={editingWorker}
          onClose={() => setEditingWorker(null)}
          onSubmit={async (updatedData) => {
            try {
              await updateContractor(
                editingWorker.uuid,
                toApiPayload(updatedData),
              );
              setEditingWorker(null);
              await loadData();
            } catch (err: any) {
              alert(err.message || "Update failed");
            }
          }}
        />
      )}
    </div>
  );
}