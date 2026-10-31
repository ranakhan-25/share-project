'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Home, 
  ChevronRight, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  X, 
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ShieldAlert,
  Layers
} from 'lucide-react';

// Backend API Response Types
interface ApiControl {
  uuid: string;
  uid: string;
  id: string;
  projectUuid: string;
  controlCode: string;
  controlType: 'Cost' | 'Schedule' | 'Quality';
  thresholdTarget: string | number;
  actualValue: string | number;
  variance?: number;
  status?: 'OK' | 'Warning' | 'Breach';
  actionStep?: string;
  createdAt: string;
}

// Frontend UI Type
interface ProjectControl {
  uuid: string;
  code: string;
  controlType: string;
  threshold: number;
  actual: number;
  variance: number;
  status: 'OK' | 'Warning' | 'Breach';
  action: string;
}

interface SummaryData {
  totalControls: number;
  okCount: number;
  warningCount: number;
  breachCount: number;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ProjectControlsPage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/realbizpro/api/v1';
  const DEFAULT_PROJECT_UUID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

  // State
  const [controls, setControls] = useState<ProjectControl[]>([]);
  const [summary, setSummary] = useState<SummaryData>({ totalControls: 0, okCount: 0, warningCount: 0, breachCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    controlType: 'Cost' as string,
    thresholdTarget: '',
    actualValue: '',
    actionStep: ''
  });

  // 1. FETCH CONTROLS (GET List with Filters & Pagination)
  const fetchControls = async (page = 1, limit = 10) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let url = `${API_BASE_URL}/project-controls?projectUuid=${DEFAULT_PROJECT_UUID}&page=${page}&limit=${limit}`;
      
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (selectedType !== 'All') url += `&controlType=${selectedType}`;
      if (selectedStatus !== 'All') url += `&status=${selectedStatus}`;

      const response = await fetch(url);
      const result = await response.json();
      
      console.log("Fetched Controls:", result); // ডিবাগ করার জন্য
      
      let rawControls: ApiControl[] = [];
      let metaData: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };
      
      // Robust Parsing
      if (result && result.success && Array.isArray(result.data)) {
        rawControls = result.data;
        metaData = result.meta || { total: result.data.length, page, limit, totalPages: Math.ceil(result.data.length / limit) };
      } else if (result && Array.isArray(result.data)) {
        rawControls = result.data;
        metaData = result.meta || { total: result.data.length, page, limit, totalPages: Math.ceil(result.data.length / limit) };
      } else if (Array.isArray(result)) {
        rawControls = result;
        metaData = { total: result.length, page, limit, totalPages: Math.ceil(result.length / limit) };
      } else if (result && result.data && Array.isArray(result.data.data)) {
        rawControls = result.data.data;
        metaData = result.data.meta || { total: rawControls.length, page, limit, totalPages: Math.ceil(rawControls.length / limit) };
      }

      const mappedControls: ProjectControl[] = rawControls.map((c) => {
        const threshold = parseFloat(String(c.thresholdTarget || 0)) || 0;
        const actual = parseFloat(String(c.actualValue || 0)) || 0;
        
        const variance = c.variance !== undefined ? c.variance : (actual - threshold);
        let finalStatus: 'OK' | 'Warning' | 'Breach' = 'OK';
        
        if (c.status) {
          finalStatus = c.status as any;
        } else {
          if (variance > threshold * 0.15) finalStatus = 'Breach';
          else if (variance > 0) finalStatus = 'Warning';
        }

        return {
          uuid: c.uuid || c.id,
          code: c.controlCode || 'N/A',
          controlType: c.controlType || 'Unknown',
          threshold: threshold,
          actual: actual,
          variance: variance,
          status: finalStatus,
          action: c.actionStep || 'No action specified',
        };
      });
      
      setControls(mappedControls);
      setMeta(metaData);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching controls:", error);
      setErrorMsg("Failed to load control data. Please check your connection.");
      setControls([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. FETCH SUMMARY
  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/project-controls/summary?projectUuid=${DEFAULT_PROJECT_UUID}`);
      const result = await response.json();
      if (result && result.success && result.data) {
        setSummary(result.data);
      } else if (result && result.data) {
        setSummary(result.data);
      } else if (result && result.totalControls !== undefined) {
        setSummary(result);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  // Trigger fetch on filter/page changes
  useEffect(() => {
    fetchControls(currentPage, pageLimit);
  }, [currentPage, pageLimit, searchQuery, selectedType, selectedStatus]);

  useEffect(() => {
    fetchSummary();
  }, []);

  // 3. CREATE CONTROL (POST)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const thresholdNum = parseFloat(formData.thresholdTarget) || 0;
    const actualNum = parseFloat(formData.actualValue) || 0;

    const payload = {
      projectUuid: DEFAULT_PROJECT_UUID,
      controlCode: `CTRL-${Math.floor(1000 + Math.random() * 9000)}`,
      controlType: formData.controlType,
      thresholdTarget: thresholdNum,
      actualValue: actualNum,
      actionStep: formData.actionStep,
      addedBy: 'Admin',
      addedById: 'admin-uuid'
    };

    try {
      const response = await fetch(`${API_BASE_URL}/project-controls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to create control entry');
      }

      // Refresh data
      await fetchControls(1, pageLimit);
      await fetchSummary();
      setIsModalOpen(false);
      
      setFormData({
        controlType: 'Cost',
        thresholdTarget: '',
        actualValue: '',
        actionStep: ''
      });
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pagination Handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setPageLimit(newLimit);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-white p-6 lg:p-8 font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <nav className="flex items-center text-sm text-slate-500 space-x-2 mb-1">
            <Link href="/projects" className="flex items-center hover:text-blue-600 transition-colors">
              <Home className="w-4 h-4 mr-1 text-slate-600" /> Projects
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="hover:text-blue-600 cursor-pointer">proj-skyline-001</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-900">Controls</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Project Control Management</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> New Control Metric
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5" /> {errorMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Controls</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{summary.totalControls}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">OK (On Track)</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.okCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Warning Level</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{summary.warningCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Critical Breaches</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{summary.breachCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden">
        
        {/* Filters */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Type:</label>
              <select
                value={selectedType}
                onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
                className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-blue-600 shadow-sm cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="Cost">Cost</option>
                <option value="Schedule">Schedule</option>
                <option value="Quality">Quality</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Status:</label>
              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-blue-600 shadow-sm cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="OK">OK</option>
                <option value="Warning">Warning</option>
                <option value="Breach">Breach</option>
              </select>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search controls or actions..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none focus:border-blue-600 shadow-sm"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p>Loading control data...</p>
          </div>
        ) : (
          <>
            {/* Controls Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                    <th className="py-3.5 px-4">Control ID</th>
                    <th className="py-3.5 px-4">Control Type</th>
                    <th className="py-3.5 px-4">Threshold Target</th>
                    <th className="py-3.5 px-4">Actual Value</th>
                    <th className="py-3.5 px-4">Variance</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Corrective Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {controls.length > 0 ? (
                    controls.map((ctrl) => (
                      <tr key={ctrl.uuid} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">{ctrl.code}</td>
                        <td className="py-3.5 px-4">
                          <span className="capitalize font-medium text-slate-900 border border-slate-200 px-2.5 py-1 rounded-lg bg-slate-50 text-xs">
                            {ctrl.controlType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {ctrl.controlType === 'Cost' ? `$${ctrl.threshold.toLocaleString()}` : `${ctrl.threshold}`}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {ctrl.controlType === 'Cost' ? `$${ctrl.actual.toLocaleString()}` : `${ctrl.actual}`}
                        </td>
                        <td className="py-3.5 px-4 font-semibold">
                          <span className={ctrl.variance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                            {ctrl.variance > 0 ? `+${ctrl.variance.toLocaleString()}` : ctrl.variance.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {ctrl.status === 'OK' && (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> OK
                            </span>
                          )}
                          {ctrl.status === 'Warning' && (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5" /> Warning
                            </span>
                          )}
                          {ctrl.status === 'Breach' && (
                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                              <XCircle className="w-3.5 h-3.5" /> Breach
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-sm">
                          {ctrl.action}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No control records available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Footer with Pagination */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span>Showing {controls.length} of {meta.total} control entries</span>
            <select 
              value={pageLimit} 
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
              let pageNum;
              if (meta.totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= meta.totalPages - 2) pageNum = meta.totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white border border-blue-600'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= meta.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>

          <span>Project Controls Engine v03.09</span>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Add Control Metric</h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Control Type *</label>
                <select
                  value={formData.controlType}
                  onChange={(e) => setFormData({ ...formData, controlType: e.target.value })}
                  className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm"
                >
                  <option value="Cost">Cost</option>
                  <option value="Schedule">Schedule</option>
                  <option value="Quality">Quality</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Threshold Target *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 500000"
                  value={formData.thresholdTarget}
                  onChange={(e) => setFormData({ ...formData, thresholdTarget: e.target.value })}
                  className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Actual Value *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 520000"
                  value={formData.actualValue}
                  onChange={(e) => setFormData({ ...formData, actualValue: e.target.value })}
                  className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Action Step / Note</label>
                <textarea
                  rows={3}
                  placeholder="Describe required action if variance occurs..."
                  value={formData.actionStep}
                  onChange={(e) => setFormData({ ...formData, actionStep: e.target.value })}
                  className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isSubmitting ? 'Saving...' : 'Save Control'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}