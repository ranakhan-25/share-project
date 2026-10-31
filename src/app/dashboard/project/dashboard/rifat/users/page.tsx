"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Pencil, X } from "lucide-react";

interface Project {
  uuid: string;
  name: string;
}

interface ProjectMember {
  uuid: string;
  name: string;
  email: string;
  phone?: string | null;
}

interface MemberForm {
  name: string;
  email: string;
  phone: string;
}

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"
).replace(/\/+$/, "");
const API_ROOT = `${API_BASE}/realbizpro/api/v1`;
const EMPTY_FORM: MemberForm = { name: "", email: "", phone: "" };

function rowsFrom<T>(value: unknown): T[] {
  let current = value;
  for (let depth = 0; depth < 6; depth += 1) {
    if (Array.isArray(current)) return current as T[];
    if (!current || typeof current !== "object") return [];
    const record = current as Record<string, unknown>;
    current = record.data ?? record.rows ?? record.items ?? record.projects;
  }
  return [];
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? (payload as { message: unknown }).message
        : `Request failed (${response.status})`;
    throw new Error(
      Array.isArray(message) ? message.join(", ") : String(message),
    );
  }
  return payload as T;
}

export default function ProjectUsersPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ProjectMember | null>(null);
  const [form, setForm] = useState<MemberForm>(EMPTY_FORM);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const projectResponse = await request<unknown>(
        `${API_ROOT}/project?page=1&limit=100`,
      );
      const foundProject = rowsFrom<Project>(projectResponse).find(
        (item) => item.name?.trim().toLowerCase() === "rifat eyecon city",
      );
      if (!foundProject?.uuid) {
        throw new Error('Project "Rifat Eyecon City" was not found.');
      }
      const memberResponse = await request<unknown>(
        `${API_ROOT}/project/${encodeURIComponent(foundProject.uuid)}/members`,
      );
      setProject(foundProject);
      setMembers(rowsFrom<ProjectMember>(memberResponse));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Project members could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  function openCreate() {
    setEditingMember(null);
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  }

  function openEdit(member: ProjectMember) {
    setEditingMember(member);
    setForm({
      name: member.name,
      email: member.email,
      phone: member.phone ?? "",
    });
    setError("");
    setModalOpen(true);
  }

  async function saveMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project) return;
    setSaving(true);
    setError("");

    try {
      const endpoint = `${API_ROOT}/project/${encodeURIComponent(project.uuid)}/members`;
      await request(
        editingMember
          ? `${endpoint}/${encodeURIComponent(editingMember.uuid)}`
          : endpoint,
        {
          method: editingMember ? "PATCH" : "POST",
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
          }),
        },
      );
      setModalOpen(false);
      setEditingMember(null);
      setForm(EMPTY_FORM);
      await loadMembers();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Project member could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteMember(member: ProjectMember) {
    if (!project || !window.confirm(`Remove ${member.name} from this project?`)) {
      return;
    }
    setError("");
    try {
      await request(
        `${API_ROOT}/project/${encodeURIComponent(project.uuid)}/members/${encodeURIComponent(member.uuid)}`,
        { method: "DELETE" },
      );
      setMembers((current) =>
        current.filter((item) => item.uuid !== member.uuid),
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Project member could not be removed.",
      );
    }
  }

  return (
    <main className="min-h-screen space-y-4 bg-slate-50 p-5 text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-base font-bold">Project Users</h1>
          <p className="mt-1 text-xs text-slate-500">
            {project?.name ?? "Rifat Eyecon City"} team members
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={!project || loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
        >
          <Plus size={16} /> ADD MEMBER
        </button>
      </header>

      {error && (
        <div role="alert" className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-indigo-600 text-[11px] font-bold text-white">
              <tr>
                <th className="w-16 px-4 py-3">#</th>
                <th className="px-4 py-3">NAME</th>
                <th className="px-4 py-3">EMAIL</th>
                <th className="px-4 py-3">PHONE</th>
                <th className="px-4 py-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Loading project members…
                  </td>
                </tr>
              ) : members.length ? (
                members.map((member, index) => (
                  <tr key={member.uuid} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-500">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{member.name}</td>
                    <td className="px-4 py-3">{member.email}</td>
                    <td className="px-4 py-3">{member.phone || "—"}</td>
                    <td className="space-x-3 px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(member)}
                        className="inline-flex text-indigo-600 hover:text-indigo-800"
                        aria-label={`Edit ${member.name}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteMember(member)}
                        className="inline-flex text-rose-500 hover:text-rose-700"
                        aria-label={`Remove ${member.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No project members have been added.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={saveMember}
            className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingMember ? "Edit Project Member" : "Add Project Member"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close dialog"
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <label className="block space-y-1 text-xs font-semibold text-slate-600">
              Name
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                required
                maxLength={150}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal"
              />
            </label>
            <label className="block space-y-1 text-xs font-semibold text-slate-600">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                required
                maxLength={255}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal"
              />
            </label>
            <label className="block space-y-1 text-xs font-semibold text-slate-600">
              Phone
              <input
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
                maxLength={50}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {saving ? "Saving…" : editingMember ? "Update Member" : "Save Member"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
