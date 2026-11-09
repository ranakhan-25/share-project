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

interface SourceOption {
  id: number;
  uuid: string;
  name: string;
  code?: string;
}

interface DropdownResponse {
  success: boolean;
  data: {
    users: UserOption[];
    leadSources: SourceOption[];
  };
}

interface ColumnDef {
  key: string;
  label: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    columns?: ColumnDef[];
    rows?: Record<string, any>[];
  };
  meta?: {
    dateFrom?: string | null;
    dateTo?: string | null;
    totalLeads?: number;
    totalUsers?: number;
  };
}

export default function SourceWiseLeadReportPage() {
  const baseUrl = API_ORIGIN;

  const [dropdowns, setDropdowns] = useState<DropdownResponse["data"] | null>(null);
  const [columns, setColumns] = useState<ColumnDef[]>([]);
  const [reportRows, setReportRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedSource, setSelectedSource] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination & Sorting
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("total");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch Dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const res = await crmFetch(`${baseUrl}/realbizpro/api/v1/crm/reports/source-wise-leads/dropdowns`);
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
      if (selectedSource) params.append("leadSourceId", selectedSource);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const res = await crmFetch(`${baseUrl}/realbizpro/api/v1/crm/reports/source-wise-leads?${params.toString()}`);
      const json: ApiResponse = await res.json();
      if (json.success && json.data) {
        const cols = json.data.columns || [];
        const rows = json.data.rows || [];
        setColumns(cols);
        setReportRows(rows);
      } else {
        setColumns([]);
        setReportRows([]);
      }
    } catch (err: any) {
      console.error("Fetch source-wise report error:", err);
      setErrorMsg(err.message || "Failed to load report data.");
      setColumns([]);
      setReportRows([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, selectedUser, selectedSource, dateFrom, dateTo]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const resetFilters = () => {
    setSelectedUser("");
    setSelectedSource("");
    setDateFrom("");
    setDateTo("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Separate grand total row from regular rows
  const regularRows = useMemo(() => {
    return reportRows.filter((r) => r.userId !== "total" && r.user !== "Grand Total");
  }, [reportRows]);

  const grandTotalRow = useMemo(() => {
    return reportRows.find((r) => r.userId === "total" || r.user === "Grand Total");
  }, [reportRows]);

  // Filtered & Sorted Rows
  const processedRows = useMemo(() => {
    let rows = [...regularRows];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter((r) => String(r.user || "").toLowerCase().includes(q));
    }

    rows.sort((a, b) => {
      let valA = a[sortField] ?? 0;
      let valB = b[sortField] ?? 0;
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return rows;
  }, [regularRows, searchTerm, sortField, sortOrder]);

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
        <span className="text-gray-800">Source Wise Lead Report</span>
      </div>

      {/* Filter Section */}
      <div className="mb-6 flex flex-col md:flex-row items-end gap-3 flex-wrap">
        <div className="w-full md:w-52">
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
            Officer / User
          </label>
          <select
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
          >
            <option value="">All Officers</option>
            {dropdowns?.users?.map((u) => (
              <option key={u.uuid} value={u.uuid}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-52">
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
            Lead Source
          </label>
          <select
            value={selectedSource}
            onChange={(e) => {
              setSelectedSource(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
          >
            <option value="">All Sources</option>
            {dropdowns?.leadSources?.map((s) => (
              <option key={s.id || s.uuid} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-36">
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

        <div className="w-full md:w-36">
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
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`p-3 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap ${
                      col.key !== "user" ? "text-right" : ""
                    }`}
                  >
                    {col.label} {sortField === col.key ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 animate-pulse">
                    <td colSpan={columns.length + 1 || 8} className="p-3 text-center text-gray-400">
                      Loading source-wise lead data...
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
                      {columns.map((col) => {
                        const val = row[col.key] ?? 0;
                        if (col.key === "user") {
                          return (
                            <td key={col.key} className="p-3 font-medium text-gray-800 whitespace-nowrap">
                              {val}
                            </td>
                          );
                        }
                        if (col.key === "total") {
                          return (
                            <td key={col.key} className="p-3 text-right font-mono font-bold text-indigo-600">
                              {val}
                            </td>
                          );
                        }
                        if (col.key === "junk") {
                          return (
                            <td key={col.key} className="p-3 text-right font-mono text-rose-600">
                              {val}
                            </td>
                          );
                        }
                        return (
                          <td key={col.key} className="p-3 text-right font-mono text-gray-700">
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={columns.length + 1 || 8} className="p-8 text-center text-gray-400">
                    No source-wise leads found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
            {grandTotalRow && columns.length > 0 && (
              <tfoot>
                <tr className="bg-indigo-50/70 font-semibold text-gray-900 border-t-2 border-indigo-200">
                  <td className="p-3 text-center">Σ</td>
                  {columns.map((col) => {
                    const val = grandTotalRow[col.key] ?? 0;
                    if (col.key === "user") {
                      return (
                        <td key={col.key} className="p-3 font-bold text-gray-900 whitespace-nowrap">
                          Grand Total
                        </td>
                      );
                    }
                    if (col.key === "total") {
                      return (
                        <td key={col.key} className="p-3 text-right font-mono font-bold text-indigo-700">
                          {val}
                        </td>
                      );
                    }
                    return (
                      <td key={col.key} className="p-3 text-right font-mono">
                        {val}
                      </td>
                    );
                  })}
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
