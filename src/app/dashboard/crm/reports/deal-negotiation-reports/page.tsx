/* eslint-disable prettier/prettier */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { crmFetch, API_ORIGIN } from "../../crm-fetch";

// --- Types for Dropdowns API ---
interface DropdownOption {
  uuid: string;
  name?: string;
  clientName?: string;
  label?: string;
  value?: string;
}

interface FlatLandOption {
  uuid: string;
  projectId: string | null;
  flatLandNo: string;
  projectName: string;
}

interface DropdownsResponse {
  success: boolean;
  data: {
    projects: DropdownOption[];
    flatLands: FlatLandOption[];
    leads: DropdownOption[];
    users: DropdownOption[];
    activityTypes: DropdownOption[];
    statuses: DropdownOption[];
  };
}

// --- Types for Report API ---
interface DealRow {
  id: string;
  uuid: string;
  sl: number;
  leadName: string;
  leadId: string;
  leadCode: string;
  project: string;
  projectId: string;
  flatLand: string;
  flatLandId: string;
  activityType: string;
  clientOfferPrice: number;
  counterPrice: number | null;
  finalPrice: number | null;
  round: number | null;
  status: string;
  statusLabel: string;
  createdBy: string | null;
  createdById: string | null;
  approvedBy: string | null;
  approvedById: string | null;
  date: string;
}

interface ReportResponse {
  success: boolean;
  data: {
    data: DealRow[];
    totals: {
      clientOfferPrice: number;
      counterPrice: number;
      finalPrice: number;
    };
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// --- Helpers ---
const formatCurrency = (amount: number | null) => {
  if (amount === null || amount === 0) return "-";
  return amount.toLocaleString("en-US");
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const StatusBadge = ({ status, label }: { status: string; label: string }) => {
  const styles: Record<string, string> = {
    pending: "bg-orange-400 text-white",
    approved: "bg-green-500 text-white",
    rejected: "bg-red-500 text-white",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-semibold ${styles[status] || "bg-gray-200 text-gray-800"}`}
    >
      {label}
    </span>
  );
};

export default function DealNegotiationPage() {
  const baseUrl = API_ORIGIN;

  // --- State ---
  const [dropdowns, setDropdowns] = useState<DropdownsResponse["data"] | null>(
    null,
  );
  const [reportData, setReportData] = useState<ReportResponse["data"] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter States
  const [filters, setFilters] = useState({
    projectId: "",
    flatLandNo: "",
    leadId: "",
    activityType: "",
    status: "",
    createdBy: "",
  });

  // --- Fetch Dropdowns on Mount ---
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const res = await crmFetch(
          `${baseUrl}/realbizpro/api/v1/crm/reports/deal-negotiation/dropdowns`,
        );
        const json: DropdownsResponse = await res.json();
        if (json.success) setDropdowns(json.data);
      } catch (err) {
        console.error("Error fetching dropdowns", err);
      }
    };
    fetchDropdowns();
  }, [baseUrl]);

  // --- Fetch Report Data (Triggered by filters) ---
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      // Build query string based on active filters
      const queryParams = new URLSearchParams({
        page: "1",
        limit: "10",
      });

      if (filters.projectId) queryParams.append("projectId", filters.projectId);
      if (filters.flatLandNo)
        queryParams.append("flatLandNo", filters.flatLandNo);
      if (filters.leadId) queryParams.append("leadId", filters.leadId);
      if (filters.activityType)
        queryParams.append("activityType", filters.activityType);
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.createdBy) queryParams.append("createdBy", filters.createdBy);

      const res = await crmFetch(
        `${baseUrl}/realbizpro/api/v1/crm/reports/deal-negotiation?${queryParams.toString()}`,
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
  }, [baseUrl, filters]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Handle Filter Change
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Reset Filters
  const resetFilters = () => {
    setFilters({
      projectId: "",
      flatLandNo: "",
      leadId: "",
      activityType: "",
      status: "",
      createdBy: "",
    });
  };

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
      <div className="mb-4 text-xs font-medium text-indigo-600 flex items-center gap-1">
        <span>Home</span> <span>{">"}</span> <span>CRM</span> <span>{">"}</span>{" "}
        <span className="text-gray-800">Deal Negotiation Report</span>
      </div>

      {/* Filter Section */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Select Date
            </label>
            <input
              type="text"
              defaultValue="1 October, 2026 - 31 October, 2026"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Project
            </label>
            <select
              name="projectId"
              value={filters.projectId}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
            >
              <option value="">Select value</option>
              {dropdowns?.projects.map((p) => (
                <option key={p.uuid} value={p.uuid}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Flat/Land No
            </label>
            <select
              name="flatLandNo"
              value={filters.flatLandNo}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
            >
              <option value="">Select Flat/Land No</option>
              {dropdowns?.flatLands.map((f) => (
                <option key={f.uuid} value={f.flatLandNo}>
                  {f.flatLandNo} - {f.projectName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Lead
            </label>
            <select
              name="leadId"
              value={filters.leadId}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
            >
              <option value="">Select Lead</option>
              {dropdowns?.leads.map((l) => (
                <option key={l.uuid} value={l.uuid}>
                  {l.clientName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Activity Type
            </label>
            <select
              name="activityType"
              value={filters.activityType}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
            >
              <option value="">Select value</option>
              {dropdowns?.activityTypes.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Status
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
            >
              <option value="">Select value</option>
              {dropdowns?.statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Created By
            </label>
            <select
              name="createdBy"
              value={filters.createdBy}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
            >
              <option value="">Select value</option>
              {dropdowns?.users.map((u) => (
                <option key={u.uuid} value={u.uuid}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Button */}
          <div className="flex items-end pb-[2px]">
            <button
              onClick={resetFilters}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium shadow-sm transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-200">
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex gap-1">
              <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded font-medium">
                Excel
              </button>
              <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded font-medium">
                PDF
              </button>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <span>Show</span>
              <select className="border border-gray-300 rounded px-2 py-1 bg-white">
                <option>10</option>
              </select>
              <span>entries</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Search:</span>
            <input
              type="text"
              className="border border-gray-300 rounded px-3 py-1 bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

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
                <th className="px-3 py-3 font-semibold border-r border-indigo-400 w-10 text-center">
                  #
                </th>
                <th className="px-3 py-3 font-semibold border-r border-indigo-400">
                  Lead Name
                </th>
                <th className="px-3 py-3 font-semibold border-r border-indigo-400">
                  Project
                </th>
                <th className="px-3 py-3 font-semibold border-r border-indigo-400">
                  Flat/Land
                </th>
                <th className="px-3 py-3 font-semibold border-r border-indigo-400">
                  Activity Type
                </th>
                <th className="px-3 py-3 font-semibold border-r border-indigo-400 text-right">
                  Client Offer Price
                </th>
                <th className="px-3 py-3 font-semibold border-r border-indigo-400 text-right">
                  Counter Price
                </th>
                <th className="px-3 py-3 font-semibold border-r border-indigo-400 text-right">
                  Final Price
                </th>
                <th className="px-3 py-3 font-semibold border-r border-indigo-400 text-center">
                  Round
                </th>
                <th className="px-3 py-3 font-semibold border-r border-indigo-400 text-center">
                  Status
                </th>
                <th className="px-3 py-3 font-semibold border-r border-indigo-400">
                  Created By
                </th>
                <th className="px-3 py-3 font-semibold border-r border-indigo-400">
                  Approved By
                </th>
                <th className="px-3 py-3 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {!loading && reportData?.data.length === 0 && (
                <tr>
                  <td
                    colSpan={13}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No data available in table
                  </td>
                </tr>
              )}

              {reportData?.data.map((row) => (
                <tr
                  key={row.uuid}
                  className="bg-white border-b hover:bg-gray-50"
                >
                  <td className="px-3 py-2.5 border-r text-center text-gray-600">
                    {row.sl}
                  </td>
                  <td className="px-3 py-2.5 border-r text-gray-800">
                    {row.leadName}
                  </td>
                  <td className="px-3 py-2.5 border-r text-gray-600">
                    {row.project}
                  </td>
                  <td className="px-3 py-2.5 border-r text-gray-600">
                    {row.flatLand}
                  </td>
                  <td className="px-3 py-2.5 border-r text-center">
                    <span className="bg-indigo-500 text-white px-2 py-0.5 rounded text-[10px] font-medium uppercase">
                      {row.activityType}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 border-r text-right text-gray-800 font-medium">
                    {formatCurrency(row.clientOfferPrice)}
                  </td>
                  <td className="px-3 py-2.5 border-r text-right text-gray-600">
                    {formatCurrency(row.counterPrice)}
                  </td>
                  <td className="px-3 py-2.5 border-r text-right text-gray-800 font-medium">
                    {formatCurrency(row.finalPrice)}
                  </td>
                  <td className="px-3 py-2.5 border-r text-center text-gray-600">
                    {row.round || "-"}
                  </td>
                  <td className="px-3 py-2.5 border-r text-center">
                    <StatusBadge status={row.status} label={row.statusLabel} />
                  </td>
                  <td className="px-3 py-2.5 border-r text-gray-600">
                    {row.createdBy || "-"}
                  </td>
                  <td className="px-3 py-2.5 border-r text-gray-600">
                    {row.approvedBy || "-"}
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-600">
                    {formatDate(row.date)}
                  </td>
                </tr>
              ))}

              {/* Totals Row */}
              {reportData && reportData.data.length > 0 && (
                <tr className="bg-white font-bold border-b">
                  <td
                    colSpan={5}
                    className="px-3 py-3 border-r text-right text-gray-700 uppercase"
                  >
                    Total:
                  </td>
                  <td className="px-3 py-3 border-r text-right text-gray-800">
                    {formatCurrency(reportData.totals.clientOfferPrice)}
                  </td>
                  <td className="px-3 py-3 border-r text-right text-gray-800">
                    {formatCurrency(reportData.totals.counterPrice)}
                  </td>
                  <td className="px-3 py-3 border-r text-right text-gray-800">
                    {reportData.totals.finalPrice === 0
                      ? "NAN"
                      : formatCurrency(reportData.totals.finalPrice)}
                  </td>
                  <td colSpan={5} className="px-3 py-3"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 flex justify-between items-center text-xs text-gray-500">
          <div>
            Showing {reportData?.data.length ? 1 : 0} to{" "}
            {reportData?.data.length || 0} of {reportData?.meta.total || 0}{" "}
            entries
          </div>
          <div className="flex gap-1">
            <button
              className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-500"
              disabled={reportData?.meta.page === 1}
            >
              Previous
            </button>
            <button className="px-3 py-1 border border-indigo-500 rounded bg-indigo-500 text-white font-medium">
              {reportData?.meta.page || 1}
            </button>
            <button
              className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-500"
              disabled={reportData?.meta.page === reportData?.meta.totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
