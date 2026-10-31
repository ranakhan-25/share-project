"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ProjectRecord {
  uuid: string;
  code: string;
  name: string;
  projectType?: string | null;
  location?: string | null;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  contactPersonName?: string | null;
  projectManager?: string | null;
  totalBudget?: number | null;
  numberOfStoreys?: number | null;
  progressPercentage?: number | null;
  status?: string;
}

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"
).replace(/\/+$/, "");

function extractProjects(response: unknown): ProjectRecord[] {
  let value = response;
  for (let depth = 0; depth < 6; depth += 1) {
    if (Array.isArray(value)) return value as ProjectRecord[];
    if (!value || typeof value !== "object") return [];
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data as ProjectRecord[];
    value = record.data ?? record.projects ?? record.items;
  }
  return [];
}

export default function ProjectApiDashboard({
  projectName,
  detailsHref,
}: {
  projectName: string;
  detailsHref?: string;
}) {
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProject() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `${API_BASE}/realbizpro/api/v1/project?page=1&limit=100`,
          { cache: "no-store" },
        );
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          const message =
            payload && typeof payload === "object" && "message" in payload
              ? String((payload as { message: unknown }).message)
              : `Project request failed (${response.status})`;
          throw new Error(message);
        }

        const match = extractProjects(payload).find(
          (item) => item.name.trim().toLowerCase() === projectName.toLowerCase(),
        );
        if (!match) throw new Error(`Project "${projectName}" was not found.`);
        if (active) setProject(match);
      } catch (cause) {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Project dashboard could not be loaded.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProject();
    return () => {
      active = false;
    };
  }, [projectName]);

  if (loading) {
    return <main className="p-6 text-sm text-slate-500">Loading project…</main>;
  }

  if (error || !project) {
    return (
      <main className="p-6">
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || "Project data is unavailable."}
        </div>
      </main>
    );
  }

  const budget = Number(project.totalBudget ?? 0);
  const progress = Number(project.progressPercentage ?? 0);
  const cards = [
    ["Budget", budget.toLocaleString()],
    ["Progress", `${progress}%`],
    ["Storeys", project.numberOfStoreys ?? "—"],
    ["Status", project.status ?? "—"],
    ["Project Type", project.projectType || "—"],
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-5 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Project Dashboard</p>
            <h1 className="mt-1 text-2xl font-bold">{project.name}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {project.code} {project.projectType ? `· ${project.projectType}` : ""}
            </p>
          </div>
          {detailsHref && (
            <Link
              href={detailsHref}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Project details
            </Link>
          )}
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map(([label, value]) => (
            <div key={label} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase text-slate-500">
                {label}
              </div>
              <div className="mt-2 text-xl font-bold">{value}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-4 rounded-xl border bg-white p-5 shadow-sm sm:grid-cols-2">
          <div>
            <h2 className="font-semibold">Project details</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Project manager</dt><dd>{project.projectManager || "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Contact</dt><dd>{project.contactPersonName || "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Location</dt><dd>{project.location || "—"}</dd></div>
            </dl>
          </div>
          <div>
            <h2 className="font-semibold">Schedule & progress</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Start date</dt><dd>{project.startDate?.slice(0, 10) || "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">End date</dt><dd>{project.endDate?.slice(0, 10) || "—"}</dd></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-indigo-600" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
              </div>
            </dl>
          </div>
          {project.description && (
            <p className="text-sm text-slate-600 sm:col-span-2">
              {project.description}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
