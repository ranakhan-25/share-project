"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  UserCheck,
  MessageSquare,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Users
} from "lucide-react";
import { crmDirectoryApi } from "@/services/crmLeadApi";

interface Party {
  uuid: string;
  name: string;
  phone: string;
  email?: string;
  nid?: string;
  address?: string;
  type: "customer" | "investor" | "vendor" | "other";
  tags: string[];
  assignee?: string;
  assigneeUuid?: string;
  created_at: string;
}

const mockParties: Party[] = [
  {
    uuid: "party-101",
    name: "Engr. Kabir Hossain",
    phone: "1711998877",
    email: "kabir@example.com",
    nid: "1990269123456",
    address: "House 45, Road 12, Dhanmondi, Dhaka",
    type: "customer",
    tags: ["VIP Client", "Ready Buyer"],
    assignee: "Shamim Khan",
    created_at: "2026-10-15",
  },
  {
    uuid: "party-102",
    name: "Apex Properties Ltd",
    phone: "1899112233",
    email: "info@apexprop.com",
    nid: "8877665544",
    address: "Gulshan Avenue, Dhaka",
    type: "investor",
    tags: ["High Net Worth", "Commercial"],
    assignee: "Tanvir Ahmed",
    created_at: "2026-10-18",
  },
];

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [partyUsers, setPartyUsers] = useState<any[]>([]);
  const refreshParties = async () => {
    try { setParties(await crmDirectoryApi.parties() as Party[]); }
    catch (error) { console.error("Failed to load CRM parties", error); setParties([]); }
  };

  // Filters State
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals Control
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCommModal, setShowCommModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Selected Active Party
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);

  // Party Form State (Create & Edit)
  const [partyFormData, setPartyFormData] = useState({
    uuid: "",
    name: "",
    phone: "",
    email: "",
    nid: "",
    address: "",
    type: "customer" as Party["type"],
    tagsInput: "",
  });

  // Assign Form State
  const [assigneeData, setAssigneeData] = useState({
    assignee: "Shamim Khan",
    note: "",
  });

  // Communication Form State
  const [commFormData, setCommFormData] = useState({
    channel: "call",
    direction: "out",
    content: "",
    attachmentName: "",
    at: new Date().toISOString().slice(0, 16),
  });

  // Pagination States
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Load LocalStorage Data
  useEffect(() => {
    Promise.all([refreshParties(), crmDirectoryApi.partyUsers().then(setPartyUsers).catch((error) => { console.error("Failed to load party assignees", error); setPartyUsers([]); })]).finally(() => setIsLoaded(true));
  }, []);

  const saveParties = (data: Party[]) => {
    setParties(data);
  };

  // 2. Open Party Modal (Create or Edit)
  const handleOpenPartyModal = (party?: Party) => {
    if (party) {
      setPartyFormData({
        uuid: party.uuid,
        name: party.name,
        phone: party.phone,
        email: party.email || "",
        nid: party.nid || "",
        address: party.address || "",
        type: party.type,
        tagsInput: party.tags.join(", "),
      });
    } else {
      setPartyFormData({
        uuid: "",
        name: "",
        phone: "",
        email: "",
        nid: "",
        address: "",
        type: "customer",
        tagsInput: "",
      });
    }
    setShowPartyModal(true);
  };

  // Submit Party Form
  const handlePartyFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyFormData.name || !partyFormData.phone) return;

    const tagsArr = partyFormData.tagsInput
      ? partyFormData.tagsInput.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    try { await crmDirectoryApi.saveParty(partyFormData, partyFormData.uuid || undefined); await refreshParties(); setShowPartyModal(false); }
    catch (error) { console.error("Failed to save CRM party", error); }
  };

  // 3. Confirm Delete Party
  const handleConfirmDelete = async () => {
    if (!selectedParty) return;
    try { await crmDirectoryApi.deleteParty(selectedParty.uuid); await refreshParties(); setShowDeleteModal(false); setSelectedParty(null); }
    catch (error) { console.error("Failed to delete CRM party", error); }
  };

  // 4. Submit Assignment Form
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty) return;

    const selectedUser = partyUsers.find((user) => user.uuid === assigneeData.assignee || user.name === assigneeData.assignee);
    if (!selectedUser) return;
    try { await crmDirectoryApi.assignParty(selectedParty.uuid, selectedUser.uuid, assigneeData.note); await refreshParties(); setShowAssignModal(false); }
    catch (error) { console.error("Failed to assign CRM party", error); }
  };

  // 5. Submit Communication Form
  const handleCommSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty || !commFormData.content) return;

    try { await crmDirectoryApi.logPartyCommunication(selectedParty.uuid, commFormData); setShowCommModal(false); setCommFormData({
      channel: "call",
      direction: "out",
      content: "",
      attachmentName: "",
      at: new Date().toISOString().slice(0, 16),
    }); } catch (error) { console.error("Failed to record party communication", error); }
  };

  // Filter Parties
  const filteredParties = parties.filter((p) => {
    const search = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search) ||
      p.phone.includes(search) ||
      (p.email && p.email.toLowerCase().includes(search));

    const matchesType = typeFilter === "all" || p.type === typeFilter;

    return matchesSearch && matchesType;
  });

  // Pagination Calculations
  const totalEntries = filteredParties.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const currentTableData = filteredParties.slice(indexOfFirstItem, indexOfLastItem);

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

  if (!isLoaded) {
    return <div className="p-8 text-center font-bold text-muted-foreground">Loading Parties Directory...</div>;
  }

  return (
    <div className="w-full space-y-6 p-4 md:p-6 bg-slate-50/50 dark:bg-background min-h-screen text-foreground font-sans">
      
      {/* BREADCRUMB & HEADER */}
      <div className="flex flex-col gap-5 rounded-3xl border border-border/85 bg-card/70 backdrop-blur-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Sparkles size={18} /> CRM Party Management
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mt-1">
              Parties Directory
            </h1>
          </div>

          <button
            onClick={() => handleOpenPartyModal()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-black rounded-xl transition flex items-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer w-fit"
          >
            <Plus size={18} /> Add New Party
          </button>
        </div>
      </div>

      {/* TOP FILTERS & SEARCH BAR */}
      <div className="p-4 md:p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-72">
          <label className="block font-bold text-muted-foreground mb-1.5 text-xs">Filter by Type</label>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border text-sm font-extrabold outline-none focus:ring-2 focus:ring-indigo-500/20 capitalize cursor-pointer"
          >
            <option value="all">All Party Types</option>
            <option value="customer">Customer</option>
            <option value="investor">Investor</option>
            <option value="vendor">Vendor</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-4">
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
              placeholder="Search name, phone, email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none bg-background border-border text-sm font-bold focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/80 text-white font-black uppercase text-xs tracking-wider bg-gradient-to-r from-indigo-600 to-violet-600">
                <th className="p-4 w-12 text-center">SL</th>
                <th className="p-4 min-w-[220px]">NAME & ASSIGNEE</th>
                <th className="p-4 min-w-[140px]">MOBILE</th>
                <th className="p-4 min-w-[180px]">EMAIL</th>
                <th className="p-4 min-w-[130px]">TYPE</th>
                <th className="p-4 min-w-[130px]">CREATED AT</th>
                <th className="p-4 text-center min-w-[180px]">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60 font-semibold text-foreground text-sm">
              {currentTableData.length > 0 ? (
                currentTableData.map((party, index) => (
                  <tr key={party.uuid} className="hover:bg-muted/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-center text-muted-foreground">
                      {indexOfFirstItem + index + 1}
                    </td>

                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          <Users size={16} />
                        </div>
                        <span className="font-extrabold text-base text-foreground">{party.name}</span>
                      </div>
                      {party.assignee && (
                        <div className="text-xs text-muted-foreground font-semibold pl-9">
                          Assigned: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{party.assignee}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-4 font-mono font-black text-foreground">+880{party.phone}</td>
                    <td className="p-4 text-muted-foreground font-mono">{party.email || "—"}</td>

                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${
                        party.type === 'customer' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                        party.type === 'investor' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' :
                        party.type === 'vendor' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                        'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
                      }`}>
                        {party.type}
                      </span>
                    </td>

                    <td className="p-4 font-mono text-muted-foreground font-bold">{party.created_at}</td>

                    {/* ACTION BUTTONS */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setSelectedParty(party); setShowViewModal(true); }}
                          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all duration-200 active:scale-95 cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={() => handleOpenPartyModal(party)}
                          className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200/80 dark:border-cyan-800/60 hover:bg-cyan-500 hover:text-white dark:hover:bg-cyan-500 dark:hover:text-white transition-all duration-200 active:scale-95 cursor-pointer"
                          title="Edit Party"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          onClick={() => { setSelectedParty(party); setAssigneeData({ assignee: party.assigneeUuid || "", note: "" }); setShowAssignModal(true); }}
                          className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 hover:bg-purple-500 hover:text-white dark:text-purple-400 dark:hover:text-white border border-purple-500/20 transition-all duration-200 active:scale-95 cursor-pointer"
                          title="Assign Party"
                        >
                          <UserCheck size={16} />
                        </button>

                        <button
                          onClick={() => { setSelectedParty(party); setShowCommModal(true); }}
                          className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white dark:text-blue-400 dark:hover:text-white border border-blue-500/20 transition-all duration-200 active:scale-95 cursor-pointer"
                          title="Log Communication"
                        >
                          <MessageSquare size={16} />
                        </button>

                        <button
                          onClick={() => { setSelectedParty(party); setShowDeleteModal(true); }}
                          className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white dark:text-rose-400 dark:hover:text-white border border-rose-500/20 transition-all duration-200 active:scale-95 cursor-pointer"
                          title="Delete Party"
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
                    No parties match the filter criteria.
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

      {/* 1. PARTY FORM MODAL (Create & Edit) */}
      {showPartyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 md:p-7 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex justify-between items-center border-b border-border pb-3.5">
              <h3 className="font-extrabold text-base md:text-lg text-foreground">
                {partyFormData.uuid ? "Edit Party Profile" : "Create New Party Profile"}
              </h3>
              <button onClick={() => setShowPartyModal(false)} className="cursor-pointer text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>

            <form onSubmit={handlePartyFormSubmit} className="space-y-4 text-sm font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground mb-1.5 font-bold">Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Engr. Kabir Hossain"
                    value={partyFormData.name}
                    onChange={(e) => setPartyFormData({ ...partyFormData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border outline-none font-semibold text-foreground focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1.5 font-bold">Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="1711XXXXXX"
                    value={partyFormData.phone}
                    onChange={(e) => setPartyFormData({ ...partyFormData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border outline-none font-mono font-semibold text-foreground focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground mb-1.5 font-bold">Email</label>
                  <input
                    type="email"
                    placeholder="client@example.com"
                    value={partyFormData.email}
                    onChange={(e) => setPartyFormData({ ...partyFormData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border outline-none font-semibold text-foreground focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1.5 font-bold">NID Number</label>
                  <input
                    type="text"
                    placeholder="National ID"
                    value={partyFormData.nid}
                    onChange={(e) => setPartyFormData({ ...partyFormData, nid: e.target.value })}
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border outline-none font-mono font-semibold text-foreground focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1.5 font-bold">Party Type *</label>
                <select
                  value={partyFormData.type}
                  onChange={(e) => setPartyFormData({ ...partyFormData, type: e.target.value as Party["type"] })}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border outline-none font-extrabold capitalize text-foreground focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  <option value="customer">Customer</option>
                  <option value="investor">Investor</option>
                  <option value="vendor">Vendor</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1.5 font-bold">Address</label>
                <textarea
                  rows={2}
                  placeholder="Full physical address..."
                  value={partyFormData.address}
                  onChange={(e) => setPartyFormData({ ...partyFormData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border outline-none resize-none font-semibold text-foreground focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1.5 font-bold">Tags (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="VIP Client, Commercial"
                  value={partyFormData.tagsInput}
                  onChange={(e) => setPartyFormData({ ...partyFormData, tagsInput: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border outline-none font-semibold text-foreground focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setShowPartyModal(false)} className="px-6 py-2.5 rounded-xl bg-muted font-bold cursor-pointer text-foreground">
                  Cancel
                </button>
                <button type="submit" className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black shadow-md cursor-pointer">
                  Save Party
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ASSIGNMENT MODAL */}
      {showAssignModal && selectedParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 md:p-7 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex justify-between items-center border-b border-border pb-3.5">
              <h3 className="font-extrabold text-base md:text-lg text-foreground">Assign Party ({selectedParty.name})</h3>
              <button onClick={() => setShowAssignModal(false)} className="cursor-pointer text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4 text-sm font-semibold">
              <div>
                <label className="block text-muted-foreground mb-1.5 font-bold">Assignee *</label>
                <select
                  value={assigneeData.assignee}
                  onChange={(e) => setAssigneeData({ ...assigneeData, assignee: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border outline-none font-bold text-foreground focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  {partyUsers.map((user: any) => <option key={user.uuid} value={user.uuid}>{user.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1.5 font-bold">Note</label>
                <textarea
                  rows={2}
                  placeholder="Assignment notes..."
                  value={assigneeData.note}
                  onChange={(e) => setAssigneeData({ ...assigneeData, note: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border outline-none resize-none font-semibold text-foreground focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-6 py-2.5 rounded-xl bg-muted font-bold cursor-pointer text-foreground">
                  Cancel
                </button>
                <button type="submit" className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black shadow-md cursor-pointer">
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. COMMUNICATION FORM MODAL */}
      {showCommModal && selectedParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 md:p-7 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex justify-between items-center border-b border-border pb-3.5">
              <h3 className="font-extrabold text-base md:text-lg text-foreground">Log Communication - {selectedParty.name}</h3>
              <button onClick={() => setShowCommModal(false)} className="cursor-pointer text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>

            <form onSubmit={handleCommSubmit} className="space-y-4 text-sm font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground mb-1.5 font-bold">Channel *</label>
                  <select
                    value={commFormData.channel}
                    onChange={(e) => setCommFormData({ ...commFormData, channel: e.target.value })}
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border outline-none font-bold capitalize text-foreground focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    <option value="call">Call</option>
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="meeting">Meeting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground mb-1.5 font-bold">Direction *</label>
                  <select
                    value={commFormData.direction}
                    onChange={(e) => setCommFormData({ ...commFormData, direction: e.target.value })}
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border outline-none font-bold text-foreground focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    <option value="in">Inbound (Received)</option>
                    <option value="out">Outbound (Sent)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1.5 font-bold">Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={commFormData.at}
                  onChange={(e) => setCommFormData({ ...commFormData, at: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border outline-none font-mono font-semibold text-foreground focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1.5 font-bold">Content / Summary *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Details of discussion..."
                  value={commFormData.content}
                  onChange={(e) => setCommFormData({ ...commFormData, content: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-background border-border outline-none resize-none font-semibold text-foreground focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setShowCommModal(false)} className="px-6 py-2.5 rounded-xl bg-muted font-bold cursor-pointer text-foreground">
                  Cancel
                </button>
                <button type="submit" className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black shadow-md cursor-pointer">
                  Log Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. VIEW PARTY PROFILE MODAL */}
      {showViewModal && selectedParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 md:p-7 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex justify-between items-center border-b border-border pb-3.5">
              <h3 className="font-extrabold text-base md:text-lg text-foreground">{selectedParty.name}</h3>
              <button onClick={() => setShowViewModal(false)} className="cursor-pointer text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>

            <div className="space-y-3 text-sm font-semibold">
              <div className="flex justify-between p-3.5 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-mono font-bold text-foreground">+880{selectedParty.phone}</span>
              </div>
              <div className="flex justify-between p-3.5 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-mono font-bold text-foreground">{selectedParty.email || "N/A"}</span>
              </div>
              <div className="flex justify-between p-3.5 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-muted-foreground">NID:</span>
                <span className="font-mono font-bold text-foreground">{selectedParty.nid || "N/A"}</span>
              </div>
              <div className="flex justify-between p-3.5 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-muted-foreground">Type:</span>
                <span className="uppercase font-extrabold text-indigo-600 dark:text-indigo-400">{selectedParty.type}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 space-y-1">
                <span className="text-muted-foreground block font-bold">Address:</span>
                <span className="text-foreground font-medium">{selectedParty.address || "No address provided"}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 space-y-1">
                <span className="text-muted-foreground block font-bold">Tags:</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedParty.tags.map((t) => (
                    <span key={t} className="px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-black uppercase border border-indigo-500/20">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <button onClick={() => setShowViewModal(false)} className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black shadow-md cursor-pointer">
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. DELETE CONFIRMATION MODAL */}
      {showDeleteModal && selectedParty && (
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
              Are you sure you want to delete <span className="font-black text-rose-600 dark:text-rose-400">"{selectedParty.name}"</span> from the parties directory?
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setSelectedParty(null); }}
                className="px-6 py-2.5 rounded-xl bg-muted font-bold cursor-pointer text-foreground hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-7 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-md cursor-pointer transition active:scale-95"
              >
                Delete Party
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
