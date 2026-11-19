/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Plus, Edit3, Trash2, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { getStoredUser } from "@/lib/admin-auth/adminAuthStorage";
import PredictiveSearchSelect from "@/components/ui/PredictiveSearchSelect";
import PredictiveSearchInput from "@/components/ui/PredictiveSearchInput";

// ====================== TYPES ======================
interface Project {
  id: string;
  uuid: string;
  name: string;
  code: string;
  projectType: string;
  areaCategory?: string;
  location?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  totalBudget?: number;
  budget?: number;
  numberOfStoreys?: number;
  status: string;
  duration?: string;
  projectManager?: string;
  customer?: string;
  createdBy?: string;
  clientEmail?: string;
}

interface ProjectType {
  id: string;
  uuid: string;
  name: string;
}

const STATUSES = [
  { value: "PLANNING", label: "Planning" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const AREAS = [
  "Baridhara",
  "Bashundhara",
  "Dhanmondi",
  "Gulshan",
  "Mirpur",
  "Mohakhali",
  "Uttara",
];

const PROJECT_MANAGERS = [
  "Rana Khan",
  "Engr. Tariqul Islam Chowdhury",
  "Md. Abdul Alim",
  "Ar. Fahim Ahmed",
  "Tanvir Hasan",
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Active logged-in user for tenant isolation
  const [storedUser, setStoredUser] = useState<any>(null);

  useEffect(() => {
    setStoredUser(getStoredUser());
  }, []);

  const userEmail = (storedUser?.email || "").toLowerCase().trim();

  // Filters State
  const [filters, setFilters] = useState({
    projectType: "",
    status: "",
    area: "",
    numberOfStoreys: "",
    search: "",
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form State
  const [form, setForm] = useState({
    projectType: "",
    projectManager: "",
    code: "",
    name: "",
    description: "",
    budget: "",
    location: "",
    status: "ACTIVE",
    area: "",
    numberOfStoreys: "",
    startDate: "",
    endDate: "",
  });

  // ====================== FETCH PROJECT TYPES ======================
  const fetchProjectTypes = async () => {
    try {
      const res = await api.get("/project-type?page=1&limit=100");
      const json = res.data;
      if (json && (json.success || json.data)) {
        const rows = Array.isArray(json.data) ? json.data : json.data?.data || [];
        setProjectTypes(rows);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ====================== FETCH PROJECTS ======================
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get("/project?page=1&limit=100");
      const json = res.data;
      if (json && (json.success || json.data)) {
        const rows = Array.isArray(json.data) ? json.data : json.data?.data || [];

        // Strict isolation by logged in user email
        const userScoped = userEmail
          ? rows.filter((p: any) => {
              const creator = String(p.createdBy || "").toLowerCase().trim();
              const client = String(p.clientEmail || "").toLowerCase().trim();
              const manager = String(p.projectManager || "").toLowerCase().trim();
              const emailField = String(p.email || p.userEmail || "").toLowerCase().trim();
              return (
                creator === userEmail ||
                client === userEmail ||
                manager === userEmail ||
                emailField === userEmail ||
                creator === String(storedUser?.id) ||
                (storedUser?.username &&
                  creator === storedUser.username.toLowerCase())
              );
            })
          : [];

        const mapped = userScoped.map((p: any) => ({
          ...p,
          duration:
            p.startDate || p.endDate
              ? `From: ${p.startDate ? formatDate(p.startDate) : "N/A"} To: ${
                  p.endDate ? formatDate(p.endDate) : "N/A"
                }`
              : "From: N/A To: N/A",
          budget: p.totalBudget,
        }));
        setProjects(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchProjectTypes();
  }, [userEmail]);

  // ====================== HELPERS ======================
  function formatDate(dateStr: string) {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // ====================== OPEN CREATE ======================
  const handleCreate = () => {
    setEditingProject(null);
    const random = Math.floor(100000 + Math.random() * 900000);
    setForm({
      projectType: "",
      projectManager: "",
      code: `P${random}`,
      name: "",
      description: "",
      budget: "",
      location: "",
      status: "ACTIVE",
      area: "",
      numberOfStoreys: "",
      startDate: "",
      endDate: "",
    });
    setIsModalOpen(true);
  };

  // ====================== OPEN EDIT ======================
  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setForm({
      projectType: project.projectType || "",
      projectManager: project.projectManager || "",
      code: project.code || "",
      name: project.name || "",
      description: project.description || "",
      budget: project.budget !== undefined && project.budget !== null ? String(project.budget) : "",
      location: project.location || "",
      status: project.status || "ACTIVE",
      area: project.areaCategory || "",
      numberOfStoreys: project.numberOfStoreys !== undefined && project.numberOfStoreys !== null ? String(project.numberOfStoreys) : "",
      startDate: project.startDate ? project.startDate.split("T")[0] : "",
      endDate: project.endDate ? project.endDate.split("T")[0] : "",
    });
    setIsModalOpen(true);
  };

  // ====================== DELETE ======================
  const handleDelete = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"?`)) return;
    try {
      setDeletingId(project.uuid);
      await api.delete(`/project/${project.uuid}`);
      setProjects((prev) => prev.filter((p) => p.uuid !== project.uuid));
    } catch (err: any) {
      alert(err.message || "Failed to delete project");
    } finally {
      setDeletingId(null);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ====================== SUBMIT (Create / Update) ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload: any = {
      code: form.code,
      name: form.name,
      projectType: form.projectType,
      areaCategory: form.area,
      location: form.location,
      description: form.description,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      projectManager: form.projectManager,
      totalBudget: form.budget ? Number(form.budget) : null,
      numberOfStoreys: form.numberOfStoreys ? Number(form.numberOfStoreys) : null,
      status: form.status || "ACTIVE",
    };

    if (!editingProject && userEmail) {
      payload.createdBy = userEmail;
      payload.clientEmail = userEmail;
    }

    try {
      if (editingProject) {
        await api
          .patch(`/project/${editingProject.uuid}`, payload)
          .catch(() => api.put(`/project/${editingProject.uuid}`, payload));
      } else {
        await api.post("/project", payload);
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      alert(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // Predictive search suggestions extracted from live dataset
  const predictiveSuggestions = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.name) set.add(p.name);
      if (p.code) set.add(p.code);
      if (p.projectManager) set.add(p.projectManager);
      if (p.location) set.add(p.location);
    });
    return Array.from(set).slice(0, 30);
  }, [projects]);

  // ====================== FILTERED DATA ======================
  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (filters.projectType && p.projectType !== filters.projectType)
        return false;
      if (filters.status && p.status !== filters.status) return false;
      if (filters.area && p.areaCategory !== filters.area) return false;
      if (
        filters.numberOfStoreys &&
        String(p.numberOfStoreys) !== filters.numberOfStoreys
      )
        return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        return (
          p.name?.toLowerCase().includes(s) ||
          p.code?.toLowerCase().includes(s) ||
          p.projectManager?.toLowerCase().includes(s) ||
          p.location?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [projects, filters]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <nav className="flex items-center text-xs sm:text-sm text-slate-500 gap-1.5 sm:gap-2 mb-1">
              <span className="hover:text-emerald-700 cursor-pointer font-medium transition">
                Home
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="hover:text-emerald-700 cursor-pointer font-medium transition">
                Project
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                Project
              </span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Project List
            </h1>
            {userEmail && (
              <p className="text-xs text-slate-500 mt-0.5">
                Filtered for account: <strong className="text-emerald-700">{userEmail}</strong>
              </p>
            )}
          </div>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-700 hover:shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Project</span>
          </button>
        </div>

        {/* ====================== FILTERS WITH PREDICTIVE SEARCH ====================== */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Project Type
            </label>
            <PredictiveSearchSelect
              value={filters.projectType}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, projectType: val }))
              }
              placeholder="All Types"
              options={projectTypes.map((t) => ({
                value: t.name,
                label: t.name,
              }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Status
            </label>
            <PredictiveSearchSelect
              value={filters.status}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, status: val }))
              }
              placeholder="All Status"
              options={STATUSES}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Area
            </label>
            <PredictiveSearchSelect
              value={filters.area}
              onChange={(val) => setFilters((prev) => ({ ...prev, area: val }))}
              placeholder="All Areas"
              options={AREAS.map((a) => ({ value: a, label: a }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Predictive Search
            </label>
            <PredictiveSearchInput
              value={filters.search}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, search: val }))
              }
              placeholder="Type project name, code, manager..."
              suggestions={predictiveSuggestions}
            />
          </div>
        </div>

        {/* ====================== TABLE ====================== */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-emerald-600 text-[11px] font-semibold uppercase tracking-wider text-white">
                    <tr>
                      <th className="px-4 py-3.5">SL</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">Duration</th>
                      <th className="px-4 py-3.5">Project Type</th>
                      <th className="px-4 py-3.5">Manager</th>
                      <th className="px-4 py-3.5">Customer</th>
                      <th className="px-4 py-3.5">Code</th>
                      <th className="px-4 py-3.5">Project Name</th>
                      <th className="px-4 py-3.5">Budget (৳)</th>
                      <th className="px-4 py-3.5">Storeys</th>
                      <th className="px-4 py-3.5">Description</th>
                      <th className="px-4 py-3.5">Location</th>
                      <th className="px-4 py-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={13}
                          className="px-4 py-12 text-center text-slate-400 text-xs"
                        >
                          No project records found.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((p, idx) => (
                        <tr
                          key={p.uuid}
                          className="hover:bg-emerald-50/40 transition-colors"
                        >
                          <td className="px-4 py-3 text-slate-500 font-medium">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {p.status || "ACTIVE"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                            {p.duration}
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-medium">
                            {p.projectType}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {p.projectManager || "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {p.customer || "—"}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-emerald-800">
                            {p.code}
                          </td>
                          <td className="px-4 py-3 font-bold text-emerald-700">
                            <Link
                              href={`/dashboard/project/projects/project/project-details/${p.uuid}`}
                              className="hover:underline"
                            >
                              {p.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 font-bold font-mono text-emerald-700">
                            {p.budget ? `৳${Number(p.budget).toLocaleString()}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {p.numberOfStoreys || "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                            {p.description || "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {p.location || "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEdit(p)}
                                className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600 transition hover:bg-emerald-100 active:scale-95"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(p)}
                                disabled={deletingId === p.uuid}
                                className="rounded-lg bg-rose-50 p-1.5 text-rose-600 transition hover:bg-rose-100 active:scale-95 disabled:opacity-50"
                                title="Delete"
                              >
                                {deletingId === p.uuid ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
                <span>
                  Showing {filtered.length > 0 ? 1 : 0} to {filtered.length} of {filtered.length} entries
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-lg bg-emerald-600 px-3 py-1 text-white font-semibold shadow-2xs">
                    Page 1
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ====================== MODAL ====================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-slate-900">
                {editingProject ? "Edit Project" : "Add Project"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700">
                    Project Type * (Predictive Select)
                  </label>
                  <PredictiveSearchSelect
                    value={form.projectType}
                    onChange={(val) => setForm((prev) => ({ ...prev, projectType: val }))}
                    placeholder="Select Type"
                    options={projectTypes.map((t) => ({ value: t.name, label: t.name }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700">
                    Project Manager (Predictive Select)
                  </label>
                  <PredictiveSearchSelect
                    value={form.projectManager}
                    onChange={(val) => setForm((prev) => ({ ...prev, projectManager: val }))}
                    placeholder="Select Manager"
                    options={PROJECT_MANAGERS.map((m) => ({ value: m, label: m }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700">Code</label>
                  <input
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    className="h-10 w-full border border-slate-200 rounded-xl px-3 text-xs bg-slate-50 font-mono font-medium"
                    readOnly={!editingProject}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700">
                    Project Name *
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Project Name"
                    className="h-10 w-full border border-slate-200 rounded-xl px-3 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700">
                    Budget (৳)
                  </label>
                  <input
                    name="budget"
                    type="number"
                    value={form.budget}
                    onChange={handleChange}
                    placeholder="Budget"
                    className="h-10 w-full border border-slate-200 rounded-xl px-3 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700">
                    Location
                  </label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="Location"
                    className="h-10 w-full border border-slate-200 rounded-xl px-3 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700">
                    Status (Predictive Select)
                  </label>
                  <PredictiveSearchSelect
                    value={form.status}
                    onChange={(val) => setForm((prev) => ({ ...prev, status: val }))}
                    placeholder="Select Status"
                    options={STATUSES}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700">
                    Area (Predictive Select)
                  </label>
                  <PredictiveSearchSelect
                    value={form.area}
                    onChange={(val) => setForm((prev) => ({ ...prev, area: val }))}
                    placeholder="Select Area"
                    options={AREAS.map((a) => ({ value: a, label: a }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700">
                    Number of Storeys
                  </label>
                  <input
                    name="numberOfStoreys"
                    type="number"
                    value={form.numberOfStoreys}
                    onChange={handleChange}
                    placeholder="e.g. 10"
                    className="h-10 w-full border border-slate-200 rounded-xl px-3 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                    className="h-10 w-full border border-slate-200 rounded-xl px-3 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    onChange={handleChange}
                    className="h-10 w-full border border-slate-200 rounded-xl px-3 text-xs"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold mb-1 text-slate-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Project description..."
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{submitting ? "Saving..." : "Save Project"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
