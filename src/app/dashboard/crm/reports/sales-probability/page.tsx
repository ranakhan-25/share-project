/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { crmFetch, API_ORIGIN } from "../../crm-fetch";

// --- Types for Dropdowns API ---
interface UserDropdown {
  uuid: string;
  name: string;
}

interface DropdownsResponse {
  success: boolean;
  data: {
    users: UserDropdown[];
    leadStages: any[];
  };
}

// --- Types for Report API ---
interface SalesProbabilityRow {
  sl: number;
  lead: string;
  leadId: string;
  stage: string | null;
  stageId: string | null;
  user: string | null;
  userId: string | null;
  probability: number | null;
}

interface ReportResponse {
  success: boolean;
  data: {
    data: SalesProbabilityRow[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      userId: string | null;
      minimumPercentage: number;
      maximumPercentage: number;
      probabilityConfigured: boolean;
    };
  };
}

export default function SalesProbabilityPage() {
  const baseUrl = API_ORIGIN;

  // --- States ---
  const [dropdownData, setDropdownData] = useState<
    DropdownsResponse["data"] | null
  >(null);
  const [reportData, setReportData] = useState<ReportResponse["data"] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter States
  const [userId, setUserId] = useState("");
  const [minPercentage, setMinPercentage] = useState("0");
  const [maxPercentage, setMaxPercentage] = useState("100");

  // Search State
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Fetch Dropdowns on Mount
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const res = await crmFetch(
          `${baseUrl}/realbizpro/api/v1/crm/reports/sales-probability/dropdowns`,
        );
        const json: DropdownsResponse = await res.json();
        if (json.success) setDropdownData(json.data);
      } catch (err) {
        console.error("Error fetching dropdowns", err);
      }
    };
    fetchDropdowns();
  }, [baseUrl]);

  // 2. Fetch Report Data (Triggered by Dropdown / Percentage changes)
  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        // Build Query Params
        const params = new URLSearchParams({
          minimumPercentage: minPercentage || "0",
          maximumPercentage: maxPercentage || "100",
          page: "1",
          limit: "10",
        });

        if (userId) params.append("userId", userId);

        const res = await crmFetch(
          `${baseUrl}/realbizpro/api/v1/crm/reports/sales-probability?${params.toString()}`,
        );
        const json: ReportResponse = await res.json();

        if (json.success) {
          setReportData(json.data);
          setErrorMsg(null);
        } else {
          setErrorMsg("Failed to load report data.");
        }
      } catch (err) {
        console.error("Error fetching report", err);
        setErrorMsg("An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    // Debounce slightly to prevent spamming API on fast typing
    const timeoutId = setTimeout(() => {
      fetchReport();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [baseUrl, userId, minPercentage, maxPercentage]);

  // 3. Client-side Search Filter
  const filteredRows =
    reportData?.data.filter((row) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        row.lead?.toLowerCase().includes(searchLower) ||
        row.stage?.toLowerCase().includes(searchLower) ||
        row.user?.toLowerCase().includes(searchLower) ||
        row.sl.toString().includes(searchLower)
      );
    }) || [];

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center text-red-500 font-medium">
        {errorMsg}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-sm">
      {/* Header Breadcrumb */}
      <div className="mb-4 text-xs font-medium text-gray-500 flex items-center gap-1">
        <span className="text-indigo-600">Home</span>
        <span>/</span>
        <span className="text-indigo-600">Reports</span>
        <span>/</span>
        <span className="text-gray-800">Sales Probability</span>
      </div>

      {/* Filter Section */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
          {/* User Dropdown */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              User
            </label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
            >
              <option value="">Select User</option>
              {dropdownData?.users.map((user) => (
                <option key={user.uuid} value={user.uuid}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Min Percentage */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Minimum Percentage
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={minPercentage}
                onChange={(e) => setMinPercentage(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
              />
              <span className="absolute right-3 top-2 text-gray-400">%</span>
            </div>
          </div>

          {/* Max Percentage & PDF Button */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Maximum Percentage
            </label>
            <div className="flex gap-2">
              <div className="relative w-full">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={maxPercentage}
                  onChange={(e) => setMaxPercentage(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
                />
                <span className="absolute right-3 top-2 text-gray-400">%</span>
              </div>
              <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded text-sm font-medium shadow-sm transition-colors">
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Table Header Controls */}
        <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Show</span>
            <select className="border border-gray-300 rounded px-2 py-1 bg-white">
              <option>{reportData?.meta.limit || 10}</option>
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Search:</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search lead, user..."
              className="border border-gray-300 rounded px-3 py-1 bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Main Table */}
        <div className="overflow-x-auto relative min-h-[200px]">
          {loading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
              <span className="text-indigo-600 font-semibold animate-pulse">
                Loading data...
              </span>
            </div>
          )}

          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead className="text-[11px] text-white uppercase bg-indigo-500">
              <tr>
                <th className="px-4 py-3 font-semibold border-r border-indigo-400 w-16">
                  SL
                </th>
                <th className="px-4 py-3 font-semibold border-r border-indigo-400 w-1/3">
                  Lead
                </th>
                <th className="px-4 py-3 font-semibold border-r border-indigo-400">
                  Stage
                </th>
                <th className="px-4 py-3 font-semibold border-r border-indigo-400">
                  User
                </th>
                <th className="px-4 py-3 font-semibold">Probability</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500 bg-gray-50/50"
                  >
                    No data available in table
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.sl}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="px-4 py-2.5 border-r text-gray-600">
                      {row.sl}
                    </td>
                    <td className="px-4 py-2.5 border-r text-gray-800">
                      {row.lead}
                    </td>
                    <td className="px-4 py-2.5 border-r text-gray-600">
                      {row.stage || "-"}
                    </td>
                    <td className="px-4 py-2.5 border-r text-gray-600">
                      {row.user || "-"}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {row.probability !== null ? `${row.probability}%` : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 flex justify-between items-center text-xs text-gray-500 border-t border-gray-200">
          <div>
            Showing {filteredRows.length > 0 ? 1 : 0} to {filteredRows.length}{" "}
            of {reportData?.meta.total || 0} entries
          </div>
          <div className="flex gap-1">
            <button
              className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={reportData?.meta.page === 1 || loading}
            >
              Previous
            </button>
            <button
              className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                reportData?.meta.page === reportData?.meta.totalPages || loading
              }
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
