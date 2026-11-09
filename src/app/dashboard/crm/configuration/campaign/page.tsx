/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Search, ChevronLeft, ChevronRight, Plus, Edit, Trash2, X, AlertTriangle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { crmFetch } from "../../crm-fetch";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PATH = `${API_BASE}/realbizpro/api/v1`;

// ====================== TYPES ======================
interface CampaignRecord {
  uuid: string;
  name: string;
  leadSourceUuid?: string;
  leadSource?: { uuid: string; name: string } | null;
  description: string;
  formId: string;
  status: string;
  startDate: string;
  endDate: string;
  budget: number;
  channel: string;
  projectId: string;
  deletedAt?: string | null;
  addedBy?: any;
}

export default function CampaignPage() {
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);

  // Dropdowns
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);

  // Add / Edit Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CampaignRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    leadSourceUuid: "",
    description: "",
    formId: "",
    status: "active",
    startDate: "",
    endDate: "",
    budget: 0,
    channel: "",
    projectId: "",
  });

  // Delete Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCampaignToDelete, setSelectedCampaignToDelete] = useState<CampaignRecord | null>(null);

  // ====================== FETCH DATA ======================
  const fetchCampaigns = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const url = `${API_PATH}/crm/configuration/campaigns?page=${page}&limit=${entriesPerPage}&search=${search}`;
      
      const res = await crmFetch(url);
      const json = await res.json();
      
      if (json.success) {
        setCampaigns(json.data.data || []);
        setTotalPages(json.data.meta?.totalPages || 1);
        setTotalEntries(json.data.meta?.total || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const resSource = await crmFetch(`${API_PATH}/crm/configuration/campaigns/dropdown/lead-sources`);
      const jsonSource = await resSource.json();
      if (jsonSource.success) setLeadSources(jsonSource.data.data || jsonSource.data || []);

      const resStatus = await crmFetch(`${API_PATH}/crm/configuration/campaigns/dropdown/statuses`);
      const jsonStatus = await resStatus.json();
      if (jsonStatus.success) setStatuses(jsonStatus.data.data || jsonStatus.data || []);
      
    } catch (err) {
      console.error("Failed to load dropdowns", err);
    }
  };

  useEffect(() => {
    fetchCampaigns(currentPage, searchQuery);
  }, [currentPage, entriesPerPage]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
    fetchCampaigns(1, e.target.value);
  };

  // ====================== FORM HANDLERS ======================
  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setFormData({
      name: "",
      leadSourceUuid: "",
      description: "",
      formId: "",
      status: "active",
      startDate: "",
      endDate: "",
      budget: 0,
      channel: "",
      projectId: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: CampaignRecord) => {
    setEditingRecord(item);
    setFormData({
      name: item.name || "",
      leadSourceUuid: item.leadSourceUuid || "",
      description: item.description || "",
      formId: item.formId || "",
      status: item.status || "active",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      budget: Number(item.budget) || 0,
      channel: item.channel || "",
      projectId: item.projectId || "",
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Please enter Campaign Name!");
      return;
    }

    setSubmitting(true);
    const payload = {
      name: formData.name,
      leadSourceUuid: formData.leadSourceUuid || null,
      description: formData.description,
      formId: formData.formId,
      status: formData.status,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      budget: Number(formData.budget),
      channel: formData.channel,
      projectId: formData.projectId,
      createdBy: "Admin",
    };

    try {
      const isEdit = !!editingRecord;
      const url = isEdit
        ? `${API_PATH}/crm/configuration/campaigns/${editingRecord!.uuid}`
        : `${API_PATH}/crm/configuration/campaigns`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await crmFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(isEdit ? "Updated Successfully!" : "Created Successfully!");
        setIsModalOpen(false);
        setEditingRecord(null);
        fetchCampaigns(currentPage, searchQuery);
      } else {
        const error = await res.json();
        toast.error(error.message || "Something went wrong");
      }
    } catch (err) {
      toast.error("Network Error");
    } finally {
      setSubmitting(false);
    }
  };

  // ====================== DELETE ======================
  const handleOpenDeleteModal = (item: CampaignRecord) => {
    setSelectedCampaignToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCampaignToDelete) return;
    
    try {
      const res = await crmFetch(`${API_PATH}/crm/configuration/campaigns/${selectedCampaignToDelete.uuid}`, {
        method: "DELETE",
      });
      
      const json = await res.json().catch(() => ({}));
      
      if (res.ok || json.success) {
        toast.success("Deleted successfully!");
        setIsDeleteModalOpen(false);
        setSelectedCampaignToDelete(null);
        
        if (campaigns.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          fetchCampaigns(currentPage, searchQuery);
        }
      } else {
        toast.error(json.message || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting campaign");
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
            Campaign
          </h1>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md shadow-indigo-600/30 transition cursor-pointer"
        >
          <Plus size={18} />
          <span>Campaign Add</span>
        </button>
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
                <th className="py-5 px-4 min-w-[150px]">START DATE</th>
                <th className="py-5 px-4 min-w-[150px]">END DATE</th>
                <th className="py-5 px-4 min-w-[150px]">BUDGET</th>
                <th className="py-5 px-4 min-w-[150px]">CHANNEL</th>
                <th className="py-5 px-4 min-w-[120px]">STATUS</th>
                <th className="py-5 px-4 text-center min-w-[160px]">ACTION</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60 font-semibold text-foreground text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                  </td>
                </tr>
              ) : campaigns.length > 0 ? (
                campaigns.map((item, index) => (
                  <tr key={item.uuid || index} className="hover:bg-muted/40 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-center text-muted-foreground">
                      {(currentPage - 1) * entriesPerPage + index + 1}
                    </td>
                    <td className="py-4 px-4 font-extrabold text-foreground">{item.name}</td>
                    <td className="py-4 px-4 text-muted-foreground">{item.startDate || "—"}</td>
                    <td className="py-4 px-4 text-muted-foreground">{item.endDate || "—"}</td>
                    <td className="py-4 px-4 font-bold text-muted-foreground">{item.budget || "0"}</td>
                    <td className="py-4 px-4 text-muted-foreground">{item.channel || "—"}</td>
                    <td className="py-4 px-4">{getStatusBadge(item.status)}</td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white transition cursor-pointer shadow-xs"
                          title="Edit"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(item)}
                          className="p-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition cursor-pointer shadow-xs"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground font-bold text-sm">
                    No campaigns found.
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
          <div className="w-full max-w-3xl rounded-2xl bg-white border border-slate-200 p-6 md:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 border-slate-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-black text-slate-800">
                {editingRecord ? "Campaign Edit" : "Campaign Add"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-slate-500 mb-1.5">Lead Source</label>
                  <select
                    value={formData.leadSourceUuid}
                    onChange={(e) => setFormData({ ...formData, leadSourceUuid: e.target.value })}
                    className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-extrabold outline-none cursor-pointer"
                  >
                    <option value="">Select Lead Source</option>
                    {leadSources.map((source, index) => (
                      <option key={`source-${index}`} value={source.uuid}>
                        {source.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1.5">Budget</label>
                  <input
                    type="number"
                    placeholder="Budget"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                    className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1.5">Channel</label>
                  <input
                    type="text"
                    placeholder="Channel"
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                    className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1.5">Form Id (If Facebook Campaign)</label>
                  <input
                    type="text"
                    placeholder="Form Id"
                    value={formData.formId}
                    onChange={(e) => setFormData({ ...formData, formId: e.target.value })}
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
              You are about to delete campaign <span className="font-bold text-foreground">"{selectedCampaignToDelete?.name}"</span>. This action cannot be undone.
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