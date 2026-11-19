/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  FileSpreadsheet,
  FileText,
  User,
  Edit3,
  Trash2,
  X,
  Calendar,
  Check,
  Loader2,
  ChevronRight,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import PredictiveSearchSelect from "@/components/ui/PredictiveSearchSelect";
import { getStoredUser, getStoredAccessToken } from "@/lib/admin-auth/adminAuthStorage";

// ==================== TYPES ====================
interface LedgerEntry {
  id: number;
  date: string;
  project: string;
  description: string;
  voucherNo: string;
  debit: number;
  credit: number;
  balance: number;
  note?: string;
}

interface LabourWorkBank {
  id: number | string;
  uuid?: string;
  code: string;
  name: string;
  business: string;
  phone: string;
  email: string;
  address: string;
  under: string;
  creditLimit?: number;
  dueDate?: string;
  status?: string;
  createdBy?: string;
  addedById?: string;
  ledgerEntries?: LedgerEntry[];
}

// ==================== API HELPERS ====================
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";

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

async function handleRes(res: Response, action: string) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      json?.message || json?.error || `Failed to ${action} (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return json;
}

async function fetchLabourWorkBanks(userEmail: string): Promise<{
  data: LabourWorkBank[];
  meta: any;
}> {
  const url = `${API_BASE}/realbizpro/api/v1/labour-work-bank?page=1&limit=100&status=active&sortOrder=DESC&withDeleted=false`;

  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  const json = await handleRes(res, "fetch labour work banks");

  const mapped: LabourWorkBank[] = (json?.data?.data || [])
    .map((item: any) => ({
      id: item.id ?? item.uuid,
      uuid: item.uuid,
      code: item.code || "",
      name: item.name || "",
      business: item.businessName || "",
      phone: item.phone || "",
      email: item.email || "",
      address: item.address || "",
      under: item.underGroup || "Labour",
      creditLimit: item.creditLimit != null ? Number(item.creditLimit) : 0,
      dueDate: item.dueDate ? String(item.dueDate).slice(0, 10) : "",
      status: item.status || "active",
      createdBy: item.createdBy || item.addedById || "",
      addedById: item.addedById || "",
      ledgerEntries: item.ledgerEntries || [],
    }))
    .filter((w: LabourWorkBank) => {
      if (w.status === "inactive" || w.status === "deleted") return false;
      if (!userEmail) return true;
      const creator = String(w.createdBy || w.addedById || "").toLowerCase().trim();
      return creator === userEmail || w.email.toLowerCase().trim() === userEmail;
    });

  return { data: mapped, meta: json?.data?.meta };
}

async function createLabourWorkBank(payload: Record<string, any>) {
  const res = await fetch(`${API_BASE}/realbizpro/api/v1/labour-work-bank`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleRes(res, "create labour work bank");
}

async function updateLabourWorkBank(
  uuid: string,
  payload: Record<string, any>,
) {
  const res = await fetch(
    `${API_BASE}/realbizpro/api/v1/labour-work-bank/${uuid}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );
  return handleRes(res, "update labour work bank");
}

async function softDeleteLabourWorkBank(uuid: string) {
  const res = await fetch(
    `${API_BASE}/realbizpro/api/v1/labour-work-bank/${uuid}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );
  return handleRes(res, "delete labour work bank");
}

// Form data → API payload
const toApiPayload = (data: Partial<LabourWorkBank>, userEmail: string) => {
  let dueDateISO: string | null = null;
  if (data.dueDate) {
    const d = new Date(data.dueDate);
    if (!isNaN(d.getTime())) {
      dueDateISO = d.toISOString();
    }
  }

  return {
    code: data.code || "",
    name: data.name || "",
    businessName: data.business || "",
    email: data.email || "",
    phone: data.phone || "",
    address: data.address || "",
    creditLimit: Number(data.creditLimit) || 0,
    dueDate: dueDateISO,
    underGroup: data.under || "Labour",
    addedById: userEmail || "sharetest@realbiz.com",
    status: "active",
  };
};

const underOptions = [
  { value: "Labour", label: "Labour" },
  { value: "Worker", label: "Worker" },
  { value: "Contractor", label: "Contractor" },
];

const entriesOptions = [
  { value: "10", label: "10 entries" },
  { value: "13", label: "13 entries" },
  { value: "20", label: "20 entries" },
  { value: "50", label: "50 entries" },
];

// ==================== FORM MODAL ====================
function LabourFormModal({
  title,
  initialData,
  onClose,
  onSubmit,
}: {
  title: string;
  initialData?: LabourWorkBank;
  onClose: () => void;
  onSubmit: (data: Partial<LabourWorkBank>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    code:
      initialData?.code ||
      `LWB-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 900) + 100,
      )}`,
    name: initialData?.name || "",
    business: initialData?.business || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    creditLimit: initialData?.creditLimit || 0,
    dueDate: initialData?.dueDate || "",
    under: initialData?.under || "Labour",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await onSubmit(formData);
    } catch (err: any) {
      setFormError(err?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-100 flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg transition text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Bank Code
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                disabled={!!initialData}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter Name"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Business / Organization
              </label>
              <input
                type="text"
                value={formData.business}
                onChange={(e) =>
                  setFormData({ ...formData, business: e.target.value })
                }
                placeholder="Enter Business Name"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter E-mail"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Phone / Mobile *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Enter Phone/Mobile"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Credit Limit (৳)
              </label>
              <input
                type="number"
                value={formData.creditLimit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    creditLimit: Number(e.target.value) || 0,
                  })
                }
                placeholder="Enter Credit Limit"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate ? formData.dueDate.slice(0, 10) : ""}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Under Group
              </label>
              <PredictiveSearchSelect
                options={underOptions}
                value={formData.under}
                onChange={(val) => setFormData(prev => ({ ...prev, under: val }))}
                placeholder="Select Under"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Enter Address"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
              />
            </div>
          </div>

          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs">
              {formError}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold text-xs transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Save
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================
export default function LabourWorkBankListPage() {
  const [storedUser, setStoredUser] = useState<any>(null);
  useEffect(() => {
    setStoredUser(getStoredUser());
  }, []);
  const userEmail = (storedUser?.email || "").toLowerCase().trim();

  const [workers, setWorkers] = useState<LabourWorkBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<LabourWorkBank | null>(null);

  const loadWorkers = async () => {
    try {
      setLoading(true);
      setError(null);
      const currentUser = getStoredUser();
      const activeEmail = (currentUser?.email || userEmail || "").toLowerCase().trim();
      const { data } = await fetchLabourWorkBanks(activeEmail);
      setWorkers(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load labour work banks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, [userEmail]);

  const handleCreate = async (data: Partial<LabourWorkBank>) => {
    const payload = toApiPayload(data, userEmail);
    await createLabourWorkBank(payload);
    toast.success("Created successfully!");
    setIsAddModalOpen(false);
    await loadWorkers();
  };

  const handleUpdate = async (data: Partial<LabourWorkBank>) => {
    if (!editingWorker?.uuid) return;
    const payload = toApiPayload(data, userEmail);
    await updateLabourWorkBank(editingWorker.uuid, payload);
    toast.success("Updated successfully!");
    setEditingWorker(null);
    await loadWorkers();
  };

  const handleDelete = async (worker: LabourWorkBank) => {
    if (!window.confirm(`Delete "${worker.name}"?`)) return;

    try {
      if (!worker.uuid) throw new Error("Labour Work Bank UUID is missing");
      await softDeleteLabourWorkBank(worker.uuid);
      toast.success("Deleted successfully!");
      setWorkers(prev => prev.filter(w => w.uuid !== worker.uuid));
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    }
  };

  const filteredWorkers = workers.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.phone.includes(searchTerm) ||
      w.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.business &&
        w.business.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesGroup = groupFilter ? w.under === groupFilter : true;
    return matchesSearch && matchesGroup;
  });

  const totalPages = Math.ceil(filteredWorkers.length / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentTableData = filteredWorkers.slice(
    startIndex,
    startIndex + entriesPerPage,
  );

  const filterGroupOptions = [
    { value: "", label: "All Groups" },
    { value: "Labour", label: "Labour" },
    { value: "Worker", label: "Worker" },
    { value: "Contractor", label: "Contractor" },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      <div className="mx-auto max-w-[1600px] space-y-5">
        
        {/* Breadcrumbs & Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <nav className="flex items-center text-xs sm:text-sm text-slate-500 gap-1.5 sm:gap-2 mb-1">
              <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Dashboard</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Project</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Contract</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                Labour Work Bank
              </span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Labour Work Bank / লেবার ওয়ার্ক ব্যাংক
            </h1>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 hover:shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> + Labour/Worker Add
          </button>
        </div>

        {/* Filter and Table Container */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-48">
                <PredictiveSearchSelect
                  options={filterGroupOptions}
                  value={groupFilter}
                  onChange={(val) => {
                    setGroupFilter(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Filter by Group"
                />
              </div>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-700 active:scale-95">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-rose-700 active:scale-95">
                  <FileText className="w-3.5 h-3.5" /> PDF
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-32">
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
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search..."
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
          ) : (
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-xs sm:text-sm text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white text-xs font-bold uppercase tracking-wider">
                    {["ID", "CODE", "NAME", "BUSINESS", "PHONE", "EMAIL", "UNDER", "CREDIT LIMIT", "ADDED BY", "ACTION"].map(h => (
                      <th key={h} className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700 font-medium">
                  {currentTableData.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-16 text-slate-400">
                        No labour work bank records available
                      </td>
                    </tr>
                  ) : (
                    currentTableData.map((worker, index) => (
                      <tr key={worker.uuid || worker.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">{startIndex + index + 1}</td>
                        <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-semibold">{worker.code}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{worker.name}</td>
                        <td className="px-4 py-3 text-slate-600">{worker.business || "-"}</td>
                        <td className="px-4 py-3 text-slate-600">{worker.phone || "-"}</td>
                        <td className="px-4 py-3 text-slate-600">{worker.email || "-"}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {worker.under}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-600">৳{Number(worker.creditLimit || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-500">{worker.createdBy || userEmail}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingWorker(worker)}
                              className="rounded-lg bg-teal-50 p-1.5 text-teal-600 transition hover:bg-teal-100 active:scale-95"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(worker)}
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
              Showing {filteredWorkers.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + entriesPerPage, filteredWorkers.length)} of {filteredWorkers.length} entries
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

      {/* Add Modal */}
      {isAddModalOpen && (
        <LabourFormModal
          title="New Labour / Worker Bank"
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* Edit Modal */}
      {editingWorker && (
        <LabourFormModal
          title="Edit Labour / Worker Bank"
          initialData={editingWorker}
          onClose={() => setEditingWorker(null)}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  );
}
