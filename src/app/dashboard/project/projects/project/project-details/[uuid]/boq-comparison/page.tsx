/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

// ====================== TYPES ======================
interface BoqComparison {
  id: string;
  uuid: string;
  uid: string;
  titleOfWork: string;
  task: string;
  type: string;
  description: string;
  boqQty: number;
  boqAmount: number;
  issueQty: number;
  issueAmount: number;
  qtyDiff: number;
  amountDiff: number;
  status: string;
  deletedAt?: string | null;
}

interface BoqItem {
  id: string;
  uuid: string;
  titleOfWork: string;
  task: string;
}

interface Task {
  id: string;
  uuid: string;
  taskName: string;
}

export default function BoqComparisonPage() {
  const { uuid } = useParams();
  
  const [dataList, setDataList] = useState<BoqComparison[]>([]);
  const [boqList, setBoqList] = useState<BoqItem[]>([]);
  const [taskList, setTaskList] = useState<Task[]>([]);
  
  const [selectedBoq, setSelectedBoq] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ====================== FETCH DATA ======================
  const fetchData = async () => {
    try {
      setLoading(true);

      const resComp = await fetch(`${API_BASE}/realbizpro/api/v1/boq-comparison`);
      const jsonComp = await resComp.json();
      if (jsonComp.success) {
        setDataList((jsonComp.data.data || []).filter((item: any) => !item.deletedAt));
      }

      const resBoq = await fetch(`${API_BASE}/realbizpro/api/v1/boq?page=1&limit=100`);
      const jsonBoq = await resBoq.json();
      if (jsonBoq.success) {
        setBoqList((jsonBoq.data.data || []).filter((item: any) => !item.deletedAt));
      }

      const resTask = await fetch(`${API_BASE}/realbizpro/api/v1/task?page=1&limit=100`);
      const jsonTask = await resTask.json();
      if (jsonTask.success) {
        setTaskList((jsonTask.data.data || []).filter((item: any) => !item.deletedAt));
      }

    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ====================== SUBMIT (CREATE) ======================
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    
    const payload = {
      uid: formData.get("uid"),
      titleOfWork: formData.get("titleOfWork"),
      task: formData.get("task"),
      type: formData.get("type"),
      description: formData.get("description"),
      boqQty: Number(formData.get("boqQty")) || 0,
      boqAmount: Number(formData.get("boqAmount")) || 0,
      issueQty: Number(formData.get("issueQty")) || 0,
      issueAmount: Number(formData.get("issueAmount")) || 0,
      qtyDiff: Number(formData.get("qtyDiff")) || 0,
      amountDiff: Number(formData.get("amountDiff")) || 0,
      status: formData.get("status"),
    };

    try {
      const res = await fetch(`${API_BASE}/realbizpro/api/v1/boq-comparison`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok || json.success) {
        toast.success("BOQ Comparison Created Successfully!");
        setIsModalOpen(false);
        fetchData(); // লিস্ট রিফ্রেশ
      } else {
        toast.error(json.message || "Failed to create");
      }
    } catch (err) {
      toast.error("Network Error");
    } finally {
      setSubmitting(false);
    }
  };

  // ====================== FILTER & CALC ======================
  const filteredData = dataList.filter((item) => {
    const matchesSearch = search ? item.description?.toLowerCase().includes(search.toLowerCase()) : true;
    const matchesBoq = selectedBoq ? item.titleOfWork === selectedBoq : true;
    const matchesTask = selectedTask ? item.task === selectedTask : true;
    return matchesSearch && matchesBoq && matchesTask;
  });

  const totalBoqQty = filteredData.reduce((sum, item) => sum + (Number(item.boqQty) || 0), 0);
  const totalBoqAmount = filteredData.reduce((sum, item) => sum + (Number(item.boqAmount) || 0), 0);
  const totalIssueQty = filteredData.reduce((sum, item) => sum + (Number(item.issueQty) || 0), 0);
  const totalIssueAmount = filteredData.reduce((sum, item) => sum + (Number(item.issueAmount) || 0), 0);
  const totalQtyDiff = filteredData.reduce((sum, item) => sum + (Number(item.qtyDiff) || 0), 0);
  const totalAmountDiff = filteredData.reduce((sum, item) => sum + (Number(item.amountDiff) || 0), 0);

  return (
    <div className="bg-gray-50 font-sans text-gray-800">
      <div className="bg-white p-4 border rounded-md shadow-sm">
        
        {/* Top Actions & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:w-2/3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Title/Name of Work</label>
              <select
                value={selectedBoq}
                onChange={(e) => setSelectedBoq(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Title/Name of Work</option>
                {boqList.map((boq) => (
                  <option key={boq.uuid} value={boq.titleOfWork}>{boq.titleOfWork}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Task</label>
              <select
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Task</option>
                {taskList.map((task) => (
                  <option key={task.uuid} value={task.taskName}>{task.taskName}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" /> Create Comparison
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2 border-t pt-4">
          <div className="flex gap-2 items-center text-sm">
            <button className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700">Excel</button>
            <button className="bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600">PDF</button>
            <span className="ml-2">Show</span>
            <select className="border rounded px-2 py-1"><option>10</option></select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>Search:</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="border rounded overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  {["TYPE", "DESCRIPTION", "BOQ QTY", "BOQ AMOUNT", "ISSUE QTY", "ISSUE AMOUNT", "QTY DIFF", "AMOUNT DIFF", "STATUS"].map((h) => (
                    <th key={h} className="px-3 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-6 text-gray-500">No data available in table</td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.uuid} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{item.type}</td>
                      <td className="px-3 py-2">{item.description}</td>
                      <td className="px-3 py-2">{Number(item.boqQty).toFixed(2)}</td>
                      <td className="px-3 py-2">{Number(item.boqAmount).toLocaleString()}</td>
                      <td className="px-3 py-2">{Number(item.issueQty).toFixed(2)}</td>
                      <td className="px-3 py-2">{Number(item.issueAmount).toLocaleString()}</td>
                      <td className="px-3 py-2">{Number(item.qtyDiff).toFixed(2)}</td>
                      <td className="px-3 py-2">{Number(item.amountDiff).toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <span className="text-indigo-600 font-medium">{item.status}</span>
                      </td>
                    </tr>
                  ))
                )}
                <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                  <td colSpan={2} className="px-3 py-3 text-right">TOTAL:</td>
                  <td className="px-3 py-3">{totalBoqQty.toFixed(2)}</td>
                  <td className="px-3 py-3">{totalBoqAmount.toLocaleString()}</td>
                  <td className="px-3 py-3">{totalIssueQty.toFixed(2)}</td>
                  <td className="px-3 py-3">{totalIssueAmount.toLocaleString()}</td>
                  <td className="px-3 py-3">{totalQtyDiff.toFixed(2)}</td>
                  <td className="px-3 py-3">{totalAmountDiff.toLocaleString()}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Add BOQ Comparison</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">UID</label>
                <input name="uid" type="text" required placeholder="e.g. string" className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Title of Work</label>
                <select name="titleOfWork" required className="w-full border rounded px-3 py-2 text-sm">
                  <option value="">Select</option>
                  {boqList.map(b => <option key={b.uuid} value={b.titleOfWork}>{b.titleOfWork}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Task</label>
                <select name="task" required className="w-full border rounded px-3 py-2 text-sm">
                  <option value="">Select</option>
                  {taskList.map(t => <option key={t.uuid} value={t.taskName}>{t.taskName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Type</label>
                <input name="type" type="text" required placeholder="Cost / Material" className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Description</label>
                <input name="description" type="text" required placeholder="Description" className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">BOQ Qty</label>
                <input name="boqQty" type="number" step="any" required className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">BOQ Amount</label>
                <input name="boqAmount" type="number" step="any" required className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Issue Qty</label>
                <input name="issueQty" type="number" step="any" required className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Issue Amount</label>
                <input name="issueAmount" type="number" step="any" required className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Qty Diff</label>
                <input name="qtyDiff" type="number" step="any" required className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Amount Diff</label>
                <input name="amountDiff" type="number" step="any" required className="w-full border rounded px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Status</label>
                <select name="status" className="w-full border rounded px-3 py-2 text-sm">
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-400 text-white px-4 py-2 rounded text-sm">Close</button>
                <button type="submit" disabled={submitting} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}