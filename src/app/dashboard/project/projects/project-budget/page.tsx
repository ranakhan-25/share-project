'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Home, 
  ChevronRight, 
  Plus, 
  Search, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  BarChart3,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Edit,
  Trash2
} from 'lucide-react';
import { getStoredAccessToken } from '@/lib/admin-auth/adminAuthStorage';

// Backend Response Type
interface ApiBudget {
  uuid: string;
  id: string;
  projectUuid: string;
  budgetCode: string;
  category: 'Material' | 'Labour' | 'Equipment' | 'Overhead' | 'Subcontractor';
  plannedAmount: string | number;
  revisedAmount: string | number;
  status: 'On Track' | 'Warning' | 'Exceeded';
  varianceAmount?: number;
  variancePercent?: number;
  createdAt: string;
}

// Frontend UI Type
interface ProjectBudget {
  uuid: string;
  code: string;
  category: string;
  plannedAmount: number;
  revisedAmount: number;
  variance: number;
  variancePct: number;
  status: 'On Track' | 'Warning' | 'Exceeded';
}

interface SummaryData {
  plannedTotal: number;
  revisedTotal: number;
  totalVariance: number;
  variancePercent: string;
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

export default function ProjectBudgetPage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/realbizpro/api/v1';

  // State
  const [budgets, setBudgets] = useState<ProjectBudget[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectUuid, setSelectedProjectUuid] = useState<string>('');
  const [summary, setSummary] = useState<SummaryData>({ plannedTotal: 0, revisedTotal: 0, totalVariance: 0, variancePercent: '0' });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<ProjectBudget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectBudget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    category: 'Material' as string,
    plannedAmount: '',
    revisedAmount: ''
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

  // 2. FETCH BUDGETS (GET)
  const fetchBudgets = async (page = 1, limit = 10, projectUuid = selectedProjectUuid) => {
    if (!projectUuid) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let url = `${API_BASE_URL}/project-budgets?projectUuid=${projectUuid}&page=${page}&limit=${limit}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (selectedCategory !== 'All') url += `&category=${selectedCategory}`;
      if (selectedStatus !== 'All') url += `&status=${selectedStatus}`;

      const response = await fetch(url, { headers: getHeaders() });
      const result = await response.json();
      
      let rawBudgets: ApiBudget[] = [];
      let metaData: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };
      
      if (Array.isArray(result)) {
        rawBudgets = result;
        metaData = { total: result.length, page, limit, totalPages: Math.ceil(result.length / limit) };
      } else if (result.success && Array.isArray(result.data)) {
        rawBudgets = result.data;
        metaData = result.meta || { total: result.data.length, page, limit, totalPages: Math.ceil(result.data.length / limit) };
      } else if (Array.isArray(result.data)) {
        rawBudgets = result.data;
        metaData = result.meta || { total: result.data.length, page, limit, totalPages: Math.ceil(result.data.length / limit) };
      } else if (result.data && Array.isArray(result.data.data)) {
        rawBudgets = result.data.data;
        metaData = result.data.meta || result.meta || { total: result.data.data.length, page, limit, totalPages: Math.ceil(result.data.data.length / limit) };
      }

      const mappedBudgets: ProjectBudget[] = rawBudgets.map((b) => {
        const planned = parseFloat(String(b.plannedAmount || 0)) || 0;
        const revised = parseFloat(String(b.revisedAmount || planned)) || planned;
        const variance = b.varianceAmount !== undefined ? b.varianceAmount : (revised - planned);
        const variancePct = b.variancePercent !== undefined ? b.variancePercent : (planned > 0 ? (variance / planned) * 100 : 0);

        return {
          uuid: b.uuid || b.id,
          code: b.budgetCode || 'N/A',
          category: b.category || 'Unknown',
          plannedAmount: planned,
          revisedAmount: revised,
          variance: variance,
          variancePct: Number(variancePct),
          status: b.status || 'On Track',
        };
      });
      
      setBudgets(mappedBudgets);
      setMeta(metaData);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      setErrorMsg("Failed to load budgets. Please check your connection.");
      setBudgets([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. FETCH SUMMARY
  const fetchSummary = async (projectUuid = selectedProjectUuid) => {
    if (!projectUuid) return;
    try {
      const response = await fetch(`${API_BASE_URL}/project-budgets/summary?projectUuid=${projectUuid}`, {
        headers: getHeaders()
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        setSummary(result.data);
      } else if (result.data) {
        setSummary(result.data);
      } else if (result.plannedTotal !== undefined) {
        setSummary(result);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  useEffect(() => {
    if (selectedProjectUuid) {
      fetchBudgets(currentPage, pageLimit, selectedProjectUuid);
      fetchSummary(selectedProjectUuid);
    }
  }, [selectedProjectUuid, currentPage, pageLimit, searchQuery, selectedCategory, selectedStatus]);

  // 4. CREATE BUDGET (POST)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectUuid) {
      setErrorMsg('Please select a project first.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);

    const plannedNum = parseFloat(formData.plannedAmount) || 0;
    const revisedNum = parseFloat(formData.revisedAmount) || plannedNum;
    const generatedCode = `BGT-${Math.floor(1000 + Math.random() * 9000)}`;

    const payload = {
      projectUuid: selectedProjectUuid,
      budgetCode: generatedCode,
      category: formData.category,
      plannedAmount: plannedNum,
      revisedAmount: revisedNum,
      status: 'On Track',
      addedBy: 'Admin',
      addedById: 'admin-uuid'
    };

    try {
      const response = await fetch(`${API_BASE_URL}/project-budgets`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create budget');
      }

      await fetchBudgets(1, pageLimit, selectedProjectUuid);
      await fetchSummary(selectedProjectUuid);
      setIsModalOpen(false);
      notifySuccess('Budget category created successfully!');
      
      setFormData({ category: 'Material', plannedAmount: '', revisedAmount: '' });
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. UPDATE BUDGET (PATCH)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const response = await fetch(`${API_BASE_URL}/project-budgets/${editingBudget.uuid}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          plannedAmount: Number(editingBudget.plannedAmount),
          revisedAmount: Number(editingBudget.revisedAmount),
          status: editingBudget.status
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update budget');
      }

      await fetchBudgets(currentPage, pageLimit, selectedProjectUuid);
      await fetchSummary(selectedProjectUuid);
      setEditingBudget(null);
      notifySuccess('Budget updated successfully!');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. DELETE BUDGET (DELETE)
  const handleDeleteBudget = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/project-budgets/${deleteTarget.uuid}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to delete budget');
      }

      setBudgets(budgets.filter(b => b.uuid !== deleteTarget.uuid));
      setDeleteTarget(null);
      await fetchSummary(selectedProjectUuid);
      notifySuccess('Budget deleted successfully!');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatting helper
  const formatCurrency = (val: number) => {
    return (val || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-8 font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <nav className="flex items-center text-sm text-slate-500 space-x-2 mb-1">
            <Link href="/dashboard" className="flex items-center hover:text-blue-600 transition-colors">
              <Home className="w-4 h-4 mr-1 text-slate-600" /> Dashboard
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-900">Project Budget</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Project Budget Management</h1>
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
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> New Budget Category
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
        <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Planned Total Budget</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">${formatCurrency(summary.plannedTotal)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Revised Total Budget</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">${formatCurrency(summary.revisedTotal)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Variance ($)</p>
            <p className={`text-2xl font-bold mt-1 ${summary.totalVariance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {summary.totalVariance > 0 ? '+' : ''}${formatCurrency(summary.totalVariance)}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${summary.totalVariance > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {summary.totalVariance > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Variance (%)</p>
            <p className={`text-2xl font-bold mt-1 ${Number(summary.variancePercent) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {Number(summary.variancePercent) > 0 ? '+' : ''}{summary.variancePercent}%
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <PieChart className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden">
        
        {/* Filters */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-blue-600 shadow-sm cursor-pointer capitalize"
              >
                <option value="All">All Categories</option>
                <option value="Material">Material</option>
                <option value="Labour">Labour</option>
                <option value="Equipment">Equipment</option>
                <option value="Overhead">Overhead</option>
                <option value="Subcontractor">Subcontractor</option>
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
                <option value="On Track">On Track</option>
                <option value="Warning">Warning</option>
                <option value="Exceeded">Exceeded</option>
              </select>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search category or ID..."
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
            <p>Loading budget data...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Planned Amount</th>
                    <th className="py-3.5 px-4">Revised Amount</th>
                    <th className="py-3.5 px-4">Variance ($)</th>
                    <th className="py-3.5 px-4">Variance (%)</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {budgets.length > 0 ? (
                    budgets.map((bgt) => (
                      <tr key={bgt.uuid} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">{bgt.code}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 capitalize">{bgt.category}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">${formatCurrency(bgt.plannedAmount)}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">${formatCurrency(bgt.revisedAmount)}</td>
                        <td className="py-3.5 px-4 font-semibold">
                          <span className={bgt.variance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                            {bgt.variance > 0 ? '+' : ''}${formatCurrency(bgt.variance)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold">
                          <span className={bgt.variancePct > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                            {bgt.variancePct > 0 ? '+' : ''}{bgt.variancePct.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {bgt.status === 'On Track' && (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> On Track
                            </span>
                          )}
                          {bgt.status === 'Warning' && (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5" /> Warning
                            </span>
                          )}
                          {bgt.status === 'Exceeded' && (
                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5" /> Exceeded
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingBudget(bgt)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Budget"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(bgt)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Budget"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">No budget entries found.</td>
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
            <span>Showing {budgets.length} of {meta.total} total categories</span>
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

          <span>Project Budget Module</span>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Add Budget Category</h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Category *</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm capitalize">
                  <option value="Material">Material</option>
                  <option value="Labour">Labour</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Overhead">Overhead</option>
                  <option value="Subcontractor">Subcontractor</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Planned Amount ($) *</label>
                <input type="number" step="0.01" required placeholder="e.g. 500000" value={formData.plannedAmount} onChange={(e) => setFormData({ ...formData, plannedAmount: e.target.value })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Revised Amount ($) (Optional)</label>
                <input type="number" step="0.01" placeholder="Leave blank to match planned" value={formData.revisedAmount} onChange={(e) => setFormData({ ...formData, revisedAmount: e.target.value })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isSubmitting ? 'Saving...' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Edit Budget — {editingBudget.code}</h2>
              <button onClick={() => setEditingBudget(null)} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Category</label>
                <input type="text" disabled value={editingBudget.category} className="bg-slate-100 border border-slate-200 text-slate-500 text-sm rounded-xl px-3.5 py-2.5 w-full capitalize cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Planned Amount ($) *</label>
                <input type="number" step="0.01" required value={editingBudget.plannedAmount} onChange={(e) => setEditingBudget({ ...editingBudget, plannedAmount: parseFloat(e.target.value) || 0 })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Revised Amount ($) *</label>
                <input type="number" step="0.01" required value={editingBudget.revisedAmount} onChange={(e) => setEditingBudget({ ...editingBudget, revisedAmount: parseFloat(e.target.value) || 0 })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Status</label>
                <select value={editingBudget.status} onChange={(e) => setEditingBudget({ ...editingBudget, status: e.target.value as any })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm">
                  <option value="On Track">On Track</option>
                  <option value="Warning">Warning</option>
                  <option value="Exceeded">Exceeded</option>
                </select>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setEditingBudget(null)} className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-sm">
                  {isSubmitting ? 'Updating...' : 'Update Budget'}
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
            <h3 className="text-lg font-bold text-slate-900 mb-1">Delete Budget?</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete <span className="font-semibold text-slate-800">{deleteTarget.category}</span> ({deleteTarget.code})?</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={handleDeleteBudget} disabled={isSubmitting} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-sm">
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
