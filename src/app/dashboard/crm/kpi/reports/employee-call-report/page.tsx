/* eslint-disable prettier/prettier */
"use client";

import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { API_BASE, crmFetch } from "../../../crm-fetch";

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================
interface User {
  uuid: string;
  name: string;
}

interface ReportData {
  id?: string;
  name: string;
  fromDate: string;
  toDate: string;
  leftDays: number;
  targetCall: number;
  achieveCall: number;
  percentageCall: number;
  targetTask: number;
  achieveTask: number;
  percentageTask: number;
}

// ==========================================
// 2. ENV SETUP
// ==========================================
const API_REPORT_URL = `${API_BASE}/crm/reports/employee-kpi-call-report`;
const API_DROPDOWN_URL = `${API_REPORT_URL}/dropdowns`;

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function EmployeeKpiCallReportPage() {
  // Filters
  const [dateFrom, setDateFrom] = useState("2026-07-01");
  const [dateTo, setDateTo] = useState("2026-07-31");
  const [selectedUser, setSelectedUser] = useState("");

  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [reportData, setReportData] = useState<ReportData[]>([]);

  // UI States
  const [isFetching, setIsFetching] = useState(false);
  const [isDropdownLoading, setIsDropdownLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  // ==========================================
  // 4. SAFE FETCH HELPER
  // ==========================================
  const safeFetch = async (url: string, options?: RequestInit) => {
    try {
      const res = await crmFetch(url, options);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          "API returned non-JSON response. Check CORS and Backend URL.",
        );
      }
      if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
      return res.json();
    } catch (error: any) {
      console.error("Fetch Error:", error.message);
      throw error;
    }
  };

  // ==========================================
  // 5. API CALLS
  // ==========================================

  // Fetch Dropdown Users
  useEffect(() => {
    const fetchDropdowns = async () => {
      setIsDropdownLoading(true);
      try {
        const json = await safeFetch(API_DROPDOWN_URL);
        if (json.success) {
          setUsers(json.data.users || []);
        }
      } catch (error) {
        console.error("Dropdown Error:", error);
      } finally {
        setIsDropdownLoading(false);
      }
    };
    fetchDropdowns();
  }, []);

  // Fetch Report Data
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsFetching(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (selectedUser) params.append("userId", selectedUser);

      const url = `${API_REPORT_URL}?${params.toString()}`;
      const json = await safeFetch(url);

      if (json.success) {
        setReportData(json.data.data || []);
      }
    } catch (error) {
      console.error("Report Fetch Error:", error);
      alert("Failed to load report data.");
    } finally {
      setIsFetching(false);
    }
  };

  // Initial Load (optional, if you want data on mount)
  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        Home &gt; Employee &gt;{" "}
        <span className="text-gray-800 font-medium">
          Employee KPI Call Report
        </span>
      </div>

      <h1 className="text-xl font-semibold text-gray-800 mb-6">
        Employee KPI Call Report
      </h1>

      {/* Filters */}
      <form
        onSubmit={handleSearch}
        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full border rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full border rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-gray-600"
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Staff/Employee
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full border rounded-md p-2 text-sm outline-none focus:border-indigo-500 text-gray-600"
            disabled={isDropdownLoading}
          >
            <option value="">
              {isDropdownLoading ? "Loading..." : "Select Staff/Employee"}
            </option>
            {users.map((user) => (
              <option key={user.uuid} value={user.uuid}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <button
            type="submit"
            disabled={isFetching}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Search size={16} /> {isFetching ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show</span>
            <select className="border rounded p-1 outline-none">
              <option>10</option>
              <option>25</option>
            </select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Search:</span>
            <input
              type="text"
              className="border rounded p-1 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-indigo-500 text-white">
              <tr>
                <th className="px-4 py-2 font-medium">SL</th>
                <th className="px-4 py-2 font-medium">NAME</th>
                <th className="px-4 py-2 font-medium">FROM</th>
                <th className="px-4 py-2 font-medium">TO</th>
                <th className="px-4 py-2 font-medium">LEFT DAYS</th>
                <th className="px-4 py-2 font-medium">TARGET CALL</th>
                <th className="px-4 py-2 font-medium">ACHIEVE CALL</th>
                <th className="px-4 py-2 font-medium">PERCENTAGE</th>
                <th className="px-4 py-2 font-medium">TARGET TASK</th>
                <th className="px-4 py-2 font-medium">ACHIEVE TASK</th>
                <th className="px-4 py-2 font-medium">PERCENTAGE</th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-500">
                    Loading data...
                  </td>
                </tr>
              ) : reportData.length > 0 ? (
                reportData.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3">{item.fromDate}</td>
                    <td className="px-4 py-3">{item.toDate}</td>
                    <td className="px-4 py-3">{item.leftDays}</td>
                    <td className="px-4 py-3">{item.targetCall}</td>
                    <td className="px-4 py-3">{item.achieveCall}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium text-white ${item.percentageCall > 50 ? "bg-green-500" : "bg-red-500"}`}
                      >
                        {item.percentageCall}%
                      </span>
                    </td>
                    <td className="px-4 py-3">{item.targetTask}</td>
                    <td className="px-4 py-3">{item.achieveTask}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium text-white ${item.percentageTask > 50 ? "bg-green-500" : "bg-red-500"}`}
                      >
                        {item.percentageTask}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : hasSearched ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-500">
                    No data available
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-500">
                    Please select filters and click Search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (Static) */}
        <div className="p-4 flex justify-between items-center border-t border-gray-200 text-sm text-gray-600">
          <div>
            Showing 1 to {reportData.length} of {reportData.length} entries
          </div>
          <div className="flex gap-1">
            <button
              className="px-3 py-1 border rounded hover:bg-gray-50 text-gray-400"
              disabled
            >
              Previous
            </button>
            <button className="px-3 py-1 border rounded bg-indigo-500 text-white">
              1
            </button>
            <button
              className="px-3 py-1 border rounded hover:bg-gray-50 text-gray-400"
              disabled
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
