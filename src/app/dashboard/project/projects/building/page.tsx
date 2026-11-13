
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Home,
  ChevronRight,
  Plus,
  Search,
  Building2,
  Layers,
  Grid2X2,
  X,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getStoredAccessToken } from '@/lib/admin-auth/adminAuthStorage';

// ======================================================
// API CONFIGURATION
// ======================================================

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5002/realbizpro/api/v1';

// ======================================================
// TYPES
// ======================================================

type BuildingStatus = 'under_construction' | 'completed' | 'planned';

interface SiteOption {
  uuid: string;
  name: string;
  code?: string;
  location?: string | null;
}

interface Building {
  uuid: string;
  siteUuid: string;
  buildingCode: string;
  buildingName: string;
  floorsCount: number;
  unitsCount: number;
  status: BuildingStatus;
}

interface BuildingForm {
  buildingName: string;
  floorsCount: string;
  status: BuildingStatus;
}

interface ApiBuilding {
  uuid?: string;
  id?: string;
  buildingCode?: string;
  code?: string;
  buildingName?: string;
  name?: string;
  siteUuid?: string;
  floorsCount?: number | string;
  floors_count?: number | string;
  floorCount?: number | string;
  unitsCount?: number | string;
  units_count?: number | string;
  status?: BuildingStatus;
}

const emptyForm: BuildingForm = {
  buildingName: '',
  floorsCount: '',
  status: 'under_construction',
};

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100';

const statusOptions: {
  value: BuildingStatus;
  label: string;
  color: string;
  dot: string;
}[] = [
  {
    value: 'under_construction',
    label: 'Under Construction',
    color: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    dot: 'bg-amber-500',
  },
  {
    value: 'planned',
    label: 'Planned',
    color: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    dot: 'bg-blue-500',
  },
  {
    value: 'completed',
    label: 'Completed',
    color: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    dot: 'bg-emerald-500',
  },
];

// ======================================================
// API HELPERS
// ======================================================

async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? getStoredAccessToken() : null;
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `Request failed with status ${response.status}`
    );
  }

  if (
    response.status === 204 ||
    response.headers.get('content-length') === '0'
  ) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) return undefined as T;

  return JSON.parse(text) as T;
}

function unwrapArray<T>(response: unknown): T[] {
  let current: unknown = response;
  for (let i = 0; i < 4; i++) {
    if (Array.isArray(current)) return current as T[];
    if (!current || typeof current !== 'object') break;
    const obj = current as Record<string, unknown>;
    if (Array.isArray(obj.rows)) return obj.rows as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.results)) return obj.results as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (obj.data !== undefined) { current = obj.data; continue; }
    if (obj.result !== undefined) { current = obj.result; continue; }
    break;
  }
  return [];
}

function mapBuilding(item: ApiBuilding): Building {
  return {
    uuid: item.uuid ?? item.id ?? '',
    siteUuid: item.siteUuid ?? '',
    buildingCode: item.buildingCode ?? item.code ?? item.uuid ?? item.id ?? '',
    buildingName: item.buildingName ?? item.name ?? '',
    floorsCount: Number(
      item.floorsCount ?? item.floors_count ?? item.floorCount ?? 0
    ),
    unitsCount: Number(item.unitsCount ?? item.units_count ?? 0),
    status: item.status ?? 'planned',
  };
}

function getStatusLabel(status: BuildingStatus): string {
  return (
    statusOptions.find((o) => o.value === status)?.label ??
    status.replaceAll('_', ' ')
  );
}

// ======================================================
// MAIN PAGE
// ======================================================

export default function BuildingsListPage() {
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [selectedSiteUuid, setSelectedSiteUuid] = useState('');

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewBuilding, setViewBuilding] = useState<Building | null>(null);
  const [editBuilding, setEditBuilding] = useState<Building | null>(null);

  const [formData, setFormData] = useState<BuildingForm>(emptyForm);

  // ── Load sites on mount ─────────────────────────────

  useEffect(() => {
    setSitesLoading(true);
    apiRequest<unknown>(`${API_URL}/project-sites?page=1&limit=100`)
      .then((res) => {
        const raw = unwrapArray<SiteOption>(res);
        setSites(raw);
        if (raw.length > 0) setSelectedSiteUuid(raw[0].uuid);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load sites.');
      })
      .finally(() => setSitesLoading(false));
  }, []);

  // ── Load buildings for selected site ──────────────

  const loadBuildings = useCallback(
    async (showLoading = true) => {
      if (!selectedSiteUuid) {
        setBuildings([]);
        return;
      }

      if (showLoading) setLoading(true);
      setError('');

      try {
        // Try site-scoped endpoint first, fall back to all buildings
        const response = await apiRequest<unknown>(
          `${API_URL}/building?siteUuid=${encodeURIComponent(selectedSiteUuid)}&page=1&limit=200`
        );

        const records = unwrapArray<ApiBuilding>(response);
        const mapped = records
          .map(mapBuilding)
          .filter(
            (b) =>
              !b.siteUuid || b.siteUuid === selectedSiteUuid
          );

        setBuildings(mapped);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load buildings from the server.'
        );
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [selectedSiteUuid]
  );

  useEffect(() => {
    void loadBuildings();
  }, [loadBuildings]);

  // ── Modal helpers ─────────────────────────────────

  const closeAddModal = () => {
    setIsAddOpen(false);
    setFormData(emptyForm);
  };

  const closeModals = () => {
    setIsAddOpen(false);
    setViewBuilding(null);
    setEditBuilding(null);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModals();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // ── CREATE ────────────────────────────────────────

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = formData.buildingName.trim();
    const floors = Number(formData.floorsCount);

    if (!name) { setError('Building name is required.'); return; }
    if (!Number.isInteger(floors) || floors < 1) { setError('Please enter a valid floor count.'); return; }
    if (!selectedSiteUuid) { setError('Please select a site first.'); return; }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await apiRequest(`${API_URL}/building`, {
        method: 'POST',
        body: JSON.stringify({
          buildingName: name,
          siteUuid: selectedSiteUuid,
          floorsCount: floors,
          status: formData.status,
        }),
      });

      await loadBuildings(false);
      closeAddModal();
      setSuccess('Building created successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create building.');
    } finally {
      setSaving(false);
    }
  };

  // ── VIEW ONE ──────────────────────────────────────

  const handleView = async (building: Building) => {
    setError('');
    setSuccess('');
    try {
      const response = await apiRequest<unknown>(
        `${API_URL}/building/${encodeURIComponent(building.uuid)}`
      );
      const raw =
        response && typeof response === 'object' && 'data' in response
          ? (response as { data: ApiBuilding }).data
          : (response as ApiBuilding);
      setViewBuilding(mapBuilding(raw));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load building details.');
    }
  };

  // ── UPDATE ────────────────────────────────────────

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editBuilding) return;

    const name = editBuilding.buildingName.trim();
    const floors = Number(editBuilding.floorsCount);

    if (!name || !Number.isInteger(floors) || floors < 1) {
      setError('Enter a valid name and floor count.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await apiRequest(`${API_URL}/building/${encodeURIComponent(editBuilding.uuid)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          buildingName: name,
          siteUuid: editBuilding.siteUuid,
          floorsCount: floors,
          status: editBuilding.status,
        }),
      });

      await loadBuildings(false);
      setEditBuilding(null);
      setSuccess('Building updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update building.');
    } finally {
      setSaving(false);
    }
  };

  // ── DELETE ────────────────────────────────────────

  const handleDelete = async (building: Building) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      toast.custom(
        (t) => (
          <div
            role="alertdialog"
            aria-label={`Delete ${building.buildingName}`}
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
          >
            <p className="text-sm font-semibold text-slate-900">
              Delete &quot;{building.buildingName}&quot;?
            </p>
            <p className="mt-1 text-sm text-slate-600">
              This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        ),
        { duration: Infinity }
      );
    });
    if (!confirmed) return;

    setDeletingUuid(building.uuid);
    setError('');
    setSuccess('');

    try {
      await apiRequest(`${API_URL}/building/${encodeURIComponent(building.uuid)}`, {
        method: 'DELETE',
      });
      toast.success('Building deleted successfully.');
      await loadBuildings(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete building.');
    } finally {
      setDeletingUuid(null);
    }
  };

  // ── Filter & stats ────────────────────────────────

  const filteredBuildings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return buildings.filter((b) => {
      const matchSearch =
        !query ||
        b.buildingName.toLowerCase().includes(query) ||
        b.uuid.toLowerCase().includes(query) ||
        b.buildingCode.toLowerCase().includes(query);
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [buildings, searchQuery, statusFilter]);

  const stats = useMemo(
    () => ({
      total: buildings.length,
      floors: buildings.reduce((s, b) => s + b.floorsCount, 0),
      units: buildings.reduce((s, b) => s + b.unitsCount, 0),
      completed: buildings.filter((b) => b.status === 'completed').length,
    }),
    [buildings]
  );

  const selectedSite = sites.find((s) => s.uuid === selectedSiteUuid);

  // ── Status badge ──────────────────────────────────

  const StatusBadge = ({ status }: { status: BuildingStatus }) => {
    const config = statusOptions.find((o) => o.value === status) ?? statusOptions[1];
    return (
      <span
        className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset ${config.color}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  };

  // ── Render ────────────────────────────────────────

  return (
    <main className="min-h-screen bg-slate-50/80 px-4 py-6 text-slate-800 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1600px] space-y-7">

        {/* Header */}
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <Link
                href="/projects"
                className="inline-flex items-center gap-1.5 hover:text-blue-600"
              >
                <Home size={15} />
                Projects
              </Link>
              <ChevronRight size={15} />
              <Link href="/projects/sites" className="hover:text-blue-600">
                Sites
              </Link>
              <ChevronRight size={15} />
              <span className="font-medium text-slate-900">Buildings</span>
            </nav>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <Building2 size={25} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  Building Management
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Manage your site buildings, floors and units.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadBuildings()}
              disabled={loading || sitesLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>

            <button
              type="button"
              disabled={!selectedSiteUuid}
              onClick={() => {
                setError('');
                setSuccess('');
                setFormData(emptyForm);
                setIsAddOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={18} />
              Add Building
            </button>
          </div>
        </header>

        {/* Notifications */}
        {error && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            <div className="flex min-w-0 items-start gap-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="break-words">{error}</p>
            </div>
            <button type="button" onClick={() => setError('')} aria-label="Dismiss error">
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} />
              {success}
            </div>
            <button type="button" onClick={() => setSuccess('')} aria-label="Dismiss">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Site Selector */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <MapPin size={21} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Select Site
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Choose a site to view and manage its buildings
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {sitesLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <RefreshCw size={15} className="animate-spin" />
                  Loading sites...
                </div>
              ) : sites.length === 0 ? (
                <p className="text-sm text-slate-500">No sites found. Create a site first.</p>
              ) : (
                <select
                  aria-label="Select site"
                  value={selectedSiteUuid}
                  onChange={(e) => {
                    setSelectedSiteUuid(e.target.value);
                    setBuildings([]);
                    setSearchQuery('');
                    setStatusFilter('all');
                    setError('');
                    setSuccess('');
                  }}
                  className={`${inputClass} sm:w-[320px]`}
                >
                  {sites.map((site) => (
                    <option key={site.uuid} value={site.uuid}>
                      {site.name}{site.code ? ` (${site.code})` : ''}{site.location ? ` — ${site.location}` : ''}
                    </option>
                  ))}
                </select>
              )}

              {selectedSite && (
                <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                  <span className="rounded-lg bg-slate-100 px-3 py-2">
                    {stats.total} Buildings
                  </span>
                  <span className="rounded-lg bg-slate-100 px-3 py-2">
                    {stats.floors} Floors
                  </span>
                  <span className="rounded-lg bg-slate-100 px-3 py-2">
                    {stats.units} Units
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Buildings"
            value={stats.total}
            description="Buildings in selected site"
            icon={<Building2 size={21} />}
            iconClass="bg-blue-50 text-blue-600"
          />
          <StatCard
            title="Total Floors"
            value={stats.floors}
            description="Across all buildings"
            icon={<Layers size={21} />}
            iconClass="bg-violet-50 text-violet-600"
          />
          <StatCard
            title="Total Units"
            value={stats.units}
            description="Residential and commercial"
            icon={<Grid2X2 size={21} />}
            iconClass="bg-cyan-50 text-cyan-600"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            description="Completed buildings"
            icon={<CheckCircle2 size={21} />}
            iconClass="bg-emerald-50 text-emerald-600"
          />
        </section>

        {/* Building Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {selectedSite ? `${selectedSite.name} — Buildings` : 'All Buildings'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search and manage your buildings.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative sm:min-w-[270px]">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  aria-label="Search buildings"
                  placeholder="Search name or UUID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${inputClass} pl-10`}
                />
              </div>

              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`${inputClass} sm:w-[190px]`}
              >
                <option value="all">All statuses</option>
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">Building</th>
                  <th className="px-5 py-4">Building UUID</th>
                  <th className="px-5 py-4">Floors</th>
                  <th className="px-5 py-4">Units</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Floors Link</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sitesLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <RefreshCw size={25} className="mx-auto animate-spin text-blue-600" />
                      <p className="mt-3 text-sm text-slate-500">Loading sites...</p>
                    </td>
                  </tr>
                ) : !selectedSiteUuid ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <MapPin size={25} />
                      </div>
                      <p className="mt-4 font-semibold text-slate-800">No site selected</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Select a site from the dropdown above to view buildings.
                      </p>
                    </td>
                  </tr>
                ) : loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <RefreshCw size={25} className="mx-auto animate-spin text-blue-600" />
                      <p className="mt-3 text-sm text-slate-500">Loading buildings...</p>
                    </td>
                  </tr>
                ) : filteredBuildings.length > 0 ? (
                  filteredBuildings.map((building) => (
                    <tr
                      key={building.uuid}
                      className="transition-colors hover:bg-blue-50/30"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                            <Building2 size={19} />
                          </div>
                          <div className="max-w-[240px]">
                            <p className="break-words font-semibold text-slate-800">
                              {building.buildingName || 'Unnamed building'}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Code: {building.buildingCode || '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="break-all rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs text-slate-600">
                          {building.uuid}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-700">
                        {building.floorsCount}
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-700">
                        {building.unitsCount}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={building.status} />
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/projects/buildings/${building.uuid}/floors`}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                        >
                          Explore Floors
                          <ArrowUpRight size={14} />
                        </Link>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <ActionButton
                            label="View details"
                            onClick={() => void handleView(building)}
                            icon={<Eye size={17} />}
                            className="text-blue-600 hover:bg-blue-50"
                          />

                          <ActionButton
                            label="Edit building"
                            onClick={() => {
                              setError('');
                              setSuccess('');
                              setEditBuilding({ ...building });
                            }}
                            icon={<Pencil size={17} />}
                            className="text-slate-600 hover:bg-slate-100"
                          />

                          <ActionButton
                            label="Delete building"
                            disabled={deletingUuid === building.uuid}
                            onClick={() => void handleDelete(building)}
                            icon={
                              deletingUuid === building.uuid ? (
                                <RefreshCw size={17} className="animate-spin" />
                              ) : (
                                <Trash2 size={17} />
                              )
                            }
                            className="text-rose-600 hover:bg-rose-50"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <Search size={25} />
                      </div>
                      <p className="mt-4 font-semibold text-slate-800">
                        {buildings.length === 0
                          ? 'No buildings in this site'
                          : 'No matching buildings'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {buildings.length === 0
                          ? 'Click "Add Building" to create the first building for this site.'
                          : 'Try changing the search or status filter.'}
                      </p>
                      {(searchQuery || statusFilter !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('all');
                          }}
                          className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Clear filters
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/50 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing{' '}
              <span className="font-semibold text-slate-800">
                {filteredBuildings.length}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-800">
                {buildings.length}
              </span>{' '}
              buildings
            </p>
            <p className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              Connected to Building API
            </p>
          </div>
        </section>
      </div>

      {/* ==================================================
          ADD BUILDING MODAL
      ================================================== */}

      {isAddOpen && (
        <Modal title="Add New Building" onClose={closeAddModal}>
          <form onSubmit={handleCreate} className="space-y-5">
            {selectedSite && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                <span className="font-semibold">Site:</span> {selectedSite.name}
                {selectedSite.code && ` (${selectedSite.code})`}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Building Name <span className="text-rose-500">*</span>
              </label>
              <input
                autoFocus
                required
                maxLength={150}
                placeholder="e.g. Tower A - Residential West"
                value={formData.buildingName}
                onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Number of Floors <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="500"
                step="1"
                required
                placeholder="Enter total floors"
                value={formData.floorsCount}
                onChange={(e) => setFormData({ ...formData, floorsCount: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as BuildingStatus })
                }
                className={inputClass}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <ModalActions onCancel={closeAddModal} saving={saving} submitLabel="Create Building" />
          </form>
        </Modal>
      )}

      {/* ==================================================
          VIEW BUILDING MODAL
      ================================================== */}

      {viewBuilding && (
        <Modal
          title="Building Details"
          subtitle={viewBuilding.uuid}
          onClose={() => setViewBuilding(null)}
        >
          <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Building2 size={24} />
            </div>
            <h3 className="break-words text-lg font-semibold text-slate-900">
              {viewBuilding.buildingName}
            </h3>
            <div className="mt-3">
              <StatusBadge status={viewBuilding.status} />
            </div>
          </div>

          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
            <DetailRow label="Building UUID" value={viewBuilding.uuid} />
            <DetailRow label="Building Code" value={viewBuilding.buildingCode} />
            <DetailRow label="Site UUID" value={viewBuilding.siteUuid || 'N/A'} />
            <DetailRow label="Total Floors" value={`${viewBuilding.floorsCount} floors`} />
            <DetailRow label="Total Units" value={`${viewBuilding.unitsCount} units`} />
            <DetailRow label="Status" value={getStatusLabel(viewBuilding.status)} />
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => setViewBuilding(null)}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* ==================================================
          EDIT BUILDING MODAL
      ================================================== */}

      {editBuilding && (
        <Modal
          title="Edit Building"
          subtitle={editBuilding.uuid}
          onClose={() => setEditBuilding(null)}
        >
          <form onSubmit={handleUpdate} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Building Name
              </label>
              <input
                autoFocus
                required
                maxLength={150}
                value={editBuilding.buildingName}
                onChange={(e) => setEditBuilding({ ...editBuilding, buildingName: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Number of Floors
              </label>
              <input
                type="number"
                min="1"
                max="500"
                step="1"
                required
                value={editBuilding.floorsCount}
                onChange={(e) =>
                  setEditBuilding({
                    ...editBuilding,
                    floorsCount: Number(e.target.value),
                  })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                value={editBuilding.status}
                onChange={(e) =>
                  setEditBuilding({ ...editBuilding, status: e.target.value as BuildingStatus })
                }
                className={inputClass}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <ModalActions
              onCancel={() => setEditBuilding(null)}
              saving={saving}
              submitLabel="Update Building"
            />
          </form>
        </Modal>
      )}
    </main>
  );
}

// ======================================================
// REUSABLE COMPONENTS
// ======================================================

function StatCard({
  title,
  value,
  description,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            {value.toLocaleString()}
          </p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  icon,
  className,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  className: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {icon}
    </button>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="mt-1 break-all text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={19} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </section>
    </div>
  );
}

function ModalActions({
  onCancel,
  saving,
  submitLabel,
}: {
  onCancel: () => void;
  saving: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
      <button
        type="button"
        disabled={saving}
        onClick={onCancel}
        className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving && <RefreshCw size={15} className="animate-spin" />}
        {saving ? 'Please wait...' : submitLabel}
      </button>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="break-all text-sm font-medium text-slate-800 sm:text-right">
        {value}
      </span>
    </div>
  );
}
