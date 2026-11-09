"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import {
  Plus,
  ChevronDown,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  FileText,
  Search,
  RotateCcw,
} from "lucide-react";

// Types structured for future API integration
export interface ContraVoucherItem {
  id: string;
  uuid: string;
  sl: number;
  date: string;
  type: string;
  code: string;
  debit: number;
  credit: number;
  total: number;
  comment: string;
  addedBy: string;
  editedBy: string;
  approveStatus: string;
  attachment: string | null;
  status: "Approved" | "Pending" | "Rejected";
}

export default function ContraVoucherListPage() {
  const [loading, setLoading] = useState(false);
  const [deletingUuid, setDeletingUuid] = useState("");
  // --- Filter State ---
  const [filters, setFilters] = useState({
    dateRange: "1 September, 2026 - 30 September, 2026",
    debitAccount: "",
    creditAccount: "",
    project: "",
    site: "",
    task: "",
  });

  // --- Table Controls State ---
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // --- Voucher List State (Ready for API response payload) ---
  const [vouchers, setVouchers] = useState<ContraVoucherItem[]>([]);

  const unwrapRecords = (result: Record<string, unknown>): Record<string, unknown>[] => {
    const nested = result.data as Record<string, unknown> | unknown[] | undefined;
    if (Array.isArray(nested)) return nested as Record<string, unknown>[];
    if (nested && typeof nested === "object") {
      const data = (nested as Record<string, unknown>).data;
      if (Array.isArray(data)) return data as Record<string, unknown>[];
      const items = (nested as Record<string, unknown>).items;
      if (Array.isArray(items)) return items as Record<string, unknown>[];
    }
    if (Array.isArray(result.items)) return result.items as Record<string, unknown>[];
    return [];
  };

  const requestJson = async (url: string, method = "GET", payload?: unknown) => {
    const response = await fetch(url, {
      method,
      headers: payload ? { "Content-Type": "application/json" } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false) {
      throw new Error(result.message || result.error || `Request failed (${response.status}).`);
    }
    return result;
  };

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const result = await requestJson("/api/backend/contra-vouchers");
      const records = unwrapRecords(result);
      setVouchers(records.map((record, index) => {
        const status = String(record.status ?? "Pending");
        return {
          id: String(record.uuid ?? record.id ?? index),
          uuid: String(record.uuid ?? record.id ?? ""),
          sl: Number(record.sl ?? index + 1),
          date: String(record.date ?? record.voucherDate ?? ""),
          type: String(record.type ?? "Contra"),
          code: String(record.voucherNo ?? record.code ?? record.voucherCode ?? `CV-${index + 1}`),
          debit: Number(record.totalDebit ?? record.debit ?? 0),
          credit: Number(record.totalCredit ?? record.credit ?? 0),
          total: Number(record.total ?? record.totalDebit ?? record.totalAmount ?? 0),
          comment: String(record.comment ?? record.note ?? "—"),
          addedBy: String(record.addedBy ?? record.createdBy ?? "—"),
          editedBy: String(record.editedBy ?? record.updatedBy ?? "—"),
          approveStatus: String(record.approveStatus ?? record.approvalStatus ?? status),
          attachment: record.attachment ? String(record.attachment) : null,
          status: status === "Approved" ? "Approved" : status === "Rejected" ? "Rejected" : "Pending",
        };
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Contra vouchers could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchVouchers();
  }, []);

  const deleteVoucher = async (row: ContraVoucherItem) => {
    if (!row.uuid || !confirm(`Delete voucher ${row.code}?`)) return;
    setDeletingUuid(row.uuid);
    try {
      await requestJson(`/api/backend/contra-vouchers/${encodeURIComponent(row.uuid)}`, "DELETE");
      toast.success(`Voucher ${row.code} deleted successfully.`);
      await fetchVouchers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Contra voucher could not be deleted.");
    } finally {
      setDeletingUuid("");
      setActiveDropdownId(null);
    }
  };

  const restoreVoucher = async (row: ContraVoucherItem) => {
    if (!row.uuid) return;
    try {
      await requestJson(`/api/backend/contra-vouchers/${encodeURIComponent(row.uuid)}/restore`, "PATCH");
      toast.success(`Voucher ${row.code} restored successfully.`);
      await fetchVouchers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Contra voucher could not be restored.");
    } finally {
      setActiveDropdownId(null);
    }
  };

  // Toggle Action Dropdown
  const toggleActionDropdown = (id: string) => {
    setActiveDropdownId((prev) => (prev === id ? null : id));
  };

  // Filtered List Logic
  const filteredVouchers = vouchers.filter((v) =>
    Object.values(v).some((val) =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 p-2.5 text-xs flex flex-col justify-between">
      <Toaster position="top-right" />
      <div>
        {/* Top Header Navigation & Add New Button */}
        <div className="flex items-center justify-between gap-2 mb-3 w-full">
          <nav className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium truncate">
            <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Home
            </Link>
            <span>&gt;</span>
            <span className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer">
              Accounts Module <ChevronDown className="w-3 h-3" />
            </span>
            <span>&gt;</span>
            <span className="text-slate-400 font-normal truncate">Contra Voucher List</span>
          </nav>

          {/* Add New Link Button */}
          <Link
            href="/dashboard/accounts/voucher/contra-voucher/add-new"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-[#635BFF] hover:bg-indigo-700 text-white transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New
          </Link>
        </div>

        {/* Filter Inputs Section */}
        <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 p-3 mb-3 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-2.5">
            {/* Select Date */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Select Date
              </label>
              <input
                type="text"
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 text-xs"
              />
            </div>

            {/* Debit Accounts */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Debit Accounts
              </label>
              <select
                value={filters.debitAccount}
                onChange={(e) => setFilters({ ...filters, debitAccount: e.target.value })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 text-xs"
              >
                <option value="">Select Chart Of Account</option>
                <option value="Cash in Hand">Cash in Hand</option>
                <option value="Bank Account">Bank Account</option>
              </select>
            </div>

            {/* Credit Accounts */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Credit Accounts
              </label>
              <select
                value={filters.creditAccount}
                onChange={(e) => setFilters({ ...filters, creditAccount: e.target.value })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 text-xs"
              >
                <option value="">Select Chart Of Account</option>
                <option value="Cash in Hand">Cash in Hand</option>
                <option value="Bank Account">Bank Account</option>
              </select>
            </div>

            {/* Select Project */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Select Project
              </label>
              <select
                value={filters.project}
                onChange={(e) => setFilters({ ...filters, project: e.target.value })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 text-xs"
              >
                <option value="">Select Project</option>
                <option value="Tower A">Tower A</option>
                <option value="Plaza B">Plaza B</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Site */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Site
              </label>
              <select
                value={filters.site}
                onChange={(e) => setFilters({ ...filters, site: e.target.value })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 text-xs"
              >
                <option value="">Select Site</option>
                <option value="Dhaka Site">Dhaka Site</option>
                <option value="Chittagong Site">Chittagong Site</option>
              </select>
            </div>

            {/* Task */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Task
              </label>
              <select
                value={filters.task}
                onChange={(e) => setFilters({ ...filters, task: e.target.value })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 text-xs"
              >
                <option value="">Select Task</option>
                <option value="Foundation">Foundation</option>
                <option value="Finishing">Finishing</option>
              </select>
            </div>
          </div>
        </div>

        {/* Entry Control & Search Bar */}
        <div className="flex items-center justify-between gap-2 mb-2 w-full">
          <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400">
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-0.5 outline-none text-xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-600 dark:text-slate-400">Search:</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1 outline-none text-xs focus:border-indigo-500 w-36 sm:w-48"
            />
          </div>
        </div>

        {/* Full-Width Table (No horizontal scroll strictly engineered) */}
        <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 overflow-visible mb-3 shadow-xs">
          <table className="w-full table-fixed text-left border-collapse text-[11px]">
            <thead className="bg-[#635BFF] text-white font-semibold uppercase text-[9px] tracking-tight">
              <tr>
                <th className="w-[4%] px-1 py-2 text-center">SL</th>
                <th className="w-[8%] px-1.5 py-2">DATE</th>
                <th className="w-[6%] px-1 py-2">TYPE</th>
                <th className="w-[7%] px-1.5 py-2">CODE</th>
                <th className="w-[8%] px-1.5 py-2">DEBIT</th>
                <th className="w-[8%] px-1.5 py-2">CREDIT</th>
                <th className="w-[8%] px-1.5 py-2">TOTAL</th>
                <th className="w-[14%] px-1.5 py-2">COMMENT</th>
                <th className="w-[8%] px-1.5 py-2">ADDED BY</th>
                <th className="w-[8%] px-1.5 py-2">EDITED BY</th>
                <th className="w-[8%] px-1.5 py-2">APPROVE</th>
                <th className="w-[7%] px-1 py-2">ATTACHMENT</th>
                <th className="w-[6%] px-1 py-2 text-center">STATUS</th>
                <th className="w-[8%] px-1 py-2 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {filteredVouchers.length > 0 ? (
                filteredVouchers.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-1 py-2 text-center font-medium truncate">{row.sl}</td>
                    <td className="px-1.5 py-2 truncate">{row.date}</td>
                    <td className="px-1 py-2 truncate">{row.type}</td>
                    <td className="px-1.5 py-2 font-medium text-indigo-600 dark:text-indigo-400 truncate">
                      {row.code}
                    </td>
                    <td className="px-1.5 py-2 truncate">{row.debit.toFixed(2)}</td>
                    <td className="px-1.5 py-2 truncate">{row.credit.toFixed(2)}</td>
                    <td className="px-1.5 py-2 font-semibold truncate">{row.total.toFixed(2)}</td>
                    <td className="px-1.5 py-2 truncate">{row.comment}</td>
                    <td className="px-1.5 py-2 truncate">{row.addedBy}</td>
                    <td className="px-1.5 py-2 truncate">{row.editedBy}</td>
                    <td className="px-1.5 py-2 truncate">{row.approveStatus}</td>
                    <td className="px-1 py-2 truncate">
                      {row.attachment ? (
                        <span className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">
                          <FileText className="w-3 h-3" />
                          View
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-1 py-2 text-center truncate">
                      <span
                        className={`px-1.5 py-0.5 text-[9px] rounded font-semibold ${
                          row.status === "Approved"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    {/* Action Dropdown Column */}
                    <td className="px-1 py-2 text-center relative">
                      <button
                        type="button"
                        onClick={() => toggleActionDropdown(row.id)}
                        className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium inline-flex items-center gap-1 text-[10px] cursor-pointer"
                      >
                        Action <ChevronDown className="w-3 h-3" />
                      </button>

                      {/* Floating Dropdown Menu */}
                      {activeDropdownId === row.id && (
                        <div className="absolute right-2 mt-1 w-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-lg z-50 py-1 text-left animate-in fade-in duration-100">
                          <Link
                            href={`/dashboard/accounts/voucher/contra-voucher/add-new?uuid=${encodeURIComponent(row.uuid)}&mode=view`}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Eye className="w-3 h-3 text-slate-400" /> View
                          </Link>
                          <Link
                            href={`/dashboard/accounts/voucher/contra-voucher/add-new?uuid=${encodeURIComponent(row.uuid)}`}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit className="w-3 h-3" /> Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => void deleteVoucher(row)}
                            disabled={deletingUuid === row.uuid}
                            className="w-full flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => void restoreVoucher(row)}
                            className="w-full flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" /> Restore
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={14} className="px-3 py-4 text-center text-slate-400 italic">
                    No data available in table
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-4">
          <div>
            Showing {filteredVouchers.length > 0 ? 1 : 0} to {filteredVouchers.length} of{" "}
            {filteredVouchers.length} entries
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled
              className="px-3 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed text-xs"
            >
              Previous
            </button>
            <button
              disabled
              className="px-3 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed text-xs"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between text-[9px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800 mt-auto">
        <div>2026 © Somikoron IT LTD</div>
        <div>Design &amp; Developed by Somikoron IT LTD</div>
      </footer>
    </div>
  );
}