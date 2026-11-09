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

interface ReportRow {
  sl: number;
  projectName: string;
  handoverDate: string;
  costBudget: number;
  costActual: number;
  costRemaining: number;
  costPercentage: string;
  colBudget: number;
  colActual: number;
  colRemaining: number;
  colPercentage: string;
  colVsExpCollection: number;
  colVsExpActual: number;
  variance: number;
  variancePercentage: string;
}

export default function BudgetVsActualVsCollection() {
  const router = useRouter();

  // Filter States
  const [month, setMonth] = useState<string>('September 2026');
  const [company, setCompany] = useState<string>('Somikoron IT Ltd');
  const [project, setProject] = useState<string>('Select Project');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);

  // Exact Data matching the image
  const rawData: ReportRow[] = [
    {
      sl: 1,
      projectName: 'Rifat Eyecon City',
      handoverDate: '12/31/2030',
      costBudget: 15000000.00,
      costActual: 1176.00,
      costRemaining: 14998824.00,
      costPercentage: '0.01%',
      colBudget: 0.00,
      colActual: 0.00,
      colRemaining: 0.00,
      colPercentage: '0%',
      colVsExpCollection: 0.00,
      colVsExpActual: 1176.00,
      variance: -1176.00,
      variancePercentage: '0%'
    },
    {
      sl: 2,
      projectName: 'Hena Heights',
      handoverDate: '12/21/2027',
      costBudget: 7430000.00,
      costActual: 11.00,
      costRemaining: 7429989.00,
      costPercentage: '0%',
      colBudget: 0.00,
      colActual: 0.00,
      colRemaining: 0.00,
      colPercentage: '0%',
      colVsExpCollection: 0.00,
      colVsExpActual: 11.00,
      variance: -11.00,
      variancePercentage: '0%'
    },
    {
      sl: 3,
      projectName: 'Sheba Eyecon Tower',
      handoverDate: '',
      costBudget: 2000000.00,
      costActual: 0.00,
      costRemaining: 2000000.00,
      costPercentage: '0%',
      colBudget: 10802680.00,
      colActual: 0.00,
      colRemaining: 10802680.00,
      colPercentage: '0%',
      colVsExpCollection: 0.00,
      colVsExpActual: 0.00,
      variance: 0.00,
      variancePercentage: '0%'
    },
    {
      sl: 4,
      projectName: 'Estern 19',
      handoverDate: '',
      costBudget: 0.00,
      costActual: 82.00,
      costRemaining: -82.00,
      costPercentage: '0%',
      colBudget: 0.00,
      colActual: 0.00,
      colRemaining: 0.00,
      colPercentage: '0%',
      colVsExpCollection: 0.00,
      colVsExpActual: 82.00,
      variance: -82.00,
      variancePercentage: '0%'
    },
    {
      sl: 5,
      projectName: 'Lake Garden',
      handoverDate: '',
      costBudget: 108512202.82,
      costActual: 0.00,
      costRemaining: 108512202.82,
      costPercentage: '0%',
      colBudget: 28344583.33,
      colActual: 28066666.66,
      colRemaining: 277916.67,
      colPercentage: '99.02%',
      colVsExpCollection: 28066666.66,
      colVsExpActual: 0.00,
      variance: 28066666.66,
      variancePercentage: '0%'
    },
    {
      sl: 6,
      projectName: 'Head Office',
      handoverDate: '',
      costBudget: 0.00,
      costActual: 0.00,
      costRemaining: 0.00,
      costPercentage: '0%',
      colBudget: 0.00,
      colActual: 0.00,
      colRemaining: 0.00,
      colPercentage: '0%',
      colVsExpCollection: 0.00,
      colVsExpActual: 0.00,
      variance: 0.00,
      variancePercentage: '0%'
    },
  ];

  // Totals Calculation
  const totalCostBudget = rawData.reduce((acc, curr) => acc + curr.costBudget, 0);
  const totalCostActual = rawData.reduce((acc, curr) => acc + curr.costActual, 0);
  const totalCostRemaining = rawData.reduce((acc, curr) => acc + curr.costRemaining, 0);
  const totalColBudget = rawData.reduce((acc, curr) => acc + curr.colBudget, 0);
  const totalColActual = rawData.reduce((acc, curr) => acc + curr.colActual, 0);
  const totalColRemaining = rawData.reduce((acc, curr) => acc + curr.colRemaining, 0);
  const totalColVsExpCollection = rawData.reduce((acc, curr) => acc + curr.colVsExpCollection, 0);
  const totalColVsExpActual = rawData.reduce((acc, curr) => acc + curr.colVsExpActual, 0);
  const totalVariance = rawData.reduce((acc, curr) => acc + curr.variance, 0);

  // Search Filter logic
  const filteredData = rawData.filter(row => 
    row.projectName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100 p-6 font-sans text-slate-800">
      <div className="space-y-6">
        
        {/* Top Header with Breadcrumbs & Back Button */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center text-sm text-slate-600 space-x-2">
            <span className="hover:text-blue-600 cursor-pointer">Home</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="hover:text-blue-600 cursor-pointer">Report</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-900">Budget Versus Actual Expenses Versus Collection Report</span>
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
          
          {/* Top Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            
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
              <label className="block text-slate-600 font-medium mb-1.5">Project*</label>
              <select 
                value={project} 
                onChange={(e) => setProject(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white text-slate-700 focus:outline-none focus:border-purple-500"
              >
                <option value="Select Project">Select Project</option>
                <option value="Rifat Eyecon City">Rifat Eyecon City</option>
              </select>
            </div>

          </div>

          {/* Action Bar (Excel, PDF, Entries Selector & Search) */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => alert('Exporting Report to Excel...')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel</span>
              </button>
              <button 
                onClick={() => alert('Generating Report PDF...')}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow transition"
              >
                <FileText className="w-4 h-4" />
                <span>PDF</span>
              </button>
              
              <div className="flex items-center space-x-2 text-sm text-slate-600 pl-2">
                <span>Show</span>
                <select 
                  value={entriesPerPage} 
                  onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                  className="border border-slate-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-purple-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>entries</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600 font-medium">Search:</span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search project..."
                className="border border-slate-300 rounded-lg px-4 py-1.5 text-sm w-full sm:w-64 focus:outline-none focus:border-purple-500" 
              />
            </div>
          </div>

          {/* Data Table Container with Horizontal Scroll */}
          <div className="overflow-x-auto border border-[#7b68ee]/40 rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse text-[11px] sm:text-xs whitespace-nowrap">
              <thead>
                {/* Top Header Row */}
                <tr className="bg-[#6b58e8] text-white font-bold tracking-wide text-center">
                  <th className="p-3 border-r border-purple-400 align-middle" rowSpan={2}>SL</th>
                  <th className="p-3 border-r border-purple-400 text-left align-middle" rowSpan={2}>PROJECT NAME</th>
                  <th className="p-3 border-r border-purple-400 align-middle" rowSpan={2}>PROJECT HANDOVER DATE</th>
                  <th className="p-2 border-r border-b border-purple-400" colSpan={4}>PROJECT COST</th>
                  <th className="p-2 border-r border-b border-purple-400" colSpan={4}>COLLECTION</th>
                  <th className="p-2 border-purple-400" colSpan={4}>COLLECTION VS EXPENSES</th>
                </tr>
                {/* Sub Group Header Row */}
                <tr className="bg-[#6b58e8] text-white font-bold tracking-wide text-center">
                  {/* Cost */}
                  <th className="p-2 border-r border-purple-400">BUDGET</th>
                  <th className="p-2 border-r border-purple-400">ACTUAL EXP</th>
                  <th className="p-2 border-r border-purple-400">REMAINING</th>
                  <th className="p-2 border-r border-purple-400">%</th>
                  {/* Collection */}
                  <th className="p-2 border-r border-purple-400">BUDGET</th>
                  <th className="p-2 border-r border-purple-400">COLLECTION</th>
                  <th className="p-2 border-r border-purple-400">REMAINING</th>
                  <th className="p-2 border-r border-purple-400">%</th>
                  {/* Collection vs Expenses */}
                  <th className="p-2 border-r border-purple-400">COLLECTION</th>
                  <th className="p-2 border-r border-purple-400">ACTUAL EXP</th>
                  <th className="p-2 border-r border-purple-400">VARIANCE</th>
                  <th className="p-2">%</th>
                </tr>
              </thead>
              <tbody className="bg-white text-slate-700">
                {filteredData.map((row) => (
                  <tr key={row.sl} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="p-3 border-r border-slate-200 text-center">{row.sl}</td>
                    <td className="p-3 border-r border-slate-200 font-medium text-slate-900">{row.projectName}</td>
                    <td className="p-3 border-r border-slate-200 text-center">{row.handoverDate}</td>
                    {/* Cost */}
                    <td className="p-3 border-r border-slate-200 text-right">{row.costBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 border-r border-slate-200 text-right">{row.costActual.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 border-r border-slate-200 text-right">{row.costRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 border-r border-slate-200 text-center">{row.costPercentage}</td>
                    {/* Collection */}
                    <td className="p-3 border-r border-slate-200 text-right">{row.colBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 border-r border-slate-200 text-right">{row.colActual.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 border-r border-slate-200 text-right">{row.colRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 border-r border-slate-200 text-center">{row.colPercentage}</td>
                    {/* Collection vs Expenses */}
                    <td className="p-3 border-r border-slate-200 text-right">{row.colVsExpCollection.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 border-r border-slate-200 text-right">{row.colVsExpActual.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 border-r border-slate-200 text-right">{row.variance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-center">{row.variancePercentage}</td>
                  </tr>
                ))}

                {/* Total Row */}
                <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td className="p-3.5 border-r border-slate-200 uppercase" colSpan={3}>TOTAL</td>
                  {/* Cost Totals */}
                  <td className="p-3.5 border-r border-slate-200 text-right">{totalCostBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3.5 border-r border-slate-200 text-right">{totalCostActual.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3.5 border-r border-slate-200 text-right">{totalCostRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3.5 border-r border-slate-200"></td>
                  {/* Collection Totals */}
                  <td className="p-3.5 border-r border-slate-200 text-right">{totalColBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3.5 border-r border-slate-200 text-right">{totalColActual.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3.5 border-r border-slate-200 text-right">{totalColRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3.5 border-r border-slate-200"></td>
                  {/* Collection vs Expenses Totals */}
                  <td className="p-3.5 border-r border-slate-200 text-right">{totalColVsExpCollection.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3.5 border-r border-slate-200 text-right">{totalColVsExpActual.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3.5 border-r border-slate-200 text-right">{totalVariance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3.5"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer & Pagination Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-sm text-slate-600">
            <div>
              Showing 1 to {filteredData.length} of {rawData.length} entries
            </div>

            <div className="flex items-center space-x-1">
              <button 
                disabled 
                className="px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed"
              >
                Previous
              </button>
              <button className="px-3.5 py-1.5 bg-[#6b58e8] text-white font-semibold rounded-lg shadow">
                1
              </button>
              <button 
                disabled 
                className="px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed"
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