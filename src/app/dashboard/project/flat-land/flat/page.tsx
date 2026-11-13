/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Loader2, Edit3, Trash2, Search, FileSpreadsheet, FileText, Building2 } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PATH = `${API_BASE}/realbizpro/api/v1`;

function getStoredAccessToken(): string {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("share-project:access-token") ||
    ""
  );
}

function getAuthHeaders(extraHeaders: Record<string, string> = {}) {
  const token = getStoredAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

// ====================== TYPES ======================
interface Flat {
  id: string;
  uuid: string;
  projectId: string;
  projectName: string;
  propertyType: string;
  siteName: string;
  flatLandNo: string;
  unit: string;
  bedroom: number;
  bathroom: number;
  size: string;
  pricePerUnit: string;
  parkingCost: string;
  utilityCharge: string;
  customerName: string;
  status: string;
  subtotal: string;
  grandTotal: string;
  project?: { name: string; uuid: string };
  deletedAt?: string;
}

export default function FlatPage() {
  const [dataList, setDataList] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Flat | null>(null);
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
    flatLandNo: "",
    unit: "",
    bedroom: 0,
    bathroom: 0,
    size: "",
    pricePerUnit: 0,
    parkingCost: 0,
    utilityCharge: 0,
    customerName: "",
    status: "Available",
    drawing: "",
    dining: "",
    kitchen: "",
    balcony: "",
    parking: "",
    basement: "",
    facing: "",
    amenities: "",
  });

  // ====================== FETCH LISTS ======================
  const fetchFlats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_PATH}/flat-land/flats?limit=100`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setDataList((json.data?.data || json.data || []).filter((item: any) => !item.deletedAt));
      }
    } catch (err) {
      toast.error("Failed to load flats");
    } finally {
      setLoading(false);
    }
  };

  // ====================== FETCH DROPDOWNS ======================
  const fetchDropdowns = async () => {
    try {
      const resProj = await fetch(`${API_PATH}/project?limit=100`, {
        headers: getAuthHeaders(),
      });
      const jsonProj = await resProj.json();
      if (jsonProj.success) setProjects(jsonProj.data?.data || jsonProj.data || []);

      const resSite = await fetch(`${API_PATH}/project-sites?limit=100`, {
        headers: getAuthHeaders(),
      });
      const jsonSite = await resSite.json();
      if (jsonSite.success) setSites(jsonSite.data?.data || jsonSite.data || []);
    } catch (err) {
      console.error("Error fetching dropdowns:", err);
    }
  };

  useEffect(() => {
    fetchFlats();
    fetchDropdowns();
  }, []);

  const filteredSites = formData.projectId && sites.some(s => String(s.projectId || s.projectUuid).toLowerCase() === String(formData.projectId).toLowerCase()) 
    ? sites.filter(s => String(s.projectId || s.projectUuid).toLowerCase() === String(formData.projectId).toLowerCase()) 
    : sites;

  // ====================== SUBMIT ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const proj = projects.find(p => p.uuid === formData.projectId);
    const payload = {
      projectId: formData.projectId || undefined,
      projectName: proj?.name || proj?.projectName || "Project",
      propertyType: "flat",
      flatLandNo: formData.flatLandNo,
      siteName: formData.siteName || undefined,
      unit: formData.unit || undefined,
      bedroom: Number(formData.bedroom) || 0,
      bathroom: Number(formData.bathroom) || 0,
      size: formData.size || undefined,
      pricePerUnit: Number(formData.pricePerUnit) || 0,
      parkingCost: Number(formData.parkingCost) || 0,
      utilityCharge: Number(formData.utilityCharge) || 0,
      customerName: formData.customerName || undefined,
      facing: formData.facing || undefined,
      amenities: formData.amenities || undefined,
      drawing: formData.drawing || undefined,
      dining: formData.dining || undefined,
      kitchen: formData.kitchen || undefined,
      balcony: formData.balcony || undefined,
      parking: formData.parking || undefined,
      basement: formData.basement || undefined,
      subtotal: Number(formData.pricePerUnit) || 0,
      grandTotal: (Number(formData.pricePerUnit) || 0) + (Number(formData.parkingCost) || 0) + (Number(formData.utilityCharge) || 0),
      status: formData.status || "Available",
    };

    try {
      const isEdit = !!editingItem;
      const url = isEdit
        ? `${API_PATH}/flat-land/flats/${editingItem!.uuid}`
        : `${API_PATH}/flat-land/flats`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      console.log("Flat save response:", res.status, json, "Payload:", payload);
      if (res.ok || json.success) {
        toast.success(isEdit ? "Updated successfully!" : "Created successfully!");
        setIsModalOpen(false);
        setEditingItem(null);
        fetchFlats();
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
  const handleDelete = async (item: Flat) => {
    if (!window.confirm(`Delete Flat "${item.flatLandNo}"?`)) return;
    try {
      const res = await fetch(`${API_PATH}/flat-land/flats/${item.uuid}`, {
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
      projectId: "",
      siteName: "",
      flatLandNo: "",
      unit: "",
      bedroom: 0,
      bathroom: 0,
      size: "",
      pricePerUnit: 0,
      parkingCost: 0,
      utilityCharge: 0,
      customerName: "",
      status: "Available",
      drawing: "",
      dining: "",
      kitchen: "",
      balcony: "",
      parking: "",
      basement: "",
      facing: "",
      amenities: "",
    });
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Flat) => {
    setEditingItem(item);
    setFormData({
      projectId: item.projectId || "",
      siteName: item.siteName || "",
      flatLandNo: item.flatLandNo || "",
      unit: item.unit || "",
      bedroom: item.bedroom || 0,
      bathroom: item.bathroom || 0,
      size: item.size || "",
      pricePerUnit: Number(item.pricePerUnit) || 0,
      parkingCost: Number(item.parkingCost) || 0,
      utilityCharge: Number(item.utilityCharge) || 0,
      customerName: item.customerName || "",
      status: item.status || "Available",
      drawing: "",
      dining: "",
      kitchen: "",
      balcony: "",
      parking: "",
      basement: "",
      facing: "",
      amenities: "",
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
              <span>Flat</span>
              <span>/</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                Flat
              </span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Flat Management
            </h1>
          </div>
          <button 
            onClick={handleCreate} 
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-100 transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" /> 
            <span>Flat Add</span>
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
              <span className="text-xs font-medium">Loading flats...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white font-bold uppercase tracking-wider">
                  <tr>
                    {["SL", "PROJECT", "SITE", "FLAT/LAND NO", "UNIT", "BEDROOM", "BATHROOM", "SIZE", "PRICE", "SUBTOTAL", "PARKING COST", "UTILITY CHARGE", "GRAND TOTAL", "CUSTOMER", "STATUS", "ACTION"].map(h => (
                      <th key={h} className="px-3.5 py-3.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="text-center py-12 text-slate-500 text-xs font-medium">
                        No data available in table
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item, index) => (
                      <tr key={item.uuid} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="px-3.5 py-3 text-center font-medium text-slate-500">{index + 1}</td>
                        <td className="px-3.5 py-3 font-semibold text-slate-800">{item.project?.name || item.projectName || "N/A"}</td>
                        <td className="px-3.5 py-3 text-slate-600">{item.siteName || "N/A"}</td>
                        <td className="px-3.5 py-3 font-semibold text-indigo-600">{item.flatLandNo}</td>
                        <td className="px-3.5 py-3 text-slate-600">{item.unit || "—"}</td>
                        <td className="px-3.5 py-3 text-slate-600 text-center">{item.bedroom || "—"}</td>
                        <td className="px-3.5 py-3 text-slate-600 text-center">{item.bathroom || "—"}</td>
                        <td className="px-3.5 py-3 text-slate-600">{item.size || "—"}</td>
                        <td className="px-3.5 py-3 text-slate-700 font-medium">{item.pricePerUnit}</td>
                        <td className="px-3.5 py-3 text-slate-700">{item.subtotal}</td>
                        <td className="px-3.5 py-3 text-slate-700">{item.parkingCost}</td>
                        <td className="px-3.5 py-3 text-slate-700">{item.utilityCharge}</td>
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
                {editingItem ? "Edit Flat" : "Flat Add"}
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
                    <option value="">Select One Option</option>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Flat No <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    required 
                    type="text" 
                    value={formData.flatLandNo} 
                    onChange={(e) => setFormData({ ...formData, flatLandNo: e.target.value })} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                    placeholder="Flat No" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Size <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    required 
                    type="text" 
                    value={formData.size} 
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                    placeholder="Size" 
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bedroom</label>
                  <input 
                    type="number" 
                    value={formData.bedroom} 
                    onChange={(e) => setFormData({ ...formData, bedroom: Number(e.target.value) })} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                    placeholder="Bedroom" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bathroom</label>
                  <input 
                    type="number" 
                    value={formData.bathroom} 
                    onChange={(e) => setFormData({ ...formData, bathroom: Number(e.target.value) })} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                    placeholder="Bathroom" 
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parking Cost</label>
                  <input 
                    type="number" 
                    value={formData.parkingCost} 
                    onChange={(e) => setFormData({ ...formData, parkingCost: Number(e.target.value) })} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                    placeholder="Parking Cost" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Utility Charge</label>
                  <input 
                    type="number" 
                    value={formData.utilityCharge} 
                    onChange={(e) => setFormData({ ...formData, utilityCharge: Number(e.target.value) })} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                    placeholder="Utility Charge" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Drawing</label>
                  <input 
                    type="text" 
                    value={formData.drawing} 
                    onChange={(e) => setFormData({ ...formData, drawing: e.target.value })} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dining</label>
                  <input 
                    type="text" 
                    value={formData.dining} 
                    onChange={(e) => setFormData({ ...formData, dining: e.target.value })} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kitchen</label>
                  <input 
                    type="text" 
                    value={formData.kitchen} 
                    onChange={(e) => setFormData({ ...formData, kitchen: e.target.value })} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Balcony</label>
                  <input 
                    type="text" 
                    value={formData.balcony} 
                    onChange={(e) => setFormData({ ...formData, balcony: e.target.value })} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Facing</label>
                  <input 
                    type="text" 
                    value={formData.facing} 
                    onChange={(e) => setFormData({ ...formData, facing: e.target.value })} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
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
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amenities</label>
                  <textarea 
                    value={formData.amenities} 
                    onChange={(e) => setFormData({ ...formData, amenities: e.target.value })} 
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                    rows={2} 
                  />
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
