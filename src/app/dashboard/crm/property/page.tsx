/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";

const PROPERTY_ITEMS = [
  { name: "Flat Inventory", href: "/dashboard/crm/property/flat", desc: "Manage residential and commercial flat units" },
  { name: "Land Plots", href: "/dashboard/crm/property/land", desc: "Plot listings, boundaries, and availability" },
  { name: "Bookings", href: "/dashboard/crm/property/booking", desc: "Customer property reservations and booking logs" },
  { name: "Sale Offers", href: "/dashboard/crm/property/sale-offer", desc: "Customer proposals and special deal terms" },
  { name: "Quotations", href: "/dashboard/crm/property/quotations", desc: "Official price estimates and payment schedule offers" },
];

export default function PropertyIndexPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
          <Building2 size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">CRM Property Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Explore flat inventory, land plots, client bookings, and quotations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROPERTY_ITEMS.map((item) => (
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
