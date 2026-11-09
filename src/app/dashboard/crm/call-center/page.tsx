/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { PhoneCall, ArrowRight } from "lucide-react";

const CALL_ITEMS = [
  { name: "Follow Up", href: "/dashboard/crm/call-center/follow-up", desc: "Manage scheduled client calls and communication outcomes" },
  { name: "Call Report", href: "/dashboard/crm/call-center/call-report", desc: "Representative call summary, durations, and counts" },
  { name: "Call Details Report", href: "/dashboard/crm/call-center/call-report-details", desc: "Individual telephone log history and notes" },
  { name: "Call Assign History", href: "/dashboard/crm/call-center/call-assign-history", desc: "Historical records of call tasks assigned across agents" },
];

export default function CallCenterIndexPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
          <PhoneCall size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Call Center</h1>
          <p className="text-xs text-gray-500 mt-0.5">Telephone communication, scheduled follow-ups, and representative logs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {CALL_ITEMS.map((item) => (
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
