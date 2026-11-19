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
  Search,
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

export interface ChartOfGroupItem {
  id: number;
  uuid: string;
  code: string;
  name: string;
  under: string;
  chartOfSection?: string;
  reportSection?: string;
  hasDelete?: boolean;
}

export interface GroupFormData {
  code: string;
  name: string;
  under: string;
  chartOfSection: string;
  reportSection: string;
}

const UNDER_OPTIONS = ["Assets", "Liabilities", "Equity", "Income", "Expenses"];
const SECTION_OPTIONS = ["Balance Sheet", "Profit & Loss", "Cash Flow"];

export default function ChartOfGroupPage() {
  const [groups, setGroups] = useState<ChartOfGroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters & Pagination
  const [underFilter, setUnderFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editUuid, setEditUuid] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<GroupFormData>({
    code: "",
    name: "",
    under: "Assets",
    chartOfSection: "Balance Sheet",
    reportSection: "",
  });

  // Helper: Auto-generate Group Code (e.g. COG-1001, COG-1002, ...)
  const generateGroupCode = (existingList: ChartOfGroupItem[] = groups) => {
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
    return `COG-${maxNum + rand}`;
  };

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/chart-of-groups?limit=100`, {
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
      toast.error("Failed to fetch chart of groups.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Modal Handlers
  const openAddModal = () => {
    setModalMode("add");
    setEditUuid(null);
    const newCode = generateGroupCode(groups);
    setFormData({
      code: newCode,
      name: "",
      under: "Assets",
      chartOfSection: "Balance Sheet",
      reportSection: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: ChartOfGroupItem) => {
    setModalMode("edit");
    setEditUuid(item.uuid);
    setFormData({
      code: item.code,
      name: item.name,
      under: item.under || "Assets",
      chartOfSection: item.chartOfSection || "Balance Sheet",
      reportSection: item.reportSection || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditUuid(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "under") {
        if (value === "Assets" || value === "Liabilities" || value === "Equity") {
          updated.chartOfSection = "Balance Sheet";
        } else {
          updated.chartOfSection = "Profit & Loss";
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let url = `${API_BASE}/chart-of-groups`;
      let method = "POST";
      let payload: any = {};

      if (modalMode === "add") {
        payload = {
          code: formData.code,
          name: formData.name,
          under: formData.under,
          chartOfSection: formData.chartOfSection,
          reportSection: formData.reportSection || `${formData.name} Section`,
          hasDelete: true,
        };
      } else {
        url = `${API_BASE}/chart-of-groups/${editUuid}`;
        method = "PATCH";
        payload = {
          name: formData.name,
          under: formData.under,
          chartOfSection: formData.chartOfSection,
          reportSection: formData.reportSection,
        };
      }

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success || response.ok) {
        toast.success(
          modalMode === "add"
            ? "Chart of Group created successfully!"
            : "Chart of Group updated successfully!"
        );
        await fetchGroups();
        closeModal();
      } else {
        const errorMsg =
          result.message ||
          (result.errors && result.errors[0]?.errors?.[0]) ||
          "Failed to save group.";
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;
    const toastId = toast.loading("Deleting group...");

    try {
      const response = await fetch(`${API_BASE}/chart-of-groups/${uuid}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const result = await response.json();
      if (result.success || response.ok) {
        toast.success("Group deleted successfully!", { id: toastId });
        await fetchGroups();
      } else {
        toast.error(result.message || "Failed to delete group", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while deleting.", { id: toastId });
    }
  };

  // Filtered & Paginated
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchesSearch =
        !searchTerm.trim() ||
        g.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.under?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUnder = !underFilter || g.under === underFilter;
      return matchesSearch && matchesUnder;
    });
  }, [groups, searchTerm, underFilter]);

  const totalPages = Math.ceil(filteredGroups.length / entriesPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredGroups.slice(start, start + entriesPerPage);
  }, [filteredGroups, currentPage, entriesPerPage]);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Chart of Groups</h1>
          <p className="text-xs text-slate-500 mt-1">
            Accounts &gt; Configuration &gt; Chart of Groups
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Group
          </button>
          <button
            onClick={fetchGroups}
            className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Controls Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Under (Category)
            </label>
            <PredictiveSearchSelect
              value={underFilter}
              onChange={(value) => {
                setUnderFilter(value);
                setCurrentPage(1);
              }}
              options={[{ value: "", label: "All Categories" }, ...UNDER_OPTIONS.map((u) => ({ value: u, label: u }))]}
              placeholder="Search category..."
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search code, group name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Show Entries
            </label>
            <PredictiveSearchSelect
              value={String(entriesPerPage)}
              onChange={(value) => {
                setEntriesPerPage(Number(value) || 10);
                setCurrentPage(1);
              }}
              options={[
                { value: "10", label: "10" },
                { value: "25", label: "25" },
                { value: "50", label: "50" },
              ]}
              placeholder="Entries"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3 text-center w-12">#</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Group Name</th>
                <th className="px-4 py-3">Under</th>
                <th className="px-4 py-3">Chart of Section</th>
                <th className="px-4 py-3">Report Section</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                    <p className="text-xs text-slate-400 mt-2">Loading chart of groups...</p>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No chart of groups found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr key={item.uuid || item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-center font-medium text-slate-400">
                      {(currentPage - 1) * entriesPerPage + idx + 1}
                    </td>
                    <td className="px-4 py-3 font-semibold text-indigo-600">
                      {item.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {item.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.under}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.chartOfSection || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {item.reportSection || "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.uuid)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing {filteredGroups.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to{" "}
            {Math.min(currentPage * entriesPerPage, filteredGroups.length)} of {filteredGroups.length} entries
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 py-1 font-semibold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm">
                {modalMode === "add" ? "Add New Chart of Group" : "Edit Chart of Group"}
              </h3>
              <button
                onClick={closeModal}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs md:text-sm">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-700">
                    Group Code <span className="text-rose-500">*</span>
                  </label>
                  {modalMode === "add" && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          code: generateGroupCode(groups),
                        }))
                      }
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
                  disabled={modalMode === "edit"}
                  placeholder="e.g. COG-103"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Group Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Administrative Expenses"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Under (Classification) <span className="text-rose-500">*</span>
                </label>
                <PredictiveSearchSelect
                  name="under"
                  value={formData.under}
                  onChange={(value) => handleInputChange({ target: { name: "under", value } } as React.ChangeEvent<HTMLSelectElement>)}
                  options={UNDER_OPTIONS.map((u) => ({ value: u, label: u }))}
                  placeholder="Search classification..."
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Chart Of Section <span className="text-rose-500">*</span>
                </label>
                <PredictiveSearchSelect
                  name="chartOfSection"
                  value={formData.chartOfSection}
                  onChange={(value) => setFormData((prev) => ({ ...prev, chartOfSection: value }))}
                  options={SECTION_OPTIONS.map((s) => ({ value: s, label: s }))}
                  placeholder="Search chart section..."
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Report Section
                </label>
                <input
                  type="text"
                  name="reportSection"
                  placeholder="e.g. Operating Expenses"
                  value={formData.reportSection}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {modalMode === "add" ? "Save Group" : "Update Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
