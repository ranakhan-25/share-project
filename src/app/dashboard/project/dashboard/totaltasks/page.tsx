"use client";

import { useEffect, useMemo, useState } from "react";

interface Task {
  uuid: string;
  taskName: string;
  progress: number;
  startDate?: string | null;
  endDate?: string | null;
  duration?: string | null;
  status: string;
  priority: string;
  budget: number;
  cost: number;
}

interface TaskPageResponse {
  rows: Task[];
  totalPages?: number;
}

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"
).replace(/\/+$/, "");
const TASK_API = `${API_BASE}/realbizpro/api/v1/task`;

function readPage(response: unknown): TaskPageResponse {
  let current = response;
  for (let depth = 0; depth < 6; depth += 1) {
    if (Array.isArray(current)) return { rows: current as Task[] };
    if (!current || typeof current !== "object") break;

    const value = current as Record<string, unknown>;
    if (Array.isArray(value.data)) {
      const meta =
        value.meta && typeof value.meta === "object"
          ? (value.meta as Record<string, unknown>)
          : undefined;
      return {
        rows: value.data as Task[],
        totalPages:
          typeof meta?.totalPages === "number" ? meta.totalPages : undefined,
      };
    }
    current = value.data ?? value.tasks ?? value.result;
  }
  return { rows: [] };
}

export default function TotalTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    async function loadTasks() {
      setLoading(true);
      setError("");
      try {
        const allTasks: Task[] = [];
        let page = 1;
        let totalPages = 1;
        do {
          const response = await fetch(
            `${TASK_API}?page=${page}&limit=100`,
            { cache: "no-store" },
          );
          const payload: unknown = await response.json().catch(() => null);
          if (!response.ok) {
            const message =
              payload && typeof payload === "object" && "message" in payload
                ? String((payload as { message: unknown }).message)
                : `Task request failed (${response.status})`;
            throw new Error(message);
          }
          const result = readPage(payload);
          allTasks.push(...result.rows);
          totalPages =
            result.totalPages ??
            (result.rows.length === 100 ? page + 1 : page);
          page += 1;
        } while (page <= totalPages && page <= 100);

        if (active) setTasks(allTasks);
      } catch (cause) {
        if (active) {
          setError(
            cause instanceof Error ? cause.message : "Tasks could not be loaded.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadTasks();
    return () => {
      active = false;
    };
  }, []);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tasks;
    return tasks.filter((task) =>
      [task.taskName, task.status, task.priority]
        .some((value) => String(value ?? "").toLowerCase().includes(query)),
    );
  }, [tasks, search]);

  const totalBudget = tasks.reduce((sum, task) => sum + Number(task.budget || 0), 0);
  const completedCount = tasks.filter(
    (task) => task.status.toLowerCase() === "completed",
  ).length;

  return (
    <main className="min-h-screen space-y-5 bg-slate-50 p-5 text-slate-900">
      <header>
        <h1 className="text-2xl font-bold">Total Tasks</h1>
        <p className="mt-1 text-sm text-slate-500">
          Live task data from the project task API.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-500">Tasks</div>
          <div className="mt-1 text-2xl font-bold">{tasks.length}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-500">Completed</div>
          <div className="mt-1 text-2xl font-bold">{completedCount}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-500">Task Budget</div>
          <div className="mt-1 text-2xl font-bold">{totalBudget.toLocaleString()}</div>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Task List</h2>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks"
            className="rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        {error && (
          <div role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-indigo-600 text-white">
              <tr>
                {["Task", "Progress", "Start Date", "End Date", "Duration", "Status", "Priority", "Budget", "Cost"].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-3 py-2">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="py-8 text-center text-slate-500">Loading tasks…</td></tr>
              ) : filteredTasks.length ? (
                filteredTasks.map((task) => (
                  <tr key={task.uuid} className="border-t">
                    <td className="px-3 py-2 font-medium">{task.taskName}</td>
                    <td className="px-3 py-2">{Number(task.progress || 0)}%</td>
                    <td className="px-3 py-2">{task.startDate || "—"}</td>
                    <td className="px-3 py-2">{task.endDate || "—"}</td>
                    <td className="px-3 py-2">{task.duration || "—"}</td>
                    <td className="px-3 py-2">{task.status}</td>
                    <td className="px-3 py-2">{task.priority}</td>
                    <td className="px-3 py-2">{Number(task.budget || 0).toLocaleString()}</td>
                    <td className="px-3 py-2">{Number(task.cost || 0).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={9} className="py-8 text-center text-slate-500">No tasks found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
