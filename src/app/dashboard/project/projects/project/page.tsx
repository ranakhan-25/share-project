/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prettier/prettier */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/realbizpro/api/v1/project-type`
      );
      const json = await res.json();
      if (json.success) {
        setProjectTypes(json.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch project types:", err);
    }
  };

  // ====================== FETCH PROJECTS ======================
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/realbizpro/api/v1/project`
      );
      const json = await res.json();
      if (json.success) {
        const mapped = json.data.data.map((p: any) => ({
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
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${project.name}"?`
    );
    if (!confirmDelete) return;

    try {
      setDeletingId(project.uuid);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/realbizpro/api/v1/project/${project.uuid}`,
        {
          method: "DELETE",
        }
      );

      const json = await res.json();

      if (json.success || res.ok) {
        // list থেকে সরিয়ে দাও
        setProjects((prev) => prev.filter((p) => p.uuid !== project.uuid));
      } else {
        alert(json.message || "Failed to delete project");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete project");
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
      const url = editingProject
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/realbizpro/api/v1/project/${editingProject.uuid}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/realbizpro/api/v1/project`;

      const method = editingProject ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success || res.ok) {
        setIsModalOpen(false);
        fetchProjects();
      } else {
        alert(json.message || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save project");
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
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-500">
          Home &gt; Project &gt; Project
        </div>
        <button
          onClick={handleCreate}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          + Create Project
        </button>
      </div>

      {/* ====================== FILTERS ====================== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Type
          </label>
          <select
            className="w-full border rounded-md px-3 py-2 text-sm"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            className="w-full border rounded-md px-3 py-2 text-sm"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Area
          </label>
          <select
            className="w-full border rounded-md px-3 py-2 text-sm"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number Of Storeys
          </label>
          <select
            className="w-full border rounded-md px-3 py-2 text-sm"
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

      {/* ====================== TABLE CONTROLS ====================== */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm">
            Copy
          </button>
          <button className="bg-orange-500 text-white px-3 py-1.5 rounded text-sm">
            CSV
          </button>
          <span className="text-sm text-gray-600 ml-2">
            Show{" "}
            <select className="border rounded px-2 py-1 mx-1">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>{" "}
            entries
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button className="border px-3 py-1.5 rounded text-sm">
            Select Columns ▾
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm">Search:</span>
            <input
              type="text"
              className="border rounded px-3 py-1.5 text-sm w-48"
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      {/* ====================== TABLE ====================== */}
      <div className="bg-white rounded-lg border overflow-x-auto">
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-600 text-white">
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">DURATION</th>
                  <th className="px-4 py-3 text-left">PROJECT TYPE</th>
                  <th className="px-4 py-3 text-left">PROJECT MANAGER</th>
                  <th className="px-4 py-3 text-left">CUSTOMER</th>
                  <th className="px-4 py-3 text-left">CODE</th>
                  <th className="px-4 py-3 text-left">NAME</th>
                  <th className="px-4 py-3 text-left">BUDGET</th>
                  <th className="px-4 py-3 text-left">NUMBER OF STOREYS</th>
                  <th className="px-4 py-3 text-left">DESCRIPTION</th>
                  <th className="px-4 py-3 text-left">LOCATION</th>
                  <th className="px-4 py-3 text-left">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.uuid} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{p.id}</td>
                    <td className="px-4 py-3">{p.duration}</td>
                    <td className="px-4 py-3">{p.projectType}</td>
                    <td className="px-4 py-3">{p.projectManager || "-"}</td>
                    <td className="px-4 py-3">{p.customer || "-"}</td>
                    <td className="px-4 py-3">{p.code}</td>
                 <td className="px-4 py-3 text-blue-600 font-medium">
  <Link
    href={`/dashboard/project/projects/project/project-details/${p.uuid}`}
    className="hover:underline"
  >
    {p.name}
  </Link>
</td>
                    <td className="px-4 py-3">{p.budget || "-"}</td>
                    <td className="px-4 py-3">{p.numberOfStoreys || "-"}</td>
                    <td className="px-4 py-3">{p.description || "-"}</td>
                    <td className="px-4 py-3">{p.location || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleEdit(p)}
                          className="bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded"
                          title="Edit"
                        >
                          ✎
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={deletingId === p.uuid}
                          className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === p.uuid ? "..." : "🗑"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-center px-4 py-3 text-sm text-gray-600">
              <span>
                Showing 1 to {filtered.length} of {filtered.length} entries
              </span>
              <div className="flex gap-2">
                <button
                  className="border px-3 py-1 rounded disabled:opacity-50"
                  disabled
                >
                  Previous
                </button>
                <button className="bg-purple-600 text-white px-3 py-1 rounded">
                  1
                </button>
                <button
                  className="border px-3 py-1 rounded disabled:opacity-50"
                  disabled
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
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