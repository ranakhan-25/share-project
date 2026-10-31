"use client";

import ProjectApiPage from "@/components/project/project-api-page";
import { projectPageConfigs } from "@/components/project/project-page-config";

export default function ProjectApiRoute() {
  return <ProjectApiPage {...projectPageConfigs.saleOffer} />;
}
