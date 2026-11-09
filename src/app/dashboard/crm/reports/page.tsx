/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { FileBarChart2, ArrowRight } from "lucide-react";

const REPORT_ITEMS = [
  { name: "Source Wise Lead Report", href: "/dashboard/crm/reports/source-wise-lead-report", desc: "Acquisition channel and lead distribution per officer" },
  { name: "User Wise Report", href: "/dashboard/crm/reports/user-wise-report", desc: "Breakdown of leads, calls, and actions per representative" },
  { name: "User Activity Report", href: "/dashboard/crm/reports/user-active-report", desc: "Daily activity metrics and representative follow-ups" },
  { name: "Sales Pipeline Funnel", href: "/dashboard/crm/reports/sales-pipeline-funnel-report", desc: "Stage progression and funnel conversion rates" },
  { name: "Team Reports", href: "/dashboard/crm/reports/team-reports", desc: "Performance overview categorized by marketing teams" },
  { name: "Interested Flat/Land", href: "/dashboard/crm/reports/interested-flat-land-requirements", desc: "Customer requirements matching property inventory" },
  { name: "Requirements Report", href: "/dashboard/crm/reports/requirements", desc: "Customer property preference and budget log" },
  { name: "Sales Probability", href: "/dashboard/crm/reports/sales-probability", desc: "Forecasted closing rates and high-potential deals" },
  { name: "Flat/Land Sale Report", href: "/dashboard/crm/reports/flat-land-sale-report", desc: "Confirmed sales, payments, and receivable balances" },
  { name: "Missed FollowUp/Visit Summary", href: "/dashboard/crm/reports/missed-followup-visit-summary", desc: "Delayed follow-ups and missed visit reminders" },
  { name: "Deal Negotiation Report", href: "/dashboard/crm/reports/deal-negotiation-reports", desc: "Price negotiations, offers, and approved discounts" },
  { name: "Call Report", href: "/dashboard/crm/reports/call-report", desc: "Executive call activity summary and durations" },
  { name: "Call Details Report", href: "/dashboard/crm/reports/call-details-report", desc: "In-depth audit logs of telephone calls" },
];

export default function ReportsIndexPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
          <FileBarChart2 size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">CRM Reports Hub</h1>
          <p className="text-xs text-gray-500 mt-0.5">Comprehensive analytics, sales performance, and audit reports.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group block p-4 rounded-xl border border-gray-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-gray-900 group-hover:text-indigo-600 transition-colors">
                {item.name}
              </h3>
              <ArrowRight size={14} className="text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
