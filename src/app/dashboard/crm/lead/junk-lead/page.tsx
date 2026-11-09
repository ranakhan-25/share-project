"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Phone,
  Trash2,
  RotateCcw,
  CheckSquare,
  Square,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  UserX
} from "lucide-react";
import { crmLeadApi } from "@/services/crmLeadApi";

interface JunkLeadRecord {
  id: string;
  leadId: string;
  name: string;
  address?: string;
  phone: string;
  status: string;
  officer: string;
  lastActivity?: string;
  note: string;
  category?: string;
}

const mockJunkData: JunkLeadRecord[] = [
  {
    id: "junk-1",
    leadId: "L261001-001",
    name: "adv moni",
    address: "",
    phone: "18194278604",
    status: "Inactive",
    officer: "Admin",
    lastActivity: "",
    note: "not interested",
    category: "Ready Flat",
  },
];

export default function JunkLeadPage() {
  const [junkLeads, setJunkLeads] = useState<JunkLeadRecord[]>([]);
  const refreshJunkLeads = async () => {
    try {
      const result = await crmLeadApi.listAllJunk();
      setJunkLeads(result.data.map((row: any) => ({ id: row.id, leadId: row.leadId, name: row.name, address: row.address, phone: row.phone, status: row.status ?? "Junk", officer: row.srOfficer, lastActivity: row.lastActivity, note: row.remark, category: row.leadCategory })));
    } catch (error) { console.error("Failed to load junk leads", error); setJunkLeads([]); }
  };
  useEffect(() => { void refreshJunkLeads(); }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState("1 October, 2026 - 31 October, 2026");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Delete Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<JunkLeadRecord | null>(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  const handleSelectAll = () => {
    if (selectedLeads.length === currentTableData.length && currentTableData.length > 0) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(currentTableData.map((item) => item.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter((item) => item !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  const handleRestoreLead = async (item: JunkLeadRecord) => {
    try { await crmLeadApi.restoreJunk(item.id); await refreshJunkLeads(); setSelectedLeads((prev) => prev.filter((id) => id !== item.id)); }
    catch (error) { console.error("Failed to restore junk lead", error); }
  };

  const handleRestoreSelected = async () => {
    if (selectedLeads.length === 0) return;
    try { await crmLeadApi.bulkJunkAction("restore", selectedLeads); await refreshJunkLeads(); setSelectedLeads([]); }
    catch (error) { console.error("Failed to restore selected junk leads", error); }
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    try {
      if (isBulkDelete) { await crmLeadApi.bulkJunkAction("delete", selectedLeads); setSelectedLeads([]); }
      else if (leadToDelete) { await crmLeadApi.deleteJunk(leadToDelete.id); setSelectedLeads((prev) => prev.filter((id) => id !== leadToDelete.id)); }
      await refreshJunkLeads(); setShowDeleteModal(false); setLeadToDelete(null); setIsBulkDelete(false);
    } catch (error) { console.error("Failed to delete junk leads", error); }
  };

  const filteredData = junkLeads.filter((item) => {
    const search = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search) ||
      item.phone.includes(search) ||
      item.leadId.toLowerCase().includes(search);

    const matchesCategory =
      !selectedCategory ||
      (item.category && item.category.toLowerCase() === selectedCategory.toLowerCase());

    const matchesUser =
      !selectedUser ||
      (item.officer && item.officer.toLowerCase() === selectedUser.toLowerCase());

    return matchesSearch && matchesCategory && matchesUser;
  });

  const totalEntries = filteredData.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const currentTableData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

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
          <span key="dots1" className="px-1 text-muted-foreground font-bold text-xs">...</span>
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
          <span key="dots2" className="px-1 text-muted-foreground font-bold text-xs">...</span>
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

  return (
    <div className="w-full space-y-6 p-4 md:p-6 bg-slate-50/50 dark:bg-background min-h-screen text-foreground font-sans">
      
      {/* BREADCRUMB & HEADER */}
      <div className="flex flex-col gap-5 rounded-3xl border border-border/85 bg-card/70 backdrop-blur-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Sparkles size={18} /> Call Center Management
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mt-1">
              Junk Leads Directory
            </h1>
          </div>
        </div>
      </div>

      {/* TOP FILTERS SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 md:p-5 rounded-2xl border border-border/80 bg-card shadow-xs">
        <div>
          <label className="block font-bold text-muted-foreground mb-1.5 text-xs">Select Date</label>
          <input
            type="text"
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label className="block font-bold text-muted-foreground mb-1.5 text-xs">Lead Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border text-sm font-extrabold outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="">Select Category</option>
            <option value="Ready Flat">Ready Flat</option>
            <option value="On going">On going</option>
            <option value="Upcoming">Upcoming</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-muted-foreground mb-1.5 text-xs">Users</label>
          <select
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border text-sm font-extrabold outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="">Select Users</option>
            <option value="Admin">Admin</option>
            <option value="Mohin">Mohin</option>
            <option value="Tazmul Reza">Tazmul Reza</option>
          </select>
        </div>
      </div>

      {/* SHOW ENTRIES & SEARCH BAR */}
      <div className="p-4 md:p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-extrabold text-muted-foreground w-full sm:w-auto">
          <span>Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border rounded-xl bg-background border-border text-foreground font-black text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
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
            placeholder="Search name, phone, lead ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none bg-background border-border text-sm font-bold focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* JUNK LEADS TABLE */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/80 text-white font-black uppercase text-xs tracking-wider bg-gradient-to-r from-indigo-600 to-violet-600">
                <th className="p-4 w-12 text-center">SL</th>
                
                <th className="p-4 min-w-[150px]">
                  <div className="flex items-center gap-2">
                    <button onClick={handleSelectAll} className="flex items-center gap-2 hover:opacity-90 cursor-pointer">
                      {selectedLeads.length === currentTableData.length && currentTableData.length > 0 ? (
                        <CheckSquare size={16} />
                      ) : (
                        <Square size={16} className="text-white/80" />
                      )}
                      <span>SELECT ALL</span>
                    </button>
                  </div>

                  {selectedLeads.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        onClick={() => { setIsBulkDelete(true); setShowDeleteModal(true); }}
                        className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs flex items-center gap-1 text-[11px] font-black cursor-pointer"
                        title="Delete Selected"
                      >
                        <Trash2 size={12} /> Delete ({selectedLeads.length})
                      </button>
                      <button
                        onClick={handleRestoreSelected}
                        className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition shadow-xs flex items-center gap-1 text-[11px] font-black cursor-pointer"
                        title="Restore Selected"
                      >
                        <RotateCcw size={12} /> Restore
                      </button>
                    </div>
                  )}
                </th>

                <th className="p-4 min-w-[200px]">NAME</th>
                <th className="p-4 min-w-[140px]">MOBILE</th>
                <th className="p-4 min-w-[110px]">STATUS</th>
                <th className="p-4 min-w-[130px]">OFFICER/USER</th>
                <th className="p-4 min-w-[160px]">LAST ACTIVITY</th>
                <th className="p-4 min-w-[160px]">NOTE</th>
                <th className="p-4 text-center min-w-[150px]">ACTION</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60 font-semibold text-foreground text-sm">
              {currentTableData.length > 0 ? (
                currentTableData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-center text-muted-foreground">
                      {indexOfFirstItem + index + 1}
                    </td>

                    <td className="p-4">
                      <button onClick={() => handleSelectOne(item.id)} className="cursor-pointer">
                        {selectedLeads.includes(item.id) ? (
                          <CheckSquare size={18} className="text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <Square size={18} className="text-muted-foreground/60" />
                        )}
                      </button>
                    </td>

                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <UserX size={16} />
                        </div>
                        <div>
                          <div className="font-extrabold text-base text-foreground">{item.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">ID: {item.leadId}</div>
                        </div>
                      </div>
                      {item.address && (
                        <div className="text-xs text-muted-foreground font-semibold pl-9">
                          Address: {item.address}
                        </div>
                      )}
                    </td>

                    <td className="p-4 font-mono font-black text-foreground">+880{item.phone}</td>
                    
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase border bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">
                        {item.status}
                      </span>
                    </td>

                    <td className="p-4 font-bold text-muted-foreground">{item.officer}</td>
                    <td className="p-4 font-medium text-muted-foreground whitespace-pre-line">{item.lastActivity || "—"}</td>
                    <td className="p-4 font-medium text-muted-foreground">{item.note || "—"}</td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <a
                          href={`tel:+880${item.phone}`}
                          className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500 hover:text-white dark:text-indigo-400 dark:hover:text-white border border-indigo-500/20 transition-all duration-200 active:scale-95 cursor-pointer"
                          title="Call Direct"
                        >
                          <Phone size={16} />
                        </a>

                        <button
                          onClick={() => { setLeadToDelete(item); setIsBulkDelete(false); setShowDeleteModal(true); }}
                          className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white dark:text-rose-400 dark:hover:text-white border border-rose-500/20 transition-all duration-200 active:scale-95 cursor-pointer"
                          title="Delete Permanently"
                        >
                          <Trash2 size={16} />
                        </button>

                        <button
                          onClick={() => handleRestoreLead(item)}
                          className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white dark:text-emerald-400 dark:hover:text-white border border-emerald-500/20 transition-all duration-200 active:scale-95 cursor-pointer"
                          title="Restore Lead"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground font-bold text-sm">
                    No junk leads found.
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

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 md:p-7 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-500">
              <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-base md:text-lg text-foreground">Confirm Permanent Delete</h3>
                <p className="text-xs text-muted-foreground font-medium">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-foreground font-medium">
              {isBulkDelete ? (
                <>Are you sure you want to permanently delete <span className="font-black text-rose-600 dark:text-rose-400">{selectedLeads.length} selected leads</span>?</>
              ) : leadToDelete ? (
                <>Are you sure you want to permanently delete <span className="font-black text-rose-600 dark:text-rose-400">"{leadToDelete.name}"</span>?</>
              ) : null}
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setLeadToDelete(null); setIsBulkDelete(false); }}
                className="px-6 py-2.5 rounded-xl bg-muted font-bold cursor-pointer text-foreground hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-7 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-md cursor-pointer transition active:scale-95"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
