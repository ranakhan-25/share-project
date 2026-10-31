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
} from "lucide-react";

// ==================== API CONFIG ====================
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PREFIX = "/realbizpro/api/v1";

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

  // 👇 MAIN FIX: Error details console e dekhabe
  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE}${API_PREFIX}/project-billing/bill-invoices?page=1&limit=100`;
      console.log("📤 Fetching invoices →", url);

      const res = await fetch(url);
      console.log("📥 Invoice API Status:", res.status);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.error("❌ Invoice API Error Detail:", errJson);
        throw new Error(errJson.message || `HTTP Error: ${res.status}`);
      }

      const json = await res.json();
      console.log("✅ Invoices response:", json);

      const rows = json?.data?.data || json?.data || [];
      setInvoices(
        rows.map((record: any) => {
          const details = record.details || {};
          return {
            ...record,
            date: record.recordDate,
            customerId: details.customerId || "",
            projectTypeId: details.projectTypeId || "",
            paymentMethod: details.paymentMethod || "Cash",
            paidAmount: Number(details.paidAmount || 0),
            grandTotal: Number(record.amount || 0),
            dueAmount: Number(details.dueAmount ?? record.amount ?? 0),
            contentBody: details.contentBody || record.description || "",
            items: Array.isArray(details.items) ? details.items : [],
          };
        }),
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

  // ==================== HANDLERS ====================
  const handleAddItemToTable = () => {
    if (!newItem.itemName || newItem.quantity <= 0) {
      alert("Item name and quantity required");
      return;
    }
    const amount = newItem.quantity * newItem.rate;
    setInvoiceItems([...invoiceItems, { ...newItem, description: "", amount }]);
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
        headers: { "Content-Type": "application/json" },
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
      if (!formData.date || !formData.customerId || !formData.projectId) {
        alert("Date, customer and project are required");
        return;
      }
      setLoading(true);
      const payload = {
        projectId: formData.projectId,
        title: formData.code,
        code: formData.code,
        recordDate: formData.date,
        amount: grandTotal,
        description: formData.contentBody || undefined,
        status: "active",
        details: {
          customerId: formData.customerId,
          projectTypeId: formData.projectTypeId || null,
          paymentMethod: formData.paymentMethod,
          paidAmount: formData.paidAmount,
          dueAmount,
          contentBody: formData.contentBody,
          items: invoiceItems.map((i) => ({
          itemId: i.itemId,
          itemName: i.itemName,
          description: i.description,
          unit: i.unit,
          quantity: i.quantity,
          rate: i.rate,
          amount: i.amount,
          })),
        },
      };

      console.log("📤 Creating Invoice Payload:", payload);

      const res = await fetch(
        `${API_BASE}${API_PREFIX}/project-billing/bill-invoices${editingInvoiceUuid ? `/${editingInvoiceUuid}` : ""}`,
        {
        method: editingInvoiceUuid ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        console.error("❌ Create Invoice Error:", err);
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
        `${API_BASE}${API_PREFIX}/project-billing/bill-invoices/${invoice.uuid}`,
      );
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.message || "Failed to load invoice");
      }
      const record = json?.data?.data || json?.data || json;
      const data = record.details || {};
      setEditingInvoiceUuid(invoice.uuid);
      setFormData({
        date: record.recordDate ? String(record.recordDate).slice(0, 10) : "",
        code: record.code || record.title || "",
        customerId: data.customerId || "",
        projectId: record.projectId || "",
        projectTypeId: data.projectTypeId || "",
        paymentMethod: data.paymentMethod || "Cash",
        paidAmount: Number(data.paidAmount || 0),
        contentBody: data.contentBody || record.description || "",
      });
      setInvoiceItems(
        (Array.isArray(data.items) ? data.items : []).map((item: any) => ({
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
        `${API_BASE}${API_PREFIX}/project-billing/bill-invoices/${invoice.uuid}`,
        { method: "DELETE" },
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
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 font-sans text-slate-900">
      {/* ==================== LIST VIEW ==================== */}
      {!isAddOpen && (
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 mb-1">
                Home / Billing / Invoice Bill List
              </div>
              <h1 className="text-xl font-bold">Invoice/Bill List</h1>
            </div>
            <button
              onClick={() => {
                setEditingInvoiceUuid(null);
                setIsAddOpen(true);
                setInvoiceItems([]);
                setFormData((current) => ({
                  ...current,
                  date: new Date().toISOString().slice(0, 10),
                  code: `BILL${Math.floor(100000 + Math.random() * 900000)}`,
                  customerId: "",
                  projectId: "",
                  projectTypeId: "",
                  paymentMethod: "Cash",
                  paidAmount: 0,
                  contentBody: "",
                }));
              }}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> +New Bill/Invoice
            </button>
          </div>

          {loading && (
            <div className="text-center py-10 text-slate-500">
              <Loader2 className="animate-spin inline mr-2" />
              Loading...
            </div>
          )}
          {error && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-center font-semibold">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-50 border-b flex justify-between items-center">
              <div className="flex gap-2">
                <button className="bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-semibold">
                  Excel
                </button>
                <button className="bg-rose-600 text-white px-3 py-1.5 rounded text-xs font-semibold">
                  PDF
                </button>
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="border px-3 py-1.5 rounded-lg text-sm"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-indigo-600 text-white uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Code</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Project</th>
                    <th className="py-3 px-3">Grand Total</th>
                    <th className="py-3 px-3">Paid</th>
                    <th className="py-3 px-3">Due</th>
                    <th className="py-3 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.uuid}>
                      <td className="py-2 px-3 font-semibold">{inv.code}</td>
                      <td className="py-2 px-3">{inv.date}</td>
                      <td className="py-2 px-3">
                        {inv.customer?.name ||
                          customers.find((customer) => customer.uuid === inv.customerId)?.name ||
                          "-"}
                      </td>
                      <td className="py-2 px-3">{inv.project?.name || "-"}</td>
                      <td className="py-2 px-3">
                        {Number(inv.grandTotal).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-emerald-600">
                        {Number(inv.paidAmount).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-rose-600">
                        {Number(inv.dueAmount).toFixed(2)}
                      </td>
                      <td className="py-2 px-3">
                        <button
                          type="button"
                          onClick={() => handleEditInvoice(inv)}
                          className="mr-2 text-indigo-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteInvoice(inv)}
                          className="text-rose-600 hover:underline"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-10 text-slate-400"
                      >
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADD INVOICE VIEW ==================== */}
      {isAddOpen && (
        <div className="max-w-[1400px] mx-auto bg-white border border-slate-200 rounded-xl shadow-lg p-6 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingInvoiceUuid(null);
                }}
                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <h2 className="text-lg font-bold text-slate-800">
                {editingInvoiceUuid ? "Edit Bill / Invoice" : "Add New Bill / Invoice"}
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsCustomerModalOpen(true)}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-700"
              >
                Contacts Add
              </button>
              <button
                onClick={() => setIsItemModalOpen(true)}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-700"
              >
                Item Add
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Customer *
              </label>
              <select
                value={formData.customerId}
                onChange={(e) =>
                  setFormData({ ...formData, customerId: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
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
              <label className="block font-semibold text-slate-600 mb-1">
                Code *
              </label>
              <input
                type="text"
                value={formData.code}
                readOnly
                className="w-full border rounded-lg px-3 py-2 bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Project Type
              </label>
              <select
                value={formData.projectTypeId}
                onChange={(e) =>
                  setFormData({ ...formData, projectTypeId: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
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
              <label className="block font-semibold text-slate-600 mb-1">
                Project *
              </label>
              <select
                value={formData.projectId}
                onChange={(e) =>
                  setFormData({ ...formData, projectId: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
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

          {/* Item Selection Bar */}
          <div className="bg-slate-100 p-3 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Category
              </label>
              <select
                value={selectedCategoryId}
                onChange={(event) => {
                  setSelectedCategoryId(event.target.value);
                  setSelectedSubCategoryId("");
                }}
                className="w-full border rounded-lg px-3 py-2"
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
              <label className="block font-semibold text-slate-600 mb-1">
                Sub Category
              </label>
              <select
                value={selectedSubCategoryId}
                onChange={(event) =>
                  setSelectedSubCategoryId(event.target.value)
                }
                className="w-full border rounded-lg px-3 py-2"
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
              <label className="block font-semibold text-slate-600 mb-1">
                Select Item (Product / Material) *
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2"
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
                <option value="">Search Item / Product...</option>
                {items.map((i) => (
                  <option key={i.uuid} value={i.uuid}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Invoice Items Table */}
          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  <th className="py-3 px-3">Item Name</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Unit</th>
                  <th className="py-3 px-3">Quantity</th>
                  <th className="py-3 px-3">Rate</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoiceItems.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2 px-3">{item.itemName}</td>
                    <td className="py-2 px-3">{item.description}</td>
                    <td className="py-2 px-3">{item.unit}</td>
                    <td className="py-2 px-3">{item.quantity}</td>
                    <td className="py-2 px-3">{item.rate}</td>
                    <td className="py-2 px-3 text-right font-semibold">
                      {item.amount.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() =>
                          setInvoiceItems(
                            invoiceItems.filter((_, i) => i !== index),
                          )
                        }
                        className="text-rose-600 hover:bg-rose-50 p-1 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {invoiceItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-400">
                      No items added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals & Payment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-2 space-y-2">
              <div className="flex justify-between border-b pb-1">
                <span>Subtotal:</span>
                <span>{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b pb-1 font-bold text-indigo-700">
                <span>Grand Total:</span>
                <span>{grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Due:</span>
                <span>{dueAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border space-y-2">
              <label className="block font-semibold text-slate-700">
                Payment Method * If Cheque
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value })
                }
                className="w-full border rounded px-2 py-1"
              >
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </select>
              <label className="block font-semibold text-slate-700 mt-2">
                Amount Paid
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
                className="w-full border rounded px-2 py-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              onClick={() => {
                setIsAddOpen(false);
                setEditingInvoiceUuid(null);
              }}
              className="px-5 py-2 border rounded-lg hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateInvoice}
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}{" "}
              {editingInvoiceUuid ? "Update" : "Submit"}
            </button>
          </div>
        </div>
      )}

      {/* ==================== MODAL: NEW ITEM ==================== */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center bg-slate-50 px-5 py-3 border-b">
              <h3 className="font-bold text-slate-800">New Item</h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={newItem.categoryId}
                  onChange={(event) =>
                    setNewItem({
                      ...newItem,
                      categoryId: event.target.value,
                      subCategoryId: "",
                    })
                  }
                  className="w-full border rounded px-2 py-1.5"
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
                <label className="block font-semibold mb-1">Sub Category</label>
                <select
                  value={newItem.subCategoryId}
                  onChange={(event) =>
                    setNewItem({
                      ...newItem,
                      subCategoryId: event.target.value,
                    })
                  }
                  className="w-full border rounded px-2 py-1.5"
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
                <label className="block font-semibold mb-1">Item Name</label>
                <input
                  type="text"
                  value={newItem.itemName}
                  onChange={(e) =>
                    setNewItem({ ...newItem, itemName: e.target.value })
                  }
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Brand</label>
                <select className="w-full border rounded px-2 py-1.5">
                  <option>Select Brand</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Unit</label>
                <select
                  value={newItem.unit}
                  onChange={(e) =>
                    setNewItem({ ...newItem, unit: e.target.value })
                  }
                  className="w-full border rounded px-2 py-1.5"
                >
                  <option value="Nos">Nos</option>
                  <option value="Kg">Kg</option>
                  <option value="Cft">Cft</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">
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
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Sale Price</label>
                <input
                  type="number"
                  value={newItem.salePrice}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      salePrice: Number(e.target.value),
                    })
                  }
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t flex justify-end gap-2">
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={handleAddItemToTable}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
              >
                Add to Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CUSTOMER ADD ==================== */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex justify-between items-center bg-slate-50 px-5 py-3 border-b">
              <h3 className="font-bold text-slate-800">Customer Add</h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Code</label>
                <input
                  type="text"
                  value={newCustomer.code}
                  readOnly
                  className="w-full border rounded px-2 py-1.5 bg-slate-50"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Name</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={newCustomer.mobileNumber}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      mobileNumber: e.target.value,
                    })
                  }
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Buyer Reference
                </label>
                <input
                  type="text"
                  value={newCustomer.buyerReference}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      buyerReference: e.target.value,
                    })
                  }
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1">Address</label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, address: e.target.value })
                  }
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Credit Limit</label>
                <input
                  type="number"
                  value={newCustomer.creditLimit}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      creditLimit: Number(e.target.value),
                    })
                  }
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Due Date</label>
                <input
                  type="date"
                  value={newCustomer.dueDate}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, dueDate: e.target.value })
                  }
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Opening Balance
                </label>
                <input
                  type="number"
                  value={newCustomer.openingBalance}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      openingBalance: Number(e.target.value),
                    })
                  }
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Chart Of Groups
                </label>
                <select className="w-full border rounded px-2 py-1.5">
                  <option>Select One Option</option>
                </select>
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t flex justify-end gap-2">
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={handleSaveCustomer}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
