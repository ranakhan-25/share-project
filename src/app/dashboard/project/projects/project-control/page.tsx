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
  Layers,
  Edit2,
  Trash2
} from 'lucide-react';

interface ProjectItem {
  id: string | number;
  uuid: string;
  projectName?: string;
  name?: string;
}

interface ApiControl {
  uuid: string;
  uid?: string;
  id?: string;
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

function getStoredAccessToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('share-project:access-token') ||
    ''
  );
}

export default function ProjectControlsPage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/realbizpro/api/v1';

  // State
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectUuid, setSelectedProjectUuid] = useState<string>('');
  const [controls, setControls] = useState<ProjectControl[]>([]);
  const [summary, setSummary] = useState<SummaryData>({ totalControls: 0, okCount: 0, warningCount: 0, breachCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
    controlType: 'Cost',
    thresholdTarget: '',
    actualValue: '',
    actionStep: ''
  });

  // Edit Modal State
  const [editingControl, setEditingControl] = useState<ProjectControl | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    controlType: 'Cost',
    thresholdTarget: '',
    actualValue: '',
    actionStep: ''
  });

  // Delete State
  const [deletingControl, setDeletingControl] = useState<ProjectControl | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const authHeaders = () => {
    const token = getStoredAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  // Load user projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/project?limit=100`, {
          headers: authHeaders()
        });
        const json = await res.json();
        const list: ProjectItem[] = json?.data?.data || json?.data || (Array.isArray(json) ? json : []);
        setProjects(list);
        if (list.length > 0 && !selectedProjectUuid) {
          setSelectedProjectUuid(list[0].uuid);
        }
      } catch (err) {
        console.error('Failed to load user projects:', err);
      }
    };
    fetchProjects();
  }, [API_BASE_URL]);

  // 1. FETCH CONTROLS
  const fetchControls = async (page = 1, limit = 10, projUuid = selectedProjectUuid) => {
    if (!projUuid) {
      setControls([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let url = `${API_BASE_URL}/project-controls?projectUuid=${projUuid}&page=${page}&limit=${limit}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (selectedType !== 'All') url += `&controlType=${selectedType}`;
      if (selectedStatus !== 'All') url += `&status=${selectedStatus}`;

      const response = await fetch(url, { headers: authHeaders() });
      const result = await response.json();
      
      let rawControls: ApiControl[] = [];
      let metaData: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };
      
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
          uuid: c.uuid || c.id || '',
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
      setErrorMsg("Failed to load control data.");
      setControls([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. FETCH SUMMARY
  const fetchSummary = async (projUuid = selectedProjectUuid) => {
    if (!projUuid) return;
    try {
      const response = await fetch(`${API_BASE_URL}/project-controls/summary?projectUuid=${projUuid}`, {
        headers: authHeaders()
      });
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

  // Trigger fetch on project / filter / page changes
  useEffect(() => {
    if (selectedProjectUuid) {
      fetchControls(currentPage, pageLimit, selectedProjectUuid);
      fetchSummary(selectedProjectUuid);
    }
  }, [selectedProjectUuid, currentPage, pageLimit, searchQuery, selectedType, selectedStatus]);

  // 3. CREATE CONTROL (POST)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectUuid) {
      setErrorMsg('Please select a project first.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const thresholdNum = parseFloat(formData.thresholdTarget) || 0;
    const actualNum = parseFloat(formData.actualValue) || 0;

    const payload = {
      projectUuid: selectedProjectUuid,
      controlCode: `CTRL-${Math.floor(1000 + Math.random() * 9000)}`,
      controlType: formData.controlType,
      thresholdTarget: thresholdNum,
      actualValue: actualNum,
      actionStep: formData.actionStep,
      addedBy: 'Share User',
      addedById: 'share-user'
    };

    try {
      const response = await fetch(`${API_BASE_URL}/project-controls`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to create control entry');
      }

      setSuccessMsg('Control metric created successfully!');
      await fetchControls(1, pageLimit, selectedProjectUuid);
      await fetchSummary(selectedProjectUuid);
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

  // 4. UPDATE CONTROL (PATCH)
  const openEditModal = (ctrl: ProjectControl) => {
    setEditingControl(ctrl);
    setEditFormData({
      controlType: ctrl.controlType,
      thresholdTarget: String(ctrl.threshold),
      actualValue: String(ctrl.actual),
      actionStep: ctrl.action
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingControl) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const thresholdNum = parseFloat(editFormData.thresholdTarget) || 0;
    const actualNum = parseFloat(editFormData.actualValue) || 0;

    const payload = {
      controlType: editFormData.controlType,
      thresholdTarget: thresholdNum,
      actualValue: actualNum,
      actionStep: editFormData.actionStep,
      updatedBy: 'Share User'
    };

    try {
      const response = await fetch(`${API_BASE_URL}/project-controls/${editingControl.uuid}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update control entry');
      }

      setSuccessMsg('Control metric updated successfully!');
      await fetchControls(currentPage, pageLimit, selectedProjectUuid);
      await fetchSummary(selectedProjectUuid);
      setIsEditModalOpen(false);
      setEditingControl(null);
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. DELETE CONTROL (DELETE)
  const handleDelete = async () => {
    if (!deletingControl) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await fetch(`${API_BASE_URL}/project-controls/${deletingControl.uuid}`, {
        method: 'DELETE',
        headers: authHeaders()
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to delete control entry');
      }

      setSuccessMsg('Control metric deleted successfully!');
      await fetchControls(currentPage, pageLimit, selectedProjectUuid);
      await fetchSummary(selectedProjectUuid);
      setIsDeleteModalOpen(false);
      setDeletingControl(null);
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
            <Link href="/dashboard" className="flex items-center hover:text-blue-600 transition-colors">
              <Home className="w-4 h-4 mr-1 text-slate-600" /> Dashboard
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="hover:text-blue-600 cursor-pointer">Projects</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-900">Controls</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Project Control Management</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Project Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-600">Project:</span>
            <select
              value={selectedProjectUuid}
              onChange={(e) => { setSelectedProjectUuid(e.target.value); setCurrentPage(1); }}
              className="bg-white border border-slate-300 text-slate-800 text-sm font-semibold rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:border-blue-600"
            >
              {projects.map((p) => (
                <option key={p.uuid} value={p.uuid}>
                  {p.projectName || p.name || `Project ${p.id}`}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> New Control Metric
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-700 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
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
                    <th className="py-3.5 px-4 text-center">Actions</th>
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
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(ctrl)}
                              title="Edit Metric"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setDeletingControl(ctrl); setIsDeleteModalOpen(true); }}
                              title="Delete Metric"
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No control records available for this project.
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
        </div>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Add Control Metric</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Control Type *</label>
                <select
                  value={formData.controlType}
                  onChange={(e) => setFormData({ ...formData, controlType: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600"
                >
                  <option value="Cost">Cost</option>
                  <option value="Schedule">Schedule</option>
                  <option value="Quality">Quality</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Threshold Target *</label>
                <input
                  type="number"
                  name="thresholdTarget"
                  step="any"
                  required
                  placeholder="e.g. 500000"
                  value={formData.thresholdTarget}
                  onChange={(e) => setFormData({ ...formData, thresholdTarget: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Actual Value *</label>
                <input
                  type="number"
                  name="actualValue"
                  step="any"
                  required
                  placeholder="e.g. 480000"
                  value={formData.actualValue}
                  onChange={(e) => setFormData({ ...formData, actualValue: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Corrective Action / Notes</label>
                <textarea
                  name="actionStep"
                  rows={3}
                  placeholder="Steps taken or mitigation plan..."
                  value={formData.actionStep}
                  onChange={(e) => setFormData({ ...formData, actionStep: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Metric'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && editingControl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Edit Control Metric ({editingControl.code})</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Control Type *</label>
                <select
                  value={editFormData.controlType}
                  onChange={(e) => setEditFormData({ ...editFormData, controlType: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600"
                >
                  <option value="Cost">Cost</option>
                  <option value="Schedule">Schedule</option>
                  <option value="Quality">Quality</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Threshold Target *</label>
                <input
                  type="number"
                  name="editThresholdTarget"
                  step="any"
                  required
                  value={editFormData.thresholdTarget}
                  onChange={(e) => setEditFormData({ ...editFormData, thresholdTarget: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Actual Value *</label>
                <input
                  type="number"
                  name="editActualValue"
                  step="any"
                  required
                  value={editFormData.actualValue}
                  onChange={(e) => setEditFormData({ ...editFormData, actualValue: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Corrective Action / Notes</label>
                <textarea
                  name="editActionStep"
                  rows={3}
                  value={editFormData.actionStep}
                  onChange={(e) => setEditFormData({ ...editFormData, actionStep: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Update Metric'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && deletingControl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-center text-slate-900 text-lg mb-1">Delete Control Metric?</h3>
            <p className="text-slate-500 text-center text-sm mb-6">
              Are you sure you want to delete <span className="font-semibold text-slate-800">{deletingControl.code}</span> ({deletingControl.controlType})?
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl shadow-sm disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
