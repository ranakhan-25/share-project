/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, ArrowLeft } from "lucide-react";
import { getStoredAccessToken, getStoredUser } from "@/lib/admin-auth/adminAuthStorage";

interface Project {
  id: string;
  uuid: string;
  name: string;
  code: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  createdBy?: string;
  clientEmail?: string;
}

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"}/realbizpro/api/v1`
).replace(/\/+$/, "");

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Duration Calculation Function
const calculateDuration = (startDate?: string | null, endDate?: string | null) => {
  if (!startDate || !endDate) return "Duration: N/A";

  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  if (isNaN(start) || isNaN(end)) return "Duration: N/A";

  const diff = end - start;
  if (diff < 0) return "Completed";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${days} Day : ${hours} Hr : ${minutes} Min : ${seconds} Sec`;
};

export default function ProjectDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const rawUuid = (params?.uuid as string) || "uuid";

  const [project, setProject] = useState<Project | null>(null);
  const [activeUuid, setActiveUuid] = useState<string>(rawUuid);

  const storedUser = useMemo(() => getStoredUser(), []);
  const userEmail = (storedUser?.email || "").toLowerCase().trim();

  useEffect(() => {
    let isMounted = true;

    const fetchProject = async () => {
      try {
        const token = getStoredAccessToken();
        const headers = {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        // If literal "uuid", resolve real dynamic project
        let targetUuid = rawUuid;
        if (!UUID_REGEX.test(rawUuid)) {
          const listRes = await fetch(`${API_BASE}/project?page=1&limit=1`, { headers });
          if (listRes.ok) {
            const listJson = await listRes.json();
            const list = Array.isArray(listJson.data) ? listJson.data : listJson.data?.data || [];
            if (list.length > 0 && list[0].uuid) {
              targetUuid = list[0].uuid;
              if (isMounted) setActiveUuid(targetUuid);
            }
          }
        }

        if (UUID_REGEX.test(targetUuid)) {
          const res = await fetch(`${API_BASE}/project/${targetUuid}`, { headers });
          if (res.ok) {
            const json = await res.json();
            if (json.success || json.data) {
              if (isMounted) setProject(json.data);
            }
          }
        }
      } catch (err) {
        console.error("fetchProject error:", err);
      }
    };

    fetchProject();
    return () => {
      isMounted = false;
    };
  }, [rawUuid]);

  const resolvedUuid = UUID_REGEX.test(rawUuid) ? rawUuid : activeUuid;
  const basePath = `/dashboard/project/projects/project/project-details/${resolvedUuid}`;

  const tabs = [
    { key: "dashboard", label: "Dashboard", href: `${basePath}/dashboard` },
    { key: "boq", label: "BOQ", href: `${basePath}/boq` },
    { key: "task", label: "Task", href: `${basePath}/task` },
    { key: "users", label: "Share Users", href: `${basePath}/users` },
    { key: "details", label: "Details", href: `${basePath}/details` },
    { key: "flat-land", label: "Flat / Land", href: `${basePath}/flat-land` },
    { key: "boq-comparison", label: "BOQ Comparison", href: `${basePath}/boq-comparison` },
    { key: "quotation", label: "Quotation", href: `${basePath}/quotation` },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/project/projects/project"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Projects</span>
          </Link>
          <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {calculateDuration(project?.startDate, project?.endDate)}
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-lg sm:text-xl font-bold text-slate-800">
            {project?.name || "Dynamic Project Workspace"}
          </h1>
          {project?.code && (
            <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {project.code}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {userEmail && (
            <span className="text-xs text-slate-500 hidden sm:inline">
              Account: <strong className="text-emerald-700">{userEmail}</strong>
            </span>
          )}
          <button
            type="button"
            className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center text-white shadow-2xs transition"
            title="Project Active"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex gap-6 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={`py-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                isActive(tab.href)
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-emerald-700 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Page Content */}
      <div className="p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}
