/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { CrmPageTemplate } from "@/components/crm/CrmPageTemplate";

export default function CallReportDetailsPage() {
  return (
    <CrmPageTemplate
      breadcrumb="CRM / Call Center / Call Details"
      title="Call Activity Details"
      description="Detailed call records and interaction history."
      apiEndpoint="/crm/reports/call-log-details"
      transformData={(activities: any[]) =>
        activities.map((activity) => ({
          id: activity.uuid || activity.id,
          date: activity.date ? String(activity.date).slice(0, 10) : "—",
          lead: activity.name || activity.lead?.clientName || activity.lead?.name || `Lead (${activity.leadCode || "N/A"})`,
          leadCode: activity.leadCode || "—",
          phone: activity.number || activity.phone || activity.lead?.phone || "—",
          agent: activity.user || activity.agent || "—",
          callType: (activity.callType || "Call").replace(/_/g, " "),
          duration: activity.duration || "0 sec",
        }))
      }
      columns={[
        { key: "date", label: "Date" },
        { key: "lead", label: "Lead Name" },
        { key: "leadCode", label: "Lead ID" },
        { key: "phone", label: "Phone" },
        { key: "agent", label: "Agent" },
        { key: "callType", label: "Call Type" },
        { key: "duration", label: "Duration" },
      ]}
    />
  );
}
