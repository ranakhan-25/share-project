/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { crmFetch, API_ORIGIN } from "../../crm-fetch";
import { ChevronLeft, ChevronRight, Search, RotateCcw } from "lucide-react";

interface UserOption {
  uuid: string;
  name: string;
  userCode?: string;
}

interface DropdownResponse {
  success: boolean;
  data: {
    users: UserOption[];
  };
}

interface CallLogRow {
  sl?: number;
  userId?: string;
  name: string;
  outgoing: number;
  incoming: number;
  totalCalls: number;
  totalDurationSeconds?: number;
  totalDuration?: string;
}

interface GrandTotal {
  sl: null;
  name: string;
  outgoing: number;
  incoming: number;
  totalCalls: number;
  totalDurationSeconds: number;
  totalDuration: string;
}

interface ReportResponse {
  success: boolean;
  data: {
    data: CallLogRow[];
    grandTotal?: GrandTotal;
    meta?: {
      dateFrom?: string | null;
      dateTo?: string | null;
      userId?: string | null;
      totalCalls?: number;
    };
  };
}

export default function CallLogReportPage() {
  const baseUrl = API_ORIGIN;

  const [dropdowns, setDropdowns] = useState<DropdownResponse["data"] | null>(null);
  const [reportData, setReportData] = useState<CallLogRow[]>([]);
  const [grandTotal, setGrandTotal] = useState<GrandTotal | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [selectedUser, setSelectedUser] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination & Sorting
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("totalCalls");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch Dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const res = await crmFetch(`${baseUrl}/realbizpro/api/v1/crm/reports/call-log/dropdowns`);
        const json: DropdownResponse = await res.json();
        if (json.success) setDropdowns(json.data);
      } catch (err) {
        console.error("Error fetching dropdowns", err);
      }
    };
    fetchDropdowns();
  }, [baseUrl]);

  // Fetch Report Data
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      if (selectedUser) params.append("userId", selectedUser);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const res = await crmFetch(`${baseUrl}/realbizpro/api/v1/crm/reports/call-log?${params.toString()}`);
      const json: ReportResponse = await res.json();
      if (json.success && json.data) {
        setReportData(json.data.data || []);
        setGrandTotal(json.data.grandTotal || null);
      } else {
        setReportData([]);
        setGrandTotal(null);
      }
    } catch (err: any) {
      console.error("Fetch call log report error:", err);
      setErrorMsg(err.message || "Failed to load call log report data.");
      setReportData([]);
      setGrandTotal(null);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, selectedUser, dateFrom, dateTo]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const resetFilters = () => {
    setSelectedUser("");
    setDateFrom("");
    setDateTo("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Filtered & Sorted Rows
  const processedRows = useMemo(() => {
    let rows = [...reportData];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(q));
    }

    rows.sort((a: any, b: any) => {
      let valA = a[sortField] ?? 0;
      let valB = b[sortField] ?? 0;
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return rows;
  }, [reportData, searchTerm, sortField, sortOrder]);

  // Pagination calculation
  const totalEntries = processedRows.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return processedRows.slice(start, start + entriesPerPage);
  }, [processedRows, currentPage, entriesPerPage]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-sm">
      {/* Breadcrumb */}
      <div className="mb-4 text-xs font-medium text-indigo-600 flex items-center gap-1">
        <span>Home</span> <span>{">"}</span>
        <span>Reports</span> <span>{">"}</span>
        <span className="text-gray-800">Call Log Report</span>
      </div>

      {/* Filter Section */}
      <div className="mb-6 flex flex-col md:flex-row items-end gap-3 flex-wrap">
        {/* User Filter */}
        <div className="w-full md:w-52">
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
            Agent / User
          </label>
          <select
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
          >
            <option value="">All Agents</option>
            {dropdowns?.users?.map((u) => (
              <option key={u.uuid} value={u.uuid}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div className="w-full md:w-44">
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
            Date From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
          />
        </div>

        {/* Date To */}
        <div className="w-full md:w-44">
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
            Date To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
          />
        </div>

        {/* Reset Button */}
        <div className="flex gap-2">
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded text-xs font-medium transition-colors shadow-sm"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Controls */}
        <div className="p-3 flex flex-col md:flex-row justify-between items-center gap-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 bg-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600 w-full md:w-auto">
            <span>Search:</span>
            <div className="relative w-full md:w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search agent name..."
                className="w-full border border-gray-300 rounded pl-7 pr-3 py-1 bg-white focus:outline-none focus:border-indigo-500 text-xs shadow-sm"
              />
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                <th className="p-3 w-12 text-center">SL</th>
                <th
                  onClick={() => handleSort("name")}
                  className="p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  Representative / Agent {sortField === "name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  onClick={() => handleSort("outgoing")}
                  className="p-3 cursor-pointer hover:bg-gray-100 transition-colors text-right"
                >
                  Outgoing Calls {sortField === "outgoing" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  onClick={() => handleSort("incoming")}
                  className="p-3 cursor-pointer hover:bg-gray-100 transition-colors text-right"
                >
                  Incoming Calls {sortField === "incoming" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  onClick={() => handleSort("totalCalls")}
                  className="p-3 cursor-pointer hover:bg-gray-100 transition-colors text-right"
                >
                  Total Calls {sortField === "totalCalls" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  onClick={() => handleSort("totalDurationSeconds")}
                  className="p-3 cursor-pointer hover:bg-gray-100 transition-colors text-right"
                >
                  Total Duration {sortField === "totalDurationSeconds" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 animate-pulse">
                    <td colSpan={6} className="p-3 text-center text-gray-400">
                      Loading call logs...
                    </td>
                  </tr>
                ))
              ) : paginatedRows.length > 0 ? (
                paginatedRows.map((row, idx) => {
                  const sl = (currentPage - 1) * entriesPerPage + idx + 1;
                  return (
                    <tr
                      key={row.userId || idx}
                      className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="p-3 text-center text-gray-500">{sl}</td>
                      <td className="p-3 font-medium text-gray-800">{row.name}</td>
                      <td className="p-3 text-right font-mono text-gray-700">{row.outgoing}</td>
                      <td className="p-3 text-right font-mono text-gray-700">{row.incoming}</td>
                      <td className="p-3 text-right font-mono font-semibold text-indigo-600">{row.totalCalls}</td>
                      <td className="p-3 text-right font-mono text-gray-700">{row.totalDuration || `${row.totalDurationSeconds || 0} sec`}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    No call log records found.
                  </td>
                </tr>
              )}
            </tbody>
            {grandTotal && (
              <tfoot>
                <tr className="bg-indigo-50/60 font-semibold text-gray-800 border-t-2 border-indigo-200">
                  <td colSpan={2} className="p-3 text-left">
                    {grandTotal.name || "Grand Total"}
                  </td>
                  <td className="p-3 text-right font-mono">{grandTotal.outgoing}</td>
                  <td className="p-3 text-right font-mono">{grandTotal.incoming}</td>
                  <td className="p-3 text-right font-mono text-indigo-700">{grandTotal.totalCalls}</td>
                  <td className="p-3 text-right font-mono">{grandTotal.totalDuration || `${grandTotal.totalDurationSeconds} sec`}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 flex flex-col md:flex-row justify-between items-center gap-3 border-t border-gray-100 text-xs text-gray-600">
          <div>
            Showing {totalEntries > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0} to{" "}
            {Math.min(currentPage * entriesPerPage, totalEntries)} of {totalEntries} entries
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 py-1 font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              title="Next Page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
