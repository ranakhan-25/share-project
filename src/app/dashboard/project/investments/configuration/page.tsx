/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  FileText,
  Check,
  Loader2,
} from "lucide-react";

// ---------- Types ----------
export interface ShareConfig {
  id: number | string;
  uuid: string;
  projectId: string;
  investorId: string;
  projectName: string;
  investorName: string;
  investmentAmount: string;
  profitPercent: string;
  profitAmount: string;
  isProfitDistribute: boolean;
  status: string;
}

interface OptionItem {
  uuid: string;
  name: string;
  code?: string;
}

// ---------- API helpers ----------
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";

async function handleRes(res: Response, action: string) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      json?.message || json?.error || `Failed to ${action} (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return json;
}

async function fetchShareConfigs(): Promise<{
  data: ShareConfig[];
  meta: any;
}> {
  const url = `${API_BASE}/realbizpro/api/v1/share-configuration?page=1&limit=100&skip=0&sortBy=createdAt&sortOrder=DESC&withDeleted=false`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  const json = await handleRes(res, "fetch share configs");

  const mapped: ShareConfig[] = (json?.data?.data || [])
    .map((item: any) => ({
      id: item.id ?? item.uuid,
      uuid: item.uuid,
      projectId: item.projectId || item.project?.uuid || "",
      investorId: item.investorId || item.investor?.uuid || "",
      projectName: item.project?.name || item.projectName || "",
      investorName: item.investor?.name || item.investorName || "",
      investmentAmount: String(item.investmentAmount ?? "0"),
      profitPercent: String(item.profitPercent ?? "0"),
      profitAmount: String(item.fixedProfitAmount ?? item.profitAmount ?? "0"),
      isProfitDistribute: Boolean(item.isProfitDistribute),
      status: item.status || "active",
    }))
    .filter((item: ShareConfig) => item.status?.toLowerCase() === "active");

  return { data: mapped, meta: json?.data?.meta };
}

async function fetchProjects(): Promise<OptionItem[]> {
  try {
    const url = `${API_BASE}/realbizpro/api/v1/project?page=1&limit=100`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.warn("Project fetch failed:", json?.message || res.status);
      return [];
    }

    const list: any[] =
      json?.data?.data || (Array.isArray(json?.data) ? json.data : null) || [];

    return list.map((p: any) => ({
      uuid: p.uuid || p.id,
      name: p.name || p.code || "Unnamed",
      code: p.code,
    }));
  } catch (err) {
    console.error("fetchProjects error:", err);
    return [];
  }
}

async function fetchInvestors(): Promise<OptionItem[]> {
  try {
    const url = `${API_BASE}/realbizpro/api/v1/investor?page=1&limit=100&status=active&sortOrder=DESC`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) return [];

    const list: any[] =
      json?.data?.data || (Array.isArray(json?.data) ? json.data : null) || [];

    return list.map((i: any) => ({
      uuid: i.uuid || i.id,
      name: i.name || i.code || "Unnamed",
      code: i.code,
    }));
  } catch (err) {
    console.error("fetchInvestors error:", err);
    return [];
  }
}

async function createShareConfig(payload: Record<string, any>) {
  const res = await fetch(`${API_BASE}/realbizpro/api/v1/share-configuration`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleRes(res, "create share config");
}

async function updateShareConfig(uuid: string, payload: Record<string, any>) {
  const res = await fetch(
    `${API_BASE}/realbizpro/api/v1/share-configuration/${uuid}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return handleRes(res, "update share config");
}

async function softDeleteShareConfig(uuid: string) {
  const res = await fetch(
    `${API_BASE}/realbizpro/api/v1/share-configuration/${uuid}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    },
  );
  return handleRes(res, "delete share config");
}

const toApiPayload = (data: {
  projectId: string;
  investorId: string;
  investmentAmount: string;
  profitPercent: string;
  profitAmount: string;
  isProfitDistribute: boolean;
}) => ({
  projectId: data.projectId,
  investorId: data.investorId,
  investmentAmount: Number(data.investmentAmount) || 0,
  profitPercent: Number(data.profitPercent) || 0,
  fixedProfitAmount: Number(data.profitAmount) || 0,
  isProfitDistribute: data.isProfitDistribute,
  status: "active",
});

// ---------- Form Modal ----------
function ShareConfigFormModal({
  title,
  initialData,
  projects,
  investors,
  onClose,
  onSubmit,
}: {
  title: string;
  initialData?: ShareConfig;
  projects: OptionItem[];
  investors: OptionItem[];
  onClose: () => void;
  onSubmit: (data: {
    projectId: string;
    investorId: string;
    investmentAmount: string;
    profitPercent: string;
    profitAmount: string;
    isProfitDistribute: boolean;
  }) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    projectId: initialData?.projectId || "",
    investorId: initialData?.investorId || "",
    investmentAmount: initialData?.investmentAmount || "",
    profitPercent: initialData?.profitPercent || "",
    profitAmount: initialData?.profitAmount || "",
    isProfitDistribute: initialData?.isProfitDistribute || false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId || !formData.investorId) {
      setFormError("Please select both Project and Investor");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await onSubmit(formData);
    } catch (err: any) {
      setFormError(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Project */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Project <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.projectId}
                onChange={(e) =>
                  setFormData({ ...formData, projectId: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Select value</option>
                {projects.map((p) => (
                  <option key={p.uuid} value={p.uuid}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Investor */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Investor <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.investorId}
                onChange={(e) =>
                  setFormData({ ...formData, investorId: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">--Select Investor--</option>
                {investors.map((i) => (
                  <option key={i.uuid} value={i.uuid}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Investment Amount */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Investment Amount
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Enter amount"
                value={formData.investmentAmount}
                onChange={(e) =>
                  setFormData({ ...formData, investmentAmount: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* If Profit(%) */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                If Profit(%)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="value"
                value={formData.profitPercent}
                onChange={(e) =>
                  setFormData({ ...formData, profitPercent: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Amount (if Fixed Amount) */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Amount(if Fixed Amount)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="value"
                value={formData.profitAmount}
                onChange={(e) =>
                  setFormData({ ...formData, profitAmount: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Is Profit Distribute */}
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.isProfitDistribute}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isProfitDistribute: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Is Profit Distribute
              </label>
            </div>
          </div>

          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-xs">
              {formError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2 bg-slate-400 hover:bg-slate-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-1.5"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- Main Page ----------
export default function ShareConfigurationPage() {
  const [configs, setConfigs] = useState<ShareConfig[]>([]);
  const [projects, setProjects] = useState<OptionItem[]>([]);
  const [investors, setInvestors] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ShareConfig | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [configRes, projectList, investorList] = await Promise.all([
        fetchShareConfigs(),
        fetchProjects(),
        fetchInvestors(),
      ]);

      setConfigs(configRes.data);
      setProjects(projectList);
      setInvestors(investorList);
    } catch (err: any) {
      setError(err.message || "Failed to load share configurations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredConfigs = configs.filter(
    (item) =>
      item.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.investorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.investmentAmount.includes(searchQuery),
  );

  const totalPages = Math.ceil(filteredConfigs.length / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentTableData = filteredConfigs.slice(
    startIndex,
    startIndex + entriesPerPage,
  );

  const handleDelete = async (config: ShareConfig) => {
    if (!confirm(`Delete configuration for "${config.projectName}"?`)) return;

    const uuidToDelete = config.uuid || String(config.id);
    if (!uuidToDelete) {
      alert("UUID is missing – cannot delete");
      return;
    }

    try {
      setActionLoading(true);
      await softDeleteShareConfig(uuidToDelete);
      setConfigs((prev) =>
        prev.filter((item) => (item.uuid || String(item.id)) !== uuidToDelete),
      );
      if (currentTableData.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      }
    } catch (err: any) {
      alert(err?.message || "Delete failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 p-4 sm:p-6 flex flex-col justify-between">
      <div className="space-y-4">
        {/* Breadcrumb & Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="text-xs text-slate-500 flex items-center gap-1 mb-1">
              <span>Home</span> /{" "}
              <span className="text-indigo-600 font-medium">
                Share Configuration Settings
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Share Configuration Management
            </h1>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Configuration
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/70 p-3 rounded-xl border border-slate-200/60">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-300 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm text-slate-600">Search:</span>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search configurations..."
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading share configurations...
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadData}
              className="underline text-xs font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-indigo-600 text-white font-medium text-xs tracking-wider uppercase">
                    <th className="py-3 px-4">SL NO</th>
                    <th className="py-3 px-4">Project Name</th>
                    <th className="py-3 px-4">Investor Name</th>
                    <th className="py-3 px-4">Investment Amount</th>
                    <th className="py-3 px-4">Profit Percent</th>
                    <th className="py-3 px-4">Profit Amount</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentTableData.length > 0 ? (
                    currentTableData.map((item, index) => (
                      <tr
                        key={item.uuid || item.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-slate-600">
                          {startIndex + index + 1}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {item.projectName || "—"}
                        </td>
                        <td className="py-3 px-4 font-semibold text-indigo-600">
                          {item.investorName || "—"}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-700">
                          {Number(item.investmentAmount).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {item.profitPercent}%
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-emerald-600 font-medium">
                          {Number(item.profitAmount).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setEditingConfig(item)}
                              title="Edit Configuration"
                              className="p-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-md transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              title="Delete Configuration"
                              disabled={actionLoading}
                              className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-10 text-slate-400 font-medium"
                      >
                        No matching records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-3 border-t border-slate-200 bg-white gap-2 text-xs text-slate-500">
              <div>
                Showing {filteredConfigs.length > 0 ? startIndex + 1 : 0} to{" "}
                {Math.min(startIndex + entriesPerPage, filteredConfigs.length)}{" "}
                of {filteredConfigs.length} entries
              </div>
              <div className="inline-flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded border border-slate-200 ${
                    currentPage === 1
                      ? "bg-slate-50 text-slate-400 cursor-not-allowed"
                      : "hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded font-medium ${
                        currentPage === page
                          ? "border border-indigo-600 bg-indigo-600 text-white"
                          : "border border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`px-3 py-1 rounded border border-slate-200 ${
                    currentPage === totalPages || totalPages === 0
                      ? "bg-slate-50 text-slate-400 cursor-not-allowed"
                      : "hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <ShareConfigFormModal
          title="Add New Configuration"
          projects={projects}
          investors={investors}
          onClose={() => setIsAddOpen(false)}
          onSubmit={async (data) => {
            await createShareConfig(toApiPayload(data));
            setIsAddOpen(false);
            await loadData();
          }}
        />
      )}

      {/* Edit Modal */}
      {editingConfig && (
        <ShareConfigFormModal
          title="Edit Configuration"
          initialData={editingConfig}
          projects={projects}
          investors={investors}
          onClose={() => setEditingConfig(null)}
          onSubmit={async (data) => {
            if (!editingConfig.uuid) throw new Error("UUID is missing");
            await updateShareConfig(editingConfig.uuid, toApiPayload(data));
            setEditingConfig(null);
            await loadData();
          }}
        />
      )}
    </div>
  );
}
