'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  Calendar,
  Percent,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  X,
  Upload,
  Image as ImageIcon,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Info,
  Loader2,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';

// Frontend UI Types
interface ProgressRecord {
  uuid: string;
  asOfDate: string;
  physicalPct: number;
  financialPct: number;
  variance: number;
  remarks: string;
  photos: string[];
  createdAt: string;
  loggedBy: string;
}

interface SummaryData {
  latestPhysical: number;
  latestFinancial: number;
  progressVariance: number | string;
  totalLogs: number;
  status: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ProjectProgressPage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/realbizpro/api/v1';
  const DEFAULT_PROJECT_UUID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

  // State
  const [progressLogs, setProgressLogs] = useState<ProgressRecord[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    latestPhysical: 0,
    latestFinancial: 0,
    progressVariance: 0,
    totalLogs: 0,
    status: 'No data'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPhotosModal, setSelectedPhotosModal] = useState<string[] | null>(null);

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  // Form State
  const [formData, setFormData] = useState({
    asOfDate: getTodayDate(),
    physicalPct: '',
    financialPct: '',
    remarks: '',
    photos: [] as string[]
  });

  // 1. FETCH PROGRESS LOGS (GET List with Filters & Pagination)
  const fetchProgressLogs = async (page = 1, limit = 10) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let url = `${API_BASE_URL}/project-progress?projectUuid=${DEFAULT_PROJECT_UUID}&page=${page}&limit=${limit}`;
      
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (fromDate) url += `&fromDate=${fromDate}`;
      if (toDate) url += `&toDate=${toDate}`;

      const response = await fetch(url);
      const result = await response.json();
      
      console.log("=== DEBUG: Fetched Progress Response ===", result);

      let rawLogs: any[] = [];
      let metaData: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };

      // Robust Parsing (সব ধরনের রেসপন্স হ্যান্ডেল করবে)
      if (Array.isArray(result)) {
        rawLogs = result;
        metaData = { total: result.length, page, limit, totalPages: Math.ceil(result.length / limit) };
      } else if (result.success && Array.isArray(result.data)) {
        rawLogs = result.data;
        metaData = result.meta || { total: result.data.length, page, limit, totalPages: Math.ceil(result.data.length / limit) };
      } else if (Array.isArray(result.data)) {
        rawLogs = result.data;
        metaData = result.meta || { total: result.data.length, page, limit, totalPages: Math.ceil(result.data.length / limit) };
      } else if (result.data && Array.isArray(result.data.data)) {
        rawLogs = result.data.data;
        metaData = result.data.meta || result.meta || { total: rawLogs.length, page, limit, totalPages: Math.ceil(rawLogs.length / limit) };
      }

      // Safe Mapping
      const mappedLogs: ProgressRecord[] = rawLogs.map((log) => {
        const physical = parseFloat(String(log.physicalPct || 0)) || 0;
        const financial = parseFloat(String(log.financialPct || 0)) || 0;
        const variance = log.variance !== undefined && log.variance !== null 
          ? parseFloat(String(log.variance)) 
          : (physical - financial);

        return {
          uuid: log.uuid || log.id || Math.random().toString(),
          asOfDate: log.asOfDate || new Date().toISOString().split('T')[0],
          physicalPct: physical,
          financialPct: financial,
          variance: variance,
          remarks: log.remarks || 'No remarks provided',
          photos: Array.isArray(log.photos) ? log.photos : [],
          createdAt: log.createdAt || new Date().toISOString(),
          loggedBy: log.loggedBy || 'System',
        };
      });

      setProgressLogs(mappedLogs);
      setMeta(metaData);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching progress:", error);
      setErrorMsg("Failed to load progress data. Please check your connection.");
      setProgressLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. FETCH SUMMARY
  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/project-progress/summary?projectUuid=${DEFAULT_PROJECT_UUID}`);
      const result = await response.json();
      console.log("=== DEBUG: Fetched Summary ===", result);

      if (result.success && result.data) {
        setSummary(result.data);
      } else if (result.data) {
        setSummary(result.data);
      } else if (result.totalLogs !== undefined) {
        setSummary(result);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  // Triggers
  useEffect(() => {
    fetchProgressLogs(currentPage, pageLimit);
  }, [currentPage, pageLimit, searchQuery, fromDate, toDate]);

  useEffect(() => {
    fetchSummary();
  }, []);

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSimulatedFileUpload = () => {
    const dummyImages = [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=400&q=80'
    ];
    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, dummyImages[prev.photos.length % dummyImages.length]]
    }));
  };

  // 3. CREATE PROGRESS (POST)
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const physNum = parseFloat(formData.physicalPct);
    const finNum = parseFloat(formData.financialPct);

    if (isNaN(physNum) || physNum < 0 || physNum > 100) {
      setErrorMsg('Physical Progress % must be between 0 and 100');
      setIsSubmitting(false);
      return;
    }

    if (isNaN(finNum) || finNum < 0 || finNum > 100) {
      setErrorMsg('Financial Progress % must be between 0 and 100');
      setIsSubmitting(false);
      return;
    }

    const isoDate = new Date(formData.asOfDate).toISOString();

    const payload = {
      projectUuid: DEFAULT_PROJECT_UUID,
      asOfDate: isoDate,
      physicalPct: physNum,
      financialPct: finNum,
      remarks: formData.remarks || 'No remarks provided.',
      photos: formData.photos,
      loggedBy: 'Tanvir Ahmed',
      loggedById: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      createdBy: 'Tanvir Ahmed'
    };

    try {
      const response = await fetch(`${API_BASE_URL}/project-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      console.log("POST Response:", responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to create progress log');
      }

      await fetchProgressLogs(1, pageLimit);
      await fetchSummary();
      setIsCreateModalOpen(false);

      setFormData({
        asOfDate: getTodayDate(),
        physicalPct: '',
        financialPct: '',
        remarks: '',
        photos: []
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
    <div className="min-h-screen bg-white text-slate-800 p-6 lg:p-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <nav className="flex items-center text-sm text-slate-500 space-x-2 mb-1">
            <Link href="/projects" className="hover:text-blue-600 cursor-pointer">Projects</Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="hover:text-blue-600 cursor-pointer">PRJ-2026-001</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-800">Progress</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
              <TrendingUp className="w-7 h-7 text-blue-600" /> Feature 03.07 · Progress Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200">
              /projects/:uuid/progress
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Log Progress Update
        </button>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5" /> {errorMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Latest Physical %</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{summary.latestPhysical}%</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Site work execution</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Latest Financial %</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{summary.latestFinancial}%</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Billed & disbursed cost</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress Variance</p>
            <h3 className={`text-2xl font-bold mt-1 ${Number(summary.progressVariance) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {Number(summary.progressVariance) > 0 ? `+${summary.progressVariance}%` : `${summary.progressVariance}%`}
            </h3>
            <p className="text-xs mt-1 font-medium flex items-center gap-1">
              {Number(summary.progressVariance) >= 0 ? (
                <span className="text-emerald-600 flex items-center gap-0.5"><ArrowUpRight className="w-3.5 h-3.5" /> Ahead of schedule</span>
              ) : (
                <span className="text-rose-600 flex items-center gap-0.5"><ArrowDownRight className="w-3.5 h-3.5" /> Behind financial burn</span>
              )}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${Number(summary.progressVariance) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {Number(summary.progressVariance) >= 0 ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Audit Logs</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{summary.totalLogs}</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Reported status milestones</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" /> Filter Progress Entries
          </span>
          <button
            onClick={() => {
              setSearchQuery('');
              setFromDate('');
              setToDate('');
              setCurrentPage(1);
            }}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search in remarks or author..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl pl-9 pr-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div>
            <input
              type="date"
              title="From As Of Date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
              className="bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div>
            <input
              type="date"
              title="To As Of Date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
              className="bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Table View */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel Export
            </button>
            <button className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs">
              <FileText className="w-3.5 h-3.5" /> PDF Log Summary
            </button>
            <span className="text-xs text-slate-500 ml-2">Total <strong className="text-slate-800">{meta.total}</strong> updates found</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>Variance Formula: <code>physical_pct - financial_pct</code></span>
          </div>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p>Loading progress records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                  <th className="py-3.5 px-4">As Of Date</th>
                  <th className="py-3.5 px-4">Physical %</th>
                  <th className="py-3.5 px-4">Financial %</th>
                  <th className="py-3.5 px-4">Variance</th>
                  <th className="py-3.5 px-4 w-1/3">Remarks</th>
                  <th className="py-3.5 px-4 text-center">Photos</th>
                  <th className="py-3.5 px-4 text-right">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
                {progressLogs.length > 0 ? (
                  progressLogs.map((log) => (
                    <tr key={log.uuid} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          {log.asOfDate}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono">{log.physicalPct}%</span>
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${log.physicalPct}%` }}></div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono">{log.financialPct}%</span>
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${log.financialPct}%` }}></div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs font-bold">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                          log.variance > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : log.variance < 0
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {log.variance > 0 ? `+${log.variance}%` : `${log.variance}%`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <p className="line-clamp-2" title={log.remarks}>{log.remarks}</p>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {log.photos.length > 0 ? (
                          <button
                            onClick={() => setSelectedPhotosModal(log.photos)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                            <span>{log.photos.length} Photo{log.photos.length > 1 ? 's' : ''}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs italic">None</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right text-xs text-slate-500 whitespace-nowrap">
                        <div>
                          <span className="font-medium text-slate-800">{log.loggedBy}</span>
                          <p className="text-[10px] text-slate-400">
                            {new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No progress updates found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer with Pagination */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Showing {progressLogs.length} of {meta.total} records</span>
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

          <span>Route endpoint: <code>/projects/:uuid/progress</code></span>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Log Progress Update</h2>
                  <p className="text-xs font-mono text-slate-500">/projects/:uuid/progress/create</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  As Of Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="asOfDate"
                  required
                  value={formData.asOfDate}
                  onChange={handleInputChange}
                  className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">Defaults to today's date if unmodified</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Physical Progress % <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      name="physicalPct"
                      required
                      placeholder="e.g. 45.0"
                      value={formData.physicalPct}
                      onChange={handleInputChange}
                      className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl pl-3.5 pr-8 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Financial Progress % <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      name="financialPct"
                      required
                      placeholder="e.g. 42.0"
                      value={formData.financialPct}
                      onChange={handleInputChange}
                      className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl pl-3.5 pr-8 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>
              </div>

              {formData.physicalPct !== '' && formData.financialPct !== '' && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Computed Variance:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {(parseFloat(formData.physicalPct || '0') - parseFloat(formData.financialPct || '0')).toFixed(2)}%
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Remarks / Status Notes
                </label>
                <textarea
                  name="remarks"
                  rows={3}
                  placeholder="Enter detailed site inspection notes, completed milestones, or issues..."
                  value={formData.remarks}
                  onChange={handleInputChange}
                  className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Site Photos Attachments
                </label>
                <div
                  onClick={handleSimulatedFileUpload}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-600 font-medium">Click to attach site images (Multiple)</p>
                  <p className="text-[10px] text-slate-400">PNG, JPG up to 10MB</p>
                </div>

                {formData.photos.length > 0 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {formData.photos.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                        <img src={url} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, photos: p.photos.filter((_, i) => i !== idx) }))}
                          className="absolute top-1 right-1 bg-slate-900/70 text-white rounded-full p-0.5 hover:bg-rose-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isSubmitting ? 'Saving...' : 'Save Progress Update'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Photo Gallery Preview Modal */}
      {selectedPhotosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden p-6 relative">
            <button
              onClick={() => setSelectedPhotosModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-600" /> Attached Site Inspection Photos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
              {selectedPhotosModal.map((imgUrl, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img src={imgUrl} alt={`Site inspection ${i}`} className="w-full h-48 object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}