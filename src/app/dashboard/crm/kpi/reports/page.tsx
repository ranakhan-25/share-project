/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import EmployeeKpiCallReportPage from "./employee-call-report/page";
import TeamKpiReportPage from "./team-call-report/page";
import { Users, UserCheck } from "lucide-react";

export default function KpiReportsDashboard() {
  const [activeTab, setActiveTab] = useState<"employee" | "team">("employee");

  return (
    <div className="space-y-4">
      {/* Header Tabs */}
      <div className="flex items-center gap-2 border-b border-border-default/40 pb-3">
        <button
          onClick={() => setActiveTab("employee")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "employee"
              ? "bg-brand text-white shadow-sm"
              : "bg-surface-elevated text-ink-muted hover:text-ink hover:bg-surface-subtle"
          }`}
        >
          <UserCheck size={14} />
          Employee Call Report
        </button>
        <button
          onClick={() => setActiveTab("team")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "team"
              ? "bg-brand text-white shadow-sm"
              : "bg-surface-elevated text-ink-muted hover:text-ink hover:bg-surface-subtle"
          }`}
        >
          <Users size={14} />
          Team Call Report
        </button>
      </div>

      {/* Tab Content */}
      <div className="transition-opacity duration-200">
        {activeTab === "employee" ? (
          <EmployeeKpiCallReportPage />
        ) : (
          <TeamKpiReportPage />
        )}
      </div>
    </div>
  );
}
