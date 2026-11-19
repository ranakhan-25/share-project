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
interface WorkOrder {
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
    supplierName?: string;
    projectType?: string;
    site?: string;
    categoryId?: string;
    brand?: string;
    under?: string;
    itemName?: string;
    vat?: number;
    ait?: number;
    quantity?: number;
    rate?: number;
    grandTotal?: number;
    createdBy?: string;
  };
  deletedAt?: string;
}

export default function ContractorWorkOrderPage() {
  const [storedUser, setStoredUser] = useState<any>(null);
  useEffect(() => {
    setStoredUser(getStoredUser());
  }, []);
  const userEmail = (storedUser?.email || "").toLowerCase().trim();

  const [dataList, setDataList] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  // Dropdown Data
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [projectTypes, setProjectTypes] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [unders, setUnders] = useState<any[]>([
    { uuid: "1", name: "Contractor" },
    { uuid: "2", name: "Sub-Contractor" },
    { uuid: "3", name: "Vendor" },
    { uuid: "4", name: "Direct Labour" }
  ]);

  // Form Data
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
    under: "Contractor",
    itemName: "Civil Construction Works",
    quantity: 1,
    rate: 15000,
    description: "",
    attachment: "",
    contentBody: "Work order for building reinforcement foundation",
    vat: 0,
    ait: 0,
  });

  // ====================== FETCH LISTS ======================
  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const currentUser = getStoredUser();
      const activeEmail = (currentUser?.email || userEmail || "").toLowerCase().trim();

      const res = await fetch(`${API_PATH}/project-billing/contractor-work-orders?limit=100`, { headers });
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
      toast.error("Failed to load work orders");
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

      // Contractors as suppliers
      const resSup = await fetch(`${API_PATH}/contractor?page=1&limit=100`, { headers });
      const jsonSup = await resSup.json();
      const supplierData = jsonSup.data?.data || jsonSup.data || [];
      if (Array.isArray(supplierData)) {
        setSuppliers(supplierData.map((s: any) => ({ ...s, uuid: s.uuid || s.id, name: s.name || s.contractorName || "Contractor" })));
      }

      const resType = await fetch(`${API_PATH}/project-type?page=1&limit=100`, { headers });
      const jsonType = await resType.json();
      if (jsonType.success) setProjectTypes(jsonType.data.data || jsonType.data || []);

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

      const resCat = await fetch(`${API_PATH}/category?page=1&limit=100`, { headers });
      const jsonCat = await resCat.json();
      if (jsonCat.success) setCategories(jsonCat.data.data || jsonCat.data || []);

      const resBrand = await fetch(`${API_PATH}/procurement/brand?page=1&limit=100`, { headers });
      const jsonBrand = await resBrand.json();
      if (jsonBrand.success) setBrands(jsonBrand.data.data || jsonBrand.data || []);

    } catch (err) {
      console.error("Error fetching dropdowns:", err);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchWorkOrders();
  }, [projects.length, userEmail]);

  // Calculations
  const subTotal = Number(formData.quantity || 0) * Number(formData.rate || 0);
  const vatAmount = (subTotal * Number(formData.vat || 0)) / 100;
  const aitAmount = (subTotal * Number(formData.ait || 0)) / 100;
  const grandTotal = subTotal + vatAmount + aitAmount;

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
      title: formData.contentBody || `Work Order ${formData.code}`,
      code: formData.code,
      recordDate: formData.date,
      amount: grandTotal,
      status: "active",
      description: formData.description,
      createdBy: activeEmail,
      details: {
        supplierId: formData.supplierId,
        supplierName: formData.supplierName,
        projectType: formData.projectType,
        site: formData.site,
        categoryId: formData.categoryId,
        brand: formData.brand,
        under: formData.under,
        itemName: formData.itemName,
        quantity: formData.quantity,
        rate: formData.rate,
        vat: formData.vat,
        ait: formData.ait,
        subTotal,
        grandTotal,
        createdBy: activeEmail,
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
        headers: getAuthHeaders(),
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
    if (!window.confirm(`Delete "${item.code}"?`)) return;
    try {
      const res = await fetch(`${API_PATH}/project-billing/contractor-work-orders/${item.uuid}`, {
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
      supplierId: suppliers[0]?.uuid || "",
      supplierName: suppliers[0]?.name || "Rahim Electrical Contractors",
      code: `CWO${Math.floor(1000 + Math.random() * 9000)}`,
      projectType: projectTypes[0]?.name || "Residential Deluxe Project",
      projectId: projects[0]?.uuid || "",
      site: sites[0]?.name || "",
      categoryId: categories[0]?.uuid || "",
      brand: brands[0]?.name || "",
      under: "Contractor",
      itemName: "Civil Construction Works",
      quantity: 1,
      rate: 15000,
      description: "",
      attachment: "",
      contentBody: "Work order for building reinforcement foundation",
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
      supplierId: (item.details as any)?.supplierId || suppliers[0]?.uuid || "",
      supplierName: item.details?.supplierName || "Contractor",
      code: item.code,
      projectType: item.details?.projectType || "",
      projectId: item.project?.uuid || (item as any).projectId || "",
      site: item.details?.site || "",
      categoryId: item.details?.categoryId || "",
      brand: item.details?.brand || "",
      under: item.details?.under || "Contractor",
      itemName: item.details?.itemName || "Civil Construction Works",
      quantity: item.details?.quantity || 1,
      rate: item.details?.rate || Number(item.amount) || 15000,
      description: item.description,
      attachment: "",
      contentBody: item.title,
      vat: item.details?.vat || 0,
      ait: item.details?.ait || 0,
    });
    setIsModalOpen(true);
  };

  const filteredData = dataList.filter((item) =>
    item.title?.toLowerCase().includes(search.toLowerCase()) ||
    item.code?.toLowerCase().includes(search.toLowerCase()) ||
    item.project?.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.details?.supplierName?.toLowerCase().includes(search.toLowerCase())
  );

  // Filter sites for selected project
  const filteredSites = formData.projectId 
    ? sites.filter(site => String(site.projectId).toLowerCase() === String(formData.projectId).toLowerCase()) 
    : sites;

  // Options for PredictiveSearchSelect
  const supplierOptions = suppliers.map(s => ({
    value: s.uuid,
    label: s.name || s.contractorName || "Contractor",
  }));

  const projectOptions = projects.map(p => ({
    value: p.uuid,
    label: p.name,
  }));

  const projectTypeOptions = projectTypes.map(p => ({
    value: p.name,
    label: p.name,
  }));

  const siteOptions = filteredSites.map(s => ({
    value: s.name,
    label: s.name,
  }));

  const categoryOptions = categories.map(c => ({
    value: c.uuid,
    label: c.name,
  }));

  const brandOptions = brands.map(b => ({
    value: b.name,
    label: b.name,
  }));

  const underOptions = unders.map(u => ({
    value: u.name,
    label: u.name,
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
                Contractor Work Order
              </span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Contractor Work Order / কন্ট্রাক্টর ওয়ার্ক অর্ডার
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
              <button className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-700 active:scale-95">Excel</button>
              <button className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-rose-700 active:scale-95">PDF</button>
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
                    {["ID", "CONTRACTOR", "PROJECT", "WO NO", "DATE", "ITEM NAME", "QTY", "RATE", "GRAND TOTAL", "ADDED BY", "ACTION"].map(h => (
                      <th key={h} className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700 font-medium">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-16 text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <p className="text-sm font-medium">No contractor work order records available</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item, idx) => (
                      <tr key={item.uuid || idx} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">{idx + 1}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{item.details?.supplierName || "Contractor"}</td>
                        <td className="px-4 py-3">{item.project?.name || "Share Tower 1"}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{item.code}</td>
                        <td className="px-4 py-3 text-slate-600">{item.recordDate}</td>
                        <td className="px-4 py-3 text-slate-800">{item.details?.itemName || "Works"}</td>
                        <td className="px-4 py-3">{item.details?.quantity || 1}</td>
                        <td className="px-4 py-3 font-mono">৳{Number(item.details?.rate || item.amount || 0).toLocaleString()}</td>
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
              <button disabled className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed">Previous</button>
              <button className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold">1</button>
              <button disabled className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed">Next</button>
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
              <h2 className="text-base font-bold text-slate-900">{editingItem ? "Edit Contractor Work Order" : "New Contractor Work Order"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 transition"><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              
              {/* Top Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-xs bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contractor / Supplier *</label>
                  <PredictiveSearchSelect
                    options={supplierOptions}
                    value={formData.supplierId}
                    onChange={(val) => {
                      const sup = suppliers.find(s => s.uuid === val);
                      setFormData(prev => ({ ...prev, supplierId: val, supplierName: sup?.name || "Contractor" }));
                    }}
                    placeholder="Select Contractor"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">WO Code</label>
                  <input type="text" value={formData.code} readOnly className="w-full border rounded-xl px-3 py-2 text-xs bg-slate-50 font-mono text-slate-600" />
                </div>
              </div>

              {/* Second Row Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project Type</label>
                  <PredictiveSearchSelect
                    options={projectTypeOptions}
                    value={formData.projectType}
                    onChange={(val) => setFormData(prev => ({ ...prev, projectType: val }))}
                    placeholder="Select Project Type"
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

              {/* Third Row Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <PredictiveSearchSelect
                    options={categoryOptions}
                    value={formData.categoryId}
                    onChange={(val) => setFormData(prev => ({ ...prev, categoryId: val }))}
                    placeholder="Select Category"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
                  <PredictiveSearchSelect
                    options={brandOptions}
                    value={formData.brand}
                    onChange={(val) => setFormData(prev => ({ ...prev, brand: val }))}
                    placeholder="Select Brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Under</label>
                  <PredictiveSearchSelect
                    options={underOptions}
                    value={formData.under}
                    onChange={(val) => setFormData(prev => ({ ...prev, under: val }))}
                    placeholder="Select Under"
                  />
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white p-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Item / Scope of Work Name</label>
                    <input type="text" value={formData.itemName} onChange={(e) => setFormData(prev => ({ ...prev, itemName: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-xs" placeholder="Work Scope" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
                    <input type="number" min="1" value={formData.quantity} onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))} className="w-full border rounded-xl px-3 py-2 text-xs" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Rate (৳)</label>
                    <input type="number" min="0" value={formData.rate} onChange={(e) => setFormData(prev => ({ ...prev, rate: Number(e.target.value) }))} className="w-full border rounded-xl px-3 py-2 text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                  <div>
                    <label className="block text-slate-500 mb-1">Subtotal</label>
                    <input type="text" value={`৳${subTotal.toFixed(2)}`} readOnly className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-100 font-bold" />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">VAT (%)</label>
                    <input type="number" value={formData.vat} onChange={(e) => setFormData(prev => ({ ...prev, vat: Number(e.target.value) }))} className="w-full border rounded-lg px-2.5 py-1.5 bg-white" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">AIT (%)</label>
                    <input type="number" value={formData.ait} onChange={(e) => setFormData(prev => ({ ...prev, ait: Number(e.target.value) }))} className="w-full border rounded-lg px-2.5 py-1.5 bg-white" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Grand Total</label>
                    <input type="text" value={`৳${grandTotal.toFixed(2)}`} readOnly className="w-full border rounded-lg px-2.5 py-1.5 bg-emerald-50 text-emerald-700 font-bold" />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work Order Details / Notes</label>
                <textarea value={formData.contentBody} onChange={(e) => setFormData(prev => ({ ...prev, contentBody: e.target.value }))} className="w-full h-20 p-3 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" placeholder="Work order terms, specifications, instructions..."></textarea>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-2 rounded-xl text-xs font-semibold transition">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5">
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
