'use client';

import React, { useState } from 'react';
import { 
  ChevronRight, 
  FileSpreadsheet, 
  FileText, 
  X 
} from 'lucide-react';

interface FundItem {
  name: string;
  amount: number;
}

export default function FundFlowSummary() {
  // Filter States
  const [month, setMonth] = useState<string>('September 2026');
  const [company, setCompany] = useState<string>('Select value');
  const [project, setProject] = useState<string>('Select Project');
  const [site, setSite] = useState<string>('Select Site');

  // Fund Inflow Data matching the image exactly
  const fundInflows: FundItem[] = [
    { name: 'Sundry Debtors', amount: 28766666.66 },
  ];
  const totalInflow = fundInflows.reduce((acc, curr) => acc + curr.amount, 0);

  // Fund Outflow Data matching the image exactly
  const fundOutflows: FundItem[] = [
    { name: 'Closing Stock', amount: 170.00 },
    { name: 'Sundry Creditors', amount: 23670.00 },
  ];
  const totalOutflow = fundOutflows.reduce((acc, curr) => acc + curr.amount, 0);

  // Net Fund Flow Calculation
  const netFundFlow = totalInflow - totalOutflow;

  // Action Handlers
  const handleExportPDF = (): void => {
    alert('Generating Fund Flow Summary PDF...');
  };

  const handleExportExcel = (): void => {
    alert('Exporting Fund Flow Summary as Excel spreadsheet...');
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 font-sans text-slate-800">
      <div className="space-y-6">
        
        {/* Top Header with Breadcrumbs */}
        <div className="flex items-center text-sm text-slate-600 space-x-2">
          <span className="hover:text-blue-600 cursor-pointer">Home</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className="hover:text-blue-600 cursor-pointer">Accounts Module (Report)</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-900">Fund Flow Summary</span>
        </div>

        {/* Main Card Container */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 space-y-6">
          
          {/* Top Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            
            {/* Month with Clear Action */}
            <div>
              <label className="block text-slate-600 font-medium mb-1.5">Month</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={month} 
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white text-slate-700 focus:outline-none focus:border-purple-500 pr-10"
                />
                <button 
                  onClick={() => setMonth('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="block text-slate-600 font-medium mb-1.5">Company</label>
              <select 
                value={company} 
                onChange={(e) => setCompany(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white text-slate-700 focus:outline-none focus:border-purple-500"
              >
                <option value="Select value">Select value</option>
                <option value="Somikoron IT Ltd">Somikoron IT Ltd</option>
              </select>
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
          <div className="flex items-center justify-end space-x-2 pt-2">
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

          {/* Data Table Container */}
          <div className="overflow-x-auto border border-[#7b68ee]/40 rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <tbody className="bg-white text-slate-700">
                
                {/* 1. Fund Inflow Header */}
                <tr className="bg-[#6b58e8] text-white font-bold tracking-wide">
                  <th className="p-3.5 border-r border-purple-400">Fund Inflow</th>
                  <th className="p-3.5 text-right w-64">Sep-26</th>
                </tr>

                {/* Fund Inflow Rows */}
                {fundInflows.map((item, index) => (
                  <tr key={index} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 border-r border-slate-200 text-slate-900 font-medium">{item.name}</td>
                    <td className="p-3.5 text-right font-medium">{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}

                {/* Total Fund Inflow Row */}
                <tr className="border-b-2 border-slate-300 bg-slate-50 font-bold text-slate-900">
                  <td className="p-3.5 border-r border-slate-200">Total Fund Inflow</td>
                  <td className="p-3.5 text-right text-emerald-700">{totalInflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>

                {/* 2. Fund Outflow Header */}
                <tr className="bg-[#6b58e8] text-white font-bold tracking-wide">
                  <th className="p-3.5 border-r border-purple-400">Fund Outflow</th>
                  <th className="p-3.5 text-right w-64">Sep-26</th>
                </tr>

                {/* Fund Outflow Rows */}
                {fundOutflows.map((item, index) => (
                  <tr key={index} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 border-r border-slate-200 text-slate-900 font-medium">{item.name}</td>
                    <td className="p-3.5 text-right font-medium">{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}

                {/* Total Fund Outflow Row */}
                <tr className="border-b-2 border-slate-300 bg-slate-50 font-bold text-slate-900">
                  <td className="p-3.5 border-r border-slate-200">Total Fund Outflow</td>
                  <td className="p-3.5 text-right text-rose-700">{totalOutflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>

                {/* Net Fund Flow Row */}
                <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300 text-base">
                  <td className="p-4 border-r border-slate-200">Net Fund Flow</td>
                  <td className="p-4 text-right text-purple-700">{netFundFlow.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>

              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}