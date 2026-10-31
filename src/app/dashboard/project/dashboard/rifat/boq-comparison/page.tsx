/* eslint-disable prettier/prettier */

"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  FileText,
  Search,
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// =====================================================
// Types
// =====================================================

interface ComparisonItem {
  uuid: string;
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
}

interface FormData {
  titleOfWork: string;
  task: string;
  type: string;
  description: string;
  boqQty: number;
  boqAmount: number;
  issueQty: number;
  issueAmount: number;
  status: string;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";

export default function BoqComparisonPage() {
  const [items, setItems] = useState<ComparisonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedWork, setSelectedWork] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesCount, setEntriesCount] = useState("10");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUuid, setCurrentUuid] = useState<string | null>(null);

  // =====================================================
  // Form
  // =====================================================

  const [formData, setFormData] = useState<FormData>({
    titleOfWork: "",
    task: "",
    type: "Material",
    description: "",
    boqQty: 0,
    boqAmount: 0,
    issueQty: 0,
    issueAmount: 0,
    status: "In Progress",
  });

  // =====================================================
  // Fetch All
  // =====================================================

  const fetchItems = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API_BASE}/realbizpro/api/v1/boq-comparison`,
      );

      if (!res.ok) {
        throw new Error("Failed to fetch BOQ Comparison data");
      }

      const data = await res.json();

      let list: any[] = [];

      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data?.data)) {
        list = data.data;
      } else if (Array.isArray(data?.data?.data)) {
        list = data.data.data;
      } else if (Array.isArray(data?.result)) {
        list = data.result;
      }

      const mapped: ComparisonItem[] = list.map((item: any) => {
        const boqQty = Number(item.boqQty ?? item.boq_qty ?? 0);

        const boqAmount = Number(
          item.boqAmount ?? item.boq_amount ?? 0,
        );

        const issueQty = Number(
          item.issueQty ?? item.issue_qty ?? 0,
        );

        const issueAmount = Number(
          item.issueAmount ?? item.issue_amount ?? 0,
        );

        return {
          uuid: item.uuid || item.id || String(item._id),

          titleOfWork:
            item.titleOfWork ??
            item.title_of_work ??
            "",

          task: item.task ?? "",

          type: item.type || "Material",

          description: item.description || "",

          boqQty,

          boqAmount,

          issueQty,

          issueAmount,

          qtyDiff: Number(
            item.qtyDiff ??
              item.qty_diff ??
              boqQty - issueQty,
          ),

          amountDiff: Number(
            item.amountDiff ??
              item.amount_diff ??
              boqAmount - issueAmount,
          ),

          status: item.status || "In Progress",
        };
      });

      setItems(mapped);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load BOQ Comparison data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // =====================================================
  // Input Change
  // =====================================================

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: [
        "boqQty",
        "boqAmount",
        "issueQty",
        "issueAmount",
      ].includes(name)
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
      titleOfWork: selectedWork,
      task: selectedTask,
      type: "Material",
      description: "",
      boqQty: 0,
      boqAmount: 0,
      issueQty: 0,
      issueAmount: 0,
      status: "In Progress",
    });

    setIsModalOpen(true);
  };

  // =====================================================
  // Open Edit Modal
  // =====================================================

  const handleEdit = (item: ComparisonItem) => {
    setIsEditMode(true);
    setCurrentUuid(item.uuid);

    setFormData({
      titleOfWork: item.titleOfWork,
      task: item.task,
      type: item.type,
      description: item.description,
      boqQty: item.boqQty,
      boqAmount: item.boqAmount,
      issueQty: item.issueQty,
      issueAmount: item.issueAmount,
      status: "In Progress",
    });

    // Keep filter values synced with edited item
    setSelectedWork(item.titleOfWork);
    setSelectedTask(item.task);

    setIsModalOpen(true);
  };

  // =====================================================
  // Soft Delete
  // =====================================================

  const handleDelete = async (uuid: string) => {
    if (
      !confirm(
        "Are you sure you want to soft-delete this item?",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/realbizpro/api/v1/boq-comparison/${uuid}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      toast.success("Item soft-deleted successfully");

      await fetchItems();
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
        `${API_BASE}/realbizpro/api/v1/boq-comparison/${uuid}/restore`,
        {
          method: "POST",
        },
      );

      if (!res.ok) {
        throw new Error("Restore failed");
      }

      toast.success("Item restored successfully");

      await fetchItems();
    } catch (err) {
      console.error(err);
      toast.error("Failed to restore item");
    }
  };

  // =====================================================
  // Submit Create / Update
  // =====================================================

  const handleSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    // -----------------------------------------------
    // Validation
    // -----------------------------------------------

    if (!formData.titleOfWork.trim()) {
      toast.error(
        "Please select Title/Name of Work",
      );
      return;
    }

    if (!formData.task.trim()) {
      toast.error("Please select Task");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Please enter Description");
      return;
    }

    // Backend currently expects "In Progress"
    const status = "In Progress";

    setSaving(true);

    // -----------------------------------------------
    // Calculate Difference
    // -----------------------------------------------

    const qtyDiff =
      Number(formData.boqQty) -
      Number(formData.issueQty);

    const amountDiff =
      Number(formData.boqAmount) -
      Number(formData.issueAmount);

    // -----------------------------------------------
    // API Payload
    // -----------------------------------------------

    const payload = {
      titleOfWork: formData.titleOfWork.trim(),

      task: formData.task.trim(),

      type: formData.type,

      description: formData.description.trim(),

      boqQty: Number(formData.boqQty),

      boqAmount: Number(formData.boqAmount),

      issueQty: Number(formData.issueQty),

      issueAmount: Number(formData.issueAmount),

      qtyDiff: Number(qtyDiff),

      amountDiff: Number(amountDiff),

      status,
    };

    console.log(
      "BOQ Comparison Payload:",
      payload,
    );

    try {
      let res: Response;

      // ---------------------------------------------
      // Update
      // ---------------------------------------------

      if (isEditMode && currentUuid) {
        res = await fetch(
          `${API_BASE}/realbizpro/api/v1/boq-comparison/${currentUuid}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );
      }

      // ---------------------------------------------
      // Create
      // ---------------------------------------------

      else {
        res = await fetch(
          `${API_BASE}/realbizpro/api/v1/boq-comparison`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );
      }

      // ---------------------------------------------
      // Handle Error
      // ---------------------------------------------

      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({}));

        const message = Array.isArray(
          err?.message,
        )
          ? err.message.join(", ")
          : err?.message ||
            "Failed to save BOQ Comparison";

        throw new Error(message);
      }

      // ---------------------------------------------
      // Success
      // ---------------------------------------------

      toast.success(
        isEditMode
          ? "Updated successfully!"
          : "Created successfully!",
      );

      setIsModalOpen(false);

      setCurrentUuid(null);

      setIsEditMode(false);

      // Reset form
      setFormData({
        titleOfWork: "",
        task: "",
        type: "Material",
        description: "",
        boqQty: 0,
        boqAmount: 0,
        issueQty: 0,
        issueAmount: 0,
        status: "In Progress",
      });

      await fetchItems();
    } catch (err: any) {
      console.error(
        "BOQ Comparison Save Error:",
        err,
      );

      toast.error(
        err?.message ||
          "Something went wrong",
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // Search Filter
  // =====================================================

  const filteredItems = items.filter(
    (item) => {
      const search = searchTerm.toLowerCase();

      return (
        item.titleOfWork
          .toLowerCase()
          .includes(search) ||
        item.task
          .toLowerCase()
          .includes(search) ||
        item.description
          .toLowerCase()
          .includes(search) ||
        item.type
          .toLowerCase()
          .includes(search)
      );
    },
  );

  // =====================================================
  // Totals
  // =====================================================

  const totalBoqQty =
    filteredItems.reduce(
      (acc, curr) =>
        acc + curr.boqQty,
      0,
    );

  const totalBoqAmount =
    filteredItems.reduce(
      (acc, curr) =>
        acc + curr.boqAmount,
      0,
    );

  const totalIssueQty =
    filteredItems.reduce(
      (acc, curr) =>
        acc + curr.issueQty,
      0,
    );

  const totalIssueAmount =
    filteredItems.reduce(
      (acc, curr) =>
        acc + curr.issueAmount,
      0,
    );

  const totalQtyDiff =
    filteredItems.reduce(
      (acc, curr) =>
        acc + curr.qtyDiff,
      0,
    );

  const totalAmountDiff =
    filteredItems.reduce(
      (acc, curr) =>
        acc + curr.amountDiff,
      0,
    );

  const displayedItems =
    filteredItems.slice(
      0,
      Number(entriesCount),
    );

  // =====================================================
  // JSX
  // =====================================================

  return (
    <div className="p-6 space-y-4 max-w-[1700px] mx-auto text-slate-900 bg-[#f5f7fa] min-h-screen">
      <Toaster
        position="top-right"
        reverseOrder={false}
      />

      {/* =====================================================
          Top Filter Section
      ===================================================== */}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title / Work */}

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Title/Name of Work
          </label>

          <select
            value={selectedWork}
            onChange={(e) => {
              const value = e.target.value;

              setSelectedWork(value);

              if (!isEditMode) {
                setFormData((prev) => ({
                  ...prev,
                  titleOfWork: value,
                }));
              }
            }}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-700"
          >
            <option value="">
              Select Title/Name of Work
            </option>

            <option value="Foundation Work">
              Foundation Work
            </option>

            <option value="Superstructure Construction">
              Superstructure Construction
            </option>

            <option value="Finishing Works">
              Finishing Works
            </option>
          </select>
        </div>

        {/* Task */}

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Task
          </label>

          <select
            value={selectedTask}
            onChange={(e) => {
              const value = e.target.value;

              setSelectedTask(value);

              if (!isEditMode) {
                setFormData((prev) => ({
                  ...prev,
                  task: value,
                }));
              }
            }}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-700"
          >
            <option value="">
              Select Task
            </option>

            <option value="Piling">
              Piling
            </option>

            <option value="Casting">
              Casting
            </option>

            <option value="Brickwork">
              Brickwork
            </option>
          </select>
        </div>
      </div>

      {/* =====================================================
          Action Bar
      ===================================================== */}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <FileSpreadsheet size={14} />
            Excel
          </button>

          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded hover:bg-rose-700 transition-colors shadow-sm"
          >
            <FileText size={14} />
            PDF
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-600 pl-2 border-l border-slate-200">
            <span>Show</span>

            <select
              value={entriesCount}
              onChange={(e) =>
                setEntriesCount(
                  e.target.value,
                )
              }
              className="border border-slate-200 rounded px-2 py-1 focus:outline-none bg-white"
            >
              <option value="10">
                10
              </option>

              <option value="25">
                25
              </option>

              <option value="50">
                50
              </option>
            </select>

            <span>entries</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value,
                )
              }
              placeholder="Search..."
              className="w-full border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            />

            <Search
              size={14}
              className="absolute right-2.5 top-2 text-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1 px-4 py-2 bg-[#655bea] text-white text-xs font-bold rounded-lg hover:bg-[#534ac7] transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>

      {/* =====================================================
          Table
      ===================================================== */}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead>
              <tr className="bg-[#655bea] text-white font-bold text-[11px]">
                <th className="px-4 py-3">
                  TITLE / WORK
                </th>

                <th className="px-4 py-3">
                  TASK
                </th>

                <th className="px-4 py-3">
                  TYPE
                </th>

                <th className="px-4 py-3">
                  DESCRIPTION
                </th>

                <th className="px-4 py-3 text-right">
                  BOQ QTY
                </th>

                <th className="px-4 py-3 text-right">
                  BOQ AMOUNT
                </th>

                <th className="px-4 py-3 text-right">
                  ISSUE QTY
                </th>

                <th className="px-4 py-3 text-right">
                  ISSUE AMOUNT
                </th>

                <th className="px-4 py-3 text-right">
                  QTY DIFF
                </th>

                <th className="px-4 py-3 text-right">
                  AMOUNT DIFF
                </th>

                <th className="px-4 py-3 text-center">
                  STATUS
                </th>

                <th className="px-4 py-3 text-center">
                  ACTION
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    Loading data...
                  </td>
                </tr>
              ) : displayedItems.length > 0 ? (
                <>
                  {displayedItems.map(
                    (item) => (
                      <tr
                        key={item.uuid}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {item.titleOfWork ||
                            "-"}
                        </td>

                        <td className="px-4 py-3">
                          {item.task || "-"}
                        </td>

                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {item.type}
                        </td>

                        <td className="px-4 py-3 font-medium text-slate-900">
                          {item.description}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {item.boqQty.toLocaleString()}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {item.boqAmount.toLocaleString()}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {item.issueQty.toLocaleString()}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {item.issueAmount.toLocaleString()}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {item.qtyDiff.toLocaleString()}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {item.amountDiff.toLocaleString()}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold">
                            {item.status}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(
                                  item,
                                )
                              }
                              className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded transition"
                              title="Edit"
                            >
                              <Edit3
                                size={14}
                              />
                            </button>

                            {item.status?.toLowerCase() ===
                            "deleted" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRestore(
                                    item.uuid,
                                  )
                                }
                                className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded transition"
                                title="Restore"
                              >
                                <RotateCcw
                                  size={14}
                                />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    item.uuid,
                                  )
                                }
                                className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded transition"
                                title="Soft Delete"
                              >
                                <Trash2
                                  size={14}
                                />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  )}

                  {/* TOTAL ROW */}

                  <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                    <td
                      colSpan={4}
                      className="px-4 py-3 text-right uppercase"
                    >
                      TOTAL:
                    </td>

                    <td className="px-4 py-3 text-right">
                      {totalBoqQty.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {totalBoqAmount.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {totalIssueQty.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {totalIssueAmount.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {totalQtyDiff.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {totalAmountDiff.toLocaleString()}
                    </td>

                    <td></td>

                    <td></td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-8 text-center text-slate-400 italic"
                  >
                    No data available in table
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* =====================================================
            Footer
        ===================================================== */}

        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 bg-white">
          <span>
            Showing 1 to{" "}
            {displayedItems.length}{" "}
            of{" "}
            {filteredItems.length}{" "}
            entries
          </span>

          <div className="flex items-center gap-1 mt-2 sm:mt-0">
            <button
              type="button"
              className="px-3 py-1.5 border border-slate-200 rounded bg-white text-slate-400 hover:bg-slate-50"
            >
              Previous
            </button>

            <button
              type="button"
              className="px-3 py-1.5 border border-slate-200 rounded bg-[#655bea] text-white font-semibold"
            >
              1
            </button>

            <button
              type="button"
              className="px-3 py-1.5 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          Add / Edit Modal
      ===================================================== */}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            {/* Header */}

            <div className="px-6 py-4 bg-[#655bea] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {isEditMode
                  ? "Edit BOQ Comparison"
                  : "Add BOQ Comparison"}
              </h3>

              <button
                type="button"
                onClick={() =>
                  setIsModalOpen(false)
                }
                className="text-white hover:bg-white/20 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                {/* Title of Work */}

                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Title/Name of Work
                  </label>

                  <select
                    value={formData.titleOfWork}
                    onChange={(e) => {
                      const value =
                        e.target.value;

                      setFormData(
                        (prev) => ({
                          ...prev,
                          titleOfWork:
                            value,
                        }),
                      );

                      setSelectedWork(
                        value,
                      );
                    }}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">
                      Select Title/Name of Work
                    </option>

                    <option value="Foundation Work">
                      Foundation Work
                    </option>

                    <option value="Superstructure Construction">
                      Superstructure Construction
                    </option>

                    <option value="Finishing Works">
                      Finishing Works
                    </option>
                  </select>
                </div>

                {/* Task */}

                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Task
                  </label>

                  <select
                    value={formData.task}
                    onChange={(e) => {
                      const value =
                        e.target.value;

                      setFormData(
                        (prev) => ({
                          ...prev,
                          task: value,
                        }),
                      );

                      setSelectedTask(
                        value,
                      );
                    }}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">
                      Select Task
                    </option>

                    <option value="Piling">
                      Piling
                    </option>

                    <option value="Casting">
                      Casting
                    </option>

                    <option value="Brickwork">
                      Brickwork
                    </option>
                  </select>
                </div>

                {/* Type */}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Type
                  </label>

                  <select
                    name="type"
                    value={formData.type}
                    onChange={
                      handleInputChange
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Material">
                      Material
                    </option>

                    <option value="Labor">
                      Labor
                    </option>

                    <option value="Equipment">
                      Equipment
                    </option>
                  </select>
                </div>

                {/* Status */}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Status
                  </label>

                  <select
                    name="status"
                    value="In Progress"
                    disabled
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-100 text-slate-600 cursor-not-allowed"
                  >
                    <option value="In Progress">
                      In Progress
                    </option>
                  </select>
                </div>

                {/* Description */}

                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Description
                  </label>

                  <input
                    type="text"
                    name="description"
                    required
                    value={
                      formData.description
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="e.g. Cement (OPC - 50kg bag)"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* BOQ Qty */}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    BOQ Qty
                  </label>

                  <input
                    type="number"
                    name="boqQty"
                    value={
                      formData.boqQty
                    }
                    onChange={
                      handleInputChange
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* BOQ Amount */}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    BOQ Amount
                  </label>

                  <input
                    type="number"
                    name="boqAmount"
                    value={
                      formData.boqAmount
                    }
                    onChange={
                      handleInputChange
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Issue Qty */}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Issue Qty
                  </label>

                  <input
                    type="number"
                    name="issueQty"
                    value={
                      formData.issueQty
                    }
                    onChange={
                      handleInputChange
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Issue Amount */}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Issue Amount
                  </label>

                  <input
                    type="number"
                    name="issueAmount"
                    value={
                      formData.issueAmount
                    }
                    onChange={
                      handleInputChange
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Footer */}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() =>
                    setIsModalOpen(false)
                  }
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
                      ? "Update"
                      : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}