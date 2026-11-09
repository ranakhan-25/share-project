/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, Search, ChevronLeft, ChevronRight, Plus, Edit, Trash2, X, AlertTriangle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { crmFetch } from "../../crm-fetch";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PATH = `${API_BASE}/realbizpro/api/v1`;

// ====================== TYPES ======================
interface TaskRecord {
  uuid: string;
  title: string;
  description?: string;
  projectCode?: string;
  project?: { name: string; uuid: string };
  assignedTo: any[];
  priority: string;
  status: string;
  dueDate?: string;
  createdBy?: string;
}

export default function TaskPage() {
  const [dataList, setDataList] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);

  // Dropdowns
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TaskRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    projectCode: "",
    description: "",
    assignedTo: [] as string[],
    priority: "Medium",
    status: "Todo",
    dueDate: "",
    taskTypeUuid: "",
    relatedLeadUuid: "",
  });

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItemToDelete, setSelectedItemToDelete] = useState<TaskRecord | null>(null);

  // ====================== FETCH DATA ======================
  const fetchData = useCallback(
    async (page = 1, search = "", limit = entriesPerPage) => {
      try {
        setLoading(true);
        const url = `${API_PATH}/crm/tasks?page=${page}&limit=${limit}&search=${search}`;
        console.log("📥 FETCH:", url);

        const res = await crmFetch(url, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        console.log("📥 RESPONSE:", json);

        // ✅ একাধিক সম্ভাব্য response structure হ্যান্ডেল করা হচ্ছে
        let list: any[] = [];
        let meta: any = {};

        if (Array.isArray(json?.data?.data)) {
          list = json.data.data;
          meta = json.data.meta || {};
        } else if (Array.isArray(json?.data)) {
          list = json.data;
          meta = json.meta || {};
        } else if (Array.isArray(json?.tasks)) {
          list = json.tasks;
          meta = json.meta || {};
        } else if (Array.isArray(json?.results)) {
          list = json.results;
          meta = json.meta || {};
        } else if (Array.isArray(json)) {
          list = json;
        }

        // ✅ soft-deleted বাদ দেওয়া (deletedAt null/undefined থাকলে রাখা হবে)
        const cleanList = list.filter((item: any) => !item.deletedAt);

        console.log("✅ Parsed list length:", cleanList.length);

        setDataList(cleanList);
        setTotalPages(meta?.totalPages || meta?.lastPage || 1);
        setTotalEntries(meta?.total ?? cleanList.length);

        if (cleanList.length === 0 && page > 1) {
          // পেজ খালি হলে আগের পেজে ফিরে যাও
          setCurrentPage((prev) => Math.max(prev - 1, 1));
        }
      } catch (err) {
        console.error("❌ Fetch error:", err);
        toast.error("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    },
    [entriesPerPage]
  );

  const fetchDropdowns = async () => {
    try {
      const resDropdown = await crmFetch(`${API_PATH}/crm/tasks/dropdowns`, { cache: "no-store" });
      const jsonDropdown = await resDropdown.json().catch(() => ({}));

      if (jsonDropdown.success) {
        const data = jsonDropdown.data;
        setProjects(data.projects || []);
        setUsers(data.assignees || data.users || []);
        setPriorities(data.priorities || []);
        setStatuses(data.statuses || []);
      }
    } catch (err) {
      console.error("Failed to load dropdowns", err);
    }
  };

  useEffect(() => {
    fetchData(currentPage, searchQuery, entriesPerPage);
  }, [currentPage, entriesPerPage, fetchData]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setCurrentPage(1);
    fetchData(1, val, entriesPerPage);
  };

  // ====================== ADD HANDLER ======================
  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setFormData({
      title: "",
      projectCode: "",
      description: "",
      assignedTo: [],
      priority: "Medium",
      status: "Todo",
      dueDate: "",
      taskTypeUuid: "",
      relatedLeadUuid: "",
    });
    setIsModalOpen(true);
  };

  // ====================== EDIT HANDLER ======================
  const handleOpenEditModal = (item: TaskRecord) => {
    setEditingRecord(item);
    const assignedUuids = (item.assignedTo || []).map((user: any) =>
      typeof user === "string" ? user : user.uuid
    );

    setFormData({
      title: item.title || "",
      projectCode: item.projectCode || "",
      description: item.description || "",
      assignedTo: assignedUuids,
      priority: item.priority || "Medium",
      status: item.status || "Todo",
      dueDate: item.dueDate || "",
      taskTypeUuid: "",
      relatedLeadUuid: "",
    });
    setIsModalOpen(true);
  };

  // ====================== SUBMIT HANDLER ======================
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error("Please enter Task Title!");
      return;
    }

    setSubmitting(true);

    const payload = {
      title: formData.title,
      projectCode: formData.projectCode || null,
      description: formData.description,
      assignedTo: formData.assignedTo,
      priority: formData.priority,
      status: formData.status,
      dueDate: formData.dueDate || null,
      taskTypeUuid: formData.taskTypeUuid || null,
      relatedLeadUuid: formData.relatedLeadUuid || null,
    };

    try {
      const isEdit = !!editingRecord;
      const url = isEdit
        ? `${API_PATH}/crm/tasks/${editingRecord!.uuid}`
        : `${API_PATH}/crm/tasks`;
      const method = isEdit ? "PATCH" : "POST";

      console.log("📤 SUBMIT:", method, url, payload);

      const res = await crmFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));
      console.log("📤 SUBMIT RESPONSE:", res.status, json);

      if (res.ok || json.success) {
        toast.success(isEdit ? "Updated Successfully!" : "Created Successfully!");
        setIsModalOpen(false);
        setEditingRecord(null);

        // ✅ Modal বন্ধের পর সরাসরি fetchData কল — setTimeout এর দরকার নেই
        if (isEdit) {
          await fetchData(currentPage, searchQuery, entriesPerPage);
        } else {
          // নতুন তৈরি হলে প্রথম পেজে ফিরে latest data দেখানো হবে
          setCurrentPage(1);
          await fetchData(1, searchQuery, entriesPerPage);
        }
      } else {
        toast.error(json.message || "Something went wrong");
      }
    } catch (err) {
      console.error("❌ Submit Error:", err);
      toast.error("Network Error");
    } finally {
      setSubmitting(false);
    }
  };

  // ====================== DELETE HANDLER ======================
  const handleOpenDeleteModal = (item: TaskRecord) => {
    setSelectedItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedItemToDelete?.uuid) return;

    const deletedUuid = selectedItemToDelete.uuid;
    const previousData = [...dataList];

    // Optimistic update
    setDataList(prev => prev.filter(item => item.uuid !== deletedUuid));
    setIsDeleteModalOpen(false);
    setSelectedItemToDelete(null);

    try {
      const res = await crmFetch(`${API_PATH}/crm/tasks/${deletedUuid}`, {
        method: "DELETE",
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));
      console.log("🗑 DELETE RESPONSE:", res.status, json);

      if (res.ok || json.success) {
        toast.success("Deleted successfully!");
        await fetchData(currentPage, searchQuery, entriesPerPage);
      } else {
        toast.error(json.message || "Failed to delete");
        setDataList(previousData);
      }
    } catch (err) {
      console.error("❌ Delete error:", err);
      toast.error("Error deleting task");
      setDataList(previousData);
    }
  };

  // ====================== HELPER FUNCTIONS ======================
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "low": return "bg-gray-200 text-gray-700";
      case "medium": return "bg-indigo-500 text-white";
      case "high": return "bg-orange-500 text-white";
      case "critical": return "bg-red-500 text-white";
      default: return "bg-gray-200 text-gray-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "todo": return "bg-gray-500 text-white";
      case "in progress": return "bg-cyan-500 text-white";
      case "review": return "bg-orange-500 text-white";
      case "testing": return "bg-purple-500 text-white";
      case "completed": return "bg-green-500 text-white";
      case "cancelled": return "bg-red-500 text-white";
      default: return "bg-gray-500 text-white";
    }
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
            Internal Tasks
          </h1>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md shadow-indigo-600/30 transition cursor-pointer"
        >
          <Plus size={18} />
          <span>+ Task Add</span>
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
                <th className="py-5 px-4 min-w-[200px]">TITLE</th>
                <th className="py-5 px-4 min-w-[250px]">DESCRIPTION</th>
                <th className="py-5 px-4 min-w-[150px]">ASSIGNED TO</th>
                <th className="py-5 px-4 min-w-[100px]">PRIORITY</th>
                <th className="py-5 px-4 min-w-[120px]">STATUS</th>
                <th className="py-5 px-4 min-w-[120px]">DUE DATE</th>
                <th className="py-5 px-4 min-w-[120px]">CREATED BY</th>
                <th className="py-5 px-4 text-center min-w-[120px]">ACTION</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60 font-semibold text-foreground text-sm">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                  </td>
                </tr>
              ) : dataList.length > 0 ? (
                dataList.map((item, index) => (
                  <tr key={item.uuid} className="hover:bg-muted/40 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-center text-muted-foreground">
                      {(currentPage - 1) * entriesPerPage + index + 1}
                    </td>
                    <td className="py-4 px-4 font-extrabold text-foreground">{item.title}</td>
                    <td className="py-4 px-4 text-muted-foreground">{item.description || "N/A"}</td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {item.assignedTo && item.assignedTo.length > 0 ? (
                          item.assignedTo.map((user: any, idx) => (
                            <span key={idx} className="px-2 py-1 rounded text-xs font-bold bg-cyan-100 text-cyan-700 border border-cyan-200">
                              {user?.name || user?.email || (typeof user === "string" ? user : "User")}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "N/A"}</td>
                    <td className="py-4 px-4 text-muted-foreground">{item.createdBy || "Admin"}</td>
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
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground font-bold text-sm">
                    No tasks found.
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
          <div className="w-full max-w-4xl rounded-2xl bg-white border border-slate-200 p-6 md:p-8 space-y-5 shadow-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 border-slate-200">
              <h3 className="text-xl font-black text-slate-800">
                {editingRecord ? "Edit Task" : "Task Add"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-bold">

              {/* Row 1: Title & Project */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5">
                    Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Task Title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5">Project</label>
                  <select
                    value={formData.projectCode}
                    onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                    className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select Project</option>
                    {/* ✅ projectCode হিসেবে p.code পাঠানো হচ্ছে */}
                    {projects.map((p: any) => (
                      <option key={p.uuid} value={p.code}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Description */}
              <div>
                <label className="block text-slate-500 mb-1.5">Description</label>
                <textarea
                  placeholder="Task description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Row 3: Assigned To */}
              <div>
                <label className="block text-slate-500 mb-1.5">
                  Assigned To <span className="text-rose-500">*</span>
                </label>
                <select
                  multiple
                  required
                  value={formData.assignedTo}
                  onChange={(e) => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({ ...formData, assignedTo: selectedOptions });
                  }}
                  className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[100px]"
                >
                  {users.map((u: any) => (
                    <option key={u.uuid} value={u.uuid}>{u.name} ({u.email})</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple users.</p>
              </div>

              {/* Row 4: Priority, Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5">Priority <span className="text-rose-500">*</span></label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5">Status <span className="text-rose-500">*</span></label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none"
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Testing">Testing</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Due Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none"
                  />
                </div>
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
              You are about to delete task <span className="font-bold text-foreground">"{selectedItemToDelete?.title}"</span>. This action cannot be undone.
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