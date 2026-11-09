/* eslint-disable prettier/prettier */
"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { API_BASE, crmFetch } from "../../crm-fetch";

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================
interface DropdownData {
  types: string[];
  statuses: string[];
  workTypes: string[];
  users: { uuid: string; name: string }[];
  teams: { id: string; uuid: string; name: string }[];
}

interface KpiRecord {
  id: string;
  uuid: string;
  type: "INDIVIDUAL" | "TEAM";
  name: string;
  userId: string | null;
  teamId: string | null;
  workType1: string;
  target1: number;
  workType2: string;
  target2: number;
  workType3: string;
  target3: number;
  fromDate: string;
  toDate: string;
  status: "ACTIVE" | "INACTIVE";
  leftDays: number;
}

interface KpiFormData {
  type: string;
  name: string;
  userId: string;
  teamId: string;
  workType1: string;
  target1: number;
  workType2: string;
  target2: number;
  workType3: string;
  target3: number;
  fromDate: string;
  toDate: string;
  status: string;
}

// ==========================================
// 2. ENV & ENDPOINT SETUP
// ==========================================
const API_BASE_URL = `${API_BASE}/crm/kpi/employee-kpi`;

// ==========================================
// 3. MAIN PAGE COMPONENT
// ==========================================
export default function EmployeeKpiPage() {
  const [kpiData, setKpiData] = useState<KpiRecord[]>([]);
  const [dropdowns, setDropdowns] = useState<DropdownData>({
    types: [],
    statuses: [],
    workTypes: [],
    users: [],
    teams: [],
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [editingKpi, setEditingKpi] = useState<KpiRecord | null>(null);

  const [formData, setFormData] = useState<KpiFormData>({
    type: "TEAM",
    name: "",
    userId: "",
    teamId: "",
    workType1: "Call Task",
    target1: 0,
    workType2: "Visit Task",
    target2: 0,
    workType3: "Sales Task",
    target3: 0,
    fromDate: "",
    toDate: "",
    status: "ACTIVE",
  });

  // ==========================================
  // 4. SAFE FETCH (Handles HTML Error Responses)
  // ==========================================
  const safeFetch = async (url: string, options?: RequestInit) => {
    try {
      const res = await crmFetch(url, options);

      const contentType = res.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("❌ API returned non-JSON response.");
        console.error("URL:", url);
        console.error("Response:", text.substring(0, 200));
        throw new Error(
          "API returned HTML instead of JSON. Check if backend is running on port 3001 and CORS is enabled.",
        );
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message || `API Error: ${res.status} ${res.statusText}`,
        );
      }

      return res.json();
    } catch (error: any) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        console.error(
          "❌ Network/CORS Error: Backend might be down or CORS is blocking the request.",
        );
        throw new Error(
          "Cannot connect to server. Please ensure backend is running on http://localhost:3001 and CORS is enabled.",
        );
      }
      throw error;
    }
  };

  // ==========================================
  // 5. API CALLS
  // ==========================================

  const fetchDropdowns = async () => {
    try {
      const json = await safeFetch(`${API_BASE_URL}/dropdowns`);
      if (json.success) setDropdowns(json.data);
    } catch (error: any) {
      console.error("Dropdown Error:", error.message);
    }
  };

  const fetchKpiList = async () => {
    setIsFetching(true);
    try {
      const json = await safeFetch(
        `${API_BASE_URL}?page=1&limit=10&withDeleted=false`,
      );
      if (json.success) setKpiData(json.data.data);
    } catch (error: any) {
      console.error("List Error:", error.message);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
    fetchKpiList();
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const isEditing = editingKpi !== null;
    const url = isEditing ? `${API_BASE_URL}/${editingKpi.uuid}` : API_BASE_URL;
    const method = isEditing ? "PATCH" : "POST";

    const payload = {
      type: formData.type,
      name:
        formData.type === "TEAM"
          ? dropdowns.teams.find((t) => t.id === formData.teamId)?.name ||
            "Unknown Team"
          : dropdowns.users.find((u) => u.uuid === formData.userId)?.name ||
            "Unknown User",
      userId: formData.type === "INDIVIDUAL" ? formData.userId : null,
      teamId: formData.type === "TEAM" ? Number(formData.teamId) : 0,
      workType1: formData.workType1,
      target1: Number(formData.target1),
      workType2: formData.workType2,
      target2: Number(formData.target2),
      workType3: formData.workType3,
      target3: Number(formData.target3),
      fromDate: formData.fromDate,
      toDate: formData.toDate,
      status: formData.status,
      ...(isEditing ? {} : { createdBy: "string" }),
    };

    try {
      await safeFetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await fetchKpiList();
      closeModal();
    } catch (error: any) {
      console.error("Submit Error:", error.message);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm("Are you sure you want to delete this KPI?")) return;
    try {
      await safeFetch(`${API_BASE_URL}/${uuid}`, { method: "DELETE" });
      await fetchKpiList();
    } catch (error: any) {
      console.error("Delete Error:", error.message);
      alert(error.message);
    }
  };

  // ==========================================
  // 6. UI HANDLERS
  // ==========================================
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (item: KpiRecord) => {
    setEditingKpi(item);
    setFormData({
      type: item.type,
      name: item.name,
      userId: item.userId || "",
      teamId: item.teamId || "",
      workType1: item.workType1,
      target1: item.target1,
      workType2: item.workType2,
      target2: item.target2,
      workType3: item.workType3,
      target3: item.target3,
      fromDate: item.fromDate,
      toDate: item.toDate,
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingKpi(null);
    setFormData({
      type: "TEAM",
      name: "",
      userId: "",
      teamId: "",
      workType1: "Call Task",
      target1: 0,
      workType2: "Visit Task",
      target2: 0,
      workType3: "Sales Task",
      target3: 0,
      fromDate: "",
      toDate: "",
      status: "ACTIVE",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingKpi(null);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        Home &gt; Employee &gt;{" "}
        <span className="text-gray-800 font-medium">Employee KPI</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-800">
          Employee KPI Reports
        </h1>
        <button
          onClick={handleAddNewClick}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={16} /> New KPI
        </button>
      </div>

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
                <th className="px-4 py-2 font-medium">TYPE</th>
                <th className="px-4 py-2 font-medium">NAME</th>
                <th className="px-4 py-2 font-medium">WORK TYPE</th>
                <th className="px-4 py-2 font-medium">TARGET</th>
                <th className="px-4 py-2 font-medium">WORK TYPE</th>
                <th className="px-4 py-2 font-medium">TARGET</th>
                <th className="px-4 py-2 font-medium">WORK TYPE</th>
                <th className="px-4 py-2 font-medium">TARGET</th>
                <th className="px-4 py-2 font-medium">FROM DATE</th>
                <th className="px-4 py-2 font-medium">TO DATE</th>
                <th className="px-4 py-2 font-medium">LEFT DAYS</th>
                <th className="px-4 py-2 font-medium">STATUS</th>
                <th className="px-4 py-2 font-medium text-center">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                <tr>
                  <td colSpan={14} className="text-center py-8 text-gray-500">
                    Loading data...
                  </td>
                </tr>
              ) : kpiData.length > 0 ? (
                kpiData.map((item, index) => (
                  <tr key={item.uuid} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium text-white ${item.type === "INDIVIDUAL" ? "bg-indigo-500" : "bg-orange-400"}`}
                      >
                        {item.type.charAt(0) + item.type.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3">{item.workType1}</td>
                    <td className="px-4 py-3">{item.target1}</td>
                    <td className="px-4 py-3">{item.workType2}</td>
                    <td className="px-4 py-3">{item.target2}</td>
                    <td className="px-4 py-3">{item.workType3}</td>
                    <td className="px-4 py-3">{item.target3}</td>
                    <td className="px-4 py-3">{item.fromDate}</td>
                    <td className="px-4 py-3">{item.toDate}</td>
                    <td className="px-4 py-3">{item.leftDays}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium text-white ${item.status === "ACTIVE" ? "bg-green-500" : "bg-red-500"}`}
                      >
                        {item.status.charAt(0) +
                          item.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex justify-center gap-2">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="bg-teal-400 hover:bg-teal-500 text-white p-1.5 rounded"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.uuid)}
                        className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={14} className="text-center py-8 text-gray-500">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 flex justify-between items-center border-t border-gray-200 text-sm text-gray-600">
          <div>
            Showing 1 to {kpiData.length} of {kpiData.length} entries
          </div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border rounded hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-1 border rounded bg-indigo-500 text-white">
              1
            </button>
            <button className="px-3 py-1 border rounded hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingKpi
                  ? "Update Employee KPI"
                  : "Employee KPI Settings Add"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Type
                  </label>
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value="TEAM"
                        checked={formData.type === "TEAM"}
                        onChange={handleInputChange}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm">Team</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value="INDIVIDUAL"
                        checked={formData.type === "INDIVIDUAL"}
                        onChange={handleInputChange}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm">Individuals</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.type === "TEAM" ? "Select Team" : "Select User"}
                  </label>
                  {formData.type === "TEAM" ? (
                    <select
                      name="teamId"
                      value={formData.teamId}
                      onChange={handleInputChange}
                      className="w-full border rounded-md p-2 text-sm outline-none focus:border-indigo-500"
                      required
                    >
                      <option value="">Select value</option>
                      {dropdowns.teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      name="userId"
                      value={formData.userId}
                      onChange={handleInputChange}
                      className="w-full border rounded-md p-2 text-sm outline-none focus:border-indigo-500"
                      required
                    >
                      <option value="">Select value</option>
                      {dropdowns.users.map((u) => (
                        <option key={u.uuid} value={u.uuid}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    name="fromDate"
                    value={formData.fromDate}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2 text-sm outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    name="toDate"
                    value={formData.toDate}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2 text-sm outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2 text-sm outline-none focus:border-indigo-500"
                    required
                  >
                    <option value="">Select Status</option>
                    {dropdowns.statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 border rounded-md overflow-hidden">
                <div className="grid grid-cols-2 bg-indigo-500 text-white text-sm font-medium">
                  <div className="px-4 py-2 border-r border-indigo-400">
                    TASK TYPE
                  </div>
                  <div className="px-4 py-2">TARGET WORK</div>
                </div>

                <div className="grid grid-cols-2 border-b text-sm">
                  <div className="px-4 py-2 border-r bg-gray-50 flex items-center">
                    {formData.workType1}
                  </div>
                  <div className="p-1">
                    <input
                      type="number"
                      name="target1"
                      placeholder="Enter Target Work"
                      value={formData.target1 || ""}
                      onChange={handleInputChange}
                      className="w-full h-full px-3 py-1 outline-none border-none focus:ring-1 focus:ring-indigo-500 rounded"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 border-b text-sm">
                  <div className="px-4 py-2 border-r bg-gray-50 flex items-center">
                    {formData.workType2}
                  </div>
                  <div className="p-1">
                    <input
                      type="number"
                      name="target2"
                      placeholder="Enter Target Work"
                      value={formData.target2 || ""}
                      onChange={handleInputChange}
                      className="w-full h-full px-3 py-1 outline-none border-none focus:ring-1 focus:ring-indigo-500 rounded"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 text-sm">
                  <div className="px-4 py-2 border-r bg-gray-50 flex items-center">
                    {formData.workType3}
                  </div>
                  <div className="p-1">
                    <input
                      type="number"
                      name="target3"
                      placeholder="Enter Target Work"
                      value={formData.target3 || ""}
                      onChange={handleInputChange}
                      className="w-full h-full px-3 py-1 outline-none border-none focus:ring-1 focus:ring-indigo-500 rounded"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
