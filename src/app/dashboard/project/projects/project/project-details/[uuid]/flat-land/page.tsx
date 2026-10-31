/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, X, Plus, Search, Edit3 } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

// ====================== TYPES ======================
export interface FlatLand {
  id: string;
  uuid: string;
  projectId: string;
  projectName: string;
  propertyType: string;
  uid: string;
  flatLandNo: string;
  siteBlock: string;
  siteName: string;
  blockName: string;
  roadNo: string;
  roadSize: string;
  plotLocation: string;
  unit: string;
  bedroom: number;
  bathroom: number;
  size: string;
  pricePerUnit: number;
  parkingCost: number;
  utilityCharge: number;
  customerName: string;
  facing: string;
  amenities: string;
  drawing: string;
  dining: string;
  kitchen: string;
  balcony: string;
  parking: string;
  basement: string;
  subtotal: number;
  grandTotal: number;
  status: string;
}

interface ProjectSite {
  uuid: string;
  name: string;
  location?: string;
}

export default function FlatLandPage() {
  const { uuid } = useParams();
  const [dataList, setDataList] = useState<FlatLand[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [sites, setSites] = useState<ProjectSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FlatLand | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  // ====================== FETCH DATA ======================
  const fetchFlatLands = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/realbizpro/api/v1/flat-land?page=1&limit=100`);
      const json = await res.json();
      if (json.success) {
        // ✅ deletedAt ফিল্টার
        setDataList((json.data.data || []).filter((item: any) => !item.deletedAt));
      }
    } catch (err) {
      toast.error("Failed to load flat/land data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const res = await fetch(`${API_BASE}/realbizpro/api/v1/project-sites`);
      const json = await res.json();
      if (json.success) setSites(json.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/realbizpro/api/v1/project`);
      const json = await res.json();
      if (json.success) setProjects(json.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFlatLands();
    fetchSites();
    fetchProjects();
  }, []);

  // ====================== SUBMIT (POST / PUT) ======================
  const handleSubmit = async (formData: any) => {
    setSubmitting(true);
    try {
      const isUpdate = !!editingItem;
      const url = isUpdate
        ? `${API_BASE}/realbizpro/api/v1/flat-land/${editingItem!.uuid}`
        : `${API_BASE}/realbizpro/api/v1/flat-land`;
      const method = isUpdate ? "PUT" : "POST";

      const payload = {
        projectId: uuid,
        projectName: projects.find(p => p.uuid === uuid)?.name || "Unknown Project",
        propertyType: "flat", // বা land
        ...formData,
        bedroom: Number(formData.bedroom) || 0,
        bathroom: Number(formData.bathroom) || 0,
        pricePerUnit: Number(formData.pricePerUnit) || 0,
        parkingCost: Number(formData.parkingCost) || 0,
        utilityCharge: Number(formData.utilityCharge) || 0,
        subtotal: (Number(formData.size) || 0) * (Number(formData.pricePerUnit) || 0),
        grandTotal: (Number(formData.size) || 0) * (Number(formData.pricePerUnit) || 0) + (Number(formData.parkingCost) || 0) + (Number(formData.utilityCharge) || 0),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok || json.success) {
        toast.success(isUpdate ? "Updated successfully!" : "Created successfully!");
        setIsModalOpen(false);
        setEditingItem(null);
        fetchFlatLands();
      } else {
        toast.error(json.message || "Failed to save");
      }
    } catch (err: any) {
      toast.error(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  // ====================== DELETE ======================
  const handleDelete = async (item: FlatLand) => {
    if (!window.confirm(`Delete "${item.flatLandNo}"?`)) return;
    try {
      await fetch(`${API_BASE}/realbizpro/api/v1/flat-land/${item.uuid}`, {
        method: "DELETE",
      });
      setDataList((prev) => prev.filter((row) => row.uuid !== item.uuid));
      toast.success("Deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const filteredData = dataList.filter((item) =>
    item.flatLandNo?.toLowerCase().includes(search.toLowerCase()) ||
    item.customerName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center p-3 border-b gap-4">
        <div className="flex gap-2 items-center text-sm">
          <span>Show</span>
          <select className="border rounded px-2 py-1"><option>10</option><option>50</option></select>
          <span>entries</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border rounded px-2 py-1 bg-white">
            <span className="text-sm text-gray-500">Search:</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none text-sm w-32"
            />
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <button
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Flat/Land Add
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-indigo-500 text-white">
              <tr>
                {["SL", "PROJECT", "SITE", "FLAT/LAND NO", "UNIT", "BEDROOM", "BATHROOM", "SIZE", "PRICE", "SUBTOTAL", "PARKING COST", "UTILITY CHARGE", "GRAND TOTAL", "CUSTOMER", "STATUS", "ACTION"].map(h => (
                  <th key={h} className="px-3 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={16} className="text-center py-8 text-gray-500">No data available in table</td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={item.uuid} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{idx + 1}</td>
                    <td className="px-3 py-2">{item.projectName}</td>
                    <td className="px-3 py-2">{item.siteName || "-"}</td>
                    <td className="px-3 py-2 text-indigo-600 font-medium">{item.flatLandNo}</td>
                    <td className="px-3 py-2">{item.unit || "-"}</td>
                    <td className="px-3 py-2">{item.bedroom}</td>
                    <td className="px-3 py-2">{item.bathroom}</td>
                    <td className="px-3 py-2">{item.size}</td>
                    <td className="px-3 py-2">{item.pricePerUnit}</td>
                    <td className="px-3 py-2">{item.subtotal?.toLocaleString()}</td>
                    <td className="px-3 py-2">{item.parkingCost?.toLocaleString()}</td>
                    <td className="px-3 py-2">{item.utilityCharge?.toLocaleString()}</td>
                    <td className="px-3 py-2">{item.grandTotal?.toLocaleString()}</td>
                    <td className="px-3 py-2">{item.customerName || "-"}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${item.status === 'Booked' ? 'bg-indigo-500 text-white' : item.status === 'Sold' ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 flex gap-1">
                      <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="bg-teal-500 text-white p-1.5 rounded hover:bg-teal-600"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(item)} className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600"><X className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <FlatLandAddModal 
          initialData={editingItem} 
          sites={sites} 
          submitting={submitting} 
          onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

// ====================== MODAL COMPONENT ======================
function FlatLandAddModal({ initialData, sites, submitting, onClose, onSubmit }: any) {
  const [formData, setFormData] = useState({
    flatLandNo: initialData?.flatLandNo || "",
    siteName: initialData?.siteName || "",
    size: initialData?.size || "",
    bedroom: initialData?.bedroom || 0,
    bathroom: initialData?.bathroom || 0,
    unit: initialData?.unit || "",
    drawing: initialData?.drawing || "",
    dining: initialData?.dining || "",
    kitchen: initialData?.kitchen || "",
    balcony: initialData?.balcony || "",
    parking: initialData?.parking || "",
    parkingCost: initialData?.parkingCost || 0,
    utilityCharge: initialData?.utilityCharge || 0,
    basement: initialData?.basement || "",
    facing: initialData?.facing || "",
    customerName: initialData?.customerName || "",
    status: initialData?.status || "Available",
    propertyType: initialData?.propertyType || "flat",
    pricePerUnit: initialData?.pricePerUnit || 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-800">Flat/Land</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Site</label>
              <select name="siteName" value={formData.siteName} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm">
                <option value="">Select Site</option>
                {sites.map((s: any) => <option key={s.uuid} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Flat Land No</label>
              <input name="flatLandNo" value={formData.flatLandNo} onChange={handleChange} placeholder="Flat Land No" className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Size</label>
              <input name="size" value={formData.size} onChange={handleChange} placeholder="Size" className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Bedroom</label>
              <input name="bedroom" type="number" value={formData.bedroom} onChange={handleChange} placeholder="Bedroom" className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Bathroom</label>
              <input name="bathroom" type="number" value={formData.bathroom} onChange={handleChange} placeholder="Bathroom" className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Unit</label>
              <input name="unit" value={formData.unit} onChange={handleChange} placeholder="Unit" className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Drawing</label>
              <input name="drawing" value={formData.drawing} onChange={handleChange} placeholder="Drawing" className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Dining</label>
              <input name="dining" value={formData.dining} onChange={handleChange} placeholder="Dining" className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Kitchen</label>
              <input name="kitchen" value={formData.kitchen} onChange={handleChange} placeholder="Kitchen" className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Belcony</label>
              <input name="balcony" value={formData.balcony} onChange={handleChange} placeholder="Belcony" className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Parking</label>
              <input name="parking" value={formData.parking} onChange={handleChange} placeholder="Parking" className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Parking Cost</label>
              <input name="parkingCost" type="number" value={formData.parkingCost} onChange={handleChange} placeholder="Parking Cost" className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Utility Charge</label>
              <input name="utilityCharge" type="number" value={formData.utilityCharge} onChange={handleChange} placeholder="Utility Charge" className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Basement</label>
              <input name="basement" value={formData.basement} onChange={handleChange} placeholder="Basement" className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Facing</label>
              <input name="facing" value={formData.facing} onChange={handleChange} placeholder="Facing" className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Note</label>
              <textarea name="customerName" value={formData.customerName} onChange={handleChange} rows={2} className="w-full border rounded px-3 py-2 text-sm" placeholder="Customer Name / Note"></textarea>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Status *</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm">
                <option value="Select Sale Status">Select Sale Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Available">Available</option>
                <option value="Booked">Booked</option>
                <option value="Sold">Sold</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className="bg-gray-400 text-white px-4 py-2 rounded text-sm">Close</button>
            <button type="submit" disabled={submitting} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}