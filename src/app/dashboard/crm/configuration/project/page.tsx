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
interface ProjectRecord {
  uuid: string;
  code: string;
  name: string;
  projectType: string;
  areaCategory?: string;
  location?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  contactPersonName?: string;
  contactPhone?: string;
  clientEmail?: string;
  contractorCompany?: string;
  projectManager?: string;
  totalBudget?: number;
  numberOfStoreys?: number;
  progressPercentage?: number;
  status: string;
  deletedAt?: string | null;
  addedBy?: any;
}

export default function ProjectPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);

  // Dropdowns
  const [projectTypes, setProjectTypes] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [storeys, setStoreys] = useState<any[]>([]);

  // Filters
  const [filterProjectType, setFilterProjectType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterStoreys, setFilterStoreys] = useState("");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProjectRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    projectType: "",
    projectManager: "",
    startDate: "",
    endDate: "",
    totalBudget: "",
    location: "",
    areaCategory: "",
    numberOfStoreys: "",
    status: "ACTIVE",
    description: "",
    contactPersonName: "",
    contactPhone: "",
    clientEmail: "",
  });

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProjectToDelete, setSelectedProjectToDelete] = useState<ProjectRecord | null>(null);

  // ====================== FETCH DATA ======================
  const fetchProjects = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const url = `${API_PATH}/crm/projects?page=${page}&limit=${entriesPerPage}&search=${search}`;
      
      const res = await crmFetch(url);
      const json = await res.json();
      
      if (json.success) {
        setProjects((json.data.data || []).filter((item: any) => !item.deletedAt));
        setTotalPages(json.data.meta?.totalPages || 1);
        setTotalEntries(json.data.meta?.total || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const resDropdown = await crmFetch(`${API_PATH}/crm/projects/dropdown`);
      const jsonDropdown = await resDropdown.json();
      
      if (jsonDropdown.success) {
        const data = jsonDropdown.data;
        setProjectTypes(data.projectTypes || []);
        setManagers(data.users || []);
        setAreas(data.areas || []);
        setStatuses(data.statuses || []);
        setStoreys(data.storeys || []);
      }
    } catch (err) {
      console.error("Failed to load dropdowns", err);
    }
  };

  useEffect(() => {
    fetchProjects(currentPage, searchQuery);
  }, [currentPage, entriesPerPage]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
    fetchProjects(1, e.target.value);
  };

  // ====================== ADD HANDLER ======================
  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setFormData({
      code: "",
      name: "",
      projectType: "",
      projectManager: "",
      startDate: "",
      endDate: "",
      totalBudget: "",
      location: "",
      areaCategory: "",
      numberOfStoreys: "",
      status: "ACTIVE",
      description: "",
      contactPersonName: "",
      contactPhone: "",
      clientEmail: "",
    });
    setIsModalOpen(true);
  };

  // ====================== EDIT HANDLER ======================
  const handleOpenEditModal = (item: ProjectRecord) => {
    setEditingRecord(item);
    setFormData({
      code: item.code || "",
      name: item.name || "",
      projectType: item.projectType || "",
      projectManager: item.projectManager || "",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      totalBudget: item.totalBudget ? String(item.totalBudget) : "",
      location: item.location || "",
      areaCategory: item.areaCategory || "",
      numberOfStoreys: item.numberOfStoreys ? String(item.numberOfStoreys) : "",
      status: item.status || "ACTIVE",
      description: item.description || "",
      contactPersonName: item.contactPersonName || "",
      contactPhone: item.contactPhone || "",
      clientEmail: item.clientEmail || "",
    });
    setIsModalOpen(true);
  };

  // ====================== SUBMIT HANDLER ======================
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      toast.error("Please enter Project Name and Code!");
      return;
    }

    setSubmitting(true);
    
    // ✅ API-তে শুধু সেই ফিল্ডগুলো পাঠানো হচ্ছে যা API রেসপন্সে আছে
    const payload = {
      code: formData.code,
      name: formData.name,
      projectType: formData.projectType,
      projectManager: formData.projectManager,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      totalBudget: Number(formData.totalBudget) || 0,
      location: formData.location,
      areaCategory: formData.areaCategory,
      numberOfStoreys: Number(formData.numberOfStoreys) || 0,
      status: formData.status,
      description: formData.description,
      contactPersonName: formData.contactPersonName,
      contactPhone: formData.contactPhone,
      clientEmail: formData.clientEmail,
      progressPercentage: editingRecord?.progressPercentage || 0,
    };

    try {
      const isEdit = !!editingRecord;
      const url = isEdit
        ? `${API_PATH}/crm/projects/${editingRecord!.uuid}`
        : `${API_PATH}/crm/projects`;
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
        
        setTimeout(() => {
          fetchProjects(currentPage, searchQuery);
        }, 500);
      } else {
        toast.error(json.message || "Something went wrong");
      }
    } catch (err) {
      console.error("Submit Error:", err);
      toast.error("Network Error");
    } finally {
      setSubmitting(false);
    }
  };

  // ====================== DELETE HANDLER ======================
  const handleOpenDeleteModal = (item: ProjectRecord) => {
    setSelectedProjectToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProjectToDelete?.uuid) return;
    
    const deletedUuid = selectedProjectToDelete.uuid;
    const previousData = [...projects];
    setProjects(prev => prev.filter(item => item.uuid !== deletedUuid));
    setIsDeleteModalOpen(false);
    setSelectedProjectToDelete(null);

    try {
      const res = await crmFetch(`${API_PATH}/crm/projects/${deletedUuid}`, {
        method: "DELETE",
      });
      
      const json = await res.json().catch(() => ({}));
      
      if (res.ok || json.success) {
        toast.success("Deleted successfully!");
        setTimeout(() => {
          fetchProjects(currentPage, searchQuery);
        }, 500);
      } else {
        toast.error(json.message || "Failed to delete");
        setProjects(previousData);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting project");
      setProjects(previousData);
    }
  };

  // ====================== FILTER DATA ======================
  const filteredData = projects.filter((item) => {
    const matchProjectType = filterProjectType ? item.projectType === filterProjectType : true;
    const matchStatus = filterStatus ? item.status === filterStatus : true;
    const matchArea = filterArea ? item.areaCategory === filterArea : true;
    const matchStoreys = filterStoreys ? String(item.numberOfStoreys) === filterStoreys : true;
    return matchProjectType && matchStatus && matchArea && matchStoreys;
  });

  // ====================== RENDER ======================
  return (
    <div className="w-full space-y-6 p-4 md:p-6 bg-slate-50/50 min-h-screen text-foreground font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-border/85 bg-white/70 backdrop-blur-2xl p-6 md:p-8 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-wider text-indigo-600">
            <Sparkles size={18} className="animate-pulse" /> Project Management
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 mt-1">
            Projects
          </h1>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md shadow-indigo-600/30 transition cursor-pointer"
        >
          <Plus size={18} />
          <span>+ Create Project</span>
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl border grid grid-cols-1 md:grid-cols-4 gap-4 shadow-sm">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Project Type</label>
          <select value={filterProjectType} onChange={(e) => setFilterProjectType(e.target.value)} className="w-full border rounded-lg px-3 py-1.5 text-sm">
            <option value="">All Types</option>
            {projectTypes.map((p, index) => {
              const pName = typeof p === "string" ? p : p.name || p.label;
              return <option key={`ptype-${index}`} value={pName}>{pName}</option>;
            })}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full border rounded-lg px-3 py-1.5 text-sm">
            <option value="">All Status</option>
            {statuses.map((s, index) => {
              const sName = typeof s === "string" ? s : s.name || s.label;
              return <option key={`status-${index}`} value={sName}>{sName}</option>;
            })}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Area</label>
          <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)} className="w-full border rounded-lg px-3 py-1.5 text-sm">
            <option value="">Select Area</option>
            {areas.map((a, index) => {
              const aName = typeof a === "string" ? a : a.name || a.label;
              return <option key={`area-${index}`} value={aName}>{aName}</option>;
            })}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Number Of Storeys</label>
          <select value={filterStoreys} onChange={(e) => setFilterStoreys(e.target.value)} className="w-full border rounded-lg px-3 py-1.5 text-sm">
            <option value="">All Storeys</option>
            {storeys.map((s, index) => {
              const sVal = typeof s === "string" ? s : String(s);
              return <option key={`storey-${index}`} value={sVal}>{sVal}</option>;
            })}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-border/80 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/80 text-white font-black uppercase text-xs tracking-wider bg-gradient-to-r from-indigo-600 to-violet-600">
                <th className="py-5 px-4 w-16 text-center">ID</th>
                <th className="py-5 px-4 min-w-[200px]">DURATION</th>
                <th className="py-5 px-4 min-w-[150px]">PROJECT TYPE</th>
                <th className="py-5 px-4 min-w-[150px]">PROJECT MANAGER</th>
                <th className="py-5 px-4 min-w-[150px]">CUSTOMER</th>
                <th className="py-5 px-4 min-w-[150px]">CODE</th>
                <th className="py-5 px-4 min-w-[200px]">NAME</th>
                <th className="py-5 px-4 min-w-[150px]">BUDGET</th>
                <th className="py-5 px-4 min-w-[100px]">NUMBER OF STOREYS</th>
                <th className="py-5 px-4 min-w-[200px]">DESCRIPTION</th>
                <th className="py-5 px-4 min-w-[150px]">LOCATION</th>
                <th className="py-5 px-4 text-center min-w-[160px]">ACTION</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60 font-semibold text-foreground text-sm">
              {loading ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={item.uuid} className="hover:bg-muted/40 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-center text-muted-foreground">
                      {(currentPage - 1) * entriesPerPage + index + 1}
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">
                      {item.startDate && item.endDate 
                        ? `From: ${item.startDate} To: ${item.endDate}` 
                        : "From: N/A To: N/A"}
                    </td>
                    <td className="py-4 px-4 font-extrabold text-foreground">{item.projectType || "N/A"}</td>
                    <td className="py-4 px-4 text-muted-foreground">{item.projectManager || "N/A"}</td>
                    <td className="py-4 px-4 text-muted-foreground">{item.contactPersonName || "N/A"}</td>
                    <td className="py-4 px-4 font-mono font-black text-indigo-600">{item.code}</td>
                    <td className="py-4 px-4 font-extrabold text-foreground">{item.name}</td>
                    <td className="py-4 px-4 font-mono text-muted-foreground">{item.totalBudget ? Number(item.totalBudget).toLocaleString() : "N/A"}</td>
                    <td className="py-4 px-4 font-mono text-muted-foreground">{item.numberOfStoreys || "N/A"}</td>
                    <td className="py-4 px-4 text-muted-foreground">{item.description || "N/A"}</td>
                    <td className="py-4 px-4 text-muted-foreground">{item.location || "N/A"}</td>
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
                  <td colSpan={12} className="p-8 text-center text-muted-foreground font-bold text-sm">
                    No projects found.
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
                {editingRecord ? "Project Edit" : "Project Add"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5">Project Type</label>
                  <select required value={formData.projectType} onChange={(e) => setFormData({ ...formData, projectType: e.target.value })} className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none">
                    <option value="">Select Project Type</option>
                    {projectTypes.map((p, index) => {
                      const pName = typeof p === "string" ? p : p.name || p.label;
                      return <option key={`ptype-modal-${index}`} value={pName}>{pName}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5">Project Manager</label>
                  <select value={formData.projectManager} onChange={(e) => setFormData({ ...formData, projectManager: e.target.value })} className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none">
                    <option value="">Select Project Manager</option>
                    {managers.map((m, index) => {
                      const mName = typeof m === "string" ? m : m.name || m.label;
                      return <option key={`manager-${index}`} value={mName}>{mName}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5">Code</label>
                  <input required type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none" placeholder="Code" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5">Project Name</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none" placeholder="Name" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5">Description</label>
                  <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none" placeholder="Description" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5">Budget</label>
                  <input type="number" value={formData.totalBudget} onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })} className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none" placeholder="Budget" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5">Location</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none" placeholder="Location" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5">Status</label>
                  <select required value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none">
                    <option value="">Select Status</option>
                    {statuses.map((s, index) => {
                      const sName = typeof s === "string" ? s : s.name || s.label;
                      return <option key={`status-modal-${index}`} value={sName}>{sName}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5">Area</label>
                  <select value={formData.areaCategory} onChange={(e) => setFormData({ ...formData, areaCategory: e.target.value })} className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none">
                    <option value="">Select Area</option>
                    {areas.map((a, index) => {
                      const aName = typeof a === "string" ? a : a.name || a.label;
                      return <option key={`area-modal-${index}`} value={aName}>{aName}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5">Number of Storeys</label>
                  <input type="number" value={formData.numberOfStoreys} onChange={(e) => setFormData({ ...formData, numberOfStoreys: e.target.value })} className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none" placeholder="Number of Storeys" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5">Assign User</label>
                  <select className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none">
                    <option value="">Select User</option>
                    {managers.map((u, index) => {
                      const uName = typeof u === "string" ? u : u.name || u.label;
                      return <option key={`user-${index}`} value={uName}>{uName}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5">Start Date</label>
                  <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5">End Date</label>
                  <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full p-3 border rounded-xl bg-white border-slate-200 text-sm font-semibold outline-none" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
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
              You are about to delete project <span className="font-bold text-foreground">"{selectedProjectToDelete?.name}"</span>. This action cannot be undone.
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