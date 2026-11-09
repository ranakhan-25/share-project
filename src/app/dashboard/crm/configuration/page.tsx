/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { SlidersHorizontal, ArrowRight } from "lucide-react";

const CONFIG_ITEMS = [
  { name: "Communication Status", href: "/dashboard/crm/configuration/communication-status", desc: "Manage communication and followup categories" },
  { name: "Teams", href: "/dashboard/crm/configuration/teams", desc: "CRM representative groups and hierarchy" },
  { name: "Lead Category", href: "/dashboard/crm/configuration/lead-category", desc: "Client segmentation criteria and classification" },
  { name: "Campaign", href: "/dashboard/crm/configuration/campaign", desc: "Marketing campaigns and source tracking" },
  { name: "Profession", href: "/dashboard/crm/configuration/profession", desc: "Customer employment and profession profiles" },
  { name: "Lead Source", href: "/dashboard/crm/configuration/lead-source", desc: "Marketing channels and lead acquisition sources" },
  { name: "Offers", href: "/dashboard/crm/configuration/offers", desc: "Promotional campaigns and customer discounts" },
  { name: "Area", href: "/dashboard/crm/configuration/area", desc: "Geographical project zones and regions" },
  { name: "Lead Stage", href: "/dashboard/crm/configuration/lead-stage", desc: "Sales pipeline milestones and progression stages" },
  { name: "Project", href: "/dashboard/crm/configuration/project", desc: "Real estate developments and CRM project links" },
  { name: "Price Range", href: "/dashboard/crm/configuration/price-range", desc: "Client budget brackets and price filters" },
  { name: "Requirement Type", href: "/dashboard/crm/configuration/requirement-type", desc: "Property specification types" },
  { name: "Visit Places", href: "/dashboard/crm/configuration/visit-places", desc: "Field locations and customer tour destinations" },
  { name: "Visit Status", href: "/dashboard/crm/configuration/visit-status", desc: "Visit outcome classifications and progress states" },
  { name: "Task Type", href: "/dashboard/crm/configuration/task-type", desc: "Activity classification codes" },
  { name: "Internal Task", href: "/dashboard/crm/configuration/internal-task", desc: "Operational task management and employee assignments" },
];

export default function ConfigurationIndexPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
          <SlidersHorizontal size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">CRM Configuration</h1>
          <p className="text-xs text-gray-500 mt-0.5">Configure master settings, categories, and pipeline workflows.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CONFIG_ITEMS.map((item) => (
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
