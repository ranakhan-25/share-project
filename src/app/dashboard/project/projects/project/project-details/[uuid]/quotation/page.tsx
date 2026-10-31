/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, X, Loader2, Download } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

// ====================== TYPES ======================
interface QuotationItem {
  id: number;
  itemName: string;
  unit: string;
  quantity: number;
  rate: number;
  details: string;
  image: string;
  amount: number;
}

interface Quotation {
  id: string;
  uuid: string;
  uid: string;
  date: string;
  customer: string;
  customerId?: string;
  projectType: string;
  project: string;
  projectId?: string;
  employeeName: string;
  grandTotal: number;
  addedBy: string;
  approveStatus: string;
  attachment: string;
  code: string;
  deletedAt?: string;
}

interface SubCategory {
  id: string;
  uuid: string;
  name: string;
  categoryId: string;
}

export default function QuotationPage() {
  const { uuid } = useParams();
  const [showForm, setShowForm] = useState(false);

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Dropdown Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [projectTypes, setProjectTypes] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // ✅ সব সাব-ক্যাটাগরি রাখার স্টেট
  const [allSubCategories, setAllSubCategories] = useState<SubCategory[]>([]);

  // Form State
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    customerId: "",
    customerName: "",
    code: `QU${Math.floor(100000 + Math.random() * 900000)}`,
    projectType: "",
    projectId: "",
    site: "",
    attachment: "",
    contentBody: "",
    categoryId: "",
    subCategoryId: "",
  });

  const [lineItems, setLineItems] = useState<QuotationItem[]>([]);

  // ====================== FETCH LIST ======================
  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/realbizpro/api/v1/quotation?sortOrder=DESC&withDeleted=false`);
      const json = await res.json();
      if (json.success) {
        setQuotations((json.data.data || []).filter((item: any) => !item.deletedAt));
      }
    } catch (err) {
      toast.error("Failed to load quotations");
    } finally {
      setLoading(false);
    }
  };

  // ====================== FETCH DROPDOWNS ======================
  const fetchDropdowns = async () => {
    try {
      // ১. কাস্টমার (সাপ্লায়ার API)
      const resCust = await fetch(`${API_BASE}/realbizpro/api/v1/inventory/suppliers?page=1&limit=100`);
      const jsonCust = await resCust.json();
      if (jsonCust.success) {
        setCustomers(jsonCust.data.data || []);
      }

      // ২. প্রজেক্ট টাইপ
      const resType = await fetch(`${API_BASE}/realbizpro/api/v1/project-type`);
      const jsonType = await resType.json();
      if (jsonType.success) setProjectTypes(jsonType.data.data || []);

      // ৩. প্রজেক্ট
      const resProj = await fetch(`${API_BASE}/realbizpro/api/v1/project`);
      const jsonProj = await resProj.json();
      if (jsonProj.success) setProjects(jsonProj.data.data || []);

      // ৪. সাইট
      const resSite = await fetch(`${API_BASE}/realbizpro/api/v1/project-sites`);
      const jsonSite = await resSite.json();
      if (jsonSite.success) setSites(jsonSite.data.data || []);

      // ৫. ক্যাটাগরি
      const resCat = await fetch(`${API_BASE}/realbizpro/api/v1/category`);
      const jsonCat = await resCat.json();
      if (jsonCat.success) setCategories(jsonCat.data.data || []);

      // ✅ ৬. সব সাব-ক্যাটাগরি (limit=100 ফিক্স)
      const resSubCat = await fetch(`${API_BASE}/realbizpro/api/v1/billing-sub-category?page=1&limit=100`);
      const jsonSubCat = await resSubCat.json();
      if (jsonSubCat.success) {
        setAllSubCategories(jsonSubCat.data.data || []);
      }

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQuotations();
    fetchDropdowns();
  }, []);

  // ====================== FORM LOGIC ======================
  const handleNewQuoteClick = () => {
    setForm({
      date: new Date().toISOString().split("T")[0],
      customerId: "",
      customerName: "",
      code: `QU${Math.floor(100000 + Math.random() * 900000)}`,
      projectType: "",
      projectId: "",
      site: "",
      attachment: "",
      contentBody: "",
      categoryId: "",
      subCategoryId: "",
    });
    setLineItems([]);
    setShowForm(true);
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { id: Date.now(), itemName: "", unit: "", quantity: 1, rate: 0, details: "", image: "", amount: 0 },
    ]);
  };

  const removeLineItem = (id: number) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: number, field: keyof QuotationItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "rate") {
          updated.amount = Number(updated.quantity) * Number(updated.rate);
        }
        return updated;
      })
    );
  };

  const subtotal = lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const grandTotal = subtotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      uid: form.code,
      date: form.date,
      customer: form.customerName,
      customerId: form.customerId,
      code: form.code,
      projectType: form.projectType,
      project: projects.find(p => p.uuid === form.projectId)?.name || "",
      projectId: form.projectId,
      categoryId: form.categoryId,
      subCategoryId: form.subCategoryId,
      site: form.site,
      attachment: form.attachment,
      contentBody: form.contentBody,
      employeeName: "Admin",
      grandTotal: grandTotal,
      items: lineItems.map(item => ({
        itemName: item.itemName,
        unit: item.unit,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        details: item.details,
        image: item.image,
        amount: Number(item.amount)
      })),
      approveStatus: "Pending",
      addedBy: "Admin",
      addedById: "admin-uuid",
    };

    try {
      const res = await fetch(`${API_BASE}/realbizpro/api/v1/quotation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok || json.success) {
        toast.success("Quotation created successfully!");
        setShowForm(false);
        fetchQuotations();
      } else {
        toast.error(json.message || "Failed to create quotation");
      }
    } catch (err: any) {
      toast.error("Network Error");
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ ক্যাটাগরি পরিবর্তন হলে ফিল্টার করা সাব-ক্যাটাগরি বের করা
  const filteredSubCategories = allSubCategories.filter(
    (subCat) => subCat.categoryId === form.categoryId
  );

  // ====================== RENDER ======================
  if (showForm) {
    return (
      <div className="bg-white p-6 border rounded-md shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-500">Home &gt; Billing &gt; Quote Add/Offer</div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded text-sm transition-colors">Back to List</button>
            <button onClick={() => setIsItemModalOpen(true)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-sm transition-colors">Item Add</button>
            <button onClick={() => setIsCustomerModalOpen(true)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-sm transition-colors">Contacts Add</button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Top Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b pb-6 mb-6">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Customer (Supplier)</label>
              <select value={form.customerId} onChange={(e) => {
                const selectedId = e.target.value;
                const selectedCust = customers.find(c => c.uuid === selectedId || c.id === selectedId);
                setForm({ ...form, customerId: selectedId, customerName: selectedCust?.name || selectedCust?.companyName || "" });
              }} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                <option value="">Select Customer</option>
                {customers.map(c => (
                  <option key={c.uuid || c.id} value={c.uuid || c.id}>{c.name || c.companyName || "Unknown"}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Code</label>
              <input type="text" value={form.code} readOnly className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Project Type</label>
              <select value={form.projectType} onChange={(e) => setForm({ ...form, projectType: e.target.value })} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                <option value="">Select Project Type</option>
                {projectTypes.map(p => <option key={p.uuid} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Project</label>
              <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.uuid} value={p.uuid}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Site</label>
              <select value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                <option value="">Select Site</option>
                {sites.map(s => <option key={s.uuid} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Attachment</label>
              <input type="file" onChange={(e) => setForm({ ...form, attachment: e.target.files?.[0]?.name || "" })} className="w-full border rounded px-3 py-1.5 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-indigo-50 file:text-indigo-700" />
            </div>
          </div>

          {/* Content Body */}
          <div className="border rounded-md mb-6">
            <div className="p-2 border-b flex gap-3 text-sm text-gray-700 bg-gray-50">
              <span>File</span><span>Edit</span><span>View</span><span>Insert</span><span>Format</span><span>Tools</span><span>Table</span>
            </div>
            <div className="p-2 border-b flex gap-3 text-gray-600">
              <span>↶</span><span>↷</span><span>Paragraph ▾</span><span className="font-bold">B</span><span className="italic">I</span><span>U</span><span>≡</span>
            </div>
            <textarea value={form.contentBody} onChange={(e) => setForm({ ...form, contentBody: e.target.value })} className="w-full h-32 p-4 focus:outline-none resize-none" placeholder="Content Body..."></textarea>
          </div>

          {/* Category & Sub Category Select */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Category</label>
              <select 
                value={form.categoryId} 
                onChange={(e) => setForm({ ...form, categoryId: e.target.value, subCategoryId: "" })} 
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.uuid || c.id} value={c.uuid || c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Sub Category</label>
              <select 
                value={form.subCategoryId} 
                onChange={(e) => setForm({ ...form, subCategoryId: e.target.value })} 
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" 
                disabled={!form.categoryId}
              >
                <option value="">Select Sub Category</option>
                {/* ✅ ফিল্টার করা সাব-ক্যাটাগরি লিস্ট */}
                {filteredSubCategories.map(sc => (
                  <option key={sc.uuid || sc.id} value={sc.uuid || sc.id}>{sc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Select Item *</label>
              <select className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                <option value="">Search Item...</option>
              </select>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border rounded overflow-hidden mb-6">
            <table className="w-full text-sm text-left">
              <thead className="bg-indigo-500 text-white">
                <tr>
                  {["ITEM NAME", "UNIT", "QUANTITY", "RATE", "DETAILS", "IMAGE", "AMOUNT", "ACTION"].map(h => (
                    <th key={h} className="px-3 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lineItems.length === 0 ? (
                  <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-500">No items added. Click "Item Add" to start.</td></tr>
                ) : (
                  lineItems.map(item => (
                    <tr key={item.id}>
                      <td className="px-3 py-2"><input type="text" value={item.itemName} onChange={(e) => updateLineItem(item.id, "itemName", e.target.value)} className="w-full border rounded px-2 py-1" /></td>
                      <td className="px-3 py-2"><input type="text" value={item.unit} onChange={(e) => updateLineItem(item.id, "unit", e.target.value)} className="w-16 border rounded px-2 py-1" /></td>
                      <td className="px-3 py-2"><input type="number" value={item.quantity} onChange={(e) => updateLineItem(item.id, "quantity", e.target.value)} className="w-20 border rounded px-2 py-1" /></td>
                      <td className="px-3 py-2"><input type="number" value={item.rate} onChange={(e) => updateLineItem(item.id, "rate", e.target.value)} className="w-24 border rounded px-2 py-1" /></td>
                      <td className="px-3 py-2"><input type="text" value={item.details} onChange={(e) => updateLineItem(item.id, "details", e.target.value)} className="w-full border rounded px-2 py-1" /></td>
                      <td className="px-3 py-2"><input type="text" value={item.image} onChange={(e) => updateLineItem(item.id, "image", e.target.value)} className="w-20 border rounded px-2 py-1" /></td>
                      <td className="px-3 py-2 font-medium">{item.amount.toLocaleString()}</td>
                      <td className="px-3 py-2"><button type="button" onClick={() => removeLineItem(item.id)} className="text-red-500 hover:text-red-700">🗑</button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer / Calculations */}
          <div className="flex flex-col md:flex-row gap-6 border-t pt-4">
            <div className="flex-1 border rounded overflow-hidden">
              <div className="p-2 border-b bg-gray-50 text-sm font-medium">Content Footer</div>
              <textarea className="w-full h-32 p-3 focus:outline-none resize-none" placeholder="Notes..."></textarea>
            </div>
            
            <div className="flex-1 space-y-2 text-sm">
              <div className="flex justify-between items-center border rounded overflow-hidden">
                <span className="bg-gray-50 px-3 py-1.5 w-1/2 border-r">Subtotal :</span>
                <input type="text" value={subtotal.toFixed(2)} readOnly className="px-3 py-1.5 w-1/2 text-right bg-white outline-none" />
              </div>
              <div className="flex justify-between items-center border rounded overflow-hidden bg-green-50">
                <span className="bg-green-100 px-3 py-1.5 w-1/2 border-r font-bold text-green-800">Grand Total :</span>
                <input type="text" value={grandTotal.toFixed(2)} readOnly className="px-3 py-1.5 w-1/2 text-right bg-green-50 font-bold text-green-800 outline-none" />
              </div>
              <div className="flex justify-end mt-4">
                <button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Modals */}
        {isItemModalOpen && <ItemAddModal onClose={() => setIsItemModalOpen(false)} onAdd={(item) => { setLineItems([...lineItems, { ...item, id: Date.now() }]); setIsItemModalOpen(false); }} />}
        {isCustomerModalOpen && <CustomerAddModal onClose={() => setIsCustomerModalOpen(false)} />}
      </div>
    );
  }

  // ====================== LIST VIEW ======================
  return (
    <div className="bg-white p-4 border rounded-md shadow-sm">
      <div className="flex justify-between items-end mb-4">
        <div className="w-1/3">
          <label className="block text-xs text-gray-600 mb-1">Select Date</label>
          <input type="text" value="October 1, 2026 - October 31, 2026" className="w-full border rounded px-3 py-2 text-sm" readOnly />
        </div>
        <button onClick={handleNewQuoteClick} className="bg-indigo-500 text-white px-4 py-2 rounded text-sm flex items-center gap-1 hover:bg-indigo-600">
          <Plus className="w-4 h-4" /> New Quote
        </button>
      </div>

      <div className="flex justify-between items-center bg-gray-50 p-2 border rounded text-sm mb-4">
        <div className="flex gap-2">
          <button className="bg-green-600 text-white px-3 py-1 rounded">Excel</button>
          <button className="bg-red-600 text-white px-3 py-1 rounded">PDF</button>
          <select className="border rounded px-2 py-1 ml-2"><option>10</option></select>
          <span className="py-1">entries</span>
        </div>
        <div className="flex gap-2 items-center">
          <span>Search:</span>
          <input type="text" className="border rounded px-2 py-1" />
        </div>
      </div>

      <div className="border rounded overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center h-32"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : (
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-indigo-600 text-white">
              <tr>
                {["ID", "ORDER CODE", "DATE", "PROJECT TYPE", "PROJECT", "EMPLOYEE NAME", "GRAND TOTAL", "ADDED BY", "APPROVE", "ATTACHMENT", "ACTION"].map(h => (
                  <th key={h} className="px-3 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quotations.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-6 text-gray-500">No data available in table</td></tr>
              ) : (
                quotations.map(item => (
                  <tr key={item.uuid} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{item.id}</td>
                    <td className="px-3 py-2 text-indigo-600 font-medium">{item.code}</td>
                    <td className="px-3 py-2">{item.date}</td>
                    <td className="px-3 py-2">{item.projectType}</td>
                    <td className="px-3 py-2">{item.project}</td>
                    <td className="px-3 py-2">{item.employeeName}</td>
                    <td className="px-3 py-2 font-bold">{Number(item.grandTotal).toLocaleString()}</td>
                    <td className="px-3 py-2">{item.addedBy}</td>
                    <td className="px-3 py-2"><span className="text-indigo-600">{item.approveStatus}</span></td>
                    <td className="px-3 py-2"><Download className="w-4 h-4 text-indigo-500 cursor-pointer" /></td>
                    <td className="px-3 py-2">
                      <button className="bg-teal-500 text-white px-2 py-1 rounded text-xs">✎</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ====================== MODALS ======================
function ItemAddModal({ onClose, onAdd }: { onClose: () => void, onAdd: (item: any) => void }) {
  const [form, setForm] = useState({ itemName: "", unit: "", quantity: 1, rate: 0, details: "", image: "" });
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-6"><h2 className="text-lg font-bold">New Item</h2><button onClick={onClose}><X className="w-5 h-5" /></button></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="block text-xs mb-1">Item Name</label><input type="text" value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs mb-1">Unit</label><input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs mb-1">Rate</label><input type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs mb-1">Quantity</label><input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs mb-1">Image</label><input type="text" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" /></div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="bg-gray-400 text-white px-4 py-2 rounded text-sm">Close</button>
          <button onClick={() => onAdd({ ...form, amount: form.quantity * form.rate })} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm">Submit</button>
        </div>
      </div>
    </div>
  );
}

function CustomerAddModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6"><h2 className="text-lg font-bold">Customer Add</h2><button onClick={onClose}><X className="w-5 h-5" /></button></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs mb-1">Code</label><input type="text" value="C414913" readOnly className="w-full border rounded px-3 py-2 text-sm bg-gray-50" /></div>
          <div><label className="block text-xs mb-1">Name</label><input type="text" placeholder="Enter Name" className="w-full border rounded px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs mb-1">Mobile Number</label><input type="text" placeholder="Enter Mobile" className="w-full border rounded px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs mb-1">Buyer Reference</label><input type="text" placeholder="Enter Business Name" className="w-full border rounded px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs mb-1">Address</label><input type="text" placeholder="Enter Address" className="w-full border rounded px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs mb-1">Credit Limit</label><input type="text" placeholder="Enter Credit Limit" className="w-full border rounded px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs mb-1">Due Date</label><input type="date" className="w-full border rounded px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs mb-1">Opening Balance</label><input type="text" placeholder="Opening Balance" className="w-full border rounded px-3 py-2 text-sm" /></div>
          <div className="col-span-2"><label className="block text-xs mb-1">Chart Of Groups*</label><select className="w-full border rounded px-3 py-2 text-sm"><option>Select One Option</option><option>Current Assets</option><option>Fixed Assets</option></select></div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="bg-gray-400 text-white px-4 py-2 rounded text-sm">Close</button>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded text-sm">Submit</button>
        </div>
      </div>
    </div>
  );
}