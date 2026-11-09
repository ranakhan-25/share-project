'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronRight, 
  FileSpreadsheet, 
  FileText, 
  ArrowLeft, 
  X 
} from 'lucide-react';

// ✅ Fixed: Removed the space in interface name (PPE Row -> PPERow)
interface PPERow {
  particulars: string;
  costBalanceAsAt: number;
  costAddition: number;
  costDisposal: number;
  costTotalBalanceAsAt: number;
  rate: string;
  depBalanceAsAt: number;
  depAddition: number;
  depTotalBalanceAsAt: number;
  wdv: number;
}

export default function PropertyPlantAndEquipment() {
  const router = useRouter();

  // Filter States
  const [financialYear, setFinancialYear] = useState<string>('2024-2025');
  const [company, setCompany] = useState<string>('Select value');

  // Property Plant And Equipment Exact Data Structure matching the image
  const totalRow: PPERow = {
    particulars: 'Total',
    costBalanceAsAt: 0.00,
    costAddition: 0.00,
    costDisposal: 0.00,
    costTotalBalanceAsAt: 0.00,
    rate: '',
    depBalanceAsAt: 0.00,
    depAddition: 0.00,
    depTotalBalanceAsAt: 0.00,
    wdv: 0.00
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
            <span className="font-semibold text-slate-900">Property Plant And Equipment</span>
          </div>

          <button 
            onClick={() => router.back()} // ✅ Real working browser history back button
            className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg flex items-center space-x-2 shadow transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Previous</span>
          </button>
        </div>

        {/* Main Card Container */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 space-y-6">
          
          {/* Top Filters Grid & Export Buttons */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm flex-1">
              
              {/* Financial Year with Clear Action */}
              <div>
                <label className="block text-slate-600 font-medium mb-1.5">Financial Year</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={financialYear} 
                    onChange={(e) => setFinancialYear(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white text-slate-700 focus:outline-none focus:border-purple-500 pr-10"
                  />
                  <button 
                    onClick={() => setFinancialYear('')}
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

            </div>

            {/* Export Action Buttons */}
            <div className="flex items-center space-x-2 pb-0.5">
              <button 
                onClick={() => alert('Exporting Property Plant And Equipment to Excel...')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center space-x-1.5 shadow transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel</span>
              </button>
              <button 
                onClick={() => alert('Generating Property Plant And Equipment PDF...')}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center space-x-1.5 shadow transition"
              >
                <FileText className="w-4 h-4" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {/* Data Table Container */}
          <div className="overflow-x-auto border border-[#7b68ee]/40 rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
              <thead>
                {/* Top Group Header Row */}
                <tr className="bg-[#6b58e8] text-white font-bold tracking-wide text-center">
                  <th className="p-3 border-r border-purple-400 text-left align-middle" rowSpan={2}>PARTICULARS</th>
                  <th className="p-2 border-r border-b border-purple-400" colSpan={4}>COST</th>
                  <th className="p-2 border-r border-b border-purple-400 align-middle" rowSpan={2}>RATE %</th>
                  <th className="p-2 border-r border-b border-purple-400" colSpan={3}>DEPRECIATION</th>
                  <th className="p-2 align-middle" rowSpan={2}>WRITTEN DOWN VALUE (WDV)</th>
                </tr>
                {/* Sub Group Header Row */}
                <tr className="bg-[#6b58e8] text-white font-bold tracking-wide text-center">
                  <th className="p-2 border-r border-purple-400">BALANCE AS AT</th>
                  <th className="p-2 border-r border-purple-400">ADDITION DURING THE YEAR</th>
                  <th className="p-2 border-r border-purple-400">DISPOSAL / SALES</th>
                  <th className="p-2 border-r border-purple-400">BALANCE AS AT</th>
                  <th className="p-2 border-r border-purple-400">BALANCE AS AT</th>
                  <th className="p-2 border-r border-purple-400">ADDITION DURING THE PERIOD</th>
                  <th className="p-2 border-r border-purple-400">BALANCE AS AT</th>
                </tr>
              </thead>
              <tbody className="bg-white text-slate-700">
                <tr className="bg-slate-50 font-bold text-slate-900 border-b border-slate-200">
                  {/* Particulars */}
                  <td className="p-3.5 border-r border-slate-200">
                    {totalRow.particulars}
                  </td>
                  {/* Cost Columns */}
                  <td className="p-3.5 border-r border-slate-200 text-right">
                    {totalRow.costBalanceAsAt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 border-r border-slate-200 text-right">
                    {totalRow.costAddition.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 border-r border-slate-200 text-right">
                    {totalRow.costDisposal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 border-r border-slate-200 text-right">
                    {totalRow.costTotalBalanceAsAt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  {/* Rate */}
                  <td className="p-3.5 border-r border-slate-200 text-center">
                    {totalRow.rate}
                  </td>
                  {/* Depreciation Columns */}
                  <td className="p-3.5 border-r border-slate-200 text-right">
                    {totalRow.depBalanceAsAt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 border-r border-slate-200 text-right">
                    {totalRow.depAddition.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 border-r border-slate-200 text-right">
                    {totalRow.depTotalBalanceAsAt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  {/* WDV */}
                  <td className="p-3.5 text-right font-bold">
                    {totalRow.wdv.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}