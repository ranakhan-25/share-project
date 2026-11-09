"use client";

import { CrmPageTemplate } from "@/components/crm/CrmPageTemplate";

export default function BookingPage() {
  return (
    <CrmPageTemplate
      breadcrumb="CRM / Property / Booking"
      title="Booking"
      description="Manage property bookings and reservation status."
      addLabel="Add Booking"
      apiEndpoint="/flat-land-bookings"
      columns={[
        { key: "code", label: "Booking ID" },
        { key: "clientName", label: "Client Name" },
        { key: "unit", label: "Unit" },
        { key: "bookingDate", label: "Booking Date" },
        { key: "status", label: "Status" },
      ]}
      transformData={(items) =>
        items.map((item: any) => ({
          id: item.uuid || item.id,
          code: item.code || "N/A",
          clientName: item.customerName || "N/A",
          unit: item.salesBy || (item.flatLand?.flatLandNo ? `Unit ${item.flatLand.flatLandNo}` : "Unit Property"),
          bookingDate: item.bookingDate ? String(item.bookingDate).slice(0, 10) : "—",
          status: item.status || "Confirmed",
        }))
      }
      createFields={[
        {
          key: "code",
          label: "Booking ID",
          type: "text",
          required: true,
          defaultValue: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
          placeholder: "e.g. BK-2201",
        },
        { key: "customerName", label: "Client Name", type: "text", required: true, placeholder: "e.g. Nusrat Jahan" },
        { key: "salesBy", label: "Unit / Property", type: "text", placeholder: "e.g. Unit 4B, Skyline Residency" },
        {
          key: "bookingDate",
          label: "Booking Date",
          type: "date",
          defaultValue: new Date().toISOString().slice(0, 10),
        },
        {
          key: "status",
          label: "Status",
          type: "select",
          defaultValue: "Confirmed",
          options: [
            { label: "Confirmed", value: "Confirmed" },
            { label: "Pending", value: "Pending" },
            { label: "Cancelled", value: "Cancelled" },
          ],
        },
        { key: "grandTotal", label: "Total Cost (BDT)", type: "number", placeholder: "e.g. 5000000" },
      ]}
      rows={[]}
    />
  );
}
