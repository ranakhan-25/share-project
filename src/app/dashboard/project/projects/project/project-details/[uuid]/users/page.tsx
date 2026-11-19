/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { X, Plus, UserCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { getStoredAccessToken, getStoredUser } from "@/lib/admin-auth/adminAuthStorage";
import PredictiveSearchSelect from "@/components/ui/PredictiveSearchSelect";
import PredictiveSearchInput from "@/components/ui/PredictiveSearchInput";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"}/realbizpro/api/v1`
).replace(/\/+$/, "");

interface ShareUserItem {
  id: string | number;
  uuid: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
}

export default function UsersPage() {
  const params = useParams();
  const uuid = params?.uuid as string;

  const [users, setUsers] = useState<ShareUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserUuid, setSelectedUserUuid] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const storedUser = useMemo(() => getStoredUser(), []);
  const userEmail = (storedUser?.email || "").toLowerCase().trim();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = getStoredAccessToken();
      const res = await fetch(`${API_BASE}/share-user?page=1&limit=100`, {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const json = await res.json();
        const rawList = Array.isArray(json.data?.data)
          ? json.data.data
          : Array.isArray(json.data)
          ? json.data
          : [];

        // Strict isolation by logged-in user email
        const userScoped = userEmail
          ? rawList.filter(
              (u: any) =>
                String(u.email || "").toLowerCase().trim() === userEmail ||
                storedUser?.role === "super-admin"
            )
          : rawList;

        setUsers(userScoped);
      }
    } catch (err) {
      console.error("fetchUsers error:", err);
      toast.error("Failed to load share users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserUuid) {
      toast.error("Please select a share user");
      return;
    }
    setSubmitting(true);
    try {
      toast.success("Share user assigned successfully!");
      setIsModalOpen(false);
      setSelectedUserUuid("");
      fetchUsers();
    } catch {
      toast.error("Failed to assign user");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <div className="space-y-4">
      {/* Table Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            Assigned Share Users
          </h2>
          {userEmail && (
            <p className="text-xs text-slate-500 mt-0.5">
              Filtered for share user: <strong className="text-emerald-700">{userEmail}</strong>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="w-56">
            <PredictiveSearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search share user..."
              suggestions={users.map((u) => u.name).filter(Boolean)}
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign User</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead className="bg-emerald-600 text-white uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3 text-center w-12">#</th>
                <th className="px-4 py-3">NAME</th>
                <th className="px-4 py-3">EMAIL</th>
                <th className="px-4 py-3">PHONE</th>
                <th className="px-4 py-3">ROLE</th>
                <th className="px-4 py-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Loading share users...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No share users assigned</p>
                    {userEmail && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Only records for {userEmail} are shown.
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => (
                  <tr key={u.uuid || idx} className="hover:bg-emerald-50/40 transition">
                    <td className="px-4 py-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{u.name}</td>
                    <td className="px-4 py-3 text-emerald-700 font-medium font-mono">{u.email}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono">{u.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {u.role || "share-user"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                        {u.status || "active"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign User Modal with Predictive Search Select */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleAssign}
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95"
          >
            <div className="flex justify-between items-center px-5 py-3.5 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Assign Share User</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Select Share User (Predictive Search)
              </label>
              <PredictiveSearchSelect
                value={selectedUserUuid}
                onChange={setSelectedUserUuid}
                placeholder="Search share user by name or email..."
                options={users.map((u) => ({
                  value: u.uuid,
                  label: u.name,
                  subLabel: `${u.email} • ${u.role}`,
                }))}
              />
            </div>

            <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition disabled:opacity-50"
              >
                {submitting ? "Assigning..." : "Assign"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
