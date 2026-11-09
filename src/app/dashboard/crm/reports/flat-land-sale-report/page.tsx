/* eslint-disable prettier/prettier */
"use client";

import React, { useState, useEffect } from "react";
import { crmFetch, API_ORIGIN } from "../../crm-fetch";

// --- Types for Dropdowns API ---
interface SalesByOption {
  value: string;
  label: string;
}

interface TeamOption {
  uuid: string;
  projectId: string;
  name: string;
  email: string;
}

interface ProjectOption {
  uuid: string;
  code: string;
  name: string;
}

interface UserOption {
  uuid: string;
  name: string;
}

interface DropdownsResponse {
  success: boolean;
  data: {
    salesBy: SalesByOption[];
    teams: TeamOption[];
    projects: ProjectOption[];
    users: UserOption[];
  };
}

// --- Types for Report API ---
interface SaleRow {
  id: string;
  sl: number;
  project: string | null;
  projectId: string;
  customerName: string;
  saleCode: string;
  flatLandNo: string | null;
  flatLandId: string;
  sftSize: number;
  rate: number;
  total: number;
  parking: number;
  utilityCharge: number;
  otherCost: number;
  discount: number;
  adjustment: number;
  grandTotal: number;
  paid: number;
  due: number;
  agreementDate: string | null;
  handoverDate: string | null;
  salesBy: string | null;
  salesById: string | null;
  bookingDate: string;
  bookingId: string;
}

interface ReportResponse {
  success: boolean;
  data: {
    data: SaleRow[];
    totals: {
      sftSize: number;
      rate: number;
      total: number;
      parking: number;
      utilityCharge: number;
      otherCost: number;
      discount: number;
      adjustment: number;
      grandTotal: number;
      paid: number;
      due: number;
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
  if (amount === null || amount === 0) return "0.00";
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export default function FlatLandSaleReportPage() {
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
  const [selectedSalesBy, setSelectedSalesBy] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Fetch Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const [dropdownRes, reportRes] = await Promise.all([
          crmFetch(
            `${baseUrl}/realbizpro/api/v1/crm/reports/flat-land-sales/dropdowns`,
          ),
          crmFetch(
            `${baseUrl}/realbizpro/api/v1/crm/reports/flat-land-sales?page=1&limit=100`,
          ), // High limit for client-side filtering
        ]);

        const dropdownJson: DropdownsResponse = await dropdownRes.json();
        const reportJson: ReportResponse = await reportRes.json();

        if (dropdownJson.success) setDropdownData(dropdownJson.data);

        if (reportJson.success) {
          setReportData(reportJson.data);
        } else {
          setErrorMsg("Failed to load report data.");
        }
      } catch (err: any) {
        console.error("Fetch Error:", err);
        setErrorMsg(`Network Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [baseUrl]);

  // 2. Client-Side Filtering Logic
  const filteredRows =
    reportData?.data.filter((row) => {
      // A. Sales By Filter
      if (selectedSalesBy && row.salesBy !== selectedSalesBy) return false;

      // B. Team Filter (Checking if the team's UUID matches the salesById or projectId as a fallback)
      if (
        selectedTeam &&
        row.salesById !== selectedTeam &&
        row.projectId !== selectedTeam
      )
        return false;

      // C. Project Filter
      if (selectedProject && row.projectId !== selectedProject) return false;

      // D. Search Term Filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          row.customerName?.toLowerCase().includes(searchLower) ||
          row.saleCode?.toLowerCase().includes(searchLower) ||
          row.flatLandNo?.toLowerCase().includes(searchLower) ||
          row.salesBy?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      return true;
    }) || [];

  // 3. Calculate Totals dynamically based on filtered rows
  const calculatedTotals = filteredRows.reduce(
    (acc, row) => ({
      total: acc.total + row.total,
      parking: acc.parking + row.parking,
      utilityCharge: acc.utilityCharge + row.utilityCharge,
      otherCost: acc.otherCost + row.otherCost,
      discount: acc.discount + row.discount,
      adjustment: acc.adjustment + row.adjustment,
      grandTotal: acc.grandTotal + row.grandTotal,
      paid: acc.paid + row.paid,
      due: acc.due + row.due,
      sftSize: acc.sftSize + row.sftSize,
      rate: acc.rate + row.rate,
    }),
    {
      total: 0,
      parking: 0,
      utilityCharge: 0,
      otherCost: 0,
      discount: 0,
      adjustment: 0,
      grandTotal: 0,
      paid: 0,
      due: 0,
      sftSize: 0,
      rate: 0,
    },
  );

  const resetFilters = () => {
    setSelectedSalesBy("");
    setSelectedTeam("");
    setSelectedProject("");
    setSearchTerm("");
  };

  if (errorMsg && !reportData) {
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
        <span>Home</span> <span>{">"}</span>
        <span>Flat/Land</span> <span>{">"}</span>
        <span className="text-gray-800">Flat/Land Sale Report</span>
      </div>

      {/* Filter Section */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Select Date */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Select Date
            </label>
            <input
              type="text"
              defaultValue="1 October, 2026 - 31 October, 2026"
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
            />
          </div>

          {/* Sales By Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Sales By
            </label>
            <select
              value={selectedSalesBy}
              onChange={(e) => setSelectedSalesBy(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
            >
              <option value="">Select value</option>
              {dropdownData?.salesBy.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Team Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Team
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
            >
              <option value="">Select value</option>
              {dropdownData?.teams.map((t) => (
                <option key={t.uuid} value={t.uuid}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
            >
              <option value="">Select value</option>
              {dropdownData?.projects.map((p) => (
                <option key={p.uuid} value={p.uuid}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Table Header Controls */}
        <div className="p-3 flex flex-col md:flex-row justify-between items-center gap-3 border-b border-gray-200">
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 bg-white focus:outline-none focus:border-indigo-500 w-64 shadow-sm"
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

          <table className="w-full text-[11px] text-left whitespace-nowrap">
            <thead className="bg-[#7c7af1] text-white uppercase">
              <tr>
                <th className="px-2 py-2 font-medium border-r border-[#8b89f3]">
                  ID
                </th>
                <th className="px-2 py-2 font-medium border-r border-[#8b89f3]">
                  Project
                </th>
                <th className="px-2 py-2 font-medium border-r border-[#8b89f3]">
                  Customer Name
                </th>
                <th className="px-2 py-2 font-medium border-r border-[#8b89f3]">
                  Sale Code
                </th>
                <th className="px-2 py-2 font-medium border-r border-[#8b89f3]">
                  Flat/Land No
                </th>
                <th className="px-2 py-2 font-medium border-r border-[#8b89f3]">
                  Sft Size
                </th>
                <th className="px-2 py-2 font-medium border-r border-[#8b89f3]">
                  Rate
                </th>
                <th className="px-2 py-2 font-medium border-r border-[#8b89f3]">
                  Total
                </th>
                <th className="px-2 py-2 font-medium border-r border-[#8b89f3]">
                  Parking
                </th>
                <th className="px-2 py-2 font-medium border-r border-[#8b89f3]">
                  Utility Charge
                </th>
                <th className="px-2 py-2 font-medium border-r border-[#8b89f3]">
                  Other Cost
                </th>
                <th className="px-2 py-2 font-medium border-r border-[#8b89f3]">
                  Discount
                </th>
                <th className="px-2 py-2 font-medium border-r border-[#8b89f3]">
                  Adjustment
                </th>
                <th className="px-2 py-2 font-medium border-r border-[#8b89f3]">
                  Grand Total
                </th>
                <th className="px-2 py-2 font-medium border-r border-[#8b89f3]">
                  Paid
                </th>
                <th className="px-2 py-2 font-medium border-r border-[#8b89f3]">
                  Due
                </th>
                <th className="px-2 py-2 font-medium border-r border-[#8b89f3]">
                  Agreement Date
                </th>
                <th className="px-2 py-2 font-medium border-r border-[#8b89f3]">
                  Handover Date
                </th>
                <th className="px-2 py-2 font-medium">Sales By</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && !loading ? (
                <tr>
                  <td
                    colSpan={19}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No data available in table
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="px-2 py-2 border-r text-gray-600">
                      {row.sl}
                    </td>
                    <td className="px-2 py-2 border-r text-gray-600">
                      {row.project || "-"}
                    </td>
                    <td className="px-2 py-2 border-r text-indigo-600 font-medium">
                      {row.customerName}
                    </td>
                    <td className="px-2 py-2 border-r text-indigo-600">
                      {row.saleCode}
                    </td>
                    <td className="px-2 py-2 border-r text-indigo-600">
                      {row.flatLandNo || "-"}
                    </td>
                    <td className="px-2 py-2 border-r text-gray-800 text-right">
                      {row.sftSize}
                    </td>
                    <td className="px-2 py-2 border-r text-gray-800 text-right">
                      {row.rate}
                    </td>
                    <td className="px-2 py-2 border-r text-gray-800 text-right">
                      {row.total}
                    </td>
                    <td className="px-2 py-2 border-r text-gray-800 text-right">
                      {row.parking}
                    </td>
                    <td className="px-2 py-2 border-r text-gray-800 text-right">
                      {row.utilityCharge}
                    </td>
                    <td className="px-2 py-2 border-r text-gray-800 text-right">
                      {row.otherCost}
                    </td>
                    <td className="px-2 py-2 border-r text-gray-800 text-right">
                      {formatCurrency(row.discount)}
                    </td>
                    <td className="px-2 py-2 border-r text-gray-800 text-right">
                      {formatCurrency(row.adjustment)}
                    </td>
                    <td className="px-2 py-2 border-r text-gray-800 text-right">
                      {row.grandTotal}
                    </td>
                    <td className="px-2 py-2 border-r text-gray-800 text-right">
                      {row.paid}
                    </td>
                    <td className="px-2 py-2 border-r text-gray-800 text-right">
                      {row.due}
                    </td>
                    <td className="px-2 py-2 border-r text-gray-600">
                      {formatDate(row.agreementDate)}
                    </td>
                    <td className="px-2 py-2 border-r text-gray-600">
                      {formatDate(row.handoverDate)}
                    </td>
                    <td className="px-2 py-2 text-gray-600">
                      {row.salesBy || "-"}
                    </td>
                  </tr>
                ))
              )}

              {/* Totals Row */}
              {filteredRows.length > 0 && (
                <tr className="bg-white font-bold border-b text-gray-800">
                  <td colSpan={7} className="px-2 py-3 text-right uppercase">
                    TOTAL:
                  </td>
                  <td className="px-2 py-3 border-r text-right">
                    {calculatedTotals.total}
                  </td>
                  <td className="px-2 py-3 border-r text-right">
                    {calculatedTotals.parking}
                  </td>
                  <td className="px-2 py-3 border-r text-right">
                    {calculatedTotals.utilityCharge}
                  </td>
                  <td className="px-2 py-3 border-r text-right">
                    {calculatedTotals.otherCost}
                  </td>
                  <td className="px-2 py-3 border-r text-right">
                    {formatCurrency(calculatedTotals.discount)}
                  </td>
                  <td className="px-2 py-3 border-r text-right">
                    {formatCurrency(calculatedTotals.adjustment)}
                  </td>
                  <td className="px-2 py-3 border-r text-right">
                    {calculatedTotals.grandTotal}
                  </td>
                  <td className="px-2 py-3 border-r text-right">
                    {calculatedTotals.paid}
                  </td>
                  <td className="px-2 py-3 border-r text-right">
                    {calculatedTotals.due}
                  </td>
                  <td colSpan={3} className="px-2 py-3"></td>
                </tr>
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
            <button className="px-3 py-1 border border-gray-300 rounded bg-gray-50 text-gray-400 cursor-not-allowed">
              Previous
            </button>
            <button className="px-3 py-1 border border-indigo-500 rounded bg-indigo-500 text-white font-medium">
              1
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-700">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
