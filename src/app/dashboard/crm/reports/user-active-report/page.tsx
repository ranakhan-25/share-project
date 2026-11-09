/* eslint-disable prettier/prettier */
"use client";

import React, { useState, useEffect } from "react";
import { crmFetch, API_ORIGIN } from "../../crm-fetch";

// --- Types ---
interface DropdownItem {
  uuid: string;
  name: string;
  id?: string;
  color?: string;
}

interface DropdownsResponse {
  success: boolean;
  data: {
    users: DropdownItem[];
    leadStages: DropdownItem[];
    visitStatuses: DropdownItem[];
    communicationStatuses: DropdownItem[];
  };
}

interface ActivityRow {
  sl: number;
  activityDate: string;
  user: string;
  userId: string;
  customerName: string;
  leadId: string;
  activityType: string;
  callLog: string | null;
  leadStage: string | null;
  communicationStatus: string | null;
  comment: string | null;
  salesPossibility: string | null;
  visitPlace: string | null;
  visitStatus: string | null;
  visitNote: string | null;
  nextFollowUpNote: string | null;
  nextFollowupVisit: string | null;
}

interface ReportResponse {
  success: boolean;
  data: {
    data: {
      summaryCards: {
        totalLeads: number;
        activeLeads: number;
        junk: number;
        dealsClosed: number;
        bookingAmount: number;
      };
      leadStageSummary: Record<string, number>;
      visitStatusSummary: Record<string, number>;
      visitSummary: {
        totalVisit: number;
        visitsPending: number;
        visitsCompleted: number;
        visitsCancelled: number;
      };
      followUpSummary: {
        totalFollowUps: number;
        completedFollowUps: number;
        pendingFollowUps: number;
      };
      activityRows: ActivityRow[];
    };
    meta: {
      page: number;
      limit: number;
      totalRows: number;
      totalPages: number;
      dateFrom: string;
      dateTo: string;
    };
  };
}

// --- Helpers ---
const formatDate = (dateString: string | null) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const SummaryBox = ({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string | number;
  className?: string;
}) => (
  <div
    className={`border border-gray-300 rounded-md p-2 flex flex-col justify-center ${className}`}
  >
    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
      {label}
    </span>
    <span className="text-lg font-bold text-gray-800">{value}</span>
  </div>
);

const DataTable = ({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode;
}) => (
  <div className="overflow-x-auto border-t border-gray-200">
    <table className="w-full text-xs text-left whitespace-nowrap">
      <thead className="text-[11px] text-white uppercase bg-indigo-500">
        <tr>
          {headers.map((header, idx) => (
            <th
              key={idx}
              className="px-3 py-2 font-medium border-r border-indigo-400 last:border-r-0"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  </div>
);

// --- Main Page Component ---
export default function UserActivityReportPage() {
  const baseUrl = API_ORIGIN;

  // --- States ---
  const [dropdownData, setDropdownData] = useState<
    DropdownsResponse["data"] | null
  >(null);
  const [rawReportData, setRawReportData] = useState<
    ReportResponse["data"] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter States (These will now filter the data locally)
  const [dateFrom, setDateFrom] = useState("2026-09-28");
  const [dateTo, setDateTo] = useState("2026-10-27");
  const [userId, setUserId] = useState("");
  const [leadStageId, setLeadStageId] = useState("");
  const [visitStatusId, setVisitStatusId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Fetch Dropdowns & Initial Report Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const [dropdownRes, reportRes] = await Promise.all([
          crmFetch(
            `${baseUrl}/realbizpro/api/v1/crm/reports/user-activity/dropdowns`,
          ),
          crmFetch(
            `${baseUrl}/realbizpro/api/v1/crm/reports/user-activity?dateFrom=${dateFrom}&dateTo=${dateTo}&page=1&limit=100`,
          ), // limit বড়িয়ে দেওয়া হলো যাতে সব ডেটা আসে
        ]);

        const dropdownJson: DropdownsResponse = await dropdownRes.json();
        const reportJson: ReportResponse = await reportRes.json();

        if (dropdownJson.success) setDropdownData(dropdownJson.data);

        if (reportJson.success) {
          setRawReportData(reportJson.data);
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
  }, [baseUrl]); // ডেট ফিল্টার এখানে API-তে পাঠানো হচ্ছে না, শুধু ইনিশিয়াল লোডে ডিফল্ট ডেট পাঠানো হচ্ছে।

  // 2. CLIENT-SIDE FILTERING LOGIC
  // এখানে আমরা API থেকে আসা ডেটাকে ফিল্টার করছি
  const filteredActivityRows =
    rawReportData?.data.activityRows.filter((row) => {
      // A. User Filter
      if (userId && row.userId !== userId) return false;

      // B. Lead Stage Filter
      if (leadStageId && row.leadStage !== leadStageId) return false;

      // C. Visit Status Filter
      if (visitStatusId && row.visitStatus !== visitStatusId) return false;

      // D. Search Term Filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          row.user?.toLowerCase().includes(searchLower) ||
          row.customerName?.toLowerCase().includes(searchLower) ||
          row.activityType?.toLowerCase().includes(searchLower) ||
          row.leadStage?.toLowerCase().includes(searchLower) ||
          row.visitStatus?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      return true;
    }) || [];

  // 3. Reset Filters
  const resetFilters = () => {
    setUserId("");
    setLeadStageId("");
    setVisitStatusId("");
    setSearchTerm("");
    setDateFrom("2026-09-28");
    setDateTo("2026-10-27");
  };

  if (errorMsg && !rawReportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-lg shadow-sm text-center max-w-lg">
          <h2 className="text-lg font-bold mb-2">
            Oops! Something went wrong.
          </h2>
          <p className="text-sm mb-4">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  const { data, meta } = rawReportData || {};
  const {
    summaryCards,
    leadStageSummary,
    visitStatusSummary,
    visitSummary,
    followUpSummary,
  } = data || {
    summaryCards: {
      totalLeads: 0,
      activeLeads: 0,
      junk: 0,
      dealsClosed: 0,
      bookingAmount: 0,
    },
    leadStageSummary: {},
    visitStatusSummary: {},
    visitSummary: {
      totalVisit: 0,
      visitsPending: 0,
      visitsCompleted: 0,
      visitsCancelled: 0,
    },
    followUpSummary: {
      totalFollowUps: 0,
      completedFollowUps: 0,
      pendingFollowUps: 0,
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-sm">
      <div className="mb-4 text-xs font-semibold text-gray-600">
        Home / Reports / User Activity Report
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              User
            </label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="">All Users</option>
              {dropdownData?.users.map((u) => (
                <option key={u.uuid} value={u.uuid}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              Lead Stage
            </label>
            <select
              value={leadStageId}
              onChange={(e) => setLeadStageId(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="">All Stages</option>
              {dropdownData?.leadStages.map((s) => (
                <option key={s.uuid} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              Visit Status
            </label>
            <select
              value={visitStatusId}
              onChange={(e) => setVisitStatusId(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="">All Statuses</option>
              {dropdownData?.visitStatuses.map((s) => (
                <option key={s.uuid} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={resetFilters}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs font-medium mr-auto"
          >
            Reset Filters
          </button>
          <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium">
            PDF
          </button>
          <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium">
            Excel
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center text-indigo-600 font-semibold animate-pulse mb-4">
          Loading report data...
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <SummaryBox
          label="Total Leads"
          value={summaryCards.totalLeads}
          className="border-indigo-300"
        />
        <SummaryBox
          label="Active Leads"
          value={summaryCards.activeLeads}
          className="border-indigo-300"
        />
        <SummaryBox
          label="Junk"
          value={summaryCards.junk}
          className="border-indigo-300"
        />
        <SummaryBox
          label="Deals Closed"
          value={summaryCards.dealsClosed}
          className="border-indigo-300"
        />
        <SummaryBox
          label="Booking Amount"
          value={`BDT ${summaryCards.bookingAmount}`}
          className="border-indigo-300"
        />
      </div>

      {/* Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="text-xs font-bold text-gray-700 mb-2 uppercase">
            Lead Stage Summary
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(leadStageSummary).map(([key, value]) => (
              <div
                key={key}
                className="border border-indigo-200 bg-indigo-50/30 rounded px-3 py-1 min-w-[80px]"
              >
                <span className="block text-[10px] text-gray-500 uppercase font-semibold">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </span>
                <span className="text-sm font-bold text-gray-800">{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-700 mb-2 uppercase">
            Visit Status Summary
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(visitStatusSummary).map(([key, value]) => (
              <div
                key={key}
                className="border border-indigo-200 bg-indigo-50/30 rounded px-3 py-1 min-w-[80px]"
              >
                <span className="block text-[10px] text-gray-500 uppercase font-semibold">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </span>
                <span className="text-sm font-bold text-gray-800">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-3 flex flex-col md:flex-row justify-between items-center gap-3">
          <h2 className="text-sm font-bold text-gray-800">
            User Activity Report
          </h2>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <span>Show</span>
              <select className="border rounded px-1 py-0.5 bg-gray-50">
                <option>{meta?.limit || 25}</option>
              </select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search table..."
                className="border rounded px-2 py-0.5 bg-gray-50 w-40 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <DataTable
          headers={[
            "Sl",
            "Activity Date",
            "User",
            "Customer Name",
            "Lead ID",
            "Activity Type",
            "Call Log",
            "Lead Stage",
            "Communication Status",
            "Comment",
            "Sales Possibility",
            "Visit Place",
            "Visit Status",
            "Visit Note",
            "Next Follow-up Note",
            "Next Follow-up Visit",
          ]}
          rows={
            filteredActivityRows.length === 0 && !loading ? (
              <tr>
                <td colSpan={16} className="text-center py-6 text-gray-500">
                  No data matching your filters.
                </td>
              </tr>
            ) : (
              filteredActivityRows.map((row) => (
                <tr key={row.sl} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-3 py-2 border-r text-center">{row.sl}</td>
                  <td className="px-3 py-2 border-r">
                    {formatDate(row.activityDate)}
                  </td>
                  <td className="px-3 py-2 border-r">{row.user}</td>
                  <td className="px-3 py-2 border-r">{row.customerName}</td>
                  <td className="px-3 py-2 border-r">{row.leadId}</td>
                  <td className="px-3 py-2 border-r capitalize">
                    {row.activityType}
                  </td>
                  <td className="px-3 py-2 border-r">{row.callLog || "-"}</td>
                  <td className="px-3 py-2 border-r">{row.leadStage || "-"}</td>
                  <td className="px-3 py-2 border-r">
                    {row.communicationStatus || "-"}
                  </td>
                  <td className="px-3 py-2 border-r">{row.comment || "-"}</td>
                  <td className="px-3 py-2 border-r">
                    {row.salesPossibility || "-"}
                  </td>
                  <td className="px-3 py-2 border-r">
                    {row.visitPlace || "-"}
                  </td>
                  <td className="px-3 py-2 border-r">
                    {row.visitStatus || "-"}
                  </td>
                  <td className="px-3 py-2 border-r">{row.visitNote || "-"}</td>
                  <td className="px-3 py-2 border-r">
                    {row.nextFollowUpNote || "-"}
                  </td>
                  <td className="px-3 py-2">
                    {formatDate(row.nextFollowupVisit) || "-"}
                  </td>
                </tr>
              ))
            )
          }
        />
      </div>
    </div>
  );
}
