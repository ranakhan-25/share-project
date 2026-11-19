"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  X,
  Copy,
  FileSpreadsheet,
  FileText,
  FileCode,
  ArrowRightToLine,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import PredictiveSearchSelect from "@/components/ui/PredictiveSearchSelect";

// API Base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/realbizpro/api/v1';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('share-project:access-token')
    : '';
  return {
    'Content-Type': 'application/json',
    accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

// Types
export interface ChartOfAccountItem {
  id: number;
  uuid: string;
  code: string;
  name: string;
  openingBalance: string | number;
  under: string;
  chartOfGroupUuid?: string;
  hasDelete?: boolean;
}

export interface AccountFormData {
  code: string;
  name: string;
  openingBalance: string;
  under: string;
}

export default function ChartOfAccountsPage() {
  // States
  const [accountsData, setAccountsData] = useState<ChartOfAccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters & Pagination
  const [groupFilter, setGroupFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editUuid, setEditUuid] = useState<string | null>(null);

  // Form Data State
  const [formData, setFormData] = useState<AccountFormData>({
    code: "",
    name: "",
    openingBalance: "0",
    under: "",
  });

  const [groups, setGroups] = useState<any[]>([]);

  // ==========================================
  // 1. GET API: Fetch Accounts & Groups
  // ==========================================
  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/chart-of-groups`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const result = await response.json();
      const list = result.data?.data || result.data || [];
      if (Array.isArray(list)) {
        setGroups(list);
      }
    } catch (err) {
      console.error("Failed to fetch groups", err);
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/chart-of-accounts`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const result = await response.json();

      if (result.success && result.data) {
        const fetchedData = Array.isArray(result.data) 
          ? result.data 
          : result.data.data || [];
        setAccountsData(fetchedData);
      } else {
        toast.error("Failed to load accounts data.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchGroups();
  }, [fetchAccounts, fetchGroups]);

  // ==========================================
  // 2. POST & PATCH API: Add or Edit
  // ==========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let url = `${API_BASE}/chart-of-accounts`;
      let method = "POST";
      let payload: any = {};

      const matchedGroup = groups.find((g) => g.name === formData.under || g.uuid === formData.under);

      if (modalMode === "add") {
        // POST Payload
        payload = {
          chartOfGroupUuid: matchedGroup?.uuid || groups[0]?.uuid || undefined,
          code: formData.code,
          name: formData.name,
          openingBalance: Number(formData.openingBalance) || 0,
          under: matchedGroup?.name || formData.under,
          hasDelete: true,
        };
      } else {
        // PATCH Payload
        url = `${API_BASE}/chart-of-accounts/${editUuid}`;
        method = "PATCH";
        payload = {
          name: formData.name,
          openingBalance: Number(formData.openingBalance) || 0,
          under: matchedGroup?.name || formData.under,
          chartOfGroupUuid: matchedGroup?.uuid || undefined,
        };
      }

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success || response.ok) {
        toast.success(modalMode === "add" ? "Account created successfully!" : "Account updated successfully!");
        await fetchAccounts();
        closeModal();
      } else {
        const errorMsg = result.message || (result.errors && result.errors[0]?.errors?.[0]) || "Failed to save account.";
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // 3. DELETE API: Delete Account
  // ==========================================
  const handleDelete = async (uuid: string) => {
    if (!window.confirm("Are you sure you want to delete this account?")) return;
    
    const toastId = toast.loading("Deleting account...");

    try {
      const response = await fetch(`${API_BASE}/chart-of-accounts/${uuid}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      
      const result = await response.json();
      
      if (result.success || response.ok) {
        toast.success("Account deleted successfully!", { id: toastId });
        await fetchAccounts();
      } else {
        toast.error(result.message || "Failed to delete", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while deleting.", { id: toastId });
    }
  };

  // ==========================================
  // Helper: Auto Generate Account Code
  // ==========================================
  const generateAccountCode = (existingList: ChartOfAccountItem[] = accountsData) => {
    let maxNum = 1000;
    if (Array.isArray(existingList)) {
      existingList.forEach((item) => {
        if (item.code) {
          const match = item.code.match(/(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          }
        }
      });
    }
    const rand = Math.floor(100 + Math.random() * 900);
    return `COA-${maxNum + rand}`;
  };

  // ==========================================
  // 4. Modal Handlers
  // ==========================================
  const openAddModal = () => {
    setModalMode("add");
    setEditUuid(null);
    const autoCode = generateAccountCode(accountsData);
    setFormData({
      code: autoCode,
      name: "",
      openingBalance: "0",
      under: groups[0]?.name || ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: ChartOfAccountItem) => {
    setModalMode("edit");
    setEditUuid(item.uuid);
    setFormData({
      code: item.code,
      name: item.name,
      openingBalance: String(item.openingBalance),
      under: item.under,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditUuid(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ==========================================
  // 5. SEARCH & FILTER & PAGINATION
  // ==========================================
  const filteredData = useMemo(() => {
    let data = accountsData;

    if (groupFilter) {
      data = data.filter((item) => item.under === groupFilter);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      data = data.filter(
        (item) =>
          item.code.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query) ||
          item.under.toLowerCase().includes(query)
      );
    }

    return data;
  }, [accountsData, groupFilter, searchTerm]);

  const totalEntries = filteredData.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredData.slice(indexOfFirstEntry, indexOfLastEntry);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, groupFilter, entriesPerPage]);

  // Generate Page Numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="h-full w-full bg-slate-50 text-slate-800 p-3 flex flex-col overflow-hidden font-sans select-none relative">
      
      {/* Toast Container */}
      <Toaster position="top-right" reverseOrder={false} />

      {/* Breadcrumb & Top Action */}
      <div className="flex flex-row items-center justify-between gap-2 mb-2 shrink-0">
        <nav className="text-xs md:text-sm text-slate-500 flex items-center gap-1.5 font-medium">
          <span className="text-indigo-600 hover:underline cursor-pointer">Home</span>
          <span>&gt;</span>
          <span className="text-indigo-600 hover:underline cursor-pointer flex items-center gap-0.5">
            Accounts Module <ChevronDown className="w-3.5 h-3.5" />
          </span>
          <span>&gt;</span>
          <span className="text-slate-400 font-normal">Chart of Accounts</span>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={openAddModal}
            className="flex items-center gap-1 px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New
          </button>
          <button onClick={fetchAccounts} className="p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white transition-all shadow-sm active:scale-95 cursor-pointer" title="Refresh">
            <ArrowRightToLine className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Dropdown */}
      <div className="mb-2 shrink-0">
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Chart Of Group(Under)
        </label>
        <PredictiveSearchSelect
          value={groupFilter}
          onChange={setGroupFilter}
          options={[
            { value: "", label: "All Groups" },
            ...groups.map((g) => ({ value: g.name, label: `${g.name} (${g.under})` })),
          ]}
          placeholder="Search group..."
          className="w-full sm:w-64"
        />
      </div>

      {/* Main Table Container */}
      <div className="flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex flex-col overflow-hidden">
        
        {/* Controls (Search & Show Entries) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-2.5 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <button className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-cyan-500 text-white"><Copy className="w-3 h-3" /> Copy</button>
            <button className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-orange-500 text-white"><FileCode className="w-3 h-3" /> CSV</button>
            <button className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-emerald-600 text-white"><FileSpreadsheet className="w-3 h-3" /> Excel</button>
            <button className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-rose-600 text-white"><FileText className="w-3 h-3" /> PDF</button>

            <div className="flex items-center gap-1.5 text-xs md:text-sm text-slate-600 ml-2">
              <span>Show</span>
              <PredictiveSearchSelect
                value={String(entriesPerPage)}
                onChange={(value) => setEntriesPerPage(Number(value) || 10)}
                options={[
                  { value: "10", label: "10" },
                  { value: "25", label: "25" },
                  { value: "50", label: "50" },
                  { value: "100", label: "100" },
                ]}
                placeholder="10"
                className="w-20"
              />
              <span>entries</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600 font-medium">
            <span>Search:</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-48 px-2.5 py-1 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead className="sticky top-0 z-10 bg-indigo-600 text-white font-semibold uppercase tracking-wider text-[11px] md:text-xs">
              <tr>
                <th className="px-3 py-2 border-r border-indigo-400/30 w-12 text-center">SL</th>
                <th className="px-3 py-2 border-r border-indigo-400/30">CODE</th>
                <th className="px-3 py-2 border-r border-indigo-400/30">NAME</th>
                <th className="px-3 py-2 border-r border-indigo-400/30">OPENING BALANCE</th>
                <th className="px-3 py-2 border-r border-indigo-400/30">UNDER</th>
                <th className="px-3 py-2 w-24 text-center">ACTION</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading data...
                  </td>
                </tr>
              ) : currentEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-500">
                    No data available in table
                  </td>
                </tr>
              ) : (
                currentEntries.map((item, index) => (
                  <tr key={item.uuid || item.id} className="hover:bg-slate-50/80 transition-colors odd:bg-slate-50/30">
                    <td className="px-3 py-1.5 text-center text-slate-600 font-medium border-r border-slate-100">{indexOfFirstEntry + index + 1}</td>
                    <td className="px-3 py-1.5 font-medium text-slate-700 whitespace-nowrap border-r border-slate-100">{item.code}</td>
                    <td className="px-3 py-1.5 text-indigo-600 font-medium border-r border-slate-100">{item.name}</td>
                    <td className="px-3 py-1.5 text-slate-600 border-r border-slate-100">{Number(item.openingBalance).toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-indigo-600 border-r border-slate-100">{item.under}</td>

                    <td className="px-3 py-1.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="p-1 rounded bg-cyan-500 hover:bg-cyan-600 text-white transition-colors cursor-pointer" 
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        
                        {item.hasDelete !== false && (
                          <button 
                            onClick={() => handleDelete(item.uuid)}
                            className="p-1 rounded bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer" 
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ==========================================
            PAGINATION CONTROLS (FIXED)
        ========================================== */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100 gap-2">
          <div>
            Showing <span className="font-semibold">{totalEntries > 0 ? indexOfFirstEntry + 1 : 0}</span> to <span className="font-semibold">{Math.min(indexOfLastEntry, totalEntries)}</span> of <span className="font-semibold">{totalEntries}</span> entries
          </div>
          <div className="flex space-x-1 items-center">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-2.5 py-1 border rounded font-medium flex items-center gap-1 ${
                currentPage === 1 
                  ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed" 
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
              }`}
            >
              <ChevronLeft className="w-3 h-3" /> Prev
            </button>
            
            {/* Page Numbers */}
            <div className="flex gap-1">
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-2.5 py-1 border rounded font-medium ${
                    currentPage === page
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`px-2.5 py-1 border rounded font-medium flex items-center gap-1 ${
                currentPage === totalPages || totalPages === 0
                  ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
              }`}
            >
              Next <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ==========================================
          MODAL (ADD & EDIT SHARED)
      ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 shrink-0">
              <h3 className="text-base font-bold text-slate-800">
                {modalMode === "add" ? "Add New Chart of Account" : "Edit Chart of Account"}
              </h3>
              <button onClick={closeModal} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-500 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs md:text-sm">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-700">
                    Code <span className="text-rose-500">*</span>
                  </label>
                  {modalMode === "add" && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, code: generateAccountCode(accountsData) }))}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
                      title="Generate new Code"
                    >
                      <RefreshCcw className="w-3 h-3" /> Auto Generate
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  name="code"
                  required
                  disabled={modalMode === "edit"} // Edit এর সময় Code পরিবর্তন করা যাবে না (API Error ঠেকাতে)
                  placeholder="Auto-generated e.g. COA-1002"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Enter Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Opening Balance</label>
                <input
                  type="number"
                  name="openingBalance"
                  placeholder="0"
                  value={formData.openingBalance}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Chart Of Group (Under) <span className="text-rose-500">*</span></label>
                <PredictiveSearchSelect
                  name="under"
                  value={formData.under}
                  onChange={(value) => setFormData((prev) => ({ ...prev, under: value }))}
                  options={[
                    { value: "", label: "Select Group" },
                    ...(groups.length > 0
                      ? groups.map((g) => ({ value: g.name, label: `${g.name} (${g.under})` }))
                      : [
                          { value: "Current Assets", label: "Current Assets (Assets)" },
                          { value: "Direct Expenses", label: "Direct Expenses (Expenses)" },
                        ]),
                  ]}
                  placeholder="Search account group..."
                  required
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs md:text-sm font-medium rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs md:text-sm font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? "Saving..." : modalMode === "add" ? "Save Account" : "Update Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
