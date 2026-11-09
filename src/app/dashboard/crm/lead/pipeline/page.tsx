"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Building,
  ArrowUpRight,
  Eye,
  Plus,
  Search,
  X,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from "lucide-react";
import { crmDirectoryApi, rowsOf } from "@/services/crmLeadApi";

interface PipelineProject {
  id: string;
  projectUuid?: string;
  name: string;
  totalLeads: number;
  activeDeals: number;
  newThisQtr: number;
  value: number;
  status: "Active" | "Completed" | "Upcoming";
}

const defaultPipelines: PipelineProject[] = [
  {
    id: "pipe-1",
    name: "Riverside Horizon",
    totalLeads: 24,
    activeDeals: 18,
    newThisQtr: 4,
    value: 45000000,
    status: "Active",
  },
  {
    id: "pipe-2",
    name: "Meridian Tower",
    totalLeads: 15,
    activeDeals: 10,
    newThisQtr: 2,
    value: 28000000,
    status: "Active",
  },
  {
    id: "pipe-3",
    name: "Meridian Yards",
    totalLeads: 12,
    activeDeals: 8,
    newThisQtr: 3,
    value: 19500000,
    status: "Active",
  },
  {
    id: "pipe-4",
    name: "Greenfield Court",
    totalLeads: 8,
    activeDeals: 5,
    newThisQtr: 1,
    value: 12000000,
    status: "Active",
  },
];

export default function PipelineListPage() {
  const [pipelines, setPipelines] = useState<PipelineProject[]>([]);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Active selected item for Edit / View / Delete
  const [selectedProject, setSelectedProject] = useState<PipelineProject | null>(null);

  // New Project Form State
  const [newProject, setNewProject] = useState({
    name: "",
    totalLeads: "",
    value: "",
  });

  // Pagination States
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // 1. PAGE LOAD HOLE LOCALSTORAGE THEKE DATA ANBO
  const refreshPipelines = async () => {
    try {
      const [response, projects] = await Promise.all([crmDirectoryApi.pipelines({ page: 1, limit: 100 }), crmDirectoryApi.pipelineProjects()]);
      setAvailableProjects(projects);
      setPipelines(rowsOf(response).map((row: any) => ({ id: row.pipelineUuid ?? row.projectUuid, projectUuid: row.projectUuid, name: row.projectName, totalLeads: row.totalLeads, activeDeals: row.activeDeals, newThisQtr: row.newThisQuarter, value: row.estimatedPipelineValue, status: row.projectStatus === "ACTIVE" ? "Active" : "Completed" })));
    } catch (error) { console.error("Failed to load CRM pipeline", error); setPipelines([]); }
    finally { setIsLoaded(true); }
  };
  useEffect(() => { void refreshPipelines(); }, []);

  // 2. DATA UPDATE HOLE LOCALSTORAGE-E SAVE KORAR HELPER FUNCTION
  const updateAndSavePipelines = (data: PipelineProject[]) => {
    setPipelines(data);
  };

  // Handle Add New Pipeline Project
  const handleAddProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;

    const project = availableProjects.find((item) => item.name?.toLowerCase() === newProject.name.trim().toLowerCase() || item.uuid === newProject.name.trim());
    if (!project) { console.error("Choose an existing project for the pipeline"); return; }
    try { await crmDirectoryApi.createPipeline({ projectUuid: project.uuid, initialLeadsCount: Number(newProject.totalLeads) || 0, estimatedPipelineValue: Number(newProject.value) || 0 }); await refreshPipelines(); setShowAddModal(false); setNewProject({ name: "", totalLeads: "", value: "" }); }
    catch (error) { console.error("Failed to create pipeline", error); }
  };

  // Handle Save Edit Project
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const project = availableProjects.find((item) => item.name === selectedProject.name || item.uuid === selectedProject.projectUuid);
    if (!project) return;
    try {
      if (selectedProject.id && selectedProject.id !== selectedProject.projectUuid) await crmDirectoryApi.updatePipeline(selectedProject.id, { projectUuid: project.uuid, initialLeadsCount: selectedProject.totalLeads, estimatedPipelineValue: selectedProject.value });
      else await crmDirectoryApi.createPipeline({ projectUuid: project.uuid, initialLeadsCount: selectedProject.totalLeads, estimatedPipelineValue: selectedProject.value });
      await refreshPipelines(); setShowEditModal(false); setSelectedProject(null);
    } catch (error) { console.error("Failed to update pipeline", error); }
  };

  // Handle Delete Confirmation from Modal
  const handleConfirmDelete = async () => {
    if (!selectedProject) return;
    if (!selectedProject.id || selectedProject.id === selectedProject.projectUuid) return;
    try { await crmDirectoryApi.deletePipeline(selectedProject.id); await refreshPipelines(); setShowDeleteModal(false); setSelectedProject(null); }
    catch (error) { console.error("Failed to delete pipeline", error); }
  };

  // Filter Pipelines based on Search Input
  const filteredPipelines = pipelines.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Calculations
  const totalEntries = filteredPipelines.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const currentTableData = filteredPipelines.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Professional Pagination Helper
  const renderPaginationButtons = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="w-9 h-9 rounded-xl font-bold text-xs bg-background border border-border/80 hover:bg-indigo-50 dark:hover:bg-slate-800 text-foreground transition cursor-pointer"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="dots1" className="px-1 text-muted-foreground font-bold text-xs">
            ...
          </span>
        );
      }
    }

    for (let page = startPage; page <= endPage; page++) {
      const isActive = currentPage === page;
      pages.push(
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`w-9 h-9 rounded-xl font-extrabold text-xs transition cursor-pointer ${
            isActive
              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30 scale-105"
              : "bg-background border border-border/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground"
          }`}
        >
          {page}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="dots2" className="px-1 text-muted-foreground font-bold text-xs">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="w-9 h-9 rounded-xl font-bold text-xs bg-background border border-border/80 hover:bg-indigo-50 dark:hover:bg-slate-800 text-foreground transition cursor-pointer"
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  if (!isLoaded) {
    return <div className="p-8 text-center font-bold text-muted-foreground">Loading Pipeline Data...</div>;
  }

  return (
    <div className="w-full space-y-6 p-4 md:p-6 bg-slate-50/50 dark:bg-background min-h-screen text-foreground font-sans">
      
      {/* BREADCRUMB & HEADER */}
      <div className="flex flex-col gap-5 rounded-3xl border border-border/85 bg-card/70 backdrop-blur-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Sparkles size={18} /> CRM Pipeline Management
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mt-1">
              Pipeline List
            </h1>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-black rounded-xl transition flex items-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer w-fit"
          >
            <Plus size={18} /> New Pipeline Project
          </button>
        </div>
      </div>

      {/* SHOW ENTRIES & SEARCH BAR */}
      <div className="p-4 md:p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <span>Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border rounded-xl bg-background border-border text-foreground font-extrabold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>

        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search project pipeline..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none bg-background border-border text-sm font-bold focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* PIPELINE LIST TABLE */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/80 text-white font-black uppercase text-xs tracking-wider bg-gradient-to-r from-indigo-600 to-violet-600">
                <th className="p-4 w-12 text-center">SL</th>
                <th className="p-4 min-w-[240px]">PROJECT</th>
                <th className="p-4 min-w-[140px]">TOTAL LEADS</th>
                <th className="p-4 min-w-[140px]">ACTIVE DEALS</th>
                <th className="p-4 min-w-[160px]">NEW THIS QTR</th>
                <th className="p-4 min-w-[160px]">PIPELINE VALUE</th>
                <th className="p-4 text-center min-w-[140px]">ACTION</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-border/60 font-semibold text-foreground text-sm">
              {currentTableData.length > 0 ? (
                currentTableData.map((project, index) => (
                  <tr key={project.id} className="hover:bg-muted/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-center text-muted-foreground">
                      {indexOfFirstItem + index + 1}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          <Building size={18} />
                        </div>
                        <span className="font-extrabold text-base text-foreground">
                          {project.name}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 font-mono font-black text-foreground">
                      {project.totalLeads} Leads
                    </td>

                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        {project.activeDeals} Active
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 w-fit">
                        <ArrowUpRight size={14} /> +{project.newThisQtr} this qtr
                      </span>
                    </td>

                    <td className="p-4 font-mono font-black text-indigo-600 dark:text-indigo-400 text-base">
                      ৳{(project.value / 100000).toFixed(1)} Lakhs
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* VIEW BUTTON */}
                        <button
                          onClick={() => { setSelectedProject(project); setShowViewModal(true); }}
                          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all duration-200 active:scale-95 cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>

                        {/* EDIT BUTTON */}
                        <button
                          onClick={() => { setSelectedProject({ ...project }); setShowEditModal(true); }}
                          className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200/80 dark:border-cyan-800/60 hover:bg-cyan-500 hover:text-white dark:hover:bg-cyan-500 dark:hover:text-white transition-all duration-200 active:scale-95 cursor-pointer"
                          title="Edit Project"
                        >
                          <Edit size={16} />
                        </button>

                        {/* DELETE BUTTON */}
                        <button
                          onClick={() => { setSelectedProject(project); setShowDeleteModal(true); }}
                          className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white dark:text-rose-400 dark:hover:text-white border border-rose-500/20 transition-all duration-200 active:scale-95 cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground font-bold text-sm">
                    No pipeline projects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-4 md:p-5 border-t border-border/80 bg-card/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-bold text-muted-foreground">
          <div>
            Showing <span className="text-foreground font-black">{totalEntries > 0 ? indexOfFirstItem + 1 : 0}</span> to{" "}
            <span className="text-foreground font-black">{Math.min(indexOfLastItem, totalEntries)}</span> of{" "}
            <span className="text-foreground font-black">{totalEntries}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3.5 py-2 rounded-xl border border-border/80 bg-background hover:bg-indigo-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5 text-foreground cursor-pointer font-extrabold text-xs md:text-sm"
            >
              <ChevronLeft size={18} />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-1">
              {renderPaginationButtons()}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3.5 py-2 rounded-xl border border-border/80 bg-background hover:bg-indigo-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5 text-foreground cursor-pointer font-extrabold text-xs md:text-sm"
            >
              <span>Next</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* CREATE NEW PIPELINE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 md:p-7 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex justify-between items-center border-b border-border pb-3.5">
              <h3 className="font-extrabold text-base md:text-lg text-foreground">New Pipeline Project</h3>
              <button onClick={() => setShowAddModal(false)} className="cursor-pointer text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>

            <form onSubmit={handleAddProjectSubmit} className="space-y-4 text-sm font-semibold">
              <div>
                <label className="block text-muted-foreground mb-1.5 font-bold">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Skyline Residency"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border outline-none font-semibold text-foreground focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1.5 font-bold">Initial Leads Count</label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  value={newProject.totalLeads}
                  onChange={(e) => setNewProject({ ...newProject, totalLeads: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border outline-none font-semibold text-foreground focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1.5 font-bold">Estimated Pipeline Value (BDT)</label>
                <input
                  type="number"
                  placeholder="e.g. 25000000"
                  value={newProject.value}
                  onChange={(e) => setNewProject({ ...newProject, value: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border outline-none font-mono font-semibold text-foreground focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-muted font-bold cursor-pointer text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black shadow-md cursor-pointer"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PIPELINE MODAL */}
      {showEditModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 md:p-7 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex justify-between items-center border-b border-border pb-3.5">
              <h3 className="font-extrabold text-base md:text-lg text-foreground">Edit Pipeline Project</h3>
              <button onClick={() => setShowEditModal(false)} className="cursor-pointer text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-sm font-semibold">
              <div>
                <label className="block text-muted-foreground mb-1.5 font-bold">Project Name *</label>
                <input
                  type="text"
                  required
                  value={selectedProject.name}
                  onChange={(e) => setSelectedProject({ ...selectedProject, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border outline-none font-semibold text-foreground focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1.5 font-bold">Total Leads</label>
                <input
                  type="number"
                  value={selectedProject.totalLeads}
                  onChange={(e) => setSelectedProject({ ...selectedProject, totalLeads: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border outline-none font-semibold text-foreground focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1.5 font-bold">Pipeline Value (BDT)</label>
                <input
                  type="number"
                  value={selectedProject.value}
                  onChange={(e) => setSelectedProject({ ...selectedProject, value: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border outline-none font-mono font-semibold text-foreground focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-muted font-bold cursor-pointer text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black shadow-md cursor-pointer"
                >
                  Update Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PIPELINE MODAL */}
      {showViewModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 md:p-7 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex justify-between items-center border-b border-border pb-3.5">
              <h3 className="font-extrabold text-base md:text-lg text-foreground">{selectedProject.name} Details</h3>
              <button onClick={() => setShowViewModal(false)} className="cursor-pointer text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>

            <div className="space-y-3 text-sm font-semibold">
              <div className="flex justify-between p-3.5 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-muted-foreground">Total Leads:</span>
                <span className="font-mono font-bold text-foreground">{selectedProject.totalLeads} Leads</span>
              </div>
              <div className="flex justify-between p-3.5 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-muted-foreground">Active Deals:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedProject.activeDeals} Active</span>
              </div>
              <div className="flex justify-between p-3.5 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-muted-foreground">New This Quarter:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{selectedProject.newThisQtr} Deals</span>
              </div>
              <div className="flex justify-between p-3.5 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-muted-foreground">Total Pipeline Value:</span>
                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">৳{selectedProject.value.toLocaleString()} BDT</span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black shadow-md cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 md:p-7 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-500">
              <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-base md:text-lg text-foreground">Confirm Delete</h3>
                <p className="text-xs text-muted-foreground font-medium">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-foreground font-medium">
              Are you sure you want to delete <span className="font-black text-rose-600 dark:text-rose-400">"{selectedProject.name}"</span> from the pipeline list?
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setSelectedProject(null); }}
                className="px-6 py-2.5 rounded-xl bg-muted font-bold cursor-pointer text-foreground hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-7 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-md cursor-pointer transition active:scale-95"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
