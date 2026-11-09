/* eslint-disable prettier/prettier */
"use client";

import React, { useState, useEffect } from "react";
import { crmFetch, API_ORIGIN } from "../../crm-fetch";

// --- Types for Dropdowns API ---
interface Project {
  uuid: string;
  code: string;
  name: string;
}

interface FlatLand {
  uuid: string;
  projectId: string | null;
  projectName: string;
  flatLandNo: string;
  propertyType: string;
}

interface DropdownsResponse {
  success: boolean;
  data: {
    projects: Project[];
    flatLands: FlatLand[];
  };
}

// --- Types for Report API ---
interface ReportRow {
  sl: number;
  lead: string;
  leadId: string;
  leadStage: string | null;
  leadStageId: string | null;
  project: string;
  projectId: string;
  flatLand: string;
  flatLandId: string | null;
  sourcer: string | null;
  sourcerId: string | null;
  interestId: string;
  status: string;
}

interface ReportResponse {
  success: boolean;
  data: {
    data: ReportRow[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export default function InterestedFlatLandReportPage() {
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
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedFlatLand, setSelectedFlatLand] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Fetch Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const [dropdownRes, reportRes] = await Promise.all([
          crmFetch(
            `${baseUrl}/realbizpro/api/v1/crm/reports/interested-flat-land/dropdowns`,
          ),
          crmFetch(
            `${baseUrl}/realbizpro/api/v1/crm/reports/interested-flat-land?page=1&limit=100`,
          ), // Fetch high limit for client-side filtering
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

  // 2. Client-Side Filtering & Searching Logic
  const filteredRows =
    reportData?.data.filter((row) => {
      // A. Project Filter
      if (selectedProject && row.projectId !== selectedProject) {
        return false;
      }

      // B. Flat/Land Filter
      if (selectedFlatLand && row.flatLand !== selectedFlatLand) {
        return false;
      }

      // C. Search Term Filter (Lead, Stage, Project, Flat/Land, Sourcer)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          row.lead?.toLowerCase().includes(searchLower) ||
          row.leadStage?.toLowerCase().includes(searchLower) ||
          row.project?.toLowerCase().includes(searchLower) ||
          row.flatLand?.toLowerCase().includes(searchLower) ||
          row.sourcer?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      return true;
    }) || [];

  // 3. Reset Filters
  const resetFilters = () => {
    setSelectedProject("");
    setSelectedFlatLand("");
    setSearchTerm("");
  };

  // Helper to filter Flat/Lands based on selected Project (for the dropdown)
  const availableFlatLands =
    dropdownData?.flatLands.filter(
      (fl) => !selectedProject || fl.projectId === selectedProject,
    ) || [];

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
        <span>Reports</span> <span>{">"}</span>
        <span className="text-gray-800">Interested Flat/Land Report</span>
      </div>

      {/* Filter Section */}
      <div className="mb-6 flex flex-col md:flex-row items-end gap-4">
        {/* Project Dropdown */}
        <div className="w-full md:w-64">
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
            Projects
          </label>
          <select
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value);
              setSelectedFlatLand(""); // Reset flat/land when project changes
            }}
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

        {/* Flat/Land Dropdown */}
        <div className="w-full md:w-64">
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
            Flat/Land
          </label>
          <select
            value={selectedFlatLand}
            onChange={(e) => setSelectedFlatLand(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
          >
            <option value="">Select value</option>
            {availableFlatLands.map((fl) => (
              <option key={fl.uuid} value={fl.flatLandNo}>
                {fl.flatLandNo} ({fl.projectName})
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors">
            PDF
          </button>
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors">
            Excel
          </button>
          <button
            onClick={resetFilters}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Table Header Controls */}
        <div className="p-3 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Show</span>
            <select className="border border-gray-300 rounded px-2 py-1 bg-white">
              <option>10</option>
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Search:</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search lead, project..."
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

          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead className="text-[11px] text-white uppercase bg-indigo-500">
              <tr>
                <th className="px-4 py-3 font-semibold border-r border-indigo-400 w-12">
                  SL
                </th>
                <th className="px-4 py-3 font-semibold border-r border-indigo-400 text-indigo-200">
                  LEAD
                </th>
                <th className="px-4 py-3 font-semibold border-r border-indigo-400 text-indigo-200">
                  LEAD STAGE
                </th>
                <th className="px-4 py-3 font-semibold border-r border-indigo-400 text-indigo-200">
                  PROJECT
                </th>
                <th className="px-4 py-3 font-semibold border-r border-indigo-400 text-indigo-200">
                  FLAT/LAND
                </th>
                <th className="px-4 py-3 font-semibold text-indigo-200">
                  SR/OFFICER
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && !loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
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
                    <td className="px-4 py-2 border-r text-gray-600">
                      {row.sl}
                    </td>
                    <td className="px-4 py-2 border-r text-indigo-600 font-medium">
                      {row.lead}
                    </td>
                    <td className="px-4 py-2 border-r text-gray-600">
                      {row.leadStage || "-"}
                    </td>
                    <td className="px-4 py-2 border-r text-gray-600">
                      {row.project}
                    </td>
                    <td className="px-4 py-2 border-r text-gray-600">
                      {row.flatLand}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {row.sourcer || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer (Static visual based on mockup) */}
        <div className="p-3 flex justify-between items-center text-xs text-gray-500 border-t border-gray-200">
          <div>
            Showing {filteredRows.length > 0 ? 1 : 0} to {filteredRows.length}{" "}
            of {reportData?.meta.total || 0} entries
          </div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-400 cursor-not-allowed">
              Previous
            </button>
            <button className="px-3 py-1 border border-indigo-500 rounded bg-indigo-500 text-white font-medium">
              1
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-700">
              2
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
