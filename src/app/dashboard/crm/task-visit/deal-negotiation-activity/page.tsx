/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { CrmPageTemplate } from "@/components/crm/CrmPageTemplate";

export default function DealNegotiationActivityPage() {
  return (
    <CrmPageTemplate
      breadcrumb="CRM / Tasks & Visits / Deal Negotiations"
      title="Deal Price Negotiations"
      description="Review client price offers, special payment schedules, and executive board discount approvals."
      apiEndpoint="/crm/task-visit/deal-negotiation-activity"
      transformData={(negotiations: any[]) =>
        negotiations.map((n) => ({
          id: n.uuid || n.id,
          property: n.flatLandName || n.property_id || "Prime Plot",
          project: n.projectName || "—",
          client: n.leadName || n.lead?.clientName || (n.leadId ? `Lead #${n.leadId}` : "Direct Client"),
          offer: n.clientOfferedPrice ? `৳${Number(n.clientOfferedPrice).toLocaleString()}` : "—",
          agreed: n.finalPrice ? `৳${Number(n.finalPrice).toLocaleString()}` : "—",
          discount: n.discountAmount ? `৳${Number(n.discountAmount).toLocaleString()}` : "৳0",
          status: (n.approval || n.status || "Pending").toUpperCase(),
          approvedBy: n.approvedBy || "Pending Review",
        }))
      }
      columns={[
        { key: "property", label: "Property / Flat" },
        { key: "project", label: "Project" },
        { key: "client", label: "Client Name" },
        { key: "offer", label: "Client Offer" },
        { key: "agreed", label: "Agreed Price" },
        { key: "discount", label: "Discount" },
        { key: "status", label: "Approval Status" },
        { key: "approvedBy", label: "Approved By" },
      ]}
    />
  );
}
