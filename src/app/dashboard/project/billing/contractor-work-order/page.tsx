/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Loader2, Edit3, Trash2, ChevronRight, Search } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PATH = `${API_BASE}/realbizpro/api/v1`;

// ====================== TYPES ======================
interface WorkOrder {
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
    supplierName?: string;
    projectType?: string;
    site?: string;
    categoryId?: string;
    brand?: string;
    under?: string;
    itemName?: string;
    vat?: number;
    ait?: number;
  };
  deletedAt?: string;
}

export default function ContractorWorkOrderPage() {
  const [dataList, setDataList] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  // ড্রপডাউন ডাটা
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [projectTypes, setProjectTypes] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [unders, setUnders] = useState<any[]>([]);

  // ফর্ম ডাটা
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    supplierId: "",
    supplierName: "",
    code: `CWO${Math.floor(1000 + Math.random() * 9000)}`,
    projectType: "",
    projectId: "",
    site: "",
    categoryId: "",
    brand: "",
    under: "",
    itemName: "",
    quantity: 1,
    rate: 0,
    description: "",
    attachment: "",
    contentBody: "",
    vat: 0,
    ait: 0,
  });

  // ====================== FETCH LISTS ======================
  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_PATH}/project-billing/contractor-work-orders`);
      const json = await res.json();
      if (json.success) {
        setDataList((json.data.data || []).filter((item: any) => !item.deletedAt));
      }
    } catch (err) {
      toast.error("Failed to load work orders");
    } finally {
      setLoading(false);
    }
  };

  // ====================== FETCH DROPDOWNS ======================
  const fetchDropdowns = async () => {
    try {
      // ১. সাপ্লায়ার (ফিক্স করা হয়েছে)
      const resSup = await fetch(`${API_PATH}/inventory/suppliers?page=1&limit=100`);
      const jsonSup = await resSup.json();
      
      const supplierData = jsonSup.data?.data || jsonSup.data || jsonSup;
      if (Array.isArray(supplierData)) {
        setSuppliers(supplierData);
      } else {
        console.warn("Supplier data is not an array:", supplierData);
      }

      // ২. প্রজেক্ট টাইপ
      const resType = await fetch(`${API_PATH}/project-type`);
      const jsonType = await resType.json();
      if (jsonType.success) setProjectTypes(jsonType.data.data || jsonType.data || []);

      // ৩. প্রজেক্ট
      const resProj = await fetch(`${API_PATH}/project`);
      const jsonProj = await resProj.json();
      if (jsonProj.success) setProjects(jsonProj.data.data || jsonProj.data || []);

      // ৪. সাইট
      const resSite = await fetch(`${API_PATH}/project-sites`);
      const jsonSite = await resSite.json();
      if (jsonSite.success) setSites(jsonSite.data.data || jsonSite.data || []);

      // ৫. ক্যাটাগরি
      const resCat = await fetch(`${API_PATH}/category?page=1&limit=100`);
      const jsonCat = await resCat.json();
      if (jsonCat.success) setCategories(jsonCat.data.data || jsonCat.data || []);

      // ৬. ব্র্যান্ড
      const resBrand = await fetch(`${API_PATH}/procurement/brand?page=1&limit=100`);
      const jsonBrand = await resBrand.json();
      if (jsonBrand.success) setBrands(jsonBrand.data.data || jsonBrand.data || []);

      // ৭. আন্ডার (Under)
      const resUnder = await fetch(`${API_PATH}/under?page=1&limit=100`);
      const jsonUnder = await resUnder.json();
      if (jsonUnder.success) setUnders(jsonUnder.data.data || jsonUnder.data || []);

    } catch (err) {
      console.error("Error fetching dropdowns:", err);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
    fetchDropdowns();
  }, []);

  // ====================== SUBMIT (POST / PATCH) ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      projectId: formData.projectId,
      title: formData.contentBody || "Work Order Title",
      code: formData.code,
      recordDate: formData.date,
      amount: Number(formData.quantity) * Number(formData.rate),
      status: "active",
      description: formData.description,
      details: {
        supplierName: formData.supplierName,
        projectType: formData.projectType,
        site: formData.site,
        categoryId: formData.categoryId,
        brand: formData.brand,
        under: formData.under,
        itemName: formData.itemName,
        vat: formData.vat,
        ait: formData.ait,
      },
    };

    try {
      const isEdit = !!editingItem;
      const url = isEdit
        ? `${API_PATH}/project-billing/contractor-work-orders/${editingItem!.uuid}`
        : `${API_PATH}/project-billing/contractor-work-orders`;
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
        fetchWorkOrders();
      } else {
        toast.error(json.message || "Failed to save");
      }
    } catch (err: any) {
      toast.error("Network Error");
    } finally {
      setSubmitting(false);
    }
  };

  // ====================== DELETE ======================
  const handleDelete = async (item: WorkOrder) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
      const res = await fetch(`${API_PATH}/project-billing/contractor-work-orders/${item.uuid}`, {
        method: "DELETE",
      });
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

  // ====================== OPEN MODAL ======================
  const handleCreate = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      supplierId: "",
      supplierName: "",
      code: `CWO${Math.floor(1000 + Math.random() * 9000)}`,
      projectType: "",
      projectId: "",
      site: "",
      categoryId: "",
      brand: "",
      under: "",
      itemName: "",
      quantity: 1,
      rate: 0,
      description: "",
      attachment: "",
      contentBody: "",
      vat: 0,
      ait: 0,
    });
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: WorkOrder) => {
    setEditingItem(item);
    setFormData({
      date: item.recordDate,
      supplierId: "",
      supplierName: item.details?.supplierName || "",
      code: item.code,
      projectType: item.details?.projectType || "",
      projectId: item.project?.uuid || "",
      site: item.details?.site || "",
      categoryId: item.details?.categoryId || "",
      brand: item.details?.brand || "",
      under: item.details?.under || "",
      itemName: item.details?.itemName || "",
      quantity: 1,
      rate: Number(item.amount),
      description: item.description,
      attachment: "",
      contentBody: item.title,
      vat: item.details?.vat || 0,
      ait: item.details?.ait || 0,
    });
    setIsModalOpen(true);
  };

  // সাব-টোটাল ক্যালকুলেশন
  const subTotal = Number(formData.quantity) * Number(formData.rate);
  const vatAmount = (subTotal * formData.vat) / 100;
  const aitAmount = (subTotal * formData.ait) / 100;
  const grandTotal = subTotal + vatAmount + aitAmount;

  const filteredData = dataList.filter((item) =>
    item.title?.toLowerCase().includes(search.toLowerCase()) ||
    item.code?.toLowerCase().includes(search.toLowerCase())
  );

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
                Contractor Work Order
              </span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Contractor Work Order
            </h1>
          </div>
          <button 
            onClick={handleCreate} 
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 hover:shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> 
            <span>+ Contractor Work Order</span>
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
                    {["ID", "CONTRACTOR NAME", "WO NO", "REF INVOICE NO", "DATE", "SUB TOTAL", "VAT", "DISCOUNT", "GRAND TOTAL", "ADDED BY", "APPROVE", "ATTACHMENT", "ACTION"].map(h => (
                      <th key={h} className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700 font-medium">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="text-center py-16 text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <p className="text-sm font-medium">No data available in table</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr key={item.uuid} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">{item.id}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{item.project?.name || "Unknown"}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{item.code}</td>
                        <td className="px-4 py-3 text-slate-500">-</td>
                        <td className="px-4 py-3 text-slate-600">{item.recordDate}</td>
                        <td className="px-4 py-3 text-slate-700">{item.amount}</td>
                        <td className="px-4 py-3 text-slate-500">0</td>
                        <td className="px-4 py-3 text-slate-500">0</td>
                        <td className="px-4 py-3 font-bold text-emerald-600">{item.amount}</td>
                        <td className="px-4 py-3 text-slate-500">Admin</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center">
                            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                          </div>
                        </td>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold">{editingItem ? "Edit Work Order" : "Contractor Work Order"}</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              
              {/* Top Fields */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Date</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Supplier</label>
                  <select value={formData.supplierId} onChange={(e) => {
                    const sup = suppliers.find(s => s.uuid === e.target.value);
                    // ✅ supplierName বা name যেটাই থাকুক সেটা ধরবে
                    setFormData({ ...formData, supplierId: e.target.value, supplierName: sup?.supplierName || sup?.name || "" });
                  }} className="w-full border rounded px-3 py-1.5 text-sm">
                    <option value="">Select One Option</option>
                    {suppliers.map(s => (
                      <option key={s.uuid} value={s.uuid}>{s.supplierName || s.name || "Unknown"}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Code</label>
                  <input type="text" value={formData.code} readOnly className="w-full border rounded px-3 py-1.5 text-sm bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Project Type</label>
                  <select value={formData.projectType} onChange={(e) => setFormData({ ...formData, projectType: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm">
                    <option value="">Select value</option>
                    {projectTypes.map(p => <option key={p.uuid} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Project</label>
                  <select value={formData.projectId} onChange={(e) => setFormData({ ...formData, projectId: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm">
                    <option value="">Select Project</option>
                    {projects.map(p => <option key={p.uuid} value={p.uuid}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Site</label>
                  <select value={formData.site} onChange={(e) => setFormData({ ...formData, site: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm">
                    <option value="">Select Site</option>
                    {sites.map(s => <option key={s.uuid} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Second Row Fields */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Category</label>
                  <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm">
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.uuid} value={c.uuid}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Brand</label>
                  <select value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm">
                    <option value="">Select Brand</option>
                    {brands.map(b => <option key={b.uuid} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Select Item</label>
                  <input type="text" value={formData.itemName} onChange={(e) => setFormData({ ...formData, itemName: e.target.value })} placeholder="Search Item..." className="w-full border rounded px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Under</label>
                  <select value={formData.under} onChange={(e) => setFormData({ ...formData, under: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm">
                    <option value="">Select Under</option>
                    {unders.map(u => <option key={u.uuid} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Attachment & Content Body */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Attachment</label>
                <input type="file" onChange={(e) => setFormData({ ...formData, attachment: e.target.files?.[0]?.name || "" })} className="w-full border rounded px-3 py-1 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-indigo-50 file:text-indigo-700" />
              </div>

              {/* Content Body Mock Editor */}
              <div className="border rounded">
                <div className="p-2 border-b flex gap-3 text-sm text-gray-700 bg-gray-50"><span>File</span><span>Edit</span><span>View</span><span>Insert</span><span>Format</span><span>Tools</span><span>Table</span></div>
                <div className="p-2 border-b flex gap-3 text-gray-600"><span>↶</span><span>↷</span><span>Paragraph ▾</span><span className="font-bold">B</span><span className="italic">I</span><span>U</span><span>≡</span></div>
                <textarea value={formData.contentBody} onChange={(e) => setFormData({ ...formData, contentBody: e.target.value })} className="w-full h-24 p-3 text-sm focus:outline-none resize-none" placeholder="Content Body..."></textarea>
              </div>

              {/* Line Items Table */}
              <div className="border rounded overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-indigo-500 text-white">
                    <tr>
                      {["ITEM NAME", "DESCRIPTION", "UNIT", "QUANTITY", "RATE", "IMAGE", "AMOUNT", "ACTION"].map(h => (
                        <th key={h} className="px-3 py-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-2 py-2"><input type="text" value={formData.itemName} onChange={(e) => setFormData({ ...formData, itemName: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" /></td>
                      <td className="px-2 py-2"><input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" /></td>
                      <td className="px-2 py-2"><input type="text" placeholder="Unit" className="w-16 border rounded px-2 py-1 text-sm" /></td>
                      <td className="px-2 py-2"><input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} className="w-20 border rounded px-2 py-1 text-sm" /></td>
                      <td className="px-2 py-2"><input type="number" value={formData.rate} onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })} className="w-24 border rounded px-2 py-1 text-sm" /></td>
                      <td className="px-2 py-2"><input type="text" placeholder="Image URL" className="w-20 border rounded px-2 py-1 text-sm" /></td>
                      <td className="px-2 py-2 font-medium">{subTotal.toFixed(2)}</td>
                      <td className="px-2 py-2 text-center">
                        <button type="button" className="bg-green-500 text-white w-6 h-6 rounded text-xs">+</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Footer Calculations */}
              <div className="flex flex-col md:flex-row gap-6 border-t pt-4">
                <div className="flex-1 border rounded">
                  <div className="p-2 border-b bg-gray-50 text-xs font-medium">Content Footer</div>
                  <textarea className="w-full h-20 p-2 text-sm focus:outline-none resize-none" placeholder="Notes..."></textarea>
                </div>
                <div className="flex-1 space-y-1 text-sm">
                  <div className="flex justify-between items-center border rounded overflow-hidden">
                    <span className="bg-gray-50 px-3 py-1 w-1/2 border-r">Subtotal :</span>
                    <input type="text" value={subTotal.toFixed(2)} readOnly className="px-3 py-1 w-1/2 text-right bg-white outline-none" />
                  </div>
                  <div className="flex justify-between items-center border rounded overflow-hidden">
                    <span className="bg-gray-50 px-3 py-1 w-1/2 border-r">Vat(%) :</span>
                    <input type="number" value={formData.vat} onChange={(e) => setFormData({ ...formData, vat: Number(e.target.value) })} className="px-3 py-1 w-1/2 text-right bg-white outline-none" />
                  </div>
                  <div className="flex justify-between items-center border rounded overflow-hidden">
                    <span className="bg-gray-50 px-3 py-1 w-1/2 border-r">Vat(Amount) :</span>
                    <input type="text" value={vatAmount.toFixed(2)} readOnly className="px-3 py-1 w-1/2 text-right bg-white outline-none" />
                  </div>
                  <div className="flex justify-between items-center border rounded overflow-hidden">
                    <span className="bg-gray-50 px-3 py-1 w-1/2 border-r">AIT(%) :</span>
                    <input type="number" value={formData.ait} onChange={(e) => setFormData({ ...formData, ait: Number(e.target.value) })} className="px-3 py-1 w-1/2 text-right bg-white outline-none" />
                  </div>
                  <div className="flex justify-between items-center border rounded overflow-hidden">
                    <span className="bg-gray-50 px-3 py-1 w-1/2 border-r">AIT(Amount) :</span>
                    <input type="text" value={aitAmount.toFixed(2)} readOnly className="px-3 py-1 w-1/2 text-right bg-white outline-none" />
                  </div>
                  <div className="flex justify-between items-center border rounded overflow-hidden bg-green-50">
                    <span className="bg-green-100 px-3 py-1 w-1/2 border-r font-bold text-green-800">Grand Total :</span>
                    <input type="text" value={grandTotal.toFixed(2)} readOnly className="px-3 py-1 w-1/2 text-right bg-green-50 font-bold text-green-800 outline-none" />
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-400 text-white px-4 py-2 rounded text-sm">Close</button>
                <button type="submit" disabled={submitting} className="bg-indigo-600 text-white px-6 py-2 rounded text-sm flex items-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}