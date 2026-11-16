"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getStoredAccessToken } from "@/lib/admin-auth/adminAuthStorage";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"}/realbizpro/api/v1`
).replace(/\/+$/, "");

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ProjectDetailsIndex() {
  const params = useParams();
  const router = useRouter();
  const rawUuid = (params?.uuid as string) || "uuid";

  useEffect(() => {
    async function resolveProject() {
      // If it's already a valid dynamic UUID, redirect to dashboard
      if (UUID_REGEX.test(rawUuid)) {
        router.replace(
          `/dashboard/project/projects/project/project-details/${rawUuid}/dashboard`
        );
        return;
      }

      // If uuid is literal "uuid" or placeholder, fetch the first available project's dynamic UUID
      try {
        const token = getStoredAccessToken();
        const res = await fetch(`${API_BASE}/project?page=1&limit=1`, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const json = await res.json();
        const projects = Array.isArray(json.data) ? json.data : json.data?.data || [];
        if (projects.length > 0 && projects[0].uuid) {
          router.replace(
            `/dashboard/project/projects/project/project-details/${projects[0].uuid}/dashboard`
          );
          return;
        }
      } catch (e) {
        console.error("Could not resolve dynamic project uuid:", e);
      }

      // Fallback
      router.replace(
        `/dashboard/project/projects/project/project-details/${rawUuid}/dashboard`
      );
    }

    resolveProject();
  }, [rawUuid, router]);

  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-500">
      <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
      <span className="text-xs font-medium">Resolving dynamic project details...</span>
    </div>
  );
}
