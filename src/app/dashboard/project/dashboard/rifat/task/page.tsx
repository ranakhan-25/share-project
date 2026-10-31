"use client";

import React, { useState, useEffect } from "react";
import { FileText, Plus, Download, X, Pencil, Trash2, RotateCcw } from "lucide-react";

// =====================================================
// Types
// =====================================================
interface TaskItem {
  uuid: string;
  taskName: string;
  progress: number;
  startDate: string;
  endDate: string;
  duration: string;
  status: "Pending" | "In Progress" | "Completed" | "Delayed";
  completeDate: string;
  priority: "Low" | "Medium" | "High";
  budget: number;
  cost: number;
  available: number;
  completed: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";

export default function TaskPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);

  // Form States
  const [taskName, setTaskName] = useState("");
  const [progress, setProgress] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [duration, setDuration] = useState("");
  const [status, setStatus] = useState<"Pending" | "In Progress" | "Completed" | "Delayed">("In Progress");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [budget, setBudget] = useState(0);
  const [cost, setCost] = useState(0);

  // =====================================================
  // Fetch All Tasks
  // =====================================================
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/realbizpro/api/v1/task`);
      if (!res.ok) throw new Error("Failed to fetch tasks");

      const data = await res.json();

      // Robust extraction – handles many common API shapes
      let list: any[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data?.data)) {
        list = data.data;
      } else if (Array.isArray(data?.data?.data)) {
        list = data.data.data;
      } else if (Array.isArray(data?.tasks)) {
        list = data.tasks;
      } else if (Array.isArray(data?.result)) {
        list = data.result;
      }

      const mapped: TaskItem[] = list.map((item: any) => {
        const budgetVal = Number(item.budget ?? 0);
        const costVal = Number(item.cost ?? 0);

        return {
          uuid: item.uuid || item.id || String(item._id),
          taskName: item.taskName || item.name || item.title || "",
          progress: Number(item.progress ?? 0),
          startDate: item.startDate || item.start_date || "",
          endDate: item.endDate || item.end_date || "",
          duration: item.duration || "",
          status: item.status || "In Progress",
          completeDate: item.completeDate || item.complete_date || "-",
          priority: item.priority || "Medium",
          budget: budgetVal,
          cost: costVal,
          available: Number(item.available ?? budgetVal - costVal),
          completed: item.completed || (item.status === "Completed" ? "Yes" : "No"),
        };
      });

      setTasks(mapped);
    } catch (err) {
      console.error(err);
      alert("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // =====================================================
  // Reset Form
  // =====================================================
  const resetForm = () => {
    setTaskName("");
    setProgress(0);
    setStartDate("");
    setEndDate("");
    setDuration("");
    setStatus("In Progress");
    setPriority("Medium");
    setBudget(0);
    setCost(0);
    setEditingUuid(null);
  };

  // =====================================================
  // Open Create / Edit Modal
  // =====================================================
  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (task: TaskItem) => {
    setEditingUuid(task.uuid);
    setTaskName(task.taskName);
    setProgress(task.progress);
    setStartDate(task.startDate);
    setEndDate(task.endDate);
    setDuration(task.duration);
    setStatus(task.status);
    setPriority(task.priority);
    setBudget(task.budget);
    setCost(task.cost);
    setIsModalOpen(true);
  };

  // =====================================================
  // Create / Update Task
  // =====================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    setSaving(true);

    // IMPORTANT: Backend does NOT accept "available" or "completed"
    // Status must be exactly one of: In Progress, Completed, Pending, Delayed
    const payload = {
      taskName,
      progress: Number(progress),
      startDate: startDate || null,
      endDate: endDate || null,
      duration: duration || null,
      status, // "In Progress" | "Completed" | "Pending" | "Delayed"
      priority,
      budget: Number(budget),
      cost: Number(cost),
      completeDate: status === "Completed" ? (endDate || new Date().toISOString().slice(0, 10)) : null,
    };

    try {
      let res: Response;

      if (editingUuid) {
        res = await fetch(`${API_BASE}/realbizpro/api/v1/task/${editingUuid}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/realbizpro/api/v1/task`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || JSON.stringify(err) || "Failed to save task");
      }

      await fetchTasks();
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // Soft Delete
  // =====================================================
  const handleDelete = async (uuid: string) => {
    if (!confirm("Are you sure you want to soft-delete this task?")) return;

    try {
      const res = await fetch(`${API_BASE}/realbizpro/api/v1/task/${uuid}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");
      await fetchTasks();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  // =====================================================
  // Restore Soft-Deleted Task
  // =====================================================
  const handleRestore = async (uuid: string) => {
    try {
      const res = await fetch(`${API_BASE}/realbizpro/api/v1/task/${uuid}/restore`, {
        method: "PATCH",
      });

      if (!res.ok) throw new Error("Failed to restore");
      await fetchTasks();
    } catch (err) {
      console.error(err);
      alert("Restore failed");
    }
  };

  // =====================================================
  // Status Badge
  // =====================================================
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-100 text-emerald-700";
      case "Delayed":
        return "bg-red-100 text-red-700";
      case "Pending":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-amber-100 text-amber-700"; // In Progress
    }
  };

  return (
    <div className="p-5 space-y-4 max-w-[1700px] mx-auto">
      {/* Top Buttons */}
      <div className="flex items-center justify-end gap-2">
        <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-400 text-slate-900 rounded-md text-xs font-bold hover:bg-cyan-500 transition-colors shadow-sm">
          <FileText className="h-3.5 w-3.5" /> Export
        </button>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-500 text-white rounded-md text-xs font-bold hover:bg-cyan-600 transition-colors shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
        <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 text-white rounded-md text-xs font-bold hover:bg-red-700 transition-colors shadow-sm">
          <Download className="h-3.5 w-3.5" /> PDF
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#655bea] text-white font-bold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">#</th>
                <th className="px-3.5 py-3">Task</th>
                <th className="px-3.5 py-3">Progress</th>
                <th className="px-3.5 py-3">Start</th>
                <th className="px-3.5 py-3">End</th>
                <th className="px-3.5 py-3">Duration</th>
                <th className="px-3.5 py-3">Status</th>
                <th className="px-3.5 py-3">Complete Date</th>
                <th className="px-3.5 py-3">Priority</th>
                <th className="px-3.5 py-3 text-right">Budget</th>
                <th className="px-3.5 py-3 text-right">Cost</th>
                <th className="px-3.5 py-3 text-right">Available</th>
                <th className="px-3.5 py-3">Completed</th>
                <th className="px-3.5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-slate-400">
                    Loading tasks...
                  </td>
                </tr>
              ) : tasks.length > 0 ? (
                tasks.map((task, index) => (
                  <tr key={task.uuid} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3.5 py-3 font-semibold text-slate-500">{index + 1}</td>
                    <td className="px-3.5 py-3 font-semibold text-slate-900">{task.taskName}</td>
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-2">
                        <span>{task.progress}%</span>
                        <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-3">{task.startDate || "-"}</td>
                    <td className="px-3.5 py-3">{task.endDate || "-"}</td>
                    <td className="px-3.5 py-3">{task.duration || "-"}</td>
                    <td className="px-3.5 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-3.5 py-3">{task.completeDate || "-"}</td>
                    <td className="px-3.5 py-3">
                      <span className={`font-semibold ${task.priority === "High" ? "text-red-500" : "text-slate-600"}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-right">{task.budget.toLocaleString()}</td>
                    <td className="px-3.5 py-3 text-right">{task.cost.toLocaleString()}</td>
                    <td className="px-3.5 py-3 text-right text-emerald-600 font-semibold">
                      {task.available.toLocaleString()}
                    </td>
                    <td className="px-3.5 py-3">{task.completed}</td>
                    <td className="px-3.5 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(task)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>

                        {task.status === "Delayed" ? (
                          <button
                            onClick={() => handleRestore(task.uuid)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                            title="Restore"
                          >
                            <RotateCcw size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDelete(task.uuid)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition"
                            title="Soft Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={14} className="px-3.5 py-8 text-center text-slate-400">
                    No Task Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingUuid ? "Edit Task" : "Add New Task"}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Task Name</label>
                <input
                  type="text"
                  required
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="e.g., Roof Casting"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g., 15 Days"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Budget</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Cost</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-cyan-500 text-white rounded-lg font-bold hover:bg-cyan-600 shadow-sm transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingUuid ? "Update Task" : "Save Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}