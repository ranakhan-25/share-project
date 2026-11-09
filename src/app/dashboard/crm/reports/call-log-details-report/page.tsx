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

interface CallDetailRow {
  sl?: number;
  id?: string | number;
  uuid?: string;
  date?: string;
  userId?: string;
  user?: string;
  number?: string;
  phone?: string;
  name?: string;
  leadCode?: string;
  callType?: string;
  duration?: string;
  durationSeconds?: number;
  lead?: {
    clientName?: string;
    leadCode?: string;
    phone?: string;
  };
}

interface ReportResponse {
  success: boolean;
  data: {
    data: CallDetailRow[];
    totalDuration?: string;
    totalDurationSeconds?: number;
    meta?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      dateFrom?: string | null;
      dateTo?: string | null;
      userId?: string | null;
    };
  };
}

export default function CallLogDetailsReportPage() {
  const baseUrl = API_ORIGIN;

  const [dropdowns, setDropdowns] = useState<DropdownResponse["data"] | null>(null);
  const [reportData, setReportData] = useState<CallDetailRow[]>([]);
  const [totalDuration, setTotalDuration] = useState<string>("");
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
  const [sortField, setSortField] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch Dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const res = await crmFetch(`${baseUrl}/realbizpro/api/v1/crm/reports/call-log-details/dropdowns`);
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
      const params = new URLSearchParams({
        page: "1",
        limit: "100", // Fetch up to 100 for client-side sorting/filtering
      });
      if (selectedUser) params.append("userId", selectedUser);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (searchTerm) params.append("search", searchTerm);

      const res = await crmFetch(`${baseUrl}/realbizpro/api/v1/crm/reports/call-log-details?${params.toString()}`);
      const json: ReportResponse = await res.json();
      if (json.success && json.data) {
        const rows = Array.isArray(json.data) ? json.data : json.data.data || [];
        setReportData(rows);
        setTotalDuration(json.data.totalDuration || "");
      } else {
        setReportData([]);
        setTotalDuration("");
      }
    } catch (err: any) {
      console.error("Fetch call log details error:", err);
      setErrorMsg(err.message || "Failed to load call details.");
      setReportData([]);
      setTotalDuration("");
    } finally {
      setLoading(false);
    }
  }, [baseUrl, selectedUser, dateFrom, dateTo, searchTerm]);

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
      rows = rows.filter((r) => {
        const name = r.name || r.lead?.clientName || "";
        const code = r.leadCode || r.lead?.leadCode || "";
        const phone = r.number || r.phone || r.lead?.phone || "";
        const agent = r.user || "";
        const type = r.callType || "";
        return (
          name.toLowerCase().includes(q) ||
          code.toLowerCase().includes(q) ||
          phone.toLowerCase().includes(q) ||
          agent.toLowerCase().includes(q) ||
          type.toLowerCase().includes(q)
        );
      });
    }

    rows.sort((a: any, b: any) => {
      let valA = a[sortField] ?? "";
      let valB = b[sortField] ?? "";
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
        <span className="text-gray-800">Call Log Details Report</span>
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
                placeholder="Search lead, phone, agent..."
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
                  onClick={() => handleSort("date")}
                  className="p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  Date {sortField === "date" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  onClick={() => handleSort("name")}
                  className="p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  Client Name {sortField === "name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  onClick={() => handleSort("leadCode")}
                  className="p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  Lead ID {sortField === "leadCode" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="p-3">Phone</th>
                <th
                  onClick={() => handleSort("user")}
                  className="p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  Representative / Agent {sortField === "user" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  onClick={() => handleSort("callType")}
                  className="p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  Call Type {sortField === "callType" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="p-3 text-right">Duration</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 animate-pulse">
                    <td colSpan={8} className="p-3 text-center text-gray-400">
                      Loading call details...
                    </td>
                  </tr>
                ))
              ) : paginatedRows.length > 0 ? (
                paginatedRows.map((row, idx) => {
                  const sl = (currentPage - 1) * entriesPerPage + idx + 1;
                  const dateStr = row.date ? String(row.date).slice(0, 10) : "—";
                  const clientName = row.name || row.lead?.clientName || "—";
                  const leadCode = row.leadCode || row.lead?.leadCode || "—";
                  const phone = row.number || row.phone || row.lead?.phone || "—";
                  const agent = row.user || "—";
                  const type = (row.callType || "Call").replace(/_/g, " ");

                  return (
                    <tr
                      key={row.uuid || row.id || idx}
                      className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="p-3 text-center text-gray-500">{sl}</td>
                      <td className="p-3 text-gray-600">{dateStr}</td>
                      <td className="p-3 font-medium text-gray-800">{clientName}</td>
                      <td className="p-3 font-mono text-indigo-600">{leadCode}</td>
                      <td className="p-3 text-gray-700">{phone}</td>
                      <td className="p-3 text-gray-700">{agent}</td>
                      <td className="p-3 text-gray-700 capitalize">{type}</td>
                      <td className="p-3 text-right font-mono text-gray-600">{row.duration || "0 sec"}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    No call details found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
            {totalDuration && (
              <tfoot>
                <tr className="bg-indigo-50/60 font-semibold text-gray-800 border-t border-indigo-200">
                  <td colSpan={7} className="p-3 text-left">
                    Total Duration Across Records
                  </td>
                  <td className="p-3 text-right font-mono text-indigo-700">{totalDuration}</td>
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
