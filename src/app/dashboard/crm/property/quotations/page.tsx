/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { crmFetch, API_ORIGIN } from "../../crm-fetch";
import { ChevronLeft, ChevronRight, Search, RotateCcw } from "lucide-react";

interface QuotationItem {
  id?: string | number;
  uuid: string;
  quotationNo?: string;
  clientName?: string;
  projectName?: string;
  totalAmount?: number | string;
  status?: string;
  createdAt?: string;
  date?: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    data: QuotationItem[];
    meta?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export default function QuotationsPage() {
  const baseUrl = API_ORIGIN;

  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("quotationNo");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await crmFetch(`${baseUrl}/realbizpro/api/v1/quotation?page=1&limit=100`);
      const json: ApiResponse = await res.json();
      if (json.success && json.data) {
        const rows = Array.isArray(json.data) ? json.data : json.data.data || [];
        setQuotations(rows);
      } else {
        setQuotations([]);
      }
    } catch (err: any) {
      console.error("Fetch quotations error:", err);
      setErrorMsg(err.message || "Failed to load quotations.");
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const resetFilters = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const processedRows = useMemo(() => {
    let rows = [...quotations];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter((r) => {
        const no = r.quotationNo || "";
        const client = r.clientName || "";
        const project = r.projectName || "";
        return no.toLowerCase().includes(q) || client.toLowerCase().includes(q) || project.toLowerCase().includes(q);
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
  }, [quotations, searchTerm, sortField, sortOrder]);

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
        <span>Property</span> <span>{">"}</span>
        <span className="text-gray-800">Quotations</span>
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
                placeholder="Search quotation, client..."
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
                  onClick={() => handleSort("quotationNo")}
                  className="p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  Quotation No {sortField === "quotationNo" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  onClick={() => handleSort("clientName")}
                  className="p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  Client Name {sortField === "clientName" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="p-3">Project</th>
                <th className="p-3 text-right">Total Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 animate-pulse">
                    <td colSpan={7} className="p-3 text-center text-gray-400">
                      Loading quotations...
                    </td>
                  </tr>
                ))
              ) : paginatedRows.length > 0 ? (
                paginatedRows.map((row, idx) => {
                  const sl = (currentPage - 1) * entriesPerPage + idx + 1;
                  const dateStr = row.date || row.createdAt ? String(row.date || row.createdAt).slice(0, 10) : "—";
                  const amount = row.totalAmount ? `৳${Number(row.totalAmount).toLocaleString()}` : "—";

                  return (
                    <tr
                      key={row.uuid || row.id || idx}
                      className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="p-3 text-center text-gray-500">{sl}</td>
                      <td className="p-3 font-mono font-medium text-indigo-600">{row.quotationNo || "QT-N/A"}</td>
                      <td className="p-3 font-medium text-gray-800">{row.clientName || "—"}</td>
                      <td className="p-3 text-gray-700">{row.projectName || "—"}</td>
                      <td className="p-3 text-right font-mono text-emerald-700 font-semibold">{amount}</td>
                      <td className="p-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {row.status || "Active"}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{dateStr}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    No quotation records found.
                  </td>
                </tr>
              )}
            </tbody>
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
