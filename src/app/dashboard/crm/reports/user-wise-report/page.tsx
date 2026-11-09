/* eslint-disable prettier/prettier */
"use client";

import React, { useState, useEffect } from "react";
import { crmFetch, API_ORIGIN } from "../../crm-fetch";

// --- Types for Dropdowns API ---
interface DropdownItem {
  uuid: string;
  name: string;
  id?: string;
}

interface DropdownsResponse {
  success: boolean;
  data: {
    users: DropdownItem[];
    leadSources: DropdownItem[];
    campaigns: DropdownItem[];
    teams: DropdownItem[];
  };
}

// --- Types for Report API ---
interface LeadSummaryRow {
  userId: string;
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
  userId: string;
  name: string;
  visited: number;
  schedule: number;
  canceled: number;
  newSchedule: number;
  rescheduled: number;
  total: number;
}

interface CallFollowupRow {
  userId: string;
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
      totalUsers: number;
      totalLeads: number;
      totalActivities: number;
    };
  };
}

// --- Helper to format headers ---
const formatHeader = (key: string) => {
  if (key === "userId") return "Agent";
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
  <div className="mb-12 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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
export default function UserWiseReportPage() {
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
  const [dateFrom, setDateFrom] = useState("2026-09-28");
  const [dateTo, setDateTo] = useState("2026-10-27");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");

  // 1. Fetch Dropdowns and Initial Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dropdownRes, reportRes] = await Promise.all([
          crmFetch(`${baseUrl}/realbizpro/api/v1/crm/reports/user-wise/dropdowns`),
          crmFetch(
            `${baseUrl}/realbizpro/api/v1/crm/reports/user-wise?dateFrom=${dateFrom}&dateTo=${dateTo}`,
          ),
        ]);

        const dropdownJson: DropdownsResponse = await dropdownRes.json();
        const reportJson: ReportResponse = await reportRes.json();

        if (dropdownJson.success) setDropdownData(dropdownJson.data);

        if (reportJson.success) {
          setReportData(reportJson.data);
        } else {
          setErrorMsg("Failed to load report data from server.");
        }
      } catch (err: any) {
        console.error("Fetch Error:", err);
        setErrorMsg(`Network Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [baseUrl]); // Date filters are kept default for initial fetch

  // 2. Client-Side Filtering Logic
  // ড্রপডাউনে কিছু সিলেক্ট করলে এই ফাংশন ডেটাকে ফিল্টার করবে
  const filterData = (dataArray: any[]) => {
    return dataArray.filter((row) => {
      // ইউজার ফিল্টার (গ্র্যান্ড টোটাল বাদে)
      if (selectedUser && row.userId !== "total" && row.userId !== selectedUser)
        return false;

      // যদি টিম, সোর্স বা ক্যাম্পেইন সিলেক্ট করা থাকে, কিন্তু API-তে সেই ডেটা নেই,
      // তবে আপাতত আমরা শুধু ইউজার ফিল্টারটি কাজ করাচ্ছি।
      // (যদি ব্যাকএন্ড থেকে টিম/সোর্স/ক্যাম্পেইনের ডেটা আসে, তবে সেগুলোও এখানে যোগ করা যাবে)

      return true;
    });
  };

  const filteredLeadSummary = reportData
    ? filterData(reportData.data.leadSummary)
    : [];
  const filteredVisitSummary = reportData
    ? filterData(reportData.data.visitSummary)
    : [];
  const filteredCallFollowupSummary = reportData
    ? filterData(reportData.data.callFollowupSummary)
    : [];

  // Reset Filters
  const resetFilters = () => {
    setSelectedUser("");
    setSelectedSource("");
    setSelectedCampaign("");
    setSelectedTeam("");
  };

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center text-red-500 font-medium">
        {errorMsg}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      {/* Header Breadcrumb */}
      <div className="mb-4 text-sm font-semibold text-gray-800">
        Home / Reports / User Wise Report
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Select Date From */}
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

          {/* Select Date To */}
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

          {/* User */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              User
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Users</option>
              {dropdownData?.users.map((user) => (
                <option key={user.uuid} value={user.uuid}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lead Source */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Lead Source
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Sources</option>
              {dropdownData?.leadSources.map((source) => (
                <option key={source.uuid} value={source.uuid}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>

          {/* Campaign */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Campaign
            </label>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Campaigns</option>
              {dropdownData?.campaigns.map((campaign) => (
                <option key={campaign.uuid} value={campaign.uuid}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>

          {/* Team */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Team
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Teams</option>
              {dropdownData?.teams.map((team) => (
                <option key={team.uuid} value={team.uuid}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={resetFilters}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1.5 rounded text-sm font-medium mr-auto"
          >
            Reset Filters
          </button>
          <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded text-sm font-medium">
            PDF
          </button>
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium">
            Excel
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center text-indigo-600 font-semibold animate-pulse mb-6">
          Loading report data...
        </div>
      )}

      {/* Table 1: Lead Summary */}
      {reportData && (
        <ReportTable
          title="Lead Summary"
          headers={[
            "userId",
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
            filteredLeadSummary.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-4 text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              filteredLeadSummary.map((row, idx) => {
                const isGrandTotal = row.userId === "total";
                return (
                  <tr
                    key={idx}
                    className={`border-b hover:bg-gray-50 ${isGrandTotal ? "bg-gray-100 font-bold" : "bg-white"}`}
                  >
                    <td className="px-4 py-3 border-r text-center">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 border-r text-center">
                      {row.lead}
                    </td>
                    <td className="px-4 py-3 border-r text-center">
                      {row.potential}
                    </td>
                    <td className="px-4 py-3 border-r text-center">
                      {row.prospect}
                    </td>
                    <td className="px-4 py-3 border-r text-center">
                      {row.highProspect}
                    </td>
                    <td className="px-4 py-3 border-r text-center">
                      {row.new}
                    </td>
                    <td className="px-4 py-3 border-r text-center">
                      {row.junk}
                    </td>
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
      )}

      {/* Table 2: Visit Summary */}
      {reportData && (
        <ReportTable
          title="Visit Summary"
          headers={[
            "userId",
            "visited",
            "schedule",
            "canceled",
            "newSchedule",
            "rescheduled",
            "total",
          ]}
          rows={
            filteredVisitSummary.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              filteredVisitSummary.map((row, idx) => {
                const isGrandTotal = row.userId === "total";
                return (
                  <tr
                    key={idx}
                    className={`border-b hover:bg-gray-50 ${isGrandTotal ? "bg-gray-100 font-bold" : "bg-white"}`}
                  >
                    <td className="px-4 py-3 border-r text-center">
                      {row.name}
                    </td>
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
      )}

      {/* Table 3: Call/Followup Summary */}
      {reportData && (
        <ReportTable
          title="Call/Followup Summary"
          headers={["userId", "call", "followup", "total"]}
          rows={
            filteredCallFollowupSummary.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              filteredCallFollowupSummary.map((row, idx) => {
                const isGrandTotal = row.userId === "total";
                return (
                  <tr
                    key={idx}
                    className={`border-b hover:bg-gray-50 ${isGrandTotal ? "bg-gray-100 font-bold" : "bg-white"}`}
                  >
                    <td className="px-4 py-3 border-r text-center">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 border-r text-center">
                      {row.call}
                    </td>
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
      )}
    </div>
  );
}
