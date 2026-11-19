/* eslint-disable prettier/prettier */
// projects/project/page.tsx
interface ProjectsPageProps {
  params?: Promise<any>;
  searchParams?: Promise<{ initialStatusFilter?: string; heading?: string }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const resolved = await searchParams;
  return (
    <div>
      {resolved?.heading && <h2 className="text-2xl font-bold mb-4">{resolved.heading}</h2>}
    </div>
  );
}
