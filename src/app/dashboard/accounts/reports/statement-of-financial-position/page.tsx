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

interface FinancialPositionRow {
  particulars: string;
  notes?: string;
  amount?: number;
  type: 'section' | 'item' | 'total';
}

export default function StatementOfFinancialPosition() {
  const router = useRouter();

  // Filter States
  const [financialYear, setFinancialYear] = useState<string>('Select value');
  const [company, setCompany] = useState<string>('Select value');

  // Statement of Financial Position Exact Data Structure matching the image
  const reportData: FinancialPositionRow[] = [
    { particulars: 'ASSETS', type: 'section' },
    { particulars: 'Total Assets', type: 'total', amount: 0.00 },
    { particulars: 'EQUITY AND LIABILITIES', type: 'section' },
    { particulars: 'Total Equity and Liabilities', type: 'total', amount: 0.00 },
  ];

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
            <span className="font-semibold text-slate-900">Statement of Financial Position</span>
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
                onClick={() => alert('Exporting Statement of Financial Position to Excel...')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center space-x-1.5 shadow transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel</span>
              </button>
              <button 
                onClick={() => alert('Generating Statement of Financial Position PDF...')}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center space-x-1.5 shadow transition"
              >
                <FileText className="w-4 h-4" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {/* Data Table Container */}
          <div className="overflow-x-auto border border-[#7b68ee]/40 rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#6b58e8] text-white font-bold tracking-wide">
                  <th className="p-3.5 border-r border-purple-400">PARTICULARS</th>
                  <th className="p-3.5 border-r border-purple-400 text-center w-64">NOTES</th>
                  <th className="p-3.5 text-right w-64">AMOUNT IN BDT</th>
                </tr>
              </thead>
              <tbody className="bg-white text-slate-700">
                {reportData.map((row, index) => {
                  const isSection = row.type === 'section';
                  const isTotal = row.type === 'total';

                  return (
                    <tr 
                      key={index} 
                      className={`border-b border-slate-200 transition-colors ${
                        isSection ? 'bg-slate-50 font-extrabold text-slate-900 text-sm' :
                        isTotal ? 'bg-slate-50/80 font-bold text-slate-900' :
                        'hover:bg-slate-50'
                      }`}
                    >
                      {/* Particulars */}
                      <td className="p-3.5 border-r border-slate-200">
                        {row.particulars}
                      </td>

                      {/* Notes Column */}
                      <td className="p-3.5 border-r border-slate-200 text-center text-slate-500">
                        {row.notes || ''}
                      </td>

                      {/* Amount Column */}
                      <td className="p-3.5 text-right font-semibold">
                        {row.amount !== undefined ? row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}