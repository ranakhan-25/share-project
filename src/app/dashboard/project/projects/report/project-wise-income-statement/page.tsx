"use client";

import ProjectReportTable from "../project-report-table";

export default function ProjectWiseIncomeStatementPage() {
  return (
    <ProjectReportTable
      title="Project-wise Income Statement"
      endpoint="income/project-wise"
    />
  );
}
