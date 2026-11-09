/* eslint-disable prettier/prettier */
"use client";

import React, { useState, useEffect } from "react";
import { crmFetch, API_ORIGIN } from "../../crm-fetch";

// --- Types ---
interface DropdownItem {
  uuid: string;
  name: string;
  id?: string;
}

interface DropdownsResponse {
  success: boolean;
  data: {
    users: DropdownItem[];
    teams: DropdownItem[];
    projects: DropdownItem[];
  };
}

interface PipelineRow {
  sl: number;
  stageId: string;
  stage: string;
  leads: number;
  dropOff: number;
  conversion: string;
  totalConversion: string;
}

interface FunnelStage {
  stage: string;
  leads: number;
}

interface ReportResponse {
  success: boolean;
  data: {
    cards: {
      totalLeads: number;
      activeLeads: number;
      junkLeads: number;
      dealClosed: number;
      overallConversion: string;
    };
    funnel: FunnelStage[];
    pipelineDetails: PipelineRow[];
    meta: {
      dateFrom: string;
      dateTo: string;
      total: number;
    };
  };
}

export default function SalesPipelineFunnelPage() {
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
  const [dateFrom, setDateFrom] = useState("2026-10-01");
  const [dateTo, setDateTo] = useState("2026-10-28");
  const [userId, setUserId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [projectId, setProjectId] = useState("");

  // 1. Fetch Dropdowns (Only on mount)
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const res = await crmFetch(
          `${baseUrl}/realbizpro/api/v1/crm/reports/sales-pipeline-funnel/dropdowns`,
        );
        const json: DropdownsResponse = await res.json();
        if (json.success) setDropdownData(json.data);
      } catch (err) {
        console.error("Error fetching dropdowns", err);
      }
    };
    fetchDropdowns();
  }, [baseUrl]);

  // 2. Fetch Report Data (Triggered whenever a filter changes)
  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        // Build dynamic query parameters
        const params = new URLSearchParams();
        if (dateFrom) params.append("dateFrom", dateFrom);
        if (dateTo) params.append("dateTo", dateTo);
        if (userId) params.append("userId", userId);
        if (teamId) params.append("teamId", teamId);
        if (projectId) params.append("projectId", projectId);

        const res = await crmFetch(
          `${baseUrl}/realbizpro/api/v1/crm/reports/sales-pipeline-funnel?${params.toString()}`,
        );
        const json: ReportResponse = await res.json();

        if (json.success) {
          setReportData(json.data);
        } else {
          setErrorMsg("Failed to load report data.");
        }
      } catch (err: any) {
        setErrorMsg(`Network Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    // Debounce to prevent rapid API calls when typing
    const timeoutId = setTimeout(() => {
      fetchReport();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [baseUrl, dateFrom, dateTo, userId, teamId, projectId]);

  if (errorMsg && !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {errorMsg}
      </div>
    );
  }

  const { cards, funnel, pipelineDetails } = reportData || {
    cards: {
      totalLeads: 0,
      activeLeads: 0,
      junkLeads: 0,
      dealClosed: 0,
      overallConversion: "0%",
    },
    funnel: [],
    pipelineDetails: [],
  };

  // Custom Colors for the Funnel based on stage index
  const funnelColors = [
    "bg-[#0dcaf0]",
    "bg-[#198754]",
    "bg-[#0d6efd]",
    "bg-[#6f42c1]",
    "bg-[#fd7e14]",
    "bg-[#dc3545]",
    "bg-[#212529]",
    "bg-[#198754]",
  ];
  const getFunnelColor = (index: number) =>
    funnelColors[index % funnelColors.length];

  return (
    <div className="min-h-screen bg-[#f4f6f9] p-6 font-sans text-sm">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800 mb-4">
          Sales Pipeline Funnel Report
        </h1>

        {/* Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Filter (Using standard inputs for actual filtering) */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs bg-white shadow-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs bg-white shadow-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              User
            </label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs bg-white shadow-sm focus:outline-none focus:border-indigo-500"
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
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              Select Team
            </label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs bg-white shadow-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Teams</option>
              {dropdownData?.teams.map((t) => (
                <option key={t.uuid} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs bg-white shadow-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Projects</option>
              {dropdownData?.projects.map((p) => (
                <option key={p.uuid} value={p.uuid}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="mb-4 text-center text-indigo-600 font-semibold animate-pulse">
          Loading updated report data...
        </div>
      )}

      {/* 1. KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Total Leads", value: cards.totalLeads },
          { label: "Active Leads", value: cards.activeLeads },
          { label: "Junk Leads", value: cards.junkLeads },
          { label: "Deal Closed", value: cards.dealClosed },
          { label: "Overall Conversion", value: cards.overallConversion },
        ].map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col items-center justify-center h-24"
          >
            <span className="text-[11px] text-gray-500 mb-1">{card.label}</span>
            <span className="text-2xl font-bold text-gray-800">
              {card.value}
            </span>
          </div>
        ))}
      </div>

      {/* 2. Main Content Area (Funnel & Table) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Side: Funnel Chart */}
        <div className="xl:col-span-4 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-4 text-center">
            Sales Pipeline Funnel
          </h2>

          <div className="flex flex-col items-center justify-center mt-6">
            {funnel.length === 0 && !loading && (
              <p className="text-gray-400 text-xs">
                No funnel data available for this selection.
              </p>
            )}
            {funnel.map((item, index) => {
              const maxLeads = Math.max(...funnel.map((f) => f.leads), 1);
              // Calculate width, ensuring it doesn't get too thin or too wide
              const widthPercent =
                item.leads === 0
                  ? 30
                  : Math.max(40, (item.leads / maxLeads) * 100);

              return (
                <div
                  key={index}
                  className="w-full flex flex-col items-center mb-1"
                >
                  <div
                    className={`${getFunnelColor(index)} text-white flex flex-col items-center justify-center text-center transition-all duration-500 rounded-sm shadow-sm`}
                    style={{
                      width: `${widthPercent}%`,
                      clipPath: "polygon(0 0, 100% 0, 85% 100%, 15% 100%)",
                      minHeight: "45px",
                      padding: "4px 0",
                    }}
                  >
                    <span className="text-[10px] font-medium leading-tight opacity-90">
                      Leads
                    </span>
                    <span className="text-sm font-bold leading-none">
                      {item.leads}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-gray-700 mt-1 mb-2 bg-white/90 px-2 rounded-full shadow-sm z-10 border border-gray-100">
                    {item.stage}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Pipeline Details Table */}
        <div className="xl:col-span-8 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 flex justify-between items-center border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-800">
              Pipeline Details
            </h2>
            <span className="text-[11px] text-gray-400">
              Stage Conversion = Current ÷ Previous
            </span>
          </div>

          <div className="overflow-x-auto relative min-h-[200px]">
            <table className="w-full text-xs text-left whitespace-nowrap">
              <thead className="bg-[#fd7e14] text-white uppercase text-[11px]">
                <tr>
                  <th className="px-4 py-3 font-semibold border-r border-orange-400">
                    SL
                  </th>
                  <th className="px-4 py-3 font-semibold border-r border-orange-400">
                    Pipeline Stage
                  </th>
                  <th className="px-4 py-3 font-semibold border-r border-orange-400 text-right">
                    Leads
                  </th>
                  <th className="px-4 py-3 font-semibold border-r border-orange-400 text-right">
                    Drop-Off
                  </th>
                  <th className="px-4 py-3 font-semibold border-r border-orange-400 text-center">
                    Conversion
                  </th>
                  <th className="px-4 py-3 font-semibold text-center">
                    Total Conversion
                  </th>
                </tr>
              </thead>
              <tbody>
                {pipelineDetails.map((row) => (
                  <tr
                    key={row.sl}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 border-r text-gray-600">
                      {row.sl}
                    </td>
                    <td className="px-4 py-3 border-r text-gray-800 font-medium">
                      {row.sl > 1 && (
                        <span className="text-gray-400 mr-2">↳</span>
                      )}
                      {row.stage}
                    </td>
                    <td className="px-4 py-3 border-r text-right text-gray-800">
                      {row.leads}
                    </td>
                    <td className="px-4 py-3 border-r text-right">
                      {row.dropOff > 0 ? (
                        <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                          {row.dropOff}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 border-r text-center">
                      <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                        {row.conversion}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">
                        {row.totalConversion}
                      </span>
                    </td>
                  </tr>
                ))}

                {pipelineDetails.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No pipeline details available for this selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
