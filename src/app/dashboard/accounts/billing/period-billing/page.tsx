/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Loader2, Edit3, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PATH = `${API_BASE}/realbizpro/api/v1`;

// ====================== TYPES ======================
interface PeriodBill {
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
    startDate?: string;
    endDate?: string;
    projectCost?: number;
    percentage?: number;
    grandTotal?: number;
    refWoNo?: string;
    contentBody?: string;
    attachment?: string; // ✅ Added to fix TypeScript error
  };
  deletedAt?: string;
}

export default function PeriodBillPage() {
  const [dataList, setDataList] = useState<PeriodBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PeriodBill | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  // ড্রপডাউন ডাটা
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<any[]>([
    { uuid: "1", name: "Interest Income" },
    { uuid: "2", name: "Sales" }
  ]);

  // ফর্ম ডাটা
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    customerId: "",
    customerName: "",
    ledger: "",
    code: `PB${Math.floor(1000 + Math.random() * 9000)}`,
    site: "",
    refWoNo: "",
    startDate: "",
    endDate: "",
    projectId: "",
    projectCost: 0,
    percentage: 0,
    grandTotal: 0,
    description: "",
    attachment: "",
    contentBody: "",
  });

  // ====================== FETCH LISTS ======================
  const fetchPeriodBills = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_PATH}/project-billing/period-billings`);
      const json = await res.json();
      if (json.success) {
        setDataList((json.data.data || []).filter((item: any) => !item.deletedAt));
      }
    } catch (err) {
      toast.error("Failed to load period bills");
    } finally {
      setLoading(false);
    }
  };

  // ====================== FETCH DROPDOWNS ======================
  const fetchDropdowns = async () => {
    try {
      // ১. কাস্টমার
      const resCus = await fetch(`${API_PATH}/customer-account`);
      const jsonCus = await resCus.json();
      if (jsonCus.success) setCustomers(jsonCus.data.data || jsonCus.data || []);

      // ২. প্রজেক্ট
      const resProj = await fetch(`${API_PATH}/project`);
      const jsonProj = await resProj.json();
      if (jsonProj.success) setProjects(jsonProj.data.data || jsonProj.data || []);

      // ৩. সাইট (সব সাইট ফেচ করে রাখছি, পরে প্রজেক্ট অনুযায়ী ফিল্টার হবে)
      const resSite = await fetch(`${API_PATH}/project-sites`);
      const jsonSite = await resSite.json();
      if (jsonSite.success) setSites(jsonSite.data.data || jsonSite.data || []);
    } catch (err) {
      console.error("Error fetching dropdowns:", err);
    }
  };

  useEffect(() => {
    fetchPeriodBills();
    fetchDropdowns();
  }, []);

  // ====================== SUBMIT (POST / PATCH) ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      projectId: formData.projectId,
      title: formData.contentBody ? formData.contentBody.substring(0, 50) : "Period Bill Title",
      code: formData.code,
      recordDate: formData.date,
      amount: Number(formData.grandTotal),
      status: "active",
      description: formData.description,
      details: {
        customerId: formData.customerId,
        customerName: formData.customerName,
        ledger: formData.ledger,
        site: formData.site,
        startDate: formData.startDate,
        endDate: formData.endDate,
        projectCost: Number(formData.projectCost),
        percentage: Number(formData.percentage),
        grandTotal: Number(formData.grandTotal),
        refWoNo: formData.refWoNo,
        contentBody: formData.contentBody,
        attachment: formData.attachment
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
        fetchPeriodBills();
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
  const handleDelete = async (item: PeriodBill) => {
    if (!window.confirm(`Delete "${item.code}"?`)) return;
    try {
      const res = await fetch(`${API_PATH}/project-billing/period-billings/${item.uuid}`, {
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
      customerId: "",
      customerName: "",
      ledger: "",
      code: `PB${Math.floor(1000 + Math.random() * 9000)}`,
      site: "",
      refWoNo: "",
      startDate: "",
      endDate: "",
      projectId: "",
      projectCost: 0,
      percentage: 0,
      grandTotal: 0,
      description: "",
      attachment: "",
      contentBody: "",
    });
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: PeriodBill) => {
    setEditingItem(item);
    setFormData({
      date: item.recordDate,
      customerId: item.details?.customerId || "",
      customerName: item.details?.customerName || "",
      ledger: item.details?.ledger || "",
      code: item.code,
      site: item.details?.site || "",
      refWoNo: item.details?.refWoNo || "",
      startDate: item.details?.startDate || "",
      endDate: item.details?.endDate || "",
      projectId: item.project?.uuid || "",
      projectCost: item.details?.projectCost || 0,
      percentage: item.details?.percentage || 0,
      grandTotal: Number(item.amount),
      description: item.description,
      attachment: item.details?.attachment || "",
      contentBody: item.details?.contentBody || item.title,
    });
    setIsModalOpen(true);
  };

  // ক্যালকুলেশন (Project Cost এবং Percentage থেকে Grand Total)
  const handleCalculation = (cost: number, per: number) => {
    const total = (cost * per) / 100;
    setFormData(prev => ({ ...prev, projectCost: cost, percentage: per, grandTotal: total }));
  };

  const filteredData = dataList.filter((item) =>
    item.code?.toLowerCase().includes(search.toLowerCase()) ||
    item.project?.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.details?.customerName?.toLowerCase().includes(search.toLowerCase())
  );

  // সিলেক্টেড প্রজেক্টের সাইট ফিল্টার
  const filteredSites = sites.filter(site => site.projectId === formData.projectId);

  // ====================== RENDER ======================
  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      
      {/* Top Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">Home &gt; Billing &gt; Period Bill List</div>
        <button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm flex items-center gap-1">
          <Plus className="w-4 h-4" /> New Period Billing
        </button>
      </div>

      {/* List Table */}
      <div className="bg-white p-4 border rounded shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <button className="bg-green-600 text-white px-3 py-1 rounded text-xs">Excel</button>
            <button className="bg-red-600 text-white px-3 py-1 rounded text-xs">PDF</button>
          </div>
          <div className="flex gap-2 items-center text-sm">
            <span>Search:</span>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded px-2 py-1" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  {["ID", "PROJECT TYPE", "PROJECT", "CUSTOMER NAME", "CODE", "REF", "DATE", "START DATE", "END DATE", "CONSTRUCTION COST", "SERVICE CHARGE", "ADDED BY", "ATTACHMENT", "ACTION"].map(h => (
                    <th key={h} className="px-3 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.length === 0 ? (
                  <tr><td colSpan={14} className="text-center py-8 text-gray-500">No data available in table</td></tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.uuid} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{item.id}</td>
                      <td className="px-3 py-2">{item.details?.projectType || "N/A"}</td>
                      <td className="px-3 py-2 font-medium">{item.project?.name || "Unknown"}</td>
                      <td className="px-3 py-2">{item.details?.customerName || "N/A"}</td>
                      <td className="px-3 py-2">{item.code}</td>
                      <td className="px-3 py-2">{item.details?.refWoNo || "-"}</td>
                      <td className="px-3 py-2">{item.recordDate}</td>
                      <td className="px-3 py-2">{item.details?.startDate || "-"}</td>
                      <td className="px-3 py-2">{item.details?.endDate || "-"}</td>
                      <td className="px-3 py-2">{item.details?.projectCost || "0"}</td>
                      <td className="px-3 py-2 font-bold">{item.amount}</td>
                      <td className="px-3 py-2">Admin</td>
                      <td className="px-3 py-2">-</td>
                      <td className="px-3 py-2 flex gap-1">
                        <button onClick={() => handleEdit(item)} className="bg-teal-500 text-white p-1.5 rounded hover:bg-teal-600"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(item)} className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ====================== ADD/EDIT MODAL ====================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b bg-[#F3F0FF]">
              <h2 className="text-lg font-bold">{editingItem ? "Edit Period Bill" : "Period Bill List"}</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4 bg-[#F8F6FF]">
              
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                    {customers.map(c => (
                      <option key={c.uuid} value={c.uuid}>{c.customerName}</option>
                    ))}
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

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Project</label>
                  <select value={formData.projectId} onChange={(e) => {
                    setFormData({ ...formData, projectId: e.target.value, site: "" }); // Reset site when project changes
                  }} className="w-full border rounded px-3 py-1.5 text-sm" required>
                    <option value="">Select value</option>
                    {projects.map(p => <option key={p.uuid} value={p.uuid}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Project Cost</label>
                  <input type="number" value={formData.projectCost} onChange={(e) => handleCalculation(Number(e.target.value), formData.percentage)} className="w-full border rounded px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Percentage</label>
                  <div className="relative">
                    <input type="number" value={formData.percentage} onChange={(e) => handleCalculation(formData.projectCost, Number(e.target.value))} className="w-full border rounded px-3 py-1.5 text-sm pr-8" />
                    <span className="absolute right-3 top-1.5 text-gray-500">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Grand Total</label>
                  <input type="text" value={formData.grandTotal.toFixed(2)} readOnly className="w-full border rounded px-3 py-1.5 text-sm bg-gray-50 font-bold text-green-700" />
                </div>
              </div>

              {/* Attachment */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Attachment</label>
                <input type="file" onChange={(e) => setFormData({ ...formData, attachment: e.target.files?.[0]?.name || "" })} className="w-full border rounded px-3 py-1 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-indigo-50 file:text-indigo-700" />
              </div>

              {/* Content Body Mock Editor */}
              <div>
                <label className="block text-xs text-gray-600 mb-1 font-bold">Content Body</label>
                <div className="border rounded bg-white">
                  <div className="p-2 border-b flex gap-3 text-sm text-gray-700 bg-gray-50"><span>File</span><span>Edit</span><span>View</span><span>Insert</span><span>Format</span><span>Tools</span><span>Table</span></div>
                  <div className="p-2 border-b flex gap-3 text-gray-600 flex-wrap">
                    <span>↶</span><span>↷</span><span>Paragraph ▾</span><span className="font-bold">B</span><span className="italic">I</span><span>U</span><span>≡</span>
                    <span>🖼️</span><span>📄</span><span>👁️</span><span>▶️</span>
                  </div>
                  <textarea value={formData.contentBody} onChange={(e) => setFormData({ ...formData, contentBody: e.target.value })} className="w-full h-32 p-3 text-sm focus:outline-none resize-none" placeholder="Type your content here..."></textarea>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex justify-center gap-2 mt-4 pt-4">
                <button type="submit" disabled={submitting} className="bg-indigo-600 text-white px-8 py-2 rounded text-sm flex items-center gap-2 hover:bg-indigo-700">
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