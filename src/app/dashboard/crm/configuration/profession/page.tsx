/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Search, ChevronLeft, ChevronRight, Plus, Edit, Trash2, X, AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { crmFetch } from "../../crm-fetch";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PATH = `${API_BASE}/realbizpro/api/v1`;

// ====================== TYPES ======================
interface ProfessionRecord {
  uuid: string;
  id?: string;
  name: string;
  status: string;
  description: string;
  deletedAt?: string | null;
  addedBy?: any;
}

export default function ProfessionPage() {
  const [professions, setProfessions] = useState<ProfessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [showDeleted, setShowDeleted] = useState(false);

  // Dropdowns
  const [statuses, setStatuses] = useState<any[]>([]);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProfessionRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    status: "active",
    description: "",
  });

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProfessionToDelete, setSelectedProfessionToDelete] = useState<ProfessionRecord | null>(null);

  // ====================== FETCH DATA ======================
  const fetchProfessions = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const url = `${API_PATH}/crm/configuration/professions?page=${page}&limit=${entriesPerPage}&search=${search}&withDeleted=${showDeleted}`;
      
      const res = await crmFetch(url);
      const json = await res.json();
      
      if (json.success) {
        // ✅ ফ্রন্টএন্ডেও ফিল্টার করা হচ্ছে যাতে deleted ডাটা না আসে
        const activeData = (json.data.data || []).filter((item: any) => !item.deletedAt);
        
        setProfessions(activeData);
        setTotalPages(json.data.meta?.totalPages || 1);
        setTotalEntries(activeData.length || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load professions");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const resStatus = await crmFetch(`${API_PATH}/crm/configuration/professions/dropdown/statuses`);
      const jsonStatus = await resStatus.json();
      if (jsonStatus.success) setStatuses(jsonStatus.data.data || jsonStatus.data || []);
    } catch (err) {
      console.error("Failed to load statuses", err);
    }
  };

  useEffect(() => {
    fetchProfessions(currentPage, searchQuery);
  }, [currentPage, entriesPerPage, showDeleted]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
    fetchProfessions(1, e.target.value);
  };

  // ====================== ADD HANDLER ======================
  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setFormData({ name: "", status: "active", description: "" });
    setIsModalOpen(true);
  };

  // ====================== EDIT HANDLER ======================
  const handleOpenEditModal = (item: ProfessionRecord) => {
    setEditingRecord(item);
    setFormData({
      name: item.name || "",
      status: item.status || "active",
      description: item.description || "",
    });
    setIsModalOpen(true);
  };

  // ====================== SUBMIT HANDLER ======================
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Please enter Profession Name!");
      return;
    }

    setSubmitting(true);
    const payload = {
      name: formData.name,
      status: formData.status,
      description: formData.description,
      createdBy: "Admin",
    };

    try {
      const isEdit = !!editingRecord;
      const recordId = editingRecord?.uuid || editingRecord?.id;
      
      const url = isEdit
        ? `${API_PATH}/crm/configuration/professions/${recordId}`
        : `${API_PATH}/crm/configuration/professions`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await crmFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok || json.success) {
        toast.success(isEdit ? "Updated Successfully!" : "Created Successfully!");
        setIsModalOpen(false);
        setEditingRecord(null);
        fetchProfessions(currentPage, searchQuery);
      } else {
        toast.error(json.message || "Something went wrong");
      }
    } catch (err) {
      toast.error("Network Error");
    } finally {
      setSubmitting(false);
    }
  };

  // ====================== DELETE HANDLER ======================
  const handleOpenDeleteModal = (item: ProfessionRecord) => {
    setSelectedProfessionToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProfessionToDelete) return;
    
    const recordId = selectedProfessionToDelete.uuid || selectedProfessionToDelete.id;
    
    if (!recordId) {
      toast.error("Invalid record ID!");
      return;
    }

    // ✅ Optimistic UI: ক্লিক করার সাথে সাথেই টেবিল থেকে ডাটা সরিয়ে দাও
    const previousData = [...professions];
    setProfessions(prev => prev.filter(item => (item.uuid || item.id) !== recordId));
    setIsDeleteModalOpen(false);
    setSelectedProfessionToDelete(null);

    try {
      const res = await crmFetch(`${API_PATH}/crm/configuration/professions/${recordId}`, {
        method: "DELETE",
      });
      
      const json = await res.json().catch(() => ({}));
      
      if (res.ok || json.success) {
        toast.success("Deleted successfully!");
        // ✅ সফল হলে ডাটা রিফ্রেশ করো
        fetchProfessions(currentPage, searchQuery);
      } else {
        toast.error(json.message || "Failed to delete");
        // ❌ ফেইল করলে ডাটা ফিরিয়ে আনো
        setProfessions(previousData);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting profession");
      setProfessions(previousData); // Rollback
    }
  };

  // ====================== RESTORE HANDLER ======================
  const handleRestore = async (item: ProfessionRecord) => {
    if (!window.confirm(`Restore profession "${item.name}"?`)) return;
    try {
      const res = await crmFetch(`${API_PATH}/crm/configuration/professions/${item.uuid}/restore`, {
        method: "PATCH",
      });
      if (res.ok) {
        toast.success("Restored successfully!");
        fetchProfessions(currentPage, searchQuery);
      } else {
        toast.error("Failed to restore");
      }
    } catch (err) {
      toast.error("Error restoring profession");
    }
  };

  // ====================== SAFE RENDER ======================
  const getStatusBadge = (status: string) => {
    const isActive = status?.toLowerCase() === "active";
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${
        isActive 
          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
          : "bg-rose-500/10 text-rose-600 border-rose-500/20"
      }`}>
        {status}
      </span>
    );
  };

  // ====================== RENDER ======================
  return (
    <div className="w-full space-y-6 p-4 md:p-6 bg-slate-50/50 min-h-screen text-foreground font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-border/85 bg-white/70 backdrop-blur-2xl p-6 md:p-8 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-wider text-indigo-600">
            <Sparkles size={18} className="animate-pulse" /> Leads Management
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 mt-1">
            Profession
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition ${
              showDeleted ? "bg-rose-100 text-rose-700 border-rose-300" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {showDeleted ? "Hide Deleted" : "Show Deleted"}
          </button>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus size={18} />
            <span>Profession Add</span>
          </button>
        </div>
      </div>

      {/* SEARCH & SHOW ENTRIES */}
      <div className="p-4 md:p-5 rounded-2xl border border-border/80 bg-white shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-extrabold text-muted-foreground w-full sm:w-auto">
          <span>Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border rounded-xl bg-background border-border text-foreground font-black text-sm outline-none cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none bg-background border-border text-sm font-bold"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-border/80 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/80 text-white font-black uppercase text-xs tracking-wider bg-gradient-to-r from-indigo-600 to-violet-600">
                <th className="py-5 px-4 w-16 text-center">SL</th>
                <th className="py-5 px-4 min-w-[200px]">NAME</th>
                <th className="py-5 px-4 min-w-[200px]">DESCRIPTION</th>
                <th className="py-5 px-4 min-w-[150px]">STATUS</th>
                <th className="py-5 px-4 min-w-[150px]">ADD BY</th>
                <th className="py-5 px-4 text-center min-w-[160px]">ACTION</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60 font-semibold text-foreground text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                  </td>
                </tr>
              ) : professions.length > 0 ? (
                professions.map((item, index) => (
                  <tr key={item.uuid || item.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-center text-muted-foreground">
                      {(currentPage - 1) * entriesPerPage + index + 1}
                    </td>
                    <td className="py-4 px-4 font-extrabold text-foreground">{item.name}</td>
                    <td className="py-4 px-4 text-muted-foreground">{item.description || "—"}</td>
                    <td className="py-4 px-4">{getStatusBadge(item.status)}</td>
                    <td className="py-4 px-4 font-bold text-muted-foreground">
                      {typeof item.addedBy === "string" ? item.addedBy : "Admin"}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleOpenEditModal(item);
                          }}
                          className="p-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white transition cursor-pointer shadow-xs"
                          title="Edit"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleOpenDeleteModal(item);
                          }}
                          className="p-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition cursor-pointer shadow-xs"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                        {showDeleted && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handleRestore(item);
                            }}
                            className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition cursor-pointer shadow-xs"
                            title="Restore"
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground font-bold text-sm">
                    No professions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-4 md:p-5 border-t border-border/80 bg-card/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-bold text-muted-foreground">
          <div>
            Showing <span className="text-foreground font-black">{totalEntries > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0}</span> to{" "}
            <span className="text-foreground font-black">{Math.min(currentPage * entriesPerPage, totalEntries)}</span> of{" "}
            <span className="text-foreground font-black">{totalEntries}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-2 rounded-xl border border-border/80 bg-background hover:bg-indigo-50 disabled:opacity-40 transition flex items-center gap-1.5 text-foreground cursor-pointer font-extrabold text-xs"
            >
              <ChevronLeft size={18} />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                    currentPage === page
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-background border border-border/80 hover:bg-slate-100 text-foreground"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3.5 py-2 rounded-xl border border-border/80 bg-background hover:bg-indigo-50 disabled:opacity-40 transition flex items-center gap-1.5 text-foreground cursor-pointer font-extrabold text-xs"
            >
              <span>Next</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 p-6 md:p-8 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-4 border-slate-200">
              <h3 className="text-xl font-black text-slate-800">
                {editingRecord ? "Profession Edit" : "Profession Add"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-500 mb-1.5">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5">Description</label>
                <textarea
                  placeholder="Description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-extrabold outline-none cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  {statuses.map((st, index) => {
                    const statusName = typeof st === 'string' ? st : st?.name;
                    return (
                      <option key={`status-${index}`} value={statusName}>
                        {statusName}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-400 hover:bg-slate-500 text-white font-bold cursor-pointer transition text-sm"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md cursor-pointer transition text-sm flex items-center gap-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-800">
              Are you sure?
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              You are about to delete profession <span className="font-bold text-foreground">"{selectedProfessionToDelete?.name}"</span>. This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-400 hover:bg-slate-500 text-white font-bold text-xs cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md cursor-pointer transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}