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

interface BookRow {
  id: string;
  code: string;
  name: string;
  opening: number;
  debit: number;
  credit: number;
  balance: number;
  type: 'header' | 'item';
}

export default function CashBankBooks() {
  // Filter States
  const [selectDate, setSelectDate] = useState<string>('19 August, 2026 - 17 September, 2026');
  const [company, setCompany] = useState<string>('Somikoron IT Ltd');
  const [project, setProject] = useState<string>('Select Project');
  const [site, setSite] = useState<string>('Select Site');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cash/Bank Books Data matching the image exactly
  const [reportData] = useState<BookRow[]>([
    { id: '1', code: '100-001-001', name: 'Bank Accounts', opening: 0.00, debit: 0.00, credit: 0.00, balance: 0.00, type: 'header' },
    { id: '2', code: '100-001-002', name: 'Cash In Hand', opening: 0.00, debit: 0.00, credit: 0.00, balance: 0.00, type: 'header' },
    { id: '3', code: '100-001-002-001', name: 'Cash', opening: 0.00, debit: 34017233.66, credit: 909924.00, balance: 33107309.66, type: 'item' },
  ]);

  // Filter Logic based on search input
  const filteredData = reportData.filter(row => {
    return (
      row.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Computed Totals matching the image
  const grandOpening = reportData.reduce((acc, curr) => curr.type === 'item' ? acc + curr.opening : acc, 0);
  const grandDebit = reportData.reduce((acc, curr) => curr.type === 'item' ? acc + curr.debit : acc, 0);
  const grandCredit = reportData.reduce((acc, curr) => curr.type === 'item' ? acc + curr.credit : acc, 0);
  const grandBalance = reportData.reduce((acc, curr) => curr.type === 'item' ? acc + curr.balance : acc, 0);

  // Action Handlers
  const handleExportAction = (type: string): void => {
    alert(`Triggering ${type} export for Cash/Bank Books...`);
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
            <span className="font-semibold text-slate-900">Cash/Bank Books(s)</span>
          </div>

          <button 
            onClick={handleBackToPrevious}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg flex items-center space-x-2 shadow transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to previous</span>
          </button>
        </div>

        {/* Main Card Container */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 space-y-6">
          
          {/* Top Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            
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

          </div>

          {/* Action Export Buttons & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleExportAction('Copy')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-md flex items-center space-x-1.5 shadow transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
              <button 
                onClick={() => handleExportAction('CSV')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-md flex items-center space-x-1.5 shadow transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button 
                onClick={() => handleExportAction('Excel')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-md flex items-center space-x-1.5 shadow transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
              <button 
                onClick={() => handleExportAction('PDF')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-md flex items-center space-x-1.5 shadow transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600 font-medium">Search:</span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search code or name..."
                className="border border-slate-300 rounded-lg px-4 py-1.5 text-sm w-full sm:w-64 focus:outline-none focus:border-purple-500" 
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto border border-[#7b68ee]/40 rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#6b58e8] text-white font-bold tracking-wide">
                  <th className="p-3.5 border-r border-purple-400 w-48 whitespace-nowrap">CODE</th>
                  <th className="p-3.5 border-r border-purple-400 whitespace-nowrap">NAME</th>
                  <th className="p-3.5 border-r border-purple-400 text-right whitespace-nowrap w-36">OPENING</th>
                  <th className="p-3.5 border-r border-purple-400 text-right whitespace-nowrap w-36">DEBIT</th>
                  <th className="p-3.5 border-r border-purple-400 text-right whitespace-nowrap w-36">CREDIT</th>
                  <th className="p-3.5 text-right whitespace-nowrap w-36">BALANCE</th>
                </tr>
              </thead>
              <tbody className="bg-white text-slate-700">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 italic bg-slate-50 text-base">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  <>
                    {/* Section 1: Bank Accounts */}
                    <tr className="border-b border-slate-200 bg-white">
                      <td className="p-3.5 border-r font-semibold text-slate-900">100-001-001</td>
                      <td className="p-3.5 border-r font-bold text-slate-900">Bank Accounts</td>
                      <td className="p-3.5 border-r"></td>
                      <td className="p-3.5 border-r"></td>
                      <td className="p-3.5 border-r"></td>
                      <td></td>
                    </tr>
                    <tr className="border-b border-slate-200 bg-slate-50/50 font-semibold text-slate-800">
                      <td colSpan={2} className="p-3 border-r text-right uppercase text-xs">Total</td>
                      <td className="p-3 border-r text-right">0.00</td>
                      <td className="p-3 border-r text-right">0.00</td>
                      <td className="p-3 border-r text-right">0.00</td>
                      <td className="p-3 text-right">0.00</td>
                    </tr>

                    {/* Section 2: Cash In Hand */}
                    <tr className="border-b border-slate-200 bg-white">
                      <td className="p-3.5 border-r font-semibold text-slate-900">100-001-002</td>
                      <td className="p-3.5 border-r font-bold text-slate-900">Cash In Hand</td>
                      <td className="p-3.5 border-r"></td>
                      <td className="p-3.5 border-r"></td>
                      <td className="p-3.5 border-r"></td>
                      <td></td>
                    </tr>
                    <tr className="border-b border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 border-r font-medium">100-001-002-001</td>
                      <td className="p-3.5 border-r text-blue-600 font-semibold cursor-pointer hover:underline">Cash</td>
                      <td className="p-3.5 border-r text-right">0.00</td>
                      <td className="p-3.5 border-r text-right">34,017,233.66</td>
                      <td className="p-3.5 border-r text-right">909,924.00</td>
                      <td className="p-3.5 text-right font-semibold">33,107,309.66</td>
                    </tr>
                    <tr className="border-b border-slate-200 bg-slate-50/50 font-semibold text-slate-800">
                      <td colSpan={2} className="p-3 border-r text-right uppercase text-xs">Total</td>
                      <td className="p-3 border-r text-right">0.00</td>
                      <td className="p-3 border-r text-right">34,017,233.66</td>
                      <td className="p-3 border-r text-right">909,924.00</td>
                      <td className="p-3 text-right">33,107,309.66</td>
                    </tr>
                  </>
                )}
              </tbody>
              
              {/* Table Footer Grand Total Row */}
              <tfoot>
                <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={2} className="p-3.5 text-right uppercase tracking-wider">Grand Total</td>
                  <td className="p-3.5 border-r text-right">{grandOpening.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3.5 border-r text-right">{grandDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3.5 border-r text-right">{grandCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3.5 text-right">{grandBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Bottom Entries Count info */}
          <div className="text-sm text-slate-600 pt-2">
            Showing 1 to 6 of 6 entries
          </div>

        </div>
      </div>
    </div>
  );
}