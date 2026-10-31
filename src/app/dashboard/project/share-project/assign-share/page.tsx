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
  Users,
} from "lucide-react";

// ---------- Types ----------
export interface ShareAssignment {
  id: number | string;
  uuid: string;
  projectId: string;
  projectName: string;
  projectTypeId: string;
  projectTypeName: string;
  siteId: string;
  siteName: string;
  code: string;
  shareCode: string;
  customerName: string;
  noOfShares: number;
  flatLand: string;
  note?: string;
  email?: string;
  mobile?: string;
  nid?: string;
  address?: string;
  image?: string;
  shareAmount: number;
  paidAmount: number;
  totalCost: number;
  balance: number;
  due: number;
  penaltyAmount: number;
  points: number;
  assignedAt: string;
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
const API_PREFIX = "/realbizpro/api/v1";

const SHARE_ASSIGNMENT_API = `${API_BASE}${API_PREFIX}/project-share-assignments`;
const PROJECT_API = `${API_BASE}${API_PREFIX}/project`;
const PROJECT_TYPE_API = `${API_BASE}${API_PREFIX}/project-type`;
const SITE_API = `${API_BASE}${API_PREFIX}/project-sites`;
const FLAT_LAND_API = `${API_BASE}${API_PREFIX}/flat-land`;

async function handleRes(res: Response, action: string) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      json?.message || json?.error || `Failed to ${action} (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return json;
}

// ---------- Share Code generator ----------
function generateShareCode(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `SHR-${year}-${rand}`;
}

// ---------- Share Assignments ----------
async function fetchShareAssignments(projectId?: string): Promise<{
  data: ShareAssignment[];
  meta: any;
}> {
  let url = `${SHARE_ASSIGNMENT_API}?page=1&limit=100`;
  if (projectId) {
    url += `&projectId=${projectId}`;
  }
  console.log("GET share-assignments →", url);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    console.log("GET share-assignments status →", res.status);

    const json = await handleRes(res, "fetch share assignments");
    console.log("GET share-assignments response →", json);

    const rawList = json?.data?.data || [];
    console.log("RAW list from API (before mapping):", rawList.length);

    const mapped: ShareAssignment[] = rawList.map((item: any) => ({
      id: item.id ?? item.uuid,
      uuid: item.uuid,
      projectId: item.projectId || item.project?.uuid || "",
      projectName: item.project?.name || item.projectName || "",
      projectTypeId: item.projectTypeId || item.projectType?.uuid || "",
      projectTypeName: item.projectType?.name || item.projectTypeName || "",
      siteId: item.siteId || item.site?.uuid || "",
      siteName: item.site?.name || item.siteName || "",
      code: item.code || item.customerCode || item.project?.code || "",
      shareCode: item.shareCode || "",
      customerName: item.customerName || item.customer?.name || item.name || "",
      noOfShares: Number(item.noOfShares ?? item.noOfShare ?? 0),
      flatLand: item.flatLand || item.flatLandNo || item.landNo || "",
      note: item.note || "",
      email: item.email || item.customer?.email || "",
      mobile: item.mobile || item.customer?.mobile || "",
      nid: item.nid || item.customer?.nid || "",
      address: item.address || item.customer?.address || "",
      image: item.image || item.customer?.image || "",
      shareAmount: Number(item.shareAmount || 0),
      paidAmount: Number(item.paidAmount || 0),
      totalCost: Number(item.totalCost || 0),
      balance: Number(item.balance || 0),
      due: Number(item.due || 0),
      penaltyAmount: Number(item.penaltyAmount || 0),
      points: Number(item.points || 0),
      assignedAt: item.assignedAt || "",
      status: item.status || "active",
    }));

    console.log("After mapping count:", mapped.length);

    // ✅ Filter — shudhu inactive/deleted bad
    const filtered = mapped.filter((item) => {
      if (!item.status) return true;
      const status = item.status.toLowerCase();
      return status !== "inactive" && status !== "deleted";
    });

    console.log("After filter count:", filtered.length);

    return { data: filtered, meta: json?.data?.meta };
  } catch (err) {
    console.error("❌ fetchShareAssignments ERROR →", err);
    throw err;
  }
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
    const list = json?.data?.data || json?.data || [];
    return list.map((p: any) => ({
      uuid: p.uuid,
      name: p.name || p.code || "Unnamed",
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
    const list: any[] =
      json?.data?.data || (Array.isArray(json?.data) ? json.data : null) || [];
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

// ---------- SITES dropdown ----------
async function fetchProjectSites(): Promise<OptionItem[]> {
  try {
    const url = `${SITE_API}?page=1&limit=100`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return [];
    const list: any[] =
      json?.data?.data || (Array.isArray(json?.data) ? json.data : null) || [];
    return list.map((s: any) => ({
      uuid: s.uuid || s.id,
      name: s.name || s.siteName || s.title || s.code || "Unnamed",
      code: s.code,
    }));
  } catch (err) {
    console.error("fetchProjectSites error →", err);
    return [];
  }
}

// ---------- FLAT/LAND dropdown ----------
async function fetchFlatLands(): Promise<OptionItem[]> {
  try {
    const url = `${FLAT_LAND_API}?page=1&limit=100`;
    console.log("GET flat-lands →", url);

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Flat/Land fetch failed:", res.status, json);
      return [];
    }

    console.log("Flat/Land response →", json);

    const list: any[] =
      json?.data?.data ||
      (Array.isArray(json?.data) ? json.data : null) ||
      json?.flatLands ||
      json?.lands ||
      json?.rows ||
      [];

    return list.map((f: any) => ({
      uuid: f.uuid || f.id,
      name:
        f.name ||
        f.title ||
        f.flatNo ||
        f.landNo ||
        f.flatLandNo ||
        f.code ||
        "Unnamed",
      code: f.code,
    }));
  } catch (err) {
    console.error("fetchFlatLands error →", err);
    return [];
  }
}

async function createShareAssignment(payload: Record<string, any>) {
  console.log("POST payload →", payload);
  const res = await fetch(SHARE_ASSIGNMENT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await handleRes(res, "create share assignment");
  console.log("POST response →", json);
  return json;
}

async function updateShareAssignment(
  uuid: string,
  payload: Record<string, any>,
) {
  console.log("PATCH", uuid, "payload →", payload);
  const res = await fetch(`${SHARE_ASSIGNMENT_API}/${uuid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await handleRes(res, "update share assignment");
  console.log("PATCH response →", json);
  return json;
}

async function softDeleteShareAssignment(uuid: string) {
  const res = await fetch(`${SHARE_ASSIGNMENT_API}/${uuid}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  return handleRes(res, "delete share assignment");
}

// ---------- Form → API payload ----------
const toApiPayload = (data: {
  projectId: string;
  projectTypeId: string;
  siteId: string;
  shareCode: string;
  customerName: string;
  noOfShares: string | number;
  flatLand: string;
  note?: string;
  email?: string;
  mobile?: string;
  nid?: string;
  address?: string;
  image?: string;
  shareAmount: string | number;
  paidAmount: string | number;
  totalCost: string | number;
  balance: string | number;
  due: string | number;
  penaltyAmount: string | number;
  points: string | number;
  assignedAt: string;
  status: string;
}) => ({
  projectId: data.projectId,
  projectTypeId: data.projectTypeId,
  siteId: data.siteId,
  shareCode: data.shareCode,
  customerName: data.customerName,
  noOfShares: Number(data.noOfShares) || 0,
  flatLand: data.flatLand,
  note: data.note || "",
  email: data.email || "",
  mobile: data.mobile || "",
  nid: data.nid || "",
  address: data.address || "",
  image: data.image || "",
  shareAmount: Number(data.shareAmount) || 0,
  paidAmount: Number(data.paidAmount) || 0,
  totalCost: Number(data.totalCost) || 0,
  balance: Number(data.balance) || 0,
  due: Number(data.due) || 0,
  penaltyAmount: Number(data.penaltyAmount) || 0,
  points: Number(data.points) || 0,
  assignedAt: data.assignedAt,
  status: data.status || "active",
});

// ---------- Single Assign Share Modal ----------
function AssignShareFormModal({
  title,
  initialData,
  projects,
  projectTypes,
  projectSites,
  flatLands,
  onClose,
  onSubmit,
}: {
  title: string;
  initialData?: ShareAssignment;
  projects: OptionItem[];
  projectTypes: OptionItem[];
  projectSites: OptionItem[];
  flatLands: OptionItem[];
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    projectId: initialData?.projectId || "",
    projectTypeId: initialData?.projectTypeId || "",
    siteId: initialData?.siteId || "",
    shareCode: initialData?.shareCode || generateShareCode(),
    customerName: initialData?.customerName || "",
    noOfShares: initialData?.noOfShares?.toString() || "0",
    flatLand: initialData?.flatLand || "",
    note: initialData?.note || "",
    email: initialData?.email || "",
    mobile: initialData?.mobile || "",
    nid: initialData?.nid || "",
    address: initialData?.address || "",
    image: initialData?.image || "",
    shareAmount: initialData?.shareAmount?.toString() || "0",
    paidAmount: initialData?.paidAmount?.toString() || "0",
    totalCost: initialData?.totalCost?.toString() || "0",
    balance: initialData?.balance?.toString() || "0",
    due: initialData?.due?.toString() || "0",
    penaltyAmount: initialData?.penaltyAmount?.toString() || "0",
    points: initialData?.points?.toString() || "0",
    assignedAt:
      initialData?.assignedAt?.slice(0, 10) ||
      new Date().toISOString().slice(0, 10),
    status: initialData?.status || "active",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId || !formData.customerName) {
      setFormError("Please select Project and enter Customer Name");
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

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 max-h-[80vh] overflow-y-auto"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p.uuid} value={p.uuid}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Type */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Project Type <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.projectTypeId}
                onChange={(e) =>
                  setFormData({ ...formData, projectTypeId: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Select Project Type</option>
                {projectTypes.map((t) => (
                  <option key={t.uuid} value={t.uuid}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Site */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Site <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.siteId}
                onChange={(e) =>
                  setFormData({ ...formData, siteId: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Select Site</option>
                {projectSites.map((s) => (
                  <option key={s.uuid} value={s.uuid}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Flat/Land */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Flat/Land
              </label>
              <select
                value={formData.flatLand}
                onChange={(e) =>
                  setFormData({ ...formData, flatLand: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Select Flat/Land</option>
                {flatLands.length === 0 ? (
                  <option value="" disabled>
                    Loading flat/lands...
                  </option>
                ) : (
                  flatLands.map((f) => (
                    <option key={f.uuid} value={f.name}>
                      {f.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Share Code */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Share Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.shareCode}
                onChange={(e) =>
                  setFormData({ ...formData, shareCode: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Customer Name"
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({ ...formData, customerName: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* No Of Shares */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                No Of Shares <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={formData.noOfShares}
                onChange={(e) =>
                  setFormData({ ...formData, noOfShares: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mobile
              </label>
              <input
                type="text"
                placeholder="Mobile"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({ ...formData, mobile: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* NID */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                NID
              </label>
              <input
                type="text"
                placeholder="NID"
                value={formData.nid}
                onChange={(e) =>
                  setFormData({ ...formData, nid: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Address
              </label>
              <input
                type="text"
                placeholder="Address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Image */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Image URL
              </label>
              <input
                type="text"
                placeholder="Image URL"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Share Amount */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Share Amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.shareAmount}
                onChange={(e) =>
                  setFormData({ ...formData, shareAmount: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Paid Amount */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Paid Amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.paidAmount}
                onChange={(e) =>
                  setFormData({ ...formData, paidAmount: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Total Cost */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Total Cost
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.totalCost}
                onChange={(e) =>
                  setFormData({ ...formData, totalCost: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Balance */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Balance
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) =>
                  setFormData({ ...formData, balance: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Due */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Due
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.due}
                onChange={(e) =>
                  setFormData({ ...formData, due: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Penalty Amount */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Penalty Amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.penaltyAmount}
                onChange={(e) =>
                  setFormData({ ...formData, penaltyAmount: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Points */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Points
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.points}
                onChange={(e) =>
                  setFormData({ ...formData, points: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Assigned At */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Assigned At
              </label>
              <input
                type="date"
                value={formData.assignedAt}
                onChange={(e) =>
                  setFormData({ ...formData, assignedAt: e.target.value })
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
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Note */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Note
              </label>
              <input
                type="text"
                placeholder="Note"
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
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

// ---------- Bulk Assign Share Modal ----------
function BulkAssignShareModal({
  projects,
  projectTypes,
  projectSites,
  flatLands,
  onClose,
  onSubmit,
}: {
  projects: OptionItem[];
  projectTypes: OptionItem[];
  projectSites: OptionItem[];
  flatLands: OptionItem[];
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    projectId: "",
    projectTypeId: "",
    siteId: "",
    flatLand: "",
    customerName: "",
    noOfShares: "",
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId || !formData.customerName) {
      setFormError("Please select Project and enter Customer Name");
      return;
    }
    if (!formData.noOfShares || Number(formData.noOfShares) <= 0) {
      setFormError("Please enter a valid number of shares");
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
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Bulk Assign Share
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 gap-4">
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
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p.uuid} value={p.uuid}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Project Type
              </label>
              <select
                value={formData.projectTypeId}
                onChange={(e) =>
                  setFormData({ ...formData, projectTypeId: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select Project Type</option>
                {projectTypes.map((t) => (
                  <option key={t.uuid} value={t.uuid}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Site
              </label>
              <select
                value={formData.siteId}
                onChange={(e) =>
                  setFormData({ ...formData, siteId: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select Site</option>
                {projectSites.map((s) => (
                  <option key={s.uuid} value={s.uuid}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Flat/Land
              </label>
              <select
                value={formData.flatLand}
                onChange={(e) =>
                  setFormData({ ...formData, flatLand: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select Flat/Land</option>
                {flatLands.map((f) => (
                  <option key={f.uuid} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Customer Name"
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({ ...formData, customerName: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                No Of Shares <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={formData.noOfShares}
                onChange={(e) =>
                  setFormData({ ...formData, noOfShares: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Note
              </label>
              <input
                type="text"
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
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
              className="px-5 py-2 bg-slate-400 hover:bg-slate-500 text-white rounded-lg text-sm"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm flex items-center gap-1.5"
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
export default function AssignShareListPage() {
  const [assignments, setAssignments] = useState<ShareAssignment[]>([]);
  const [projects, setProjects] = useState<OptionItem[]>([]);
  const [projectTypes, setProjectTypes] = useState<OptionItem[]>([]);
  const [projectSites, setProjectSites] = useState<OptionItem[]>([]);
  const [flatLands, setFlatLands] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShareAssignment | null>(null);

  const loadData = async (projectId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const [assignmentRes, projectList, typeList, siteList, flatLandList] =
        await Promise.all([
          fetchShareAssignments(projectId || selectedProjectId || undefined),
          fetchProjects(),
          fetchProjectTypes(),
          fetchProjectSites(),
          fetchFlatLands(),
        ]);

      console.log(
        "✅ loadData success — assignments:",
        assignmentRes.data.length,
      );
      console.log("Loaded projects →", projectList.length);
      console.log("Loaded project types →", typeList.length);
      console.log("Loaded project sites →", siteList.length);
      console.log("Loaded flat lands →", flatLandList.length);

      setAssignments(assignmentRes.data);
      setProjects(projectList);
      setProjectTypes(typeList);
      setProjectSites(siteList);
      setFlatLands(flatLandList);
    } catch (err: any) {
      console.error("❌ loadData ERROR →", err);
      setError(err.message || "Failed to load share assignments");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Initial load — shudhu ekbar
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Project filter change hole — shudhu selectedProjectId thakle call
  useEffect(() => {
    if (!loading && selectedProjectId) {
      loadData(selectedProjectId);
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  const filteredAssignments = assignments.filter(
    (item) =>
      item.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.shareCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.noOfShares).includes(searchQuery),
  );

  const totalPages =
    Math.ceil(filteredAssignments.length / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentTableData = filteredAssignments.slice(
    startIndex,
    startIndex + entriesPerPage,
  );

  const handleDelete = async (item: ShareAssignment) => {
    if (!confirm(`Delete share assignment for "${item.customerName}"?`)) return;
    const uuidToDelete = item.uuid || String(item.id);
    if (!uuidToDelete) {
      alert("UUID is missing – cannot delete");
      return;
    }
    try {
      setActionLoading(true);
      await softDeleteShareAssignment(uuidToDelete);
      setAssignments((prev) =>
        prev.filter((a) => (a.uuid || String(a.id)) !== uuidToDelete),
      );
      if (currentTableData.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      }
    } catch (err: any) {
      console.error(err);
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
              <span>Home</span> / <span>Share Project</span> /{" "}
              <span className="text-indigo-600 font-medium">
                Assign Share List
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Assign Share List
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Assign Share
            </button>
            <button
              onClick={() => setIsBulkOpen(true)}
              className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Bulk Assign Share
            </button>
          </div>
        </div>

        {/* Filter + Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/70 p-3 rounded-xl border border-slate-200/60">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="whitespace-nowrap">Select Project</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[180px]"
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p.uuid} value={p.uuid}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-slate-300 rounded-md px-2 py-1 text-sm bg-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>
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
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading share assignments...
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => loadData()}
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
                    <th className="py-3 px-4">SL</th>
                    <th className="py-3 px-4">PROJECT</th>
                    <th className="py-3 px-4">SHARE CODE</th>
                    <th className="py-3 px-4">CUSTOMER NAME</th>
                    <th className="py-3 px-4">NO OF SHARES</th>
                    <th className="py-3 px-4">FLAT/LAND</th>
                    <th className="py-3 px-4 text-center">ACTION</th>
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
                        <td className="py-3 px-4 font-mono text-xs text-slate-700">
                          {item.shareCode || "—"}
                        </td>
                        <td className="py-3 px-4 font-semibold text-indigo-600">
                          {item.customerName || "—"}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {item.noOfShares}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {item.flatLand || "—"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setEditingItem(item)}
                              title="Edit"
                              className="p-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-md transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              title="Delete"
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

            <div className="flex flex-col sm:flex-row items-center justify-between p-3 border-t border-slate-200 bg-white gap-2 text-xs text-slate-500">
              <div>
                Showing {filteredAssignments.length > 0 ? startIndex + 1 : 0} to{" "}
                {Math.min(
                  startIndex + entriesPerPage,
                  filteredAssignments.length,
                )}{" "}
                of {filteredAssignments.length} entries
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
        <AssignShareFormModal
          title="Assign Share"
          projects={projects}
          projectTypes={projectTypes}
          projectSites={projectSites}
          flatLands={flatLands}
          onClose={() => setIsAddOpen(false)}
          onSubmit={async (data) => {
            await createShareAssignment(toApiPayload(data));
            setIsAddOpen(false);
            await loadData();
          }}
        />
      )}

      {editingItem && (
        <AssignShareFormModal
          title="Edit Assign Share"
          initialData={editingItem}
          projects={projects}
          projectTypes={projectTypes}
          projectSites={projectSites}
          flatLands={flatLands}
          onClose={() => setEditingItem(null)}
          onSubmit={async (data) => {
            if (!editingItem.uuid) throw new Error("UUID is missing");
            await updateShareAssignment(editingItem.uuid, toApiPayload(data));
            setEditingItem(null);
            await loadData();
          }}
        />
      )}

      {isBulkOpen && (
        <BulkAssignShareModal
          projects={projects}
          projectTypes={projectTypes}
          projectSites={projectSites}
          flatLands={flatLands}
          onClose={() => setIsBulkOpen(false)}
          onSubmit={async (data) => {
            await createShareAssignment(toApiPayload(data as any));
            setIsBulkOpen(false);
            await loadData();
          }}
        />
      )}
    </div>
  );
}
