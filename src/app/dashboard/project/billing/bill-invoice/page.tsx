/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  ArrowLeft,
  Save,
  X,
  Loader2,
  Trash2,
  Edit2,
  Calendar,
  FileSpreadsheet,
  FileText,
  UserPlus,
  PackagePlus,
  ChevronRight,
  CreditCard,
  Building2,
  Layers,
  Tag,
  Receipt
} from "lucide-react";

// ==================== API CONFIG ====================
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PREFIX = "/realbizpro/api/v1";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return { "Content-Type": "application/json" };
  }
  const token =
    localStorage.getItem("share-project:access-token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ==================== TYPES ====================
interface InvoiceItemRow {
  id?: string;
  uuid?: string;
  itemId?: string;
  itemName: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface OptionItem {
  uuid: string;
  id: string;
  name: string;
  raw?: any;
}

export default function InvoiceBillListPage() {
  // ==================== LIST STATES ====================
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ==================== MODAL STATES ====================
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingInvoiceUuid, setEditingInvoiceUuid] = useState<string | null>(null);

  // ==================== FORM STATE ====================
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    code: `BILL${Math.floor(100000 + Math.random() * 900000)}`,
    customerId: "",
    projectId: "",
    projectTypeId: "",
    paymentMethod: "Cash",
    paidAmount: 0,
    contentBody: "",
  });

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemRow[]>([]);

  // ==================== MASTER DATA ====================
  const [customers, setCustomers] = useState<OptionItem[]>([]);
  const [items, setItems] = useState<OptionItem[]>([]);
  const [categories, setCategories] = useState<OptionItem[]>([]);
  const [subCategories, setSubCategories] = useState<OptionItem[]>([]);
  const [projects, setProjects] = useState<OptionItem[]>([]);
  const [projectTypes, setProjectTypes] = useState<OptionItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("");

  // ==================== MODAL FORM STATES ====================
  const [newItem, setNewItem] = useState({
    categoryId: "",
    subCategoryId: "",
    brand: "",
    itemName: "",
    unit: "Nos",
    purchasePrice: 0,
    salePrice: 0,
    quantity: 1,
    rate: 0,
  });

  const [newCustomer, setNewCustomer] = useState({
    code: `CUS${Math.floor(100000 + Math.random() * 900000)}`,
    name: "",
    mobileNumber: "",
    buyerReference: "",
    address: "",
    creditLimit: 0,
    dueDate: "",
    openingBalance: 0,
    chartOfGroups: "",
  });

  // ==================== CALCULATIONS ====================
  const subtotal = invoiceItems.reduce((acc, item) => acc + item.amount, 0);
  const grandTotal = subtotal;
  const dueAmount = grandTotal - formData.paidAmount;

  // ==================== FETCHERS ====================
  const fetchRelatedOptions = async (endpoint: string, label: string) => {
    try {
      const res = await fetch(
        `${API_BASE}${API_PREFIX}${endpoint}?page=1&limit=100`,
        { headers: getAuthHeaders() },
      );
      if (!res.ok) {
        console.error(`❌ ${label} fetch failed:`, res.status);
        return [];
      }
      const json = await res.json();
      const rows = Array.isArray(json?.data?.data)
        ? json.data.data
        : Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
            ? json
            : [];
      return rows.map((r: any) => ({
        uuid: r.uuid || r.id,
        id: r.id || r.uuid,
        name:
          r.customerName ||
          r.name ||
          r.projectName ||
          r.title ||
          r.itemName ||
          r.item_code ||
          r.code ||
          "Unnamed",
        raw: r,
      }));
    } catch (err) {
      console.error(`❌ ${label} error:`, err);
      return [];
    }
  };

  const loadDropdowns = useCallback(async () => {
    const [cust, itms, cats, subCats, projs, types] = await Promise.all([
      fetchRelatedOptions("/customer-account", "customers"),
      fetchRelatedOptions("/inventory/items", "items"),
      fetchRelatedOptions("/category", "categories"),
      fetchRelatedOptions("/billing-sub-category", "subCategories"),
      fetchRelatedOptions("/project", "projects"),
      fetchRelatedOptions("/project-type", "projectTypes"),
    ]);
    setCustomers(cust);
    setItems(itms);
    setCategories(cats);
    setSubCategories(subCats);
    setProjects(projs);
    setProjectTypes(types);
  }, []);

  const visibleSubCategories = selectedCategoryId
    ? subCategories.filter(
        (subCategory) =>
          subCategory.raw?.categoryId === selectedCategoryId,
      )
    : subCategories;

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE}${API_PREFIX}/bill-invoice?page=1&limit=100`;
      const res = await fetch(url, { headers: getAuthHeaders() });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `HTTP Error: ${res.status}`);
      }

      const json = await res.json();
      const rows = json?.data?.data || json?.data || [];
      setInvoices(
        rows.map((record: any) => ({
          ...record,
          date: record.date ? String(record.date).slice(0, 10) : "",
          customerId: record.customerId || "",
          projectTypeId: record.projectTypeId || "",
          paymentMethod: record.paymentMethod || "Cash",
          paidAmount: Number(record.paidAmount || 0),
          grandTotal: Number(record.grandTotal || 0),
          dueAmount: Number(record.dueAmount ?? record.grandTotal ?? 0),
          contentBody: record.contentBody || "",
          items: Array.isArray(record.items) ? record.items : [],
        })),
      );
    } catch (err: any) {
      console.error("❌ loadInvoices catch block:", err);
      setError(err.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
    loadDropdowns();
  }, [loadInvoices, loadDropdowns]);

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase();
    const customerName =
      inv.customer?.name ||
      customers.find((c) => c.uuid === inv.customerId)?.name ||
      "";
    const projectName = inv.project?.name || "";
    return (
      inv.code?.toLowerCase().includes(q) ||
      customerName.toLowerCase().includes(q) ||
      projectName.toLowerCase().includes(q) ||
      inv.date?.toLowerCase().includes(q)
    );
  });

  // ==================== HANDLERS ====================
  const handleAddItemToTable = () => {
    if (!newItem.itemName || newItem.quantity <= 0) {
      alert("Item name and quantity required");
      return;
    }
    const rate = Number(newItem.salePrice || newItem.rate || 0);
    const qty = Number(newItem.quantity || 1);
    const amount = qty * rate;
    setInvoiceItems([...invoiceItems, { ...newItem, rate, quantity: qty, description: "", amount }]);
    setIsItemModalOpen(false);
    setNewItem({
      categoryId: "",
      subCategoryId: "",
      brand: "",
      itemName: "",
      unit: "Nos",
      purchasePrice: 0,
      salePrice: 0,
      quantity: 1,
      rate: 0,
    });
  };

  const handleSaveCustomer = async () => {
    try {
      const res = await fetch(`${API_BASE}${API_PREFIX}/customer-account`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          customerCode: newCustomer.code,
          customerName: newCustomer.name,
          mobileNo: newCustomer.mobileNumber,
          email: undefined,
          address: newCustomer.address,
          underGroup: newCustomer.chartOfGroups || undefined,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || "Failed to create customer");
      }

      alert("Customer added successfully");
      setIsCustomerModalOpen(false);
      loadDropdowns();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      if (!formData.date || !formData.projectId) {
        alert("Date and project are required");
        return;
      }
      setLoading(true);
      const payload = {
        code: formData.code,
        date: formData.date,
        customerId: formData.customerId || undefined,
        projectId: formData.projectId || undefined,
        projectTypeId: undefined,
        grandTotal,
        paidAmount: Number(formData.paidAmount) || 0,
        dueAmount,
        paymentMethod: formData.paymentMethod || "Cash",
        contentBody: formData.contentBody || undefined,
        items: invoiceItems.map((i) => ({
          itemId: i.itemId || undefined,
          itemName: i.itemName,
          description: i.description || undefined,
          unit: i.unit || "Nos",
          quantity: Number(i.quantity) || 1,
          rate: Number(i.rate) || 0,
          amount: Number(i.amount) || 0,
        })),
      };

      const res = await fetch(
        `${API_BASE}${API_PREFIX}/bill-invoice${editingInvoiceUuid ? `/${editingInvoiceUuid}` : ""}`,
        {
          method: editingInvoiceUuid ? "PATCH" : "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create invoice");
      }

      alert(editingInvoiceUuid ? "Invoice updated successfully!" : "Invoice created successfully!");
      setIsAddOpen(false);
      setEditingInvoiceUuid(null);
      setInvoiceItems([]);
      loadInvoices();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditInvoice = async (invoice: any) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}${API_PREFIX}/bill-invoice/${invoice.uuid}`,
        { headers: getAuthHeaders() },
      );
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.message || "Failed to load invoice");
      }
      const record = json?.data?.data || json?.data || json;
      setEditingInvoiceUuid(invoice.uuid);
      setFormData({
        date: record.date ? String(record.date).slice(0, 10) : "",
        code: record.code || "",
        customerId: record.customerId || "",
        projectId: record.projectId || "",
        projectTypeId: record.projectTypeId || "",
        paymentMethod: record.paymentMethod || "Cash",
        paidAmount: Number(record.paidAmount || 0),
        contentBody: record.contentBody || "",
      });
      setInvoiceItems(
        (Array.isArray(record.items) ? record.items : []).map((item: any) => ({
          id: item.id,
          uuid: item.uuid,
          itemId: item.itemId,
          itemName: item.itemName || "",
          description: item.description || "",
          unit: item.unit || "Nos",
          quantity: Number(item.quantity || 0),
          rate: Number(item.rate || 0),
          amount: Number(item.amount || 0),
        })),
      );
      setIsAddOpen(true);
    } catch (err: any) {
      alert(err.message || "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoice: any) => {
    if (!window.confirm(`Delete invoice ${invoice.code}?`)) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}${API_PREFIX}/bill-invoice/${invoice.uuid}`,
        { method: "DELETE", headers: getAuthHeaders() },
      );
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json?.message || "Failed to delete invoice");
      }
      await loadInvoices();
    } catch (err: any) {
      alert(err.message || "Failed to delete invoice");
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      
      {/* ==================== LIST VIEW ==================== */}
      {!isAddOpen && (
        <div className="mx-auto max-w-[1600px] space-y-5">
          {/* Header & New Bill Button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <nav className="flex items-center text-xs sm:text-sm text-slate-500 gap-1.5 sm:gap-2 mb-1">
                <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Home</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Billing</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                  Invoice Bill List
                </span>
              </nav>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                <Receipt className="w-6 h-6 text-indigo-600" />
                Invoice/Bill List
              </h1>
            </div>

            <button
              onClick={() => {
                setEditingInvoiceUuid(null);
                setIsAddOpen(true);
                setInvoiceItems([]);
                setFormData({
                  date: new Date().toISOString().slice(0, 10),
                  code: `BILL${Math.floor(100000 + Math.random() * 900000)}`,
                  customerId: "",
                  projectId: "",
                  projectTypeId: "",
                  paymentMethod: "Cash",
                  paidAmount: 0,
                  contentBody: "",
                });
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 hover:shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+New Bill/Invoice</span>
            </button>
          </div>

          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-500 shadow-sm">
              <Loader2 className="animate-spin inline w-5 h-5 text-emerald-600 mr-2" />
              <span className="font-medium text-sm">Loading invoices...</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs sm:text-sm font-semibold text-rose-700">
              {error}
            </div>
          )}

          {/* Table Container */}
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden space-y-0">
            {/* Action Bar (Excel, PDF, Search) */}
            <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => alert("Exporting Excel...")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-700 active:scale-95"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button 
                  onClick={() => alert("Exporting PDF...")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-rose-700 active:scale-95"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by code, customer, project..."
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            {/* Invoices Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">CODE</th>
                    <th className="py-3 px-4">DATE</th>
                    <th className="py-3 px-4">CUSTOMER</th>
                    <th className="py-3 px-4">PROJECT</th>
                    <th className="py-3 px-4 text-right">GRAND TOTAL</th>
                    <th className="py-3 px-4 text-right">PAID</th>
                    <th className="py-3 px-4 text-right">DUE</th>
                    <th className="py-3 px-4 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.uuid} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                          {inv.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{inv.date || "—"}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {inv.customer?.name ||
                          customers.find((customer) => customer.uuid === inv.customerId)?.name ||
                          "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {inv.project?.name || "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ৳{Number(inv.grandTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        ৳{Number(inv.paidAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                        ৳{Number(inv.dueAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditInvoice(inv)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-emerald-700 transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteInvoice(inv)}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1 text-slate-400 shadow-2xs hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-12 text-slate-400 italic bg-slate-50/50"
                      >
                        No invoices found. Click &quot;Create New Bill / Invoice&quot; to add one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="p-3.5 bg-slate-50/70 border-t border-slate-200/80 text-xs text-slate-500 flex justify-between items-center">
              <span>Showing {filteredInvoices.length} entries</span>
              <span className="font-semibold text-slate-700">
                Total Billed: ৳{filteredInvoices.reduce((acc, curr) => acc + (Number(curr.grandTotal) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADD / EDIT INVOICE VIEW ==================== */}
      {isAddOpen && (
        <div className="mx-auto max-w-[1400px] bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-5 gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingInvoiceUuid(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  {editingInvoiceUuid ? "Edit Bill / Invoice" : "Create New Bill / Invoice"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fill in the project billing details and add itemized products or materials.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCustomerModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Customer</span>
              </button>
              <button
                onClick={() => setIsItemModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-800 shadow-2xs hover:bg-indigo-100 transition"
              >
                <PackagePlus className="w-3.5 h-3.5" />
                <span>Add Custom Item</span>
              </button>
            </div>
          </div>

          {/* Form Fields Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Customer
              </label>
              <select
                value={formData.customerId}
                onChange={(e) =>
                  setFormData({ ...formData, customerId: e.target.value })
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
              >
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c.uuid} value={c.uuid}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Invoice Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                readOnly
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3 font-mono text-xs sm:text-sm font-bold text-slate-700 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Project Type
              </label>
              <select
                value={formData.projectTypeId}
                onChange={(e) =>
                  setFormData({ ...formData, projectTypeId: e.target.value })
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
              >
                <option value="">Select Project Type</option>
                {projectTypes.map((pt) => (
                  <option key={pt.uuid} value={pt.uuid}>
                    {pt.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Project <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.projectId}
                onChange={(e) =>
                  setFormData({ ...formData, projectId: e.target.value })
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
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

          {/* Quick Item Picker Bar */}
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-slate-50 p-4 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <PackagePlus className="w-4 h-4 text-emerald-600" />
              Quick Add Item To Bill
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(event) => {
                    setSelectedCategoryId(event.target.value);
                    setSelectedSubCategoryId("");
                  }}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-emerald-600"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.uuid} value={category.uuid}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Sub Category
                </label>
                <select
                  value={selectedSubCategoryId}
                  onChange={(event) =>
                    setSelectedSubCategoryId(event.target.value)
                  }
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-emerald-600"
                >
                  <option value="">Select Sub Category</option>
                  {visibleSubCategories.map((subCategory) => (
                    <option key={subCategory.uuid} value={subCategory.uuid}>
                      {subCategory.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Select Item (Product / Material) <span className="text-rose-500">*</span>
                </label>
                <select
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 outline-none focus:border-emerald-600"
                  defaultValue=""
                  onChange={(event) => {
                    const selected = items.find(
                      (item) => item.uuid === event.target.value,
                    );
                    if (!selected) return;
                    const rawItem = selected.raw || {};
                    const rate = Number(rawItem.sale_price || 0);
                    setInvoiceItems((current) => [
                      ...current,
                      {
                        itemId: rawItem.id || selected.uuid,
                        itemName: rawItem.name || selected.name,
                        description: rawItem.item_code || "",
                        unit:
                          rawItem.unit?.name ||
                          rawItem.unit?.unitName ||
                          "Nos",
                        quantity: 1,
                        rate,
                        amount: rate,
                      },
                    ]);
                    event.currentTarget.value = "";
                  }}
                >
                  <option value="">+ Choose Item to append...</option>
                  {items.map((i) => (
                    <option key={i.uuid} value={i.uuid}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Invoice Items Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4 w-24">Quantity</th>
                  <th className="py-3 px-4 w-28 text-right">Rate</th>
                  <th className="py-3 px-4 text-right w-32">Amount</th>
                  <th className="py-3 px-4 text-center w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invoiceItems.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{item.itemName}</td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-xs">{item.description || "—"}</td>
                    <td className="py-2.5 px-4 text-slate-600">{item.unit}</td>
                    <td className="py-2.5 px-4 font-mono font-semibold">{item.quantity}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                      ৳{Number(item.rate).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      ৳{Number(item.amount).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() =>
                          setInvoiceItems(
                            invoiceItems.filter((_, i) => i !== index),
                          )
                        }
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {invoiceItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 italic bg-slate-50/50">
                      No items added yet. Select an item above or click &quot;Add Custom Item&quot;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals & Payment Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* Left: Notes / Description */}
            <div className="lg:col-span-1 space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Notes & Terms
              </label>
              <textarea
                rows={4}
                value={formData.contentBody}
                onChange={(e) => setFormData({ ...formData, contentBody: e.target.value })}
                placeholder="Optional billing note or terms..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 resize-none"
              />
            </div>

            {/* Middle: Payment Settings */}
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Payment Method & Paid Amount
              </span>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentMethod: e.target.value })
                  }
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-800 outline-none focus:border-emerald-600"
                >
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Amount Paid (৳)
                </label>
                <input
                  type="number"
                  value={formData.paidAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paidAmount: Number(e.target.value),
                    })
                  }
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Right: Subtotal, Grand Total, Due */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-3 shadow-2xs">
              <div className="flex justify-between items-center text-xs sm:text-sm text-slate-600 border-b border-slate-100 pb-2">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold text-slate-800">৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm sm:text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-700">৳{grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm font-semibold pt-1">
                <span className="text-slate-500">Amount Due:</span>
                <span className={`font-mono font-extrabold ${dueAmount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                  ৳{dueAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                setIsAddOpen(false);
                setEditingInvoiceUuid(null);
              }}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateInvoice}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-600 transition active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{editingInvoiceUuid ? "Update Invoice" : "Submit Invoice"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================== MODAL: NEW ITEM ==================== */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center bg-slate-50/80 px-5 py-4 border-b border-slate-100">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <PackagePlus className="w-4 h-4 text-emerald-600" />
                Add New Item
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Category</label>
                <select
                  value={newItem.categoryId}
                  onChange={(event) =>
                    setNewItem({
                      ...newItem,
                      categoryId: event.target.value,
                      subCategoryId: "",
                    })
                  }
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-emerald-600"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.uuid} value={category.uuid}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Sub Category</label>
                <select
                  value={newItem.subCategoryId}
                  onChange={(event) =>
                    setNewItem({
                      ...newItem,
                      subCategoryId: event.target.value,
                    })
                  }
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-emerald-600"
                >
                  <option value="">Select Sub Category</option>
                  {subCategories
                    .filter(
                      (subCategory) =>
                        !newItem.categoryId ||
                        subCategory.raw?.categoryId === newItem.categoryId,
                    )
                    .map((subCategory) => (
                      <option key={subCategory.uuid} value={subCategory.uuid}>
                        {subCategory.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-600 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={newItem.itemName}
                  onChange={(e) =>
                    setNewItem({ ...newItem, itemName: e.target.value })
                  }
                  placeholder="e.g. Cement, Steel Rods"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Brand</label>
                <select className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-emerald-600">
                  <option>Select Brand</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Unit</label>
                <select
                  value={newItem.unit}
                  onChange={(e) =>
                    setNewItem({ ...newItem, unit: e.target.value })
                  }
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-emerald-600"
                >
                  <option value="Nos">Nos</option>
                  <option value="Kg">Kg</option>
                  <option value="Cft">Cft</option>
                  <option value="Bags">Bags</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Purchase Price
                </label>
                <input
                  type="number"
                  value={newItem.purchasePrice}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      purchasePrice: Number(e.target.value),
                    })
                  }
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 font-mono outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Sale Price / Rate</label>
                <input
                  type="number"
                  value={newItem.salePrice}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      salePrice: Number(e.target.value),
                      rate: Number(e.target.value),
                    })
                  }
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 font-mono outline-none focus:border-emerald-600"
                />
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white"
              >
                Close
              </button>
              <button
                onClick={handleAddItemToTable}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs"
              >
                Add to Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CUSTOMER ADD ==================== */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center bg-slate-50/80 px-5 py-4 border-b border-slate-100">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                Add New Customer
              </h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Customer Code</label>
                <input
                  type="text"
                  value={newCustomer.code}
                  readOnly
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 font-mono text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                  placeholder="Full Name"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={newCustomer.mobileNumber}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      mobileNumber: e.target.value,
                    })
                  }
                  placeholder="01XXXXXXXXX"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Buyer Reference</label>
                <input
                  type="text"
                  value={newCustomer.buyerReference}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      buyerReference: e.target.value,
                    })
                  }
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-emerald-600"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-600 mb-1">Address</label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, address: e.target.value })
                  }
                  placeholder="Billing / Delivery Address"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Credit Limit (৳)</label>
                <input
                  type="number"
                  value={newCustomer.creditLimit}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      creditLimit: Number(e.target.value),
                    })
                  }
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 font-mono outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Due Date</label>
                <input
                  type="date"
                  value={newCustomer.dueDate}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, dueDate: e.target.value })
                  }
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Opening Balance (৳)</label>
                <input
                  type="number"
                  value={newCustomer.openingBalance}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      openingBalance: Number(e.target.value),
                    })
                  }
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 font-mono outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Chart Of Groups</label>
                <select className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-emerald-600">
                  <option>Select Group Option</option>
                </select>
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white"
              >
                Close
              </button>
              <button
                onClick={handleSaveCustomer}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs"
              >
                Save Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
