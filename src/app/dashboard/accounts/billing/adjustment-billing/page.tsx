/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Loader2, Edit3, Trash2, ChevronRight, Search } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PATH = `${API_BASE}/realbizpro/api/v1`;

// ====================== TYPES ======================
interface BudgetRow {
  id: string;
  itemName: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  image: string;
  amount: number;
}

interface InvoiceBill {
  id: string;
  uuid: string;
  code: string;
  title: string;
  recordDate: string;
  amount: string;
  status: string;
  description: string;
  project?: { name: string; uuid: string };
  details?: {
    customerId?: string;
    customerName?: string;
    ledger?: string;
    site?: string;
    projectType?: string;
    refWoNo?: string;
    contentBody?: string;
    proposedBudget?: BudgetRow[];
    adjustmentBudget?: BudgetRow[];
    subtotal?: number;
    vatPercent?: number;
    vatAmount?: number;
    aitPercent?: number;
    aitAmount?: number;
    interestRate?: number;
    interestAmount?: number;
    grandTotal?: number;
    paid?: number;
    due?: number;
    attachment?: string;
  };
}

export default function InvoiceBillPage() {
  const [dataList, setDataList] = useState<InvoiceBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InvoiceBill | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isItemSubmitting, setIsItemSubmitting] = useState(false);

  // Dropdown Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [projectTypes, setProjectTypes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [ledgers] = useState<any[]>([
    { uuid: "1", name: "Interest Income" },
    { uuid: "2", name: "Sales" }
  ]);

  // Invoice Form Data
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    customerId: "",
    customerName: "",
    ledger: "",
    code: `BILL${Math.floor(1000 + Math.random() * 9000)}`,
    projectType: "",
    projectId: "",
    site: "",
    refWoNo: "",
    contentBody: "",
    proposedBudget: [] as BudgetRow[],
    adjustmentBudget: [] as BudgetRow[],
    vatPercent: 0,
    aitPercent: 0,
    interestRate: 0,
    paid: 0,
    attachment: "",
  });

  // New Customer Form
  const [newCustomer, setNewCustomer] = useState({ 
    customerCode: `CUS${Date.now().toString().slice(-6)}`, 
    customerName: "", 
    mobileNo: "", 
    businessName: "", 
    address: "" 
  });

  // New Item Form
  const [newItem, setNewItem] = useState({
    itemName: "",
    categoryId: "", 
    subCategoryId: "", 
    brand: "", 
    unit: "",
    purchasePrice: 0,
    salePrice: 0,
    image: "string",
  });

  // ====================== FETCH LISTS ======================
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_PATH}/project-billing/period-billings`);
      const json = await res.json();
      if (json.success) {
        setDataList((json.data.data || []).filter((item: any) => !item.deletedAt));
      }
    } catch (err) {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  // ====================== FETCH DROPDOWNS ======================
  const fetchDropdowns = async () => {
    try {
      const resCus = await fetch(`${API_PATH}/customer-account`);
      const jsonCus = await resCus.json();
      if (jsonCus.success) setCustomers(jsonCus.data.data || jsonCus.data || []);

      const resProj = await fetch(`${API_PATH}/project`);
      const jsonProj = await resProj.json();
      if (jsonProj.success) setProjects(jsonProj.data.data || jsonProj.data || []);

      const resSite = await fetch(`${API_PATH}/project-sites`);
      const jsonSite = await resSite.json();
      if (jsonSite.success) setSites(jsonSite.data.data || jsonSite.data || []);

      const resType = await fetch(`${API_PATH}/project-type`);
      const jsonType = await resType.json();
      if (jsonType.success) setProjectTypes(jsonType.data.data || jsonType.data || []);

      const resCat = await fetch(`${API_PATH}/category`);
      const jsonCat = await resCat.json();
      if (jsonCat.success) setCategories(jsonCat.data.data || jsonCat.data || []);

      const resBrand = await fetch(`${API_PATH}/procurement/brand`);
      const jsonBrand = await resBrand.json();
      if (jsonBrand.success) setBrands(jsonBrand.data.data || jsonBrand.data || []);
      
    } catch (err) {
      console.error("Error fetching dropdowns:", err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchDropdowns();
  }, []);

  // ====================== BUDGET HANDLERS ======================
  const addBudgetRow = (type: "proposed" | "adjustment") => {
    const newRow: BudgetRow = {
      id: Date.now().toString(),
      itemName: "",
      description: "",
      unit: "",
      quantity: 1,
      rate: 0,
      image: "",
      amount: 0,
    };
    if (type === "proposed") {
      setFormData(prev => ({ ...prev, proposedBudget: [...prev.proposedBudget, newRow] }));
    } else {
      setFormData(prev => ({ ...prev, adjustmentBudget: [...prev.adjustmentBudget, newRow] }));
    }
  };

  const updateBudgetRow = (type: "proposed" | "adjustment", id: string, field: keyof BudgetRow, value: any) => {
    const list = type === "proposed" ? [...formData.proposedBudget] : [...formData.adjustmentBudget];
    const index = list.findIndex(r => r.id === id);
    if (index > -1) {
      list[index] = { ...list[index], [field]: value };
      if (field === "quantity" || field === "rate") {
        list[index].amount = Number(list[index].quantity) * Number(list[index].rate);
      }
      if (type === "proposed") setFormData(prev => ({ ...prev, proposedBudget: list }));
      else setFormData(prev => ({ ...prev, adjustmentBudget: list }));
    }
  };

  const removeBudgetRow = (type: "proposed" | "adjustment", id: string) => {
    if (type === "proposed") {
      setFormData(prev => ({ ...prev, proposedBudget: prev.proposedBudget.filter(r => r.id !== id) }));
    } else {
      setFormData(prev => ({ ...prev, adjustmentBudget: prev.adjustmentBudget.filter(r => r.id !== id) }));
    }
  };

  // ====================== CALCULATIONS ======================
  const proposedTotal = formData.proposedBudget.reduce((acc, row) => acc + (Number(row.quantity) * Number(row.rate)), 0);
  const adjustmentTotal = formData.adjustmentBudget.reduce((acc, row) => acc + (Number(row.quantity) * Number(row.rate)), 0);
  
  const subtotal = proposedTotal + adjustmentTotal;
  const vatAmount = (subtotal * formData.vatPercent) / 100;
  const aitAmount = (subtotal * formData.aitPercent) / 100;
  const interestAmount = (subtotal * formData.interestRate) / 100;
  const grandTotal = subtotal + vatAmount + aitAmount + interestAmount;
  const due = grandTotal - formData.paid;

  // ====================== SUBMIT INVOICE ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      projectId: formData.projectId,
      title: formData.contentBody ? formData.contentBody.substring(0, 50) : "Period Bill Title",
      code: formData.code,
      recordDate: formData.date,
      amount: grandTotal,
      status: "active",
      description: "",
      details: {
        customerId: formData.customerId,
        customerName: formData.customerName,
        ledger: formData.ledger,
        projectType: formData.projectType,
        site: formData.site,
        refWoNo: formData.refWoNo,
        contentBody: formData.contentBody,
        proposedBudget: formData.proposedBudget,
        adjustmentBudget: formData.adjustmentBudget,
        subtotal,
        vatPercent: formData.vatPercent,
        vatAmount,
        aitPercent: formData.aitPercent,
        aitAmount,
        interestRate: formData.interestRate,
        interestAmount,
        grandTotal,
        paid: formData.paid,
        due,
        attachment: formData.attachment,
      },
    };

    try {
      const isEdit = !!editingItem;
      const url = isEdit
        ? `${API_PATH}/project-billing/period-billings/${editingItem!.uuid}`
        : `${API_PATH}/project-billing/period-billings`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok || json.success) {
        toast.success(isEdit ? "Updated successfully!" : "Created successfully!");
        setIsModalOpen(false);
        setEditingItem(null);
        fetchInvoices();
      } else {
        toast.error(json.message || "Failed to save");
      }
    } catch (err: any) {
      toast.error("Network Error");
    } finally {
      setSubmitting(false);
    }
  };

  // ====================== DELETE INVOICE ======================
  const handleDelete = async (item: InvoiceBill) => {
    if (!window.confirm(`Delete "${item.code}"?`)) return;
    try {
      const res = await fetch(`${API_PATH}/project-billing/period-billings/${item.uuid}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Deleted successfully!");
        setDataList((prev) => prev.filter((row) => row.uuid !== item.uuid));
      } else {
        toast.error("Failed to delete");
      }
    } catch (err) {
      toast.error("Error deleting");
    }
  };

  // ====================== CREATE CUSTOMER ======================
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_PATH}/customer-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newCustomer, status: "active" }),
      });
      if (res.ok) {
        toast.success("Customer Created!");
        setIsCustomerModalOpen(false);
        fetchDropdowns();
      } else {
        toast.error("Failed to create customer");
      }
    } catch (err) {
      toast.error("Error creating customer");
    }
  };

  // ====================== CREATE ITEM (UUID FIX) ======================
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newItem.categoryId || !newItem.brand) {
      toast.error("Please select Category and Brand properly");
      return;
    }

    setIsItemSubmitting(true);
    
    // ✅ Sending actual UUIDs now as requested by backend
    const payload = {
      ...newItem,
      // Fallback subCategoryId if empty (must be a valid UUID)
      subCategoryId: newItem.subCategoryId || "855450dc-27ae-477f-9cf5-6ce3323946d8"
    };

    try {
      const res = await fetch(`${API_PATH}/item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      
      if (res.ok || json.success) {
        toast.success("Item Created!");
        setIsItemModalOpen(false);
        setNewItem({ 
          itemName: "", categoryId: "", subCategoryId: "", brand: "", unit: "", purchasePrice: 0, salePrice: 0, image: "string" 
        });
      } else {
        toast.error(json.message || "Failed to create item");
      }
    } catch (err) {
      toast.error("Error creating item");
    } finally {
      setIsItemSubmitting(false);
    }
  };

  // ====================== OPEN MODALS ======================
  const handleCreate = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      customerId: "",
      customerName: "",
      ledger: "",
      code: `BILL${Math.floor(1000 + Math.random() * 9000)}`,
      projectType: "",
      projectId: "",
      site: "",
      refWoNo: "",
      contentBody: "",
      proposedBudget: [],
      adjustmentBudget: [],
      vatPercent: 0,
      aitPercent: 0,
      interestRate: 0,
      paid: 0,
      attachment: "",
    });
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: InvoiceBill) => {
    setEditingItem(item);
    setFormData({
      date: item.recordDate,
      customerId: item.details?.customerId || "",
      customerName: item.details?.customerName || "",
      ledger: item.details?.ledger || "",
      code: item.code,
      projectType: item.details?.projectType || "",
      projectId: item.project?.uuid || "",
      site: item.details?.site || "",
      refWoNo: item.details?.refWoNo || "",
      contentBody: item.details?.contentBody || "",
      proposedBudget: item.details?.proposedBudget || [],
      adjustmentBudget: item.details?.adjustmentBudget || [],
      vatPercent: item.details?.vatPercent || 0,
      aitPercent: item.details?.aitPercent || 0,
      interestRate: item.details?.interestRate || 0,
      paid: item.details?.paid || 0,
      attachment: item.details?.attachment || "",
    });
    setIsModalOpen(true);
  };

  const filteredData = dataList.filter((item) =>
    item.code?.toLowerCase().includes(search.toLowerCase()) ||
    item.project?.name?.toLowerCase().includes(search.toLowerCase())
  );

  // ====================== SITE DROPDOWN FIX ======================
  // Filtering sites based on selected projectId
  const filteredSites = formData.projectId 
    ? sites.filter(s => String(s.projectId).toLowerCase() === String(formData.projectId).toLowerCase()) 
    : sites;

  // ====================== RENDER ======================
  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      <div className="mx-auto max-w-[1600px] space-y-5">
        
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <nav className="flex items-center text-xs sm:text-sm text-slate-500 gap-1.5 sm:gap-2 mb-1">
              <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Home</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Billing</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                Invoice/Bill List
              </span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Invoice/Bill List
            </h1>
          </div>
          <button 
            onClick={handleCreate} 
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 hover:shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> 
            <span>+ New Invoice Bill</span>
          </button>
        </div>

        {/* List Table Container */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-700 active:scale-95">
                Excel
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-rose-700 active:scale-95">
                PDF
              </button>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Search..."
                className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10" 
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
          ) : (
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-xs sm:text-sm text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white text-xs font-bold uppercase tracking-wider">
                    {["ID", "PROJECT TYPE", "PROJECT", "CUSTOMER NAME", "CODE", "REF", "DATE", "GRAND TOTAL", "ADDED BY", "ATTACHMENT", "ACTION"].map(h => (
                      <th key={h} className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700 font-medium">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-16 text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <p className="text-sm font-medium">No data available in table</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr key={item.uuid} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">{item.id}</td>
                        <td className="px-4 py-3">{item.details?.projectType || "N/A"}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{item.project?.name || "Unknown"}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{item.details?.customerName || "N/A"}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{item.code}</td>
                        <td className="px-4 py-3 text-slate-500">{item.details?.refWoNo || "-"}</td>
                        <td className="px-4 py-3 text-slate-600">{item.recordDate}</td>
                        <td className="px-4 py-3 font-bold text-emerald-600">{item.amount}</td>
                        <td className="px-4 py-3 text-slate-500">Admin</td>
                        <td className="px-4 py-3 text-slate-400">-</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => handleEdit(item)} 
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
              Showing {filteredData.length > 0 ? 1 : 0} to {filteredData.length} of {filteredData.length} entries
            </div>
            <div className="flex items-center gap-1">
              <button disabled className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed">
                Previous
              </button>
              <button className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold">
                1
              </button>
              <button disabled className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ====================== ADD/EDIT MODAL ====================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-7xl my-8">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h2 className="text-lg font-bold">{editingItem ? "Edit Invoice Bill" : "Invoice/Bill List"}</h2>
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsItemModalOpen(true)} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm">Item Add</button>
                <button type="button" onClick={() => setIsCustomerModalOpen(true)} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm">Contacts Add</button>
                <button type="button" className="bg-green-600 text-white px-3 py-1.5 rounded text-sm">Adjustment Bill List</button>
                <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              
              {/* Row 1 Fields */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Date</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Customer</label>
                  <select value={formData.customerId} onChange={(e) => {
                    const cus = customers.find(c => c.uuid === e.target.value);
                    setFormData({ ...formData, customerId: e.target.value, customerName: cus?.customerName || "" });
                  }} className="w-full border rounded px-3 py-1.5 text-sm" required>
                    <option value="">Select value</option>
                    {customers.map(c => <option key={c.uuid} value={c.uuid}>{c.customerName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Ledger</label>
                  <select value={formData.ledger} onChange={(e) => setFormData({ ...formData, ledger: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm">
                    <option value="">Select Ledger</option>
                    {ledgers.map(l => <option key={l.uuid} value={l.name}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Code</label>
                  <input type="text" value={formData.code} readOnly className="w-full border rounded px-3 py-1.5 text-sm bg-gray-50" />
                </div>
              </div>

              {/* Row 2 Fields */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Project Type</label>
                  <select value={formData.projectType} onChange={(e) => setFormData({ ...formData, projectType: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm">
                    <option value="">Select value</option>
                    {projectTypes.map(p => <option key={p.uuid} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Project</label>
                  <select value={formData.projectId} onChange={(e) => setFormData({ ...formData, projectId: e.target.value, site: "" })} className="w-full border rounded px-3 py-1.5 text-sm" required>
                    <option value="">Select Project</option>
                    {projects.map(p => <option key={p.uuid} value={p.uuid}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Site</label>
                  <select value={formData.site} onChange={(e) => setFormData({ ...formData, site: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm">
                    <option value="">Select Site</option>
                    {filteredSites.map(s => <option key={s.uuid} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Ref W/O No.</label>
                  <input type="text" value={formData.refWoNo} onChange={(e) => setFormData({ ...formData, refWoNo: e.target.value })} placeholder="PO No." className="w-full border rounded px-3 py-1.5 text-sm" />
                </div>
              </div>

              {/* Content Body */}
              <div>
                <label className="block text-xs text-gray-600 mb-1 font-bold">Content Body</label>
                <div className="border rounded bg-white">
                  <div className="p-2 border-b flex gap-3 text-sm text-gray-700 bg-gray-50"><span>File</span><span>Edit</span><span>View</span><span>Insert</span><span>Format</span><span>Tools</span><span>Table</span></div>
                  <div className="p-2 border-b flex gap-3 text-gray-600 flex-wrap">
                    <span>↶</span><span>↷</span><span>Paragraph ▾</span><span className="font-bold">B</span><span className="italic">I</span><span>U</span><span>≡</span>
                  </div>
                  <textarea value={formData.contentBody} onChange={(e) => setFormData({ ...formData, contentBody: e.target.value })} className="w-full h-24 p-3 text-sm focus:outline-none resize-none" placeholder="Type your content here..."></textarea>
                </div>
              </div>

              {/* PROPOSED BUDGET */}
              <div className="mt-6">
                <div className="bg-orange-400 text-white text-center py-1 font-bold rounded-t">PROPOSED BUDGET</div>
                <div className="border-x border-b rounded-b overflow-x-auto bg-white">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-indigo-500 text-white">
                      <tr>
                        {["ITEM NAME", "DESCRIPTION", "UNIT", "QUANTITY", "RATE", "IMAGE", "AMOUNT", "ACTION"].map(h => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {formData.proposedBudget.map((row) => (
                        <tr key={row.id} className="border-b">
                          <td className="px-2 py-1"><input type="text" value={row.itemName} onChange={e => updateBudgetRow("proposed", row.id, "itemName", e.target.value)} className="w-full border rounded px-2 py-1" /></td>
                          <td className="px-2 py-1"><input type="text" value={row.description} onChange={e => updateBudgetRow("proposed", row.id, "description", e.target.value)} className="w-full border rounded px-2 py-1" /></td>
                          <td className="px-2 py-1"><input type="text" value={row.unit} onChange={e => updateBudgetRow("proposed", row.id, "unit", e.target.value)} className="w-16 border rounded px-2 py-1" /></td>
                          <td className="px-2 py-1"><input type="number" value={row.quantity} onChange={e => updateBudgetRow("proposed", row.id, "quantity", e.target.value)} className="w-20 border rounded px-2 py-1" /></td>
                          <td className="px-2 py-1"><input type="number" value={row.rate} onChange={e => updateBudgetRow("proposed", row.id, "rate", e.target.value)} className="w-24 border rounded px-2 py-1" /></td>
                          <td className="px-2 py-1"><input type="text" value={row.image} onChange={e => updateBudgetRow("proposed", row.id, "image", e.target.value)} className="w-20 border rounded px-2 py-1" /></td>
                          <td className="px-2 py-1 font-medium">{row.amount.toFixed(2)}</td>
                          <td className="px-2 py-1 text-center">
                            <button type="button" onClick={() => addBudgetRow("proposed")} className="bg-green-500 text-white w-6 h-6 rounded text-xs mx-1">+</button>
                            <button type="button" onClick={() => removeBudgetRow("proposed", row.id)} className="bg-red-500 text-white w-6 h-6 rounded text-xs">x</button>
                          </td>
                        </tr>
                      ))}
                      {formData.proposedBudget.length === 0 && (
                        <tr><td colSpan={8} className="text-center py-2 text-gray-500">Click + to add item</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ADJUSTMENT BUDGET */}
              <div className="mt-4">
                <div className="bg-orange-400 text-white text-center py-1 font-bold rounded-t">ADJUSTMENT BUDGET</div>
                <div className="border-x border-b rounded-b overflow-x-auto bg-white">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-indigo-500 text-white">
                      <tr>
                        {["ITEM NAME", "DESCRIPTION", "UNIT", "QUANTITY", "RATE", "IMAGE", "AMOUNT", "ACTION"].map(h => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {formData.adjustmentBudget.map((row) => (
                        <tr key={row.id} className="border-b">
                          <td className="px-2 py-1"><input type="text" value={row.itemName} onChange={e => updateBudgetRow("adjustment", row.id, "itemName", e.target.value)} className="w-full border rounded px-2 py-1" /></td>
                          <td className="px-2 py-1"><input type="text" value={row.description} onChange={e => updateBudgetRow("adjustment", row.id, "description", e.target.value)} className="w-full border rounded px-2 py-1" /></td>
                          <td className="px-2 py-1"><input type="text" value={row.unit} onChange={e => updateBudgetRow("adjustment", row.id, "unit", e.target.value)} className="w-16 border rounded px-2 py-1" /></td>
                          <td className="px-2 py-1"><input type="number" value={row.quantity} onChange={e => updateBudgetRow("adjustment", row.id, "quantity", e.target.value)} className="w-20 border rounded px-2 py-1" /></td>
                          <td className="px-2 py-1"><input type="number" value={row.rate} onChange={e => updateBudgetRow("adjustment", row.id, "rate", e.target.value)} className="w-24 border rounded px-2 py-1" /></td>
                          <td className="px-2 py-1"><input type="text" value={row.image} onChange={e => updateBudgetRow("adjustment", row.id, "image", e.target.value)} className="w-20 border rounded px-2 py-1" /></td>
                          <td className="px-2 py-1 font-medium">{row.amount.toFixed(2)}</td>
                          <td className="px-2 py-1 text-center">
                            <button type="button" onClick={() => addBudgetRow("adjustment")} className="bg-green-500 text-white w-6 h-6 rounded text-xs mx-1">+</button>
                            <button type="button" onClick={() => removeBudgetRow("adjustment", row.id)} className="bg-red-500 text-white w-6 h-6 rounded text-xs">x</button>
                          </td>
                        </tr>
                      ))}
                      {formData.adjustmentBudget.length === 0 && (
                        <tr><td colSpan={8} className="text-center py-2 text-gray-500">Click + to add item</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CALCULATION FOOTER */}
              <div className="mt-4 bg-indigo-50 border rounded overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-indigo-500 text-white">
                    <tr>
                      {["SUBTOTAL", "VAT(%) IF INCLUDE", "VAT AMOUNT", "AIT(%) IF INCLUDE", "AIT AMOUNT", "INTEREST RATE(%)", "INTEREST AMOUNT", "GRAND TOTAL", "PAID", "DUE", "ATTACHMENT"].map(h => (
                        <th key={h} className="px-2 py-2 font-medium text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr>
                      <td className="px-2 py-2"><input type="text" value={subtotal.toFixed(2)} readOnly className="w-20 border rounded px-2 py-1 bg-gray-50 text-sm" /></td>
                      <td className="px-2 py-2"><input type="number" value={formData.vatPercent} onChange={e => setFormData({...formData, vatPercent: Number(e.target.value)})} className="w-16 border rounded px-2 py-1 text-sm" placeholder="Vat(%)" /></td>
                      <td className="px-2 py-2"><input type="text" value={vatAmount.toFixed(2)} readOnly className="w-20 border rounded px-2 py-1 bg-gray-50 text-sm" /></td>
                      <td className="px-2 py-2"><input type="number" value={formData.aitPercent} onChange={e => setFormData({...formData, aitPercent: Number(e.target.value)})} className="w-16 border rounded px-2 py-1 text-sm" placeholder="AIT(%)" /></td>
                      <td className="px-2 py-2"><input type="text" value={aitAmount.toFixed(2)} readOnly className="w-20 border rounded px-2 py-1 bg-gray-50 text-sm" /></td>
                      <td className="px-2 py-2"><input type="number" value={formData.interestRate} onChange={e => setFormData({...formData, interestRate: Number(e.target.value)})} className="w-16 border rounded px-2 py-1 text-sm" placeholder="Interest(%)" /></td>
                      <td className="px-2 py-2"><input type="text" value={interestAmount.toFixed(2)} readOnly className="w-20 border rounded px-2 py-1 bg-gray-50 text-sm" /></td>
                      <td className="px-2 py-2"><input type="text" value={grandTotal.toFixed(2)} readOnly className="w-24 border rounded px-2 py-1 bg-green-50 text-green-700 font-bold text-sm" /></td>
                      <td className="px-2 py-2"><input type="number" value={formData.paid} onChange={e => setFormData({...formData, paid: Number(e.target.value)})} className="w-20 border rounded px-2 py-1 text-sm" /></td>
                      <td className="px-2 py-2"><input type="text" value={due.toFixed(2)} readOnly className="w-20 border rounded px-2 py-1 bg-red-50 text-red-700 font-bold text-sm" /></td>
                      <td className="px-2 py-2">
                        <input type="file" onChange={(e) => setFormData({ ...formData, attachment: e.target.files?.[0]?.name || "" })} className="w-40 text-xs" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-400 text-white px-6 py-2 rounded text-sm">Close</button>
                <button type="submit" disabled={submitting} className="bg-indigo-600 text-white px-8 py-2 rounded text-sm flex items-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================== ITEM ADD MODAL ====================== */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-full max-w-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">New Item</h2>
              <button type="button" onClick={() => setIsItemModalOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleCreateItem} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1">Category</label>
                  <select required value={newItem.categoryId} onChange={(e) => setNewItem({...newItem, categoryId: e.target.value})} className="w-full border rounded px-3 py-1.5 text-sm">
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.uuid} value={c.uuid}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1">Brand</label>
                  <select required value={newItem.brand} onChange={(e) => setNewItem({...newItem, brand: e.target.value})} className="w-full border rounded px-3 py-1.5 text-sm">
                    <option value="">Select Brand</option>
                    {brands.map(b => <option key={b.uuid} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1">Item Name</label>
                  <input required type="text" value={newItem.itemName} onChange={(e) => setNewItem({...newItem, itemName: e.target.value})} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Item Name" />
                </div>
                <div>
                  <label className="block text-xs mb-1">Unit</label>
                  <input required type="text" value={newItem.unit} onChange={(e) => setNewItem({...newItem, unit: e.target.value})} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Nos" />
                </div>
                <div>
                  <label className="block text-xs mb-1">Purchase Price</label>
                  <input required type="number" value={newItem.purchasePrice} onChange={(e) => setNewItem({...newItem, purchasePrice: Number(e.target.value)})} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="100" />
                </div>
                <div>
                  <label className="block text-xs mb-1">Sale Price</label>
                  <input required type="number" value={newItem.salePrice} onChange={(e) => setNewItem({...newItem, salePrice: Number(e.target.value)})} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="150" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="bg-gray-400 text-white px-4 py-2 rounded text-sm">Close</button>
                <button type="submit" disabled={isItemSubmitting} className="bg-indigo-600 text-white px-6 py-2 rounded text-sm flex items-center gap-2">
                  {isItemSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================== CUSTOMER ADD MODAL ====================== */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-full max-w-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Customer Add</h2>
              <button onClick={() => setIsCustomerModalOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1">Code</label>
                  <input type="text" value={newCustomer.customerCode} readOnly className="w-full border rounded px-3 py-1.5 text-sm bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs mb-1">Name</label>
                  <input type="text" value={newCustomer.customerName} onChange={e => setNewCustomer({...newCustomer, customerName: e.target.value})} required className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Enter Name" />
                </div>
                <div>
                  <label className="block text-xs mb-1">Mobile Number</label>
                  <input type="text" value={newCustomer.mobileNo} onChange={e => setNewCustomer({...newCustomer, mobileNo: e.target.value})} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Enter Mobile" />
                </div>
                <div>
                  <label className="block text-xs mb-1">Buyer Reference</label>
                  <input type="text" value={newCustomer.businessName} onChange={e => setNewCustomer({...newCustomer, businessName: e.target.value})} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Enter Business Name" />
                </div>
                <div>
                  <label className="block text-xs mb-1">Address</label>
                  <input type="text" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Enter Address" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="bg-gray-400 text-white px-4 py-2 rounded text-sm">Close</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded text-sm">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}