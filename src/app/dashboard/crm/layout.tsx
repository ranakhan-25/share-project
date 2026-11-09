import type { Metadata } from "next";
import { CrmLayoutClient } from "./layout-client";

export const metadata: Metadata = {
  title: "CRM - RealBiz Pro",
  description: "Customer Relationship Management system for leads, tasks, and negotiations",
};

export default function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CrmLayoutClient>{children}</CrmLayoutClient>;
}
