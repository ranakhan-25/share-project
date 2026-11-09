"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  FileSpreadsheet,
  Eye,
  Pencil,
  Trash2,
  Copy,
  Send,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface ExpenseRow {
  id: number;
  uuid: string;
  sl: number;
  date: string;
  voucher: string;
  project: string;
  titleOfWork: string;
  debit: string;
  credit: string;
  staffName: string;
  amount: number;
  note: string;
  addedBy: string;
  editedBy: string;
  approvalSteps: string[];
  attachment: number;
  status: string;
}

const tableHeaders = [
  "SL",
  "DATE",
  "VOUCHER",
  "PROJECT",
  "DEBIT",
  "CREDIT",
  "STAFF NAME",
  "AMOUNT",
  "ADDED BY",
  "APPROVE",
  "ACTION",
];

// lg+ column widths (table-fixed), sums to 100%
const lgColumnWidths: Record<string, string> = {
  SL: "lg:w-[3%]",
  DATE: "lg:w-[8%]",
  VOUCHER: "lg:w-[9%]",
  PROJECT: "lg:w-[13%]",
  DEBIT: "lg:w-[10%]",
  CREDIT: "lg:w-[10%]",
  "STAFF NAME": "lg:w-[8%]",
  AMOUNT: "lg:w-[9%]",
  "ADDED BY": "lg:w-[9%]",
  APPROVE: "lg:w-[13%]",
  ACTION: "lg:w-[8%]",
};

type RowActionKey = "view" | "voucher" | "edit" | "delete" | "duplicate";

const rowActionMenu: {
  key: RowActionKey;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { key: "view", label: "View", icon: Eye, color: "bg-emerald-500 hover:bg-emerald-600" },
  { key: "voucher", label: "Voucher", icon: FileText, color: "bg-violet-500 hover:bg-violet-600" },
  { key: "edit", label: "Edit", icon: Pencil, color: "bg-indigo-500 hover:bg-indigo-600" },
  { key: "delete", label: "Delete", icon: Trash2, color: "bg-red-500 hover:bg-red-600" },
  { key: "duplicate", label: "Duplicate", icon: Copy, color: "bg-cyan-500 hover:bg-cyan-600" },
];

export default function ExpenseListPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [openActionId, setOpenActionId] = useState<number | null>(null);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/backend/expenses", { headers: { accept: "application/json" } });
      const result = await response.json();
      const payload = result.data?.data ?? result.data?.items ?? result.data ?? [];
      const rows = (Array.isArray(payload) ? payload : []).map((expense: Record<string, unknown>, index: number) => ({
        id: index + 1,
        uuid: String(expense.uuid ?? expense.id ?? ""),
        sl: index + 1,
        date: expense.date ? String(expense.date).slice(0, 10) : "",
        voucher: String(expense.voucherNo ?? ""),
        project: String(expense.project ?? ""),
        titleOfWork: String(expense.titleOfWork ?? ""),
        debit: Array.isArray(expense.items) && expense.items.length ? expense.items.map((item: Record<string, unknown>) => String(item.accountId ?? "")).join(", ") : "",
        credit: String(expense.cashOrBank ?? ""),
        staffName: "",
        amount: Number(expense.totalAmount ?? 0),
        note: String(expense.comment ?? ""),
        addedBy: String(expense.addedBy ?? ""),
        editedBy: "",
        approvalSteps: [],
        attachment: expense.attachmentUrl ? 1 : 0,
        status: "",
      }));
      setExpenses(rows);
    } catch (error) {
      console.error("Failed to load expenses", error);
      setExpenses([]);
      toast.error(error instanceof Error ? error.message : "Failed to load expenses.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleRowAction = async (key: RowActionKey, row: ExpenseRow) => {
    if (key === "edit") {
      router.push(`/dashboard/accounts/voucher/expense/expense-list-add?uuid=${encodeURIComponent(row.uuid)}`);
    } else if (key === "view") {
      window.open(`/api/backend/expenses/${encodeURIComponent(row.uuid)}`, "_blank");
    } else if (key === "delete" && window.confirm("Delete this expense?")) {
      try {
        const response = await fetch(`/api/backend/expenses/${encodeURIComponent(row.uuid)}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Expense could not be deleted.");
        await fetchExpenses();
        toast.success("Expense deleted successfully.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Expense could not be deleted.");
      }
    } else if (key === "duplicate") {
      router.push("/dashboard/accounts/voucher/expense/expense-list-add");
    }
    setOpenActionId(null);
  };

  const filteredRows = expenses.filter((r) =>
    search.trim()
      ? [r.project, r.voucher, r.debit, r.credit, r.addedBy].some((f) =>
          f.toLowerCase().includes(search.trim().toLowerCase())
        )
      : true
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / entriesPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * entriesPerPage;
  const visibleRows = filteredRows.slice(startIdx, startIdx + entriesPerPage);

  return (
    // Normal flow below `lg` (page scrolls like the rest of the app).
    // At `lg`+ the page locks to the space left under the Topbar
    // (100vh - 4rem topbar - 2.5rem main padding) and only the table
    // scrolls internally, per the layout's Topbar+sticky-Sidebar chrome.
    <div className="w-full min-w-0 lg:h-[calc(100vh-6.5rem)] flex flex-col overflow-x-hidden lg:overflow-hidden font-sans">
      {/* Breadcrumb & Action Header */}
      <div className="flex flex-row items-center justify-between gap-2 mb-2 lg:shrink-0">
        <nav className="text-xs md:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
          <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
            Home
          </span>
          <span>&gt;</span>
          <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
            Accounts Module
            <ChevronDown className="w-3 h-3" />
          </span>
          <span>&gt;</span>
          <span className="text-slate-400 dark:text-slate-500 font-normal">
            Expense List
          </span>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/accounts/voucher/expense/expense-list-add" className="flex items-center gap-1 px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm active:scale-95 cursor-pointer">
            <Plus className="w-4 h-4" />
            Expense List Add
          </Link>
          <button
            aria-label="More options"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="lg:flex-1 lg:min-h-0 min-w-0 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-3 flex flex-col lg:overflow-hidden">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 lg:shrink-0">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-0.5 font-medium">
              Select Date
            </label>
            <input
              type="text"
              readOnly
              value="1 September, 2026 - 30 September, 2026"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-2.5 py-1.5 text-xs md:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-0.5 font-medium">
              Debit Accounts
            </label>
            <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-2.5 py-1.5 text-xs md:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              <option>Select Chart Of Account</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-0.5 font-medium">
              Credit Accounts
            </label>
            <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-2.5 py-1.5 text-xs md:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              <option>Select Chart Of Account</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-0.5 font-medium">
              Select Project
            </label>
            <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-2.5 py-1.5 text-xs md:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              <option>Select Project</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mt-2.5 lg:shrink-0 items-end">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-0.5 font-medium">
              Title/Name of Work
            </label>
            <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-2.5 py-1.5 text-xs md:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              <option>Select Title/Name of Work</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-0.5 font-medium">
              Site
            </label>
            <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-2.5 py-1.5 text-xs md:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              <option>Select Site</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-0.5 font-medium">
              Task
            </label>
            <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-2.5 py-1.5 text-xs md:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              <option>Select Task</option>
            </select>
          </div>
          <button className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-medium rounded-md bg-rose-500 hover:bg-rose-600 text-white transition-colors">
            <FileText className="w-3.5 h-3.5" />
            PDF
          </button>
          <button className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-medium rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel
          </button>
        </div>

        {/* Entries & Search Controls */}
        <div className="flex items-center justify-between gap-2 mt-3 mb-2 pt-2 border-t border-slate-100 dark:border-slate-800 lg:shrink-0">
          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600 dark:text-slate-400">
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-2 py-0.5 text-xs md:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium">
            <span>Search:</span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-40 sm:w-56 px-2.5 py-1 text-xs md:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Table — at lg+, table-fixed columns guarantee a fit with zero
            horizontal scroll anywhere (no width can leak to the page/navbar).
            Below lg, it falls back to a normal scrollable table. */}
        <div className="lg:flex-1 lg:min-h-0 min-w-0 overflow-auto lg:overflow-y-auto lg:overflow-x-hidden border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-left border-collapse text-xs md:text-sm min-w-[900px] lg:min-w-0 lg:table-fixed">
            <thead className="sticky top-0 z-10 bg-indigo-500 dark:bg-indigo-700 text-white font-semibold uppercase tracking-wider text-[10.5px] md:text-[11px]">
              <tr>
                {tableHeaders.map((h) => (
                  <th
                    key={h}
                    className={`px-2.5 py-2.5 whitespace-nowrap lg:whitespace-normal ${lgColumnWidths[h]}`}
                  >
                    {h === "SL" ? (
                      <div className="flex items-center gap-1">
                        SL <ChevronUp className="w-3 h-3" />
                      </div>
                    ) : (
                      h
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {visibleRows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-2.5 py-2.5 text-slate-500 dark:text-slate-400 font-medium">
                    {row.sl}
                  </td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap lg:whitespace-normal text-slate-600 dark:text-slate-300">
                    {row.date}
                  </td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap lg:whitespace-normal lg:break-words text-indigo-600 dark:text-indigo-400 font-medium">
                    {row.voucher}
                  </td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap lg:whitespace-normal lg:break-words text-slate-600 dark:text-slate-300">
                    {row.project}
                    {row.titleOfWork && (
                      <span className="block text-[10.5px] text-slate-400">
                        {row.titleOfWork}
                      </span>
                    )}
                  </td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap lg:whitespace-normal lg:break-words text-indigo-600 dark:text-indigo-400 font-medium">
                    {row.debit}
                  </td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap lg:whitespace-normal lg:break-words text-indigo-600 dark:text-indigo-400 font-medium">
                    {row.credit}
                  </td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap lg:whitespace-normal lg:break-words text-slate-600 dark:text-slate-300">
                    {row.staffName || "—"}
                  </td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap lg:whitespace-normal text-slate-700 dark:text-slate-200 font-medium">
                    {row.amount.toFixed(2)}
                    {row.note && (
                      <span className="block text-[10.5px] font-normal text-slate-400">
                        {row.note}
                      </span>
                    )}
                  </td>
                  <td className="px-2.5 py-2.5 whitespace-nowrap lg:whitespace-normal lg:break-words text-slate-600 dark:text-slate-300">
                    {row.addedBy}
                    {row.editedBy && (
                      <span className="block text-[10.5px] text-slate-400">
                        Edited: {row.editedBy}
                      </span>
                    )}
                  </td>
                  <td className="px-2.5 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      {row.approvalSteps.map((step) => (
                        <span
                          key={step}
                          className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
                        >
                          ✓ {step}
                        </span>
                      ))}
                      {row.status && (
                        <span className="text-slate-400 dark:text-slate-500">
                          {row.status}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 relative">
                    <button
                      onClick={() =>
                        setOpenActionId((prev) => (prev === row.id ? null : row.id))
                      }
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xxs md:text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 transition-colors"
                    >
                      Action
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {openActionId === row.id && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setOpenActionId(null)}
                        />
                        <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1.5 space-y-1 z-30">
                          {rowActionMenu.map(({ key, label, icon: Icon, color }) => (
                            <button
                              key={key}
                              onClick={() => handleRowAction(key, row)}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white transition-colors ${color}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              {label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}

              {visibleRows.length === 0 && (
                <tr>
                  <td
                    colSpan={tableHeaders.length}
                    className="px-3 py-6 text-center text-slate-400 dark:text-slate-500"
                  >
                    {isLoading ? "Loading expenses..." : "No data available in table"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-2 pt-2 text-xs md:text-sm text-slate-500 dark:text-slate-400 lg:shrink-0">
          <div>
            Showing{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {filteredRows.length === 0 ? 0 : startIdx + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {startIdx + visibleRows.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {filteredRows.length}
            </span>{" "}
            entries
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={safePage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-slate-50 dark:hover:enabled:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  p === safePage
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              disabled={safePage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-slate-50 dark:hover:enabled:bg-slate-800 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-1 mt-1 lg:shrink-0">
        <div>2026 © Somikoron IT LTD</div>
        <div>Design &amp; Developed by Somikoron IT LTD</div>
      </footer>
    </div>
  );
}
