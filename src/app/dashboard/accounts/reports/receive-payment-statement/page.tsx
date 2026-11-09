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

interface StatementRow {
  id: number;
  date: string;
  project: string;
  description: string;
  voucherId: string;
  debit: number;
  credit: number;
  balance: number;
  note: string;
}

export default function ReceivePaymentStatement() {
  // Filter States
  const [selectDate, setSelectDate] = useState<string>('1 September, 2026 - 30 September, 2026');
  const [chartOfAccount, setChartOfAccount] = useState<string>('Select value');
  const [company, setCompany] = useState<string>('Somikoron IT Ltd');
  const [selectProject, setSelectProject] = useState<string>('Select Project');
  const [site, setSite] = useState<string>('Select Site');
  const [voucherType, setVoucherType] = useState<string>('Invoice Type');
  const [exceptContra, setExceptContra] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination & Display States
  const [entriesPerPage, setEntriesPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Receive Payment Statement Data matching the image exactly
  const [reportData] = useState<StatementRow[]>([
    { id: 1, date: '01-09-2026', project: 'Lake Garden', description: 'Mr. Raju raz', voucherId: 'Receipt-R00012', debit: 28066666.66, credit: 0, balance: 28066666.66, note: 'fgfgfd\nCheque/Receipt No-er454' },
    { id: 2, date: '03-09-2026', project: 'Sheba Eyecon Tower', description: 'Mohin Business solution', voucherId: 'PURCHASE00004-Purchase', debit: 0, credit: 170.00, balance: 28066496.66, note: '' },
    { id: 3, date: '07-09-2026', project: 'Sheba Eyecon Tower', description: 'Sagor kumar', voucherId: 'Receipt-R00014', debit: 200000.00, credit: 0, balance: 28266496.66, note: 'Booking Money-Booking-2902887' },
    { id: 4, date: '07-09-2026', project: 'Rifat Eyecon City', description: 'Riva Steel Mils', voucherId: 'Payment-P00004', debit: 0, credit: 8000.00, balance: 28258496.66, note: '' },
    { id: 5, date: '08-09-2026', project: 'Rifat Eyecon City', description: 'Riva Steel Mils', voucherId: 'Payment-P00001', debit: 0, credit: 6000.00, balance: 28252496.66, note: '' },
    { id: 6, date: '08-09-2026', project: 'Rifat Eyecon City', description: 'Riva Steel Mils', voucherId: 'Payment-P00002', debit: 0, credit: 5000.00, balance: 28247496.66, note: '' },
    { id: 7, date: '08-09-2026', project: 'Rifat Eyecon City', description: 'Riva Steel Mils', voucherId: 'Payment-P00003', debit: 0, credit: 10000.00, balance: 28237496.66, note: '' },
    { id: 8, date: '11-09-2026', project: 'Rifat Eyecon City', description: 'Office Salary', voucherId: 'EXP00002', debit: 0, credit: 800.00, balance: 28236696.66, note: '' },
    { id: 9, date: '11-09-2026', project: 'Huma Heights', description: 'Contractor Bill Expense', voucherId: 'EXP00008', debit: 0, credit: 11.00, balance: 28236685.66, note: '' },
    { id: 10, date: '12-09-2026', project: 'Rifat Eyecon City', description: 'Contractor Bill Expense', voucherId: 'EXP00007', debit: 0, credit: 222.00, balance: 28236463.66, note: '' },
    { id: 11, date: '13-09-2026', project: 'Sheba Eyecon Tower', description: 'Sagor kumar', voucherId: 'Receipt-R00015', debit: 500000.00, credit: 0, balance: 28736463.66, note: 'Booking Money-Booking-8181711' },
    { id: 12, date: '14-09-2026', project: 'Rifat Eyecon City', description: 'Office Salary', voucherId: 'EXP00003', debit: 0, credit: 66.00, balance: 28736397.66, note: 'test' },
    { id: 13, date: '14-09-2026', project: 'Rifat Eyecon City', description: 'Office Salary', voucherId: 'EXP00005', debit: 0, credit: 88.00, balance: 28736309.66, note: '' },
    { id: 14, date: '15-09-2026', project: 'Rifat Eyecon City', description: 'Cash', voucherId: 'Contra-CCN00001', debit: 11.00, credit: 0, balance: 28736320.66, note: '' },
    { id: 15, date: '15-09-2026', project: 'Rifat Eyecon City', description: 'Cash', voucherId: 'Contra-CCN00001', debit: 0, credit: 11.00, balance: 28736309.66, note: '' },
    { id: 16, date: '16-09-2026', project: 'Huma Heights', description: 'Cash', voucherId: 'Contra-CCN00002', debit: 0, credit: 22.00, balance: 28736287.66, note: '' },
    { id: 17, date: '16-09-2026', project: 'Huma Heights', description: 'Cash', voucherId: 'Contra-CCN00002', debit: 22.00, credit: 0, balance: 28736309.66, note: '' },
    { id: 18, date: '17-09-2026', project: 'Rifat Eyecon City', description: 'Cash', voucherId: 'Contra-CCN00003', debit: 33.00, credit: 0, balance: 28736342.66, note: 'test' },
    { id: 19, date: '17-09-2026', project: 'Rifat Eyecon City', description: 'Cash', voucherId: 'Contra-CCN00003', debit: 0, credit: 33.00, balance: 28736309.66, note: 'test' },
    { id: 20, date: '17-09-2026', project: 'Rifat Eyecon City', description: 'Cash', voucherId: 'Contra-CCN00004', debit: 1.00, credit: 0, balance: 28736310.66, note: '' },
    { id: 21, date: '17-09-2026', project: 'Rifat Eyecon City', description: 'Cash', voucherId: 'Contra-CCN00004', debit: 0, credit: 1.00, balance: 28736309.66, note: '' },
  ]);

  // Filter Logic
  const filteredData = reportData.filter(row => {
    const matchesSearch = 
      row.voucherId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.note.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesContra = exceptContra ? !row.voucherId.toLowerCase().includes('contra') : true;

    return matchesSearch && matchesContra;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentTableData = filteredData.slice(startIndex, startIndex + entriesPerPage);

  // Summary Totals Calculation
  const currentDebitTotal = filteredData.reduce((acc, curr) => acc + curr.debit, 0);
  const currentCreditTotal = filteredData.reduce((acc, curr) => acc + curr.credit, 0);

  // Financial Ledger Specific Constants matching the image summary
  const openingDebit = 5250500.00;
  const openingCredit = 885000.00;
  const openingBalanceVal = 4365500.00;

  const closingDebit = openingDebit + currentDebitTotal;
  const closingCredit = openingCredit + currentCreditTotal;
  const closingBalanceVal = 33107309.66;

  // Action Handlers
  const handleExportAction = (type: string): void => {
    alert(`Triggering ${type} export for Receive Payment Statement...`);
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
            <span className="font-semibold text-slate-900">Receive Payment Statement</span>
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

          {/* Voucher Type & Except Contra Toggle Bar */}
          <div className="flex flex-wrap items-center gap-6 pt-1">
            <div className="w-full sm:w-72">
              <label className="block text-slate-600 font-medium mb-1.5 text-sm">Voucher Type</label>
              <select 
                value={voucherType} 
                onChange={(e) => setVoucherType(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2 bg-white text-slate-700 text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="Invoice Type">Invoice Type</option>
                <option value="Payment">Payment</option>
                <option value="Receipt">Receipt</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-5">
              <input 
                type="checkbox" 
                id="exceptContra"
                checked={exceptContra}
                onChange={(e) => setExceptContra(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
              />
              <label htmlFor="exceptContra" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                Except Contra
              </label>
            </div>
          </div>

          {/* Action Export Buttons Bar */}
          <div className="flex items-center space-x-2 pt-2">
            <button 
              onClick={() => handleExportAction('Copy')}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-md flex items-center space-x-1.5 shadow transition"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
            <button 
              onClick={() => handleExportAction('CSV')}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-md flex items-center space-x-1.5 shadow transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button 
              onClick={() => handleExportAction('Excel')}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-md flex items-center space-x-1.5 shadow transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button 
              onClick={() => handleExportAction('PDF')}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-md flex items-center space-x-1.5 shadow transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>

          {/* Table Controls (Show entries & Search) */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center text-sm text-slate-600 space-x-2">
              <span>Show</span>
              <select 
                value={entriesPerPage} 
                onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600 font-medium">Search:</span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search statement..."
                className="border border-slate-300 rounded-lg px-4 py-2 text-sm w-full sm:w-64 focus:outline-none focus:border-purple-500" 
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto border border-[#7b68ee]/40 rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#6b58e8] text-white font-bold tracking-wide">
                  <th className="p-3.5 border-r border-purple-400 w-12 text-center whitespace-nowrap">ID</th>
                  <th className="p-3.5 border-r border-purple-400 whitespace-nowrap">DATE</th>
                  <th className="p-3.5 border-r border-purple-400 whitespace-nowrap">PROJECT</th>
                  <th className="p-3.5 border-r border-purple-400 whitespace-nowrap">DESCRIPTION</th>
                  <th className="p-3.5 border-r border-purple-400 whitespace-nowrap">VOUCHER ID</th>
                  <th className="p-3.5 border-r border-purple-400 text-right whitespace-nowrap">DEBIT</th>
                  <th className="p-3.5 border-r border-purple-400 text-right whitespace-nowrap">CREDIT</th>
                  <th className="p-3.5 border-r border-purple-400 text-right whitespace-nowrap">BALANCE</th>
                  <th className="p-3.5 text-center whitespace-nowrap w-36">NOTE</th>
                </tr>
              </thead>
              <tbody className="bg-white text-slate-700">
                {currentTableData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400 italic bg-slate-50 text-base">
                      No matching statement records found.
                    </td>
                  </tr>
                ) : (
                  currentTableData.map((row) => (
                    <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 border-r text-center font-medium">{row.id}</td>
                      <td className="p-3.5 border-r">{row.date}</td>
                      <td className="p-3.5 border-r">{row.project}</td>
                      <td className="p-3.5 border-r text-blue-600 font-semibold cursor-pointer hover:underline">{row.description}</td>
                      <td className="p-3.5 border-r text-blue-600 font-medium cursor-pointer hover:underline">{row.voucherId}</td>
                      <td className="p-3.5 border-r text-right font-medium">
                        {row.debit > 0 ? row.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0'}
                      </td>
                      <td className="p-3.5 border-r text-right font-medium">
                        {row.credit > 0 ? row.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0'}
                      </td>
                      <td className="p-3.5 border-r text-right font-semibold">
                        {row.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-center text-slate-500 whitespace-pre-line text-xs">{row.note}</td>
                    </tr>
                  ))
                )}
              </tbody>
              
              {/* Table Footer Multi-Row Financial Summaries */}
              <tfoot>
                <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={5} className="p-3 text-right uppercase tracking-wider">Opening Balance :</td>
                  <td className="p-3 border-r text-right">{openingDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 border-r text-right">{openingCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 border-r text-right">{openingBalanceVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3"></td>
                </tr>
                <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                  <td colSpan={5} className="p-3 text-right uppercase tracking-wider">Current Total :</td>
                  <td className="p-3 border-r text-right">{currentDebitTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 border-r text-right">{currentCreditTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 border-r text-right"></td>
                  <td className="p-3"></td>
                </tr>
                <tr className="bg-slate-100 font-extrabold text-slate-900 border-t border-slate-300">
                  <td colSpan={5} className="p-3.5 text-right uppercase tracking-wider">Closing :</td>
                  <td className="p-3.5 border-r text-right">{closingDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3.5 border-r text-right">{closingCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3.5 border-r text-right">{closingBalanceVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3.5"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Bottom Pagination Bar */}
          <div className="flex flex-wrap items-center justify-between text-sm text-slate-600 pt-2">
            <span>
              Showing {filteredData.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + entriesPerPage, filteredData.length)} of {filteredData.length} entries
            </span>
            
            <div className="flex space-x-1.5">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 rounded-lg font-medium ${currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3.5 py-1.5 rounded-lg font-semibold transition ${currentPage === pageNum ? 'bg-[#6b58e8] text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {pageNum}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`px-3 py-1.5 rounded-lg font-medium ${currentPage === totalPages || totalPages === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
              >
                Next
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}