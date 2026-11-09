/* eslint-disable @typescript-eslint/no-explicit-any *//* eslint-disable prettier/prettier */
"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { crmFetch } from "../../crm-fetch";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PATH = `${API_BASE}/realbizpro/api/v1`;

// ====================== TYPES ======================
interface TeamMember {
  uuid: string;
  name?: string;
  roleInTeam?: string;
  user?: { uuid: string; name: string };
}

interface TeamRecord {
  uuid: string;
  name: string;
  department: string;
  leaderUuid: string;
  leader?: string | { uuid: string; name: string };
  members: TeamMember[];
  addedBy?: any;
  isActive: boolean;
}

interface User {
  uuid: string;
  name: string;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);

  // Dropdown Data
  const [users, setUsers] = useState<User[]>([]);

  // Add / Edit Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TeamRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    leaderUuid: "",
    memberUuids: [] as string[],
  });

  // Delete Confirmation Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTeamToDelete, setSelectedTeamToDelete] =
    useState<TeamRecord | null>(null);

  // ====================== FETCH DATA ======================
  const fetchTeams = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const res = await crmFetch(
        `${API_PATH}/crm/configuration/teams?page=${page}&limit=${entriesPerPage}&search=${search}`,
      );
      const json = await res.json();

      if (json.success) {
        setTeams(json.data.data || []);
        setTotalPages(json.data.meta?.totalPages || 1);
        setTotalEntries(json.data.meta?.total || 0);
      }
    } catch (err) {
      toast.error("Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await crmFetch(
        `${API_PATH}/crm/configuration/teams/dropdown/users`,
      );
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.data || json.data || []);
      }
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  useEffect(() => {
    fetchTeams(currentPage, searchQuery);
  }, [currentPage, entriesPerPage]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
    fetchTeams(1, e.target.value);
  };

  // ====================== FORM HANDLERS ======================
  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setFormData({ name: "", leaderUuid: "", memberUuids: [] });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: TeamRecord) => {
    setEditingRecord(item);
    setFormData({
      name: item.name || "",
      leaderUuid: item.leaderUuid || "",
      memberUuids: item.members?.map((m) => m.uuid) || [],
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Please enter Team Name!");
      return;
    }

    setSubmitting(true);

    // ✅ Edit করার সময় শুধু প্রয়োজনীয় ফিল্ড পাঠানো হচ্ছে
    const payload = editingRecord
      ? {
          // PATCH এর জন্য শুধু পরিবর্তিত ডাটা পাঠানো ভালো, তবে API সব ফিল্ড চাইলে নিচের লাইনগুলো ব্যবহার করুন
          name: formData.name,
          leaderUuid: formData.leaderUuid || null,
          memberUuids: formData.memberUuids,
        }
      : {
          name: formData.name,
          leaderUuid: formData.leaderUuid || null,
          memberUuids: formData.memberUuids,
          createdBy: "Admin",
        };

    try {
      const isEdit = !!editingRecord;
      const url = isEdit
        ? `${API_PATH}/crm/configuration/teams/${editingRecord!.uuid}`
        : `${API_PATH}/crm/configuration/teams`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await crmFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok || json.success) {
        toast.success(isEdit ? "Team Updated!" : "Team Created!");
        setIsModalOpen(false);
        setEditingRecord(null);
        fetchTeams(currentPage, searchQuery);
      } else {
        toast.error(json.message || "Something went wrong");
      }
    } catch (err) {
      toast.error("Network Error");
    } finally {
      setSubmitting(false);
    }
  };

  // ====================== DELETE HANDLERS ======================
  const handleOpenDeleteModal = (item: TeamRecord) => {
    setSelectedTeamToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTeamToDelete) return;
    try {
      const res = await crmFetch(
        `${API_PATH}/crm/configuration/teams/${selectedTeamToDelete.uuid}`,
        {
          method: "DELETE",
        },
      );

      const json = await res.json().catch(() => ({}));

      if (res.ok || json.success) {
        toast.success("Team Deleted!");
        setIsDeleteModalOpen(false);
        setSelectedTeamToDelete(null);
        fetchTeams(currentPage, searchQuery);
      } else {
        toast.error(json.message || "Failed to delete");
      }
    } catch (err) {
      toast.error("Error deleting team");
    }
  };

  // ====================== RENDER ======================
  return (
    <div className="w-full space-y-6 p-4 md:p-6 bg-slate-50/50 dark:bg-background min-h-screen text-foreground font-sans">
      {/* HEADER & ADD BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-border/85 bg-card/70 backdrop-blur-2xl p-6 md:p-8 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Sparkles size={18} className="animate-pulse" /> Leads Management
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mt-1">
            Team
          </h1>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md shadow-indigo-600/30 transition cursor-pointer"
        >
          <Plus size={18} />
          <span>Team Add</span>
        </button>
      </div>

      {/* SHOW ENTRIES & SEARCH BAR */}
      <div className="p-4 md:p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-extrabold text-muted-foreground w-full sm:w-auto">
          <span>Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border rounded-xl bg-background border-border text-foreground font-black text-sm outline-none cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>

        <div className="relative w-full sm:w-80">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none bg-background border-border text-sm font-bold"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/80 text-white font-black uppercase text-xs tracking-wider bg-gradient-to-r from-indigo-600 to-violet-600">
                <th className="py-5 px-4 w-16 text-center">SL</th>
                <th className="py-5 px-4 min-w-[200px]">NAME</th>
                <th className="py-5 px-4 min-w-[180px]">LEADER</th>
                <th className="py-5 px-4 min-w-[200px]">MEMBERS</th>
                <th className="py-5 px-4 min-w-[140px]">ADDED BY</th>
                <th className="py-5 px-4 text-center min-w-[120px]">ACTION</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60 font-semibold text-foreground text-sm">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-muted-foreground"
                  >
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                  </td>
                </tr>
              ) : teams.length > 0 ? (
                teams.map((item, index) => (
                  <tr
                    key={item.uuid}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <td className="py-4 px-4 font-mono font-bold text-center text-muted-foreground">
                      {(currentPage - 1) * entriesPerPage + index + 1}
                    </td>
                    <td className="py-4 px-4 font-extrabold text-foreground">
                      {item.name}
                    </td>

                    <td className="py-4 px-4 font-bold text-muted-foreground">
                      {typeof item.leader === "string"
                        ? item.leader
                        : item.leader?.name
                          ? item.leader.name
                          : item.leaderUuid || "—"}
                    </td>

                    <td className="py-4 px-4">
                      {item.members && item.members.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.members.map((member: any, idx) => {
                            const memberName =
                              member.user?.name ||
                              member.name ||
                              member.roleInTeam ||
                              (typeof member === "string"
                                ? member
                                : "Unknown Member");

                            return (
                              <span
                                key={idx}
                                className="px-3 py-1 rounded-md text-xs font-black uppercase border bg-amber-500/10 text-amber-600 border-amber-500/20"
                              >
                                {memberName}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="py-4 px-4 font-bold text-muted-foreground">
                      {typeof item.addedBy === "string"
                        ? item.addedBy
                        : item.addedBy?.name
                          ? item.addedBy.name
                          : "Admin"}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleOpenEditModal(item);
                          }}
                          className="p-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white transition cursor-pointer shadow-xs"
                          title="Edit"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleOpenDeleteModal(item);
                          }}
                          className="p-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition cursor-pointer shadow-xs"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-muted-foreground font-bold text-sm"
                  >
                    No teams found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER & PAGINATION */}
        <div className="p-4 md:p-5 border-t border-border/80 bg-card/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-bold text-muted-foreground">
          <div>
            Showing{" "}
            <span className="text-foreground font-black">
              {totalEntries > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="text-foreground font-black">
              {Math.min(currentPage * entriesPerPage, totalEntries)}
            </span>{" "}
            of{" "}
            <span className="text-foreground font-black">{totalEntries}</span>{" "}
            entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-2 rounded-xl border border-border/80 bg-background hover:bg-indigo-50 disabled:opacity-40 transition flex items-center gap-1.5 text-foreground cursor-pointer font-extrabold text-xs"
            >
              <ChevronLeft size={18} />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                      currentPage === page
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-background border border-border/80 hover:bg-slate-100 text-foreground"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3.5 py-2 rounded-xl border border-border/80 bg-background hover:bg-indigo-50 disabled:opacity-40 transition flex items-center gap-1.5 text-foreground cursor-pointer font-extrabold text-xs"
            >
              <span>Next</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* TEAM ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-4 border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
                {editingRecord ? "Team Edit" : "Team Add"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleFormSubmit}
              className="space-y-4 text-xs font-bold"
            >
              <div>
                <label className="block text-slate-500 mb-1.5">
                  Team Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full p-3 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5">
                  Team Leader
                </label>
                <select
                  value={formData.leaderUuid}
                  onChange={(e) =>
                    setFormData({ ...formData, leaderUuid: e.target.value })
                  }
                  className="w-full p-3 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-extrabold outline-none cursor-pointer"
                >
                  <option value="">Select Leader</option>
                  {users.map((user) => (
                    <option key={user.uuid} value={user.uuid}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5">
                  Team Members
                </label>
                <select
                  multiple
                  value={formData.memberUuids}
                  onChange={(e) => {
                    const selectedOptions = Array.from(
                      e.target.selectedOptions,
                      (option) => option.value,
                    );
                    setFormData({ ...formData, memberUuids: selectedOptions });
                  }}
                  className="w-full p-3 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[100px]"
                >
                  {users.map((user) => (
                    <option key={user.uuid} value={user.uuid}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Hold Ctrl (Windows) or Cmd (Mac) to select multiple members.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-400 hover:bg-slate-500 text-white font-bold cursor-pointer transition text-sm"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md cursor-pointer transition text-sm flex items-center gap-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
              Are you sure?
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              You are about to delete{" "}
              <span className="font-bold text-foreground">
                "{selectedTeamToDelete?.name}"
              </span>
              . This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-400 hover:bg-slate-500 text-white font-bold text-xs cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md cursor-pointer transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
