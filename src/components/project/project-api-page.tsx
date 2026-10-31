"use client";

import { Download, FileSearch, Loader2, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLang } from "@/lib/i18n";
import type { ProjectPageConfig } from "./project-page-config";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002").replace(/\/+$/, "");

type Row = Record<string, unknown>;

function extractRows(value: unknown, depth = 0): Row[] {
  if (depth > 5) return [];
  if (Array.isArray(value)) {
    return value.filter((v): v is Row => !!v && typeof v === "object" && !Array.isArray(v));
  }
  if (!value || typeof value !== "object") return [];
  const rec = value as Row;
  for (const key of ["data", "rows", "items", "results"]) {
    const rows = extractRows(rec[key], depth + 1);
    if (rows.length) return rows;
  }
  return [];
}

const show = (v: unknown) => (v == null || v === "" ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v));
const humanize = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").replace(/^./, (c) => c.toUpperCase());

/** Generic table page that loads rows from the backend and renders every column it finds. */
export default function ProjectApiPage({ title, titleBn, endpoint, description }: ProjectPageConfig) {
  const { lang } = useLang();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("share-project:access-token") : null;
      const res = await fetch(`${API_BASE}/realbizpro/api/v1/${endpoint}`, {
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = payload && typeof payload === "object" && "message" in payload ? String((payload as { message: unknown }).message) : `Request failed (${res.status})`;
        throw new Error(msg);
      }
      setRows(extractRows(payload));
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : "Could not load data.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo(() => Array.from(new Set(rows.flatMap((r) => Object.keys(r)))).filter((c) => !/uuid|^id$/i.test(c)).slice(0, 14), [rows]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => Object.values(r).some((v) => show(v).toLowerCase().includes(q))) : rows;
  }, [rows, query]);

  const heading = lang === "bn" && titleBn ? titleBn : title;

  const exportCsv = () => {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const csv = [columns.map(humanize).map(esc).join(","), ...filtered.map((r) => columns.map((c) => esc(show(r[c]))).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${endpoint.replace(/\//g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 p-1">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{heading}</h1>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={lang === "bn" ? "খুঁজুন…" : "Search…"} className="w-56 rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" />
          </div>
          <button onClick={() => void load()} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50" aria-label="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={exportCsv} disabled={!filtered.length} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-40">
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {error}
          <span className="mt-1 block text-xs text-amber-700/80">
            {lang === "bn" ? "এন্ডপয়েন্ট:" : "Endpoint:"} <code>/realbizpro/api/v1/{endpoint}</code>
          </span>
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                {columns.length ? columns.map((c) => <th key={c} className="whitespace-nowrap px-4 py-3.5">{humanize(c)}</th>) : <th className="px-4 py-3.5">{heading}</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={Math.max(columns.length, 1)} className="py-16 text-center text-slate-400"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></td></tr>
              ) : filtered.length ? (
                filtered.map((r, i) => (
                  <tr key={String(r.uuid ?? r.id ?? i)} className="border-t border-slate-100 transition hover:bg-emerald-50/40">
                    {columns.map((c) => <td key={c} className="whitespace-nowrap px-4 py-3 text-slate-700">{show(r[c])}</td>)}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={Math.max(columns.length, 1)} className="py-16 text-center text-slate-400">
                    <FileSearch className="mx-auto mb-2 h-8 w-8" />
                    {lang === "bn" ? "কোনো ডেটা পাওয়া যায়নি" : "No data available"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          {filtered.length} {lang === "bn" ? "টি রেকর্ড" : filtered.length === 1 ? "record" : "records"}
        </div>
      </section>
    </div>
  );
}
