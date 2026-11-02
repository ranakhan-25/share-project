import { OwnerFeaturePage } from "@/components/dashboard/OwnerFeaturePage";
import type { OwnerProjectStatus } from "@/lib/owner-projects";

const validStatuses: OwnerProjectStatus[] = ["draft", "pending", "approved", "rejected", "published"];

export default async function OwnerStatusPage({
  params,
}: {
  params: Promise<{ status: string }>;
}) {
  const { status } = await params;
  const ownerStatus = validStatuses.includes(status as OwnerProjectStatus)
    ? (status as OwnerProjectStatus)
    : "draft";
  return <OwnerFeaturePage feature="projects" status={ownerStatus} />;
}
