"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { ChevronDown, Plus, Trash2, X, ArrowUpDown, FileText, Copy, Pencil, RotateCcw } from "lucide-react";

export interface ChequeRangeItem {
  id: number;
  uuid: string;
  cashBank: string;
  name: string;
  fromNumber: number;
  toNumber: number;
  numberOfCheque: number;
  addedBy: string;
}

export default function ChequeRangePage() {
  // Main Data State (API ready)
  const [items, setItems] = useState<ChequeRangeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingUuid, setEditingUuid] = useState("");

  // Table Filter & Search States
  const [cashBankFilter, setCashBankFilter] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalChartOfAccount, setModalChartOfAccount] = useState("");
  const [modalName, setModalName] = useState("");
  const [modalFromNumber, setModalFromNumber] = useState("");
  const [modalToNumber, setModalToNumber] = useState("");

  const unwrapRecords = (result: Record<string, unknown>): Record<string, unknown>[] => {
    const nested = result.data as Record<string, unknown> | unknown[] | undefined;
    if (Array.isArray(nested)) return nested as Record<string, unknown>[];
    if (nested && typeof nested === "object") {
      const data = nested.data;
      if (Array.isArray(data)) return data as Record<string, unknown>[];
      const items = nested.items;
      if (Array.isArray(items)) return items as Record<string, unknown>[];
    }
    if (Array.isArray(result.items)) return result.items as Record<string, unknown>[];
    return [];
  };

  const requestJson = async (url: string, method = "GET", payload?: unknown) => {
    const response = await fetch(url, {
      method,
      headers: payload ? { "Content-Type": "application/json", Accept: "application/json" } : { Accept: "application/json" },
      body: payload ? JSON.stringify(payload) : undefined,
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false) {
      throw new Error(result.message || result.error || `Request failed (${response.status}).`);
    }
    return result;
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const result = await requestJson("/api/backend/cheque-ranges");
      const records = unwrapRecords(result);
      setItems(records.map((record, index) => ({
        id: index + 1,
        uuid: String(record.uuid ?? record.id ?? ""),
        cashBank: String(record.cashBank ?? record.bank ?? "-"),
        name: String(record.name ?? ""),
        fromNumber: Number(record.fromNumber ?? record.from_number ?? 0),
        toNumber: Number(record.toNumber ?? record.to_number ?? 0),
        numberOfCheque: Number(record.numberOfCheque ?? record.number_of_cheque ?? Math.max(0, Number(record.toNumber ?? record.to_number ?? 0) - Number(record.fromNumber ?? record.from_number ?? 0) + 1)),
        addedBy: String(record.addedBy ?? record.createdBy ?? "—"),
      })));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cheque ranges could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchItems();
  }, []);

  // Add Item Submit Handler (Simulate API Call)
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fromNum = parseInt(modalFromNumber, 10) || 0;
    const toNum = parseInt(modalToNumber, 10) || 0;
    const chequeCount = Math.max(0, toNum - fromNum + 1);

    if (!modalName.trim() || fromNum <= 0 || toNum < fromNum) {
      toast.error("Enter a name and a valid cheque number range.");
      return;
    }

    const payload = {
      cashBank: modalChartOfAccount || "-",
      name: modalName,
      fromNumber: fromNum,
      toNumber: toNum,
      numberOfCheque: chequeCount,
      addedBy: "Admin",
    };
    setSubmitting(true);
    try {
      const url = editingUuid
        ? `/api/backend/cheque-ranges/${encodeURIComponent(editingUuid)}`
        : "/api/backend/cheque-ranges";
      try {
        await requestJson(url, editingUuid ? "PATCH" : "POST", payload);
      } catch (error) {
        if (!editingUuid) throw error;
        await requestJson(url, "PUT", payload);
      }
      toast.success(editingUuid ? "Cheque range updated successfully." : "Cheque range created successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cheque range could not be saved.");
    } finally {
      setSubmitting(false);
      setEditingUuid("");
      await fetchItems();
    }
    setModalChartOfAccount("");
    setModalName("");
    setModalFromNumber("");
    setModalToNumber("");
    setIsModalOpen(false);
  };

  // Delete Item Handler (Simulate API Delete)
  const handleDeleteItem = async (item: ChequeRangeItem) => {
    if (!item.uuid || !confirm(`Delete cheque range ${item.name}?`)) return;
    try {
      await requestJson(`/api/backend/cheque-ranges/${encodeURIComponent(item.uuid)}`, "DELETE");
      toast.success("Cheque range deleted successfully.");
      await fetchItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cheque range could not be deleted.");
    }
  };

  const handleEditItem = async (item: ChequeRangeItem) => {
    if (!item.uuid) return;
    try {
      const result = await requestJson(`/api/backend/cheque-ranges/${encodeURIComponent(item.uuid)}`);
      const record = (result.data?.data ?? result.data ?? result) as Record<string, unknown>;
      setEditingUuid(item.uuid);
      setModalChartOfAccount(String(record.cashBank ?? record.bank ?? ""));
      setModalName(String(record.name ?? item.name));
      setModalFromNumber(String(record.fromNumber ?? record.from_number ?? item.fromNumber));
      setModalToNumber(String(record.toNumber ?? record.to_number ?? item.toNumber));
      setIsModalOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cheque range could not be loaded.");
    }
  };

  const handleRestoreItem = async (item: ChequeRangeItem) => {
    if (!item.uuid) return;
    try {
      await requestJson(`/api/backend/cheque-ranges/${encodeURIComponent(item.uuid)}/restore`, "PATCH");
      toast.success("Cheque range restored successfully.");
      await fetchItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cheque range could not be restored.");
    }
  };

  // Search Filtered Data
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.addedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cashBank.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 p-3 text-xs flex flex-col justify-between">
      <Toaster position="top-right" />
      <div>
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <nav className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
            <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Home
            </Link>
            <span>&gt;</span>
            <span className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer">
              Accounts Module <ChevronDown className="w-3 h-3" />
            </span>
            <span>&gt;</span>
            <span className="text-slate-400 font-normal truncate">List of Cheque Range</span>
          </nav>

          {/* Add Button */}
          <button
            type="button"
            onClick={() => {
              setEditingUuid("");
              setModalChartOfAccount("");
              setModalName("");
              setModalFromNumber("");
              setModalToNumber("");
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#635BFF] hover:bg-indigo-700 text-white font-medium rounded transition-colors shadow-xs cursor-pointer text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Cheque Range
          </button>
        </div>

        {/* Cash/Bank Filter */}
        <div className="mb-4 max-w-xs">
          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
            Cash/Bank
          </label>
          <select
            value={cashBankFilter}
            onChange={(e) => setCashBankFilter(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
          >
            <option value="">Select value</option>
            <option value="Cash">Cash Account</option>
            <option value="Bank">Bank Account</option>
          </select>
        </div>

        {/* Export & Table Controls */}
        <div className="bg-white dark:bg-slate-900 rounded-t border border-b-0 border-slate-200 dark:border-slate-800 p-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Copy Button */}
            <button
              type="button"
              className="flex items-center gap-1 px-2.5 py-1 bg-[#00A3C4] hover:bg-cyan-700 text-white rounded font-medium text-xs transition-colors cursor-pointer"
            >
              <Copy className="w-3 h-3" /> Copy
            </button>

            {/* CSV Button */}
            <button
              type="button"
              className="flex items-center gap-1 px-2.5 py-1 bg-[#E65100] hover:bg-orange-700 text-white rounded font-medium text-xs transition-colors cursor-pointer"
            >
              <FileText className="w-3 h-3" /> CSV
            </button>

            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 ml-2">
              <span>Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-0.5 outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 dark:text-slate-400">Search:</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-0.5 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <table className="w-full table-fixed text-left border-collapse text-xs">
            <thead className="bg-[#635BFF] text-white font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="w-[6%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    ID <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[14%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    CASH/BANK <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[20%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    NAME <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[14%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    FROM NUMBER <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[14%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    TO NUMBER <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[14%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    NUMBER OF CHEQUE <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[10%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    ADDED BY <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[8%] px-2 py-2 text-center">
                  <div className="flex items-center justify-center">ACTION</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-2 py-2 text-slate-800 dark:text-slate-100">{item.id}</td>
                    <td className="px-2 py-2 text-indigo-600 dark:text-indigo-400 font-medium truncate">
                      {item.cashBank}
                    </td>
                    <td className="px-2 py-2 text-slate-700 dark:text-slate-300 truncate">{item.name}</td>
                    <td className="px-2 py-2 text-slate-700 dark:text-slate-300 truncate">{item.fromNumber}</td>
                    <td className="px-2 py-2 text-slate-700 dark:text-slate-300 truncate">{item.toNumber}</td>
                    <td className="px-2 py-2 text-slate-700 dark:text-slate-300 truncate">{item.numberOfCheque}</td>
                    <td className="px-2 py-2 text-slate-700 dark:text-slate-300 truncate">{item.addedBy}</td>
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => void handleDeleteItem(item)}
                        className="p-1 rounded bg-[#EF5350] hover:bg-red-600 text-white transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleEditItem(item)}
                        className="ml-1 p-1 rounded bg-indigo-500 hover:bg-indigo-600 text-white transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRestoreItem(item)}
                        className="ml-1 p-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white transition-colors cursor-pointer"
                        title="Restore"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-3 py-4 text-center text-slate-400 italic">
                    No matching records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="bg-white dark:bg-slate-900 rounded-b border border-t-0 border-slate-200 dark:border-slate-800 p-2.5 flex items-center justify-between text-slate-500 dark:text-slate-400 mb-4">
          <div>
            Showing 1 to {filteredItems.length} of {filteredItems.length} entries
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
            >
              Previous
            </button>
            <button type="button" className="px-3 py-1 rounded bg-[#635BFF] text-white font-medium">
              1
            </button>
            <button
              type="button"
              disabled
              className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* CHEQUE OF RANGE ADD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-md shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                Cheque Of Range Add
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 bg-[#EF5350] hover:bg-red-600 rounded text-white cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleModalSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Chart of Account
                  </label>
                  <select
                    value={modalChartOfAccount}
                    onChange={(e) => setModalChartOfAccount(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                  >
                    <option value="">Select value</option>
                    <option value="Cash">Cash Account</option>
                    <option value="Bank">Bank Account</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Name"
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    From Number
                  </label>
                  <input
                    type="number"
                    placeholder="Enter Number"
                    value={modalFromNumber}
                    onChange={(e) => setModalFromNumber(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    To Number
                  </label>
                  <input
                    type="number"
                    placeholder="Enter Number"
                    value={modalToNumber}
                    onChange={(e) => setModalToNumber(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-1.5 rounded bg-slate-400 hover:bg-slate-500 text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-1.5 rounded bg-[#635BFF] hover:bg-indigo-700 text-white font-medium text-xs transition-colors cursor-pointer shadow-xs"
                >
                  {submitting ? "Saving..." : editingUuid ? "Update" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page Footer */}
      <footer className="flex items-center justify-between text-[9px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
        <div>2026 © Somikoron IT LTD</div>
        <div>Design &amp; Developed by Somikoron IT LTD</div>
      </footer>
    </div>
  );
}