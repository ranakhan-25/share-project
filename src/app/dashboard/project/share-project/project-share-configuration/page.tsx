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
export interface InstallmentRow {
  id?: string;
  date: string;
  amount: string;
  lastDate: string;
  note: string;
}

export interface ShareConfigItem {
  id: number | string;
  uuid: string;
  title: string;
  projectId: string;
  projectName: string;
  shareType: string;
  taskNames: string;
  assignType: string;
  configurationAmount: number;
  numberOfShares: number;
  valuePerShare: number;
  penaltyPercentage: number;
  lastPaymentDate?: string;
  installments: InstallmentRow[];
  status: string;
}

interface OptionItem {
  uuid: string;
  name: string;
  code?: string;
}

// ---------- API Config ----------
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PREFIX = "/realbizpro/api/v1";

const SHARE_CONFIG_API = `${API_BASE}${API_PREFIX}/project-share-configurations`;
const PROJECT_API = `${API_BASE}${API_PREFIX}/project`;
const PROJECT_TYPE_API = `${API_BASE}${API_PREFIX}/project-type`;

// ---------- Helpers ----------
async function handleRes(res: Response, action: string) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      json?.message || json?.error || `Failed to ${action} (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return json;
}

function extractList(json: any): any[] {
  return (
    json?.data?.data ||
    (Array.isArray(json?.data) ? json.data : null) ||
    json?.rows ||
    json?.items ||
    json?.results ||
    []
  );
}

function generateInstallmentId(): string {
  return `ins_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ---------- Share Configs list ----------
async function fetchShareConfigs(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ data: ShareConfigItem[]; meta: any }> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 100;
  const search = params?.search?.trim();

  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("limit", String(limit));
  if (search) query.set("search", search);

  const url = `${SHARE_CONFIG_API}?${query.toString()}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  const json = await handleRes(res, "fetch share configurations");

  const rows = json?.data?.data || json?.data || [];

  const mapped: ShareConfigItem[] = rows.map((item: any) => ({
    id: item.id ?? item.uuid,
    uuid: item.uuid,
    title: item.titleName || "",
    projectId: item.projectId || "",
    projectName: item.project?.name || item.projectName || "N/A",
    shareType: item.shareType || "",
    taskNames: item.taskNames || "",
    assignType: item.assignType || "",
    configurationAmount: Number(item.configurationAmount ?? 0),
    numberOfShares: Number(item.numberOfShares ?? 0),
    valuePerShare: Number(item.valuePerShare ?? 0),
    penaltyPercentage: Number(item.penaltyPercentage ?? 0),
    lastPaymentDate: item.lastPaymentDate || "",
    installments: (item.installments || []).map((ins: any, idx: number) => ({
      id: ins.id || ins.uuid || generateInstallmentId(),
      date: ins.date || "",
      amount: String(ins.amount ?? ""),
      lastDate: ins.lastDate || "",
      note: ins.note || "",
    })),
    status: item.status || "active",
  }));

  console.log("📥 Fetched configs:", mapped);
  console.log(
    "📥 Installments per config:",
    mapped.map((c) => ({ title: c.title, insCount: c.installments.length })),
  );

  return {
    data: mapped,
    meta: json?.meta || json?.data?.meta || {},
  };
}

// ---------- PROJECT dropdown ----------
async function fetchProjects(): Promise<OptionItem[]> {
  try {
    const url = `${PROJECT_API}?page=1&limit=100`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return [];
    const list = extractList(json);
    return list.map((p: any) => ({
      uuid: p.uuid || p.id,
      name: p.name || p.projectName || p.code || "Unnamed",
      code: p.code,
    }));
  } catch (err) {
    console.error("fetchProjects error →", err);
    return [];
  }
}

// ---------- PROJECT TYPE dropdown ----------
async function fetchProjectTypes(): Promise<OptionItem[]> {
  try {
    const url = `${PROJECT_TYPE_API}?page=1&limit=100`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return [];
    const list = extractList(json);
    return list.map((t: any) => ({
      uuid: t.uuid || t.id,
      name: t.name || t.title || t.typeName || t.code || "Unnamed",
      code: t.code,
    }));
  } catch (err) {
    console.error("fetchProjectTypes error →", err);
    return [];
  }
}

// ---------- CRUD ----------
async function createShareConfig(payload: Record<string, any>) {
  console.log("📤 POST payload →", payload);
  const res = await fetch(SHARE_CONFIG_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await handleRes(res, "create share configuration");
  console.log("✅ POST response →", json);
  return json;
}

async function updateShareConfig(uuid: string, payload: Record<string, any>) {
  console.log("📤 PATCH", uuid, "→", payload);
  const res = await fetch(`${SHARE_CONFIG_API}/${uuid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await handleRes(res, "update share configuration");
  console.log("✅ PATCH response →", json);
  return json;
}

async function softDeleteShareConfig(uuid: string) {
  const res = await fetch(`${SHARE_CONFIG_API}/${uuid}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  return handleRes(res, "delete share configuration");
}

// ---------- API Payload builder ----------
// ✅ Backend DTO onujayi sob field pathacchi — installments soho
const toApiPayload = (data: {
  title: string;
  projectId: string;
  numberOfShares: string;
  shareType: string;
  taskNames: string;
  assignType: string;
  amount: string;
  valuePerShare: string;
  penaltyPercentage: string;
  lastPaymentDate: string;
  installments: InstallmentRow[];
  status: string;
}) => ({
  projectId: data.projectId,
  titleName: data.title,
  shareType: data.shareType || "",
  taskNames: data.taskNames || "",
  assignType: data.assignType || "",
  configurationAmount: Number(data.amount) || 0,
  numberOfShares: Number(data.numberOfShares) || 0,
  valuePerShare: Number(data.valuePerShare) || 0,
  penaltyPercentage: Number(data.penaltyPercentage) || 0,
  lastPaymentDate: data.lastPaymentDate || undefined,
  installments: (data.installments || []).map((ins) => ({
    date: ins.date || undefined,
    amount: Number(ins.amount) || 0,
    lastDate: ins.lastDate || undefined,
    note: ins.note || undefined,
  })),
  status: data.status || "active",
});

// ---------- Form Modal ----------
function ShareConfigFormModal({
  title,
  initialData,
  projects,
  projectTypes,
  onClose,
  onSubmit,
}: {
  title: string;
  initialData?: ShareConfigItem;
  projects: OptionItem[];
  projectTypes: OptionItem[];
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    projectId: initialData?.projectId || "",
    numberOfShares: initialData?.numberOfShares?.toString() || "",
    shareType: initialData?.shareType || "",
    taskNames: initialData?.taskNames || "",
    assignType: initialData?.assignType || "",
    amount: initialData?.configurationAmount?.toString() || "",
    valuePerShare: initialData?.valuePerShare?.toString() || "",
    penaltyPercentage: initialData?.penaltyPercentage?.toString() || "",
    lastPaymentDate: initialData?.lastPaymentDate || "",
    status: initialData?.status || "active",
  });

  // ✅ Installments — initialData theke direct load
  const [installments, setInstallments] = useState<InstallmentRow[]>(() => {
    if (initialData?.installments && initialData.installments.length > 0) {
      console.log("🔄 INITIAL LOAD installments →", initialData.installments);
      return initialData.installments.map((ins) => ({
        ...ins,
        id: ins.id || generateInstallmentId(),
      }));
    }
    return [];
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ✅ useEffect — initialData change hole (edit)
  useEffect(() => {
    if (!initialData) {
      setFormData({
        title: "",
        projectId: "",
        numberOfShares: "",
        shareType: "",
        taskNames: "",
        assignType: "",
        amount: "",
        valuePerShare: "",
        penaltyPercentage: "",
        lastPaymentDate: "",
        status: "active",
      });
      setInstallments([]);
      return;
    }

    console.log("🔄 initialData changed →", initialData.uuid);
    console.log(
      "🔄 initialData.installments count →",
      initialData.installments?.length || 0,
    );

    setFormData({
      title: initialData.title || "",
      projectId: initialData.projectId || "",
      numberOfShares: initialData.numberOfShares?.toString() || "",
      shareType: initialData.shareType || "",
      taskNames: initialData.taskNames || "",
      assignType: initialData.assignType || "",
      amount: initialData.configurationAmount?.toString() || "",
      valuePerShare: initialData.valuePerShare?.toString() || "",
      penaltyPercentage: initialData.penaltyPercentage?.toString() || "",
      lastPaymentDate: initialData.lastPaymentDate || "",
      status: initialData.status || "active",
    });

    if (initialData.installments && initialData.installments.length > 0) {
      const loaded = initialData.installments.map((ins) => ({
        ...ins,
        id: ins.id || generateInstallmentId(),
      }));
      console.log("✅ Setting installments →", loaded);
      setInstallments(loaded);
    } else {
      console.log("⚠️ No installments to load");
      setInstallments([]);
    }
  }, [initialData?.uuid]);

  // ✅ Add installment
  const addInstallment = () => {
    const today = new Date().toISOString().split("T")[0];
    const newRow: InstallmentRow = {
      id: generateInstallmentId(),
      date: today,
      amount: formData.amount || "",
      lastDate: formData.lastPaymentDate || "",
      note: formData.title || "",
    };
    console.log("➕ addInstallment →", newRow);
    setInstallments((prev) => [...prev, newRow]);
  };

  const updateInstallment = (
    index: number,
    field: keyof InstallmentRow,
    value: string,
  ) => {
    setInstallments((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const removeInstallment = (index: number) => {
    setInstallments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError("Title/Name is required");
      return;
    }
    if (!formData.projectId) {
      setFormError("Project is required");
      return;
    }
    if (!formData.shareType) {
      setFormError("Share Type is required");
      return;
    }
    if (!formData.assignType) {
      setFormError("Assign Type is required");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      console.log("📤 Submitting with installments:", installments);
      await onSubmit({ ...formData, installments });
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Title/name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Title/name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={255}
                placeholder="Title/Note"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

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
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Select value</option>
                {projects.length === 0 ? (
                  <option value="" disabled>
                    Loading projects...
                  </option>
                ) : (
                  projects.map((p) => (
                    <option key={p.uuid} value={p.uuid}>
                      {p.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Number of Shares */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Number of Shares
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Enter number of shares"
                value={formData.numberOfShares}
                onChange={(e) =>
                  setFormData({ ...formData, numberOfShares: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Share Type */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Share Type <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.shareType}
                onChange={(e) =>
                  setFormData({ ...formData, shareType: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Select value</option>
                {projectTypes.length === 0 ? (
                  <option value="" disabled>
                    Loading share types...
                  </option>
                ) : (
                  projectTypes.map((t) => (
                    <option key={t.uuid} value={t.name}>
                      {t.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Task Names — PLAIN TEXT INPUT */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Task Names
              </label>
              <input
                type="text"
                placeholder="Task names"
                value={formData.taskNames}
                onChange={(e) =>
                  setFormData({ ...formData, taskNames: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Assign Type */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Assign Type <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.assignType}
                onChange={(e) =>
                  setFormData({ ...formData, assignType: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Select Assign Type</option>
                <option value="Fixed-Amount">Fixed-Amount</option>
                <option value="Percentage">Percentage</option>
                <option value="Per-Share">Per-Share</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter configuration amount"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Value (Per Share) */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Value (Per Share)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="value per Share"
                value={formData.valuePerShare}
                onChange={(e) =>
                  setFormData({ ...formData, valuePerShare: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Penalty Percentage */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Penalty Percentage
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Penalty %"
                value={formData.penaltyPercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    penaltyPercentage: e.target.value,
                  })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Last Payment Date */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Last Payment Date
              </label>
              <input
                type="date"
                value={formData.lastPaymentDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lastPaymentDate: e.target.value,
                  })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Installments */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
              <span className="text-sm font-medium text-slate-700">
                No Of Installment ({installments.length})
              </span>
              <button
                type="button"
                onClick={addInstallment}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-indigo-600 text-white text-xs uppercase">
                    <th className="py-2.5 px-3 text-left">SL</th>
                    <th className="py-2.5 px-3 text-left">DATE</th>
                    <th className="py-2.5 px-3 text-left">AMOUNT</th>
                    <th className="py-2.5 px-3 text-left">LAST DATE</th>
                    <th className="py-2.5 px-3 text-left">NOTE</th>
                    <th className="py-2.5 px-3 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {installments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-6 text-center text-slate-400 text-sm"
                      >
                        No installment added
                      </td>
                    </tr>
                  ) : (
                    installments.map((row, index) => (
                      <tr key={String(row.id || `ins-row-${index}`)}>
                        <td className="py-2 px-3 text-slate-600">
                          {index + 1}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="date"
                            value={row.date}
                            onChange={(e) =>
                              updateInstallment(index, "date", e.target.value)
                            }
                            className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0"
                            value={row.amount}
                            onChange={(e) =>
                              updateInstallment(index, "amount", e.target.value)
                            }
                            className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="date"
                            value={row.lastDate}
                            onChange={(e) =>
                              updateInstallment(
                                index,
                                "lastDate",
                                e.target.value,
                              )
                            }
                            className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder="Note"
                            value={row.note}
                            onChange={(e) =>
                              updateInstallment(index, "note", e.target.value)
                            }
                            className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeInstallment(index)}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
              className="px-5 py-2 bg-slate-400 hover:bg-slate-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium flex items-center gap-1.5"
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
export default function ShareConfigurationSettingsPage() {
  const [configs, setConfigs] = useState<ShareConfigItem[]>([]);
  const [projects, setProjects] = useState<OptionItem[]>([]);
  const [projectTypes, setProjectTypes] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShareConfigItem | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [configRes, projectList, typeList] = await Promise.all([
        fetchShareConfigs(),
        fetchProjects(),
        fetchProjectTypes(),
      ]);

      console.log("Loaded projects →", projectList.length);
      console.log("Loaded project types →", typeList.length);

      setConfigs(configRes.data);
      setProjects(projectList);
      setProjectTypes(typeList);
    } catch (err: any) {
      setError(err.message || "Failed to load configurations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = configs.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.shareType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.assignType.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentTableData = filtered.slice(
    startIndex,
    startIndex + entriesPerPage,
  );

  const handleDelete = async (item: ShareConfigItem) => {
    if (!confirm(`Delete configuration "${item.title}"?`)) return;
    const uuid = item.uuid || String(item.id);
    if (!uuid) {
      alert("UUID missing");
      return;
    }
    try {
      setActionLoading(true);
      await softDeleteShareConfig(uuid);
      setConfigs((prev) =>
        prev.filter((c) => (c.uuid || String(c.id)) !== uuid),
      );
      if (currentTableData.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      }
    } catch (err: any) {
      alert(err?.message || "Delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditClick = (item: ShareConfigItem) => {
    console.log("✏️ Edit click →", item);
    console.log("✏️ Installments to edit →", item.installments);
    setEditingItem(item);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 p-4 sm:p-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="text-xs text-slate-500 flex items-center gap-1 mb-1">
              <span>Home</span> /{" "}
              <span className="text-indigo-600 font-medium">
                Share Configuration Settings
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Share Configuration Settings
            </h1>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Configuration
          </button>
        </div>

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
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading configurations...
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm flex justify-between">
            <span>{error}</span>
            <button
              onClick={loadData}
              className="underline text-xs font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-indigo-600 text-white font-medium text-xs tracking-wider uppercase">
                    <th className="py-3 px-4">SL NO</th>
                    <th className="py-3 px-4">TITLE/NAME</th>
                    <th className="py-3 px-4">PROJECT NAME</th>
                    <th className="py-3 px-4">SHARE TYPE</th>
                    <th className="py-3 px-4">TASK NAMES</th>
                    <th className="py-3 px-4">ASSIGN TYPE</th>
                    <th className="py-3 px-4">CONFIGURATION AMOUNT</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentTableData.length > 0 ? (
                    currentTableData.map((item, index) => (
                      <tr
                        key={item.uuid || item.id}
                        className="hover:bg-slate-50/80"
                      >
                        <td className="py-3 px-4 text-slate-600">
                          {startIndex + index + 1}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {item.title || "—"}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {item.projectName || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {item.shareType || "—"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 bg-slate-200 text-slate-600 text-xs rounded">
                            {item.taskNames || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {item.assignType || "N/A"}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-700">
                          {Number(item.configurationAmount).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                              item.status?.toLowerCase() === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {item.status
                              ? item.status.charAt(0).toUpperCase() +
                                item.status.slice(1)
                              : "Active"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleEditClick(item)}
                              title="Edit"
                              className="p-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-md"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              title="Delete"
                              disabled={actionLoading}
                              className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md disabled:opacity-50"
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
                        colSpan={9}
                        className="text-center py-10 text-slate-400 font-medium"
                      >
                        No matching records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between p-3 border-t border-slate-200 gap-2 text-xs text-slate-500">
              <div>
                Showing {filtered.length > 0 ? startIndex + 1 : 0} to{" "}
                {Math.min(startIndex + entriesPerPage, filtered.length)} of{" "}
                {filtered.length} entries
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

      {isAddOpen && (
        <ShareConfigFormModal
          title="Add New Configuration"
          projects={projects}
          projectTypes={projectTypes}
          onClose={() => setIsAddOpen(false)}
          onSubmit={async (data) => {
            await createShareConfig(toApiPayload(data));
            setIsAddOpen(false);
            await loadData();
          }}
        />
      )}

      {editingItem && (
        <ShareConfigFormModal
          title="Edit Configuration"
          initialData={editingItem}
          projects={projects}
          projectTypes={projectTypes}
          onClose={() => setEditingItem(null)}
          onSubmit={async (data) => {
            if (!editingItem.uuid) throw new Error("UUID is missing");
            await updateShareConfig(editingItem.uuid, toApiPayload(data));
            setEditingItem(null);
            await loadData();
          }}
        />
      )}
    </div>
  );
}
