"use client";

import React, { useCallback, useEffect, useState } from "react";

import {
  Search,
  Plus,
  ChevronRight,
  Home,
  Layers,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  X,
  CreditCard,
} from "lucide-react";

export interface FundRequisitionItem {
  id: string;
  uuid: string;
  date: string;
  projectType: string;
  projectId: string;
  taskId: string;
  siteId: string;
  fromUserId: string;
  amount: string;
  approvedAmount: string;
  paidAmount: string;
  purpose: string;
  reference: string;
  approveStatus: string;
  paymentStatus: "Payment Left" | "Partially Paid" | "Fully Paid";
  addedById: string;
  createdBy?: string;
  updatedBy?: string;
}

interface RelatedOption {
  uuid: string;
  name: string;
  projectId?: string;
}

interface FundApiResponse {
  success: boolean;
  data: {
    data: FundRequisitionItem[];
    meta: {
      total: number;
      page: number;
      limit: number;
      skip: number;
      totalPages: number;
    };
  };
  message?: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PREFIX = "/realbizpro/api/v1";

const FUND_REQUISITION_ENDPOINT = `${API_BASE_URL}${API_PREFIX}/fund-requisition`;
const PROJECT_API = `${API_BASE_URL}${API_PREFIX}/project`;
const PROJECT_TYPE_API = `${API_BASE_URL}${API_PREFIX}/project-type`;
const TASK_API = `${API_BASE_URL}${API_PREFIX}/task`;
const SITE_API = `${API_BASE_URL}${API_PREFIX}/project-sites`;
const USER_API = `${API_BASE_URL}${API_PREFIX}/users`;
const REFERENCE_API = `${API_BASE_URL}${API_PREFIX}/fund-requisition`;

// ==================== GENERIC OPTIONS FETCHER ====================
async function fetchRelatedOptions(
  endpoint: string,
  label: string,
): Promise<RelatedOption[]> {
  const query = new URLSearchParams({ page: "1", limit: "100" });
  const res = await fetch(`${endpoint}?${query}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `Failed to fetch ${label}: ${res.status}`);
  }
  const json = await res.json();
  const rows =
    json?.data?.data ??
    (Array.isArray(json?.data) ? json.data : null) ??
    json?.rows ??
    json?.items ??
    [];
  return Array.isArray(rows)
    ? rows
        .filter((row: any) => row?.uuid)
        .map((row: any) => ({
          uuid: String(row.uuid),
          name: String(
            row.name ||
              row.title ||
              row.projectName ||
              row.taskName ||
              row.titleName ||
              row.typeName ||
              row.siteName ||
              row.userName ||
              row.fullName ||
              row.code ||
              row.reference ||
              "Unnamed",
          ),
          projectId: row.projectId ? String(row.projectId) : undefined,
        }))
    : [];
}

export default function FundRequisitionModule() {
  const [requisitions, setRequisitions] = useState<FundRequisitionItem[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState<FundRequisitionItem | null>(
    null,
  );

  // ==================== OPTIONS STATES ====================
  const [projectOptions, setProjectOptions] = useState<RelatedOption[]>([]);
  const [projectTypeOptions, setProjectTypeOptions] = useState<RelatedOption[]>(
    [],
  );
  const [taskOptions, setTaskOptions] = useState<RelatedOption[]>([]);
  const [siteOptions, setSiteOptions] = useState<RelatedOption[]>([]);
  const [userOptions, setUserOptions] = useState<RelatedOption[]>([]);
  const [referenceOptions, setReferenceOptions] = useState<RelatedOption[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    projectType: "",
    projectId: "",
    taskId: "",
    siteId: "",
    fromUserId: "",
    amount: "",
    approvedAmount: "",
    paidAmount: "",
    purpose: "",
    reference: "",
    approveStatus: "Pending",
    paymentStatus: "Payment Left",
    addedById: "",
    createdBy: "Admin",
    updatedBy: "Admin",
  });

  // Payment Form State
  const [paymentData, setPaymentData] = useState({
    date: new Date().toISOString().slice(0, 10),
    voucherNo: "",
    account: "",
    isCheque: false,
    paymentMethod: "",
    amount: "",
    comment: "",
  });

  // ==================== LOAD OPTIONS ====================
  useEffect(() => {
    fetchRelatedOptions(PROJECT_TYPE_API, "project types")
      .then(setProjectTypeOptions)
      .catch((e) => console.error("project types:", e));

    fetchRelatedOptions(PROJECT_API, "projects")
      .then(setProjectOptions)
      .catch((e) => console.error("projects:", e));

    fetchRelatedOptions(TASK_API, "tasks")
      .then(setTaskOptions)
      .catch((e) => console.error("tasks:", e));

    fetchRelatedOptions(SITE_API, "sites")
      .then(setSiteOptions)
      .catch((e) => console.error("sites:", e));

    fetchRelatedOptions(USER_API, "users")
      .then(setUserOptions)
      .catch((e) => console.error("users:", e));

    fetchRelatedOptions(REFERENCE_API, "references")
      .then(setReferenceOptions)
      .catch((e) => console.error("references:", e));
  }, []);

  // ==================== GET DATA ====================
  const fetchFundRequisitions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(entriesPerPage));
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (userFilter !== "All") params.set("addedById", userFilter);
      if (statusFilter !== "All") params.set("paymentStatus", statusFilter);

      const response = await fetch(
        `${FUND_REQUISITION_ENDPOINT}?${params.toString()}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      const body: FundApiResponse = await response.json();

      if (!response.ok || !body.success) {
        throw new Error(body.message || "Failed to fetch fund requisitions");
      }

      setRequisitions(body.data?.data || []);
      setTotalItems(body.data?.meta?.total || 0);
      setTotalPages(body.data?.meta?.totalPages || 1);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to fetch fund requisitions";
      setError(message);
      setRequisitions([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, entriesPerPage, searchQuery, userFilter, statusFilter]);

  useEffect(() => {
    fetchFundRequisitions();
  }, [fetchFundRequisitions]);

  // ==================== CREATE ====================
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError("");

      const payload = {
        date: formData.date,
        projectType: formData.projectType,
        projectId: formData.projectId,
        taskId: formData.taskId,
        siteId: formData.siteId,
        fromUserId: formData.fromUserId,
        amount: Number(formData.amount) || 0,
        approvedAmount: Number(formData.approvedAmount) || 0,
        paidAmount: Number(formData.paidAmount) || 0,
        purpose: formData.purpose,
        reference: formData.reference,
        approveStatus: formData.approveStatus,
        paymentStatus: formData.paymentStatus,
        addedById: formData.addedById,
        createdBy: formData.createdBy,
        updatedBy: formData.updatedBy,
      };

      const response = await fetch(FUND_REQUISITION_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.message || "Failed to create fund requisition");
      }

      setIsAddModalOpen(false);
      resetForm();
      await fetchFundRequisitions();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to create fund requisition";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== UPDATE ====================
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem?.uuid) {
      setError("Fund requisition UUID not found");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        date: formData.date,
        projectType: formData.projectType,
        projectId: formData.projectId,
        taskId: formData.taskId,
        siteId: formData.siteId,
        fromUserId: formData.fromUserId,
        amount: Number(formData.amount) || 0,
        approvedAmount: Number(formData.approvedAmount) || 0,
        paidAmount: Number(formData.paidAmount) || 0,
        purpose: formData.purpose,
        reference: formData.reference,
        approveStatus: formData.approveStatus,
        paymentStatus: formData.paymentStatus,
        addedById: formData.addedById,
        updatedBy: formData.updatedBy,
      };

      const response = await fetch(
        `${FUND_REQUISITION_ENDPOINT}/${selectedItem.uuid}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.message || "Failed to update fund requisition");
      }

      setIsEditModalOpen(false);
      setSelectedItem(null);
      resetForm();
      await fetchFundRequisitions();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update fund requisition";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== DELETE ====================
  const handleDelete = async (uuid: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this fund requisition?",
    );
    if (!confirmed) return;

    try {
      setSubmitting(true);
      setError("");

      const response = await fetch(`${FUND_REQUISITION_ENDPOINT}/${uuid}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.message || "Failed to delete fund requisition");
      }

      await fetchFundRequisitions();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to delete fund requisition";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== OPEN EDIT ====================
  const openEditModal = (item: FundRequisitionItem) => {
    setSelectedItem(item);
    setFormData({
      date: item.date || "",
      projectType: item.projectType || "",
      projectId: item.projectId || "",
      taskId: item.taskId || "",
      siteId: item.siteId || "",
      fromUserId: item.fromUserId || "",
      amount: item.amount || "",
      approvedAmount: item.approvedAmount || "",
      paidAmount: item.paidAmount || "",
      purpose: item.purpose || "",
      reference: item.reference || "",
      approveStatus: item.approveStatus || "Pending",
      paymentStatus: item.paymentStatus || "Payment Left",
      addedById: item.addedById || "",
      createdBy: item.createdBy || "",
      updatedBy: "Admin",
    });
    setIsEditModalOpen(true);
  };

  // ==================== PAYMENT ====================
  const openPaymentModal = (item: FundRequisitionItem) => {
    setSelectedItem(item);
    setPaymentData({
      ...paymentData,
      amount: item.approvedAmount || item.amount || "0",
      account: item.fromUserId || "",
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    // Payment API nei — UI theke close hocche
    setIsPaymentModalOpen(false);
    setSelectedItem(null);
  };

  // ==================== RESET FORM ====================
  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      projectType: "",
      projectId: "",
      taskId: "",
      siteId: "",
      fromUserId: "",
      amount: "",
      approvedAmount: "",
      paidAmount: "",
      purpose: "",
      reference: "",
      approveStatus: "Pending",
      paymentStatus: "Payment Left",
      addedById: "",
      createdBy: "Admin",
      updatedBy: "Admin",
    });
  };

  // ==================== FORMAT ====================
  const formatDate = (date: string) => {
    if (!date) return "-";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return date;
    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount: string) => {
    const number = Number(amount || 0);
    return number.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // ==================== FILTERED SITE OPTIONS ====================
  const filteredSiteOptions = siteOptions.filter((site) => {
    if (!site.projectId) return true;
    if (!formData.projectId) return true;
    return site.projectId === formData.projectId;
  });

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-between p-3 sm:p-5 font-sans">
      <div className="space-y-3 max-w-[1600px] mx-auto w-full">
        {/* HEADER */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1 hover:text-indigo-600 cursor-pointer transition-colors">
                <Home className="w-3.5 h-3.5" />
                Home
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-600">Requisition</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-indigo-600 font-semibold">
                Fund Requisition List
              </span>
            </div>
            <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#5949d6]" />
              Fund Requisition Management
            </h1>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 bg-[#5949d6] hover:bg-[#4d3ec2] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Fund Requisition Add
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="text-rose-500 hover:text-rose-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* FILTER */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">
              Users
            </label>
            <select
              value={userFilter}
              onChange={(e) => {
                setUserFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">Select an option</option>
              {userOptions.map((u) => (
                <option key={u.uuid} value={u.uuid}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">
              Payment Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">Select an option</option>
              <option value="Payment Left">Payment Left</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Fully Paid">Fully Paid</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <span>Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-slate-300 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-600 font-medium">
                Search:
              </span>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search project, reference, user..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* TABLE BODY */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
            <div className="overflow-x-auto min-h-[350px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#5949d6] text-white font-semibold tracking-wide">
                    <th className="py-3 px-3">SL</th>
                    <th className="py-3 px-3">DATE</th>
                    <th className="py-3 px-3">PROJECT</th>
                    <th className="py-3 px-3">FROM</th>
                    <th className="py-3 px-3">AMOUNT</th>
                    <th className="py-3 px-3">APPROVED AMOUNT</th>
                    <th className="py-3 px-3">PAID AMOUNT</th>
                    <th className="py-3 px-3">PURPOSE</th>
                    <th className="py-3 px-3">REFERENCE</th>
                    <th className="py-3 px-3">APPROVAL STATUS</th>
                    <th className="py-3 px-3">PAYMENT STATUS</th>
                    <th className="py-3 px-3">ADDED BY</th>
                    <th className="py-3 px-3 text-center w-32">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={13}
                        className="text-center py-12 text-slate-400"
                      >
                        Loading fund requisitions...
                      </td>
                    </tr>
                  ) : requisitions.length > 0 ? (
                    requisitions.map((item, index) => (
                      <tr
                        key={item.uuid}
                        className="hover:bg-indigo-50/30 transition-colors"
                      >
                        <td className="py-3 px-3 font-mono font-bold text-slate-500">
                          {(currentPage - 1) * entriesPerPage + index + 1}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {formatDate(item.date)}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {item.projectId || "-"}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700">
                          {item.fromUserId || "-"}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-800">
                          {formatAmount(item.amount)}
                        </td>
                        <td className="py-3 px-3 font-bold text-indigo-700">
                          {formatAmount(item.approvedAmount)}
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-600">
                          {formatAmount(item.paidAmount)}
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-xs">
                          {item.purpose || "-"}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700">
                          {item.reference || "-"}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-block px-2.5 py-1 rounded text-[11px] font-bold bg-indigo-100 text-indigo-700">
                            {item.approveStatus || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold ${
                              item.paymentStatus === "Fully Paid"
                                ? "bg-emerald-100 text-emerald-700"
                                : item.paymentStatus === "Partially Paid"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {item.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700">
                          {item.addedById || "-"}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openPaymentModal(item)}
                              className="bg-[#5949d6] hover:bg-[#4d3ec2] text-white p-1.5 rounded shadow-2xs transition-colors cursor-pointer"
                              title="Make Payment"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="bg-cyan-500 hover:bg-cyan-600 text-white p-1.5 rounded shadow-2xs transition-colors cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => handleDelete(item.uuid)}
                              className="bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={13}
                        className="text-center py-12 text-slate-400 font-medium"
                      >
                        No fund requisition records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* FOOTER */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-3 border-t border-slate-200 bg-white gap-2 text-xs text-slate-500 font-medium">
              <div>
                Showing{" "}
                {totalItems === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1}{" "}
                to {Math.min(currentPage * entriesPerPage, totalItems)} of{" "}
                {totalItems} entries
              </div>
              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1 || loading}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  className="px-3 py-1 rounded border border-slate-200 bg-slate-50 text-slate-500 disabled:text-slate-300 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 rounded border border-[#5949d6] bg-[#5949d6] text-white font-semibold">
                  {currentPage}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages || loading}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  className="px-3 py-1 rounded border border-slate-200 bg-slate-50 text-slate-500 disabled:text-slate-300 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          ADD MODAL
      ================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden">
            <div className="bg-[#5949d6] text-white px-6 py-3.5 flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Fund Requisition
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-white hover:bg-white/20 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateSubmit}
              className="p-6 space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* DATE */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* PROJECT TYPE — DYNAMIC */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Project Type
                  </label>
                  <select
                    value={formData.projectType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        projectType: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Select Project Type</option>
                    {projectTypeOptions.map((pt) => (
                      <option key={pt.uuid} value={pt.name}>
                        {pt.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* PROJECT — DYNAMIC */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Project
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        projectId: e.target.value,
                        siteId: "",
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Select Project</option>
                    {projectOptions.map((p) => (
                      <option key={p.uuid} value={p.uuid}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* TASK — DYNAMIC */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    If Task
                  </label>
                  <select
                    value={formData.taskId}
                    onChange={(e) =>
                      setFormData({ ...formData, taskId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Select Task</option>
                    {taskOptions.map((t) => (
                      <option key={t.uuid} value={t.uuid}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SITE — DYNAMIC (filtered by project) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Site
                  </label>
                  <select
                    value={formData.siteId}
                    onChange={(e) =>
                      setFormData({ ...formData, siteId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Select Site</option>
                    {filteredSiteOptions.map((s) => (
                      <option key={s.uuid} value={s.uuid}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* FROM — DYNAMIC */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    From
                  </label>
                  <select
                    value={formData.fromUserId}
                    onChange={(e) =>
                      setFormData({ ...formData, fromUserId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Select User</option>
                    {userOptions.map((u) => (
                      <option key={u.uuid} value={u.uuid}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* AMOUNT */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    required
                    placeholder="Amount"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                {/* APPROVED */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Approved Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.approvedAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        approvedAmount: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                {/* PAID */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Paid Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.paidAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paidAmount: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                {/* APPROVE STATUS */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Approve Status
                  </label>
                  <select
                    value={formData.approveStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        approveStatus: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="Pending">Pending</option>
                    <option value="All Approval Done">All Approval Done</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {/* PAYMENT STATUS */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentStatus: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="Payment Left">Payment Left</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Fully Paid">Fully Paid</option>
                  </select>
                </div>

                {/* PURPOSE */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Purpose *
                  </label>
                  <textarea
                    rows={2}
                    value={formData.purpose}
                    onChange={(e) =>
                      setFormData({ ...formData, purpose: e.target.value })
                    }
                    required
                    placeholder="Purpose of requisition..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg resize-none"
                  />
                </div>

                {/* REFERENCE — DYNAMIC */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    If Reference
                  </label>
                  <select
                    value={formData.reference}
                    onChange={(e) =>
                      setFormData({ ...formData, reference: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Select Reference</option>
                    {referenceOptions.map((r) => (
                      <option key={r.uuid} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-400 hover:bg-slate-500 text-white rounded-lg font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#5949d6] hover:bg-[#4d3ec2] text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          EDIT MODAL — same dynamic dropdown gulo use korun
      ================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden">
            <div className="bg-cyan-500 text-white px-6 py-3.5 flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit Fund Requisition
              </h2>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-white hover:bg-white/20 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleUpdateSubmit}
              className="p-6 space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Project Type
                  </label>
                  <select
                    value={formData.projectType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        projectType: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Select Project Type</option>
                    {projectTypeOptions.map((pt) => (
                      <option key={pt.uuid} value={pt.name}>
                        {pt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Project
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        projectId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Select Project</option>
                    {projectOptions.map((p) => (
                      <option key={p.uuid} value={p.uuid}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    If Task
                  </label>
                  <select
                    value={formData.taskId}
                    onChange={(e) =>
                      setFormData({ ...formData, taskId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Select Task</option>
                    {taskOptions.map((t) => (
                      <option key={t.uuid} value={t.uuid}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Site
                  </label>
                  <select
                    value={formData.siteId}
                    onChange={(e) =>
                      setFormData({ ...formData, siteId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Select Site</option>
                    {filteredSiteOptions.map((s) => (
                      <option key={s.uuid} value={s.uuid}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    From
                  </label>
                  <select
                    value={formData.fromUserId}
                    onChange={(e) =>
                      setFormData({ ...formData, fromUserId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Select User</option>
                    {userOptions.map((u) => (
                      <option key={u.uuid} value={u.uuid}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Approved Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.approvedAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        approvedAmount: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Paid Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.paidAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paidAmount: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Approve Status
                  </label>
                  <select
                    value={formData.approveStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        approveStatus: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="Pending">Pending</option>
                    <option value="All Approval Done">All Approval Done</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentStatus: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="Payment Left">Payment Left</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Fully Paid">Fully Paid</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Purpose
                  </label>
                  <textarea
                    rows={2}
                    value={formData.purpose}
                    onChange={(e) =>
                      setFormData({ ...formData, purpose: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg resize-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Reference
                  </label>
                  <select
                    value={formData.reference}
                    onChange={(e) =>
                      setFormData({ ...formData, reference: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Select Reference</option>
                    {referenceOptions.map((r) => (
                      <option key={r.uuid} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-400 hover:bg-slate-500 text-white rounded-lg font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {submitting ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          PAYMENT MODAL — same as age
      ================================================== */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden">
            <div className="bg-[#5949d6] text-white px-6 py-3.5 flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Make Payment
              </h2>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-white hover:bg-white/20 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handlePaymentSubmit}
              className="p-6 space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={paymentData.date}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Voucher No
                  </label>
                  <input
                    type="text"
                    value={paymentData.voucherNo}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        voucherNo: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Select Account
                  </label>
                  <input
                    type="text"
                    value={paymentData.account}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        account: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentData.paymentMethod}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        paymentMethod: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="">Select Payment Method</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Mobile Banking">Mobile Banking</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={paymentData.amount}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        amount: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Comment
                  </label>
                  <input
                    type="text"
                    value={paymentData.comment}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        comment: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentData.isCheque}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          isCheque: e.target.checked,
                        })
                      }
                    />
                    If cheque
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-400 hover:bg-slate-500 text-white rounded-lg font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5949d6] hover:bg-[#4d3ec2] text-white rounded-lg font-semibold"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
