'use client';

import React, { useState } from 'react';
import { 
  ChevronRight, 
  Calendar, 
  FileSpreadsheet, 
  FileText, 
  ArrowLeft,
  X 
} from 'lucide-react';

interface DayBookRow {
  id: number;
  date: string;
  project: string;
  description: string;
  voucherNo: string;
  debit: number;
  credit: number;
  note: string;
}

export default function DayBookReport() {
  // Filter States
  const [selectDate, setSelectDate] = useState<string>('17 September, 2026 - 17 September, 2026');
  const [company, setCompany] = useState<string>('Somikoron IT Ltd');
  const [project, setProject] = useState<string>('Select Project');
  const [site, setSite] = useState<string>('Select Site');
  const [voucherType, setVoucherType] = useState<string>('Invoice Type');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination & Display States
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Day Book Data matching the image exactly
  const [reportData] = useState<DayBookRow[]>([
    { id: 1, date: '2026-09-17', project: 'Rifat Eyecon City', description: '100-001-002-001 - Cash', voucherNo: 'Contra-CON00003', debit: 33.00, credit: 0.00, note: 'test' },
    { id: 2, date: '2026-09-17', project: 'Rifat Eyecon City', description: '100-001-002-001 - Cash', voucherNo: 'Contra-CON00003', debit: 0.00, credit: 33.00, note: 'test' },
    { id: 3, date: '2026-09-17', project: 'Rifat Eyecon City', description: '100-001-002-001 - Cash', voucherNo: 'Contra-CON00004', debit: 1.00, credit: 0.00, note: '' },
    { id: 4, date: '2026-09-17', project: 'Rifat Eyecon City', description: '100-001-002-001 - Cash', voucherNo: 'Contra-CON00004', debit: 0.00, credit: 1.00, note: '' },
    { id: 5, date: '2026-09-17', project: 'Rifat Eyecon City', description: 'ST8411609 - Mr. Reza', voucherNo: 'Journal-P00005', debit: 2.00, credit: 0.00, note: '' },
    { id: 6, date: '2026-09-17', project: 'Rifat Eyecon City', description: 'ST8411609 - Mr. Reza', voucherNo: 'Journal-P00005', debit: 0.00, credit: 2.00, note: '' },
  ]);

  // Filter Logic based on search input
  const filteredData = reportData.filter(row => {
    const matchesSearch = 
      row.voucherNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.note.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentTableData = filteredData.slice(startIndex, startIndex + entriesPerPage);

  // Computed Totals for Footer Row
  const totalDebit = filteredData.reduce((acc, curr) => acc + curr.debit, 0);
  const totalCredit = filteredData.reduce((acc, curr) => acc + curr.credit, 0);

  // Action Handlers
  const handleExportExcel = (): void => {
    alert('Exporting Day Book Report as Excel spreadsheet...');
  };

  const handleExportPDF = (): void => {
    alert('Generating Day Book Report PDF...');
  };

  const handleBackToPrevious = (): void => {
    alert('Navigating back to previous page...');
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 font-sans text-slate-800">
      <div className="space-y-6">
        
        {/* Top Header with Breadcrumbs & Back Button */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center text-sm text-slate-600 space-x-2">
            <span className="hover:text-blue-600 cursor-pointer">Home</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="hover:text-blue-600 cursor-pointer">Accounts Module (Report)</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-900">Day Book</span>
          </div>

          <button 
            onClick={handleBackToPrevious}
            className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg flex items-center space-x-2 shadow transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Previous</span>
          </button>
        </div>

        {/* Main Card Container */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 space-y-6">
          
          {/* Top Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
            
            {/* Select Date */}
            <div>
              <label className="block text-slate-600 font-medium mb-1.5">Select Date</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={selectDate} 
                  onChange={(e) => setSelectDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white text-slate-700 focus:outline-none focus:border-purple-500"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Company with Clear Action */}
            <div>
              <label className="block text-slate-600 font-medium mb-1.5">Company</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={company} 
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white text-slate-700 focus:outline-none focus:border-purple-500 pr-10"
                />
                <button 
                  onClick={() => setCompany('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Project */}
            <div>
              <label className="block text-slate-600 font-medium mb-1.5">Project</label>
              <select 
                value={project} 
                onChange={(e) => setProject(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white text-slate-700 focus:outline-none focus:border-purple-500"
              >
                <option value="Select Project">Select Project</option>
                <option value="Rifat Eyecon City">Rifat Eyecon City</option>
                <option value="Sheba Eyecon Tower">Sheba Eyecon Tower</option>
              </select>
            </div>

            {/* Site */}
            <div>
              <label className="block text-slate-600 font-medium mb-1.5">Site</label>
              <select 
                value={site} 
                onChange={(e) => setSite(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white text-slate-700 focus:outline-none focus:border-purple-500"
              >
                <option value="Select Site">Select Site</option>
                <option value="Main Site">Main Site</option>
              </select>
            </div>

            {/* Voucher Type */}
            <div>
              <label className="block text-slate-600 font-medium mb-1.5">Voucher Type</label>
              <select 
                value={voucherType} 
                onChange={(e) => setVoucherType(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white text-slate-700 focus:outline-none focus:border-purple-500"
              >
                <option value="Invoice Type">Invoice Type</option>
                <option value="Contra">Contra</option>
                <option value="Journal">Journal</option>
              </select>
            </div>

          </div>

          {/* Action Export Buttons Bar */}
          <div className="flex items-center space-x-2 pt-2">
            <button 
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button 
              onClick={handleExportPDF}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow transition"
            >
              <FileText className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>

          {/* Table Controls (Show entries & Search) */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center text-sm text-slate-600 space-x-2">
              <span>Show</span>
              <select 
                value={entriesPerPage} 
                onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600 font-medium">Search:</span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search transactions..."
                className="border border-slate-300 rounded-lg px-4 py-2 text-sm w-full sm:w-64 focus:outline-none focus:border-purple-500" 
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto border border-[#7b68ee]/40 rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#6b58e8] text-white font-bold tracking-wide">
                  <th className="p-3.5 border-r border-purple-400 w-16 text-center whitespace-nowrap">SL.</th>
                  <th className="p-3.5 border-r border-purple-400 whitespace-nowrap">DATE</th>
                  <th className="p-3.5 border-r border-purple-400 whitespace-nowrap">PROJECT</th>
                  <th className="p-3.5 border-r border-purple-400 whitespace-nowrap">DESCRIPTION</th>
                  <th className="p-3.5 border-r border-purple-400 whitespace-nowrap">VOUCHER NO.</th>
                  <th className="p-3.5 border-r border-purple-400 text-right whitespace-nowrap">DEBIT</th>
                  <th className="p-3.5 border-r border-purple-400 text-right whitespace-nowrap">CREDIT</th>
                  <th className="p-3.5 text-center whitespace-nowrap w-28">NOTE</th>
                </tr>
              </thead>
              <tbody className="bg-white text-slate-700">
                {currentTableData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 italic bg-slate-50 text-base">
                      No matching day book records found.
                    </td>
                  </tr>
                ) : (
                  currentTableData.map((row) => (
                    <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 border-r text-center font-medium">{row.id}</td>
                      <td className="p-3.5 border-r">{row.date}</td>
                      <td className="p-3.5 border-r">{row.project}</td>
                      <td className="p-3.5 border-r text-blue-600 font-semibold cursor-pointer hover:underline">{row.description}</td>
                      <td className="p-3.5 border-r text-blue-600 font-medium cursor-pointer hover:underline">{row.voucherNo}</td>
                      <td className="p-3.5 border-r text-right font-medium">
                        {row.debit > 0 ? row.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
                      </td>
                      <td className="p-3.5 border-r text-right font-medium">
                        {row.credit > 0 ? row.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
                      </td>
                      <td className="p-3.5 text-center text-slate-500">{row.note}</td>
                    </tr>
                  ))
                )}
              </tbody>
              
              {/* Table Footer Total Row matching the image highlights */}
              <tfoot>
                <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={5} className="p-3.5 text-right uppercase tracking-wider">Total:</td>
                  <td className="p-3.5 border-r text-right bg-emerald-100/70 text-emerald-900">
                    {totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 border-r text-right bg-emerald-100/70 text-emerald-900">
                    {totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Bottom Pagination Bar */}
          <div className="flex flex-wrap items-center justify-between text-sm text-slate-600 pt-2">
            <span>
              Showing {filteredData.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + entriesPerPage, filteredData.length)} of {filteredData.length} entries
            </span>
            
            <div className="flex space-x-1.5">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 rounded-lg font-medium ${currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3.5 py-1.5 rounded-lg font-semibold transition ${currentPage === pageNum ? 'bg-[#6b58e8] text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {pageNum}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`px-3 py-1.5 rounded-lg font-medium ${currentPage === totalPages || totalPages === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
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