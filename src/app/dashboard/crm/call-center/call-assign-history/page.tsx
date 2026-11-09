/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { CrmPageTemplate } from "@/components/crm/CrmPageTemplate";

export default function CallAssignHistoryPage() {
  return (
    <CrmPageTemplate
      breadcrumb="CRM / Call Center / Call Assign History"
      title="Call Assignment History"
      description="Calls assigned to CRM representatives and their current status."
      apiEndpoint="/crm/call-center/call-assign-history"
      transformData={(assignments: any[]) =>
        assignments.map((assignment) => ({
          id: assignment.uuid || assignment.id,
          lead: assignment.name || assignment.lead?.name || assignment.lead?.client_name || (assignment.leadCode ? `Lead (${assignment.leadCode})` : "—"),
          leadCode: assignment.leadCode || "—",
          phone: assignment.phone || assignment.lead?.phone || "—",
          assignedFrom: assignment.from?.name || assignment.assigned_from || assignment.assignedFrom || "—",
          assignedTo: assignment.to?.name || assignment.assigned_to || assignment.assignedTo || "—",
          assignedOn: assignment.date ? String(assignment.date).slice(0, 10) : (assignment.assignmentDate ? String(assignment.assignmentDate).slice(0, 10) : "—"),
          status: assignment.status || "Assigned",
          note: assignment.note || assignment.comment || "—",
        }))
      }
      columns={[
        { key: "lead", label: "Lead Name" },
        { key: "leadCode", label: "Lead ID" },
        { key: "phone", label: "Phone" },
        { key: "assignedFrom", label: "Assigned From" },
        { key: "assignedTo", label: "Assigned To" },
        { key: "assignedOn", label: "Assigned Date" },
        { key: "status", label: "Status" },
        { key: "note", label: "Note" },
      ]}
    />
  );
}
