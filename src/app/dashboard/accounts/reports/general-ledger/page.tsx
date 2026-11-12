'use client';

import React, { useState } from 'react';
import { 
  ChevronRight, 
  Calendar, 
  FileSpreadsheet, 
  FileText, 
  ArrowLeft,
  X,
  MoreVertical,
  Search,
  ChevronDown
} from 'lucide-react';

interface LedgerRow {
  id: string;
  date: string;
  project: string;
  description: string;
  voucherType: string;
  voucherNo: string;
  debit: number;
  credit: number;
  balance: number;
  note: string;
}

export default function GeneralLedger() {
  // Filter States
  const [selectDate, setSelectDate] = useState<string>('1 September, 2026 - 30 September, 2026');
  const [chartOfAccount, setChartOfAccount] = useState<string>('Select Chart Of Account');
  const [company, setCompany] = useState<string>('Somikoron IT Ltd');
  const [project, setProject] = useState<string>('Select Project');
  const [sitess, setSitess] = useState<string>('Select Site');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination & Display States
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // General Ledger Data matching the image exactly
  const [reportData] = useState<LedgerRow[]>([
    { id: '', date: '', project: '', description: 'Opening', voucherType: '', voucherNo: '', debit: 0, credit: 0, balance: 0.00, note: '' },
  ]);

  // Filter Logic based on search input
  const filteredData = reportData.filter(row => {
    return (
      row.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.voucherNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.note.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentTableData = filteredData.slice(startIndex, startIndex + entriesPerPage);

  // Computed Totals matching the image
  const totalDebit = filteredData.reduce((acc, curr) => acc + curr.debit, 0);
  const totalCredit = filteredData.reduce((acc, curr) => acc + curr.credit, 0);
  const totalBalance = filteredData.length > 0 ? filteredData[filteredData.length - 1].balance : 0.00;

  // Action Handlers
  const handleExportExcel = (): void => {
    alert('Exporting General Ledger Report as Excel spreadsheet...');
  };

  const handleExportPDF = (): void => {
    alert('Generating General Ledger Report PDF...');
  };

  const handleBackToPrevious = (): void => {
    alert('Navigating back to previous page...');
  };

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      <div className="mx-auto max-w-[1600px] space-y-5">
        
        {/* Top Header with Breadcrumbs & Back Button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex items-center text-xs sm:text-sm text-slate-500 gap-1.5 sm:gap-2">
            <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Home</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Accounts Module (Report)</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200/80 shadow-2xs">
              General Ledger
            </span>
          </nav>

          <button 
            onClick={handleBackToPrevious}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-700 hover:shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Previous</span>
          </button>
        </div>

        {/* Main Card Container */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-6">
          
          {/* Top Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            
            {/* Select Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Select Date
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={selectDate} 
                  onChange={(e) => setSelectDate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-3.5 pr-9 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Chart Of Account */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Chart Of Account
              </label>
              <div className="relative">
                <select 
                  value={chartOfAccount} 
                  onChange={(e) => setChartOfAccount(e.target.value)}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 pl-3.5 pr-8 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                >
                  <option value="Select Chart Of Account">Select Chart Of Account</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Accounts">Bank Accounts</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Company with Clear Action */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Company
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={company} 
                  onChange={(e) => setCompany(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-3.5 pr-9 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                />
                {company && (
                  <button 
                    onClick={() => setCompany('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition"
                    title="Clear"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Project */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Project
              </label>
              <div className="relative">
                <select 
                  value={project} 
                  onChange={(e) => setProject(e.target.value)}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 pl-3.5 pr-8 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                >
                  <option value="Select Project">Select Project</option>
                  <option value="Rifat Eyecon City">Rifat Eyecon City</option>
                  <option value="Sheba Eyecon Tower">Sheba Eyecon Tower</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Sitess */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Sitess
              </label>
              <div className="relative">
                <select 
                  value={sitess} 
                  onChange={(e) => setSitess(e.target.value)}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 pl-3.5 pr-8 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                >
                  <option value="Select Site">Select Site</option>
                  <option value="Main Site">Main Site</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

          </div>

          {/* Action Row: Export Buttons (Left) & More Options (Right) */}
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-2xs transition hover:bg-emerald-700 active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel</span>
              </button>
              <button 
                onClick={handleExportPDF}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-2xs transition hover:bg-rose-700 active:scale-95"
              >
                <FileText className="w-4 h-4" />
                <span>PDF</span>
              </button>
            </div>

            <button 
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-2xs transition hover:bg-slate-50 hover:text-slate-800"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          {/* Entries & Search Controls Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
            <div className="flex items-center text-xs sm:text-sm text-slate-600 gap-2">
              <span>Show</span>
              <div className="relative">
                <select 
                  value={entriesPerPage} 
                  onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="h-8 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-7 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <span>entries</span>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search ledger..."
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10" 
              />
            </div>
          </div>

          {/* Data Table with Modern Header */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white text-xs font-bold tracking-wider">
                  <th className="px-3.5 py-3 text-center whitespace-nowrap w-16">ID</th>
                  <th className="px-3.5 py-3 whitespace-nowrap w-28">DATE</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">PROJECT</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">DESCRIPTION</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">VOUCHER TYPE</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">VOUCHER NO</th>
                  <th className="px-3.5 py-3 text-right whitespace-nowrap w-32">DEBIT</th>
                  <th className="px-3.5 py-3 text-right whitespace-nowrap w-32">CREDIT</th>
                  <th className="px-3.5 py-3 text-right whitespace-nowrap w-32">BALANCE</th>
                  <th className="px-3.5 py-3 text-center whitespace-nowrap w-24">NOTE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {currentTableData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-slate-400 italic bg-slate-50/50 text-sm">
                      No matching general ledger records found.
                    </td>
                  </tr>
                ) : (
                  currentTableData.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-3 text-center font-medium text-slate-500">{row.id || '—'}</td>
                      <td className="px-3.5 py-3 text-slate-600">{row.date || '—'}</td>
                      <td className="px-3.5 py-3 text-slate-600">{row.project || '—'}</td>
                      <td className="px-3.5 py-3 font-semibold text-slate-900">{row.description}</td>
                      <td className="px-3.5 py-3 text-slate-600">{row.voucherType || '—'}</td>
                      <td className="px-3.5 py-3 text-slate-600 font-mono text-xs">{row.voucherNo || '—'}</td>
                      <td className="px-3.5 py-3 text-right font-mono text-slate-700">
                        {row.debit > 0 ? row.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono text-slate-700">
                        {row.credit > 0 ? row.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-900">
                        {row.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3.5 py-3 text-center text-slate-400">{row.note || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
              
              {/* Table Footer Total Row */}
              <tfoot>
                <tr className="bg-slate-50/90 font-bold text-slate-900 border-t-2 border-slate-200">
                  <td colSpan={6} className="px-3.5 py-3 text-right uppercase tracking-wider text-xs font-extrabold text-slate-700">
                    TOTAL
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-900">
                    {totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-900">
                    {totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono font-bold text-emerald-700">
                    {totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3.5 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Bottom Pagination Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-500 pt-2 border-t border-slate-100">
            <span>
              Showing {filteredData.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + entriesPerPage, filteredData.length)} of {filteredData.length} entries
            </span>
            
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  currentPage === 1 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
                }`}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`h-8 min-w-8 px-2.5 rounded-lg text-xs font-bold transition ${
                    currentPage === pageNum 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  currentPage === totalPages || totalPages === 0 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
                }`}
              >
                Next
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
