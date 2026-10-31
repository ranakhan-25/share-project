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
  ChevronRight as ChevronRightIcon
} from 'lucide-react';

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

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ProjectCostPage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/realbizpro/api/v1';
  const DEFAULT_PROJECT_UUID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

  // State
  const [costs, setCosts] = useState<ProjectCost[]>([]);
  const [summary, setSummary] = useState<SummaryData>({ totalIncurredCost: 0, voucherCount: 0, attachmentsIncluded: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  // 1. FETCH COSTS (GET List with Filters & Pagination) - ROBUST
  const fetchCosts = async (page = 1, limit = 10) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let url = `${API_BASE_URL}/project-costs?projectUuid=${DEFAULT_PROJECT_UUID}&page=${page}&limit=${limit}`;
      
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (selectedCostHead !== 'All') url += `&costHead=${selectedCostHead}`;
      if (selectedRefType !== 'All') url += `&refType=${selectedRefType}`;

      console.log("Fetching URL:", url); // Debugging

      const response = await fetch(url);
      const result = await response.json();
      
      console.log("Fetched Costs Response:", result); // Debugging - Check this in Browser Console!
      
      let rawCosts: ApiCost[] = [];
      let metaData: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };
      
      // ✅ Robust Parsing: Handle multiple shapes
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

      // ✅ Safe Mapping
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

  // 2. FETCH SUMMARY (Top Cards)
  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/project-costs/summary?projectUuid=${DEFAULT_PROJECT_UUID}`);
      const result = await response.json();
      console.log("Fetched Summary:", result); // Debugging
      
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

  // Trigger fetch on filter/page changes
  useEffect(() => {
    fetchCosts(currentPage, pageLimit);
  }, [currentPage, pageLimit, searchQuery, selectedCostHead, selectedRefType]);

  useEffect(() => {
    fetchSummary();
  }, []);

  // 3. CREATE COST (POST)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const amountNum = parseFloat(formData.amount) || 0;
    const isoDate = new Date(formData.incurredAt).toISOString();

    const payload = {
      projectUuid: DEFAULT_PROJECT_UUID,
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

    console.log("POST Payload:", payload); // Debugging

    try {
      const response = await fetch(`${API_BASE_URL}/project-costs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      console.log("POST Response:", responseData); // Debugging

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to create cost entry');
      }

      // ✅ Refresh data after successful creation
      await fetchCosts(1, pageLimit);
      await fetchSummary();
      setIsModalOpen(false);
      
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

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-US', { minimumFractionDigits: 2 });
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
            <span className="font-semibold text-slate-900">Cost</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Project Cost Management</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> New Cost Entry
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Incurred Cost</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              ${formatCurrency(summary.totalIncurredCost)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost Voucher Count</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{summary.voucherCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attachments Included</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.attachmentsIncluded}</p>
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
                <option value="All">All Cost Heads</option>
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
                className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-blue-600 shadow-sm cursor-pointer uppercase"
              >
                <option value="All">All Ref Types</option>
                <option value="BILL">Bill</option>
                <option value="PO">PO</option>
                <option value="JOURNAL">Journal</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search cost, ref no, user..."
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
            <p>Loading cost data...</p>
          </div>
        ) : (
          <>
            {/* Cost Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Cost Head</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Incurred At</th>
                    <th className="py-3.5 px-4">Ref Type</th>
                    <th className="py-3.5 px-4">Ref No</th>
                    <th className="py-3.5 px-4">Approved By</th>
                    <th className="py-3.5 px-4 text-center">Attachment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {costs.length > 0 ? (
                    costs.map((item) => (
                      <tr key={item.uuid} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">{item.code}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 capitalize">
                          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                            <Tag className="w-3 h-3 text-blue-600" /> {item.costHead}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          ${formatCurrency(item.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 text-xs whitespace-nowrap">{item.incurredAt}</td>
                        <td className="py-3.5 px-4">
                          <span className="uppercase text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                            {item.refType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-800">{item.refNo}</td>
                        <td className="py-3.5 px-4 text-slate-700">{item.approvedBy}</td>
                        <td className="py-3.5 px-4 text-center">
                          {item.hasAttachment ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-50 text-blue-600 rounded-lg" title="View Attachment">
                              <Paperclip className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No cost entries found.
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
            <span>Showing {costs.length} of {meta.total} cost entries</span>
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

          <span>Project Cost Management v03.06</span>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Add Project Cost Entry</h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Cost Head *</label>
                <select
                  value={formData.costHead}
                  onChange={(e) => setFormData({ ...formData, costHead: e.target.value })}
                  className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm capitalize"
                >
                  <option value="Material">Material</option>
                  <option value="Labour">Labour</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Consultant">Consultant</option>
                  <option value="Overhead">Overhead</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Amount ($) *</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl pl-9 pr-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Incurred At Date *</label>
                <input
                  type="date"
                  required
                  value={formData.incurredAt}
                  onChange={(e) => setFormData({ ...formData, incurredAt: e.target.value })}
                  className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Reference Type *</label>
                <select
                  value={formData.refType}
                  onChange={(e) => setFormData({ ...formData, refType: e.target.value, refUuid: '' })}
                  className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm uppercase"
                >
                  <option value="BILL">Bill</option>
                  <option value="PO">PO (Purchase Order)</option>
                  <option value="JOURNAL">Journal</option>
                  <option value="MANUAL">Manual Entry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Ref No / Voucher No</label>
                <input
                  type="text"
                  placeholder="Auto-generated if left blank"
                  value={formData.refNo}
                  onChange={(e) => setFormData({ ...formData, refNo: e.target.value })}
                  className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Write cost details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div className="flex items-center pt-2">
                <label className="relative flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasAttachment}
                    onChange={(e) => setFormData({ ...formData, hasAttachment: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-slate-400" /> Include Voucher Attachment
                  </span>
                </label>
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
                  {isSubmitting ? 'Saving...' : 'Save Cost Entry'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}