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
  Printer,
  Check,
  Loader2,
} from "lucide-react";

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

interface Supplier {
  id: number | string;
  uuid?: string;
  code: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  under: string;
  creditLimit?: number;
  dueDate?: string;
  image?: string;
  status?: string;
  ledger?: LedgerEntry[];
}

// ==================== API HELPERS ====================
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// shared error reader: backend er asol message ber kore ane
async function handleRes(res: Response, action: string) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      json?.message || json?.error || `Failed to ${action} (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return json;
}

async function fetchSuppliers(params?: {
  page?: number;
  limit?: number;
}): Promise<{ data: Supplier[]; meta: any }> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 100;

  // status=active — tai soft-deleted (inactive) record ar list e asbe na
  const url = `${API_BASE}/realbizpro/api/v1/supplier-accounts?page=${page}&limit=${limit}&skip=0&status=active&sortBy=createdAt&sortOrder=DESC&withDeleted=false`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // Authorization: `Bearer ${token}`, // uncomment if needed
    },
    cache: "no-store",
  });

  const json = await handleRes(res, "fetch suppliers");

  const mapped: Supplier[] = (json?.data?.data || [])
    .map((item: any) => ({
      id: item.id ?? item.uuid,
      uuid: item.uuid,
      code: item.supplierCode || "",
      name: item.supplierName || "",
      company: item.businessName || "",
      phone: item.phone || "",
      email: item.email || "",
      address: item.address || "",
      under: item.underGroup || "Local Supplier",
      creditLimit: item.creditLimit ?? 0,
      // YYYY-MM-DD রাখা হলো, date input e tikm bose
      dueDate: item.dueDate ? String(item.dueDate).slice(0, 10) : "",
      status: item.status || "active",
      ledger: item.ledger || [],
    }))
    // safety net: backend status param ignore korleo inactive record aasbe na
    .filter(
      (s: Supplier) => s.status !== "inactive" && s.status !== "deleted",
    );

  return { data: mapped, meta: json?.data?.meta };
}

// POST /realbizpro/api/v1/supplier-accounts
async function createSupplier(payload: Record<string, any>) {
  const res = await fetch(`${API_BASE}/realbizpro/api/v1/supplier-accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleRes(res, "create supplier");
}

// PATCH /realbizpro/api/v1/supplier-accounts/{uuid}
async function updateSupplier(uuid: string, payload: Record<string, any>) {
  const res = await fetch(
    `${API_BASE}/realbizpro/api/v1/supplier-accounts/${uuid}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return handleRes(res, "update supplier");
}

// DELETE /realbizpro/api/v1/supplier-accounts/{uuid}
async function softDeleteSupplier(uuid: string) {
  const res = await fetch(
    `${API_BASE}/realbizpro/api/v1/supplier-accounts/${uuid}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    },
  );
  return handleRes(res, "delete supplier");
}

// Form data → exact API payload
const toApiPayload = (data: Partial<Supplier>) => {
  let dueDateISO: string | null = null;
  if (data.dueDate) {
    // supports "2026-12-31" or "12/31/2026"
    const d = new Date(data.dueDate);
    if (!isNaN(d.getTime())) {
      dueDateISO = d.toISOString();
    }
  }

  return {
    supplierCode: data.code || "",
    supplierName: data.name || "",
    businessName: data.company || "",
    email: data.email || "",
    phone: data.phone || "",
    address: data.address || "",
    creditLimit: Number(data.creditLimit) || 0,
    dueDate: dueDateISO,
    underGroup: data.under || "Local Supplier",
    status: "active",
    // addedById: "user-uuid", // uncomment & set if required
  };
};

// ==================== FORM MODAL ====================
function SupplierFormModal({
  title,
  initialData,
  onClose,
  onSubmit,
}: {
  title: string;
  initialData?: Supplier;
  onClose: () => void;
  onSubmit: (data: Partial<Supplier>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    code:
      initialData?.code ||
      `SUP-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 900) + 100,
      )}`,
    name: initialData?.name || "",
    company: initialData?.company || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    creditLimit: initialData?.creditLimit || 0,
    dueDate: initialData?.dueDate || "",
    under: initialData?.under || "Local Supplier",
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
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden my-8 border border-slate-100 flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Code
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
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
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Business/Organization
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                placeholder="Enter Business Name"
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter E-mail"
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Phone/Mobile
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Enter Phone/Mobile"
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Enter Address"
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Credit Limit
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
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.dueDate ? formData.dueDate.slice(0, 10) : ""}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Under
              </label>
              <select
                value={formData.under}
                onChange={(e) =>
                  setFormData({ ...formData, under: e.target.value })
                }
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Local Supplier">Local Supplier</option>
                <option value="Sundry Creditors">Sundry Creditors</option>
                <option value="Direct Expenses">Direct Expenses</option>
                <option value="Indirect Expenses">Indirect Expenses</option>
              </select>
            </div>
          </div>

          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-xs">
              {formError}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2 bg-slate-400 hover:bg-slate-500 text-white rounded-md font-medium text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium text-xs transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Submit
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
export default function SupplierListPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(13);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedProfile, setSelectedProfile] = useState<Supplier | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await fetchSuppliers({ page: 1, limit: 100 });
      setSuppliers(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGroup = groupFilter ? s.under === groupFilter : true;
    return matchesSearch && matchesGroup;
  });

  const totalPages = Math.ceil(filteredSuppliers.length / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentTableData = filteredSuppliers.slice(
    startIndex,
    startIndex + entriesPerPage,
  );

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`Delete "${supplier.name}"?`)) return;

    try {
      setActionLoading(true);
      if (!supplier.uuid) throw new Error("Supplier UUID is missing");
      await softDeleteSupplier(supplier.uuid); // DELETE
      await loadSuppliers(); // database theke abar load
      if (currentPage > 1 && currentTableData.length === 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Delete failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 p-4 md:p-6 space-y-4 antialiased">
      {/* Breadcrumbs & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-4">
        <div className="flex items-center text-sm text-slate-500 space-x-2">
          <span className="hover:text-indigo-600 cursor-pointer font-medium">
            Home
          </span>
          <span>›</span>
          <span className="hover:text-indigo-600 cursor-pointer font-medium">
            Contact
          </span>
          <span>›</span>
          <span className="text-slate-800 font-semibold">Supplier List</span>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1" /> Supplier Add
        </button>
      </div>

      {/* Filter by Group & Export */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-slate-600">
          Chart Of Group (Under)
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="w-full md:w-72">
            <select
              value={groupFilter}
              onChange={(e) => {
                setGroupFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select value</option>
              <option value="Local Supplier">Local Supplier</option>
              <option value="Sundry Creditors">Sundry Creditors</option>
              <option value="Direct Expenses">Direct Expenses</option>
              <option value="Indirect Expenses">Indirect Expenses</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded shadow-xs transition">
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> Excel
            </button>
            <button className="inline-flex items-center px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded shadow-xs transition">
              <FileText className="w-3.5 h-3.5 mr-1" /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Show Entries & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 gap-4">
        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <span>Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value={10}>10</option>
            <option value={13}>13</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <span>Search:</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-slate-200 rounded px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white w-48 sm:w-60"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading suppliers...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadSuppliers}
            className="underline text-xs font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-indigo-600 text-white text-xs font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Company</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Address</th>
                  <th className="py-2.5 px-3">Under</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {currentTableData.length > 0 ? (
                  currentTableData.map((supplier, index) => (
                    <tr
                      key={supplier.uuid || supplier.id}
                      className="hover:bg-indigo-50/30 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-slate-500 font-medium">
                        {startIndex + index + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-indigo-600 font-semibold">
                        {supplier.code}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {supplier.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {supplier.company || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {supplier.phone || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {supplier.email || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {supplier.address || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {supplier.under}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => setEditingSupplier(supplier)}
                            title="Edit Supplier"
                            className="p-1 bg-cyan-400 hover:bg-cyan-500 text-white rounded shadow-xs transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedProfile(supplier)}
                            title="View Profile & Ledger"
                            className="p-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-xs transition cursor-pointer"
                          >
                            <User className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(supplier)}
                            title="Delete Supplier"
                            disabled={actionLoading}
                            className="p-1 bg-rose-500 hover:bg-rose-600 text-white rounded shadow-xs transition cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-6 text-slate-400">
                      No supplier records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-white border-t border-slate-100 text-xs text-slate-500">
            <div>
              Showing {filteredSuppliers.length > 0 ? startIndex + 1 : 0} to{" "}
              {Math.min(startIndex + entriesPerPage, filteredSuppliers.length)}{" "}
              of {filteredSuppliers.length} entries
            </div>
            <div className="flex items-center space-x-1 mt-2 sm:mt-0">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 border border-slate-200 rounded ${
                  currentPage === 1
                    ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                    : "hover:bg-slate-50 text-slate-600 cursor-pointer"
                }`}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded font-medium ${
                      currentPage === page
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "border border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className={`px-3 py-1 border border-slate-200 rounded ${
                  currentPage === totalPages || totalPages === 0
                    ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                    : "hover:bg-slate-50 text-slate-600 cursor-pointer"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PROFILE & LEDGER MODAL ==================== */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden my-6 border border-slate-100 flex flex-col max-h-[92vh]">
            <div className="px-6 py-3 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-sm font-semibold text-slate-800">
                Supplier Profile & Ledger
              </h3>
              <div className="flex items-center space-x-2">
                <button className="inline-flex items-center px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded shadow-xs transition">
                  <Printer className="w-3.5 h-3.5 mr-1" /> Print
                </button>
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="p-1 hover:bg-slate-100 rounded-full text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 bg-white">
              {/* Profile Card */}
              <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                <div className="h-28 bg-gradient-to-r from-cyan-400 to-indigo-600 relative flex items-center justify-center">
                  <div className="absolute -bottom-6 w-16 h-16 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center text-slate-500 font-semibold shadow-md overflow-hidden">
                    {selectedProfile.image ? (
                      <img
                        src={selectedProfile.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                </div>

                <div className="pt-8 pb-4 px-6 text-center">
                  <h4 className="text-base font-bold text-slate-800">
                    {selectedProfile.name}
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">
                    {selectedProfile.company}
                  </p>

                  <div className="border-t border-slate-100 divide-y divide-slate-100 text-xs text-left">
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-400">ID</span>
                      <span className="font-mono font-medium text-slate-700">
                        {selectedProfile.code}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-400">Phone</span>
                      <span className="font-medium text-slate-700">
                        {selectedProfile.phone || "-"}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-400">Email</span>
                      <span className="font-medium text-slate-700">
                        {selectedProfile.email || "-"}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-400">Address</span>
                      <span className="font-medium text-slate-700">
                        {selectedProfile.address || "-"}
                      </span>
                    </div>
                    {selectedProfile.creditLimit != null && (
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-400">Credit Limit</span>
                        <span className="font-semibold text-emerald-600">
                          ৳
                          {Number(selectedProfile.creditLimit).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedProfile.dueDate && (
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-400">Due Date</span>
                        <span className="font-medium text-slate-700">
                          {selectedProfile.dueDate}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800">Ledger</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-indigo-600 text-white font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Project</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3">Voucher No</th>
                        <th className="py-2.5 px-3">Debit</th>
                        <th className="py-2.5 px-3">Credit</th>
                        <th className="py-2.5 px-3">Balance</th>
                        <th className="py-2.5 px-3">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr className="bg-slate-50/50">
                        <td
                          colSpan={7}
                          className="py-2 px-3 font-medium text-slate-600"
                        >
                          Opening
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          0.00
                        </td>
                        <td></td>
                      </tr>

                      {selectedProfile.ledger &&
                      selectedProfile.ledger.length > 0 ? (
                        selectedProfile.ledger.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3">{idx + 1}</td>
                            <td className="py-2.5 px-3">{item.date}</td>
                            <td className="py-2.5 px-3">{item.project}</td>
                            <td className="py-2.5 px-3 text-indigo-600 font-medium">
                              {item.description}
                            </td>
                            <td className="py-2.5 px-3 text-indigo-600 font-mono">
                              {item.voucherNo}
                            </td>
                            <td className="py-2.5 px-3">
                              {Number(item.debit || 0).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3">
                              {Number(item.credit || 0).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="py-2.5 px-3 font-semibold">
                              {Number(item.balance || 0).toLocaleString(
                                "en-US",
                                { minimumFractionDigits: 2 },
                              )}
                            </td>
                            <td className="py-2.5 px-3">{item.note || ""}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={9}
                            className="text-center py-6 text-slate-400"
                          >
                            No ledger transactions found.
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

      {/* ==================== ADD MODAL ==================== */}
      {isAddModalOpen && (
        <SupplierFormModal
          title="Add Supplier"
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={async (newData) => {
            await createSupplier(toApiPayload(newData)); // POST
            setIsAddModalOpen(false);
            await loadSuppliers(); // database theke abar load
          }}
        />
      )}

      {/* ==================== EDIT MODAL ==================== */}
      {editingSupplier && (
        <SupplierFormModal
          title="Edit Supplier Details"
          initialData={editingSupplier}
          onClose={() => setEditingSupplier(null)}
          onSubmit={async (updatedData) => {
            if (!editingSupplier.uuid)
              throw new Error("Supplier UUID is missing");
            // PATCH /realbizpro/api/v1/supplier-accounts/{uuid}
            await updateSupplier(
              editingSupplier.uuid,
              toApiPayload(updatedData),
            );
            setEditingSupplier(null);
            await loadSuppliers(); // database theke abar load
          }}
        />
      )}
    </div>
  );
}
