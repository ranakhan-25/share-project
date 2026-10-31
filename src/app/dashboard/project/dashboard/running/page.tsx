/* eslint-disable prettier/prettier */
// projects/project/page.tsx
interface ProjectsPageProps {
  initialStatusFilter?: string;
  heading?: string;
}

export default function ProjectsPage({ initialStatusFilter, heading }: ProjectsPageProps) {
  // আপনার বাকি লজিক
  return (
    <div>
      {heading && <h1>{heading}</h1>}
      {/* বাকি কোড */}
    </div>
  );
}