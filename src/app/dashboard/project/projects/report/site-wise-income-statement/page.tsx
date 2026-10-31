"use client";

import ProjectReportTable from "../project-report-table";

export default function SiteWiseIncomeStatementPage() {
  return (
    <ProjectReportTable
      title="Site-wise Income Statement"
      endpoint="income/site-wise"
    />
  );
}
