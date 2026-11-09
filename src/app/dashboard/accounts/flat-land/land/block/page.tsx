/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Loader2, Edit3, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PATH = `${API_BASE}/realbizpro/api/v1`;

// ====================== TYPES ======================
interface ProjectBlock {
  id: string;
  uuid: string;
  projectId: string;
  kind: string;
  name: string;
  size: string;
  details: string;
  project?: { name: string; uuid: string };
  deletedAt?: string;
}

export default function PropertyBlockPage() {
  const [dataList, setDataList] = useState<ProjectBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectBlock | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [entriesLimit, setEntriesLimit] = useState(10);

  // Dropdown Data
  const [projects, setProjects] = useState<any[]>([]);

  // Form Data
  const [formData, setFormData] = useState({
    projectId: "",
    name: "",
    size: "",
    details: "",
  });

  // ====================== FETCH LISTS ======================
  const fetchBlocks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_PATH}/land-infrastructure/blocks`);
      const json = await res.json();
      if (json.success) {
        setDataList((json.data.data || []).filter((item: any) => !item.deletedAt));
      }
    } catch (err) {
      toast.error("Failed to load blocks");
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
    } catch (err) {
      console.error("Error fetching dropdowns:", err);
    }
  };

  useEffect(() => {
    fetchBlocks();
    fetchDropdowns();
  }, []);

  // ====================== SUBMIT (POST / PATCH) ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      projectId: formData.projectId,
      kind: "block", // ✅ kind is block now
      name: formData.name,
      size: formData.size || null,
      details: formData.details || null,
    };

    try {
      const isEdit = !!editingItem;
      const url = isEdit
        ? `${API_PATH}/land-infrastructure/blocks/${editingItem!.uuid}`
        : `${API_PATH}/land-infrastructure/blocks`;
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
        fetchBlocks();
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
  const handleDelete = async (item: ProjectBlock) => {
    if (!window.confirm(`Delete Block "${item.name}"?`)) return;
    try {
      const res = await fetch(`${API_PATH}/land-infrastructure/blocks/${item.uuid}`, {
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
      name: "",
      size: "",
      details: "",
    });
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: ProjectBlock) => {
    setEditingItem(item);
    setFormData({
      projectId: item.projectId || "",
      name: item.name || "",
      size: item.size || "",
      details: item.details || "",
    });
    setIsModalOpen(true);
  };

  // ====================== FILTERING ======================
  const filteredData = dataList.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.project?.name?.toLowerCase().includes(search.toLowerCase())
  );

  // ====================== RENDER ======================
  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      
      {/* Top Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">Home &gt; Flat/Land &gt; Property Block List</div>
        <button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm flex items-center gap-1">
          <Plus className="w-4 h-4" /> Block Add
        </button>
      </div>

      {/* List Table */}
      <div className="bg-white p-4 border rounded shadow-sm">
        <div className="flex justify-between items-center mb-4">
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
                  {["SL", "PROJECT NAME", "BLOCK NAME", "ACTION"].map(h => (
                    <th key={h} className="px-3 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-500">No data available in table</td></tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr key={item.uuid} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{index + 1}</td>
                      <td className="px-3 py-2">{item.project?.name || "N/A"}</td>
                      <td className="px-3 py-2">{item.name}</td>
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

        {/* Footer Pagination Info */}
        <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
          <div>
            Showing 1 to {filteredData.length} of {filteredData.length} entries
          </div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border rounded bg-gray-100 text-gray-400 cursor-not-allowed">Previous</button>
            <button className="px-3 py-1 border rounded bg-indigo-600 text-white">1</button>
            <button className="px-3 py-1 border rounded bg-gray-100 text-gray-400 cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>

      {/* ====================== ADD/EDIT MODAL ====================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-xl">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold">{editingItem ? "Edit Property Block" : "Property Block Add"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              
              <div>
                <label className="block text-sm text-gray-700 mb-1">Project Name <span className="text-red-500">*</span></label>
                <select required value={formData.projectId} onChange={(e) => setFormData({ ...formData, projectId: e.target.value })} className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p.uuid} value={p.uuid}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Block Name <span className="text-red-500">*</span></label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter Block Name (e.g., A, B, C)" className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
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