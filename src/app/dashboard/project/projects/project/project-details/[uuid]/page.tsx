/* eslint-disable prettier/prettier */
"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ProjectDetailsIndex() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;

  useEffect(() => {
    router.replace(
      `/dashboard/project/projects/project/project-details/${uuid}/dashboard`
    );
  }, [uuid, router]);

  return <div className="text-center py-10">Redirecting...</div>;
}