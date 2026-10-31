"use client";

import ProjectApiDashboard from "../project-api-dashboard";

export default function LakeGardenDashboardPage() {
  return (
    <ProjectApiDashboard
      projectName="Lake Garden"
      detailsHref="/dashboard/project/lake-details"
    />
  );
}
