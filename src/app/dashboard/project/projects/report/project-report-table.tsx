"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"
).replace(/\/+$/, "");

function extractRows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object",
    );
  }
  if (!value || typeof value !== "object") return [];

  const record = value as Record<string, unknown>;
  for (const key of ["data", "rows", "items", "results"]) {
    const nested = record[key];
    if (Array.isArray(nested)) return extractRows(nested);
    const rows = extractRows(nested);
    if (rows.length) return rows;
  }

  return Object.keys(record).some((key) =>
    ["success", "timestamp", "path", "statusCode", "meta"].includes(key),
  )
    ? []
    : [record];
}

function displayValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function ProjectReportTable({
  title,
  endpoint,
}: {
  title: string;
  endpoint: string;
}) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadReport() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `${API_BASE}/realbizpro/api/v1/project/reports/${endpoint}`,
          { cache: "no-store" },
        );
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          const message =
            payload && typeof payload === "object" && "message" in payload
              ? String((payload as { message: unknown }).message)
              : `Report request failed (${response.status})`;
          throw new Error(message);
        }
        if (active) setRows(extractRows(payload));
      } catch (cause) {
        if (active) {
          setError(
            cause instanceof Error ? cause.message : "Report could not be loaded.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadReport();
    return () => {
      active = false;
    };
  }, [endpoint]);

  const columns = useMemo(
    () => Array.from(new Set(rows.flatMap((row) => Object.keys(row)))),
    [rows],
  );

  return (
    <main className="min-h-screen bg-slate-50 p-5 text-slate-900">
      <div className="mx-auto max-w-[1700px] space-y-4">
        <header>
          <p className="text-xs font-medium text-slate-500">
            Home / Project / Reports
          </p>
          <h1 className="mt-2 text-2xl font-bold">{title}</h1>
        </header>

        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  {columns.length ? (
                    columns.map((column) => (
                      <th key={column} className="whitespace-nowrap px-3 py-2">
                        {column.replace(/([A-Z])/g, " $1")}
                      </th>
                    ))
                  ) : (
                    <th className="px-3 py-2">{title}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={Math.max(columns.length, 1)} className="py-8 text-center text-slate-500">
                      Loading report…
                    </td>
                  </tr>
                ) : rows.length ? (
                  rows.map((row, index) => (
                    <tr
                      key={String(row.uuid ?? row.id ?? index)}
                      className="border-t"
                    >
                      {columns.map((column) => (
                        <td key={column} className="whitespace-nowrap px-3 py-2">
                          {displayValue(row[column])}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={Math.max(columns.length, 1)} className="py-8 text-center text-slate-500">
                      No report data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t px-3 py-2 text-xs text-slate-500">
            {rows.length} record{rows.length === 1 ? "" : "s"}
          </div>
        </section>
      </div>
    </main>
  );
}
