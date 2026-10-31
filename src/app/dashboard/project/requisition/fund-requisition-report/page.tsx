"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronRight,
  Copy,
  FileCode,
  FileText,
  Home,
  Search,
} from "lucide-react";

interface FundReportItem {
  id: string;
  date: string;
  from: string;
  to: string;
  amount: number;
  approvedAmount: number;
  purpose: string;
  reference: string;
}

interface ApiPage<T> {
  rows: T[];
  totalPages?: number;
}

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"
).replace(/\/+$/, "");
const API_PREFIX = `${API_BASE}/realbizpro/api/v1`;

function getApiPage<T>(response: unknown): ApiPage<T> {
  let current = response;

  for (let depth = 0; depth < 6; depth += 1) {
    if (Array.isArray(current)) return { rows: current as T[] };
    if (!current || typeof current !== "object") break;

    const record = current as Record<string, unknown>;
    const rows = record.data ?? record.rows ?? record.items;
    if (Array.isArray(rows)) {
      const meta =
        record.meta && typeof record.meta === "object"
          ? (record.meta as Record<string, unknown>)
          : undefined;
      return {
        rows: rows as T[],
        totalPages:
          typeof meta?.totalPages === "number" ? meta.totalPages : undefined,
      };
    }
    current = record.data;
  }

  return { rows: [] };
}

async function requestJson(url: string): Promise<unknown> {
  const response = await fetch(url, { cache: "no-store" });
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message: unknown }).message)
        : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

function escapeCsv(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function FundRequisitionReport() {
  const [reportData, setReportData] = useState<FundReportItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadReport() {
      setLoading(true);
      setError("");

      try {
        const projectsResponse = await requestJson(
          `${API_PREFIX}/project?page=1&limit=100`,
        );
        const projectPage = getApiPage<Record<string, unknown>>(projectsResponse);
        const projectNames = new Map(
          projectPage.rows
            .filter((project) => typeof project.uuid === "string")
            .map((project) => [
              String(project.uuid),
              String(project.name ?? project.uuid),
            ]),
        );

        const allRows: Record<string, unknown>[] = [];
        let page = 1;
        let totalPages = 1;

        do {
          const query = new URLSearchParams({
            page: String(page),
            limit: "100",
          });
          if (fromDate) query.set("fromDate", fromDate);
          if (toDate) query.set("toDate", toDate);

          const response = await requestJson(
            `${API_PREFIX}/fund-requisition/reports?${query.toString()}`,
          );
          const result = getApiPage<Record<string, unknown>>(response);
          allRows.push(...result.rows);
          totalPages = result.totalPages ?? (result.rows.length === 100 ? page + 1 : page);
          page += 1;
        } while (page <= totalPages && page <= 100);

        if (!active) return;

        setReportData(
          allRows.map((row, index) => {
            const projectId = String(row.projectId ?? "");
            return {
              id: String(row.uuid ?? row.id ?? index + 1),
              date: String(row.date ?? "").slice(0, 10),
              from: String(row.fromUserId ?? "—"),
              to: projectNames.get(projectId) ?? (projectId || "—"),
              amount: Number(row.amount ?? 0),
              approvedAmount: Number(row.approvedAmount ?? 0),
              purpose: String(row.purpose ?? ""),
              reference: String(row.reference ?? ""),
            };
          }),
        );
      } catch (cause) {
        if (!active) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Fund requisition report load করা যায়নি।",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadReport();
    return () => {
      active = false;
    };
  }, [fromDate, toDate]);

  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return reportData;

    return reportData.filter((item) =>
      [item.from, item.to, item.purpose, item.reference, item.date]
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [reportData, searchQuery]);

  const totalAmount = filteredData.reduce((sum, item) => sum + item.amount, 0);
  const totalApprovedAmount = filteredData.reduce(
    (sum, item) => sum + item.approvedAmount,
    0,
  );

  function exportCsv() {
    const columns: (keyof FundReportItem)[] = [
      "date",
      "from",
      "to",
      "amount",
      "approvedAmount",
      "purpose",
      "reference",
    ];
    const rows = [
      columns.map(escapeCsv).join(","),
      ...filteredData.map((item) =>
        columns.map((column) => escapeCsv(item[column])).join(","),
      ),
    ];
    const blob = new Blob(["\uFEFF" + rows.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "fund-requisition-report.csv";
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  async function copyReport() {
    const rows = filteredData.map((item) =>
      [item.date, item.from, item.to, item.amount, item.approvedAmount, item.purpose, item.reference].join("\t"),
    );
    await navigator.clipboard.writeText(rows.join("\n"));
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 font-sans text-slate-900 sm:p-5">
      <div className="mx-auto w-full max-w-[1600px] space-y-4">
        <header className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Home className="h-3.5 w-3.5" /> Home
              <ChevronRight className="h-3.5 w-3.5" />
              Requisition
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="font-semibold text-emerald-600">
                Fund Requisition Report
              </span>
            </div>
            <h1 className="mt-2 flex items-center gap-2 text-sm font-bold">
              <FileText className="h-4 w-4 text-emerald-600" />
              Fund Requisition Report Summary
            </h1>
          </div>
        </header>

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 text-xs shadow-sm">
          <div>
            <label className="mb-1 block font-semibold text-slate-700">
              Select Date
            </label>
            <div className="flex max-w-md flex-wrap items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input
                aria-label="From date"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
              />
              <span>to</span>
              <input
                aria-label="To date"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void copyReport()}
                disabled={!filteredData.length}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-700 px-3 py-1.5 font-semibold text-white disabled:opacity-50"
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
              <button
                type="button"
                onClick={exportCsv}
                disabled={!filteredData.length}
                className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 font-semibold text-white disabled:opacity-50"
              >
                <FileCode className="h-3.5 w-3.5" /> CSV
              </button>
              <label className="flex items-center gap-2 font-medium text-slate-600">
                Show
                <select
                  value={entriesPerPage}
                  onChange={(event) =>
                    setEntriesPerPage(Number(event.target.value))
                  }
                  className="rounded-md border border-slate-300 px-2 py-1"
                >
                  {[10, 25, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                entries
              </label>
            </div>
            <label className="flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search report details..."
                className="w-64 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5"
              />
            </label>
          </div>
        </section>

        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-teal-700 font-semibold tracking-wide text-white">
                <tr>
                  {["SL", "DATE", "FROM", "TO", "AMOUNT", "APPROVED AMOUNT", "PURPOSE", "REFERENCE"].map((heading) => (
                    <th key={heading} className="px-4 py-3">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={8} className="py-12 text-center text-slate-500">Loading fund requisitions…</td></tr>
                ) : filteredData.length ? (
                  filteredData.slice(0, entriesPerPage).map((item, index) => (
                    <tr key={item.id} className="hover:bg-teal-50/40">
                      <td className="px-4 py-3 font-mono font-bold text-slate-500">{index + 1}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.date}</td>
                      <td className="px-4 py-3 font-semibold">{item.from}</td>
                      <td className="px-4 py-3">{item.to}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold">{item.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">{item.approvedAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-600">{item.purpose}</td>
                      <td className="px-4 py-3 font-mono">{item.reference}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={8} className="py-12 text-center text-slate-400">No report records found matching your filter.</td></tr>
                )}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-100 font-bold">
                <tr>
                  <td colSpan={4} className="px-4 py-3 uppercase">Total</td>
                  <td className="px-4 py-3 text-right font-mono">{totalAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-700">{totalApprovedAmount.toLocaleString()}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="border-t border-slate-200 p-3 text-xs text-slate-500">
            Showing {filteredData.length ? 1 : 0} to {Math.min(entriesPerPage, filteredData.length)} of {filteredData.length} entries
          </div>
        </section>
      </div>
    </div>
  );
}
