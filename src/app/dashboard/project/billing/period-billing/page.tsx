/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Loader2, Edit3, Trash2, ChevronRight, Search } from "lucide-react";
import toast from "react-hot-toast";
import PredictiveSearchSelect from "@/components/ui/PredictiveSearchSelect";
import { getStoredUser, getStoredAccessToken } from "@/lib/admin-auth/adminAuthStorage";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PATH = `${API_BASE}/realbizpro/api/v1`;

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

// ====================== TYPES ======================
interface PeriodBill {
  id: string;
  uuid: string;
  code: string;
  title: string;
  recordDate: string;
  amount: string | number;
  status: string;
  description: string;
  createdBy?: string;
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
    attachment?: string;
    createdBy?: string;
  };
  deletedAt?: string;
}

export default function PeriodBillPage() {
  const [storedUser, setStoredUser] = useState<any>(null);
  useEffect(() => {
    setStoredUser(getStoredUser());
  }, []);
  const userEmail = (storedUser?.email || "").toLowerCase().trim();

  const [dataList, setDataList] = useState<PeriodBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PeriodBill | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  // Dropdown Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const ledgers = [
    { uuid: "1", name: "Interest Income" },
    { uuid: "2", name: "Sales" },
    { uuid: "3", name: "Direct Income" },
    { uuid: "4", name: "Periodic Fee" }
  ];

  // Form Data
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    customerId: "",
    customerName: "",
    ledger: "Sales",
    code: `PB${Math.floor(1000 + Math.random() * 9000)}`,
    site: "",
    refWoNo: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    projectId: "",
    projectCost: 500000,
    percentage: 10,
    grandTotal: 50000,
    description: "",
    attachment: "",
    contentBody: "",
  });

  // ====================== FETCH LISTS ======================
  const fetchPeriodBills = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const currentUser = getStoredUser();
      const activeEmail = (currentUser?.email || userEmail || "").toLowerCase().trim();

      const res = await fetch(`${API_PATH}/project-billing/period-billings?limit=100`, { headers });
      const json = await res.json();
      if (json.success) {
        const rows = json.data.data || json.data || [];
        const userProjUuids = new Set(projects.map((p) => p.uuid));
        const filtered = rows
          .filter((item: any) => !item.deletedAt)
          .filter((item: any) => {
            if (!activeEmail) return true;
            const belongsToProj = item.projectId && userProjUuids.has(item.projectId);
            const creator = String(item.createdBy || item.details?.createdBy || "").toLowerCase().trim();
            return belongsToProj || creator === activeEmail;
          });
        setDataList(filtered);
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
      const headers = getAuthHeaders();
      const currentUser = getStoredUser();
      const activeEmail = (currentUser?.email || userEmail || "").toLowerCase().trim();
      const activeId = String(currentUser?.id || storedUser?.id || "");

      const resCus = await fetch(`${API_PATH}/customer-account?page=1&limit=100`, { headers });
      const jsonCus = await resCus.json();
      if (jsonCus.success) {
        const cusData = jsonCus.data.data || jsonCus.data || [];
        setCustomers(
          cusData.map((c: any) => ({
            ...c,
            uuid: c.uuid || c.id,
            name: c.name || c.customerName || c.clientName || "Customer",
            customerName: c.customerName || c.name || c.clientName || "Customer",
          }))
        );
      }

      const resProj = await fetch(`${API_PATH}/project?page=1&limit=100`, { headers });
      const jsonProj = await resProj.json();
      if (jsonProj.success) {
        const allProj = jsonProj.data.data || jsonProj.data || [];
        const userProjects = activeEmail
          ? allProj.filter((p: any) => {
              const raw = p.raw || p || {};
              const creator = String(
                raw.createdBy ||
                  raw.clientEmail ||
                  raw.email ||
                  raw.userEmail ||
                  raw.projectManager ||
                  ""
              )
                .toLowerCase()
                .trim();
              return creator === activeEmail || (activeId && creator === activeId);
            })
          : [];
        setProjects(
          userProjects.map((p: any) => ({
            ...p,
            uuid: p.uuid || p.id,
            name: p.name || p.projectName || "Unnamed Project",
          }))
        );
      }

      const resSite = await fetch(`${API_PATH}/project-sites?page=1&limit=100`, { headers });
      const jsonSite = await resSite.json();
      if (jsonSite.success) setSites(jsonSite.data.data || jsonSite.data || []);
    } catch (err) {
      console.error("Error fetching dropdowns:", err);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchPeriodBills();
  }, [projects.length, userEmail]);

  // ====================== SUBMIT (POST / PATCH) ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId) {
      toast.error("Please select a project");
      return;
    }
    setSubmitting(true);

    const currentUser = getStoredUser();
    const activeEmail = currentUser?.email || userEmail || "sharetest@realbiz.com";

    const payload = {
      projectId: formData.projectId,
      title: formData.contentBody ? formData.contentBody.substring(0, 50) : `Period Bill ${formData.code}`,
      code: formData.code,
      recordDate: formData.date,
      amount: Number(formData.grandTotal),
      status: "active",
      description: formData.description || "",
      createdBy: activeEmail,
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
        attachment: formData.attachment,
        createdBy: activeEmail,
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
      customerId: customers[0]?.uuid || "",
      customerName: customers[0]?.customerName || "",
      ledger: "Sales",
      code: `PB${Math.floor(1000 + Math.random() * 9000)}`,
      site: "",
      refWoNo: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      projectId: projects[0]?.uuid || "",
      projectCost: 500000,
      percentage: 10,
      grandTotal: 50000,
      description: "",
      attachment: "",
      contentBody: "Monthly construction progress fee billing",
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
      ledger: item.details?.ledger || "Sales",
      code: item.code,
      site: item.details?.site || "",
      refWoNo: item.details?.refWoNo || "",
      startDate: item.details?.startDate || "",
      endDate: item.details?.endDate || "",
      projectId: item.project?.uuid || (item as any).projectId || "",
      projectCost: item.details?.projectCost || 0,
      percentage: item.details?.percentage || 0,
      grandTotal: Number(item.amount),
      description: item.description,
      attachment: item.details?.attachment || "",
      contentBody: item.details?.contentBody || item.title,
    });
    setIsModalOpen(true);
  };

  // Calculation
  const handleCalculation = (cost: number, per: number) => {
    const total = (Number(cost || 0) * Number(per || 0)) / 100;
    setFormData(prev => ({ ...prev, projectCost: cost, percentage: per, grandTotal: total }));
  };

  const filteredData = dataList.filter((item) =>
    item.code?.toLowerCase().includes(search.toLowerCase()) ||
    item.project?.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.details?.customerName?.toLowerCase().includes(search.toLowerCase())
  );

  // Filter sites for selected project
  const filteredSites = formData.projectId 
    ? sites.filter(site => String(site.projectId).toLowerCase() === String(formData.projectId).toLowerCase()) 
    : sites;

  // Options for PredictiveSearchSelect
  const customerOptions = customers.map(c => ({
    value: c.uuid,
    label: `${c.customerName || c.name || "Customer"}${c.customerCode ? ` (${c.customerCode})` : ""}`,
  }));

  const ledgerOptions = ledgers.map(l => ({
    value: l.name,
    label: l.name,
  }));

  const projectOptions = projects.map(p => ({
    value: p.uuid,
    label: p.name,
  }));

  const siteOptions = filteredSites.map(s => ({
    value: s.name,
    label: s.name,
  }));

  // ====================== RENDER ======================
  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      <div className="mx-auto max-w-[1600px] space-y-5">
        
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <nav className="flex items-center text-xs sm:text-sm text-slate-500 gap-1.5 sm:gap-2 mb-1">
              <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Dashboard</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Project</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Billing</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                Period Billing
              </span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Period Billing / পিরিয়ড বিলিং
            </h1>
          </div>
          <button 
            onClick={handleCreate} 
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 hover:shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> 
            <span>+ New Period Billing</span>
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
                    {["ID", "PROJECT", "CUSTOMER NAME", "CODE", "REF", "DATE", "START DATE", "END DATE", "CONSTRUCTION COST", "SERVICE CHARGE", "ADDED BY", "ACTION"].map(h => (
                      <th key={h} className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700 font-medium">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center py-16 text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <p className="text-sm font-medium">No period billing records available</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item, idx) => (
                      <tr key={item.uuid || idx} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">{idx + 1}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{item.project?.name || "Share Tower 1"}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{item.details?.customerName || "N/A"}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{item.code}</td>
                        <td className="px-4 py-3 text-slate-500">{item.details?.refWoNo || "-"}</td>
                        <td className="px-4 py-3 text-slate-600">{item.recordDate}</td>
                        <td className="px-4 py-3 text-slate-600">{item.details?.startDate || "-"}</td>
                        <td className="px-4 py-3 text-slate-600">{item.details?.endDate || "-"}</td>
                        <td className="px-4 py-3 text-slate-800 font-medium">৳{Number(item.details?.projectCost || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 font-bold text-emerald-600">৳{Number(item.amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-500">{item.createdBy || userEmail}</td>
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
          <div className="bg-white rounded-2xl w-full max-w-5xl my-8 shadow-2xl border border-slate-100 overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">{editingItem ? "Edit Period Bill" : "New Period Bill"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 transition"><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-xs bg-white" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer</label>
                  <PredictiveSearchSelect
                    options={customerOptions}
                    value={formData.customerId}
                    onChange={(val) => {
                      const cus = customers.find(c => c.uuid === val);
                      setFormData(prev => ({ ...prev, customerId: val, customerName: cus?.customerName || cus?.name || "" }));
                    }}
                    placeholder="Select Customer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ledger</label>
                  <PredictiveSearchSelect
                    options={ledgerOptions}
                    value={formData.ledger}
                    onChange={(val) => setFormData(prev => ({ ...prev, ledger: val }))}
                    placeholder="Select Ledger"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bill Code</label>
                  <input type="text" value={formData.code} readOnly className="w-full border rounded-xl px-3 py-2 text-xs bg-slate-50 font-mono text-slate-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project *</label>
                  <PredictiveSearchSelect
                    options={projectOptions}
                    value={formData.projectId}
                    onChange={(val) => setFormData(prev => ({ ...prev, projectId: val, site: "" }))}
                    placeholder="Select Project"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Site</label>
                  <PredictiveSearchSelect
                    options={siteOptions}
                    value={formData.site}
                    onChange={(val) => setFormData(prev => ({ ...prev, site: val }))}
                    placeholder="Select Site"
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input type="date" value={formData.startDate} onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-xs bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input type="date" value={formData.endDate} onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-xs bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ref W/O No.</label>
                  <input type="text" value={formData.refWoNo} onChange={(e) => setFormData(prev => ({ ...prev, refWoNo: e.target.value }))} placeholder="PO No." className="w-full border rounded-xl px-3 py-2 text-xs bg-white" />
                </div>
              </div>

              {/* Row 4 (Financials) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project Cost (৳)</label>
                  <input type="number" value={formData.projectCost} onChange={(e) => handleCalculation(Number(e.target.value), formData.percentage)} className="w-full border rounded-xl px-3 py-2 text-xs bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Service Percentage (%)</label>
                  <div className="relative">
                    <input type="number" value={formData.percentage} onChange={(e) => handleCalculation(formData.projectCost, Number(e.target.value))} className="w-full border rounded-xl px-3 py-2 text-xs bg-white pr-8" />
                    <span className="absolute right-3 top-2 text-slate-400 text-xs">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Service Charge (Grand Total)</label>
                  <input type="text" value={`৳${formData.grandTotal.toFixed(2)}`} readOnly className="w-full border rounded-xl px-3 py-2 text-xs bg-emerald-50 text-emerald-700 font-bold" />
                </div>
              </div>

              {/* Content Body Mock Editor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Content Body / Description</label>
                <textarea value={formData.contentBody} onChange={(e) => setFormData(prev => ({ ...prev, contentBody: e.target.value }))} className="w-full h-24 p-3 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" placeholder="Type your period bill description here..."></textarea>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-2 rounded-xl text-xs font-semibold transition">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5">
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
