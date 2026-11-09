/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { CarFront, ArrowRight } from "lucide-react";

const TASK_VISIT_ITEMS = [
  {
    name: "Task/Visit List",
    href: "/dashboard/crm/task-visit/task-visit-list",
    desc: "View and schedule field inspections and customer appointments",
  },
  {
    name: "Field Visits",
    href: "/dashboard/crm/task-visit/visits",
    desc: "Detailed records of site visits and client inspections",
  },
  {
    name: "Deal Negotiation Activity",
    href: "/dashboard/crm/task-visit/deal-negotiation-activity",
    desc: "Review customer price offers and director discount decisions",
  },
  {
    name: "Task/Visit Summary Report",
    href: "/dashboard/crm/task-visit/task-visit-summary-report",
    desc: "Aggregated performance summary across all officers",
  },
  {
    name: "Task/Visit Details Report",
    href: "/dashboard/crm/task-visit/task-visit-details-report",
    desc: "Detailed audit logs of inspections and site tours",
  },
];

export default function TaskVisitIndexPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
          <CarFront size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Task & Visit Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Field property inspections, customer site tours, and negotiations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TASK_VISIT_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group block p-4 rounded-xl border border-gray-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-gray-900 group-hover:text-indigo-600 transition-colors">
                {item.name}
              </h3>
              <ArrowRight
                size={14}
                className="text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
