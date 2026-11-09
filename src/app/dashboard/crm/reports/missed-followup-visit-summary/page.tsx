/* eslint-disable prettier/prettier */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { crmFetch, API_ORIGIN } from "../../crm-fetch";

// --- Types for Dropdowns API ---
interface TeamOption {
  id: string;
  uuid: string;
  name: string;
}

interface UserOption {
  uuid: string;
  name: string;
}

interface DropdownsResponse {
  success: boolean;
  data: {
    teams: TeamOption[];
    users: UserOption[];
  };
}

// --- Types for Report API ---
interface ReportRow {
  sl: number;
  teamId: string;
  team: string;
  employeeId: string;
  employee: string;
  missedFollowUps: number;
  missedVisits: number;
  newLeads: number;
}

interface ReportResponse {
  success: boolean;
  data: {
    data: ReportRow[];
    totals: {
      missedFollowUps: number;
      missedVisits: number;
      newLeads: number;
    };
    grandTotal: {
      employee: string;
      missedFollowUps: number;
      missedVisits: number;
      newLeads: number;
    };
    meta: {
      date: string;
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export default function MissedFollowupVisitSummaryPage() {
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
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedDate, setSelectedDate] = useState("2026-10-28");

  // 1. Fetch Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const [dropdownRes, reportRes] = await Promise.all([
          crmFetch(
            `${baseUrl}/realbizpro/api/v1/crm/reports/missed-followup-visit-summary/dropdowns`,
          ),
          crmFetch(
            `${baseUrl}/realbizpro/api/v1/crm/reports/missed-followup-visit-summary?date=${selectedDate}&page=1&limit=100`,
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
  }, [baseUrl]); // Note: For true date filtering, you'd trigger fetch on selectedDate change. Here we do client-side.

  // 2. Client-Side Filtering Logic
  const filteredRows = useMemo(() => {
    if (!reportData) return [];

    return reportData.data.filter((row) => {
      // A. Team Filter
      if (selectedTeam && row.teamId !== selectedTeam) return false;

      // B. User Filter
      if (selectedUser && row.employeeId !== selectedUser) return false;

      return true;
    });
  }, [reportData, selectedTeam, selectedUser]);

  // 3. Grouping Data by Team for the UI
  const groupedData = useMemo(() => {
    const groups: Record<
      string,
      { teamName: string; rows: ReportRow[]; totals: any }
    > = {};

    filteredRows.forEach((row) => {
      if (!groups[row.teamId]) {
        groups[row.teamId] = {
          teamName: row.team,
          rows: [],
          totals: { missedFollowUps: 0, missedVisits: 0, newLeads: 0 },
        };
      }
      groups[row.teamId].rows.push(row);
      groups[row.teamId].totals.missedFollowUps += row.missedFollowUps;
      groups[row.teamId].totals.missedVisits += row.missedVisits;
      groups[row.teamId].totals.newLeads += row.newLeads;
    });

    return Object.values(groups);
  }, [filteredRows]);

  // Calculate Dynamic Grand Totals for filtered rows
  const dynamicGrandTotal = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => ({
        missedFollowUps: acc.missedFollowUps + row.missedFollowUps,
        missedVisits: acc.missedVisits + row.missedVisits,
        newLeads: acc.newLeads + row.newLeads,
      }),
      { missedFollowUps: 0, missedVisits: 0, newLeads: 0 },
    );
  }, [filteredRows]);

  const resetFilters = () => {
    setSelectedTeam("");
    setSelectedUser("");
    setSelectedDate("2026-10-28");
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
        <span>Leads Management</span> <span>{">"}</span>
        <span className="text-gray-800">Missed FollowUp/Visit Summary</span>
      </div>

      {/* Filter Section */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              {dropdownData?.teams.map((team) => (
                <option key={team.uuid} value={team.uuid}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* User Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              User
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
            >
              <option value="">Select User</option>
              {dropdownData?.users.map((user) => (
                <option key={user.uuid} value={user.uuid}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Select Date */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors">
            Excel
          </button>
          <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors">
            PDF
          </button>
          <button
            onClick={resetFilters}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors ml-auto"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto relative min-h-[200px]">
          {loading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
              <span className="text-indigo-600 font-semibold animate-pulse">
                Loading data...
              </span>
            </div>
          )}

          <table className="w-full text-xs text-left whitespace-nowrap border-collapse">
            <thead className="text-[11px] text-white uppercase bg-indigo-500">
              <tr>
                <th className="px-4 py-3 font-semibold border-r border-indigo-400 w-1/5">
                  TEAM
                </th>
                <th className="px-4 py-3 font-semibold border-r border-indigo-400 w-1/3">
                  EMPLOYEES
                </th>
                <th className="px-4 py-3 font-semibold border-r border-indigo-400 text-center">
                  MISSED FOLLOW UPS
                </th>
                <th className="px-4 py-3 font-semibold border-r border-indigo-400 text-center">
                  MISSED VISITS
                </th>
                <th className="px-4 py-3 font-semibold text-right">
                  NEW LEADS
                </th>
              </tr>
            </thead>
            <tbody>
              {groupedData.length === 0 && !loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No data available in table
                  </td>
                </tr>
              ) : (
                groupedData.map((group, groupIdx) => (
                  <React.Fragment key={groupIdx}>
                    {/* Team Header Row */}
                    <tr className="bg-gray-100 border-b">
                      <td
                        colSpan={2}
                        className="px-4 py-2 text-center font-bold text-gray-700"
                      >
                        {group.teamName}
                      </td>
                      <td colSpan={3} className="bg-white border-b"></td>
                    </tr>

                    {/* Employee Rows */}
                    {group.rows.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className="bg-white border-b hover:bg-gray-50"
                      >
                        <td className="px-4 py-2 border-r"></td>{" "}
                        {/* Empty cell for Team column */}
                        <td className="px-4 py-2 border-r text-gray-800">
                          {row.employee}
                        </td>
                        <td className="px-4 py-2 border-r text-center text-gray-800">
                          {row.missedFollowUps}
                        </td>
                        <td className="px-4 py-2 border-r text-center text-gray-800">
                          {row.missedVisits}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-800">
                          {row.newLeads}
                        </td>
                      </tr>
                    ))}

                    {/* Team Total Row */}
                    <tr className="bg-gray-50 border-b font-semibold">
                      <td className="px-4 py-2 border-r"></td>
                      <td className="px-4 py-2 border-r text-right text-gray-700">
                        Total
                      </td>
                      <td className="px-4 py-2 border-r text-center text-gray-800">
                        {group.totals.missedFollowUps}
                      </td>
                      <td className="px-4 py-2 border-r text-center text-gray-800">
                        {group.totals.missedVisits}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-800">
                        {group.totals.newLeads}
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              )}

              {/* Grand Total Row */}
              {groupedData.length > 0 && (
                <tr className="bg-white border-b font-bold text-gray-900">
                  <td className="px-4 py-3 border-r"></td>
                  <td className="px-4 py-3 border-r text-right uppercase">
                    Grand Total
                  </td>
                  <td className="px-4 py-3 border-r text-center">
                    {dynamicGrandTotal.missedFollowUps}
                  </td>
                  <td className="px-4 py-3 border-r text-center">
                    {dynamicGrandTotal.missedVisits}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {dynamicGrandTotal.newLeads}
                  </td>
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
            <button className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-700">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
