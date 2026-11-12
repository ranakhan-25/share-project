'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Home, ChevronRight, Plus, Search, Grid, List, 
  X, Loader2, AlertCircle, CheckCircle2, Eye, Edit, Trash2,
  Upload, FileSpreadsheet
} from 'lucide-react';
import { getStoredAccessToken } from '@/lib/admin-auth/adminAuthStorage';

/* ----------------------------------------------------------------------------
 * API CONFIG
 * ------------------------------------------------------------------------- */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/realbizpro/api/v1';

interface FloorItem {
  uuid: string;
  floorName: string;
  floorNumber: number;
  floorCode: string;
}

interface UnitPlot {
  uuid: string;
  floorUuid: string;
  plotCode: string;
  plotType: string;
  sizeSqft: number;
  facing: string;
  basePrice: number;
  floorRise: number;
  premium: number;
  amenities?: string;
  status: 'Available' | 'Booked' | 'Sold' | 'Reserved' | 'Blocked';
  notes?: string;
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
      msg = j?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// ✅ আরও শক্তিশালী unwrapList
const unwrapList = (r: any): any[] => {
  if (Array.isArray(r)) return r;
  if (Array.isArray(r?.data)) return r.data;
  if (Array.isArray(r?.data?.data)) return r.data.data;
  if (Array.isArray(r?.data?.items)) return r.data.items;
  if (Array.isArray(r?.items)) return r.items;
  if (Array.isArray(r?.rows)) return r.rows;
  return [];
};

/* ----------------------------------------------------------------------------
 * UI Helpers
 * ------------------------------------------------------------------------- */
const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10';
const labelCls = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500';

function ModalShell({ title, onClose, children, maxW = 'max-w-lg', z = 'z-50' }: any) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={`fixed inset-0 ${z} flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm`} onMouseDown={onClose}>
      <div onMouseDown={(e) => e.stopPropagation()} className={`flex max-h-[90vh] w-full ${maxW} flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200`}>
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Main Page Component
 * ------------------------------------------------------------------------- */
export default function UnitPlotPage() {
  const [plots, setPlots] = useState<UnitPlot[]>([]);
  const [floors, setFloors] = useState<FloorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingFloors, setIsLoadingFloors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editPlot, setEditPlot] = useState<UnitPlot | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UnitPlot | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    floorUuid: '',
    plotCode: '',
    plotType: '3BHK',
    sizeSqft: '',
    facing: 'SE',
    basePrice: '',
    floorRise: '0',
    premium: '0',
    amenities: '',
    status: 'Available',
    notes: '',
  });

  const notify = (type: 'ok' | 'err', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ✅ 1. Floor লিস্ট ফেচ করা
  const fetchFloors = async () => {
    try {
      setIsLoadingFloors(true);
      const res = await request('/floor?limit=100');
      const list = unwrapList(res);
      setFloors(list.map((f: any) => ({
        uuid: f.uuid,
        floorName: f.floorName || f.name || 'Unknown',
        floorNumber: f.floorNumber || f.number || 0,
        floorCode: f.floorCode || '',
      })));
    } catch (e: any) {
      notify('err', e.message || 'Failed to load floors');
    } finally {
      setIsLoadingFloors(false);
    }
  };

  // ✅ 2. UnitPlot লিস্ট ফেচ করা (FIXED & DEBUGGED)
  const fetchPlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await request('/unit-plots?limit=100');
      console.log("=== RAW UNIT PLOTS RESPONSE ===", res); // Debugging
      
      const list = unwrapList(res);
      console.log("=== UNWRAPPED LIST ===", list); // Debugging

      // ✅ Safe Mapping with Fallbacks
      const mapped: UnitPlot[] = list.map((p: any) => ({
        uuid: p.uuid || p.id,
        floorUuid: p.floorUuid || p.floor_uuid || '',
        plotCode: p.plotCode || p.plot_code || 'N/A',
        plotType: p.plotType || p.plot_type || 'Unknown',
        sizeSqft: Number(p.sizeSqft || p.size_sqft || 0),
        facing: p.facing || 'N/A',
        basePrice: Number(p.basePrice || p.base_price || 0),
        floorRise: Number(p.floorRise || p.floor_rise || 0),
        premium: Number(p.premium || 0),
        amenities: p.amenities || '',
        status: p.status || 'Available',
        notes: p.notes || '',
      }));

      setPlots(mapped);
    } catch (e: any) {
      console.error("Fetch plots error:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlots();
  }, []);

  useEffect(() => {
    if (isModalOpen || editPlot) fetchFloors();
  }, [isModalOpen, editPlot]);

  // ✅ 3. Create Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.floorUuid) {
      notify('err', 'Please select a Floor');
      return;
    }
    setBusy(true);
    try {
      await request('/unit-plots', {
        method: 'POST',
        body: JSON.stringify({
          floorUuid: formData.floorUuid,
          plotCode: formData.plotCode,
          plotType: formData.plotType,
          sizeSqft: parseFloat(formData.sizeSqft) || 0,
          facing: formData.facing,
          basePrice: parseFloat(formData.basePrice) || 0,
          floorRise: parseFloat(formData.floorRise) || 0,
          premium: parseFloat(formData.premium) || 0,
          amenities: formData.amenities,
          status: formData.status,
          notes: formData.notes,
        }),
      });
      notify('ok', 'Unit Plot created successfully!');
      setIsModalOpen(false);
      resetForm();
      fetchPlots(); // ✅ তৈরি করার পর ডাটা রিফ্রেশ
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusy(false);
    }
  };

  // ✅ 4. Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPlot) return;
    setBusy(true);
    try {
      await request(`/unit-plots/${editPlot.uuid}`, {
        method: 'PATCH',
        body: JSON.stringify({
          plotCode: editPlot.plotCode,
          plotType: editPlot.plotType,
          sizeSqft: editPlot.sizeSqft,
          status: editPlot.status,
          basePrice: editPlot.basePrice,
          notes: editPlot.notes,
        }),
      });
      notify('ok', 'Unit Plot updated successfully!');
      setEditPlot(null);
      fetchPlots();
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusy(false);
    }
  };

  // ✅ 5. Delete
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await request(`/unit-plots/${deleteTarget.uuid}`, { method: 'DELETE' });
      notify('ok', 'Unit Plot deleted');
      setDeleteTarget(null);
      fetchPlots();
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusy(false);
    }
  };

  const resetForm = () => {
    setFormData({
      floorUuid: '', plotCode: '', plotType: '3BHK', sizeSqft: '', facing: 'SE',
      basePrice: '', floorRise: '0', premium: '0', amenities: '', status: 'Available', notes: ''
    });
  };

  const filteredPlots = useMemo(() => {
    return plots.filter(p => 
      p.plotCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.plotType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [plots, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8 font-sans text-slate-800">
      
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center text-sm text-slate-500 space-x-2 mb-1">
            <Link href="/projects" className="hover:text-indigo-600">Projects</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/floors" className="hover:text-indigo-600">Floors</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-semibold text-slate-900">Units</span>
          </nav>
          <h1 className="text-2xl font-extrabold text-slate-900">Floor Units Directory & Inventory</h1>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Create Unit Form
        </button>
      </div>

      {/* Filter Bar */}
      <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Search unit code, type..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={`${inputCls} pl-10`} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-4">Code</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Size (Sqft)</th>
                <th className="px-5 py-4">Facing</th>
                <th className="px-5 py-4">Base Price</th>
                <th className="px-5 py-4">Floor Rise & Premium</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-600" /></td></tr>
              ) : error ? (
                <tr><td colSpan={8} className="py-12 text-center text-rose-600">{error}</td></tr>
              ) : filteredPlots.length > 0 ? (
                filteredPlots.map((plot) => (
                  <tr key={plot.uuid} className="hover:bg-indigo-50/30">
                    <td className="px-5 py-4 font-mono font-semibold text-indigo-600">{plot.plotCode}</td>
                    <td className="px-5 py-4 font-bold">{plot.plotType}</td>
                    <td className="px-5 py-4">{plot.sizeSqft} sqft</td>
                    <td className="px-5 py-4">{plot.facing}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900">${plot.basePrice.toLocaleString()}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      Rise: +${plot.floorRise} | Prem: +${plot.premium}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${plot.status === 'Available' ? 'bg-emerald-50 text-emerald-700' : plot.status === 'Booked' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                        {plot.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => setEditPlot(plot)} className="text-slate-500 hover:text-indigo-600"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteTarget(plot)} className="text-slate-500 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400">No unit plots found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <ModalShell title="Create Unit Form" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
            
            {/* Floor Dropdown */}
            <div>
              <label className={labelCls}>Select Floor *</label>
              {isLoadingFloors ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 py-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading floors...</div>
              ) : floors.length === 0 ? (
                <div className="text-sm text-rose-600 py-2 bg-rose-50 px-3 rounded-lg">No floors found. Please create a floor first.</div>
              ) : (
                <select required value={formData.floorUuid} onChange={e => setFormData({ ...formData, floorUuid: e.target.value })} className={inputCls}>
                  <option value="">-- Select a Floor --</option>
                  {floors.map(f => (
                    <option key={f.uuid} value={f.uuid}>{f.floorName} (Level {f.floorNumber}) - {f.floorCode}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className={labelCls}>Unit Code *</label>
              <input required placeholder="e.g. A-301" value={formData.plotCode} onChange={e => setFormData({ ...formData, plotCode: e.target.value })} className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Type *</label>
                <select value={formData.plotType} onChange={e => setFormData({ ...formData, plotType: e.target.value })} className={inputCls}>
                  {['1BHK', '2BHK', '3BHK', 'Office', 'Shop', 'Plot'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Size Sqft *</label>
                <input type="number" required placeholder="1850" value={formData.sizeSqft} onChange={e => setFormData({ ...formData, sizeSqft: e.target.value })} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Facing *</label>
                <select value={formData.facing} onChange={e => setFormData({ ...formData, facing: e.target.value })} className={inputCls}>
                  {['NORTH (N)', 'SOUTH (S)', 'EAST (E)', 'WEST (W)', 'NE', 'NW', 'SE', 'SW'].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Base Price ($) *</label>
                <input type="number" required placeholder="185000" value={formData.basePrice} onChange={e => setFormData({ ...formData, basePrice: e.target.value })} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Floor Rise ($)</label>
                <input type="number" value={formData.floorRise} onChange={e => setFormData({ ...formData, floorRise: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Premium ($)</label>
                <input type="number" value={formData.premium} onChange={e => setFormData({ ...formData, premium: e.target.value })} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Amenities (Comma Separated)</label>
              <input placeholder="Corner View, Balcony, Parking" value={formData.amenities} onChange={e => setFormData({ ...formData, amenities: e.target.value })} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Unit Notes</label>
              <textarea rows={2} placeholder="Orientation and layout notes..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={inputCls} />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border px-5 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
              <button type="submit" disabled={busy || !formData.floorUuid} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {busy ? 'Saving...' : 'Save Unit'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* EDIT MODAL */}
      {editPlot && (
        <ModalShell title={`Edit Unit — ${editPlot.plotCode}`} onClose={() => setEditPlot(null)} maxW="max-w-md">
          <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
            <div>
              <label className={labelCls}>Status</label>
              <select value={editPlot.status} onChange={e => setEditPlot({ ...editPlot, status: e.target.value as any })} className={inputCls}>
                {['Available', 'Booked', 'Sold', 'Reserved', 'Blocked'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Base Price ($)</label>
              <input type="number" value={editPlot.basePrice} onChange={e => setEditPlot({ ...editPlot, basePrice: parseFloat(e.target.value) || 0 })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <textarea rows={3} value={editPlot.notes || ''} onChange={e => setEditPlot({ ...editPlot, notes: e.target.value })} className={inputCls} />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setEditPlot(null)} className="rounded-xl border px-4 py-2 text-sm font-semibold">Cancel</button>
              <button type="submit" disabled={busy} className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white">{busy ? 'Updating...' : 'Update Unit'}</button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* DELETE MODAL */}
      {deleteTarget && (
        <ModalShell title="Delete Unit?" onClose={() => setDeleteTarget(null)} maxW="max-w-sm">
          <div className="p-6 text-sm text-center">
            <p>Are you sure you want to delete <b>{deleteTarget.plotCode}</b>?</p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="rounded-xl border px-4 py-2 font-semibold">Cancel</button>
              <button onClick={confirmDelete} disabled={busy} className="rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white">{busy ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[70] flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl">
          {toast.type === 'ok' ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertCircle className="h-5 w-5 text-rose-400" />}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}