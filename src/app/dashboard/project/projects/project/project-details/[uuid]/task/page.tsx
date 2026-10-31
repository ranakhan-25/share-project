/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Task {
  id: string | number;
  uuid: string;
  uid: string;
  taskName: string;
  progress: number;
  priority: string;
  startDate: string;
  endDate: string;
  duration: string;
  status: string;
  completeDate: string;
  budget: number;
  cost: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

// ---------- Main Task Page ----------
export default function TaskPage() {
  const { uuid } = useParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // API থেকে টাস্ক লিস্ট ফেচ
  const fetchTasks = async () => {
    try {
      setLoading(true);
      // আপনার API এন্ডপয়েন্ট
      const res = await fetch(`${API_BASE}/realbizpro/api/v1/task?page=1&limit=100`);
      const json = await res.json();
      
      if (json.success) {
        setTasks(json.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      {/* Header */}
      <div className="flex justify-end gap-2 mb-4">
        <button onClick={() => setIsAddModalOpen(true)} className="bg-teal-500 text-white p-2 rounded hover:bg-teal-600">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-md overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-indigo-600 text-white text-xs uppercase">
            <tr>
              {["#", "TASK", "PROGRESS", "START", "END", "DURATION", "STATUS", "COMPLETE DATE", "PRIORITY", "BUDGET", "COST", "AVAILABLE", "COMPLETED"].map(h => (
                <th key={h} className="px-3 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={13} className="text-center py-6 text-gray-500"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
            ) : tasks.length === 0 ? (
              <tr><td colSpan={13} className="text-center py-6 text-gray-500">No Task</td></tr>
            ) : (
              tasks.map((task, idx) => (
                <tr key={task.uuid || idx} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{idx + 1}</td>
                  <td className="px-3 py-2 text-indigo-600 font-medium">{task.taskName}</td>
                  <td className="px-3 py-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${task.progress}%` }}></div>
                    </div>
                  </td>
                  <td className="px-3 py-2">{task.startDate}</td>
                  <td className="px-3 py-2">{task.endDate}</td>
                  <td className="px-3 py-2">{task.duration}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${task.status === 'In Progress' ? 'bg-indigo-500 text-white' : task.status === 'Completed' ? 'bg-green-500 text-white' : 'bg-orange-400 text-white'}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">{task.completeDate}</td>
                  <td className="px-3 py-2">
                    <span className="bg-gray-400 text-white px-2 py-1 rounded text-xs">{task.priority}</span>
                  </td>
                  <td className="px-3 py-2">{task.budget?.toLocaleString()}</td>
                  <td className="px-3 py-2">{task.cost?.toLocaleString()}</td>
                  <td className="px-3 py-2">{(task.budget - task.cost)?.toLocaleString()}</td>
                  <td className="px-3 py-2">0%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Task Add Modal */}
      {isAddModalOpen && (
        <TaskAddModal 
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchTasks();
          }} 
        />
      )}
    </div>
  );
}

// ---------- Task Add Modal (API Integration) ----------
function TaskAddModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    
    // ✅ projectId বাদ দেওয়া হয়েছে
    const payload = {
      taskName: formData.get("taskName"),
      status: formData.get("status"), // সঠিক ভ্যালু: In Progress, Completed, Pending, Delayed
      priority: formData.get("priority"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      duration: formData.get("duration"),
      budget: Number(formData.get("budget")) || 0,
      progress: Number(formData.get("progress")) || 0,
    };

    try {
      // ✅ রিয়েল API POST কল
      const res = await fetch(`${API_BASE}/realbizpro/api/v1/task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success) {
        toast.success("Task Created Successfully!");
        onSuccess();
      } else {
        toast.error(json.message || "Failed to create task");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Network Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">Task Add</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Under</label>
            <select className="w-full border rounded px-3 py-2 text-sm"><option>Select Task</option></select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">Task Name</label>
            <input name="taskName" type="text" required placeholder="Enter Task Name" className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Boq Code/No</label>
            <input type="text" placeholder="Boq Code/No" className="w-full border rounded px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Status</label>
            <select name="status" className="w-full border rounded px-3 py-2 text-sm">
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Priority</label>
            <select name="priority" className="w-full border rounded px-3 py-2 text-sm">
              <option value="None">None</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Progress (%)</label>
            <input name="progress" type="number" defaultValue="0" className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Duration (Days)</label>
            <input name="duration" type="text" placeholder="e.g. 60 Days" className="w-full border rounded px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Start Date</label>
            <input name="startDate" type="date" className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">End Date</label>
            <input name="endDate" type="date" className="w-full border rounded px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Budget</label>
            <input name="budget" type="number" placeholder="Budget" className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Description</label>
            <textarea rows={3} className="w-full border rounded px-3 py-2 text-sm"></textarea>
          </div>

          <div className="col-span-2 flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="bg-gray-400 text-white px-4 py-2 rounded text-sm">Close</button>
            <button type="submit" disabled={submitting} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}