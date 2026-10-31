"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Edit3, Trash2, RotateCcw, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// =====================================================
// Types
// =====================================================
interface BOQItem {
  uuid: string;
  date: string;
  title: string;
  task: string;
  budget: number;
  percentOfBudget: string;
  perSftBudget: number;
  cost: number;
  available: number;
  addedBy: string;
  status?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";

export default function BOQPage() {
  const [boqList, setBoqList] = useState<BOQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [entriesCount, setEntriesCount] = useState("10");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUuid, setCurrentUuid] = useState<string | null>(null);

  // Form
  const [formData, setFormData] = useState({
    date: "",
    title: "",
    task: "",
    budget: 0,
    percentOfBudget: "",
    perSftBudget: 0,
    cost: 0,
    addedBy: "",
  });

  // =====================================================
  // Fetch All
  // =====================================================
  const fetchBOQ = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/realbizpro/api/v1/boq`);
      if (!res.ok) throw new Error("Failed to fetch BOQ data");

      const data = await res.json();

      let list: any[] = [];
      if (Array.isArray(data)) list = data;
      else if (Array.isArray(data?.data)) list = data.data;
      else if (Array.isArray(data?.data?.data)) list = data.data.data;
      else if (Array.isArray(data?.result)) list = data.result;

      const mapped: BOQItem[] = list.map((item: any) => {
        const budget = Number(item.budget ?? 0);
        const cost = Number(item.cost ?? 0);

        return {
          uuid: item.uuid || item.id || String(item._id),
          date: item.date || item.createdAt?.slice(0, 10) || "",
          title: item.titleOfWork || item.title || item.name || "",
          task: item.task || "",
          budget,
          percentOfBudget: item.percentageOfTotalBudget
            ? `${item.percentageOfTotalBudget}%`
            : item.percentOfBudget || "0%",
          perSftBudget: Number(item.perSftBudget ?? item.per_sft_budget ?? 0),
          cost,
          available: Number(item.available ?? budget - cost),
          addedBy: item.addedBy || item.added_by || item.createdBy || "N/A",
          status: item.status || "Active",
        };
      });

      setBoqList(mapped);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load BOQ data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBOQ();
  }, []);

  // =====================================================
  // Input Change
  // =====================================================
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["budget", "perSftBudget", "cost"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  // =====================================================
  // Open Add Modal
  // =====================================================
  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setCurrentUuid(null);
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      title: "",
      task: "",
      budget: 0,
      percentOfBudget: "",
      perSftBudget: 0,
      cost: 0,
      addedBy: "",
    });
    setIsModalOpen(true);
  };

  // =====================================================
  // Open Edit Modal
  // =====================================================
  const handleEdit = (item: BOQItem) => {
    setIsEditMode(true);
    setCurrentUuid(item.uuid);
    setFormData({
      date: item.date,
      title: item.title,
      task: item.task,
      budget: item.budget,
      percentOfBudget: item.percentOfBudget,
      perSftBudget: item.perSftBudget,
      cost: item.cost,
      addedBy: item.addedBy,
    });
    setIsModalOpen(true);
  };

  // =====================================================
  // Soft Delete
  // =====================================================
  const handleDelete = async (uuid: string) => {
    if (!confirm("Are you sure you want to soft-delete this BOQ item?")) return;

    try {
      const res = await fetch(`${API_BASE}/realbizpro/api/v1/boq/${uuid}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");

      toast.success("BOQ item soft-deleted successfully");
      await fetchBOQ();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete item");
    }
  };

  // =====================================================
  // Restore
  // =====================================================
  const handleRestore = async (uuid: string) => {
    try {
      const res = await fetch(
        `${API_BASE}/realbizpro/api/v1/boq/${uuid}/restore`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Restore failed");

      toast.success("BOQ item restored successfully");
      await fetchBOQ();
    } catch (err) {
      console.error(err);
      toast.error("Failed to restore item");
    }
  };

  // =====================================================
  // Submit (Create / Update)
  // =====================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const available = formData.budget - formData.cost;

    // Backend exact field names
    const payload = {
      date: formData.date,
      titleOfWork: formData.title,
      task: formData.task,
      budget: formData.budget,
      percentageOfTotalBudget: Number(
        formData.percentOfBudget.replace("%", "") || 0
      ),
      perSftBudget: formData.perSftBudget,
      cost: formData.cost,
      available,
      addedBy: formData.addedBy || "Admin",
    };

    try {
      let res: Response;

      if (isEditMode && currentUuid) {
        res = await fetch(`${API_BASE}/realbizpro/api/v1/boq/${currentUuid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/realbizpro/api/v1/boq`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save BOQ");
      }

      toast.success(
        isEditMode ? "BOQ updated successfully!" : "BOQ created successfully!"
      );
      setIsModalOpen(false);
      await fetchBOQ();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // Search + Totals
  // =====================================================
  const filteredData = boqList.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.addedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBudget = filteredData.reduce((acc, curr) => acc + curr.budget, 0);
  const totalCost = filteredData.reduce((acc, curr) => acc + curr.cost, 0);
  const totalAvailable = filteredData.reduce(
    (acc, curr) => acc + curr.available,
    0
  );

  const displayedData = filteredData.slice(0, Number(entriesCount));

  return (
    <div className="p-5 max-w-[1700px] mx-auto text-slate-900 bg-[#f5f7fa] min-h-screen">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 p-4 bg-white">
          <div className="flex items-center gap-2 flex-wrap">
            <button className="rounded bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm">
              Copy
            </button>
            <button className="rounded bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition-colors shadow-sm">
              CSV
            </button>
            <button className="rounded bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors shadow-sm">
              Excel
            </button>
            <button className="rounded bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors shadow-sm">
              PDF
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1 rounded bg-[#655bea] px-4 py-2 text-xs font-semibold text-white hover:bg-[#534ac7] transition-colors shadow-sm"
            >
              <Plus size={14} /> Add BOQ
            </button>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Show</span>
              <select
                value={entriesCount}
                onChange={(e) => setEntriesCount(e.target.value)}
                className="border border-slate-200 rounded px-2 py-1 focus:outline-none bg-white"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span>entries</span>
            </div>

            <div className="relative w-full sm:w-60">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search BOQ..."
                className="w-full border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              />
              <Search
                size={14}
                className="absolute right-2.5 top-2 text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1300px] text-xs text-left">
            <thead>
              <tr className="bg-[#655bea] text-white font-bold">
                <th className="px-3 py-3">ID</th>
                <th className="px-3 py-3">DATE</th>
                <th className="px-3 py-3">TITLE/NAME OF WORK</th>
                <th className="px-3 py-3">TASK</th>
                <th className="px-3 py-3 text-right">BUDGET</th>
                <th className="px-3 py-3 text-center">% OF TOTAL BUDGET</th>
                <th className="px-3 py-3 text-right">PER SFT BUDGET</th>
                <th className="px-3 py-3 text-right">COST</th>
                <th className="px-3 py-3 text-right">AVAILABLE</th>
                <th className="px-3 py-3">ADDED BY</th>
                <th className="px-3 py-3 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    Loading BOQ data...
                  </td>
                </tr>
              ) : displayedData.length > 0 ? (
                <>
                  {displayedData.map((item, index) => (
                    <tr
                      key={item.uuid}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-3 py-3 font-semibold text-slate-500">
                        {index + 1}
                      </td>
                      <td className="px-3 py-3">{item.date}</td>
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {item.title}
                      </td>
                      <td className="px-3 py-3 text-slate-600">{item.task}</td>
                      <td className="px-3 py-3 text-right">
                        {item.budget.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-semibold text-[11px]">
                          {item.percentOfBudget}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        {item.perSftBudget.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-right text-rose-600 font-semibold">
                        {item.cost.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-right text-emerald-600 font-semibold">
                        {item.available.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {item.addedBy}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded transition"
                            title="Edit"
                          >
                            <Edit3 size={14} />
                          </button>

                          {item.status?.toLowerCase() === "deleted" ? (
                            <button
                              onClick={() => handleRestore(item.uuid)}
                              className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded transition"
                              title="Restore"
                            >
                              <RotateCcw size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDelete(item.uuid)}
                              className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded transition"
                              title="Soft Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Total Row */}
                  <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                    <td colSpan={4} className="px-3 py-3 text-right uppercase">
                      Total:
                    </td>
                    <td className="px-3 py-3 text-right">
                      {totalBudget.toLocaleString()}
                    </td>
                    <td className="px-3 py-3"></td>
                    <td className="px-3 py-3"></td>
                    <td className="px-3 py-3 text-right text-rose-600">
                      {totalCost.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right text-emerald-600">
                      {totalAvailable.toLocaleString()}
                    </td>
                    <td></td>
                    <td></td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td
                    colSpan={11}
                    className="py-8 text-center text-slate-400 italic"
                  >
                    No data available in table
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 bg-white">
          <span>
            Showing 1 to {displayedData.length} of {filteredData.length} entries
          </span>
          <div className="flex items-center gap-1 mt-2 sm:mt-0">
            <button className="px-3 py-1.5 border border-slate-200 rounded bg-white text-slate-400 hover:bg-slate-50">
              Previous
            </button>
            <button className="px-3 py-1.5 border border-slate-200 rounded bg-[#655bea] text-white font-semibold">
              1
            </button>
            <button className="px-3 py-1.5 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-[#655bea] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {isEditMode ? "Edit BOQ" : "Add New BOQ"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:bg-white/20 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    % of Total Budget
                  </label>
                  <input
                    type="text"
                    name="percentOfBudget"
                    value={formData.percentOfBudget}
                    onChange={handleInputChange}
                    placeholder="e.g. 25%"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Title / Name of Work
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Foundation Work"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Task
                  </label>
                  <input
                    type="text"
                    name="task"
                    value={formData.task}
                    onChange={handleInputChange}
                    placeholder="e.g. Piling & Earthwork"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Budget
                  </label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Per Sft Budget
                  </label>
                  <input
                    type="number"
                    name="perSftBudget"
                    value={formData.perSftBudget}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Cost
                  </label>
                  <input
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Added By
                  </label>
                  <input
                    type="text"
                    name="addedBy"
                    value={formData.addedBy}
                    onChange={handleInputChange}
                    placeholder="e.g. Admin Rifat"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#655bea] text-white rounded-lg text-xs font-bold hover:bg-[#534ac7] disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : isEditMode
                    ? "Update BOQ"
                    : "Save BOQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}