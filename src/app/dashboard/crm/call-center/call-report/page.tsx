/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { CrmPageTemplate } from "@/components/crm/CrmPageTemplate";

export default function CallReportPage() {
  return (
    <CrmPageTemplate
      breadcrumb="CRM / Call Center / Call Report"
      title="Call Activity Report"
      description="Summary of incoming and outgoing calls made by CRM agents."
      apiEndpoint="/crm/reports/call-log"
      transformData={(activities: any[]) =>
        activities.map((activity, idx) => ({
          id: activity.userId || activity.uuid || activity.id || String(idx + 1),
          agent: activity.name || activity.userName || "Agent",
          outgoing: Number(activity.outgoing || 0),
          incoming: Number(activity.incoming || 0),
          totalCalls: Number(activity.totalCalls || 0),
          duration: activity.totalDuration || `${activity.totalDurationSeconds || 0} sec`,
        }))
      }
      columns={[
        { key: "agent", label: "Representative / Agent" },
        { key: "outgoing", label: "Outgoing Calls" },
        { key: "incoming", label: "Incoming Calls" },
        { key: "totalCalls", label: "Total Calls" },
        { key: "duration", label: "Total Duration" },
      ]}
    />
  );
}
