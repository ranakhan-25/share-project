/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { crmFetch, API_ORIGIN } from "../../crm-fetch";
import { ChevronLeft, ChevronRight, Search, RotateCcw } from "lucide-react";

interface SummaryItem {
  userId?: string;
  name: string;
  visited: number;
  schedule: number;
  canceled: number;
  newSchedule?: number;
  rescheduled: number;
  total: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    data: SummaryItem[];
    meta?: {
      dateFrom?: string | null;
      dateTo?: string | null;
      totalUsers?: number;
    };
  };
}

export default function TaskVisitSummaryReportPage() {
  const baseUrl = API_ORIGIN;

  const [reportData, setReportData] = useState<SummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination & Sorting
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("total");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch Report Data
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const res = await crmFetch(`${baseUrl}/realbizpro/api/v1/crm/task-visit/summary-report?${params.toString()}`);
      const json: ApiResponse = await res.json();
      if (json.success && json.data) {
        const rows = Array.isArray(json.data) ? json.data : json.data.data || [];
        setReportData(rows);
      } else {
        setReportData([]);
      }
    } catch (err: any) {
      console.error("Fetch summary report error:", err);
      setErrorMsg(err.message || "Failed to load summary report.");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, dateFrom, dateTo]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const resetFilters = () => {
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

  // Totals
  const totals = useMemo(() => {
    return processedRows.reduce(
      (acc, row) => ({
        visited: acc.visited + Number(row.visited || 0),
        schedule: acc.schedule + Number(row.schedule || 0),
        rescheduled: acc.rescheduled + Number(row.rescheduled || 0),
        canceled: acc.canceled + Number(row.canceled || 0),
        total: acc.total + Number(row.total || 0),
      }),
      { visited: 0, schedule: 0, rescheduled: 0, canceled: 0, total: 0 }
    );
  }, [processedRows]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-sm">
      {/* Breadcrumb */}
      <div className="mb-4 text-xs font-medium text-indigo-600 flex items-center gap-1">
        <span>Home</span> <span>{">"}</span>
        <span>Tasks & Visits</span> <span>{">"}</span>
        <span className="text-gray-800">Task & Visit Summary Report</span>
      </div>

      {/* Filter Section */}
      <div className="mb-6 flex flex-col md:flex-row items-end gap-3 flex-wrap">
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

        {/* Action Buttons */}
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
                placeholder="Search officer name..."
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
                  Officer / Representative {sortField === "name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  onClick={() => handleSort("visited")}
                  className="p-3 cursor-pointer hover:bg-gray-100 transition-colors text-right"
                >
                  Completed Visits {sortField === "visited" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  onClick={() => handleSort("schedule")}
                  className="p-3 cursor-pointer hover:bg-gray-100 transition-colors text-right"
                >
                  Scheduled {sortField === "schedule" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  onClick={() => handleSort("rescheduled")}
                  className="p-3 cursor-pointer hover:bg-gray-100 transition-colors text-right"
                >
                  Rescheduled {sortField === "rescheduled" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  onClick={() => handleSort("canceled")}
                  className="p-3 cursor-pointer hover:bg-gray-100 transition-colors text-right"
                >
                  Canceled {sortField === "canceled" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  onClick={() => handleSort("total")}
                  className="p-3 cursor-pointer hover:bg-gray-100 transition-colors text-right"
                >
                  Total Visits / Tasks {sortField === "total" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="p-3 text-right">Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 animate-pulse">
                    <td colSpan={8} className="p-3 text-center text-gray-400">
                      Loading summary metrics...
                    </td>
                  </tr>
                ))
              ) : paginatedRows.length > 0 ? (
                paginatedRows.map((row, idx) => {
                  const sl = (currentPage - 1) * entriesPerPage + idx + 1;
                  const rate = row.total > 0 ? Math.round((row.visited / row.total) * 100) : 0;
                  return (
                    <tr
                      key={row.userId || idx}
                      className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="p-3 text-center text-gray-500">{sl}</td>
                      <td className="p-3 font-medium text-gray-800">{row.name}</td>
                      <td className="p-3 text-right font-mono text-emerald-700 font-semibold">{row.visited}</td>
                      <td className="p-3 text-right font-mono text-gray-700">{row.schedule}</td>
                      <td className="p-3 text-right font-mono text-amber-700">{row.rescheduled}</td>
                      <td className="p-3 text-right font-mono text-rose-600">{row.canceled}</td>
                      <td className="p-3 text-right font-mono font-semibold text-indigo-600">{row.total}</td>
                      <td className="p-3 text-right font-mono text-gray-700">{rate}%</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    No summary activity found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
            {processedRows.length > 0 && (
              <tfoot>
                <tr className="bg-indigo-50/60 font-semibold text-gray-800 border-t-2 border-indigo-200">
                  <td colSpan={2} className="p-3 text-left">
                    Grand Total
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-700">{totals.visited}</td>
                  <td className="p-3 text-right font-mono">{totals.schedule}</td>
                  <td className="p-3 text-right font-mono text-amber-700">{totals.rescheduled}</td>
                  <td className="p-3 text-right font-mono text-rose-600">{totals.canceled}</td>
                  <td className="p-3 text-right font-mono text-indigo-700">{totals.total}</td>
                  <td className="p-3 text-right font-mono">
                    {totals.total > 0 ? `${Math.round((totals.visited / totals.total) * 100)}%` : "0%"}
                  </td>
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
