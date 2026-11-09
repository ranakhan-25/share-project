"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { ChevronDown, X, ArrowUpDown, Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002/realbizpro/api/v1";

export interface ReconciliationItem {
  uuid: string;
  id: string;
  sl: number;
  voucherNo: string;
  description: string;
  bank: string;
  date: string;
  chequeDate: string;
  amount: number;
  note: string;
  status: string;
}

interface ApiReconciliation {
  uuid: string;
  voucher_no?: string;
  voucherNo?: string;
  description?: string;
  bank?: string;
  bank_name?: string;
  date?: string;
  cheque_date?: string;
  chequeDate?: string;
  amount?: number | string;
  note?: string;
  status?: string;
  sl?: number;
}

export default function BankReconciliationPage() {
  const [selectDate, setSelectDate] = useState("1 September, 2026 - 30 September, 2026");
  const [chartOfAccount, setChartOfAccount] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const [items, setItems] = useState<ReconciliationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReconciliationItem | null>(null);
  const [modalBankName, setModalBankName] = useState("");
  const [modalStatus, setModalStatus] = useState("Hold");
  const [modalDate, setModalDate] = useState("2026-03-09");

  const mapApiItem = (raw: ApiReconciliation, index: number): ReconciliationItem => ({
    uuid: raw.uuid,
    id: raw.uuid,
    sl: raw.sl ?? index + 1,
    voucherNo: raw.voucher_no ?? raw.voucherNo ?? "",
    description: raw.description ?? "",
    bank: raw.bank ?? raw.bank_name ?? "",
    date: raw.date ?? "",
    chequeDate: raw.cheque_date ?? raw.chequeDate ?? "",
    amount: Number(raw.amount ?? 0),
    note: raw.note ?? "",
    status: raw.status ?? "Pending",
  });

  const fetchReconciliations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/bank-reconciliations`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Failed to load data (${res.status})`);
      const json = await res.json();
      const list: ApiReconciliation[] = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.data?.data)
        ? json.data.data
        : [];
      setItems(list.map(mapApiItem));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReconciliations();
  }, [fetchReconciliations]);

  const handleOpenModal = (item: ReconciliationItem, defaultStatus: string) => {
    setSelectedItem(item);
    setModalBankName(item.bank);
    setModalStatus(defaultStatus);
    setModalDate(new Date().toISOString().slice(0, 10));
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        bank_name: modalBankName,
        status: modalStatus,
        date: modalDate,
      };

      const res = await fetch(`${API_BASE}/bank-reconciliations/${selectedItem.uuid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Update failed (${res.status})`);

      setItems((prev) =>
        prev.map((i) =>
          i.id === selectedItem.id
            ? { ...i, bank: modalBankName, status: modalStatus }
            : i
        )
      );
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.voucherNo.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.bank.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const paginatedItems = useMemo(
    () => filteredItems.slice(0, entriesPerPage),
    [filteredItems, entriesPerPage]
  );

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 p-3 text-xs flex flex-col justify-between">
      <div>
        <nav className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium mb-3">
          <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Home
          </Link>
          <span>&gt;</span>
          <span className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer">
            Accounts Module <ChevronDown className="w-3 h-3" />
          </span>
          <span>&gt;</span>
          <span className="text-slate-400 font-normal truncate">Bank Reconciliation</span>
        </nav>

        <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 p-3 mb-4 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Select Date
              </label>
              <input
                type="text"
                value={selectDate}
                onChange={(e) => setSelectDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Chart Of Account
              </label>
              <select
                value={chartOfAccount}
                onChange={(e) => setChartOfAccount(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
              >
                <option value="">Select value</option>
                <option value="Cash">Cash</option>
                <option value="Bank">Bank Account</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
              >
                <option value="">Select One Option</option>
                <option value="Deposit">Deposit</option>
                <option value="Withdrawal">Withdrawal</option>
              </select>
            </div>

            <div>
              <button
                type="button"
                onClick={fetchReconciliations}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-1.5 bg-[#EF5350] hover:bg-red-600 disabled:opacity-60 text-white font-semibold rounded transition-colors shadow-xs cursor-pointer inline-flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                Report
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded border border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-800 px-3 py-2 text-[11px] text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-t border border-b-0 border-slate-200 dark:border-slate-800 p-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
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

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <table className="w-full table-fixed text-left border-collapse text-xs">
            <thead className="bg-[#635BFF] text-white font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="w-[5%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    SL <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[12%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    VOUCHER NO <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[15%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    DESCRIPTION <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[10%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    BANK <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[12%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    DATE <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[12%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    CHEQUE DATE <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[12%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    AMOUNT <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[20%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    NOTE <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[16%] px-2 py-2 text-center">
                  <div className="flex items-center justify-center">STATUS</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-slate-400 italic">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading records...
                    </span>
                  </td>
                </tr>
              ) : paginatedItems.length > 0 ? (
                paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-2 py-2.5 text-slate-800 dark:text-slate-100">{item.sl}</td>
                    <td className="px-2 py-2.5 text-indigo-600 dark:text-indigo-400 font-medium truncate">
                      {item.voucherNo}
                    </td>
                    <td className="px-2 py-2.5 text-indigo-500 dark:text-indigo-400 truncate">
                      {item.description}
                    </td>
                    <td className="px-2 py-2.5 text-indigo-500 dark:text-indigo-400 truncate">
                      {item.bank}
                    </td>
                    <td className="px-2 py-2.5 text-slate-700 dark:text-slate-300 truncate">
                      {item.date}
                    </td>
                    <td className="px-2 py-2.5 text-slate-700 dark:text-slate-300 truncate">
                      {item.chequeDate}
                    </td>
                    <td className="px-2 py-2.5 text-slate-800 dark:text-slate-100 font-medium truncate">
                      {item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-2.5 text-slate-600 dark:text-slate-400 truncate">
                      {item.note}
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(item, "Honour")}
                          className="px-2.5 py-1 rounded bg-[#635BFF] hover:bg-indigo-700 text-white font-bold italic text-[11px] transition-colors cursor-pointer shadow-xs"
                        >
                          Honour
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenModal(item, "DisHonour")}
                          className="px-2.5 py-1 rounded bg-[#EF5350] hover:bg-red-600 text-white font-bold italic text-[11px] transition-colors cursor-pointer shadow-xs"
                        >
                          DisHonour
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-3 py-4 text-center text-slate-400 italic">
                    No matching records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-b border border-t-0 border-slate-200 dark:border-slate-800 p-2.5 flex items-center justify-between text-slate-500 dark:text-slate-400 mb-4">
          <div>
            Showing {paginatedItems.length === 0 ? 0 : 1} to {paginatedItems.length} of{" "}
            {filteredItems.length} entries
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-md shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-medium text-slate-800 dark:text-slate-100 text-xs">Status Update</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-0.5 border border-slate-400 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/30">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={modalBankName}
                  onChange={(e) => setModalBankName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Status
                </label>
                <input
                  type="text"
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
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
                  className="px-5 py-1.5 rounded bg-[#635BFF] hover:bg-indigo-700 disabled:opacity-60 text-white font-medium text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="flex items-center justify-between text-[9px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
        <div>2026 © Somikoron IT LTD</div>
        <div>Design &amp; Developed by Somikoron IT LTD</div>
      </footer>
    </div>
  );
}