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
  BarChart3 
} from 'lucide-react';

interface TrialRow {
  particulars: string;
  opening: number;
  debit: number;
  credit: number;
  balance: number;
  type: 'section' | 'subgroup' | 'item' | 'total' | 'grand-total';
  indent?: number;
}

export default function TrialBalance() {
  const router = useRouter();

  // Filter States
  const [selectDate, setSelectDate] = useState<string>('19 August, 2026 - 17 September, 2026');
  const [company, setCompany] = useState<string>('Somikoron IT Ltd');
  const [project, setProject] = useState<string>('Select Project');
  const [site, setSite] = useState<string>('Select Site');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Trial Balance Exact Data Structure
  const rawData: TrialRow[] = [
    // ASSETS
    { particulars: 'Assets', opening: 0, debit: 0, credit: 0, balance: 0, type: 'section' },
    { particulars: 'Current Assets', opening: 0.00, debit: 172734249.66, credit: 35006204.66, balance: 137728045.00, type: 'subgroup' },
    { particulars: 'Bank Accounts', opening: 0.00, debit: 0, credit: 0, balance: 0, type: 'item', indent: 1 },
    { particulars: 'Cash In Hand', opening: 0.00, debit: 34017233.66, credit: 909924.00, balance: 33107309.66, type: 'item', indent: 1 },
    { particulars: 'Sundry Debtors', opening: 0.00, debit: 136316392.00, credit: 34017166.66, balance: 102299225.34, type: 'item', indent: 1 },
    { particulars: 'Closing Stock', opening: 3500000.00, debit: 2400624.00, credit: 79114.00, balance: 5821510.00, type: 'item', indent: 1 },
    { particulars: 'Fixed Assets', opening: 0.00, debit: 0, credit: 0, balance: 0, type: 'subgroup' },
    { particulars: 'Assets Total', opening: 0, debit: 172734249.66, credit: 35006204.66, balance: 0, type: 'total' },

    // LIABILITIES
    { particulars: 'Liabilities', opening: 0, debit: 0, credit: 0, balance: 0, type: 'section' },
    { particulars: 'Current Liabilities', opening: 0.00, debit: 1343672.00, credit: 2902048.00, balance: 1558376.00, type: 'subgroup' },
    { particulars: 'Duties & Taxes', opening: 0.00, debit: 0, credit: 0, balance: 0, type: 'item', indent: 1 },
    { particulars: 'Sundry Creditors', opening: 3500000.00, debit: 843670.00, credit: 1477101.00, balance: 4133431.00, type: 'item', indent: 1 },
    { particulars: 'Contractor', opening: 0.00, debit: 0, credit: 250.00, balance: 250.00, type: 'item', indent: 1 },
    { particulars: 'Employee', opening: 0.00, debit: 20002.00, credit: 21342.00, balance: 1340.00, type: 'item', indent: 1 },
    { particulars: 'Worker', opening: 0.00, debit: 0, credit: 4950.00, balance: 4950.00, type: 'item', indent: 1 },
    { particulars: 'Received From Other Source', opening: 0.00, debit: 0, credit: 0, balance: 0, type: 'item', indent: 1 },
    { particulars: 'GRN Bill Liabilities', opening: 0.00, debit: 480000.00, credit: 1398405.00, balance: 918405.00, type: 'item', indent: 1 },
    { particulars: 'Security Deposit Liabilities', opening: 0.00, debit: 0, credit: 0, balance: 0, type: 'item', indent: 1 },
    { particulars: 'Long Term Liabilities', opening: 0.00, debit: 0, credit: 0, balance: 0, type: 'subgroup' },
    { particulars: 'Loans & Liabilities', opening: 0.00, debit: 0, credit: 0, balance: 0, type: 'subgroup' },
    { particulars: 'Liabilities Total', opening: 0, debit: 1343672.00, credit: 2902048.00, balance: 0, type: 'total' },

    // INCOME
    { particulars: 'Income', opening: 0, debit: 0, credit: 0, balance: 0, type: 'section' },
    { particulars: 'Sales Account', opening: 0.00, debit: 0, credit: 136316310.00, balance: 136316310.00, type: 'item', indent: 1 },
    { particulars: 'Direct Income', opening: 0.00, debit: 0, credit: 0, balance: 0, type: 'item', indent: 1 },
    { particulars: 'Indirect Income', opening: 0.00, debit: 0, credit: 0, balance: 0, type: 'item', indent: 1 },
    { particulars: 'Income Total', opening: 0, debit: 0, credit: 136316310.00, balance: 0, type: 'total' },

    // EXPENSES
    { particulars: 'Expenses', opening: 0, debit: 0, credit: 0, balance: 0, type: 'section' },
    { particulars: 'Purchase Account', opening: 0.00, debit: 0, credit: 0, balance: 0, type: 'item', indent: 1 },
    { particulars: 'Direct Expense', opening: 0.00, debit: 21340.00, credit: 0, balance: 21340.00, type: 'subgroup' },
    { particulars: 'Administrative Expences', opening: 0.00, debit: 21340.00, credit: 0, balance: 21340.00, type: 'item', indent: 1 },
    { particulars: 'Contractor Bill Expense', opening: 0.00, debit: 0, credit: 0, balance: 0, type: 'item', indent: 1 },
    { particulars: 'Worker Bill Expanse', opening: 0.00, debit: 0, credit: 0, balance: 0, type: 'item', indent: 1 },
    { particulars: 'Indirect Expense', opening: 0.00, debit: 0, credit: 0, balance: 0, type: 'subgroup' },
  ];

  // Search Filter logic
  const filteredData = rawData.filter(row => 
    row.particulars.toLowerCase().includes(searchQuery.toLowerCase())
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
            <span className="font-semibold text-slate-900">Trail Balance</span>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => alert('Navigating to Balance Summary Wise...')}
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg flex items-center space-x-2 shadow transition"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Balance Summary Wise</span>
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

          {/* Export Action Buttons & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => alert('Exporting Trial Balance to Excel...')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel</span>
              </button>
              <button 
                onClick={() => alert('Generating Trial Balance PDF...')}
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
                placeholder="Search particulars..."
                className="border border-slate-300 rounded-lg px-4 py-1.5 text-sm w-full sm:w-64 focus:outline-none focus:border-purple-500" 
              />
            </div>
          </div>

          {/* Data Table Container */}
          <div className="overflow-x-auto border border-[#7b68ee]/40 rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#6b58e8] text-white font-bold tracking-wide">
                  <th className="p-3.5 border-r border-purple-400">PARTICULARS</th>
                  <th className="p-3.5 border-r border-purple-400 text-right w-44">OPENING</th>
                  <th className="p-3.5 border-r border-purple-400 text-right w-44">DEBIT</th>
                  <th className="p-3.5 border-r border-purple-400 text-right w-44">CREDIT</th>
                  <th className="p-3.5 text-right w-44">BALANCE</th>
                </tr>
              </thead>
              <tbody className="bg-white text-slate-700">
                {filteredData.map((row, index) => {
                  const isSection = row.type === 'section';
                  const isTotal = row.type === 'total';
                  const isSubgroup = row.type === 'subgroup';

                  return (
                    <tr 
                      key={index} 
                      className={`border-b border-slate-200 transition-colors ${
                        isSection ? 'bg-slate-50 font-extrabold text-slate-900 text-sm' :
                        isTotal ? 'bg-slate-50/80 font-bold text-slate-900' :
                        'hover:bg-slate-50'
                      }`}
                    >
                      {/* Particulars with Indentation */}
                      <td className={`p-3.5 border-r border-slate-200 ${row.indent === 1 ? 'pl-8 text-blue-600 font-medium cursor-pointer hover:underline' : ''}`}>
                        {row.particulars}
                      </td>

                      {/* Opening */}
                      <td className="p-3.5 border-r border-slate-200 text-right font-medium">
                        {row.opening !== 0 ? row.opening.toLocaleString('en-US', { minimumFractionDigits: 2 }) : (isSection || isTotal ? '' : '0.00')}
                      </td>

                      {/* Debit */}
                      <td className="p-3.5 border-r border-slate-200 text-right font-medium">
                        {row.debit !== 0 ? row.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : (isSection || isTotal ? '' : '0.00')}
                      </td>

                      {/* Credit */}
                      <td className="p-3.5 border-r border-slate-200 text-right font-medium">
                        {row.credit !== 0 ? row.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : (isSection || isTotal ? '' : '0.00')}
                      </td>

                      {/* Balance */}
                      <td className="p-3.5 text-right font-semibold">
                        {row.balance !== 0 ? row.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : (isSection || isTotal ? '' : '0.00')}
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