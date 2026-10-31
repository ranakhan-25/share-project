"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"
).replace(/\/+$/, "");
const API_ROOT = `${API_BASE}/realbizpro/api/v1`;
const SITES_API = `${API_ROOT}/project-sites`;
const PROJECTS_API = `${API_ROOT}/project`;

type ProjectOption = {
  uuid: string;
  name: string;
  code?: string;
};

type SiteItem = {
  id: number;
  uuid: string;
  code: string;
  projectId: string;
  project?: ProjectOption;
  name: string;
  description?: string | null;
  location?: string | null;
};

type SiteForm = {
  code: string;
  projectId: string;
  name: string;
  description: string;
  location: string;
};

const EMPTY_FORM: SiteForm = {
  code: "",
  projectId: "",
  name: "",
  description: "",
  location: "",
};

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const text = await response.text();
  let body: unknown;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    const payload =
      body && typeof body === "object"
        ? (body as Record<string, unknown>)
        : undefined;
    const message = payload?.message;
    throw new Error(
      Array.isArray(message)
        ? message.join(", ")
        : typeof message === "string"
          ? message
          : typeof body === "string"
            ? body
            : `Request failed (${response.status})`,
    );
  }

  return body as T;
}

function unwrap(value: unknown): unknown {
  if (value && typeof value === "object" && "data" in value) {
    return (value as { data: unknown }).data;
  }
  return value;
}

function rowsFrom<T>(value: unknown): T[] {
  const data = unwrap(value);
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "data" in data) {
    const rows = (data as { data: unknown }).data;
    return Array.isArray(rows) ? (rows as T[]) : [];
  }
  return [];
}

export default function SitePage() {
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesCount, setEntriesCount] = useState(10);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SiteItem | null>(null);
  const [form, setForm] = useState<SiteForm>(EMPTY_FORM);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [siteResponse, projectResponse] = await Promise.all([
        request<unknown>(`${SITES_API}?page=1&limit=100`),
        request<unknown>(`${PROJECTS_API}?page=1&limit=100`),
      ]);
      setSites(rowsFrom<SiteItem>(siteResponse));
      setProjects(rowsFrom<ProjectOption>(projectResponse));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load project sites.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredSites = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return sites;
    return sites.filter((site) =>
      [
        site.id,
        site.code,
        site.name,
        site.location,
        site.description,
        site.project?.name,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [sites, searchTerm]);

  const pageCount = Math.max(1, Math.ceil(filteredSites.length / entriesCount));
  const currentPage = Math.min(page, pageCount);
  const visibleSites = filteredSites.slice(
    (currentPage - 1) * entriesCount,
    currentPage * entriesCount,
  );

  function openCreate() {
    setEditingSite(null);
    setForm({
      ...EMPTY_FORM,
      code: `P${Math.floor(1000000 + Math.random() * 9000000)}`,
    });
    setError("");
    setIsModalOpen(true);
  }

  function openEdit(site: SiteItem) {
    setEditingSite(site);
    setForm({
      code: site.code ?? "",
      projectId: site.projectId ?? "",
      name: site.name ?? "",
      description: site.description ?? "",
      location: site.location ?? "",
    });
    setError("");
    setIsModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");

    const payload = {
      code: form.code.trim(),
      projectId: form.projectId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      location: form.location.trim() || null,
    };

    try {
      await request(
        editingSite
          ? `${SITES_API}/${encodeURIComponent(editingSite.uuid)}`
          : SITES_API,
        {
          method: editingSite ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      setIsModalOpen(false);
      setEditingSite(null);
      setForm(EMPTY_FORM);
      await loadData();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save the site.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setError("");
    try {
      await request(
        `${SITES_API}/${encodeURIComponent(deleteTarget.uuid)}`,
        { method: "DELETE" },
      );
      setDeleteTarget(null);
      await loadData();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not delete the site.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-gray-50 font-sans text-gray-800">
      <header className="flex flex-col items-start justify-between gap-3 border-b bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span className="shrink-0 font-medium text-purple-600">Home</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          <span className="flex shrink-0 items-center font-medium text-purple-600">
            Project <ChevronDown className="ml-0.5 h-3 w-3" />
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          <span className="shrink-0 font-semibold text-gray-700">Site</span>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex w-full items-center justify-center rounded-md bg-[#6B5BFF] px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-[#5848e0] sm:w-auto"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Create Site
        </button>
      </header>

      <main className="mx-auto w-full max-w-[98%] flex-1 px-3 py-4 sm:px-6 sm:py-8">
        {error && !isModalOpen && !deleteTarget && (
          <div className="mb-4 flex items-center justify-between rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
              ×
            </button>
          </div>
        )}

        <section className="mb-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Show</span>
            <select
              value={entriesCount}
              onChange={(event) => {
                setEntriesCount(Number(event.target.value));
                setPage(1);
              }}
              className="rounded border bg-white px-2 py-1"
            >
              {[10, 25, 50, 100].map((count) => (
                <option key={count} value={count}>{count}</option>
              ))}
            </select>
            <span>entries</span>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
            Search:
            <span className="relative w-full sm:w-64">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-md border bg-white py-1.5 pl-3 pr-8 text-sm"
                aria-label="Search sites"
              />
              <Search className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </span>
          </label>
        </section>

        <div className="mb-4 overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="bg-[#6B5BFF] text-xs font-semibold uppercase tracking-wider text-white">
                  <th className="px-4 py-3.5">ID</th>
                  <th className="px-4 py-3.5">Code</th>
                  <th className="px-4 py-3.5">Project</th>
                  <th className="px-4 py-3.5">Name</th>
                  <th className="px-4 py-3.5">Description</th>
                  <th className="px-4 py-3.5">Location</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center">Loading sites...</td></tr>
                ) : visibleSites.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No project sites found.</td></tr>
                ) : (
                  visibleSites.map((site) => (
                    <tr key={site.uuid} className="hover:bg-gray-50">
                      <td className="px-4 py-4 font-medium">{site.id}</td>
                      <td className="px-4 py-4">{site.code}</td>
                      <td className="px-4 py-4">{site.project?.name ?? "—"}</td>
                      <td className="px-4 py-4">{site.name}</td>
                      <td className="px-4 py-4">{site.description ?? "—"}</td>
                      <td className="px-4 py-4">{site.location ?? "—"}</td>
                      <td className="space-x-2 whitespace-nowrap px-4 py-4 text-right">
                        <button type="button" onClick={() => openEdit(site)} className="inline-flex rounded bg-[#6B5BFF] p-2 text-white" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => { setError(""); setDeleteTarget(site); }} className="inline-flex rounded bg-[#E5484D] p-2 text-white" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-4 text-sm text-gray-500 sm:flex-row">
            <span>
              Showing {filteredSites.length ? (currentPage - 1) * entriesCount + 1 : 0} to{" "}
              {Math.min(currentPage * entriesCount, filteredSites.length)} of {filteredSites.length} entries
            </span>
            <div className="flex gap-2">
              <button type="button" disabled={currentPage <= 1} onClick={() => setPage((value) => value - 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Previous</button>
              <span className="px-2 py-1.5">{currentPage} / {pageCount}</span>
              <button type="button" disabled={currentPage >= pageCount} onClick={() => setPage((value) => value + 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Next</button>
            </div>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">{editingSite ? "Site Edit" : "Site Add"}</h2>
              <button type="button" disabled={saving} onClick={() => setIsModalOpen(false)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="max-h-[75vh] space-y-4 overflow-y-auto bg-gray-100 px-6 py-5">
                {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-gray-700">
                    Code *
                    <input required maxLength={50} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className="mt-1 w-full rounded-md border bg-white px-3 py-2" />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Project *
                    <select required value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })} className="mt-1 w-full rounded-md border bg-white px-3 py-2">
                      <option value="">Select Project</option>
                      {projects.map((project) => <option key={project.uuid} value={project.uuid}>{project.name}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Name *
                    <input required maxLength={255} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-md border bg-white px-3 py-2" />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Location
                    <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="mt-1 w-full rounded-md border bg-white px-3 py-2" />
                  </label>
                </div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                  <textarea rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 w-full resize-none rounded-md border bg-white px-3 py-2" />
                </label>
              </div>
              <div className="flex justify-end gap-3 border-t px-6 py-4">
                <button type="button" disabled={saving} onClick={() => setIsModalOpen(false)} className="rounded bg-gray-400 px-5 py-2 text-sm text-white">Close</button>
                <button type="submit" disabled={saving} className="rounded bg-[#6B5BFF] px-6 py-2 text-sm text-white disabled:opacity-50">{saving ? "Saving..." : "Submit"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Delete Site</h2>
            <p className="mt-3 text-sm text-gray-600">Delete <strong>{deleteTarget.name}</strong>?</p>
            {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={deleting} onClick={() => { setDeleteTarget(null); setError(""); }} className="rounded border px-4 py-2 text-sm">Cancel</button>
              <button type="button" disabled={deleting} onClick={() => void handleDelete()} className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{deleting ? "Deleting..." : "Confirm Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
