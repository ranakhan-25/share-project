"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Plus, Search, Edit3, Trash2, FileSpreadsheet, FileText, X, Bold, Italic, AlignLeft, List, Image as ImageIcon, Printer } from "lucide-react";

// Quotation Item Interface
interface QuotationItem {
  id: number;
  uuid: string;
  orderCode: string;
  date: string;
  projectType: string;
  project: string;
  projectId?: string;
  customerId?: string;
  categoryId?: string;
  subCategoryId?: string;
  site: string;
  contentBody: string;
  items: TableRowItem[];
  employeeName: string;
  grandTotal: number;
  addedBy: string;
  approve: string;
  attachment: string;
}

// Sub-item Interface for Modal Form
interface TableRowItem {
  id: number;
  itemName: string;
  unit: string;
  quantity: number;
  rate: number;
  details: string;
  image: string;
  amount: number;
}

interface SelectOption {
  uuid: string;
  name: string;
  customerName?: string;
  categoryId?: string;
}

const API_ROOT = (
  process.env.NEXT_PUBLIC_API_URL ||
  `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"}/realbizpro/api/v1`
).replace(/\/+$/, "");

function rowsFrom<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  for (const key of ["data", "items", "rows", "results"]) {
    if (key in record) {
      const rows = rowsFrom<T>(record[key]);
      if (rows.length || Array.isArray(record[key])) return rows;
    }
  }
  return [];
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });
  const text = await response.text();
  let body: unknown;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!response.ok) {
    const payload =
      body && typeof body === "object"
        ? (body as Record<string, unknown>)
        : undefined;
    const message = payload?.message;
    throw new Error(
      Array.isArray(message)
        ? message.join(", ")
        : typeof message === "string"
          ? message
          : typeof body === "string"
            ? body
            : `Request failed (${response.status})`,
    );
  }
  return body as T;
}

function mapQuotation(value: Record<string, unknown>, index: number): QuotationItem {
  const items = Array.isArray(value.items)
    ? value.items.flatMap((item, itemIndex) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        return [{
          id: typeof row.id === "number" ? row.id : itemIndex + 1,
          itemName: String(row.itemName ?? ""),
          unit: String(row.unit ?? ""),
          quantity: Number(row.quantity ?? 0),
          rate: Number(row.rate ?? 0),
          details: String(row.details ?? ""),
          image: String(row.image ?? ""),
          amount: Number(row.amount ?? 0),
        }];
      })
    : [];
  return {
    id: typeof value.id === "number" ? value.id : index + 1,
    uuid: String(value.uuid ?? ""),
    orderCode: String(value.code ?? ""),
    date: String(value.date ?? ""),
    projectType: String(value.projectType ?? ""),
    project: String(value.project ?? ""),
    projectId: typeof value.projectId === "string" ? value.projectId : undefined,
    customerId: typeof value.customerId === "string" ? value.customerId : undefined,
    categoryId: typeof value.categoryId === "string" ? value.categoryId : undefined,
    subCategoryId:
      typeof value.subCategoryId === "string" ? value.subCategoryId : undefined,
    site: String(value.site ?? ""),
    contentBody: String(value.contentBody ?? ""),
    items,
    employeeName: String(value.employeeName ?? ""),
    grandTotal: Number(value.grandTotal ?? 0),
    addedBy: String(value.addedBy ?? value.addedById ?? ""),
    approve: String(value.approveStatus ?? "Pending"),
    attachment: String(value.attachment ?? ""),
  };
}

function localDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function QuotationPage() {
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [projects, setProjects] = useState<SelectOption[]>([]);
  const [projectTypes, setProjectTypes] = useState<SelectOption[]>([]);
  const [customers, setCustomers] = useState<SelectOption[]>([]);
  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [subCategories, setSubCategories] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [dateRange, setDateRange] = useState("");

  // Modal State (+New Quote / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEditUuid, setCurrentEditUuid] = useState<string | null>(null);

  // Form States inside Modal
  const [formData, setFormData] = useState({
    date: localDate(),
    customer: "",
    employeeName: "",
    code: "",
    projectType: "",
    project: "",
    site: "",
    attachment: "",
    contentBody: "",
    category: "",
    subCategory: "",
    searchItem: "",
  });

  const [modalTableItems, setModalTableItems] = useState<TableRowItem[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [quotationResponse, projectResponse, typeResponse, customerResponse, categoryResponse, subCategoryResponse] =
        await Promise.all([
          apiRequest<unknown>("/quotation?page=1&limit=100"),
          apiRequest<unknown>("/project?page=1&limit=100"),
          apiRequest<unknown>("/project-type?page=1&limit=100"),
          apiRequest<unknown>("/customer-account?page=1&limit=100"),
          apiRequest<unknown>("/category?page=1&limit=100"),
          apiRequest<unknown>("/billing-sub-category?page=1&limit=100"),
        ]);
      setQuotations(
        rowsFrom<Record<string, unknown>>(quotationResponse).map(mapQuotation),
      );
      setProjects(rowsFrom<SelectOption>(projectResponse));
      setProjectTypes(rowsFrom<SelectOption>(typeResponse));
      setCustomers(
        rowsFrom<Record<string, unknown>>(customerResponse).map((customer) => ({
          ...customer,
          uuid: String(customer.uuid ?? ""),
          name: String(customer.customerName ?? ""),
          customerName: String(customer.customerName ?? ""),
        })),
      );
      setCategories(rowsFrom<SelectOption>(categoryResponse));
      setSubCategories(rowsFrom<SelectOption>(subCategoryResponse));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load quotations.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Handle Form Input Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open Modal for Add New
  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setCurrentEditUuid(null);
    setFormData({
      date: localDate(),
      customer: "",
      employeeName: "",
      code: `QUO-${Date.now()}`,
      projectType: "",
      project: "",
      site: "",
      attachment: "",
      contentBody: "",
      category: "",
      subCategory: "",
      searchItem: "",
    });
    setModalTableItems([]);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleEdit = (item: QuotationItem) => {
    setIsEditMode(true);
    setCurrentEditUuid(item.uuid);
    setFormData({
      date: item.date,
      customer: item.customerId ?? "",
      employeeName: item.employeeName,
      code: item.orderCode,
      projectType: item.projectType,
      project: item.projectId ?? "",
      site: item.site,
      attachment: item.attachment,
      contentBody: item.contentBody,
      category: item.categoryId ?? "",
      subCategory: item.subCategoryId ?? "",
      searchItem: "",
    });
    setModalTableItems(item.items);
    setIsModalOpen(true);
  };

  // Delete Quotation Row
  const handleDelete = async (item: QuotationItem) => {
    if (!item.uuid || !confirm("Are you sure you want to delete this quotation?")) {
      return;
    }
    setError("");
    try {
      await apiRequest(`/quotation/${encodeURIComponent(item.uuid)}`, {
        method: "DELETE",
      });
      await loadData();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not delete quotation.",
      );
    }
  };

  // Add Item inside Modal Table
  const handleAddModalTableRow = () => {
    const itemName = formData.searchItem.trim();
    if (!itemName) {
      setError("Enter an item name before adding it.");
      return;
    }
    const newItem: TableRowItem = {
      id: Date.now(),
      itemName,
      unit: "Pcs",
      quantity: 1,
      rate: 0,
      details: "",
      image: "",
      amount: 0,
    };
    setModalTableItems([...modalTableItems, newItem]);
    setFormData((prev) => ({ ...prev, searchItem: "" }));
    setError("");
  };

  const handleDeleteModalTableRow = (id: number) => {
    setModalTableItems(modalTableItems.filter((i) => i.id !== id));
  };

  const updateQuotationItem = (
    id: number,
    field: keyof Omit<TableRowItem, "id" | "amount">,
    value: string,
  ) => {
    setModalTableItems((items) =>
      items.map((item) => {
        if (item.id !== id) return item;
        const updated = {
          ...item,
          [field]:
            field === "quantity" || field === "rate"
              ? Number(value)
              : value,
        };
        return {
          ...updated,
          amount: Number(updated.quantity) * Number(updated.rate),
        };
      }),
    );
  };

  // Save Quotation (Add or Update)
  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const grandTotal = modalTableItems.reduce(
      (total, item) => total + Number(item.amount || 0),
      0,
    );
    const project = projects.find((option) => option.uuid === formData.project);
    const customer = customers.find((option) => option.uuid === formData.customer);
    const payload = {
      date: formData.date,
      customer: customer?.customerName ?? customer?.name ?? "",
      customerId: formData.customer || undefined,
      code: formData.code.trim(),
      projectType: formData.projectType || undefined,
      project: project?.name ?? "",
      projectId: formData.project || undefined,
      site: formData.site.trim() || undefined,
      categoryId: formData.category || undefined,
      subCategoryId: formData.subCategory || undefined,
      attachment: formData.attachment.trim() || undefined,
      contentBody: formData.contentBody,
      employeeName: formData.employeeName.trim() || undefined,
      grandTotal,
      items: modalTableItems.map(({ itemName, unit, quantity, rate, details, image, amount }) => ({
        itemName,
        unit,
        quantity: Number(quantity),
        rate: Number(rate),
        details,
        image,
        amount: Number(amount),
      })),
    };

    if (!payload.date || !payload.code) {
      setError("Date and quotation code are required.");
      return;
    }
    if (!modalTableItems.length) {
      setError("Add at least one quotation item.");
      return;
    }
    if (modalTableItems.some((item) => !item.itemName.trim())) {
      setError("Every quotation item must have a name.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const path =
        isEditMode && currentEditUuid
          ? `/quotation/${encodeURIComponent(currentEditUuid)}`
          : "/quotation";
      await apiRequest(path, {
        method: isEditMode ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      setIsModalOpen(false);
      setCurrentEditUuid(null);
      await loadData();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save quotation.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Filtered Quotations for search
  const filteredQuotations = quotations.filter(
    (item) =>
      item.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.employeeName.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const visibleQuotations = filteredQuotations.filter(
    (item) => !dateRange || item.date.slice(0, 10) === dateRange,
  );

  return (
    <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </div>
      )}
      
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="w-full md:w-80 space-y-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Select Date</label>
          <input
            type="date"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
          />
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1 px-4 py-2 bg-[#655bea] text-white text-xs font-bold rounded-lg hover:bg-[#534ac7] transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="h-4 w-4" /> New Quote
        </button>
      </div>

      {/* Export & Search Controls Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 transition-colors">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded hover:bg-rose-700 transition-colors">
            <FileText className="h-3.5 w-3.5" /> PDF
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-600 ml-4">
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-xs text-slate-600 font-semibold">Search:</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs w-full md:w-64 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
          />
        </div>
      </div>

      {/* Quotation Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1300px] text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#655bea] text-white font-bold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">ID</th>
                <th className="px-3.5 py-3">Order Code</th>
                <th className="px-3.5 py-3">Date</th>
                <th className="px-3.5 py-3">Project Type</th>
                <th className="px-3.5 py-3">Project</th>
                <th className="px-3.5 py-3">Employee Name</th>
                <th className="px-3.5 py-3">Grand Total</th>
                <th className="px-3.5 py-3">Added By</th>
                <th className="px-3.5 py-3">Approve</th>
                <th className="px-3.5 py-3">Attachment</th>
                <th className="px-3.5 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                    Loading quotations...
                  </td>
                </tr>
              ) : visibleQuotations.length > 0 ? (
                visibleQuotations.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3.5 py-3 text-slate-500 font-semibold">{index + 1}</td>
                    <td className="px-3.5 py-3 font-bold text-indigo-600">{item.orderCode}</td>
                    <td className="px-3.5 py-3">{item.date}</td>
                    <td className="px-3.5 py-3">{item.projectType}</td>
                    <td className="px-3.5 py-3 font-semibold text-slate-900">{item.project}</td>
                    <td className="px-3.5 py-3">{item.employeeName}</td>
                    <td className="px-3.5 py-3 font-bold text-slate-900">{item.grandTotal.toLocaleString()}</td>
                    <td className="px-3.5 py-3">{item.addedBy || "—"}</td>
                    <td className="px-3.5 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.approve === "Approved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {item.approve || "Pending"}
                      </span>
                    </td>
                    <td className="px-3.5 py-3">
                      {item.attachment ? (
                        <a
                          href={item.attachment}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 underline"
                        >
                          View
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => void handleDelete(item)}
                          className="p-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                    No data available in table
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>Showing {visibleQuotations.length} quotation(s)</div>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 border border-slate-200 rounded bg-white hover:bg-slate-50">Previous</button>
            <button className="px-3 py-1.5 border border-slate-200 rounded bg-white hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>

      {/* ===================================================== */}
      {/* FULL PAGE MODAL FOR QUOTE ADD / OFFER                 */}
      {/* ===================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-start p-4 md:p-8 overflow-y-auto">
          <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-6xl my-auto overflow-hidden border border-slate-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#655bea] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {isEditMode ? "Edit Quotation / Offer" : "Quote Add / Offer"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveQuotation} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Top Fields */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Customer</label>
                  <select
                    name="customer"
                    value={formData.customer}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select value</option>
                    {customers.map((customer) => (
                      <option key={customer.uuid} value={customer.uuid}>
                        {customer.customerName ?? customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Code</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-bold text-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Project Type</label>
                  <select
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select value</option>
                    {projectTypes.map((projectType) => (
                      <option key={projectType.uuid} value={projectType.name}>
                        {projectType.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Project</label>
                  <select
                    name="project"
                    value={formData.project}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select Project</option>
                    {projects.map((project) => (
                      <option key={project.uuid} value={project.uuid}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Employee Name</label>
                  <input
                    type="text"
                    name="employeeName"
                    value={formData.employeeName}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Site</label>
                  <input
                    type="text"
                    name="site"
                    placeholder="Select Site"
                    value={formData.site}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Attachment</label>
                  <div className="flex items-center border border-slate-200 rounded-lg px-3 py-1 bg-white">
                    <input
                      type="url"
                      name="attachment"
                      value={formData.attachment}
                      onChange={handleInputChange}
                      placeholder="Paste an attachment URL"
                      className="w-full border-0 text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Content Body Editor Simulation */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 font-bold text-xs text-slate-700">
                  Content Body
                </div>
                <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-200 bg-slate-50 text-slate-600 text-xs">
                  <span className="hover:bg-slate-200 px-2 py-1 rounded cursor-pointer font-semibold">File</span>
                  <span className="hover:bg-slate-200 px-2 py-1 rounded cursor-pointer font-semibold">Edit</span>
                  <span className="hover:bg-slate-200 px-2 py-1 rounded cursor-pointer font-semibold">Insert</span>
                  <div className="h-4 w-[1px] bg-slate-300 mx-1" />
                  <button type="button" className="p-1 hover:bg-slate-200 rounded"><Bold className="h-3.5 w-3.5" /></button>
                  <button type="button" className="p-1 hover:bg-slate-200 rounded"><Italic className="h-3.5 w-3.5" /></button>
                  <button type="button" className="p-1 hover:bg-slate-200 rounded"><AlignLeft className="h-3.5 w-3.5" /></button>
                  <button type="button" className="p-1 hover:bg-slate-200 rounded"><List className="h-3.5 w-3.5" /></button>
                  <button type="button" className="p-1 hover:bg-slate-200 rounded"><ImageIcon className="h-3.5 w-3.5" /></button>
                </div>
                <textarea
                  rows={4}
                  name="contentBody"
                  value={formData.contentBody}
                  onChange={handleInputChange}
                  placeholder="Write content body here..."
                  className="w-full p-4 text-xs focus:outline-none bg-white text-slate-800"
                ></textarea>
              </div>

              {/* Item Selector Bar */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.uuid} value={category.uuid}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Sub Category</label>
                  <select
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select Sub Category</option>
                    {subCategories
                      .filter(
                        (subCategory) =>
                          !formData.category ||
                          subCategory.categoryId === formData.category,
                      )
                      .map((subCategory) => (
                        <option key={subCategory.uuid} value={subCategory.uuid}>
                          {subCategory.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Select Item (Product / Material) *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="searchItem"
                      value={formData.searchItem}
                      onChange={handleInputChange}
                      placeholder="Search Item..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddModalTableRow}
                      className="px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center justify-center transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#655bea] text-white font-bold uppercase tracking-wider text-[11px]">
                      <th className="px-4 py-3">ITEM NAME</th>
                      <th className="px-4 py-3">UNIT</th>
                      <th className="px-4 py-3">QUANTITY</th>
                      <th className="px-4 py-3">RATE</th>
                      <th className="px-4 py-3">DETAILS</th>
                      <th className="px-4 py-3">IMAGE</th>
                      <th className="px-4 py-3">AMOUNT</th>
                      <th className="px-4 py-3 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {modalTableItems.length > 0 ? (
                      modalTableItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <input
                              value={item.itemName}
                              onChange={(event) =>
                                updateQuotationItem(item.id, "itemName", event.target.value)
                              }
                              className="w-32 rounded border px-2 py-1"
                              aria-label="Item name"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              value={item.unit}
                              onChange={(event) =>
                                updateQuotationItem(item.id, "unit", event.target.value)
                              }
                              className="w-16 rounded border px-2 py-1"
                              aria-label="Unit"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantity}
                              onChange={(event) =>
                                updateQuotationItem(item.id, "quantity", event.target.value)
                              }
                              className="w-20 rounded border px-2 py-1"
                              aria-label="Quantity"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate}
                              onChange={(event) =>
                                updateQuotationItem(item.id, "rate", event.target.value)
                              }
                              className="w-20 rounded border px-2 py-1"
                              aria-label="Rate"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              value={item.details}
                              onChange={(event) =>
                                updateQuotationItem(item.id, "details", event.target.value)
                              }
                              className="w-28 rounded border px-2 py-1"
                              aria-label="Details"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              value={item.image}
                              onChange={(event) =>
                                updateQuotationItem(item.id, "image", event.target.value)
                              }
                              className="w-24 rounded border px-2 py-1"
                              aria-label="Image URL"
                            />
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900">{item.amount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteModalTableRow(item.id)}
                              className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded"
                            >
                              <Plus className="h-3.5 w-3.5 rotate-45" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 text-center text-slate-400">No items added yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#655bea] text-white rounded-lg text-xs font-bold hover:bg-[#534ac7] transition-colors shadow-sm"
                >
                  {isEditMode ? "Update Quotation" : "Save Quotation"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}