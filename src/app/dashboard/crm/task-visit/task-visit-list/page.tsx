"use client";

import { CrmPageTemplate } from "@/components/crm/CrmPageTemplate";

export default function TaskVisitListPage() {
  return (
    <CrmPageTemplate
      breadcrumb="CRM / Tasks & Visits / Task List"
      title="Field Visits & Internal Tasks"
      description="Track property field inspections, customer follow-up calls, and legal documentation assignments."
      addLabel="Schedule New Task"
      apiEndpoint="/crm/tasks"
      transformData={(tasks: any[]) =>
        tasks.map((t) => ({
          id: t.uuid || t.id,
          title: t.title,
          priority: (t.priority || "Medium").toUpperCase(),
          dueDate: t.due_date ? String(t.due_date).slice(0, 10) : "—",
          status: (t.status || "Pending").replace(/_/g, " ").toUpperCase(),
          description: t.description || "—",
        }))
      }
      columns={[
        { key: "title", label: "Task / Visit Title" },
        { key: "priority", label: "Priority" },
        { key: "dueDate", label: "Due Date" },
        { key: "status", label: "Status" },
        { key: "description", label: "Details" },
      ]}
      createFields={[
        { key: "title", label: "Task Title", type: "text", required: true, placeholder: "e.g. Conduct Site Inspection at Purbachal" },
        { key: "due_date", label: "Target Completion Date", type: "date", required: true },
        {
          key: "priority",
          label: "Priority",
          type: "select",
          defaultValue: "high",
          options: [
            { label: "Low", value: "low" },
            { label: "Medium", value: "medium" },
            { label: "High", value: "high" },
            { label: "Urgent", value: "urgent" },
          ],
        },
        { key: "description", label: "Task Instructions", type: "textarea", placeholder: "Detailed instructions..." },
      ]}
    />
  );
}
