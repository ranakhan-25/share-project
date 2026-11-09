'use client';

import React, { useState } from 'react';
import { 
  ChevronRight, 
  Calendar, 
  FileSpreadsheet, 
  FileText, 
  ArrowLeft,
  X,
  BarChart3
} from 'lucide-react';

interface IncomeItem {
  name: string;
  subtotal: number | null;
  total: number | null;
}

export default function IncomeStatement() {
  // Filter States
  const [selectDate, setSelectDate] = useState<string>('19 August, 2026 - 17 September, 2026');
  const [company, setCompany] = useState<string>('Somikoron IT Ltd');
  const [project, setProject] = useState<string>('Select Project');
  const [site, setSite] = useState<string>('Select Site');

  // Income Data matching the image exactly
  const operatingIncomes: IncomeItem[] = [
    { name: 'Sales', subtotal: 136316310.00, total: null },
  ];

  const totalIncome = 136316310.00;

  // Expense Data matching the image exactly
  const operatingExpenses: IncomeItem[] = [
    { name: 'Office Salary', subtotal: 21340.00, total: null },
    { name: 'Cost of Goods Sold (COGS)', subtotal: 13932.00, total: null },
    { name: 'Fenching Wall', subtotal: 30000.00, total: null },
    { name: 'Materials Carring', subtotal: 15000.00, total: null },
    { name: 'Bricks Consumption', subtotal: 45000.00, total: null },
    { name: 'Rod Consumption', subtotal: 18580.00, total: null },
    { name: 'Sand Consumption', subtotal: 1602.00, total: null },
  ];

  const totalExpense = 145454.00;
  const netIncome = totalIncome - totalExpense;

  // Action Handlers
  const handleExportExcel = (): void => {
    alert('Exporting Income Statement as Excel spreadsheet...');
  };

  const handleExportPDF = (): void => {
    alert('Generating Income Statement PDF...');
  };

  const handleGroupWiseReport = (): void => {
    alert('Navigating to Group Wise Income Statement Report...');
  };

  const handleBackToPrevious = (): void => {
    alert('Navigating back to previous page...');
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 font-sans text-slate-800">
      <div className="space-y-6">
        
        {/* Top Header with Breadcrumbs & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center text-sm text-slate-600 space-x-2">
            <span className="hover:text-blue-600 cursor-pointer">Home</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="hover:text-blue-600 cursor-pointer">Accounts Module (Report)</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-900">Income Statement</span>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={handleGroupWiseReport}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg flex items-center space-x-2 shadow transition"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Group Wise Income Statement Report</span>
            </button>
            <button 
              onClick={handleBackToPrevious}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg flex items-center space-x-2 shadow transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Previous</span>
            </button>
          </div>
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

          {/* Export Action Buttons Bar */}
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

          {/* Income Statement Data Table */}
          <div className="overflow-x-auto border border-[#7b68ee]/40 rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#6b58e8] text-white font-bold tracking-wide">
                  <th className="p-3.5 border-r border-purple-400">ACCOUNTS DETAILS</th>
                  <th className="p-3.5 border-r border-purple-400 text-right w-64">SUBTOTAL</th>
                  <th className="p-3.5 text-right w-64">TOTAL</th>
                </tr>
              </thead>
              <tbody className="bg-white text-slate-700">
                
                {/* 1. Operating Income Header */}
                <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-900">
                  <td colSpan={3} className="p-3.5">Operating Income</td>
                </tr>

                {/* Operating Income Rows */}
                {operatingIncomes.map((item, index) => (
                  <tr key={index} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 border-r border-slate-200 text-blue-600 font-semibold cursor-pointer hover:underline pl-6">{item.name}</td>
                    <td className="p-3.5 border-r border-slate-200 text-right font-medium">{item.subtotal !== null ? item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}</td>
                    <td className="p-3.5 text-right font-medium">-</td>
                  </tr>
                ))}

                {/* Total Income (+) Row */}
                <tr className="border-b-2 border-slate-300 bg-slate-50 font-bold text-slate-900">
                  <td className="p-3.5 border-r border-slate-200 text-right uppercase">Total Income (+)</td>
                  <td className="p-3.5 border-r border-slate-200 text-right">-</td>
                  <td className="p-3.5 text-right text-emerald-700">{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>

                {/* 2. Operating Expense Header */}
                <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-900">
                  <td colSpan={3} className="p-3.5">Operating Expense</td>
                </tr>

                {/* Operating Expense Rows */}
                {operatingExpenses.map((item, index) => (
                  <tr key={index} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 border-r border-slate-200 text-blue-600 font-semibold cursor-pointer hover:underline pl-6">{item.name}</td>
                    <td className="p-3.5 border-r border-slate-200 text-right font-medium">{item.subtotal !== null ? item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}</td>
                    <td className="p-3.5 text-right font-medium">-</td>
                  </tr>
                ))}

                {/* Total Expense (-) Row */}
                <tr className="border-b-2 border-slate-300 bg-slate-50 font-bold text-slate-900">
                  <td className="p-3.5 border-r border-slate-200 text-right uppercase">Total Expense (-)</td>
                  <td className="p-3.5 border-r border-slate-200 text-right">-</td>
                  <td className="p-3.5 text-right text-rose-700">{totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>

                {/* Net Income (+/-) Grand Total Row */}
                <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300 text-base">
                  <td className="p-4 border-r border-slate-200 text-right uppercase tracking-wider">Net Income (+/-)</td>
                  <td className="p-4 border-r border-slate-200 text-right">-</td>
                  <td className="p-4 text-right text-purple-700">{netIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>

              </tbody>
            </table>
          </div>

          {/* Bottom Entries Count info */}
          <div className="text-sm text-slate-600 pt-2">
            Showing 1 to 13 of 13 entries
          </div>

        </div>
      </div>
    </div>
  );
}