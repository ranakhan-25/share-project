"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Edit3, Trash2, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
import PredictiveSearchSelect from "@/components/ui/PredictiveSearchSelect";
import PredictiveSearchInput from "@/components/ui/PredictiveSearchInput";
import { getStoredAccessToken, getStoredUser } from "@/lib/admin-auth/adminAuthStorage";

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
  const token = getStoredAccessToken();
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

  // Active logged in user
  const [storedUser, setStoredUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    setStoredUser(getStoredUser());
  }, []);

  const userEmail = (storedUser?.email || "").toLowerCase().trim();

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

      const fetchedRows = rowsFrom<ApiRow>(response);

      const matchesUser = (row: ApiRow, email: string): boolean => {
        if (!email) return false;
        const target = email.toLowerCase().trim();
        const candidateFields = [
          row.createdBy,
          row.created_by,
          row.clientEmail,
          row.client_email,
          row.email,
          row.userEmail,
          row.user_email,
          row.customerEmail,
          row.customer_email,
          row.salesBy,
          row.sales_by,
          row.projectManager,
          row.project_manager,
          row.assignedTo,
          row.assigned_to,
        ];
        for (const f of candidateFields) {
          if (f && String(f).toLowerCase().trim() === target) return true;
        }
        if (row.user && typeof row.user === "object" && (row.user as any).email) {
          if (String((row.user as any).email).toLowerCase().trim() === target) return true;
        }
        if (row.shareUser && typeof row.shareUser === "object" && (row.shareUser as any).email) {
          if (String((row.shareUser as any).email).toLowerCase().trim() === target) return true;
        }
        if (storedUser?.id && (String(row.createdBy) === String(storedUser.id) || String(row.userId) === String(storedUser.id))) {
          return true;
        }
        if (storedUser?.username && String(row.createdBy).toLowerCase().trim() === storedUser.username.toLowerCase().trim()) {
          return true;
        }
        return false;
      };

      // Strict user-level isolation: only records belonging to the logged-in user's email
      const filteredByUser = userEmail
        ? fetchedRows.filter((row) => matchesUser(row, userEmail))
        : [];

      setRows(filteredByUser);

      const sourceFields = fields.filter((field) => field.source);
      const nextOptions: Record<
        string,
        Array<{ value: string; label: string }>
      > = {};
      sourceFields.forEach((field, index) => {
        const source = field.source!;
        const rawOptions = rowsFrom<Record<string, unknown>>(
          optionResponses[index],
        );
        const filteredOptions = userEmail
          ? rawOptions.filter((item) => {
              const hasOwner = item.createdBy || item.clientEmail || item.email || item.userEmail;
              if (hasOwner) {
                return (
                  String(item.createdBy || "").toLowerCase().trim() === userEmail ||
                  String(item.clientEmail || "").toLowerCase().trim() === userEmail ||
                  String(item.email || "").toLowerCase().trim() === userEmail ||
                  String(item.userEmail || "").toLowerCase().trim() === userEmail
                );
              }
              return true;
            })
          : rawOptions;

        nextOptions[field.name] = filteredOptions
          .map((item) => ({
            value: String(item[source.valueKey] ?? ""),
            label: String(item[source.labelKey] ?? item[source.valueKey] ?? ""),
          }))
          .filter((option) => option.value.length > 0);
      });
      setOptions(nextOptions);
    } catch (cause) {
      setError(errorMessage(cause, `Could not load ${title.toLowerCase()}.`));
    } finally {
      setLoading(false);
    }
  }, [endpoint, fields, title, userEmail, storedUser]);

  useEffect(() => {
    void load();
  }, [load]);

  // Predictive search suggestions extracted from live dataset
  const predictiveSuggestions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      columns.forEach((c) => {
        const val = valueAt(r, c.key);
        if (typeof val === "string" && val.length > 1 && val.length < 50) {
          set.add(val);
        }
      });
    });
    return Array.from(set).slice(0, 30);
  }, [rows, columns]);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? rows.filter((row) =>
          columns.some((column) => {
            const value = valueAt(row, column.key);
            return (
              value !== null &&
              value !== undefined &&
              String(value).toLowerCase().includes(query)
            );
          }),
        )
      : rows;
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    return {
      data: filtered.slice(start, start + pageSize),
      total,
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
    setEditorOpen(true);
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
    setEditorOpen(true);
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(
      Object.fromEntries(
        fields.map((field) => [field.name, field.defaultValue ?? ""]),
      ),
    );
    setError("");
    setEditorOpen(false);
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

      // Auto-tag created record with user identity for tenant isolation
      if (storedUser?.email && !editing) {
        if (!payload.createdBy) payload.createdBy = storedUser.email;
        if (!payload.clientEmail) payload.clientEmail = storedUser.email;
        if (!payload.email) payload.email = storedUser.email;
        if (!payload.userEmail) payload.userEmail = storedUser.email;
        if (storedUser.id && !payload.userId) payload.userId = storedUser.id;
      }
      if (storedUser?.email && editing) {
        payload.updatedBy = storedUser.email;
      }

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
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/20 p-4 sm:p-6 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Header with Breadcrumb & Action */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Home</span>
              <span>/</span>
              <span>Project</span>
              <span>/</span>
              <span>API Data</span>
              <span>/</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                {title}
              </span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            {userEmail && (
              <p className="text-[11px] text-slate-500">
                Showing data isolated for: <strong className="text-emerald-700">{userEmail}</strong>
              </p>
            )}
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-100 transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Add {title}</span>
            </button>
          )}
        </header>

        {/* Filter / Search Card with Predictive Search */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="h-9 rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>entries</span>
          </label>

          <div className="w-full sm:w-80">
            <PredictiveSearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder={`Predictive search ${title.toLowerCase()}...`}
              suggestions={predictiveSuggestions}
            />
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 shadow-xs"
          >
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-emerald-600 text-[11px] font-semibold uppercase tracking-wider text-white">
                <tr>
                  <th className="px-4 py-3.5 text-center w-12">#</th>
                  {columns.map((column) => (
                    <th key={column.key} className="px-4 py-3.5">
                      {column.label}
                    </th>
                  ))}
                  {!readOnly && (
                    <th className="px-4 py-3.5 text-center w-28">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td
                      colSpan={columns.length + (readOnly ? 1 : 2)}
                      className="px-4 py-12 text-center text-slate-500"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                        <span className="text-xs font-medium">Loading {title.toLowerCase()}...</span>
                      </div>
                    </td>
                  </tr>
                ) : visibleRows.data.length ? (
                  visibleRows.data.map((row, index) => (
                    <tr
                      key={row.uuid}
                      className="hover:bg-emerald-50/40 transition-colors"
                    >
                      <td className="px-4 py-3 text-center font-medium text-slate-600">
                        {visibleRows.start + index + 1}
                      </td>
                      {columns.map((column) => (
                        <td key={column.key} className="px-4 py-3 text-slate-700 font-medium">
                          {String(valueAt(row, column.key) ?? "—")}
                        </td>
                      ))}
                      {!readOnly && (
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEdit(row)}
                              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void remove(row.uuid)}
                              disabled={deletingUuid === row.uuid}
                              className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingUuid === row.uuid ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length + (readOnly ? 1 : 2)}
                      className="px-4 py-12 text-center text-slate-500 text-xs"
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

          {/* Table Footer with Pagination */}
          <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs text-slate-600 font-medium">
            <span>
              Showing {visibleRows.total ? visibleRows.start + 1 : 0} to{" "}
              {Math.min(visibleRows.start + pageSize, visibleRows.total)} of{" "}
              {visibleRows.total} entries
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-600 shadow-xs transition-all hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>
              <span className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1 text-white font-semibold shadow-xs">
                {Math.min(page, visibleRows.pages)} / {visibleRows.pages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(visibleRows.pages, current + 1))
                }
                disabled={page >= visibleRows.pages || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-600 shadow-xs transition-all hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </footer>
        </div>
      </div>

      {/* Editor Modal with Predictive Search Dropdowns */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <form
            onSubmit={save}
            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden space-y-4 p-6"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editing ? `Edit ${title}` : `Add ${title}`}
              </h2>
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.name} className="space-y-1 block text-xs font-semibold text-slate-700">
                  <label htmlFor={`field-${field.name}`}>
                    {field.label}
                    {field.required ? " *" : ""}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      id={`field-${field.name}`}
                      required={field.required}
                      value={form[field.name] ?? ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [field.name]: event.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                  ) : field.type === "select" ? (
                    <PredictiveSearchSelect
                      id={`field-${field.name}`}
                      required={field.required}
                      value={form[field.name] ?? ""}
                      onChange={(val) =>
                        setForm((current) => ({
                          ...current,
                          [field.name]: val,
                        }))
                      }
                      placeholder={`Select ${field.label}...`}
                      options={(field.options ?? options[field.name] ?? []).map(
                        (opt) => ({
                          value: opt.value,
                          label: opt.label,
                        })
                      )}
                    />
                  ) : (
                    <input
                      id={`field-${field.name}`}
                      type={field.type ?? "text"}
                      required={field.required}
                      value={form[field.name] ?? ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [field.name]: event.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                  )}
                </div>
              ))}
            </div>

            {error && (
              <p role="alert" className="text-xs font-medium text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-100 transition-all hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{saving ? "Saving..." : "Save"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
