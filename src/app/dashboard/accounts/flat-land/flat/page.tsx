/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Loader2, Edit3, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PATH = `${API_BASE}/realbizpro/api/v1`;

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
    // Extra fields from screenshot
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
      const res = await fetch(`${API_PATH}/flat-land/flats`);
      const json = await res.json();
      if (json.success) {
        setDataList((json.data.data || []).filter((item: any) => !item.deletedAt));
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
      // Fetch Projects
      const resProj = await fetch(`${API_PATH}/project`);
      const jsonProj = await resProj.json();
      if (jsonProj.success) setProjects(jsonProj.data.data || jsonProj.data || []);

      // Fetch Sites
      const resSite = await fetch(`${API_PATH}/project-sites`);
      const jsonSite = await resSite.json();
      if (jsonSite.success) setSites(jsonSite.data.data || jsonSite.data || []);
    } catch (err) {
      console.error("Error fetching dropdowns:", err);
    }
  };

  useEffect(() => {
    fetchFlats();
    fetchDropdowns();
  }, []);

  // Filter Sites based on selected Project
  const filteredSites = formData.projectId 
    ? sites.filter(s => String(s.projectId).toLowerCase() === String(formData.projectId).toLowerCase()) 
    : sites;

  // ====================== SUBMIT (POST / PUT) ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      projectId: formData.projectId,
      projectName: projects.find(p => p.uuid === formData.projectId)?.name || "",
      propertyType: "flat",
      uid: "string", // You can generate this dynamically if needed
      flatLandNo: formData.flatLandNo,
      siteBlock: formData.siteName || "string",
      siteName: formData.siteName,
      blockName: "string",
      roadNo: "string",
      roadSize: "string",
      plotLocation: "string",
      unit: formData.unit,
      bedroom: Number(formData.bedroom),
      bathroom: Number(formData.bathroom),
      size: formData.size,
      pricePerUnit: Number(formData.pricePerUnit),
      parkingCost: Number(formData.parkingCost),
      utilityCharge: Number(formData.utilityCharge),
      customerName: formData.customerName,
      facing: formData.facing,
      amenities: formData.amenities,
      drawing: formData.drawing,
      dining: formData.dining,
      kitchen: formData.kitchen,
      balcony: formData.balcony,
      parking: formData.parking,
      basement: formData.basement,
      subtotal: Number(formData.pricePerUnit), // Assuming subtotal calculation
      grandTotal: Number(formData.pricePerUnit) + Number(formData.parkingCost) + Number(formData.utilityCharge),
      status: formData.status,
    };

    try {
      const isEdit = !!editingItem;
      const url = isEdit
        ? `${API_PATH}/flat-land/flats/${editingItem!.uuid}`
        : `${API_PATH}/flat-land/flats`;
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

  // Status Color Helper
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "sold": return "bg-indigo-600 text-white";
      case "available": return "bg-green-500 text-white";
      case "unsold": return "bg-red-500 text-white";
      case "booked": return "bg-yellow-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  // ====================== RENDER ======================
  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      
      {/* Top Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">Home &gt; Flat &gt; Flat</div>
        <button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm flex items-center gap-1">
          <Plus className="w-4 h-4" /> Flat Add
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 border rounded shadow-sm mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Project</label>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
            <option value="">Select value</option>
            {projects.map(p => <option key={p.uuid} value={p.uuid}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Site</label>
          <select value={filterSite} onChange={e => setFilterSite(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
            <option value="">Select Site</option>
            {sites.map(s => <option key={s.uuid} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
            <option value="">Select Status</option>
            <option value="Available">Available</option>
            <option value="Sold">Sold</option>
            <option value="Unsold">Unsold</option>
            <option value="Booked">Booked</option>
          </select>
        </div>
      </div>

      {/* Table */}
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
                  {["SL", "PROJECT", "SITE", "FLAT/LAND NO", "UNIT", "BEDROOM", "BATHROOM", "SIZE", "PRICE", "SUBTOTAL", "PARKING COST", "UTILITY CHARGE", "GRAND TOTAL", "CUSTOMER", "STATUS", "ACTION"].map(h => (
                    <th key={h} className="px-3 py-2 font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.length === 0 ? (
                  <tr><td colSpan={16} className="text-center py-8 text-gray-500">No data available in table</td></tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr key={item.uuid} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{index + 1}</td>
                      <td className="px-3 py-2">{item.project?.name || item.projectName || "N/A"}</td>
                      <td className="px-3 py-2">{item.siteName || "N/A"}</td>
                      <td className="px-3 py-2">{item.flatLandNo}</td>
                      <td className="px-3 py-2">{item.unit || "-"}</td>
                      <td className="px-3 py-2">{item.bedroom || "-"}</td>
                      <td className="px-3 py-2">{item.bathroom || "-"}</td>
                      <td className="px-3 py-2">{item.size || "-"}</td>
                      <td className="px-3 py-2">{item.pricePerUnit}</td>
                      <td className="px-3 py-2">{item.subtotal}</td>
                      <td className="px-3 py-2">{item.parkingCost}</td>
                      <td className="px-3 py-2">{item.utilityCharge}</td>
                      <td className="px-3 py-2 font-bold">{item.grandTotal}</td>
                      <td className="px-3 py-2 text-indigo-600">{item.customerName || "-"}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 text-xs rounded ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 flex gap-1">
                        <button onClick={() => handleEdit(item)} className="bg-teal-400 text-white p-1.5 rounded hover:bg-teal-500"><Edit3 className="w-3.5 h-3.5" /></button>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-4xl my-8">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold">{editingItem ? "Edit Flat" : "Flat"}</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Project <span className="text-red-500">*</span></label>
                  <select required value={formData.projectId} onChange={(e) => setFormData({ ...formData, projectId: e.target.value, siteName: "" })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="">Select One Option</option>
                    {projects.map(p => <option key={p.uuid} value={p.uuid}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Site</label>
                  <select value={formData.siteName} onChange={(e) => setFormData({ ...formData, siteName: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="">Select Site</option>
                    {filteredSites.map(s => <option key={s.uuid} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Flat No <span className="text-red-500">*</span></label>
                  <input required type="text" value={formData.flatLandNo} onChange={(e) => setFormData({ ...formData, flatLandNo: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" placeholder="Flat No" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Size <span className="text-red-500">*</span></label>
                  <input required type="text" value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" placeholder="Size" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Price</label>
                  <input type="number" value={formData.pricePerUnit} onChange={(e) => setFormData({ ...formData, pricePerUnit: Number(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm" placeholder="Price" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Bedroom</label>
                  <input type="number" value={formData.bedroom} onChange={(e) => setFormData({ ...formData, bedroom: Number(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm" placeholder="Bedroom" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Bathroom</label>
                  <input type="number" value={formData.bathroom} onChange={(e) => setFormData({ ...formData, bathroom: Number(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm" placeholder="Bathroom" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Unit</label>
                  <input type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" placeholder="Unit" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Parking Cost</label>
                  <input type="number" value={formData.parkingCost} onChange={(e) => setFormData({ ...formData, parkingCost: Number(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm" placeholder="Parking Cost" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Utility Charge</label>
                  <input type="number" value={formData.utilityCharge} onChange={(e) => setFormData({ ...formData, utilityCharge: Number(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm" placeholder="Utility Charge" />
                </div>
                
                {/* Extra fields (Drawing, Dining, etc.) */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Drawing</label>
                  <input type="text" value={formData.drawing} onChange={(e) => setFormData({ ...formData, drawing: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Dining</label>
                  <input type="text" value={formData.dining} onChange={(e) => setFormData({ ...formData, dining: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Kitchen</label>
                  <input type="text" value={formData.kitchen} onChange={(e) => setFormData({ ...formData, kitchen: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Balcony</label>
                  <input type="text" value={formData.balcony} onChange={(e) => setFormData({ ...formData, balcony: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Facing</label>
                  <input type="text" value={formData.facing} onChange={(e) => setFormData({ ...formData, facing: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Amenities</label>
                  <textarea value={formData.amenities} onChange={(e) => setFormData({ ...formData, amenities: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" rows={2}></textarea>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Status <span className="text-red-500">*</span></label>
                  <select required value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="Available">Available</option>
                    <option value="Sold">Sold</option>
                    <option value="Unsold">Unsold</option>
                    <option value="Booked">Booked</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
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

    </div>
  );
}