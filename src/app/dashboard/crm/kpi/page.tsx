/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { Gauge, ArrowRight } from "lucide-react";

const KPI_ITEMS = [
  { name: "Employee KPI Setting", href: "/dashboard/crm/kpi/employee-kpi-setting", desc: "Configure targets, call quotas, and visit metrics" },
  { name: "KPI Reports", href: "/dashboard/crm/kpi/reports", desc: "Unified dashboard with employee and team performance metrics" },
  { name: "Employee Call Report", href: "/dashboard/crm/kpi/employee-call-report", desc: "Call volume and outreach target achievements per agent" },
  { name: "Team Call Report", href: "/dashboard/crm/kpi/team-call-report", desc: "Team-level target vs achievement comparison" },
];

export default function KpiIndexPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
          <Gauge size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">CRM KPI Performance</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track employee targets, call volumes, and team KPI metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {KPI_ITEMS.map((item) => (
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
