'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Home, 
  ChevronRight, 
  Plus, 
  Search, 
  DollarSign, 
  Receipt, 
  X, 
  Upload, 
  Paperclip,
  Wallet,
  Tag,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Edit,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { getStoredAccessToken } from '@/lib/admin-auth/adminAuthStorage';

// Backend API Response Types
interface ApiCost {
  uuid: string;
  uid: string;
  id: string;
  projectUuid: string;
  costCode: string;
  costHead: 'Material' | 'Labour' | 'Equipment' | 'Consultant' | 'Overhead';
  amount: string | number;
  incurredAt: string;
  refType: 'BILL' | 'JOURNAL' | 'PO' | 'MANUAL';
  refUuid?: string;
  refNo: string;
  description?: string;
  attachmentUrl?: string;
  approvedBy: string;
  createdAt: string;
}

interface ProjectCost {
  uuid: string;
  code: string;
  costHead: string;
  amount: number;
  incurredAt: string;
  refType: string;
  refNo: string;
  approvedBy: string;
  hasAttachment: boolean;
  description?: string;
}

interface SummaryData {
  totalIncurredCost: number;
  voucherCount: number;
  attachmentsIncluded: number;
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

export default function ProjectCostPage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/realbizpro/api/v1';

  // State
  const [costs, setCosts] = useState<ProjectCost[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectUuid, setSelectedProjectUuid] = useState<string>('');
  const [summary, setSummary] = useState<SummaryData>({ totalIncurredCost: 0, voucherCount: 0, attachmentsIncluded: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCostHead, setSelectedCostHead] = useState<string>('All');
  const [selectedRefType, setSelectedRefType] = useState<string>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<ProjectCost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectCost | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    costHead: 'Material' as string,
    amount: '',
    incurredAt: new Date().toISOString().split('T')[0],
    refType: 'BILL' as string,
    refNo: '',
    refUuid: '',
    description: '',
    hasAttachment: false
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

  // 2. FETCH COSTS (GET)
  const fetchCosts = async (page = 1, limit = 10, projectUuid = selectedProjectUuid) => {
    if (!projectUuid) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let url = `${API_BASE_URL}/project-costs?projectUuid=${projectUuid}&page=${page}&limit=${limit}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (selectedCostHead !== 'All') url += `&costHead=${selectedCostHead}`;
      if (selectedRefType !== 'All') url += `&refType=${selectedRefType}`;

      const response = await fetch(url, { headers: getHeaders() });
      const result = await response.json();
      
      let rawCosts: ApiCost[] = [];
      let metaData: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };
      
      if (result.success && Array.isArray(result.data)) {
        rawCosts = result.data;
        metaData = result.meta || { total: result.data.length, page, limit, totalPages: Math.ceil(result.data.length / limit) };
      } else if (Array.isArray(result.data)) {
        rawCosts = result.data;
        metaData = result.meta || { total: result.data.length, page, limit, totalPages: Math.ceil(result.data.length / limit) };
      } else if (Array.isArray(result)) {
        rawCosts = result;
        metaData = { total: result.length, page, limit, totalPages: Math.ceil(result.length / limit) };
      } else if (result.data && Array.isArray(result.data.data)) {
        rawCosts = result.data.data;
        metaData = result.data.meta || { total: rawCosts.length, page, limit, totalPages: Math.ceil(rawCosts.length / limit) };
      }

      const mappedCosts: ProjectCost[] = rawCosts.map((c) => ({
        uuid: c.uuid || c.id,
        code: c.costCode || 'N/A',
        costHead: c.costHead || 'Unknown',
        amount: parseFloat(String(c.amount || 0)) || 0,
        incurredAt: c.incurredAt || new Date().toISOString(),
        refType: c.refType || 'MANUAL',
        refNo: c.refNo || 'N/A',
        approvedBy: c.approvedBy || 'N/A',
        hasAttachment: !!c.attachmentUrl,
        description: c.description,
      }));
      
      setCosts(mappedCosts);
      setMeta(metaData);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching costs:", error);
      setErrorMsg("Failed to load cost data. Please check your connection.");
      setCosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. FETCH SUMMARY
  const fetchSummary = async (projectUuid = selectedProjectUuid) => {
    if (!projectUuid) return;
    try {
      const response = await fetch(`${API_BASE_URL}/project-costs/summary?projectUuid=${projectUuid}`, {
        headers: getHeaders()
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        setSummary(result.data);
      } else if (result.data) {
        setSummary(result.data);
      } else if (result.totalIncurredCost !== undefined) {
        setSummary(result);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  useEffect(() => {
    if (selectedProjectUuid) {
      fetchCosts(currentPage, pageLimit, selectedProjectUuid);
      fetchSummary(selectedProjectUuid);
    }
  }, [selectedProjectUuid, currentPage, pageLimit, searchQuery, selectedCostHead, selectedRefType]);

  // 4. CREATE COST (POST)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectUuid) {
      setErrorMsg('Please select a project first.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);

    const amountNum = parseFloat(formData.amount) || 0;
    const isoDate = new Date(formData.incurredAt).toISOString();

    const payload = {
      projectUuid: selectedProjectUuid,
      costCode: `CST-${Math.floor(1000 + Math.random() * 9000)}`,
      costHead: formData.costHead,
      amount: amountNum,
      incurredAt: isoDate,
      refType: formData.refType,
      refUuid: formData.refUuid || null,
      refNo: formData.refNo || null,
      description: formData.description,
      attachmentUrl: formData.hasAttachment ? 'dummy-attachment-url.pdf' : null,
      approvedBy: 'Shamim Khan',
      addedBy: 'Admin',
      addedById: 'admin-uuid'
    };

    try {
      const response = await fetch(`${API_BASE_URL}/project-costs`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to create cost entry');
      }

      await fetchCosts(1, pageLimit, selectedProjectUuid);
      await fetchSummary(selectedProjectUuid);
      setIsModalOpen(false);
      notifySuccess('Cost entry created successfully!');
      
      setFormData({
        costHead: 'Material',
        amount: '',
        incurredAt: new Date().toISOString().split('T')[0],
        refType: 'BILL',
        refNo: '',
        refUuid: '',
        description: '',
        hasAttachment: false
      });
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. UPDATE COST (PATCH)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCost) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const response = await fetch(`${API_BASE_URL}/project-costs/${editingCost.uuid}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          amount: Number(editingCost.amount),
          description: editingCost.description,
          refNo: editingCost.refNo
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update cost');
      }

      await fetchCosts(currentPage, pageLimit, selectedProjectUuid);
      await fetchSummary(selectedProjectUuid);
      setEditingCost(null);
      notifySuccess('Cost updated successfully!');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. DELETE COST (DELETE)
  const handleDeleteCost = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/project-costs/${deleteTarget.uuid}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to delete cost entry');
      }

      setCosts(costs.filter(c => c.uuid !== deleteTarget.uuid));
      setDeleteTarget(null);
      await fetchSummary(selectedProjectUuid);
      notifySuccess('Cost entry deleted successfully!');
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
            <span className="font-semibold text-slate-900">Project Cost</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Project Cost (Expenses) Management</h1>
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
            <Plus className="w-4 h-4" /> Add Expense Voucher
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Incurred Cost</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">${formatCurrency(summary.totalIncurredCost)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Vouchers</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{summary.voucherCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attached Invoices</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{summary.attachmentsIncluded}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Paperclip className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden">
        
        {/* Filters */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Cost Head:</label>
              <select
                value={selectedCostHead}
                onChange={(e) => { setSelectedCostHead(e.target.value); setCurrentPage(1); }}
                className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-blue-600 shadow-sm cursor-pointer capitalize"
              >
                <option value="All">All Heads</option>
                <option value="Material">Material</option>
                <option value="Labour">Labour</option>
                <option value="Equipment">Equipment</option>
                <option value="Consultant">Consultant</option>
                <option value="Overhead">Overhead</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Ref Type:</label>
              <select
                value={selectedRefType}
                onChange={(e) => { setSelectedRefType(e.target.value); setCurrentPage(1); }}
                className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-blue-600 shadow-sm cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="BILL">BILL</option>
                <option value="JOURNAL">JOURNAL</option>
                <option value="PO">PO</option>
                <option value="MANUAL">MANUAL</option>
              </select>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search ref no, voucher code..."
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
            <p>Loading expense vouchers...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                    <th className="py-3.5 px-4">Cost Code</th>
                    <th className="py-3.5 px-4">Cost Head</th>
                    <th className="py-3.5 px-4">Amount ($)</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Ref Type</th>
                    <th className="py-3.5 px-4">Ref No</th>
                    <th className="py-3.5 px-4">Approved By</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {costs.length > 0 ? (
                    costs.map((c) => (
                      <tr key={c.uuid} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">{c.code}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 capitalize">{c.costHead}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">${formatCurrency(c.amount)}</td>
                        <td className="py-3.5 px-4 text-slate-600 text-xs">{new Date(c.incurredAt).toLocaleDateString()}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {c.refType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-mono text-xs">{c.refNo}</td>
                        <td className="py-3.5 px-4 text-slate-700">{c.approvedBy}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingCost(c)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Expense"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(c)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">No expense vouchers recorded.</td>
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
            <span>Showing {costs.length} of {meta.total} total vouchers</span>
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

          <span>Project Cost Module</span>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Add Expense Voucher</h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Cost Head *</label>
                  <select value={formData.costHead} onChange={(e) => setFormData({ ...formData, costHead: e.target.value })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm capitalize">
                    <option value="Material">Material</option>
                    <option value="Labour">Labour</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Overhead">Overhead</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Ref Type *</label>
                  <select value={formData.refType} onChange={(e) => setFormData({ ...formData, refType: e.target.value })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm">
                    <option value="BILL">BILL</option>
                    <option value="JOURNAL">JOURNAL</option>
                    <option value="PO">PO</option>
                    <option value="MANUAL">MANUAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Amount ($) *</label>
                <input type="number" step="0.01" required placeholder="e.g. 150000" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Incurred Date *</label>
                <input type="date" required value={formData.incurredAt} onChange={(e) => setFormData({ ...formData, incurredAt: e.target.value })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Ref No (Optional)</label>
                <input type="text" placeholder="e.g. INV-90021" value={formData.refNo} onChange={(e) => setFormData({ ...formData, refNo: e.target.value })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Description</label>
                <textarea rows={2} placeholder="Expense details..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isSubmitting ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingCost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Edit Expense — {editingCost.code}</h2>
              <button onClick={() => setEditingCost(null)} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Cost Head</label>
                <input type="text" disabled value={editingCost.costHead} className="bg-slate-100 border border-slate-200 text-slate-500 text-sm rounded-xl px-3.5 py-2.5 w-full capitalize cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Amount ($) *</label>
                <input type="number" step="0.01" required value={editingCost.amount} onChange={(e) => setEditingCost({ ...editingCost, amount: parseFloat(e.target.value) || 0 })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Ref No</label>
                <input type="text" value={editingCost.refNo} onChange={(e) => setEditingCost({ ...editingCost, refNo: e.target.value })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Description</label>
                <textarea rows={2} value={editingCost.description || ''} onChange={(e) => setEditingCost({ ...editingCost, description: e.target.value })} className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm" />
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setEditingCost(null)} className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-sm">
                  {isSubmitting ? 'Updating...' : 'Update Expense'}
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
            <h3 className="text-lg font-bold text-slate-900 mb-1">Delete Expense Voucher?</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete <span className="font-semibold text-slate-800">{deleteTarget.costHead}</span> ({deleteTarget.code})?</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={handleDeleteCost} disabled={isSubmitting} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-sm">
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
