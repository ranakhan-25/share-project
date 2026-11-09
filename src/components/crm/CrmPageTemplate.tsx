"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Search, Plus, Download, ChevronRight, X, Loader2, Edit2, Trash2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import api from "@/lib/api";
import { showAlert } from "@/lib/swal";

export interface CrmColumn {
  key: string;
  label: string;
}

export interface CreateFieldDef {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "textarea";
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number;
  options?: { label: string; value: string | number }[];
}

export interface CrmPageData {
  breadcrumb: string;
  title: string;
  description: string;
  addLabel?: string;
  columns: CrmColumn[];
  rows?: Record<string, string | number>[];
  apiEndpoint?: string;
  restoreEndpoint?: string;
  transformData?: (rawData: any[]) => Record<string, string | number>[];
  createFields?: CreateFieldDef[];
}

export function extractApiItems(resData: any): any[] {
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData?.data?.data)) return resData.data.data;
  if (Array.isArray(resData?.data)) return resData.data;
  if (Array.isArray(resData?.data?.rows)) return resData.data.rows;
  if (Array.isArray(resData?.rows)) return resData.rows;
  if (Array.isArray(resData?.items)) return resData.items;
  if (resData?.data && typeof resData.data === "object") return [resData.data];
  if (resData && typeof resData === "object") return [resData];
  return [];
}

const containerVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
} as const;

const rowVariants = {
  hidden: { opacity: 0, y: 4 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.2,
      ease: "easeOut" as const,
    },
  }),
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
} as const;

// Helper component to render clickable breadcrumb links dynamically
function Breadcrumbs({ breadcrumb }: { breadcrumb: string }) {
  const parts = useMemo(() => {
    const rawParts = breadcrumb.split("/").map((p) => p.trim()).filter(Boolean);
    let currentPath = "/dashboard";

    return rawParts.map((part, index) => {
      const slug = part.toLowerCase().replace(/\s+/g, "-");
      currentPath += `/${slug}`;
      const isLast = index === rawParts.length - 1;

      return {
        label: part,
        href: currentPath,
        isLast,
      };
    });
  }, [breadcrumb]);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11.5px] text-ink-faint">
      {parts.map((item, index) => (
        <span key={item.href} className="inline-flex items-center gap-1">
          {index > 0 && <ChevronRight size={10} className="text-ink-faint/60" />}
          {item.isLast ? (
            <span className="font-medium text-ink-muted">{item.label}</span>
          ) : (
            <Link
              href={item.href}
              className="transition-colors hover:text-ink hover:underline"
            >
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export function CrmPageTemplate({
  breadcrumb,
  title,
  description,
  addLabel,
  columns,
  rows = [],
  apiEndpoint,
  restoreEndpoint,
  transformData,
  createFields,
}: CrmPageData) {
  const [query, setQuery] = useState("");
  const [dataRows, setDataRows] = useState<Record<string, string | number>[]>(rows);
  const [loading, setLoading] = useState(Boolean(apiEndpoint));
  const [loadError, setLoadError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  // Keep references to avoid re-triggering loadData
  const transformRef = useRef(transformData);
  transformRef.current = transformData;
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const loadData = useCallback(async () => {
    if (!apiEndpoint) {
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(`crm_store_${title.toLowerCase().replace(/\s+/g, "_")}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setDataRows(parsed);
              return;
            }
          } catch {
            // ignore
          }
        }
      }
      if (rowsRef.current && rowsRef.current.length > 0) {
        setDataRows(rowsRef.current);
      }
      return;
    }

    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get(apiEndpoint);
      const items = extractApiItems(res.data);
      if (transformRef.current) {
        const transformed = transformRef.current(items);
        setDataRows(transformed);
      } else if (items.length > 0) {
        // Fallback generic mapping
        setDataRows(
          items.map((item: any) => ({
            id: item.uuid || item.id,
            name: item.name || item.title || item.client_name || item.flatLandNo || item.code || "N/A",
            code: item.code || item.lead_code || item.flatLandNo || "N/A",
            status: item.status || (item.is_active !== undefined ? (item.is_active ? "Active" : "Inactive") : "Active"),
            description: item.description || item.notes || "—",
            city: item.city || "—",
            zone: item.zone || "—",
            team: item.name || "—",
            department: item.department || "—",
            lead: item.leader_id || "Unassigned",
            members: item.team_members?.length || 0,
            channel: item.channel || "—",
            budget: item.budget ? `${Number(item.budget).toLocaleString()} BDT` : "—",
            start: item.start_date ? String(item.start_date).slice(0, 10) : "—",
            end: item.end_date ? String(item.end_date).slice(0, 10) : "—",
            order: item.order ?? 0,
            color: item.color || "#0000F2",
          }))
        );
      } else if (rowsRef.current && rowsRef.current.length > 0) {
        setDataRows([]);
      } else {
        setDataRows([]);
      }
    } catch (err: any) {
      console.error(`Error loading data for ${apiEndpoint}:`, err);
      const message = err.response?.data?.message || err.message || "Failed to load CRM records.";
      setLoadError(Array.isArray(message) ? message.join(", ") : message);
      setDataRows([]);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, title]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    if (!query.trim()) return dataRows;
    const q = query.toLowerCase();
    return dataRows.filter((row) =>
      columns.some((col) => String(row[col.key] ?? "").toLowerCase().includes(q)),
    );
  }, [query, dataRows, columns]);

  const activeFields: CreateFieldDef[] = useMemo(() => {
    if (createFields && createFields.length > 0) return createFields;
    if (!addLabel) return [];
    return columns
      .filter((col) => col.key !== "id" && col.key !== "uuid" && col.key !== "actions")
      .map((col) => ({
        key: col.key,
        label: col.label,
        type: "text" as const,
        placeholder: `Enter ${col.label.toLowerCase()}...`,
        required: false,
        defaultValue: "",
      }));
  }, [createFields, addLabel, columns]);

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const openCreateModal = () => {
    setEditingItem(null);
    const initial: Record<string, any> = {};
    activeFields.forEach((f) => {
      if (f.defaultValue !== undefined) initial[f.key] = f.defaultValue;
    });
    setFormData(initial);
    setIsModalOpen(true);
  };

  const openEditModal = (row: any) => {
    setEditingItem(row);
    const initial: Record<string, any> = {};
    activeFields.forEach((f) => {
      initial[f.key] = row[f.key] ?? row[f.key.toLowerCase()] ?? "";
    });
    setFormData(initial);
    setIsModalOpen(true);
  };

  const handleDelete = async (row: any) => {
    const targetId = row.id || row.uuid;

    const isConfirmed = await showAlert.confirm(
      "Confirm Delete",
      `Are you sure you want to delete this record?`
    );
    if (!isConfirmed) return;

    if (apiEndpoint && targetId) {
      try {
        await api.delete(`${apiEndpoint}/${targetId}`);
        showAlert.success("Deleted", "Record has been removed successfully.");
        await loadData();
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || "Failed to delete record.";
        showAlert.error("Delete Failed", Array.isArray(msg) ? msg.join(", ") : msg);
      }
    } else {
      setDataRows((prev) => {
        const updated = prev.filter((r) => (r.id || r.uuid) !== targetId);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(`crm_store_${title.toLowerCase().replace(/\s+/g, "_")}`, JSON.stringify(updated));
        }
        return updated;
      });
      showAlert.success("Deleted", "Record has been removed.");
    }
  };

  const handleRestore = async (row: any) => {
    const targetId = row.id || row.uuid;
    if (!restoreEndpoint || !targetId) return;
    try {
      await api.post(`${restoreEndpoint}/${targetId}/restore`);
      showAlert.success("Restored", "Lead is back in the active directory.");
      await loadData();
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Failed to restore lead.";
      showAlert.error("Restore Failed", Array.isArray(message) ? message.join(", ") : message);
    }
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      showAlert.warning("No Data", "There are no records to export.");
      return;
    }
    const headers = columns.map((c) => c.label).join(",");
    const csvRows = filtered.map((row) =>
      columns.map((c) => `"${String(row[c.key] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...csvRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "_")}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert.success("Export Complete", "CSV file downloaded successfully.");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeFields.length === 0) return;

    // 1. Strict Frontend Validation
    for (const f of activeFields) {
      const val = formData[f.key];
      if (f.required && (val === undefined || val === null || String(val).trim() === "")) {
        showAlert.warning("Required Field Missing", `Please provide a value for "${f.label}".`);
        return;
      }
      if (f.type === "number" && val !== undefined && val !== "") {
        const num = Number(val);
        if (isNaN(num) || num < 0) {
          showAlert.warning("Invalid Number", `"${f.label}" must be a valid positive number.`);
          return;
        }
      }
    }

    // 2. Dispatch API Call if apiEndpoint exists, or update local state
    setSubmitting(true);
    try {
      if (apiEndpoint) {
        if (editingItem && (editingItem.id || editingItem.uuid)) {
          const targetId = editingItem.id || editingItem.uuid;
          await api.put(`${apiEndpoint}/${targetId}`, formData);
          showAlert.success("Updated Successfully", `${title} has been updated.`);
        } else {
          await api.post(apiEndpoint, formData);
          showAlert.success("Created Successfully", `${title} created successfully!`);
        }
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({});
        await loadData();
      } else {
        // Local state management fallback with localStorage persistence
        setDataRows((prev) => {
          let updated: any[] = [];
          if (editingItem && (editingItem.id || editingItem.uuid)) {
            const targetId = editingItem.id || editingItem.uuid;
            updated = prev.map((r) => ((r.id || r.uuid) === targetId ? { ...r, ...formData } : r));
            showAlert.success("Updated Successfully", `${title} has been updated.`);
          } else {
            const newRow = {
              id: `local-${Date.now()}`,
              ...formData,
            };
            updated = [newRow, ...prev];
            showAlert.success("Created Successfully", `${title} created successfully!`);
          }
          if (typeof window !== "undefined") {
            window.localStorage.setItem(`crm_store_${title.toLowerCase().replace(/\s+/g, "_")}`, JSON.stringify(updated));
          }
          return updated;
        });
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({});
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to submit.";
      showAlert.error("Submission Failed", Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Section */}
      <motion.div initial="hidden" animate="visible" variants={containerVariants}>
        <Breadcrumbs breadcrumb={breadcrumb} />

        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-[19px] font-semibold text-ink">{title}</h1>
            <p className="text-[13px] text-ink-muted mt-0.5">{description}</p>
          </div>
          {addLabel && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openCreateModal}
              className="flex items-center gap-1.5 rounded-md bg-[#0000F2] px-3.5 py-2 text-[13px] font-medium text-white shadow-sm transition-opacity hover:opacity-90 cursor-pointer"
            >
              <Plus size={15} />
              {addLabel}
            </motion.button>
          )}
        </div>
      </motion.div>

      {loadError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <span>{loadError}</span>
          <button type="button" onClick={() => void loadData()} className="font-semibold underline">Retry</button>
        </div>
      )}

      {/* Main Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.995 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
        className="rounded-lg border border-border bg-surface shadow-xs overflow-hidden"
      >
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3.5">
          <div className="relative w-full max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-md border border-border bg-canvas pl-8 pr-3 py-1.5 text-[12.5px] text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-[#0000F2] focus:ring-2 focus:ring-[#0000F2]/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => loadData()}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[12.5px] font-medium text-ink-muted transition-colors hover:text-ink hover:bg-canvas cursor-pointer"
              title="Refresh live data"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[12.5px] font-medium text-ink-muted transition-colors hover:text-ink hover:bg-canvas cursor-pointer"
              title="Export as CSV"
            >
              <Download size={13} />
              Export
            </motion.button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-canvas">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="whitespace-nowrap px-4 py-2.5 text-[11.5px] font-semibold text-ink-muted"
                  >
                    {col.label}
                  </th>
                ))}
                {(activeFields.length > 0 || restoreEndpoint) && (
                  <th className="whitespace-nowrap px-4 py-2.5 text-[11.5px] font-semibold text-ink-muted text-right">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-border animate-pulse">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                      </td>
                    ))}
                    {activeFields.length > 0 && (
                      <td className="px-4 py-3 text-right">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-14 ml-auto" />
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <AnimatePresence mode="popLayout">
                  {filtered.length > 0 ? (
                    filtered.map((row, i) => (
                      <motion.tr
                        key={row.id ?? i}
                        custom={i}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={rowVariants}
                        className="border-b border-border last:border-0 transition-colors hover:bg-canvas/60"
                      >
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className="whitespace-nowrap px-4 py-2.5 text-[13px] text-ink"
                          >
                            {col.key === "status" ? (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                  String(row[col.key]).toLowerCase() === "active"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}
                              >
                                {row[col.key]}
                              </span>
                            ) : (
                              row[col.key]
                            )}
                          </td>
                        ))}
                        {(activeFields.length > 0 || restoreEndpoint) && (
                          <td className="whitespace-nowrap px-4 py-2.5 text-[13px] text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              {restoreEndpoint ? (
                                <button type="button" onClick={() => void handleRestore(row)} className="rounded px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50" title="Restore lead">Restore</button>
                              ) : (
                                <>
                                  <button type="button" onClick={() => openEditModal(row)} className="p-1 rounded text-ink-muted hover:text-[#0000F2] hover:bg-canvas transition-colors cursor-pointer" title="Edit Record"><Edit2 size={13} /></button>
                                  <button type="button" onClick={() => handleDelete(row)} className="p-1 rounded text-ink-muted hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer" title="Delete Record"><Trash2 size={13} /></button>
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    ))
                  ) : (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <td
                        colSpan={columns.length + (activeFields.length > 0 || restoreEndpoint ? 1 : 0)}
                        className="px-4 py-10 text-center text-[13px] text-ink-faint"
                      >
                        No live records found. Click &quot;{addLabel || "Add"}&quot; to create one.
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-[11.5px] text-ink-faint">
          <span>
            Showing {filtered.length} of {dataRows.length} live records
          </span>
        </div>
      </motion.div>

      {/* Dynamic Creation / Edit Modal with Strict Validation */}
      {isModalOpen && activeFields.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-[16px] font-semibold text-ink">
                {editingItem ? `Edit ${title}` : (addLabel || "Add Record")}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingItem(null);
                }}
                className="text-ink-faint hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {activeFields.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <label className="text-[12px] font-medium text-ink-muted block">
                      {f.label} {f.required && <span className="text-red-500">*</span>}
                    </label>
                    {f.type === "textarea" ? (
                      <textarea
                        value={formData[f.key] ?? ""}
                        onChange={(e) => handleInputChange(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        rows={3}
                        className="w-full rounded-md border border-border bg-canvas px-3 py-1.5 text-[12.5px] text-ink placeholder:text-ink-faint outline-none focus:border-[#0000F2] focus:ring-1 focus:ring-[#0000F2]"
                      />
                    ) : f.type === "select" ? (
                      <select
                        value={formData[f.key] ?? ""}
                        onChange={(e) => handleInputChange(f.key, e.target.value)}
                        className="w-full rounded-md border border-border bg-canvas px-3 py-1.5 text-[12.5px] text-ink outline-none focus:border-[#0000F2] focus:ring-1 focus:ring-[#0000F2]"
                      >
                        <option value="">Select {f.label}...</option>
                        {f.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={f.type || "text"}
                        value={formData[f.key] ?? ""}
                        onChange={(e) =>
                          handleInputChange(
                            f.key,
                            f.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value
                          )
                        }
                        placeholder={f.placeholder}
                        className="w-full rounded-md border border-border bg-canvas px-3 py-1.5 text-[12.5px] text-ink placeholder:text-ink-faint outline-none focus:border-[#0000F2] focus:ring-1 focus:ring-[#0000F2]"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="rounded-md border border-border px-3.5 py-1.5 text-[12.5px] font-medium text-ink-muted hover:bg-canvas cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-md bg-[#0000F2] px-4 py-1.5 text-[12.5px] font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-60 cursor-pointer"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  {editingItem ? "Update Record" : "Save Record"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}