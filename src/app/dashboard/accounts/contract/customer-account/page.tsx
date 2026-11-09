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
} from "lucide-react";

// ---------- Types ----------
export interface Customer {
  id: number | string;
  uuid?: string;
  code: string;
  name: string;
  business: string;
  mobile: string;
  email: string;
  nidPassport: string;
  under: string;
  address: string;
  status: string;
  buyerReference?: any;
  creditLimit?: any;
  chartOfGroups?: any;
  landInfo?: any[];
  flatInfo?: any[];
  paymentSchedule?: any[];
  paymentDetails?: any[];
  image?: string | null;
}

// ---------- API helpers ----------
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// form values -> backend field names
function toPayload(form: Partial<Customer>) {
  const clean = (v?: string) => {
    const t = (v || "").trim();
    return t === "" ? undefined : t;
  };
  return {
    customerCode: (form.code || "").trim(),
    customerName: (form.name || "").trim(),
    mobileNo: (form.mobile || "").trim(),
    email: clean(form.email),
    businessName: clean(form.business),
    nidOrPassport: clean(form.nidPassport),
    underGroup: clean(form.under),
    address: clean(form.address),
  };
}

// shared response checker
async function handleRes(res: Response, action: string) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      json?.message || json?.error || `Failed to ${action} (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return json;
}

async function fetchCustomers(): Promise<{ data: Customer[]; meta: any }> {
  const res = await fetch(`${API_BASE}/realbizpro/api/v1/customer-account`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // Authorization: `Bearer ${token}`  // add if needed
    },
    cache: "no-store",
  });

  const json = await handleRes(res, "fetch customers");

  const mapped: Customer[] = (json?.data?.data || []).map((item: any) => ({
    id: Number(item.id) || item.uuid,
    uuid: item.uuid,
    code: item.customerCode || "",
    name: item.customerName || "",
    business: item.businessName || "",
    mobile: item.mobileNo || "",
    email: item.email || "",
    nidPassport: item.nidOrPassport || "",
    under: item.underGroup || "",
    address: item.address || "",
    status: item.status || "active",
    buyerReference: item.buyerReference,
    creditLimit: item.creditLimit,
    chartOfGroups: item.chartOfGroups,
    landInfo: item.landInfo || [],
    flatInfo: item.flatInfo || [],
    paymentSchedule: item.paymentSchedule || [],
    paymentDetails: item.paymentDetails || [],
    image: item.image || item.photo || null,
  }));

  return { data: mapped, meta: json?.data?.meta };
}

// POST /realbizpro/api/v1/customer-account
async function createCustomer(form: Partial<Customer>) {
  const res = await fetch(`${API_BASE}/realbizpro/api/v1/customer-account`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toPayload(form)),
  });
  return handleRes(res, "create customer");
}

// PATCH /realbizpro/api/v1/customer-account/{uuid}
async function updateCustomer(uuid: string, form: Partial<Customer>) {
  const res = await fetch(
    `${API_BASE}/realbizpro/api/v1/customer-account/${uuid}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(form)),
    },
  );
  return handleRes(res, "update customer");
}

// DELETE /realbizpro/api/v1/customer-account/{uuid}
async function softDeleteCustomer(uuid: string) {
  const res = await fetch(
    `${API_BASE}/realbizpro/api/v1/customer-account/${uuid}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    },
  );
  return handleRes(res, "delete customer");
}

// ---------- Form Modal ----------
function CustomerFormModal({
  title,
  initialData,
  onClose,
  onSubmit,
}: {
  title: string;
  initialData?: Customer;
  onClose: () => void;
  onSubmit: (data: Partial<Customer>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    business: initialData?.business || "",
    mobile: initialData?.mobile || "",
    email: initialData?.email || "",
    nidPassport: initialData?.nidPassport || "",
    under: initialData?.under || "",
    address: initialData?.address || "",
    code:
      initialData?.code ||
      `CUS${Math.floor(1000000 + Math.random() * 9000000)}`,
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
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Customer Code
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-50 font-mono text-indigo-600 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Mobile Number *
              </label>
              <input
                type="text"
                required
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({ ...formData, mobile: e.target.value })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="017xxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Email Address
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
                Business Name
              </label>
              <input
                type="text"
                value={formData.business}
                onChange={(e) =>
                  setFormData({ ...formData, business: e.target.value })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Business or shop name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                NID / Passport
              </label>
              <input
                type="text"
                value={formData.nidPassport}
                onChange={(e) =>
                  setFormData({ ...formData, nidPassport: e.target.value })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="NID or passport number"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Under Group
              </label>
              <input
                type="text"
                value={formData.under}
                onChange={(e) =>
                  setFormData({ ...formData, under: e.target.value })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Group code"
              />
            </div>
            <div>
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

          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-xs">
              {formError}
            </div>
          )}

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
              disabled={saving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg font-medium text-xs shadow-sm transition cursor-pointer flex items-center"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1.5" /> Save Customer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- Main Page ----------
export default function CustomerListPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(20);

  // Modals
  const [selectedProfile, setSelectedProfile] = useState<Customer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Load data from API (database theke)
  const loadCustomers = async () => {
    try {
      setError(null);
      const { data } = await fetchCustomers();
      setCustomers(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load customers");
    }
  };

  useEffect(() => {
    setLoading(true);
    loadCustomers().finally(() => setLoading(false));
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.mobile.includes(searchTerm),
  );

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`Delete ${customer.name}?`)) return;

    try {
      const uuid = (customer as any).uuid;
      if (!uuid) throw new Error("Customer UUID is missing");
      await softDeleteCustomer(uuid);
      await loadCustomers(); // database theke abar load
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Delete failed. Please try again.");
    }
  };

  // Helper to safely read extra fields not in Customer type
  const getExtra = (c: Customer | null, key: string) =>
    c ? (c as any)[key] : undefined;

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
            Contact
          </span>
          <span>›</span>
          <span className="text-slate-800 font-semibold">Customer List</span>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Customer Add
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
          Loading customers...
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
                  <th className="py-3 px-4">Business</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">NID/Passport</th>
                  <th className="py-3 px-4">Under</th>
                  <th className="py-3 px-4">Image</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers
                    .slice(0, entriesPerPage)
                    .map((customer, index) => (
                      <tr
                        key={(customer as any).uuid || customer.id}
                        className="hover:bg-indigo-50/40 transition-colors"
                      >
                        <td className="py-3 px-4 text-slate-500 font-medium">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-indigo-600 font-semibold">
                          {customer.code}
                        </td>
                        <td className="py-3 px-4 text-slate-900 font-medium">
                          {customer.name}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {customer.business || "-"}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {customer.mobile}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {customer.email || "-"}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {customer.nidPassport || "-"}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {customer.under || "-"}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {getExtra(customer, "image") ? (
                            <img
                              src={getExtra(customer, "image")}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => setSelectedProfile(customer)}
                              title="View Profile Details"
                              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-xs transition cursor-pointer"
                            >
                              <User className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingCustomer(customer)}
                              title="Edit Customer"
                              className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded shadow-xs transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(customer)}
                              title="Delete Customer"
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
                    <td
                      colSpan={10}
                      className="text-center py-8 text-slate-400"
                    >
                      No customer records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= PROFILE MODAL ================= */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
              <span className="font-semibold text-slate-700 text-sm">
                Customer Profile
              </span>
              <button
                onClick={() => setSelectedProfile(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Profile Card */}
              <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="h-28 bg-gradient-to-r from-cyan-400 to-indigo-600 relative flex items-center justify-center">
                  <div className="absolute -bottom-8 w-20 h-20 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center shadow-md overflow-hidden text-slate-500 font-bold text-xl">
                    {getExtra(selectedProfile, "image") ? (
                      <img
                        src={getExtra(selectedProfile, "image")}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      selectedProfile.name?.charAt(0)?.toUpperCase() || "?"
                    )}
                  </div>
                </div>
                <div className="pt-10 pb-4 px-6 text-center">
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedProfile.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedProfile.business || "—"}
                  </p>

                  <div className="mt-3 border-t border-slate-100 divide-y divide-slate-100 text-xs text-left">
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-400">Code</span>
                      <span className="font-medium text-slate-800 font-mono">
                        {selectedProfile.code || "—"}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-400">Mobile</span>
                      <span className="font-medium text-slate-800">
                        {selectedProfile.mobile || "—"}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-400">Email</span>
                      <span className="font-medium text-slate-800">
                        {selectedProfile.email || "—"}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-400">NID / Passport</span>
                      <span className="font-medium text-slate-800">
                        {selectedProfile.nidPassport || "—"}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-400">Under Group</span>
                      <span className="font-medium text-slate-800">
                        {selectedProfile.under || "—"}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-400">Address</span>
                      <span className="font-medium text-slate-800">
                        {selectedProfile.address || "—"}
                      </span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-400">Status</span>
                      <span
                        className={`font-medium ${
                          getExtra(selectedProfile, "status") === "active"
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {getExtra(selectedProfile, "status") || "—"}
                      </span>
                    </div>
                    {getExtra(selectedProfile, "creditLimit") != null && (
                      <div className="py-2 flex justify-between">
                        <span className="text-slate-400">Credit Limit</span>
                        <span className="font-medium text-slate-800">
                          {getExtra(selectedProfile, "creditLimit")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Land Info */}
              {Array.isArray(getExtra(selectedProfile, "landInfo")) &&
                getExtra(selectedProfile, "landInfo").length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-800">
                      Land Info
                    </h3>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-indigo-600 text-white">
                            <th className="py-2 px-3">#</th>
                            <th className="py-2 px-3">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {getExtra(selectedProfile, "landInfo").map(
                            (item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="py-2 px-3">{idx + 1}</td>
                                <td className="py-2 px-3">
                                  {typeof item === "string"
                                    ? item
                                    : JSON.stringify(item)}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {/* Flat Info */}
              {Array.isArray(getExtra(selectedProfile, "flatInfo")) &&
                getExtra(selectedProfile, "flatInfo").length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-800">
                      Flat Info
                    </h3>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-indigo-600 text-white">
                            <th className="py-2 px-3">#</th>
                            <th className="py-2 px-3">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {getExtra(selectedProfile, "flatInfo").map(
                            (item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="py-2 px-3">{idx + 1}</td>
                                <td className="py-2 px-3">
                                  {typeof item === "string"
                                    ? item
                                    : JSON.stringify(item)}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {/* Payment Schedule */}
              {Array.isArray(getExtra(selectedProfile, "paymentSchedule")) &&
                getExtra(selectedProfile, "paymentSchedule").length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-800">
                      Payment Schedule
                    </h3>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-indigo-600 text-white">
                            <th className="py-2 px-3">#</th>
                            <th className="py-2 px-3">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {getExtra(selectedProfile, "paymentSchedule").map(
                            (item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="py-2 px-3">{idx + 1}</td>
                                <td className="py-2 px-3">
                                  {typeof item === "string"
                                    ? item
                                    : JSON.stringify(item)}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {/* Payment Details */}
              {Array.isArray(getExtra(selectedProfile, "paymentDetails")) &&
                getExtra(selectedProfile, "paymentDetails").length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-800">
                      Payment Details
                    </h3>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-indigo-600 text-white">
                            <th className="py-2 px-3">#</th>
                            <th className="py-2 px-3">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {getExtra(selectedProfile, "paymentDetails").map(
                            (item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="py-2 px-3">{idx + 1}</td>
                                <td className="py-2 px-3">
                                  {typeof item === "string"
                                    ? item
                                    : JSON.stringify(item)}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <CustomerFormModal
          title="Customer Add"
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={async (newData) => {
            await createCustomer(newData); // POST /realbizpro/api/v1/customer-account
            setIsAddModalOpen(false);
            await loadCustomers(); // database theke abar load
          }}
        />
      )}

      {/* Edit Modal */}
      {editingCustomer && (
        <CustomerFormModal
          title="Edit Customer Details"
          initialData={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSubmit={async (updatedData) => {
            if (!editingCustomer.uuid)
              throw new Error("Customer UUID is missing");
            // PATCH /realbizpro/api/v1/customer-account/{uuid}
            await updateCustomer(editingCustomer.uuid, updatedData);
            setEditingCustomer(null);
            await loadCustomers(); // database theke abar load
          }}
        />
      )}
    </div>
  );
}
