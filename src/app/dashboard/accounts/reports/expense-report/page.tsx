'use client';

import React, { useState } from 'react';
import { 
  ChevronRight, 
  Calendar, 
  Copy, 
  FileSpreadsheet, 
  FileText, 
  ArrowLeft,
  X 
} from 'lucide-react';

interface ExpenseRow {
  id: number;
  date: string;
  voucher: string;
  description: string;
  note: string;
  amount: number;
}

export default function ExpenseReport() {
  // Filter States
  const [selectDate, setSelectDate] = useState<string>('1 September, 2026 - 30 September, 2026');
  const [company, setCompany] = useState<string>('Somikoron IT Ltd');
  const [selectProject, setSelectProject] = useState<string>('Select Project');
  const [site, setSite] = useState<string>('Select Site');
  const [task, setTask] = useState<string>('Select Task');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination & Display States
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Expense Data matching the image exactly
  const [reportData] = useState<ExpenseRow[]>([
    { id: 1, date: '03 Sept 2026', voucher: 'MU00005', description: 'Cost of Goods Sold (COGS)', note: '', amount: 82.00 },
    { id: 2, date: '07 Sept 2026', voucher: 'MU00006', description: 'Rod Consumption', note: '', amount: 9840.00 },
    { id: 3, date: '07 Sept 2026', voucher: 'MU00006', description: 'Rod Consumption', note: '', amount: 7920.00 },
    { id: 4, date: '07 Sept 2026', voucher: 'MU7997797', description: 'Bricks Consumption', note: '', amount: 13000.00 },
    { id: 5, date: '07 Sept 2026', voucher: 'MU8733018', description: 'Bricks Consumption', note: '', amount: 13000.00 },
    { id: 6, date: '07 Sept 2026', voucher: 'MU8733019', description: 'Bricks Consumption', note: '', amount: 13000.00 },
    { id: 7, date: '07 Sept 2026', voucher: 'MU8733020', description: 'Bricks Consumption', note: '', amount: 6000.00 },
    { id: 8, date: '07 Sept 2026', voucher: 'MU8733021', description: 'Sand Consumption', note: '', amount: 1602.00 },
    { id: 9, date: '13 Sept 2026', voucher: 'MU8733022', description: 'Rod Consumption', note: '', amount: 820.00 },
  ]);

  // Filter Logic
  const filteredData = reportData.filter(row => {
    const matchesSearch = 
      row.voucher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.date.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentTableData = filteredData.slice(startIndex, startIndex + entriesPerPage);

  // Computed Total Amount
  const totalAmount = filteredData.reduce((acc, curr) => acc + curr.amount, 0);

  // Action Handlers
  const handleExportAction = (type: string): void => {
    alert(`Triggering ${type} export for Expense Report...`);
  };

  const handleBackToPrevious = (): void => {
    alert('Navigating back to previous page...');
  };

  const handleSummaryClick = (): void => {
    alert('Displaying Expense Summary view...');
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
            <span className="font-semibold text-slate-900">Expense Report</span>
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

            {/* Select Project */}
            <div>
              <label className="block text-slate-600 font-medium mb-1.5">Select Project</label>
              <select 
                value={selectProject} 
                onChange={(e) => setSelectProject(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white text-slate-700 focus:outline-none focus:border-purple-500"
              >
                <option value="Select Project">Select Project</option>
                <option value="Sheba Eyecon Tower">Sheba Eyecon Tower</option>
                <option value="Lake Garden">Lake Garden</option>
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

            {/* Task */}
            <div>
              <label className="block text-slate-600 font-medium mb-1.5">Task</label>
              <select 
                value={task} 
                onChange={(e) => setTask(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white text-slate-700 focus:outline-none focus:border-purple-500"
              >
                <option value="Select Task">Select Task</option>
                <option value="Construction">Construction</option>
              </select>
            </div>

          </div>

          {/* Action Export Buttons and Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleExportAction('Copy')}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-md flex items-center space-x-1.5 shadow transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
              <button 
                onClick={() => handleExportAction('CSV')}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-md flex items-center space-x-1.5 shadow transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button 
                onClick={() => handleExportAction('Excel')}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-md flex items-center space-x-1.5 shadow transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
              <button 
                onClick={() => handleExportAction('PDF')}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-md flex items-center space-x-1.5 shadow transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
            </div>

            <button 
              onClick={handleSummaryClick}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-semibold px-5 py-2 rounded-lg shadow transition"
            >
              Summary
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
                placeholder="Search vouchers..."
                className="border border-slate-300 rounded-lg px-4 py-2 text-sm w-full sm:w-64 focus:outline-none focus:border-purple-500" 
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto border border-[#7b68ee]/40 rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#6b58e8] text-white font-bold tracking-wide">
                  <th className="p-3.5 border-r border-purple-400 w-16 whitespace-nowrap">ID</th>
                  <th className="p-3.5 border-r border-purple-400 whitespace-nowrap">DATE</th>
                  <th className="p-3.5 border-r border-purple-400 whitespace-nowrap">VOUCHER</th>
                  <th className="p-3.5 border-r border-purple-400 whitespace-nowrap">DESCRIPTION</th>
                  <th className="p-3.5 border-r border-purple-400 whitespace-nowrap">NOTE</th>
                  <th className="p-3.5 text-right whitespace-nowrap">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="bg-white text-slate-700">
                {currentTableData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 italic bg-slate-50 text-base">
                      No matching expense report records found.
                    </td>
                  </tr>
                ) : (
                  currentTableData.map((row) => (
                    <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 border-r font-medium">{row.id}</td>
                      <td className="p-3.5 border-r">{row.date}</td>
                      <td className="p-3.5 border-r text-blue-600 font-semibold cursor-pointer hover:underline">{row.voucher}</td>
                      <td className="p-3.5 border-r text-blue-600 font-medium">{row.description}</td>
                      <td className="p-3.5 border-r text-slate-400">{row.note}</td>
                      <td className="p-3.5 text-right font-semibold">{row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                )}
              </tbody>
              
              {/* Table Footer Total Row */}
              <tfoot>
                <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={5} className="p-3.5 text-right uppercase tracking-wider">TOTAL</td>
                  <td className="p-3.5 text-right">{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
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