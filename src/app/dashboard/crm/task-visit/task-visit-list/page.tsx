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
          dueDate: t.due_date || t.dueDate ? String(t.due_date || t.dueDate).slice(0, 10) : "—",
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
      beforeSubmit={(data, isEdit) => {
        const payload: Record<string, any> = { ...data };
        if (data.due_date) {
          payload.dueDate = new Date(data.due_date).toISOString();
          delete payload.due_date;
        }
        if (!payload.assignedTo || !payload.assignedTo.length) {
          payload.assignedTo = ["126ff780-f61a-4474-94e2-9d14953b3c0d"];
        }
        if (payload.priority) {
          payload.priority = payload.priority.charAt(0).toUpperCase() + payload.priority.slice(1);
        }
        if (!isEdit && !payload.status) {
          payload.status = "Todo";
        }
        return payload;
      }}
      createFields={[
        { key: "title", label: "Task Title", type: "text", required: true, placeholder: "e.g. Conduct Site Inspection at Purbachal" },
        { key: "due_date", label: "Target Completion Date", type: "date", required: true },
        {
          key: "priority",
          label: "Priority",
          type: "select",
          defaultValue: "High",
          options: [
            { label: "Low", value: "Low" },
            { label: "Medium", value: "Medium" },
            { label: "High", value: "High" },
            { label: "Critical", value: "Critical" },
            { label: "Urgent", value: "Urgent" },
          ],
        },
        { key: "description", label: "Task Instructions", type: "textarea", placeholder: "Detailed instructions..." },
      ]}
    />
  );
}
