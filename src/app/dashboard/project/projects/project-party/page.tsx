"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Home, ChevronRight, Plus, Search, Users, Phone, Mail, PieChart, X,
  Building2, RefreshCw, Edit, Trash2, Eye, Loader2, FileText,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002/realbizpro/api/v1"
).replace(/\/+$/, "");

interface ProjectOption {
  uuid: string;
  name: string;
  code?: string;
}
const PARTY_TYPES = [
  "Investor",
  "Owner",
  "Developer",
  "Contractor",
  "Other",
] as const;

type PartyType = (typeof PARTY_TYPES)[number];

interface ProjectParty {
  id: string;
  uuid: string;
  projectUuid: string;
  party_type: PartyType;
  name: string;
  phone: string;
  email: string;
  share_pct: number;
  agreement_ref: string;
  createdAt: string;
}

interface PartyForm {
  partyCode: string;
  party_type: PartyType;
  name: string;
  phone: string;
  email: string;
  share_pct: string;
  agreement_ref: string;
}

const emptyForm = (): PartyForm => ({
  partyCode: "",
  party_type: "Owner",
  name: "",
  phone: "",
  email: "",
  share_pct: "0",
  agreement_ref: "",
});

/* ---------------- API HELPERS ---------------- */

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const text = response.status === 204 ? "" : await response.text();
  let result: any = null;

  if (text) {
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON response from server.");
    }
  }

  if (!response.ok || result?.success === false) {
    throw new Error(
      Array.isArray(result?.message)
        ? result.message.join(", ")
        : result?.message || `API error: ${response.status}`,
    );
  }

  return result;
}

function unwrapList(response: any): any[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  return [];
}

function unwrapOne(response: any): any {
  let value = response;
  for (let i = 0; i < 3; i++) {
    if (
      value?.data &&
      !Array.isArray(value.data) &&
      typeof value.data === "object"
    ) {
      value = value.data;
    } else {
      break;
    }
  }
  return value;
}

function normalizeParty(raw: any): ProjectParty {
  const rawType = String(raw.partyType ?? raw.party_type ?? "Owner");
  const partyType =
    PARTY_TYPES.find((type) => type.toLowerCase() === rawType.toLowerCase()) ??
    "Owner";

  return {
    id: String(raw.partyCode ?? raw.id ?? raw.uuid ?? ""),
    uuid: String(raw.uuid ?? raw.id ?? ""),
    projectUuid: String(raw.projectUuid ?? ""),
    party_type: partyType,
    name: String(raw.partyBusinessName ?? raw.name ?? ""),
    phone: String(raw.phoneNumber ?? raw.phone ?? ""),
    email: String(raw.email ?? ""),
    share_pct: Number(raw.equityShare ?? raw.share_pct ?? 0),
    agreement_ref: String(raw.agreementRef ?? raw.agreement_ref ?? ""),
    createdAt: String(raw.createdAt ?? ""),
  };
}

const partyApi = {
  list: async (projectUuid: string) => {
    const params = new URLSearchParams({
      page: "1",
      limit: "100",
      projectUuid,
    });

    const response = await apiRequest(
      `/project-parties?${params.toString()}`,
    );

    return unwrapList(response).map(normalizeParty);
  },

  get: async (uuid: string) => {
    const response = await apiRequest(`/project-parties/${encodeURIComponent(uuid)}`);
    return normalizeParty(unwrapOne(response));
  },

  create: (payload: object) =>
    apiRequest("/project-parties", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (uuid: string, payload: object) =>
    apiRequest(`/project-parties/${encodeURIComponent(uuid)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  remove: (uuid: string) =>
    apiRequest(`/project-parties/${encodeURIComponent(uuid)}`, {
      method: "DELETE",
    }),

  restore: (uuid: string) =>
    apiRequest(`/project-parties/${encodeURIComponent(uuid)}/restore`, {
      method: "PATCH",
    }),
};

/* ---------------- PAGE ---------------- */

function ProjectPartiesContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const urlProjectUuid = searchParams.get("projectUuid")?.trim() || "";

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProjectUuid, setSelectedProjectUuid] = useState(urlProjectUuid);

  const projectUuid = selectedProjectUuid;

  const [parties, setParties] = useState<ProjectParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [formData, setFormData] = useState<PartyForm>(emptyForm());

  const [viewParty, setViewParty] = useState<ProjectParty | null>(null);
  const [deleteParty, setDeleteParty] = useState<ProjectParty | null>(null);

  // Load projects for dropdown — sortBy/sortOrder বাদ
  useEffect(() => {
    let cancelled = false;
    setProjectsLoading(true);

    apiRequest("/project?page=1&limit=100")
      .then((res: any) => {
        if (cancelled) return;
        const mapped: ProjectOption[] = unwrapList(res)
          .map((p: any) => {
            const uuid = String(p.uuid ?? p.projectUuid ?? p.id ?? "");
            return {
              uuid,
              name: String(
                (p.projectName ?? p.name ?? p.title ?? uuid) || "Unnamed project",
              ),
              code: p.projectCode ?? p.code ?? undefined,
            };
          })
          .filter((project) => project.uuid);

        setProjects(mapped);

        setSelectedProjectUuid((prev) => {
          if (prev && mapped.some((p) => p.uuid === prev)) return prev;
          return mapped[0]?.uuid ?? "";
        });
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Failed to load projects",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setProjectsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Sync URL with selected project
  useEffect(() => {
    if (
      projectsLoading ||
      !selectedProjectUuid ||
      urlProjectUuid === selectedProjectUuid
    ) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("projectUuid", selectedProjectUuid);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    pathname,
    projectsLoading,
    router,
    searchParams,
    selectedProjectUuid,
    urlProjectUuid,
  ]);

  const loadParties = useCallback(async () => {
    if (!projectUuid.trim()) {
      setParties([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const data = await partyApi.list(projectUuid);
      setParties(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load parties",
      );
    } finally {
      setLoading(false);
    }
  }, [projectUuid]);

  useEffect(() => {
    void loadParties();
  }, [loadParties]);

  const filteredParties = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return parties.filter((party) => {
      const matchesSearch =
        party.id.toLowerCase().includes(query) ||
        party.name.toLowerCase().includes(query) ||
        party.email.toLowerCase().includes(query) ||
        party.phone.toLowerCase().includes(query);

      const matchesType =
        selectedType === "All" ||
        party.party_type.toLowerCase() === selectedType.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [parties, searchQuery, selectedType]);

  const totalSharePct = useMemo(
    () => parties.reduce((sum, party) => sum + party.share_pct, 0),
    [parties],
  );

  const openCreate = () => {
    if (projectsLoading) {
      toast.error("Please wait for the project list to finish loading.");
      return;
    }
    if (!projectUuid.trim()) {
      toast.error("Please select a project from the dropdown first.");
      return;
    }

    setEditingUuid(null);
    setFormData(emptyForm());
    setIsModalOpen(true);
  };

  const openEdit = (party: ProjectParty) => {
    setEditingUuid(party.uuid);
    setFormData({
      partyCode: party.id,
      party_type: party.party_type,
      name: party.name,
      phone: party.phone,
      email: party.email,
      share_pct: String(party.share_pct),
      agreement_ref: party.agreement_ref,
    });
    setIsModalOpen(true);
  };

  // ✅ PATCH-এ projectUuid এবং partyCode বাদ দেওয়া হয়েছে
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Party/business name is required.");
      return;
    }

    if (!formData.phone.trim()) {
      toast.error("Phone number is required.");
      return;
    }

    const share = Number(formData.share_pct);
    if (!Number.isFinite(share) || share < 0 || share > 100) {
      toast.error("Equity share must be between 0 and 100.");
      return;
    }

    setSaving(true);
    const loadingToast = toast.loading(
      editingUuid ? "Updating party..." : "Creating party...",
    );

    try {
      if (editingUuid) {
        // ✅ Update এর সময় শুধু editable ফিল্ডগুলো পাঠান
        const updatePayload = {
          partyType: formData.party_type,
          partyBusinessName: formData.name.trim(),
          phoneNumber: formData.phone.trim(),
          email: formData.email.trim(),
          equityShare: share,
          agreementRef: formData.agreement_ref.trim(),
        };
        await partyApi.update(editingUuid, updatePayload);
      } else {
        // ✅ Create এর সময় সব ফিল্ড পাঠান
        if (!projectUuid.trim()) {
          toast.error("Please select a project from the dropdown first.");
          setSaving(false);
          toast.dismiss(loadingToast);
          return;
        }
        const createPayload = {
          projectUuid,
          ...(formData.partyCode.trim() ? { partyCode: formData.partyCode.trim() } : {}),
          partyType: formData.party_type,
          partyBusinessName: formData.name.trim(),
          phoneNumber: formData.phone.trim(),
          email: formData.email.trim(),
          equityShare: share,
          ...(formData.agreement_ref.trim()
            ? { agreementRef: formData.agreement_ref.trim() }
            : {}),
        };
        await partyApi.create(createPayload);
      }

      toast.success(
        editingUuid ? "Party updated successfully!" : "Party created successfully!",
        { id: loadingToast },
      );

      setIsModalOpen(false);
      setEditingUuid(null);
      setFormData(emptyForm());

      await loadParties();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save party",
        { id: loadingToast },
      );
    } finally {
      setSaving(false);
    }
  };

  const handleView = async (party: ProjectParty) => {
    setViewParty(party);
    try {
      const latest = await partyApi.get(party.uuid);
      setViewParty(latest);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load party",
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteParty) return;

    const target = deleteParty;
    setSaving(true);
    const loadingToast = toast.loading("Deleting party...");

    try {
      await partyApi.remove(target.uuid);
      setParties((current) => current.filter((party) => party.uuid !== target.uuid));
      setDeleteParty(null);
      toast.success("Party deleted successfully!", {
        id: loadingToast,
        duration: 6000,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete party",
        { id: loadingToast },
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 font-sans text-slate-800 sm:p-6 lg:p-8">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="mb-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link href="/projects" className="flex items-center transition-colors hover:text-blue-600">
              <Home className="mr-1 h-4 w-4" /> Projects
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="max-w-64 truncate">
              {projectUuid || "Project UUID missing"}
            </span>
            <ChevronRight className="h-4 w-4" />
            <span className="font-semibold text-slate-900">Parties</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Project Parties &amp; Stakeholders
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage owners, investors, contractors and project stakeholders.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadParties()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreate}
            disabled={projectsLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add New Party
          </button>
        </div>
      </div>

      {/* Project Selector */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Select Project</p>
              <p className="mt-0.5 text-xs text-slate-500">Choose a project to manage its parties</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {projectsLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading projects...
              </div>
            ) : projects.length === 0 ? (
              <p className="text-sm text-slate-500">No projects found.</p>
            ) : (
              <select
                aria-label="Select project"
                value={selectedProjectUuid}
                onChange={(e) => {
                  setSelectedProjectUuid(e.target.value);
                  setParties([]);
                  setSearchQuery("");
                  setSelectedType("All");
                }}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:w-[340px]"
              >
                <option value="">— Select a project —</option>
                {projects.map((p) => (
                  <option key={p.uuid} value={p.uuid}>
                    {p.name}{p.code ? ` (${p.code})` : ""}
                  </option>
                ))}
              </select>
            )}

            {selectedProjectUuid && (
              <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
                {parties.length} Parties
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi
          label="Total Project Parties"
          value={loading ? "..." : String(parties.length)}
          icon={<Users className="h-5 w-5" />}
          tone="bg-blue-50 text-blue-600"
        />
        <Kpi
          label="Equity Share Allocated"
          value={loading ? "..." : `${totalSharePct.toFixed(2)}%`}
          icon={<PieChart className="h-5 w-5" />}
          tone="bg-emerald-50 text-emerald-600"
        />
        <Kpi
          label="Owners & Investors"
          value={loading ? "..." : String(parties.filter((p) => p.party_type === "Owner" || p.party_type === "Investor").length)}
          icon={<Building2 className="h-5 w-5" />}
          tone="bg-indigo-50 text-indigo-600"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/50 p-5 sm:flex-row">
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <label className="text-xs font-semibold uppercase text-slate-500">Party Type:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm capitalize shadow-sm outline-none focus:border-blue-600"
            >
              <option value="All">All Types</option>
              {PARTY_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-700">
                <th className="px-4 py-3.5">Party Code</th>
                <th className="px-4 py-3.5">Party Type</th>
                <th className="px-4 py-3.5">Business Name</th>
                <th className="px-4 py-3.5">Phone</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Equity Share</th>
                <th className="px-4 py-3.5">Agreement Ref</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" />
                    <p className="mt-2 text-slate-500">Loading parties...</p>
                  </td>
                </tr>
              ) : filteredParties.length ? (
                filteredParties.map((party) => (
                  <tr key={party.uuid} className="transition-colors hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs font-semibold text-blue-600">
                      {party.id || "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold">
                        {party.party_type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{party.name || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {party.phone || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        {party.email || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {party.share_pct.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-blue-600">
                      {party.agreement_ref || "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button type="button" title="View" onClick={() => void handleView(party)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button type="button" title="Edit" onClick={() => openEdit(party)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button type="button" title="Delete" onClick={() => setDeleteParty(party)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <FileText className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-slate-500">No party records found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col justify-between gap-2 border-t border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 sm:flex-row">
          <span>Showing {filteredParties.length} of {parties.length} parties</span>
          <span>Feature 03.03 · Parties Engine</span>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingUuid ? "Edit Party" : "Create Party"}
                </h2>
                <p className="text-xs text-slate-500">
                  {editingUuid ? "Update stakeholder details" : "Add a project stakeholder"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Party Code</label>
                <input
                  value={formData.partyCode}
                  onChange={(e) => setFormData({ ...formData, partyCode: e.target.value })}
                  placeholder="PTY-003 (optional)"
                  disabled={!!editingUuid}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Party Type *</label>
                <select
                  required
                  value={formData.party_type}
                  onChange={(e) => setFormData({ ...formData, party_type: e.target.value as PartyType })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-600"
                >
                  {PARTY_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Business Name *</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ABC Developers Ltd."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Phone *</label>
                  <input
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+8801712345678"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="investor@example.com"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Equity Share (0–100%) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.share_pct}
                  onChange={(e) => setFormData({ ...formData, share_pct: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Agreement Reference</label>
                <input
                  value={formData.agreement_ref}
                  onChange={(e) => setFormData({ ...formData, agreement_ref: e.target.value })}
                  placeholder="AGR-2026-003"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingUuid ? "Update Party" : "Save Party"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="font-bold text-slate-900">Party Details</h2>
              <button type="button" onClick={() => setViewParty(null)} className="rounded-full p-2 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 p-5 text-sm">
              {[
                ["Party Code", viewParty.id],
                ["Business Name", viewParty.name],
                ["Party Type", viewParty.party_type],
                ["Phone", viewParty.phone],
                ["Email", viewParty.email],
                ["Equity Share", `${viewParty.share_pct.toFixed(2)}%`],
                ["Agreement Ref", viewParty.agreement_ref || "—"],
                ["Project UUID", viewParty.projectUuid],
                ["Created At", viewParty.createdAt || "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1 rounded-xl bg-slate-50 p-3 sm:flex-row sm:justify-between">
                  <span className="text-xs font-semibold uppercase text-slate-500">{label}</span>
                  <span className="break-all font-medium text-slate-800 sm:text-right">{value || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Delete this party?</h2>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to delete <b className="text-slate-800">{deleteParty.name}</b>?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => setDeleteParty(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleDelete()}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {saving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: string; }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      </div>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
        {icon}
      </div>
    </div>
  );
}

export default function ProjectPartiesPage() {
  return <ProjectPartiesContent />;
}