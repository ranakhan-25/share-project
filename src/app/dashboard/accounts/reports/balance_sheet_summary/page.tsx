'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronRight, 
  Calendar, 
  FileSpreadsheet, 
  FileText, 
  ArrowLeft,
  X,
  Layers 
} from 'lucide-react';

interface BalanceRow {
  id?: number | string;
  particulars: string;
  balance: number;
  type: 'section' | 'subgroup' | 'item' | 'total' | 'grand-total';
  indent?: number;
}

export default function BalanceSheet() {
  const router = useRouter();

  // Filter States
  const [company, setCompany] = useState<string>('Somikoron IT Ltd');
  const [asOfDate, setAsOfDate] = useState<string>('17/09/2026');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Balance Sheet Exact Data Structure matching the image
  const rawData: BalanceRow[] = [
    // ASSETS SECTION
    { particulars: 'Assets', balance: 0, type: 'section' },
    { id: 1, particulars: 'Current Assets', balance: 0.00, type: 'subgroup', indent: 1 },
    { id: 2, particulars: 'Bank Accounts', balance: 0.00, type: 'item', indent: 2 },
    { id: 3, particulars: 'Cash In Hand', balance: 33107309.66, type: 'item', indent: 2 },
    { id: 4, particulars: 'Sundry Debtors', balance: 102299225.34, type: 'item', indent: 2 },
    { id: 5, particulars: 'Closing Stock', balance: 5821510.00, type: 'item', indent: 2 },
    { id: 6, particulars: 'Fixed Assets', balance: 0.00, type: 'subgroup', indent: 1 },
    { particulars: 'Total Assets', balance: 141228045.00, type: 'total' },

    // LIABILITY & OWNERS EQUITY SECTION
    { particulars: 'Liability & Owners Equity', balance: 0, type: 'section' },
    { id: 9, particulars: 'Current Liabilities', balance: 0.00, type: 'subgroup', indent: 1 },
    { id: 10, particulars: 'Duties & Taxes', balance: 0.00, type: 'item', indent: 2 },
    { id: 11, particulars: 'Sundry Creditors', balance: 4133431.00, type: 'item', indent: 2 },
    { id: 12, particulars: 'Contractor', balance: 250.00, type: 'item', indent: 2 },
    { id: 13, particulars: 'Employee', balance: 1340.00, type: 'item', indent: 2 },
    { id: 14, particulars: 'Worker', balance: 4950.00, type: 'item', indent: 2 },
    { id: 15, particulars: 'Received From Other Source', balance: 0.00, type: 'item', indent: 2 },
    { id: 16, particulars: 'GRN Bill Liabilities', balance: 918405.00, type: 'item', indent: 2 },
    { id: 17, particulars: 'Security Deposit Liabilities', balance: 0.00, type: 'item', indent: 2 },
    { id: 18, particulars: 'Long Term Liabilities', balance: 0.00, type: 'subgroup', indent: 1 },
    { id: 19, particulars: 'Loans & Liabilities', balance: 0.00, type: 'subgroup', indent: 1 },
    { id: 20, particulars: 'Capital Account', balance: 0.00, type: 'subgroup', indent: 1 },
    { particulars: 'Total', balance: 5058376.00, type: 'total' },
    { particulars: 'Net Income(+/-)', balance: 136170856.00, type: 'total' },
    { particulars: 'Total Liabilities & Owners Equity', balance: 141229232.00, type: 'grand-total' },
  ];

  // Search Filter logic
  const filteredData = rawData.filter(row => 
    row.particulars.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (row.id && row.id.toString().includes(searchQuery))
  );

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
            <span className="font-semibold text-slate-900">Balance Sheet</span>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => alert('Viewing Comprehensive Balance Sheet...')}
              className="bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg flex items-center space-x-2 shadow transition"
            >
              <Layers className="w-4 h-4" />
              <span>Comprehensive</span>
            </button>
            <button 
              onClick={() => router.back()} // ✅ Real working browser history back button
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            
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

            {/* As of Date */}
            <div>
              <label className="block text-slate-600 font-medium mb-1.5">As of Date</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={asOfDate} 
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white text-slate-700 focus:outline-none focus:border-purple-500"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

          </div>

          {/* Export Action Buttons & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => alert('Exporting Balance Sheet to Excel...')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel</span>
              </button>
              <button 
                onClick={() => alert('Generating Balance Sheet PDF...')}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow transition"
              >
                <FileText className="w-4 h-4" />
                <span>PDF</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600 font-medium">Search:</span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID or particulars..."
                className="border border-slate-300 rounded-lg px-4 py-1.5 text-sm w-full sm:w-64 focus:outline-none focus:border-purple-500" 
              />
            </div>
          </div>

          {/* Data Table Container */}
          <div className="overflow-x-auto border border-[#7b68ee]/40 rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#6b58e8] text-white font-bold tracking-wide">
                  <th className="p-3.5 border-r border-purple-400 w-24 text-center">ID</th>
                  <th className="p-3.5 border-r border-purple-400">PARTICULARS</th>
                  <th className="p-3.5 text-right w-64">BALANCE</th>
                </tr>
              </thead>
              <tbody className="bg-white text-slate-700">
                {filteredData.map((row, index) => {
                  const isSection = row.type === 'section';
                  const isTotal = row.type === 'total';
                  const isGrandTotal = row.type === 'grand-total';

                  return (
                    <tr 
                      key={index} 
                      className={`border-b border-slate-200 transition-colors ${
                        isSection ? 'bg-slate-100 font-extrabold text-slate-900 text-sm' :
                        isGrandTotal ? 'bg-slate-200 font-extrabold text-slate-900 text-base' :
                        isTotal ? 'bg-slate-50 font-bold text-slate-900' :
                        'hover:bg-slate-50'
                      }`}
                    >
                      {/* ID Column */}
                      <td className="p-3.5 border-r border-slate-200 text-center font-medium text-slate-500">
                        {row.id !== undefined ? row.id : ''}
                      </td>

                      {/* Particulars with Indentation */}
                      <td className={`p-3.5 border-r border-slate-200 ${
                        row.indent === 2 ? 'pl-10 text-blue-600 font-medium cursor-pointer hover:underline' :
                        row.indent === 1 ? 'pl-6 font-semibold text-slate-800' : ''
                      }`}>
                        {row.particulars}
                      </td>

                      {/* Balance Column */}
                      <td className="p-3.5 text-right font-semibold">
                        {row.balance !== 0 || isTotal || isGrandTotal ? row.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Entries Count info */}
          <div className="text-sm text-slate-600 pt-2">
            Showing 1 to {filteredData.length} of {rawData.length} entries
          </div>

        </div>
      </div>
    </div>
  );
}