'use client';

import React, { useState } from 'react';
import { 
  ChevronRight, 
  Calendar, 
  FileText, 
  FileSpreadsheet, 
  ArrowLeft,
  Send,
  X 
} from 'lucide-react';

interface ReceivableRow {
  id: number;
  customerName: string;
  openingBalance: number;
  debit: number;
  credit: number;
  balance: number;
}

export default function ReceivableReport() {
  // Filter States
  const [selectDate, setSelectDate] = useState<string>('1 September, 2026 - 30 September, 2026');
  const [customer, setCustomer] = useState<string>('Select Customer');
  const [company, setCompany] = useState<string>('Somikoron IT Ltd');
  const [selectProject, setSelectProject] = useState<string>('Select Project');

  // Receivable Data matching the image exactly
  const [reportData] = useState<ReceivableRow[]>([
    { id: 1, customerName: 'Nexus Developers', openingBalance: 82.00, debit: 0.00, credit: 0.00, balance: 82.00 },
    { id: 2, customerName: 'Cityscape Holdings', openingBalance: 118710.00, debit: 0.00, credit: 0.00, balance: 118710.00 },
    { id: 3, customerName: 'Mostafa', openingBalance: 95800000.00, debit: 0.00, credit: 0.00, balance: 95800000.00 },
    { id: 4, customerName: 'Abul', openingBalance: 6530000.00, debit: 0.00, credit: 0.00, balance: 6530000.00 },
    { id: 5, customerName: 'Sagor kumar', openingBalance: -100000.00, debit: 0.00, credit: 700000.00, balance: -800000.00 },
    { id: 6, customerName: 'Rahman', openingBalance: 34600.00, debit: 0.00, credit: 0.00, balance: 34600.00 },
    { id: 7, customerName: 'Abc', openingBalance: 28682500.00, debit: 0.00, credit: 0.00, balance: 28682500.00 },
    { id: 8, customerName: 'Mr. Raju raz', openingBalance: 0.00, debit: 0.00, credit: 28066666.66, balance: -28066666.66 },
  ]);

  // Computed Totals for Footer Row
  const totalOpeningBalance = reportData.reduce((acc, curr) => acc + curr.openingBalance, 0);
  const totalDebit = reportData.reduce((acc, curr) => acc + curr.debit, 0);
  const totalCredit = reportData.reduce((acc, curr) => acc + curr.credit, 0);
  const totalBalance = reportData.reduce((acc, curr) => acc + curr.balance, 0);

  // Handlers
  const handleSendSMS = (): void => {
    alert('Sending SMS to all due customers...');
  };

  const handleExportPDF = (): void => {
    alert('Generating Receivable Report PDF...');
  };

  const handleExportExcel = (): void => {
    alert('Exporting Receivable Report as Excel spreadsheet...');
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
            <span className="font-semibold text-slate-900">Receivable Report</span>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={handleSendSMS}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg flex items-center space-x-2 shadow transition"
            >
              <Send className="w-4 h-4" />
              <span>Send SMS to All Due Customers</span>
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

            {/* Customer Dropdown */}
            <div>
              <label className="block text-slate-600 font-medium mb-1.5">Customer</label>
              <select 
                value={customer} 
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white text-slate-700 focus:outline-none focus:border-purple-500"
              >
                <option value="Select Customer">Select Customer</option>
                <option value="Nexus Developers">Nexus Developers</option>
                <option value="Cityscape Holdings">Cityscape Holdings</option>
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

          </div>

          {/* Action Export Buttons Bar */}
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
                  <th className="p-3.5 border-r border-purple-400 w-16 text-center whitespace-nowrap">SL.</th>
                  <th className="p-3.5 border-r border-purple-400 whitespace-nowrap">CUSTOMER NAME</th>
                  <th className="p-3.5 border-r border-purple-400 text-right whitespace-nowrap">OPENING BALANCE</th>
                  <th className="p-3.5 border-r border-purple-400 text-right whitespace-nowrap">DEBIT</th>
                  <th className="p-3.5 border-r border-purple-400 text-right whitespace-nowrap">CREDIT</th>
                  <th className="p-3.5 border-r border-purple-400 text-right whitespace-nowrap">BALANCE</th>
                  <th className="p-3.5 text-center whitespace-nowrap w-24">ACTION</th>
                </tr>
              </thead>
              <tbody className="bg-white text-slate-700">
                {reportData.map((row) => (
                  <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 border-r text-center font-medium">{row.id}</td>
                    <td className="p-3.5 border-r text-blue-600 font-semibold cursor-pointer hover:underline">{row.customerName}</td>
                    <td className="p-3.5 border-r text-right">{row.openingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3.5 border-r text-right">{row.debit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3.5 border-r text-right">{row.credit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3.5 border-r text-right font-semibold">{row.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3.5 text-center"></td>
                  </tr>
                ))}
              </tbody>
              
              {/* Table Footer Total Row */}
              <tfoot>
                <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={2} className="p-3.5 text-right uppercase tracking-wider">Total</td>
                  <td className="p-3.5 border-r text-right">{totalOpeningBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3.5 border-r text-right">{totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3.5 border-r text-right">{totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3.5 border-r text-right">{totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3.5"></td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}