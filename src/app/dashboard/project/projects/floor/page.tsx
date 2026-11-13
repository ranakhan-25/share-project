'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Home, ChevronRight, Plus, Search, Layers, Grid, X, Eye, Edit, Trash2,
  Building2, RefreshCw, Undo2, AlertCircle, CheckCircle2, Loader2, ArrowUpDown,
} from 'lucide-react';
import { getStoredAccessToken } from '@/lib/admin-auth/adminAuthStorage';

/* ----------------------------------------------------------------------------
 * API LAYER
 * ------------------------------------------------------------------------- */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/realbizpro/api/v1';

interface ProjectFloor {
  uuid: string;
  buildingUuid: string;
  floorCode: string;
  name: string;
  number: number;
  units_count: number;
}

interface BuildingItem {
  uuid: string;
  buildingName: string;
  buildingCode: string;
}

async function request<T = any>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? getStoredAccessToken() : null;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      msg = Array.isArray(j?.message) ? j.message.join(', ') : j?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

const unwrapList = (r: any): any[] => {
  if (Array.isArray(r)) return r;
  if (Array.isArray(r?.data)) return r.data;
  if (Array.isArray(r?.data?.data)) return r.data.data;
  if (Array.isArray(r?.data?.items)) return r.data.items;
  if (Array.isArray(r?.items)) return r.items;
  return [];
};

const unwrapOne = (r: any) => (r?.data && !Array.isArray(r.data) ? r.data : r);

const normalize = (f: any): ProjectFloor => ({
  uuid: f.uuid ?? f.id,
  buildingUuid: f.buildingUuid ?? f.building_uuid ?? '',
  floorCode: f.floorCode ?? f.floor_code ?? '',
  name: f.floorName ?? f.name ?? '',
  number: Number(f.floorNumber ?? f.number ?? 0),
  units_count: Number(f.units_count ?? f.unitsCount ?? 0),
});

const floorApi = {
  list: async (buildingUuid?: string) => {
    const q = buildingUuid ? `?buildingUuid=${encodeURIComponent(buildingUuid)}` : '';
    return unwrapList(await request(`/floor${q}`)).map(normalize);
  },
  create: async (body: any) => normalize(unwrapOne(await request('/floor', { method: 'POST', body: JSON.stringify(body) }))),
  update: async (uuid: string, body: any) => request(`/floor/${uuid}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (uuid: string) => request(`/floor/${uuid}`, { method: 'DELETE' }),
  restore: (uuid: string) => request(`/floor/${uuid}/restore`, { method: 'PATCH' }),
};

// ✅ Building API: siteUuid ছাড়াই কল করলে সব বিল্ডিং আসবে
const buildingApi = {
  list: async () => {
    const res = await request(`/building?limit=100`);
    return unwrapList(res).map((b: any) => ({
      uuid: b.uuid,
      buildingName: b.buildingName ?? b.name ?? 'Unknown',
      buildingCode: b.buildingCode ?? 'N/A',
    })) as BuildingItem[];
  },
};

/* ----------------------------------------------------------------------------
 * UI Helpers
 * ------------------------------------------------------------------------- */
const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10';
const labelCls = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500';

function ModalShell({
  title, subtitle, onClose, children, maxW = 'max-w-lg', z = 'z-50',
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxW?: string;
  z?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={`fixed inset-0 ${z} flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm`} onMouseDown={onClose}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className={`flex max-h-[90vh] w-full ${maxW} flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 font-mono text-[11px] text-slate-400">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Page Component
 * ------------------------------------------------------------------------- */
function FloorsListInner() {
  const searchParams = useSearchParams();
  const buildingUuidFromUrl = searchParams.get('buildingUuid') || undefined;

  const [floors, setFloors] = useState<ProjectFloor[]>([]);
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string; undo?: () => void } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editFloor, setEditFloor] = useState<ProjectFloor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectFloor | null>(null);

  const [formData, setFormData] = useState({
    buildingUuid: buildingUuidFromUrl ?? '',
    floorCode: '',
    floorName: '',
    floorNumber: '',
  });

  const notify = useCallback((t: NonNullable<typeof toast>) => {
    setToast(t);
    window.setTimeout(() => setToast((cur) => (cur === t ? null : cur)), t.undo ? 7000 : 3500);
  }, []);

  // ✅ বিল্ডিং লিস্ট ফেচ (siteUuid ছাড়াই)
  const fetchBuildings = useCallback(async () => {
    try {
      setIsLoadingBuildings(true);
      const data = await buildingApi.list();
      setBuildings(data);
    } catch (e: any) {
      console.error('Failed to load buildings', e);
      notify({ type: 'err', msg: e.message || 'Failed to load buildings' });
    } finally {
      setIsLoadingBuildings(false);
    }
  }, [notify]);

  useEffect(() => {
    if (isModalOpen || editFloor) fetchBuildings();
  }, [isModalOpen, editFloor, fetchBuildings]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFloors(await floorApi.list(buildingUuidFromUrl));
    } catch (e: any) {
      setError(e.message || 'Failed to load floors');
    } finally {
      setLoading(false);
    }
  }, [buildingUuidFromUrl]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (buildingUuidFromUrl) setFormData((c) => ({ ...c, buildingUuid: buildingUuidFromUrl }));
  }, [buildingUuidFromUrl]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.buildingUuid) {
      notify({ type: 'err', msg: 'Please select a building' });
      return;
    }
    setBusy(true);
    try {
      await floorApi.create({
        buildingUuid: formData.buildingUuid.trim(),
        floorCode: formData.floorCode.trim(),
        floorName: formData.floorName.trim(),
        floorNumber: Number(formData.floorNumber),
      });
      setIsModalOpen(false);
      setFormData({ buildingUuid: buildingUuidFromUrl ?? '', floorCode: '', floorName: '', floorNumber: '' });
      notify({ type: 'ok', msg: `"${formData.floorName}" created` });
      await load();
    } catch (err: any) {
      notify({ type: 'err', msg: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFloor) return;
    setBusy(true);
    try {
      await floorApi.update(editFloor.uuid, {
        buildingUuid: editFloor.buildingUuid,
        floorCode: editFloor.floorCode.trim(),
        floorName: editFloor.name.trim(),
        floorNumber: editFloor.number,
      });
      setEditFloor(null);
      notify({ type: 'ok', msg: 'Floor updated' });
      await load();
    } catch (err: any) {
      notify({ type: 'err', msg: err.message });
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setBusy(true);
    try {
      await floorApi.remove(target.uuid);
      setDeleteTarget(null);
      await load();
      notify({
        type: 'ok',
        msg: `"${target.name}" deleted`,
        undo: async () => {
          try {
            await floorApi.restore(target.uuid);
            notify({ type: 'ok', msg: 'Floor restored' });
            await load();
          } catch (err: any) {
            notify({ type: 'err', msg: err.message });
          }
        },
      });
    } catch (err: any) {
      notify({ type: 'err', msg: err.message });
    } finally {
      setBusy(false);
    }
  };

  const filteredFloors = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return floors.filter((f) => f.name.toLowerCase().includes(q) || f.number.toString().includes(q));
  }, [floors, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      <div className="mx-auto max-w-[1600px] space-y-5">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <nav className="flex items-center text-xs sm:text-sm text-slate-500 gap-1.5 sm:gap-2 mb-1">
              <Link href="/projects" className="hover:text-emerald-700 font-medium transition">Projects</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link href="/projects/sites" className="hover:text-emerald-700 font-medium transition">Buildings</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                Floors
              </span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Building Floors Directory
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={load} 
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 hover:shadow-sm active:scale-95"
            >
              <Plus className="h-4 w-4" /> Add Floor
            </button>
          </div>
        </div>

        {/* Table card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                {buildingUuidFromUrl ? <>Building <span className="font-mono text-indigo-600">{buildingUuidFromUrl.slice(0, 8)}...</span></> : 'All Buildings'}
              </p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search floor name, number..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10" 
              />
            </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-xs sm:text-sm text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white text-xs font-bold uppercase tracking-wider">
                  <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">Floor Code</th>
                  <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">Floor Name</th>
                  <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">Level</th>
                  <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">Units</th>
                  <th className="px-4 py-3.5 font-semibold text-white text-center tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700 font-medium">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}><td colSpan={5} className="px-5 py-4"><div className="h-4 animate-pulse rounded bg-slate-100" /></td></tr>
                  ))
                ) : filteredFloors.length > 0 ? (
                  filteredFloors.map((floor) => (
                    <tr key={floor.uuid} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-600">{floor.floorCode || floor.uuid.slice(0, 8)}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{floor.name}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">Level {floor.number}</span></td>
                      <td className="px-4 py-3 font-bold text-slate-900">{floor.units_count} Units</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => setEditFloor({ ...floor })} className="rounded-lg bg-teal-50 p-1.5 text-teal-600 transition hover:bg-teal-100 active:scale-95" title="Edit Floor"><Edit className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setDeleteTarget(floor)} className="rounded-lg bg-rose-50 p-1.5 text-rose-600 transition hover:bg-rose-100 active:scale-95" title="Delete Floor"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Layers className="h-8 w-8 text-slate-300" />
                        <p className="text-sm font-medium">No floors found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!loading && (
            <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs text-slate-500 font-medium">
              Showing <b>{filteredFloors.length}</b> of <b>{floors.length}</b> floors
            </div>
          )}
        </div>
      </div>

      {/* Add Floor Modal */}
      {isModalOpen && (
        <ModalShell title="Add Floor" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleFormSubmit} className="space-y-4 p-6">
            <div>
              <label className={labelCls}>Select Building *</label>
              {isLoadingBuildings ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 py-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading buildings...</div>
              ) : buildings.length === 0 ? (
                <div className="text-sm text-rose-600 py-2 bg-rose-50 px-3 rounded-lg">No buildings found. Please create a building first.</div>
              ) : (
                <select required value={formData.buildingUuid} onChange={(e) => setFormData({ ...formData, buildingUuid: e.target.value })} className={inputCls}>
                  <option value="">-- Select a Building --</option>
                  {buildings.map((b) => (
                    <option key={b.uuid} value={b.uuid}>{b.buildingName} ({b.buildingCode})</option>
                  ))}
                </select>
              )}
            </div>
            <div><label className={labelCls}>Floor Code *</label><input required placeholder="e.g. FL-01" value={formData.floorCode} onChange={(e) => setFormData({ ...formData, floorCode: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>Floor Name *</label><input required placeholder="e.g. Ground Floor" value={formData.floorName} onChange={(e) => setFormData({ ...formData, floorName: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>Floor Number *</label><input type="number" min="0" required placeholder="0" value={formData.floorNumber} onChange={(e) => setFormData({ ...formData, floorNumber: e.target.value })} className={inputCls} /></div>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
              <button type="submit" disabled={busy || !formData.buildingUuid} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save Floor
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Edit Floor Modal */}
      {editFloor && (
        <ModalShell title="Edit Floor" onClose={() => setEditFloor(null)}>
          <form onSubmit={handleEditSubmit} className="space-y-4 p-6">
            <div>
              <label className={labelCls}>Select Building</label>
              {isLoadingBuildings ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 py-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading buildings...</div>
              ) : (
                <select 
                  required 
                  value={editFloor.buildingUuid || ''} 
                  onChange={(e) => setEditFloor({ ...editFloor, buildingUuid: e.target.value })} 
                  className={inputCls}
                >
                  <option value="">-- Select a Building --</option>
                  {buildings.map((b) => (
                    <option key={b.uuid} value={b.uuid}>{b.buildingName} ({b.buildingCode})</option>
                  ))}
                </select>
              )}
            </div>
            <div><label className={labelCls}>Floor Code</label><input required value={editFloor.floorCode} onChange={(e) => setEditFloor({ ...editFloor, floorCode: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>Floor Name</label><input required value={editFloor.name} onChange={(e) => setEditFloor({ ...editFloor, name: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>Floor Number</label><input type="number" required value={editFloor.number} onChange={(e) => setEditFloor({ ...editFloor, number: parseInt(e.target.value) || 0 })} className={inputCls} /></div>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setEditFloor(null)} className="rounded-xl border px-5 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
              <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Update Floor
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <ModalShell title="Delete Floor?" onClose={() => setDeleteTarget(null)} maxW="max-w-sm">
          <div className="p-6 text-sm text-slate-600">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600"><Trash2 className="h-6 w-6" /></div>
            <p className="text-center"><b className="text-slate-900">{deleteTarget.name}</b> will be removed. You can undo it right after.</p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="rounded-xl border px-5 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
              <button onClick={confirmDelete} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[70] flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl">
          {toast.type === 'ok' ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertCircle className="h-5 w-5 text-rose-400" />}
          <span>{toast.msg}</span>
          {toast.undo && (
            <button onClick={() => { toast.undo?.(); setToast(null); }} className="ml-2 inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold hover:bg-white/20">
              <Undo2 className="h-3.5 w-3.5" /> Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function FloorsListPage() {
  return (
    <Suspense fallback={null}>
      <FloorsListInner />
    </Suspense>
  );
}