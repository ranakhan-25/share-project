/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prettier/prettier */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Plus, Search, Edit3, Trash2, Loader2 } from "lucide-react";
import api from "@/lib/api";

// ====================== TYPES ======================
interface Project {
  id: string;
  uuid: string;
  code: string;
  name: string;
  projectType: string;
  projectManager: string | null;
  customer?: string | null;
  budget?: number | string | null;
  numberOfStoreys?: number | null;
  description?: string | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  areaCategory?: string | null;
  duration?: string;
}

interface ProjectType {
  id: string;
  uuid: string;
  code: string;
  name: string;
}

// ====================== STATIC DATA ======================
const STATUSES = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Complete", value: "COMPLETE" },
  { label: "On Proposed", value: "ON_PROPOSED" },
];

const PROJECT_MANAGERS = [
  "support sm",
  "Ujjal Howlader",
  "Md.Nayon",
  "Md.Yeamin Sarder",
  "Sheikh Moseddek Ahmed",
  "Md.Arizul",
  "Md.Delwar Hossain",
  "Md.Humayun Kabir",
  "Md.Rubel Hossain",
  "Md.Selim Molla",
  "Saimum Zami",
  "Md. Afsar Mahmud Dewan",
  "Md.Moniruzzaman",
  "A.N.M Abdullah",
  "Akash Bepari",
  "Jeawl Haque Thitas",
  "Md.Kawsar",
  "Md. Abid Hasan",
  "Riad Hossen",
];

const AREAS = [
  "Aftab Nagor",
  "Mirpur",
  "Basundhara R/A",
  "Jolshiri Abashon",
  "Mirpur DOHS",
  "Bashundhara R/A",
  "Rayerbagh",
  "Jolshiri",
];

const USERS = [
  "Admin",
  "Tazmul Reza",
  "Rasel Hosain",
  "Mohin",
  "Sarna",
  "Rowza",
  "Sarna11",
  "Metro Engineering",
];

// ====================== MAIN PAGE ======================
export default function ProjectPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    projectType: "",
    status: "",
    area: "",
    numberOfStoreys: "",
    search: "",
  });

  // Form state
  const [form, setForm] = useState({
    projectType: "",
    projectManager: "",
    code: "",
    name: "",
    description: "",
    budget: "",
    location: "",
    status: "",
    area: "",
    numberOfStoreys: "",
    assignUser: "",
    startDate: "",
    endDate: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // ====================== FETCH PROJECT TYPES ======================
  const fetchProjectTypes = async () => {
    try {
      const res = await api.get("/project-type?page=1&limit=100");
      const json = res.data;
      if (json && (json.success || json.data)) {
        const list = Array.isArray(json.data) ? json.data : json.data?.data || [];
        setProjectTypes(list);
      }
    } catch (err) {
      console.error("Failed to fetch project types:", err);
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
        const mapped = rows.map((p: any) => ({
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
  }, []);

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
      status: "",
      area: "",
      numberOfStoreys: "",
      assignUser: "",
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
      budget: project.budget ? String(project.budget) : "",
      location: project.location || "",
      status: project.status || "",
      area: project.areaCategory || "",
      numberOfStoreys: project.numberOfStoreys
        ? String(project.numberOfStoreys)
        : "",
      assignUser: "",
      startDate: project.startDate || "",
      endDate: project.endDate || "",
    });
    setIsModalOpen(true);
  };

  // ====================== DELETE ======================
  const handleDelete = async (project: Project) => {
    try {
      setDeletingId(project.uuid);
      await api.delete(`/project/${project.uuid}`);
      setProjects((prev) => prev.filter((p) => p.uuid !== project.uuid));
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete project");
    } finally {
      setDeletingId(null);
    }
  };

  // ====================== FORM CHANGE ======================
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ====================== SUBMIT (Create / Update) ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
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

    try {
      if (editingProject) {
        await api.patch(`/project/${editingProject.uuid}`, payload).catch(() => api.put(`/project/${editingProject.uuid}`, payload));
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

  // ====================== FILTERED DATA ======================
  const filtered = projects.filter((p) => {
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
        p.projectManager?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  // ====================== RENDER ======================
  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      <div className="mx-auto max-w-[1600px] space-y-5">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <nav className="flex items-center text-xs sm:text-sm text-slate-500 gap-1.5 sm:gap-2 mb-1">
              <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Home</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Project</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                Project
              </span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Project List
            </h1>
          </div>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 hover:shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Project</span>
          </button>
        </div>

        {/* ====================== FILTERS ====================== */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Project Type
            </label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
              value={filters.projectType}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, projectType: e.target.value }))
              }
            >
              <option value="">All Types</option>
              {projectTypes.map((t) => (
                <option key={t.uuid} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Status
            </label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
            >
              <option value="">All Status</option>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Area
            </label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
              value={filters.area}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, area: e.target.value }))
              }
            >
              <option value="">Select Area</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Number Of Storeys
            </label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
              value={filters.numberOfStoreys}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  numberOfStoreys: e.target.value,
                }))
              }
            >
              <option value="">All Storeys</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="59">59</option>
              <option value="70">70</option>
            </select>
          </div>
        </div>

        {/* ====================== TABLE CONTAINER ====================== */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700 active:scale-95">
                Copy
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-amber-700 active:scale-95">
                CSV
              </button>
              <span className="text-xs sm:text-sm text-slate-600 ml-2">
                Show{" "}
                <select className="h-8 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-800 outline-none">
                  <option>10</option>
                  <option>25</option>
                  <option>50</option>
                </select>{" "}
                entries
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button className="h-9 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50">
                Select Columns ▾
              </button>
              <div className="relative w-48 sm:w-60">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-xs sm:text-sm text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white text-xs font-bold uppercase tracking-wider">
                      <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">ID</th>
                      <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">DURATION</th>
                      <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">PROJECT TYPE</th>
                      <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">PROJECT MANAGER</th>
                      <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">CUSTOMER</th>
                      <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">CODE</th>
                      <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">NAME</th>
                      <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">BUDGET</th>
                      <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">NUMBER OF STOREYS</th>
                      <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">DESCRIPTION</th>
                      <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">LOCATION</th>
                      <th className="px-4 py-3.5 font-semibold text-white text-center tracking-wide">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-700 font-medium">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="text-center py-16 text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <p className="text-sm font-medium">No data available in table</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((p) => (
                        <tr key={p.uuid} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900">{p.id}</td>
                          <td className="px-4 py-3 text-slate-600">{p.duration || "—"}</td>
                          <td className="px-4 py-3 text-slate-700">{p.projectType}</td>
                          <td className="px-4 py-3 text-slate-700">{p.projectManager || "—"}</td>
                          <td className="px-4 py-3 text-slate-700">{p.customer || "—"}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.code}</td>
                          <td className="px-4 py-3 font-bold text-indigo-600">
                            <Link
                              href={`/dashboard/project/projects/project/project-details/${p.uuid}`}
                              className="hover:underline"
                            >
                              {p.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 font-bold text-emerald-600">{p.budget ? Number(p.budget).toLocaleString() : "—"}</td>
                          <td className="px-4 py-3 text-slate-700">{p.numberOfStoreys || "—"}</td>
                          <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{p.description || "—"}</td>
                          <td className="px-4 py-3 text-slate-600">{p.location || "—"}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Edit Button */}
                              <button
                                onClick={() => handleEdit(p)}
                                className="rounded-lg bg-teal-50 p-1.5 text-teal-600 transition hover:bg-teal-100 active:scale-95"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDelete(p)}
                                disabled={deletingId === p.uuid}
                                className="rounded-lg bg-rose-50 p-1.5 text-rose-600 transition hover:bg-rose-100 active:scale-95 disabled:opacity-50"
                                title="Delete"
                              >
                                {deletingId === p.uuid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
                  <button
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed"
                    disabled
                  >
                    Previous
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold shadow-2xs">
                    1
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed"
                    disabled
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ====================== MODAL ====================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingProject ? "Edit Project" : "Project Add"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Project Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Project Type
                  </label>
                  <select
                    name="projectType"
                    value={form.projectType}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select Project Type</option>
                    {projectTypes.map((t) => (
                      <option key={t.uuid} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project Manager */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Project Manager
                  </label>
                  <select
                    name="projectManager"
                    value={form.projectManager}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Select Project Manager</option>
                    {PROJECT_MANAGERS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Code */}
                <div>
                  <label className="block text-sm font-medium mb-1">Code</label>
                  <input
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-gray-50"
                    readOnly={!editingProject}
                  />
                </div>

                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Project Name
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Name"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <input
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Description"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Budget
                  </label>
                  <input
                    name="budget"
                    type="number"
                    value={form.budget}
                    onChange={handleChange}
                    placeholder="Budget"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Location
                  </label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="Location"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Select Status</option>
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Area */}
                <div>
                  <label className="block text-sm font-medium mb-1">Area</label>
                  <select
                    name="area"
                    value={form.area}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Select Area</option>
                    {AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Number of Storeys */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Number of Storeys
                  </label>
                  <input
                    name="numberOfStoreys"
                    type="number"
                    value={form.numberOfStoreys}
                    onChange={handleChange}
                    placeholder="Number of Storeys"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>

                {/* Assign User */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Assign User
                  </label>
                  <select
                    name="assignUser"
                    value={form.assignUser}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Select User</option>
                    {USERS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Start Date
                  </label>
                  <input
                    name="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    End Date
                  </label>
                  <input
                    name="endDate"
                    type="date"
                    value={form.endDate}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}