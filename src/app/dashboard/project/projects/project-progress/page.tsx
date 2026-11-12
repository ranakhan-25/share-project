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
  ChevronRight as ChevronRightIcon,
  Home,
  Edit,
  Trash2
} from 'lucide-react';
import { getStoredAccessToken } from '@/lib/admin-auth/adminAuthStorage';

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

interface ProjectOption {
  uuid: string;
  name: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ProjectProgressPage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/realbizpro/api/v1';

  // State
  const [progressLogs, setProgressLogs] = useState<ProgressRecord[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectUuid, setSelectedProjectUuid] = useState<string>('');
  const [summary, setSummary] = useState<SummaryData>({
    latestPhysical: 0,
    latestFinancial: 0,
    progressVariance: 0,
    totalLogs: 0,
    status: 'No data'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
  const [editingRecord, setEditingRecord] = useState<ProgressRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProgressRecord | null>(null);
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

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? getStoredAccessToken() : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const notifySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // 1. FETCH USER'S PROJECTS
  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/project?limit=100`, { headers: getHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.data?.data || data?.data?.items || data?.data || [];
      const opts: ProjectOption[] = list.map((p: any) => ({
        uuid: p.uuid,
        name: p.projectName || p.name || 'Unnamed Project'
      }));
      setProjects(opts);
      if (opts.length > 0) {
        setSelectedProjectUuid(opts[0].uuid);
      }
    } catch (e) {
      console.error('Failed to load projects', e);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // 2. FETCH PROGRESS LOGS (GET)
  const fetchProgressLogs = async (page = 1, limit = 10, projectUuid = selectedProjectUuid) => {
    if (!projectUuid) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let url = `${API_BASE_URL}/project-progress?projectUuid=${projectUuid}&page=${page}&limit=${limit}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (fromDate) url += `&fromDate=${fromDate}`;
      if (toDate) url += `&toDate=${toDate}`;

      const response = await fetch(url, { headers: getHeaders() });
      const result = await response.json();

      let rawLogs: any[] = [];
      let metaData: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };

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

  // 3. FETCH SUMMARY
  const fetchSummary = async (projectUuid = selectedProjectUuid) => {
    if (!projectUuid) return;
    try {
      const response = await fetch(`${API_BASE_URL}/project-progress/summary?projectUuid=${projectUuid}`, {
        headers: getHeaders()
      });
      const result = await response.json();

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

  useEffect(() => {
    if (selectedProjectUuid) {
      fetchProgressLogs(currentPage, pageLimit, selectedProjectUuid);
      fetchSummary(selectedProjectUuid);
    }
  }, [selectedProjectUuid, currentPage, pageLimit, searchQuery, fromDate, toDate]);

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 4. CREATE PROGRESS (POST)
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectUuid) {
      setErrorMsg('Please select a project first.');
      return;
    }
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
      projectUuid: selectedProjectUuid,
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
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to create progress log');
      }

      await fetchProgressLogs(1, pageLimit, selectedProjectUuid);
      await fetchSummary(selectedProjectUuid);
      setIsCreateModalOpen(false);
      notifySuccess('Progress log created successfully!');

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

  // 5. UPDATE PROGRESS (PATCH)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`${API_BASE_URL}/project-progress/${editingRecord.uuid}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          physicalPct: Number(editingRecord.physicalPct),
          financialPct: Number(editingRecord.financialPct),
          remarks: editingRecord.remarks
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update progress log');
      }

      await fetchProgressLogs(currentPage, pageLimit, selectedProjectUuid);
      await fetchSummary(selectedProjectUuid);
      setEditingRecord(null);
      notifySuccess('Progress log updated successfully!');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. DELETE PROGRESS (DELETE)
  const handleDeleteProgress = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/project-progress/${deleteTarget.uuid}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to delete progress log');
      }

      setProgressLogs(progressLogs.filter(p => p.uuid !== deleteTarget.uuid));
      setDeleteTarget(null);
      await fetchSummary(selectedProjectUuid);
      notifySuccess('Progress log deleted successfully!');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 p-6 lg:p-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <nav className="flex items-center text-sm text-slate-500 space-x-2 mb-1">
            <Link href="/dashboard" className="flex items-center hover:text-blue-600 transition-colors">
              <Home className="w-4 h-4 mr-1 text-slate-600" /> Dashboard
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-900">Project Progress</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
              <TrendingUp className="w-7 h-7 text-blue-600" /> Project Progress Management
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Project Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Project:</label>
            <select
              value={selectedProjectUuid}
              onChange={(e) => setSelectedProjectUuid(e.target.value)}
              className="bg-white border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-blue-600 shadow-sm cursor-pointer"
            >
              {projects.length === 0 && <option value="">No Projects Found</option>}
              {projects.map((p) => (
                <option key={p.uuid} value={p.uuid}>{p.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-xl shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Log Progress Update
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600" /> {errorMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Latest Physical %</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{summary.latestPhysical}%</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Site work execution</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Latest Financial %</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{summary.latestFinancial}%</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Billed & disbursed cost</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress Variance</p>
            <h3 className={`text-2xl font-bold mt-1 ${Number(summary.progressVariance) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {Number(summary.progressVariance) > 0 ? `+${summary.progressVariance}%` : `${summary.progressVariance}%`}
            </h3>
            <p className="text-xs mt-1 font-medium flex items-center gap-1">
              {Number(summary.progressVariance) >= 0 ? (
                <span className="text-emerald-600 flex items-center gap-0.5"><ArrowUpRight className="w-3.5 h-3.5" /> Ahead of schedule</span>
              ) : (
                <span className="text-rose-600 flex items-center gap-0.5"><ArrowDownRight className="w-3.5 h-3.5" /> Behind schedule</span>
              )}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${Number(summary.progressVariance) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {Number(summary.progressVariance) >= 0 ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
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

      {/* Main Container */}
      <div className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden">
        
        {/* Filters */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search remarks, inspector..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none focus:border-blue-600 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">From:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-white border border-slate-200 text-xs rounded-xl px-2.5 py-1.5 outline-none shadow-sm"
            />
            <label className="text-xs font-semibold text-slate-500 uppercase ml-2">To:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-white border border-slate-200 text-xs rounded-xl px-2.5 py-1.5 outline-none shadow-sm"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p>Loading progress audit trail...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                    <th className="py-3.5 px-4">As of Date</th>
                    <th className="py-3.5 px-4">Physical Progress</th>
                    <th className="py-3.5 px-4">Financial Progress</th>
                    <th className="py-3.5 px-4">Variance</th>
                    <th className="py-3.5 px-4">Remarks</th>
                    <th className="py-3.5 px-4">Inspector</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {progressLogs.length > 0 ? (
                    progressLogs.map((log) => (
                      <tr key={log.uuid} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">{log.asOfDate}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, log.physicalPct)}%` }} />
                            </div>
                            <span className="font-bold text-slate-900">{log.physicalPct}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                              <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${Math.min(100, log.financialPct)}%` }} />
                            </div>
                            <span className="font-bold text-slate-900">{log.financialPct}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold">
                          <span className={log.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {log.variance > 0 ? `+${log.variance}%` : `${log.variance}%`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate" title={log.remarks}>{log.remarks}</td>
                        <td className="py-3.5 px-4 text-slate-600 text-xs">{log.loggedBy}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingRecord(log)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Log"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(log)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Log"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">No progress entries recorded for this project.</td>
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
            <span>Showing {progressLogs.length} of {meta.total} total logs</span>
            <select 
              value={pageLimit} 
              onChange={(e) => { setPageLimit(Number(e.target.value)); setCurrentPage(1); }}
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
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-semibold text-slate-700">
              Page {meta.page} of {meta.totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={currentPage >= meta.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>

          <span>Project Progress Module</span>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Log Progress Update</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">As of Date *</label>
                <input type="date" required name="asOfDate" value={formData.asOfDate} onChange={handleInputChange} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Physical % *</label>
                  <input type="number" min="0" max="100" step="0.1" required name="physicalPct" placeholder="e.g. 25.5" value={formData.physicalPct} onChange={handleInputChange} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Financial % *</label>
                  <input type="number" min="0" max="100" step="0.1" required name="financialPct" placeholder="e.g. 20.0" value={formData.financialPct} onChange={handleInputChange} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Remarks & Field Notes</label>
                <textarea rows={3} name="remarks" placeholder="Site observations, delays, or milestones..." value={formData.remarks} onChange={handleInputChange} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isSubmitting ? 'Saving...' : 'Save Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Edit Progress Log</h2>
              <button onClick={() => setEditingRecord(null)} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Physical % *</label>
                  <input type="number" min="0" max="100" step="0.1" required value={editingRecord.physicalPct} onChange={(e) => setEditingRecord({ ...editingRecord, physicalPct: parseFloat(e.target.value) || 0 })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Financial % *</label>
                  <input type="number" min="0" max="100" step="0.1" required value={editingRecord.financialPct} onChange={(e) => setEditingRecord({ ...editingRecord, financialPct: parseFloat(e.target.value) || 0 })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Remarks</label>
                <textarea rows={3} value={editingRecord.remarks} onChange={(e) => setEditingRecord({ ...editingRecord, remarks: e.target.value })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setEditingRecord(null)} className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-sm">
                  {isSubmitting ? 'Updating...' : 'Update Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Delete Progress Log?</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete progress log for <span className="font-semibold text-slate-800">{deleteTarget.asOfDate}</span>?</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={handleDeleteProgress} disabled={isSubmitting} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-sm">
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
