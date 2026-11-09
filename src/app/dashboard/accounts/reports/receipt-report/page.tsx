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

interface ReceiptRow {
  id: number;
  receiptsName: string;
  amount: number;
}

export default function ReceiptReport() {
  // Filter States
  const [selectDate, setSelectDate] = useState<string>('1 September, 2026 - 30 September, 2026');
  const [chartOfAccount, setChartOfAccount] = useState<string>('Select value');
  const [company, setCompany] = useState<string>('Somikoron IT Ltd');
  const [selectProject, setSelectProject] = useState<string>('Select Project');
  const [site, setSite] = useState<string>('Select Site');

  // Receipt Data matching the image exactly
  const [reportData] = useState<ReceiptRow[]>([
    { id: 1, receiptsName: 'Sundry Debtors', amount: 28766666.66 }
  ]);

  // Computed Total Amount
  const totalAmount = reportData.reduce((acc, curr) => acc + curr.amount, 0);

  // Action Handlers
  const handleExportExcel = (): void => {
    alert('Exporting Receipt Report as Excel spreadsheet...');
  };

  const handleExportPDF = (): void => {
    alert('Generating Receipt Report PDF...');
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
            <span className="font-semibold text-slate-900">Receipt Report</span>
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

            {/* Chart Of Account */}
            <div>
              <label className="block text-slate-600 font-medium mb-1.5">Chart Of Account</label>
              <select 
                value={chartOfAccount} 
                onChange={(e) => setChartOfAccount(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white text-slate-700 focus:outline-none focus:border-purple-500"
              >
                <option value="Select value">Select value</option>
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
              </select>
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

          {/* Data Table */}
          <div className="overflow-x-auto border border-[#7b68ee]/40 rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#6b58e8] text-white font-bold tracking-wide">
                  <th className="p-3.5 border-r border-purple-400 w-20 text-center whitespace-nowrap">SL</th>
                  <th className="p-3.5 border-r border-purple-400 whitespace-nowrap">RECEIPTS NAME</th>
                  <th className="p-3.5 text-right whitespace-nowrap">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="bg-white text-slate-700">
                {reportData.map((row) => (
                  <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 border-r text-center font-medium">{row.id}</td>
                    <td className="p-3.5 border-r text-blue-600 font-semibold cursor-pointer hover:underline">{row.receiptsName}</td>
                    <td className="p-3.5 text-right font-semibold">{row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              
              {/* Table Footer Total Row */}
              <tfoot>
                <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={2} className="p-3.5 text-right uppercase tracking-wider">Total :</td>
                  <td className="p-3.5 text-right">{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}