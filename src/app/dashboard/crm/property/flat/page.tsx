"use client";

import { CrmPageTemplate } from "@/components/crm/CrmPageTemplate";

export default function FlatPage() {
  return (
    <CrmPageTemplate
      breadcrumb="CRM / Property / Flat"
      title="Flat"
      description="Manage flat inventory across all projects."
      addLabel="Add Flat"
      apiEndpoint="/flat-land/flats"
      columns={[
        { key: "flatNo", label: "Flat No" },
        { key: "project", label: "Project" },
        { key: "floor", label: "Floor" },
        { key: "size", label: "Size (sqft)" },
        { key: "status", label: "Status" },
        { key: "price", label: "Price" },
      ]}
      transformData={(items) =>
        items.map((item: any) => ({
          id: item.uuid || item.id,
          flatNo: item.flatLandNo || item.flatNo || "N/A",
          project: item.projectName || item.project?.name || "Main Project",
          floor: item.siteBlock || (item.bedroom ? `${item.bedroom} Bed` : "—"),
          size: item.size ? `${item.size} sqft` : "—",
          status: item.status || "Available",
          price: item.subtotal && Number(item.subtotal) > 0 ? `৳${Number(item.subtotal).toLocaleString()}` : (item.price || "—"),
        }))
      }
      createFields={[
        { key: "flatLandNo", label: "Flat No", type: "text", required: true, placeholder: "e.g. 4B" },
        { key: "projectName", label: "Project Name", type: "text", required: true, placeholder: "e.g. Skyline Residency" },
        { key: "siteBlock", label: "Floor / Block", type: "text", placeholder: "e.g. 4" },
        { key: "size", label: "Size (sqft)", type: "text", placeholder: "e.g. 1450" },
        {
          key: "status",
          label: "Status",
          type: "select",
          defaultValue: "Available",
          options: [
            { label: "Available", value: "Available" },
            { label: "Booked", value: "Booked" },
            { label: "Sold", value: "Sold" },
          ],
        },
        { key: "subtotal", label: "Price (BDT)", type: "number", placeholder: "e.g. 14500000" },
      ]}
      rows={[]}
    />
  );
}
