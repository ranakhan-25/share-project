/* eslint-disable prettier/prettier */
"use client";

import React, { useState, useEffect } from "react";
import { crmFetch, API_ORIGIN } from "../../crm-fetch";

// --- Types for Dropdowns API ---
interface TeamDropdownItem {
  id: string;
  uuid: string;
  name: string;
  leaderId: string;
}

interface DropdownsResponse {
  success: boolean;
  data: {
    teams: TeamDropdownItem[];
  };
}

// --- Types for Report API ---
interface LeadSummaryRow {
  teamId: string | number;
  name: string;
  lead: number;
  potential: number;
  prospect: number;
  highProspect: number;
  new: number;
  junk: number;
  untouch: number;
  total: number;
}

interface VisitSummaryRow {
  teamId: string | number;
  name: string;
  visited: number;
  schedule: number;
  canceled: number;
  newSchedule: number;
  rescheduled: number;
  total: number;
}

interface CallFollowupRow {
  teamId: string | number;
  name: string;
  call: number;
  followup: number;
  total: number;
}

interface ReportResponse {
  success: boolean;
  data: {
    data: {
      leadSummary: LeadSummaryRow[];
      visitSummary: VisitSummaryRow[];
      callFollowupSummary: CallFollowupRow[];
    };
    meta: {
      dateFrom: string;
      dateTo: string;
      totalTeams: number;
      totalLeads: number;
    };
  };
}

// --- Helper to format headers (e.g., "highProspect" -> "High Prospect") ---
const formatHeader = (key: string) => {
  if (key === "teamId") return "Team";
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

// --- Reusable Table Component ---
const ReportTable = ({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: React.ReactNode;
}) => (
  <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
    <h2 className="text-center text-lg font-bold text-gray-800 mb-4">
      {title}
    </h2>

    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left whitespace-nowrap">
        <thead className="text-xs text-white uppercase bg-indigo-500">
          <tr>
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-4 py-3 font-medium border-r border-indigo-400 last:border-r-0 text-center"
              >
                {formatHeader(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  </div>
);

// --- Main Page Component ---
export default function TeamSummaryReportPage() {
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

  // Filter States (Default to the dates from your API request)
  const [dateFrom, setDateFrom] = useState("2026-09-29");
  const [dateTo, setDateTo] = useState("2026-10-28");
  const [teamId, setTeamId] = useState("");

  // 1. Fetch Dropdowns on Mount
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const res = await crmFetch(
          `${baseUrl}/realbizpro/api/v1/crm/reports/team-summary/dropdowns`,
        );
        const json: DropdownsResponse = await res.json();
        if (json.success) setDropdownData(json.data);
      } catch (err) {
        console.error("Error fetching dropdowns", err);
      }
    };
    fetchDropdowns();
  }, [baseUrl]);

  // 2. Fetch Report Data (Triggered by Date or Team changes)
  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        // Build dynamic query params
        const params = new URLSearchParams();
        if (dateFrom) params.append("dateFrom", dateFrom);
        if (dateTo) params.append("dateTo", dateTo);
        if (teamId) params.append("teamId", teamId);

        const res = await crmFetch(
          `${baseUrl}/realbizpro/api/v1/crm/reports/team-summary?${params.toString()}`,
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

    // Debounce slightly to prevent API spam on fast typing
    const timeoutId = setTimeout(() => {
      fetchReport();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [baseUrl, dateFrom, dateTo, teamId]);

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center text-red-500 font-medium">
        {errorMsg}
      </div>
    );
  }

  // Safely extract data with fallbacks to empty arrays
  const leadSummary = reportData?.data.leadSummary || [];
  const visitSummary = reportData?.data.visitSummary || [];
  const callFollowupSummary = reportData?.data.callFollowupSummary || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      {/* Header Breadcrumb */}
      <div className="mb-4 text-sm font-semibold text-gray-800">
        Home / Reports / Team Summary Report
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Date From */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Team Dropdown */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Team
            </label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Teams</option>
              {dropdownData?.teams.map((team) => (
                <option key={team.uuid} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-2">
          <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded text-sm font-medium">
            PDF
          </button>
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium">
            Excel
          </button>

          {/* Optional: Reset Button */}
          <button
            onClick={() => {
              setTeamId("");
              setDateFrom("2026-09-29");
              setDateTo("2026-10-28");
            }}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1.5 rounded text-sm font-medium ml-auto"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="text-center text-indigo-600 font-semibold animate-pulse mb-4">
          Loading report data...
        </div>
      )}

      {/* Table 1: Lead Summary */}
      <ReportTable
        title="Lead Summary"
        headers={[
          "teamId",
          "lead",
          "potential",
          "prospect",
          "highProspect",
          "new",
          "junk",
          "untouch",
          "total",
        ]}
        rows={
          leadSummary.length === 0 && !loading ? (
            <tr>
              <td colSpan={9} className="text-center py-4 text-gray-500">
                No data available
              </td>
            </tr>
          ) : (
            leadSummary.map((row, idx) => {
              const isGrandTotal = row.teamId === "total";
              return (
                <tr
                  key={idx}
                  className={`border-b hover:bg-gray-50 ${isGrandTotal ? "bg-gray-100 font-bold" : "bg-white"}`}
                >
                  <td className="px-4 py-3 border-r text-center">{row.name}</td>
                  <td className="px-4 py-3 border-r text-center">{row.lead}</td>
                  <td className="px-4 py-3 border-r text-center">
                    {row.potential}
                  </td>
                  <td className="px-4 py-3 border-r text-center">
                    {row.prospect}
                  </td>
                  <td className="px-4 py-3 border-r text-center">
                    {row.highProspect}
                  </td>
                  <td className="px-4 py-3 border-r text-center">{row.new}</td>
                  <td className="px-4 py-3 border-r text-center">{row.junk}</td>
                  <td className="px-4 py-3 border-r text-center">
                    {row.untouch}
                  </td>
                  <td className="px-4 py-3 text-center">{row.total}</td>
                </tr>
              );
            })
          )
        }
      />

      {/* Table 2: Visit Summary */}
      <ReportTable
        title="Visit Summary"
        headers={[
          "teamId",
          "visited",
          "schedule",
          "canceled",
          "newSchedule",
          "rescheduled",
          "total",
        ]}
        rows={
          visitSummary.length === 0 && !loading ? (
            <tr>
              <td colSpan={7} className="text-center py-4 text-gray-500">
                No data available
              </td>
            </tr>
          ) : (
            visitSummary.map((row, idx) => {
              const isGrandTotal = row.teamId === "total";
              return (
                <tr
                  key={idx}
                  className={`border-b hover:bg-gray-50 ${isGrandTotal ? "bg-gray-100 font-bold" : "bg-white"}`}
                >
                  <td className="px-4 py-3 border-r text-center">{row.name}</td>
                  <td className="px-4 py-3 border-r text-center">
                    {row.visited}
                  </td>
                  <td className="px-4 py-3 border-r text-center">
                    {row.schedule}
                  </td>
                  <td className="px-4 py-3 border-r text-center">
                    {row.canceled}
                  </td>
                  <td className="px-4 py-3 border-r text-center">
                    {row.newSchedule}
                  </td>
                  <td className="px-4 py-3 border-r text-center">
                    {row.rescheduled}
                  </td>
                  <td className="px-4 py-3 text-center">{row.total}</td>
                </tr>
              );
            })
          )
        }
      />

      {/* Table 3: Call/Followup Summary */}
      <ReportTable
        title="Call/Followup Summary"
        headers={["teamId", "call", "followup", "total"]}
        rows={
          callFollowupSummary.length === 0 && !loading ? (
            <tr>
              <td colSpan={4} className="text-center py-4 text-gray-500">
                No data available
              </td>
            </tr>
          ) : (
            callFollowupSummary.map((row, idx) => {
              const isGrandTotal = row.teamId === "total";
              return (
                <tr
                  key={idx}
                  className={`border-b hover:bg-gray-50 ${isGrandTotal ? "bg-gray-100 font-bold" : "bg-white"}`}
                >
                  <td className="px-4 py-3 border-r text-center">{row.name}</td>
                  <td className="px-4 py-3 border-r text-center">{row.call}</td>
                  <td className="px-4 py-3 border-r text-center">
                    {row.followup}
                  </td>
                  <td className="px-4 py-3 text-center">{row.total}</td>
                </tr>
              );
            })
          )
        }
      />
    </div>
  );
}
