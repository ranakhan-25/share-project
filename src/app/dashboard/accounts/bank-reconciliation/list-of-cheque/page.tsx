"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, Copy, FileText, ArrowUpDown } from "lucide-react";

export interface ChequeItem {
  id: number;
  instrumentNumber: string;
  chequeStatus: string;
  instrumentDate: string;
  favouringName: string;
  amount: string;
  chequeRange: string;
}

export default function ListOfChequePage() {
  // Main Data State (API Ready)
  const [items, setItems] = useState<ChequeItem[]>([
    {
      id: 1,
      instrumentNumber: "911",
      chequeStatus: "Available",
      instrumentDate: "-",
      favouringName: "-",
      amount: "-",
      chequeRange: "911 - 920",
    },
    {
      id: 2,
      instrumentNumber: "912",
      chequeStatus: "Available",
      instrumentDate: "-",
      favouringName: "-",
      amount: "-",
      chequeRange: "911 - 920",
    },
    {
      id: 3,
      instrumentNumber: "913",
      chequeStatus: "Available",
      instrumentDate: "-",
      favouringName: "-",
      amount: "-",
      chequeRange: "911 - 920",
    },
    {
      id: 4,
      instrumentNumber: "914",
      chequeStatus: "Available",
      instrumentDate: "-",
      favouringName: "-",
      amount: "-",
      chequeRange: "911 - 920",
    },
    {
      id: 5,
      instrumentNumber: "915",
      chequeStatus: "Available",
      instrumentDate: "-",
      favouringName: "-",
      amount: "-",
      chequeRange: "911 - 920",
    },
    {
      id: 6,
      instrumentNumber: "916",
      chequeStatus: "Available",
      instrumentDate: "-",
      favouringName: "-",
      amount: "-",
      chequeRange: "911 - 920",
    },
    {
      id: 7,
      instrumentNumber: "917",
      chequeStatus: "Available",
      instrumentDate: "-",
      favouringName: "-",
      amount: "-",
      chequeRange: "911 - 920",
    },
    {
      id: 8,
      instrumentNumber: "918",
      chequeStatus: "Available",
      instrumentDate: "-",
      favouringName: "-",
      amount: "-",
      chequeRange: "911 - 920",
    },
    {
      id: 9,
      instrumentNumber: "919",
      chequeStatus: "Available",
      instrumentDate: "-",
      favouringName: "-",
      amount: "-",
      chequeRange: "911 - 920",
    },
    {
      id: 10,
      instrumentNumber: "920",
      chequeStatus: "Available",
      instrumentDate: "-",
      favouringName: "-",
      amount: "-",
      chequeRange: "911 - 920",
    },
  ]);

  // Filter & Search States
  const [cashBankFilter, setCashBankFilter] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter logic
  const filteredItems = items.filter(
    (item) =>
      item.instrumentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.chequeStatus.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.chequeRange.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 p-3 text-xs flex flex-col justify-between">
      <div>
        {/* Navigation Breadcrumb */}
        <nav className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium mb-3">
          <Link
            href="/"
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Home
          </Link>
          <span>&gt;</span>
          <span className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer">
            Accounts Module <ChevronDown className="w-3 h-3" />
          </span>
          <span>&gt;</span>
          <span className="text-slate-400 font-normal truncate">
            List of Cheque
          </span>
        </nav>

        {/* Cash/Bank Filter Dropdown */}
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
            <button
              type="button"
              className="flex items-center gap-1 px-2.5 py-1 bg-[#00A3C4] hover:bg-cyan-700 text-white rounded font-medium text-xs transition-colors cursor-pointer"
            >
              <Copy className="w-3 h-3" /> Copy
            </button>

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
                <th className="w-[20%] px-2 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    INSTRUMENT NUMBER{" "}
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[16%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    CHEQUE STATUS{" "}
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[16%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    INSTRUMENT DATE{" "}
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[18%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    FAVOURING NAME{" "}
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[10%] px-2 py-2">
                  <div className="flex items-center justify-between">
                    AMOUNT <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
                <th className="w-[14%] px-2 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    CHEQUE RANGE{" "}
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-70" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-2 py-2 text-slate-800 dark:text-slate-100">
                      {item.id}
                    </td>
                    <td className="px-2 py-2 text-right text-slate-700 dark:text-slate-300 font-medium">
                      {item.instrumentNumber}
                    </td>
                    <td className="px-2 py-2">
                      <span className="text-[#00B5D8] font-medium cursor-pointer hover:underline">
                        {item.chequeStatus}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-slate-700 dark:text-slate-300">
                      {item.instrumentDate}
                    </td>
                    <td className="px-2 py-2 text-slate-700 dark:text-slate-300">
                      {item.favouringName}
                    </td>
                    <td className="px-2 py-2 text-slate-700 dark:text-slate-300">
                      {item.amount}
                    </td>
                    <td className="px-2 py-2 text-right text-slate-700 dark:text-slate-300">
                      {item.chequeRange}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-4 text-center text-slate-400 italic"
                  >
                    No matching records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="bg-white dark:bg-slate-900 rounded-b border border-t-0 border-slate-200 dark:border-slate-800 p-2.5 flex items-center justify-between text-slate-500 dark:text-slate-400 mb-4">
          <div>Showing 1 to {filteredItems.length} of 148 entries</div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              className="px-2.5 py-1 rounded bg-[#635BFF] text-white font-medium"
            >
              1
            </button>
            <button
              type="button"
              className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              2
            </button>
            <button
              type="button"
              className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              3
            </button>
            <button
              type="button"
              className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              4
            </button>
            <button
              type="button"
              className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              5
            </button>
            <span className="px-1 text-slate-400">...</span>
            <button
              type="button"
              className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              15
            </button>
            <button
              type="button"
              className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Page Footer */}
      <footer className="flex items-center justify-between text-[9px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
        <div>2026 © Somikoron IT LTD</div>
        <div>Design &amp; Developed by Somikoron IT LTD</div>
      </footer>
    </div>
  );
}
