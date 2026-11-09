"use client";

import { CrmPageTemplate } from "@/components/crm/CrmPageTemplate";

export default function SaleOfferPage() {
  return (
    <CrmPageTemplate
      breadcrumb="CRM / Property / Sale Offer"
      title="Sale Offer"
      description="Manage active sale offers on units."
      addLabel="Add Sale Offer"
      apiEndpoint="/flat-land-offers"
      columns={[
        { key: "code", label: "Offer ID" },
        { key: "clientName", label: "Client Name" },
        { key: "unit", label: "Unit" },
        { key: "price", label: "Offer Price" },
        { key: "status", label: "Status" },
        { key: "date", label: "Date" },
      ]}
      transformData={(items) =>
        items.map((item: any) => ({
          id: item.uuid || item.id,
          code: item.code || "N/A",
          clientName: item.customerName || "N/A",
          unit: item.salesBy || (item.flatLand?.flatLandNo ? `Unit ${item.flatLand.flatLandNo}` : "Unit Property"),
          price: item.grandTotal && Number(item.grandTotal) > 0 ? `৳${Number(item.grandTotal).toLocaleString()}` : "—",
          status: item.approvalStatus || "Sent",
          date: item.offerDate ? String(item.offerDate).slice(0, 10) : "—",
        }))
      }
      createFields={[
        {
          key: "code",
          label: "Offer ID",
          type: "text",
          required: true,
          defaultValue: `SO-${Math.floor(1000 + Math.random() * 9000)}`,
          placeholder: "e.g. SO-3301",
        },
        { key: "customerName", label: "Client Name", type: "text", required: true, placeholder: "e.g. Rafiq Islam" },
        { key: "salesBy", label: "Unit", type: "text", placeholder: "e.g. Unit 7C, Aurora Heights" },
        { key: "grandTotal", label: "Offer Price (BDT)", type: "number", required: true, placeholder: "e.g. 18000000" },
        {
          key: "approvalStatus",
          label: "Status",
          type: "select",
          defaultValue: "Sent",
          options: [
            { label: "Sent", value: "Sent" },
            { label: "Accepted", value: "Accepted" },
            { label: "Under Review", value: "Under Review" },
            { label: "Rejected", value: "Rejected" },
          ],
        },
        {
          key: "offerDate",
          label: "Offer Date",
          type: "date",
          defaultValue: new Date().toISOString().slice(0, 10),
        },
      ]}
      rows={[]}
    />
  );
}
