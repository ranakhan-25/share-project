/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Loader2, Edit3, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { crmFetch } from "../../crm-fetch";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PATH = `${API_BASE}/realbizpro/api/v1`;

// ====================== TYPES ======================
interface CommunicationStatus {
  id: string;
  uuid: string;
  name: string;
  status: string;
  description: string;
  isDefault: boolean;
  leadStageId?: string;
  leadStage?: { name: string };
  addedBy?: { name: string } | string;
  deletedAt?: string;
}

export default function CommunicationStatusPage() {
  const [dataList, setDataList] = useState<CommunicationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CommunicationStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [entriesLimit, setEntriesLimit] = useState(10);

  // ড্রপডাউন ডাটা
  const [leadStages, setLeadStages] = useState<any[]>([]);

  // ফর্ম ডাটা
  const [formData, setFormData] = useState({
    name: "",
    status: "ACTIVE",
    description: "",
    isDefault: false,
    leadStageId: "",
  });

  // ====================== FETCH LISTS ======================
  const fetchData = async () => {
    try {
      setLoading(true);
      // আপনার স্ক্রিনশটের API পাথ অনুযায়ী
      const res = await crmFetch(`${API_PATH}/crm/configuration/communication-status?page=1&limit=${entriesLimit}&skip=0&search=${search}`);
      const json = await res.json();
      if (json.success) {
        setDataList((json.data.data || []).filter((item: any) => !item.deletedAt));
      }
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // ====================== FETCH DROPDOWNS ======================
  const fetchDropdowns = async () => {
    try {
      // লিড স্টেজ ড্রপডাউন API
      const resStage = await crmFetch(`${API_PATH}/crm/configuration/communication-status/lead-stage-dropdown`);
      const jsonStage = await resStage.json();
      if (jsonStage.success) setLeadStages(jsonStage.data || []);
    } catch (err) {
      console.error("Error fetching dropdowns:", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchDropdowns();
  }, [entriesLimit, search]);

  // ====================== SUBMIT (POST / PATCH) ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: formData.name,
      status: formData.status,
      description: formData.description,
      isDefault: formData.isDefault,
      leadStageId: formData.leadStageId || null,
      addedById: "string", // ডেমো আইডি, আপনার লগইন সিস্টেম অনুযায়ী পরিবর্তন করুন
    };

    try {
      const isEdit = !!editingItem;
      const url = isEdit
        ? `${API_PATH}/crm/configuration/communication-status/${editingItem!.uuid}`
        : `${API_PATH}/crm/configuration/communication-status`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await crmFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok || json.success) {
        toast.success(isEdit ? "Updated successfully!" : "Created successfully!");
        setIsModalOpen(false);
        setEditingItem(null);
        fetchData();
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
  const handleDelete = async (item: CommunicationStatus) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try {
      const res = await crmFetch(`${API_PATH}/crm/configuration/communication-status/${item.uuid}`, {
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
      name: "",
      status: "ACTIVE",
      description: "",
      isDefault: false,
      leadStageId: "",
    });
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: CommunicationStatus) => {
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      status: item.status || "ACTIVE",
      description: item.description || "",
      isDefault: item.isDefault || false,
      leadStageId: item.leadStageId || "",
    });
    setIsModalOpen(true);
  };

  // ====================== RENDER ======================
  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      
      {/* Top Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">Home &gt; Leads Management &gt; Communication Status</div>
        <button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm flex items-center gap-1">
          <Plus className="w-4 h-4" /> Communication Status Add
        </button>
      </div>

      {/* List Table */}
      <div className="bg-white p-4 border rounded shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span>Show</span>
            <select value={entriesLimit} onChange={(e) => setEntriesLimit(Number(e.target.value))} className="border rounded px-2 py-1">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
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
                  {["SL", "NAME", "DESCRIPTION", "LEAD STAGE", "IS DEFAULT", "ADD BY", "ACTION"].map(h => (
                    <th key={h} className="px-3 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dataList.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-500">No data available in table</td></tr>
                ) : (
                  dataList.map((item, index) => (
                    <tr key={item.uuid} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{index + 1}</td>
                      <td className="px-3 py-2 font-medium">{item.name}</td>
                      <td className="px-3 py-2">{item.description || "-"}</td>
                      <td className="px-3 py-2">{item.leadStage?.name || "-"}</td>
                      <td className="px-3 py-2">{item.isDefault ? "Default Status" : "-"}</td>
                      <td className="px-3 py-2">
                        {typeof item.addedBy === 'string' ? item.addedBy : (item.addedBy?.name || "Admin")}
                      </td>
                      <td className="px-3 py-2 flex gap-1">
                        <button onClick={() => handleEdit(item)} className="bg-teal-400 text-white p-1.5 rounded hover:bg-teal-500"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(item)} className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600"><Trash2 className="w-4 h-4" /></button>
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
          <div className="bg-white rounded-lg w-full max-w-xl max-h-[95vh] overflow-y-auto shadow-xl">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold">{editingItem ? "Communication Status Update" : "Communication Status Add"}</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              
              <div>
                <label className="block text-sm text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Name" className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" required />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="">Select One Option</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Description" rows={3} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"></textarea>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="isDefault" checked={formData.isDefault} onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                <label htmlFor="isDefault" className="text-sm text-gray-700">Is Default Communication Status</label>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Lead Stage (If Communication Status wise changes)</label>
                <select value={formData.leadStageId} onChange={(e) => setFormData({ ...formData, leadStageId: e.target.value })} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="">Select Stage</option>
                  {leadStages.map((stage: any) => (
                    <option key={stage.uuid || stage.id} value={stage.uuid || stage.id}>{stage.name}</option>
                  ))}
                </select>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-400 text-white px-6 py-2 rounded text-sm hover:bg-gray-500">Close</button>
                <button type="submit" disabled={submitting} className="bg-indigo-600 text-white px-6 py-2 rounded text-sm flex items-center gap-2 hover:bg-indigo-700">
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