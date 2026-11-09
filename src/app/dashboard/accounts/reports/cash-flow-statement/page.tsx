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

interface CashFlowRow {
  sl: number;
  month: string;
  inFlow: number;
  outFlow: number;
}

export default function CashFlowStatement() {
  // Filter States
  const [selectDate, setSelectDate] = useState<string>('1 September, 2026 - 30 September, 2026');
  const [type, setType] = useState<string>('Select type');
  const [company, setCompany] = useState<string>('Somikoron IT Ltd');
  const [project, setProject] = useState<string>('Select Project');
  const [site, setSite] = useState<string>('Select Site');

  // Cash Flow Data matching the image exactly
  const [reportData] = useState<CashFlowRow[]>([
    { sl: 1, month: 'Sep-2026', inFlow: 28766666.66, outFlow: 23840.00 },
  ]);

  // Computed Totals matching the image
  const grandInFlow = reportData.reduce((acc, curr) => acc + curr.inFlow, 0);
  const grandOutFlow = reportData.reduce((acc, curr) => acc + curr.outFlow, 0);
  const grandNetFlow = grandInFlow - grandOutFlow;

  // Action Handlers
  const handleExportPDF = (): void => {
    alert('Generating Cash Flow Statement PDF...');
  };

  const handleExportExcel = (): void => {
    alert('Exporting Cash Flow Statement as Excel spreadsheet...');
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
            <span className="font-semibold text-slate-900">Cash Flow Statement</span>
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

            {/* Type */}
            <div>
              <label className="block text-slate-600 font-medium mb-1.5">Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white text-slate-700 focus:outline-none focus:border-purple-500"
              >
                <option value="Select type">Select type</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
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

          {/* Export Action Buttons Bar */}
          <div className="flex items-center space-x-2 pt-2">
            <button 
              onClick={handleExportPDF}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow transition"
            >
              <FileText className="w-4 h-4" />
              <span>PDF</span>
            </button>
            <button 
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel</span>
            </button>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto border border-[#7b68ee]/40 rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#6b58e8] text-white font-bold tracking-wide">
                  <th className="p-3.5 border-r border-purple-400 w-20 text-center whitespace-nowrap">SL.</th>
                  <th className="p-3.5 border-r border-purple-400 w-48 whitespace-nowrap">MONTH</th>
                  <th className="p-3.5 border-r border-purple-400 text-right whitespace-nowrap">IN FLOW</th>
                  <th className="p-3.5 border-r border-purple-400 text-right whitespace-nowrap">OUT FLOW</th>
                  <th className="p-3.5 text-right whitespace-nowrap">NET FLOW</th>
                </tr>
              </thead>
              <tbody className="bg-white text-slate-700">
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 italic bg-slate-50 text-base">
                      No cash flow records found.
                    </td>
                  </tr>
                ) : (
                  reportData.map((row) => {
                    const netFlow = row.inFlow - row.outFlow;
                    return (
                      <tr key={row.sl} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 border-r text-center font-medium">{row.sl}</td>
                        <td className="p-3.5 border-r text-blue-600 font-semibold cursor-pointer hover:underline">{row.month}</td>
                        <td className="p-3.5 border-r text-right font-medium">{row.inFlow.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3.5 border-r text-right font-medium">{row.outFlow.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3.5 text-right font-semibold">{netFlow.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              
              {/* Table Footer Grand Total Row */}
              <tfoot>
                <tr className="bg-slate-50 font-extrabold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={2} className="p-3.5 border-r text-right uppercase tracking-wider">Grand Total :</td>
                  <td className="p-3.5 border-r text-right">{grandInFlow.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3.5 border-r text-right">{grandOutFlow.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3.5 text-right">{grandNetFlow.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}