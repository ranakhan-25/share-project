/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { UserRound, ArrowRight } from "lucide-react";

const LEAD_ITEMS = [
  { name: "Lead Directory", href: "/dashboard/crm/lead/lead-list", desc: "Manage full customer directory, call assignments, and follow-ups" },
  { name: "Pipeline", href: "/dashboard/crm/lead/pipeline", desc: "Visual Kanban board of sales leads progressing across deal stages" },
  { name: "CRM Parties", href: "/dashboard/crm/lead/parties", desc: "Direct customer and buyer party directory records" },
  { name: "Junk Leads", href: "/dashboard/crm/lead/junk-lead", desc: "Archived, invalid or inactive lead records with restore capabilities" },
  { name: "Transfer History", href: "/dashboard/crm/lead/transfer-history", desc: "Audit log of lead reassignments across CRM agents" },
];

export default function LeadIndexPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
          <UserRound size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Lead Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Explore lead directory, pipeline progression, and transfer history.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {LEAD_ITEMS.map((item) => (
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
