'use client';
import PredictiveSearchSelect from "@/components/ui/PredictiveSearchSelect";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronRight, 
  FileSpreadsheet, 
  FileText, 
  ArrowLeft 
} from 'lucide-react';

interface PLRow {
  particulars: string;
  notes?: string;
  type: 'section' | 'item' | 'total';
}

export default function ProfitLossComprehensiveIncome() {
  const router = useRouter();

  // Filter States
  const [reportType, setReportType] = useState<string>('Select Type');
  const [company, setCompany] = useState<string>('Select value');
  const [project, setProject] = useState<string>('Select Project');

  // Profit Loss Comprehensive Income Exact Data Structure matching the image
  const reportData: PLRow[] = [
    { particulars: 'Revenue', type: 'section' },
    { particulars: 'Less : Cost of goods sold', type: 'item' },
    { particulars: 'Gross Profit/(loss)', type: 'total' },
    { particulars: 'Operating expenses', type: 'section' },
    { particulars: 'Net operating profit/(loss)', type: 'total' },
    { particulars: 'Other Income', type: 'section' },
    { particulars: 'Profit/(loss) before tax', type: 'total' },
    { particulars: 'Provision tax', type: 'item' },
    { particulars: 'Profit/(loss) after tax', type: 'total' },
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
            <span className="font-semibold text-slate-900">Profit Loss Comprehensive Income</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm flex-1">
              
              {/* Type */}
              <div>
                <label className="block text-slate-600 font-medium mb-1.5">Type</label>
                <PredictiveSearchSelect
                options={[{"value":"Select Type","label":"Select Type"},{"value":"Detailed","label":"Detailed"},{"value":"Summary","label":"Summary"}]}
                value={reportType}
                onChange={(val: any) => (val)}
                placeholder="Select Type"
              />
              </div>

              {/* Company */}
              <div>
                <label className="block text-slate-600 font-medium mb-1.5">Company</label>
                <PredictiveSearchSelect
                options={[{"value":"Select value","label":"Select value"},{"value":"Somikoron IT Ltd","label":"Somikoron IT Ltd"}]}
                value={company}
                onChange={(val: any) => (val)}
                placeholder="Select value"
              />
              </div>

              {/* Project */}
              <div>
                <label className="block text-slate-600 font-medium mb-1.5">Project</label>
                <PredictiveSearchSelect
                options={[{"value":"Select Project","label":"Select Project"},{"value":"Rifat Eyecon City","label":"Rifat Eyecon City"}]}
                value={project}
                onChange={(val: any) => (val)}
                placeholder="Select Project"
              />
              </div>

            </div>

            {/* Export Action Buttons */}
            <div className="flex items-center space-x-2 pb-0.5">
              <button 
                onClick={() => alert('Exporting Profit Loss Comprehensive Income to Excel...')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center space-x-1.5 shadow transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel</span>
              </button>
              <button 
                onClick={() => alert('Generating Profit Loss Comprehensive Income PDF...')}
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
                  <th className="p-3.5 text-right w-64">NOTES</th>
                </tr>
              </thead>
              <tbody className="bg-white text-slate-700">
                {reportData.map((row, index) => {
                  const isTotal = row.type === 'total';
                  const isSection = row.type === 'section';

                  return (
                    <tr 
                      key={index} 
                      className={`border-b border-slate-200 transition-colors ${
                        isTotal ? 'bg-slate-50 font-bold text-slate-900' :
                        isSection ? 'font-semibold text-slate-900 bg-slate-50/50' :
                        'hover:bg-slate-50'
                      }`}
                    >
                      {/* Particulars with Indentation for sub-items */}
                      <td className={`p-3.5 border-r border-slate-200 ${
                        !isSection && !isTotal ? 'pl-8 text-blue-600 cursor-pointer hover:underline' : ''
                      }`}>
                        {row.particulars}
                      </td>

                      {/* Notes Column */}
                      <td className="p-3.5 text-right font-medium text-slate-500">
                        {row.notes || ''}
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