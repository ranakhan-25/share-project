/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Loader2, Edit3, Trash2, Search, FileSpreadsheet, FileText } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PATH = `${API_BASE}/realbizpro/api/v1`;

// ====================== TYPES ======================
interface Land {
  id: string;
  uuid: string;
  projectId: string;
  projectName: string;
  propertyType: string;
  siteName: string;
  blockName: string;
  roadNo: string;
  plotLocation: string;
  flatLandNo: string;
  unit: string;
  size: string;
  pricePerUnit: string;
  subtotal: string;
  grandTotal: string;
  customerName: string;
  status: string;
  project?: { name: string; uuid: string };
  deletedAt?: string;
}

export default function LandPage() {
  const [dataList, setDataList] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Land | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  // Filter States
  const [filterProject, setFilterProject] = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Dropdown Data
  const [projects, setProjects] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);

  // Form Data
  const [formData, setFormData] = useState({
    projectId: "",
    siteName: "",
    blockName: "",
    roadNo: "",
    plotLocation: "",
    flatLandNo: "",
    unit: "",
    size: "",
    pricePerUnit: 0,
    subtotal: 0,
    grandTotal: 0,
    customerName: "",
    status: "Available",
  });

  // ====================== FETCH LISTS ======================
  const fetchLands = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_PATH}/flat-land/lands`);
      const json = await res.json();
      if (json.success) {
        setDataList((json.data.data || []).filter((item: any) => !item.deletedAt));
      }
    } catch (err) {
      toast.error("Failed to load lands");
    } finally {
      setLoading(false);
    }
  };

  // ====================== FETCH DROPDOWNS ======================
  const fetchDropdowns = async () => {
    try {
      const resProj = await fetch(`${API_PATH}/project`);
      const jsonProj = await resProj.json();
      if (jsonProj.success) setProjects(jsonProj.data.data || jsonProj.data || []);

      const resSite = await fetch(`${API_PATH}/project-sites`);
      const jsonSite = await resSite.json();
      if (jsonSite.success) setSites(jsonSite.data.data || jsonSite.data || []);
    } catch (err) {
      console.error("Error fetching dropdowns:", err);
    }
  };

  useEffect(() => {
    fetchLands();
    fetchDropdowns();
  }, []);

  const filteredSites = formData.projectId 
    ? sites.filter(s => String(s.projectId).toLowerCase() === String(formData.projectId).toLowerCase()) 
    : sites;

  // ====================== SUBMIT (POST / PATCH) ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      projectId: formData.projectId,
      projectName: projects.find(p => p.uuid === formData.projectId)?.name || "",
      propertyType: "land",
      uid: "string",
      flatLandNo: formData.flatLandNo,
      siteBlock: "string",
      siteName: formData.siteName,
      blockName: formData.blockName,
      roadNo: formData.roadNo,
      roadSize: "string",
      plotLocation: formData.plotLocation,
      unit: formData.unit,
      bedroom: 0,
      bathroom: 0,
      size: formData.size,
      pricePerUnit: Number(formData.pricePerUnit),
      parkingCost: 0,
      utilityCharge: 0,
      customerName: formData.customerName,
      facing: "string",
      amenities: "string",
      drawing: "string",
      dining: "string",
      kitchen: "string",
      balcony: "string",
      parking: "string",
      basement: "string",
      subtotal: Number(formData.subtotal),
      grandTotal: Number(formData.grandTotal),
      status: formData.status,
    };

    try {
      const isEdit = !!editingItem;
      const url = isEdit
        ? `${API_PATH}/flat-land/lands/${editingItem!.uuid}`
        : `${API_PATH}/flat-land/lands`;
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
        fetchLands();
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
  const handleDelete = async (item: Land) => {
    if (!window.confirm(`Delete Land "${item.flatLandNo}"?`)) return;
    try {
      const res = await fetch(`${API_PATH}/flat-land/lands/${item.uuid}`, {
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
      projectId: "",
      siteName: "",
      blockName: "",
      roadNo: "",
      plotLocation: "",
      flatLandNo: "",
      unit: "",
      size: "",
      pricePerUnit: 0,
      subtotal: 0,
      grandTotal: 0,
      customerName: "",
      status: "Available",
    });
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Land) => {
    setEditingItem(item);
    setFormData({
      projectId: item.projectId || "",
      siteName: item.siteName || "",
      blockName: item.blockName || "",
      roadNo: item.roadNo || "",
      plotLocation: item.plotLocation || "",
      flatLandNo: item.flatLandNo || "",
      unit: item.unit || "",
      size: item.size || "",
      pricePerUnit: Number(item.pricePerUnit) || 0,
      subtotal: Number(item.subtotal) || 0,
      grandTotal: Number(item.grandTotal) || 0,
      customerName: item.customerName || "",
      status: item.status || "Available",
    });
    setIsModalOpen(true);
  };

  // ====================== FILTERING ======================
  const filteredData = dataList.filter((item) => {
    const matchSearch = item.flatLandNo?.toLowerCase().includes(search.toLowerCase()) ||
                        item.customerName?.toLowerCase().includes(search.toLowerCase());
    const matchProject = filterProject ? item.projectId === filterProject : true;
    const matchSite = filterSite ? item.siteName === filterSite : true;
    const matchStatus = filterStatus ? item.status === filterStatus : true;
    return matchSearch && matchProject && matchSite && matchStatus;
  });

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "sold":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200/60";
      case "available":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200/60";
      case "unsold":
        return "bg-rose-50 text-rose-700 border border-rose-200/60";
      case "booked":
        return "bg-amber-50 text-amber-700 border border-amber-200/60";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200/60";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 p-4 sm:p-6 font-sans text-slate-800">
      <div className="mx-auto max-w-7xl space-y-5">
        
        {/* Top Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Home</span>
              <span>/</span>
              <span>Land</span>
              <span>/</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                Land
              </span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Land Management
            </h1>
          </div>
          <button 
            onClick={handleCreate} 
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-100 transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" /> 
            <span>Land Add</span>
          </button>
        </header>

        {/* Filters Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project</label>
            <select 
              value={filterProject} 
              onChange={e => setFilterProject(e.target.value)} 
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Select value</option>
              {projects.map(p => <option key={p.uuid} value={p.uuid}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Site</label>
            <select 
              value={filterSite} 
              onChange={e => setFilterSite(e.target.value)} 
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Select Site</option>
              {sites.map(s => <option key={s.uuid} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)} 
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Select Status</option>
              <option value="Available">Available</option>
              <option value="Sold">Sold</option>
              <option value="Unsold">Unsold</option>
              <option value="Booked">Booked</option>
            </select>
          </div>
        </div>

        {/* Table Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
              <button 
                type="button" 
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Loading lands...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white font-bold uppercase tracking-wider">
                  <tr>
                    {["SL", "PROJECT", "BLOCK NAME", "ROAD NO.", "SITE", "PLOT NO", "SIZE", "UNIT", "PRICE", "SUBTOTAL", "GRAND TOTAL", "CUSTOMER", "STATUS", "ACTION"].map(h => (
                      <th key={h} className="px-3.5 py-3.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="text-center py-12 text-slate-500 text-xs font-medium">
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item, index) => (
                      <tr key={item.uuid} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="px-3.5 py-3 text-center font-medium text-slate-500">{index + 1}</td>
                        <td className="px-3.5 py-3 font-semibold text-slate-800">{item.project?.name || item.projectName || "N/A"}</td>
                        <td className="px-3.5 py-3 text-slate-600">{item.blockName || "—"}</td>
                        <td className="px-3.5 py-3 text-slate-600">{item.roadNo || "—"}</td>
                        <td className="px-3.5 py-3 text-slate-600">{item.siteName || "N/A"}</td>
                        <td className="px-3.5 py-3 font-semibold text-indigo-600">{item.flatLandNo}</td>
                        <td className="px-3.5 py-3 text-slate-600">{item.size || "—"}</td>
                        <td className="px-3.5 py-3 text-slate-600">{item.unit || "—"}</td>
                        <td className="px-3.5 py-3 text-slate-700 font-medium">{item.pricePerUnit}</td>
                        <td className="px-3.5 py-3 text-slate-700">{item.subtotal}</td>
                        <td className="px-3.5 py-3 font-bold text-slate-900">{item.grandTotal}</td>
                        <td className="px-3.5 py-3 text-indigo-600 font-medium">{item.customerName || "—"}</td>
                        <td className="px-3.5 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button 
                              onClick={() => handleEdit(item)} 
                              className="rounded-lg p-1.5 text-teal-600 hover:bg-teal-50 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(item)} 
                              className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
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
        </div>
      </div>

      {/* ====================== ADD/EDIT MODAL ====================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-4xl my-8 rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editingItem ? "Edit Land" : "Land Add"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Project <span className="text-rose-500">*</span>
                  </label>
                  <select 
                    required 
                    value={formData.projectId} 
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value, siteName: "" })} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => <option key={p.uuid} value={p.uuid}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Site</label>
                  <select 
                    value={formData.siteName} 
                    onChange={(e) => setFormData({ ...formData, siteName: e.target.value })} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">Select Site</option>
                    {filteredSites.map(s => <option key={s.uuid} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Block Name</label>
                  <input 
                    type="text" 
                    value={formData.blockName} 
                    onChange={(e) => setFormData({ ...formData, blockName: e.target.value })} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                    placeholder="Block Name" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Road No</label>
                  <input 
                    type="text" 
                    value={formData.roadNo} 
                    onChange={(e) => setFormData({ ...formData, roadNo: e.target.value })} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                    placeholder="Road No" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plot No <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    required 
                    type="text" 
                    value={formData.flatLandNo} 
                    onChange={(e) => setFormData({ ...formData, flatLandNo: e.target.value })} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                    placeholder="Plot No" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Size</label>
                  <input 
                    type="text" 
                    value={formData.size} 
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                    placeholder="Size" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <input 
                    type="text" 
                    value={formData.unit} 
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                    placeholder="Unit" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price</label>
                  <input 
                    type="number" 
                    value={formData.pricePerUnit} 
                    onChange={(e) => setFormData({ ...formData, pricePerUnit: Number(e.target.value) })} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                    placeholder="Price" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subtotal</label>
                  <input 
                    type="number" 
                    value={formData.subtotal} 
                    onChange={(e) => setFormData({ ...formData, subtotal: Number(e.target.value) })} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                    placeholder="Subtotal" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grand Total</label>
                  <input 
                    type="number" 
                    value={formData.grandTotal} 
                    onChange={(e) => setFormData({ ...formData, grandTotal: Number(e.target.value) })} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                    placeholder="Grand Total" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name</label>
                  <input 
                    type="text" 
                    value={formData.customerName} 
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                    placeholder="Customer Name" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status <span className="text-rose-500">*</span>
                  </label>
                  <select 
                    required 
                    value={formData.status} 
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="Available">Available</option>
                    <option value="Sold">Sold</option>
                    <option value="Unsold">Unsold</option>
                    <option value="Booked">Booked</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-100 transition-all hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} 
                  <span>Submit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
