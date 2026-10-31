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
const API_URL = `${API_BASE}/realbizpro/api/v1/project-type`;

type ProjectTypeItem = {
  id: number;
  uuid: string;
  code: string;
  name: string;
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

function getRows(value: unknown): ProjectTypeItem[] {
  let data = value;
  if (data && typeof data === "object" && "data" in data) {
    data = (data as { data: unknown }).data;
  }
  if (data && typeof data === "object" && "data" in data) {
    data = (data as { data: unknown }).data;
  }
  return Array.isArray(data) ? (data as ProjectTypeItem[]) : [];
}

export default function ProjectTypePage() {
  const [projectTypes, setProjectTypes] = useState<ProjectTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectTypeItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectTypeItem | null>(null);
  const [codeValue, setCodeValue] = useState("");
  const [nameValue, setNameValue] = useState("");

  const loadProjectTypes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await request<unknown>(`${API_URL}?page=1&limit=100`);
      setProjectTypes(getRows(response));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not load project types.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjectTypes();
  }, [loadProjectTypes]);

  const filteredProjectTypes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return projectTypes;
    return projectTypes.filter((item) =>
      [item.id, item.code, item.name].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [projectTypes, searchTerm]);

  function handleOpenCreate() {
    setEditingItem(null);
    setCodeValue(`P${Math.floor(1000000 + Math.random() * 9000000)}`);
    setNameValue("");
    setError("");
    setIsModalOpen(true);
  }

  function handleOpenEdit(item: ProjectTypeItem) {
    setEditingItem(item);
    setCodeValue(item.code);
    setNameValue(item.name);
    setError("");
    setIsModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await request(
        editingItem
          ? `${API_URL}/${encodeURIComponent(editingItem.uuid)}`
          : API_URL,
        {
          method: editingItem ? "PATCH" : "POST",
          body: JSON.stringify({
            code: codeValue.trim(),
            name: nameValue.trim(),
          }),
        },
      );
      setIsModalOpen(false);
      setEditingItem(null);
      await loadProjectTypes();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save project type.",
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
        `${API_URL}/${encodeURIComponent(deleteTarget.uuid)}`,
        { method: "DELETE" },
      );
      setDeleteTarget(null);
      await loadProjectTypes();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not delete project type.",
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
          <span className="shrink-0 font-semibold text-gray-700">Project Type</span>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex w-full items-center justify-center rounded-md bg-[#6B5BFF] px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-[#5848e0] sm:w-auto"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Create Project Type
        </button>
      </header>

      <main className="mx-auto w-full max-w-[98%] flex-1 px-3 py-4 sm:px-6 sm:py-8">
        {error && !isModalOpen && !deleteTarget && (
          <div className="mb-4 flex items-center justify-between rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="Dismiss error">×</button>
          </div>
        )}

        <section className="mb-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <button type="button" className="flex items-center justify-between rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm sm:w-auto">
            Select Columns <ChevronDown className="ml-2 h-4 w-4 text-gray-500" />
          </button>
          <label className="flex items-center justify-end gap-2 text-sm font-medium text-gray-600">
            Search:
            <span className="relative w-full sm:w-64">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-md border bg-white py-1.5 pl-3 pr-8 text-sm"
                aria-label="Search project types"
              />
              <Search className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </span>
          </label>
        </section>

        <div className="mb-4 overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] border-collapse text-left">
              <thead>
                <tr className="bg-[#6B5BFF] text-xs font-semibold uppercase tracking-wider text-white">
                  <th className="px-4 py-3.5">ID</th>
                  <th className="px-4 py-3.5">Code</th>
                  <th className="px-4 py-3.5">Name</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center">Loading project types...</td></tr>
                ) : filteredProjectTypes.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No matching records found.</td></tr>
                ) : (
                  filteredProjectTypes.map((item) => (
                    <tr key={item.uuid} className="hover:bg-gray-50">
                      <td className="px-4 py-4 font-medium">{item.id}</td>
                      <td className="px-4 py-4 text-gray-600">{item.code}</td>
                      <td className="px-4 py-4">{item.name}</td>
                      <td className="space-x-2 whitespace-nowrap px-4 py-4 text-right">
                        <button type="button" onClick={() => handleOpenEdit(item)} className="inline-flex rounded bg-[#6B5BFF] p-2 text-white" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => { setError(""); setDeleteTarget(item); }} className="inline-flex rounded bg-[#E5484D] p-2 text-white" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingItem ? "Edit Project Type" : "Create Project Type"}</h2>
              <button type="button" disabled={saving} onClick={() => setIsModalOpen(false)} className="text-2xl text-gray-500" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium">
                Code
                <input value={codeValue} maxLength={50} onChange={(event) => setCodeValue(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>
              <label className="block text-sm font-medium">
                Name *
                <input required maxLength={255} value={nameValue} onChange={(event) => setNameValue(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>
              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" disabled={saving} onClick={() => setIsModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-[#6B5BFF] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : editingItem ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Delete Project Type</h2>
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
