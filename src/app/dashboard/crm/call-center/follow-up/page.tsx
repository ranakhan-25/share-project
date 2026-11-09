/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { CrmPageTemplate } from "@/components/crm/CrmPageTemplate";

export default function FollowUpPage() {
  return (
    <CrmPageTemplate
      breadcrumb="CRM / Call Center / Follow Up"
      title="Lead Follow-Up Center"
      description="Track scheduled customer follow-up actions and call outcomes."
      apiEndpoint="/crm/call-center-follow-up"
      transformData={(followups: any[]) =>
        followups.map((f) => ({
          id: f.uuid || f.id,
          date: f.activityDate ? String(f.activityDate).slice(0, 10) : "—",
          lead: f.lead?.name || f.lead?.clientName || `Lead (${f.lead?.leadCode || "N/A"})`,
          leadCode: f.lead?.leadCode || "—",
          phone: f.lead?.contact || f.lead?.phone || "—",
          project: f.lead?.project?.name || "—",
          assignedTo: f.lead?.assignedUser?.name || f.conductedBy || "—",
          summary: f.note || f.summary || "—",
          status: f.communicationStatus || f.discussionPoints || f.lead?.status || "Pending",
          nextDate: f.nextFollowupDate ? String(f.nextFollowupDate).slice(0, 10) : "—",
        }))
      }
      columns={[
        { key: "date", label: "Date" },
        { key: "lead", label: "Client Name" },
        { key: "leadCode", label: "Lead ID" },
        { key: "phone", label: "Contact Phone" },
        { key: "project", label: "Project" },
        { key: "assignedTo", label: "Assigned To" },
        { key: "summary", label: "Follow-up Note" },
        { key: "status", label: "Status" },
        { key: "nextDate", label: "Next Follow-up" },
      ]}
    />
  );
}
