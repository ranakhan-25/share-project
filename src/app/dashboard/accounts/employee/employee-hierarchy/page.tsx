/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Search, Loader2, Users, AlertCircle } from "lucide-react";

// ---------- Types ----------
export interface EmployeeHierarchyItem {
  uuid: string;
  name: string;
  designationName: string;
  status: string;
}

// ---------- API helpers ----------
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";

const PAGE_LIMIT = 100; // backend max limit

// Try both shapes: json.data.data OR json.data OR array
function extractList(json: any): any[] {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data?.data)) return json.data.data;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.employees)) return json.employees;
  if (Array.isArray(json?.items)) return json.items;
  return [];
}

// Map raw employee object → UI item
function mapEmployee(item: any): EmployeeHierarchyItem {
  return {
    uuid: item.uuid || item.id || String(Math.random()),
    name:
      item.name ||
      item.employeeName ||
      item.employeeCode ||
      "Unnamed",
    designationName:
      item.designation?.name ||
      item.designationName ||
      item.designation?.title ||
      "—",
    status: item.status || "active",
  };
}

// Fetch ALL pages from a given base URL (auto-paginate)
async function fetchAllPages(
  baseUrl: string,
  label: string,
): Promise<{ items: EmployeeHierarchyItem[]; total: number; ok: boolean }> {
  const all: EmployeeHierarchyItem[] = [];
  let page = 1;
  let totalPages = 1;
  let firstStatus = 0;

  while (page <= totalPages) {
    const sep = baseUrl.includes("?") ? "&" : "?";
    const url = `${baseUrl}${sep}page=${page}&limit=${PAGE_LIMIT}`;
    console.log(`🔵 [${label}] GET`, url);

    let res: Response;
    try {
      res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
    } catch (err) {
      console.error(`🔴 [${label}] network error on page ${page}:`, err);
      return { items: all, total: all.length, ok: false };
    }

    if (page === 1) firstStatus = res.status;

    if (!res.ok) {
      console.warn(`⚠️ [${label}] page ${page} failed with ${res.status}`);
      return { items: all, total: all.length, ok: false };
    }

    const json = await res.json().catch(() => ({}));
    if (page === 1) {
      console.log(`🔵 [${label}] raw response (page 1):`, json);
    }

    const list = extractList(json);
    console.log(`🔵 [${label}] page ${page} → ${list.length} rows`);

    if (list.length === 0 && page === 1) {
      return { items: [], total: 0, ok: true };
    }

    all.push(...list.map(mapEmployee));

    // Update totalPages from meta
    const meta = json?.data?.meta;
    totalPages = Number(meta?.totalPages) || 1;

    page++;
    if (page > 50) break; // safety
  }

  console.log(`✅ [${label}] fetched ${all.length} total items (status ${firstStatus})`);
  return { items: all, total: all.length, ok: true };
}

// ---------- Main fetcher (hierarchy → fallback to employee-list) ----------
async function fetchHierarchy(): Promise<{
  items: EmployeeHierarchyItem[];
  debug: string;
}> {
  // 1. Try the hierarchy endpoint first
  const hierarchyUrl = `${API_BASE}/realbizpro/api/v1/employee-hierarchy?status=active&withDeleted=false`;
  const hier = await fetchAllPages(hierarchyUrl, "hierarchy");

  if (hier.ok && hier.items.length > 0) {
    return {
      items: hier.items,
      debug: `Hierarchy endpoint OK — ${hier.items.length} employees`,
    };
  }

  // 2. Fallback: employee-list
  const listUrl = `${API_BASE}/realbizpro/api/v1/employee-list?status=active&sortBy=createdAt&sortOrder=DESC&withDeleted=false`;
  const list = await fetchAllPages(listUrl, "employee-list");

  if (list.items.length > 0) {
    return {
      items: list.items,
      debug: `Employee-list OK — ${list.items.length} employees`,
    };
  }

  return {
    items: [],
    debug: `Both endpoints returned no data. Check console (F12).`,
  };
}

// ---------- Main Page ----------
export default function EmployeeHierarchyPage() {
  const [items, setItems] = useState<EmployeeHierarchyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { items: data, debug: dbg } = await fetchHierarchy();
      console.log("✅ Final items:", data);
      console.log("✅ Debug:", dbg);
      setItems(data);
      setDebug(dbg);
    } catch (err: any) {
      console.error("❌ Load error:", err);
      setError(err?.message || "Failed to load employee hierarchy");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.designationName.toLowerCase().includes(q),
    );
  }, [items, searchQuery]);

  return (
    <div className="min-h-screen bg-white text-slate-900 p-4 sm:p-6">
      <div className="space-y-5">
        {/* Header */}
        <div className="pb-3 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900">
                Employee Hierarchy
              </h1>
              {debug && (
                <p className="text-xs text-slate-500 mt-1">Debug: {debug}</p>
              )}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search... type ? to get help."
                className="w-full pl-3 pr-9 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 placeholder:text-slate-400"
              />
              <Search className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading employee hierarchy...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </span>
            <button onClick={loadData} className="underline text-xs font-medium">
              Retry
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && (
          <>
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredItems.map((emp) => (
                  <div
                    key={emp.uuid}
                    className="bg-[#3d4d4d] text-white rounded-md px-3 py-2.5 hover:bg-[#465757] transition-colors cursor-default"
                    title={`${emp.name} — ${emp.designationName}`}
                  >
                    <div className="text-[12px] font-bold leading-tight truncate">
                      {emp.name}{" "}
                      <span className="font-normal opacity-90">(Active)</span>
                    </div>
                    <div className="text-[11px] leading-tight mt-0.5 truncate opacity-90">
                      {emp.designationName || "—"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Users className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm font-medium">No employees found</p>
                <p className="text-xs mt-1 text-center max-w-md">
                  {debug || "Check console (F12) for API response details"}
                </p>
                <button
                  onClick={loadData}
                  className="mt-4 px-4 py-1.5 text-xs bg-slate-700 text-white rounded-md hover:bg-slate-800"
                >
                  Retry
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}