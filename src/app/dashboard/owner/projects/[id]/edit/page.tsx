import { OwnerFeaturePage } from "@/components/dashboard/OwnerFeaturePage";

export default async function EditOwnerProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OwnerFeaturePage feature="edit" projectId={id} />;
}
