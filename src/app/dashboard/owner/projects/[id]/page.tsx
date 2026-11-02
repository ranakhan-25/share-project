import { OwnerFeaturePage } from "@/components/dashboard/OwnerFeaturePage";

export default async function OwnerProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OwnerFeaturePage feature="detail" projectId={id} />;
}
