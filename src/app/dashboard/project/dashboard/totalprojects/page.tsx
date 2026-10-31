/* eslint-disable prettier/prettier */
// projects/project/page.tsx

interface ProjectsPageProps {
  heading?: string;
  initialStatusFilter?: string;
}

export default function ProjectsPage({ heading, initialStatusFilter }: ProjectsPageProps) {
  // আপনার বাকি লজিক
  
  return (
    <div>
      {/* হেডিং দেখানোর জন্য */}
      {heading && <h2 className="text-2xl font-bold mb-4">{heading}</h2>}
      
      {/* বাকি টেবিল বা লিস্ট */}
    </div>
  );
}