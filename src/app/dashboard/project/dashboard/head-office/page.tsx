"use client";

import ProjectApiDashboard from "../project-api-dashboard";

export default function HeadOfficeDashboardPage() {
  return (
    <ProjectApiDashboard
      projectName="Head Office"
      detailsHref="/dashboard/project/head-office-details"
    />
  );
}
