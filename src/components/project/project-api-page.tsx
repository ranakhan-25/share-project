"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ApiRow = Record<string, unknown> & { uuid: string };

export interface ProjectApiField {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "select";
  required?: boolean;
  defaultValue?: string;
  storage?: "details";
  options?: Array<{ value: string; label: string }>;
  source?: {
    endpoint: string;
    labelKey: string;
    valueKey: string;
  };
}

export interface ProjectApiColumn {
  key: string;
  label: string;
}

interface ProjectApiPageProps {
  title: string;
  endpoint: string;
  writeEndpoint?: string;
  fields?: ProjectApiField[];
  columns: ProjectApiColumn[];
  fixedValues?: Record<string, unknown>;
  readOnly?: boolean;
}

const API_ROOT = (
  process.env.NEXT_PUBLIC_API_URL ||
  `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"}/realbizpro/api/v1`
).replace(/\/+$/, "");

const EMPTY_FIELDS: ProjectApiField[] = [];

function rowsFrom<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (!value || typeof value !== "object") return [];
  const data = value as Record<string, unknown>;
  for (const key of ["data", "items", "rows", "results"]) {
    if (key in data) {
      const rows = rowsFrom<T>(data[key]);
      if (rows.length || Array.isArray(data[key])) return rows;
    }
  }
  return [];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
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

function valueAt(row: ApiRow, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[key];
  }, row);
}

function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback;
}

export default function ProjectApiPage({
  title,
  endpoint,
  writeEndpoint = endpoint,
  fields = EMPTY_FIELDS,
  columns,
  fixedValues,
  readOnly = false,
}: ProjectApiPageProps) {
  const [rows, setRows] = useState<ApiRow[]>([]);
  const [options, setOptions] = useState<
    Record<string, Array<{ value: string; label: string }>>
  >({});
  const [editorOpen, setEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingUuid, setDeletingUuid] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<ApiRow | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [response, ...optionResponses] = await Promise.all([
        request<unknown>(`${endpoint}?page=1&limit=100`),
        ...fields
          .filter((field) => field.source)
          .map((field) =>
            request<unknown>(`${field.source!.endpoint}?page=1&limit=100`),
          ),
      ]);
      setRows(rowsFrom<ApiRow>(response));
      const sourceFields = fields.filter((field) => field.source);
      const nextOptions: Record<
        string,
        Array<{ value: string; label: string }>
      > = {};
      sourceFields.forEach((field, index) => {
        const source = field.source!;
        nextOptions[field.name] = rowsFrom<Record<string, unknown>>(
          optionResponses[index],
        )
          .filter((row) => row[source.valueKey] != null)
          .map((row) => ({
            value: String(row[source.valueKey]),
            label: String(row[source.labelKey] ?? row[source.valueKey]),
          }));
      });
      setOptions(nextOptions);
    } catch (cause) {
      setRows([]);
      setError(errorMessage(cause, `Could not load ${title.toLowerCase()}.`));
    } finally {
      setLoading(false);
    }
  }, [endpoint, fields, title]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matches = rows.filter((row) =>
      columns.some((column) =>
        String(valueAt(row, column.key) ?? "")
          .toLowerCase()
          .includes(term),
      ),
    );
    const pages = Math.max(1, Math.ceil(matches.length / pageSize));
    const start = (Math.min(page, pages) - 1) * pageSize;
    return {
      data: matches.slice(start, start + pageSize),
      total: matches.length,
      pages,
      start,
    };
  }, [columns, page, pageSize, rows, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(
      Object.fromEntries(
        fields.map((field) => [field.name, field.defaultValue ?? ""]),
      ),
    );
    setError("");
  };

  const openEdit = (row: ApiRow) => {
    setEditing(row);
    setForm(
      Object.fromEntries(
        fields.map((field) => [
          field.name,
          String(
            valueAt(
              row,
              field.storage === "details"
                ? `details.${field.name}`
                : field.name,
            ) ??
              field.defaultValue ??
              "",
          ),
        ]),
      ),
    );
    setError("");
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(
      Object.fromEntries(
        fields.map((field) => [field.name, field.defaultValue ?? ""]),
      ),
    );
    setError("");
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = { ...fixedValues };
      const details: Record<string, unknown> = {};
      for (const field of fields) {
        const value = form[field.name]?.trim() ?? "";
        if (!value) continue;
        const fieldValue = field.type === "number" ? Number(value) : value;
        if (field.storage === "details") details[field.name] = fieldValue;
        else payload[field.name] = fieldValue;
      }
      if (Object.keys(details).length) payload.details = details;
      await request(
        editing
          ? `${writeEndpoint}/${encodeURIComponent(editing.uuid)}`
          : writeEndpoint,
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      cancelEdit();
      await load();
    } catch (cause) {
      setError(errorMessage(cause, `Could not save ${title.toLowerCase()}.`));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (uuid: string) => {
    if (!window.confirm(`Delete this ${title.toLowerCase()} record?`)) return;
    setDeletingUuid(uuid);
    setError("");
    try {
      await request(`${writeEndpoint}/${encodeURIComponent(uuid)}`, {
        method: "DELETE",
      });
      await load();
    } catch (cause) {
      setError(errorMessage(cause, `Could not delete ${title.toLowerCase()}.`));
    } finally {
      setDeletingUuid("");
    }
  };

  return (
    <section className="min-h-screen bg-slate-50 p-4 text-slate-800 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs text-indigo-600">Project / API Data</p>
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={openCreate}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Add {title}
            </button>
          )}
        </header>

        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-sm">
            Show{" "}
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="mx-1 rounded border border-slate-300 px-2 py-1"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            entries
          </label>
          <label className="flex items-center gap-2 text-sm">
            Search
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="rounded border border-slate-300 px-3 py-2"
            />
          </label>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-indigo-600 text-xs uppercase text-white">
              <tr>
                <th className="px-4 py-3">#</th>
                {columns.map((column) => (
                  <th key={column.key} className="px-4 py-3">
                    {column.label}
                  </th>
                ))}
                {!readOnly && <th className="px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + (readOnly ? 1 : 2)}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Loading {title.toLowerCase()}...
                  </td>
                </tr>
              ) : visibleRows.data.length ? (
                visibleRows.data.map((row, index) => (
                  <tr key={row.uuid} className="hover:bg-indigo-50/40">
                    <td className="px-4 py-3">
                      {visibleRows.start + index + 1}
                    </td>
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3">
                        {String(valueAt(row, column.key) ?? "—")}
                      </td>
                    ))}
                    {!readOnly && (
                      <td className="whitespace-nowrap px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="mr-3 text-indigo-700 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(row.uuid)}
                          disabled={deletingUuid === row.uuid}
                          className="text-rose-700 hover:underline disabled:opacity-50"
                        >
                          {deletingUuid === row.uuid ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length + (readOnly ? 1 : 2)}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    {rows.length
                      ? "No records match your search."
                      : `No ${title.toLowerCase()} records found.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Showing {visibleRows.total ? visibleRows.start + 1 : 0} to{" "}
            {Math.min(visibleRows.start + pageSize, visibleRows.total)} of{" "}
            {visibleRows.total} entries
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || loading}
              className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="rounded bg-indigo-600 px-3 py-1 text-white">
              {Math.min(page, visibleRows.pages)} / {visibleRows.pages}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(visibleRows.pages, current + 1))
              }
              disabled={page >= visibleRows.pages || loading}
              className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </footer>
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={save}
            className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editing ? `Edit ${title}` : `Add ${title}`}
              </h2>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((field) => (
                <label key={field.name} className="space-y-1 text-sm">
                  <span>
                    {field.label}
                    {field.required ? " *" : ""}
                  </span>
                  {field.type === "textarea" ? (
                    <textarea
                      required={field.required}
                      value={form[field.name] ?? ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [field.name]: event.target.value,
                        }))
                      }
                      className="min-h-20 w-full rounded border border-slate-300 px-3 py-2"
                    />
                  ) : field.type === "select" ? (
                    <select
                      required={field.required}
                      value={form[field.name] ?? ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [field.name]: event.target.value,
                        }))
                      }
                      className="w-full rounded border border-slate-300 px-3 py-2"
                    >
                      <option value="">Select {field.label}</option>
                      {(field.options ?? options[field.name] ?? []).map(
                        (option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ),
                      )}
                    </select>
                  ) : (
                    <input
                      type={field.type ?? "text"}
                      required={field.required}
                      value={form[field.name] ?? ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [field.name]: event.target.value,
                        }))
                      }
                      className="w-full rounded border border-slate-300 px-3 py-2"
                    />
                  )}
                </label>
              ))}
            </div>
            {error && (
              <p role="alert" className="text-sm text-rose-700">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="rounded border border-slate-300 px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
