/* eslint-disable no-useless-catch */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Search,
  ArrowLeft,
  X,
  Loader2,
  ChevronDown,
  Eye,
  Printer,
  Mail,
  Pencil,
  Trash2,
} from "lucide-react";

// ==================== API CONFIG ====================
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PREFIX = "/realbizpro/api/v1";

export default function WorkOrderPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownError, setDropdownError] = useState<string | null>(null);
  const [selectedListProjectId, setSelectedListProjectId] = useState("");

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingOrderUuid, setEditingOrderUuid] = useState<string | null>(null);

  // Master Dropdown Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectTypes, setProjectTypes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    code: `CW0000${Math.floor(10 + Math.random() * 90)}`,
    customerId: "",
    clientOrderNo: "",
    projectTypeId: "",
    projectId: "",
    siteId: "",
    attachment: "",
    poNo: "",
    vatPercent: 0,
    vatInclude: false,
    aitPercent: 0,
    aitInclude: false,
  });

  const [orderItems, setOrderItems] = useState<any[]>([]);

  // Action Dropdown State
  const [openActionIndex, setOpenActionIndex] = useState<number | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Calculate Totals
  const subtotal = orderItems.reduce(
    (acc, item) => acc + item.quantity * item.rate,
    0,
  );
  const vatAmount = formData.vatInclude
    ? (subtotal * formData.vatPercent) / 100
    : 0;
  const aitAmount = formData.aitInclude
    ? (subtotal * formData.aitPercent) / 100
    : 0;
  const grandTotal = subtotal + vatAmount + aitAmount;

  // ==================== API FETCHERS ====================
  const fetchOptions = async (endpoint: string) => {
    try {
      const res = await fetch(
        `${API_BASE}${API_PREFIX}${endpoint}?page=1&limit=100`,
      );
      if (!res.ok) {
        throw new Error(`${endpoint} returned ${res.status}`);
      }
      const json = await res.json();
      const rows = Array.isArray(json?.data?.data)
        ? json.data.data
        : Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
            ? json
            : [];
      return rows.map((r: any) => ({
        ...r,
        uuid: r.uuid || r.id,
        projectId: r.projectId || r.project?.uuid || r.details?.projectId,
        details: r.details || {},
        rate: Number(r.details?.salePrice ?? r.amount ?? 0),
        unit: r.details?.unit || "Nos",
        description: r.description || "",
        name:
          r.name ||
          r.customerName ||
          r.siteName ||
          r.projectName ||
          r.title ||
          r.itemName ||
          r.code ||
          "Unnamed",
      }));
    } catch (err) {
      throw err;
    }
  };

  const loadDropdowns = useCallback(async () => {
    setDropdownError(null);
    const results = await Promise.allSettled([
      fetchOptions("/customer-account"),
      fetchOptions("/project"),
      fetchOptions("/project-type"),
      fetchOptions("/category"),
      fetchOptions("/billing-sub-category"),
      fetchOptions("/project-billing/bill-items"),
      fetchOptions("/project-sites"),
    ]);
    const failedEndpoints = results
      .map((result, index) =>
        result.status === "rejected"
          ? [
              "customers",
              "projects",
              "project types",
              "categories",
              "sub-categories",
              "items",
              "sites",
            ][index]
          : null,
      )
      .filter(Boolean);
    if (failedEndpoints.length) {
      setDropdownError(`Could not load: ${failedEndpoints.join(", ")}.`);
    }
    const values = results.map((result) =>
      result.status === "fulfilled" ? result.value : [],
    );
    setCustomers(values[0]);
    setProjects(values[1]);
    setProjectTypes(values[2]);
    setCategories(values[3]);
    setSubCategories(values[4]);
    setItems(values[5]);
    setSites(values[6]);
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // ⚠️ Endpoint apnar backend onujayi change korte hobe
      const res = await fetch(
        `${API_BASE}${API_PREFIX}/project-billing/work-orders?page=1&limit=100`,
      );
      if (!res.ok) throw new Error("Failed to load work orders");
      const json = await res.json();
      setOrders(json?.data?.data || json?.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    loadDropdowns();
  }, [loadOrders, loadDropdowns]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setOpenActionIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ==================== HANDLERS ====================
  const resetOrderForm = () => {
    setEditingOrderUuid(null);
    setCategoryId("");
    setSubCategoryId("");
    setOrderItems([]);
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      code: `CW0000${Math.floor(10 + Math.random() * 90)}`,
      customerId: "",
      clientOrderNo: "",
      projectTypeId: "",
      projectId: "",
      siteId: "",
      attachment: "",
      poNo: "",
      vatPercent: 0,
      vatInclude: false,
      aitPercent: 0,
      aitInclude: false,
    });
  };

  const openNewOrder = () => {
    resetOrderForm();
    setIsAddOpen(true);
  };

  const handleAddItemToTable = () => {
    setOrderItems([
      ...orderItems,
      {
        id: String(Date.now()),
        itemName: "",
        description: "",
        unit: "Nos",
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ]);
    setIsItemModalOpen(false);
  };

  const handleSaveOrder = async () => {
    try {
      setLoading(true);
      if (!formData.projectId) throw new Error("Select a project");
      const payload = {
        projectId: formData.projectId,
        title: `Work Order ${formData.code}`,
        code: formData.code,
        recordDate: formData.date,
        amount: grandTotal,
        details: {
          ...formData,
          categoryId,
          subCategoryId,
          subtotal,
          vatAmount,
          aitAmount,
          grandTotal,
          items: orderItems.map(({ id, ...item }) => item),
        },
      };

      console.log("📤 Sending Work Order Payload:", payload);

      const isEditing = Boolean(editingOrderUuid);
      const res = await fetch(
        `${API_BASE}${API_PREFIX}/project-billing/work-orders${
          isEditing ? `/${editingOrderUuid}` : ""
        }`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save work order");
      }

      alert(`Work Order ${isEditing ? "updated" : "created"} successfully!`);
      setIsAddOpen(false);
      resetOrderForm();
      loadOrders();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Action Handler
  const handleAction = async (action: string, order: any) => {
    setOpenActionIndex(null); // Close dropdown immediately
    console.log(`Action: ${action} triggered for Order: ${order.code}`, order);

    try {
      switch (action) {
        case "View":
          // TODO: API Call for View
          alert(`Viewing Work Order: ${order.code}`);
          break;
        case "Print":
          // TODO: API Call for Print or trigger print dialog
          window.print();
          break;
        case "Send Mail":
          // TODO: API Call to send mail
          alert(`Sending mail for: ${order.code}`);
          break;
        case "Edit":
          setEditingOrderUuid(order.uuid);
          setFormData({
            date: order.date || order.recordDate || order.details?.date || new Date().toISOString().slice(0, 10),
            code: order.code || "",
            customerId: order.customerId || order.details?.customerId || "",
            clientOrderNo: order.clientOrderNo || order.details?.clientOrderNo || "",
            projectTypeId: order.projectTypeId || order.details?.projectTypeId || "",
            projectId: order.projectId || order.details?.projectId || "",
            siteId: order.siteId || order.details?.siteId || "",
            attachment: order.attachment || order.details?.attachment || "",
            poNo: order.poNo || order.details?.poNo || "",
            vatPercent: Number(order.vatPercent ?? order.details?.vatPercent ?? 0),
            vatInclude: Boolean(order.vatInclude ?? order.details?.vatInclude),
            aitPercent: Number(order.aitPercent ?? order.details?.aitPercent ?? 0),
            aitInclude: Boolean(order.aitInclude ?? order.details?.aitInclude),
          });
          setCategoryId(order.categoryId || order.details?.categoryId || "");
          setSubCategoryId(order.subCategoryId || order.details?.subCategoryId || "");
          setOrderItems(
            (order.items || order.details?.items || []).map((item: any) => ({
              ...item,
              id: item.id || String(Date.now() + Math.random()),
              quantity: Number(item.quantity || 0),
              rate: Number(item.rate || 0),
              amount: Number(item.amount ?? Number(item.quantity || 0) * Number(item.rate || 0)),
            })),
          );
          setIsAddOpen(true);
          break;
        case "Delete":
          if (confirm(`Are you sure you want to delete ${order.code}?`)) {
            setLoading(true);
            const res = await fetch(
              `${API_BASE}${API_PREFIX}/project-billing/work-orders/${order.uuid}`,
              { method: "DELETE" },
            );
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}));
              throw new Error(errorData.message || "Failed to delete work order");
            }
            alert(`Deleted Work Order: ${order.code}`);
            loadOrders();
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Action failed", error);
      alert("Action failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 font-sans text-slate-900">
      {/* ==================== LIST VIEW ==================== */}
      {!isAddOpen && (
        <div className="max-w-[1600px] mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 mb-1">
                Home / Billing / Work Order List
              </div>
              <h1 className="text-xl font-bold">Work Order List</h1>
            </div>
            <button
              onClick={openNewOrder}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> +New Work Order
            </button>
          </div>

          <div className="bg-white p-3 rounded-xl border grid grid-cols-1 md:grid-cols-2 gap-3 text-xs shadow-sm">
            <div>
              <label className="block font-semibold mb-1">Select Date</label>
              <input
                type="text"
                value="1 October, 2026 - 31 October, 2026"
                readOnly
                className="w-full border rounded-lg px-3 py-2 bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Project</label>
              <select
                value={selectedListProjectId}
                onChange={(e) => setSelectedListProjectId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">All projects</option>
                {projects.map((project) => (
                  <option key={project.uuid} value={project.uuid}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {dropdownError && (
            <div className="bg-amber-50 text-amber-700 p-3 rounded-lg text-sm">
              {dropdownError}
            </div>
          )}

          {loading && (
            <div className="text-center py-10">
              <Loader2 className="animate-spin inline mr-2" />
              Loading...
            </div>
          )}
          {error && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-white border rounded-xl shadow-sm overflow-visible">
            <div className="p-3 bg-slate-50 border-b flex justify-between items-center">
              <div className="flex gap-2">
                <button className="bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-semibold">
                  Excel
                </button>
                <button className="bg-rose-600 text-white px-3 py-1.5 rounded text-xs font-semibold">
                  PDF
                </button>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="border pl-9 pr-3 py-1.5 rounded-lg text-sm w-full"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-indigo-600 text-white uppercase tracking-wider">
                  <tr>
                    <th className="py-2 px-3">ID</th>
                    <th className="py-2 px-3">Customer Name</th>
                    <th className="py-2 px-3">WO No</th>
                    <th className="py-2 px-3">Ref/Invoice No</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3 text-right">Sub Total</th>
                    <th className="py-2 px-3 text-right">VAT</th>
                    <th className="py-2 px-3 text-right">Discount</th>
                    <th className="py-2 px-3 text-right">Grand Total</th>
                    <th className="py-2 px-3">Added By</th>
                    <th className="py-2 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders
                    .filter(
                      (order) =>
                        !selectedListProjectId ||
                        order.projectId === selectedListProjectId ||
                        order.project?.uuid === selectedListProjectId ||
                        order.details?.projectId === selectedListProjectId,
                    )
                    .map((order, index) => (
                    <tr key={order.uuid || index}>
                      <td className="py-2 px-3">{index + 1}</td>
                      <td className="py-2 px-3">
                        {order.customer?.customerName ||
                          order.customer?.name ||
                          customers.find(
                            (customer) =>
                              customer.uuid === order.details?.customerId,
                          )?.name ||
                          "-"}
                      </td>
                      <td className="py-2 px-3">{order.code}</td>
                      <td className="py-2 px-3">
                        {order.clientOrderNo || "-"}
                      </td>
                      <td className="py-2 px-3">
                        {order.date ||
                          order.recordDate ||
                          order.details?.date ||
                          "-"}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {Number(
                          order.subtotal ?? order.details?.subtotal ?? 0,
                        ).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {Number(
                          order.vatAmount ?? order.details?.vatAmount ?? 0,
                        ).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right">0.00</td>
                      <td className="py-2 px-3 text-right font-semibold">
                        {Number(
                          order.grandTotal ??
                            order.details?.grandTotal ??
                            order.amount ??
                            0,
                        ).toFixed(2)}
                      </td>
                      <td className="py-2 px-3">
                        {order.createdBy || "Admin"}
                      </td>
                      <td className="py-2 px-3 text-center relative">
                        {/* Action Dropdown Wrapper */}
                        <div
                          className="relative inline-block text-left"
                          ref={openActionIndex === index ? actionMenuRef : null}
                        >
                          <button
                            onClick={() =>
                              setOpenActionIndex(
                                openActionIndex === index ? null : index,
                              )
                            }
                            className="bg-indigo-600 text-white text-[11px] px-3 py-1.5 rounded inline-flex items-center gap-1 hover:bg-indigo-700 transition-colors"
                          >
                            Action <ChevronDown className="w-3 h-3" />
                          </button>

                          {/* Dropdown Menu */}
                          {openActionIndex === index && (
                            <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden text-left">
                              <button
                                onClick={() => handleAction("View", order)}
                                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-600" />{" "}
                                View
                              </button>
                              <button
                                onClick={() => handleAction("Print", order)}
                                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Printer className="w-3.5 h-3.5 text-indigo-600" />{" "}
                                Print
                              </button>
                              <button
                                onClick={() => handleAction("Send Mail", order)}
                                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Mail className="w-3.5 h-3.5 text-indigo-600" />{" "}
                                Send Mail
                              </button>
                              <button
                                onClick={() => handleAction("Edit", order)}
                                className="w-full text-left px-3 py-2 text-xs font-medium text-cyan-600 hover:bg-cyan-50 flex items-center gap-2"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </button>
                              <div className="border-t border-slate-100"></div>
                              <button
                                onClick={() => handleAction("Delete", order)}
                                className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    ))}
                  {orders.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={11}
                        className="text-center py-10 text-slate-400"
                      >
                        No data available in table
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADD VIEW ==================== */}
      {isAddOpen && (
        <div className="max-w-[1600px] mx-auto bg-white border border-slate-200 rounded-xl shadow-lg p-6 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  resetOrderForm();
                }}
                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <h2 className="text-lg font-bold text-slate-800">
                {editingOrderUuid ? "Work Order Edit" : "Work Order Add"}
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsItemModalOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold"
              >
                Add Item
              </button>
              <button
                onClick={() => setIsCustomerModalOpen(true)}
                className="bg-cyan-500 text-white px-4 py-2 rounded-lg text-xs font-semibold"
              >
                Add Client
              </button>
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  resetOrderForm();
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold"
              >
                Work Order List
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Customer
              </label>
              <select
                value={formData.customerId}
                onChange={(e) =>
                  setFormData({ ...formData, customerId: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Select One Option</option>
                {customers.map((c) => (
                  <option key={c.uuid} value={c.uuid}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Code
              </label>
              <input
                type="text"
                value={formData.code}
                readOnly
                className="w-full border rounded-lg px-3 py-2 bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Project Type
              </label>
              <select
                value={formData.projectTypeId}
                onChange={(e) =>
                  setFormData({ ...formData, projectTypeId: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Select value</option>
                {projectTypes.map((t) => (
                  <option key={t.uuid} value={t.uuid}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Project
              </label>
              <select
                value={formData.projectId}
                onChange={(e) =>
                  setFormData({ ...formData, projectId: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p.uuid} value={p.uuid}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Site
              </label>
              <select
                value={formData.siteId}
                onChange={(e) =>
                  setFormData({ ...formData, siteId: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Select Site</option>
                {sites
                  .filter(
                    (site) =>
                      !site.projectId || site.projectId === formData.projectId,
                  )
                  .map((site) => (
                    <option key={site.uuid} value={site.uuid}>
                      {site.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Client Order No.
              </label>
              <input
                type="text"
                value={formData.clientOrderNo}
                onChange={(e) =>
                  setFormData({ ...formData, clientOrderNo: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                PO No.
              </label>
              <input
                type="text"
                value={formData.poNo}
                onChange={(e) =>
                  setFormData({ ...formData, poNo: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Attachment
              </label>
              <input
                type="file"
                className="w-full border rounded-lg px-3 py-1.5 text-slate-500"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () =>
                      setFormData({
                        ...formData,
                        attachment: String(reader.result),
                      });
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
          </div>

          {/* Item Selection Bar */}
          <div className="bg-slate-100 p-3 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubCategoryId("");
                }}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.uuid} value={c.uuid}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Sub Category
              </label>
              <select
                value={subCategoryId}
                onChange={(e) => setSubCategoryId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Select Sub Category</option>
                {subCategories
                  .filter(
                    (sc) =>
                      !categoryId ||
                      sc.categoryId === categoryId ||
                      sc.details?.categoryId === categoryId,
                  )
                  .map((sc) => (
                  <option key={sc.uuid} value={sc.uuid}>
                    {sc.name}
                  </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Select Item (Product / Material)
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value=""
                onChange={(e) => {
                  const selected = items.find(
                    (item) => item.uuid === e.target.value,
                  );
                  if (selected)
                    setOrderItems([
                      ...orderItems,
                      {
                        id: String(Date.now()),
                        itemId: selected.uuid,
                        itemName: selected.name,
                        description: selected.description || "",
                        unit: selected.unit || "Nos",
                        quantity: 1,
                        rate: Number(selected.rate || selected.salePrice || 0),
                        amount: Number(
                          selected.rate || selected.salePrice || 0,
                        ),
                      },
                    ]);
                }}
              >
                <option value="">Search Item / Product / Material...</option>
                {items
                  .filter(
                    (item) =>
                      (!item.projectId ||
                        item.projectId === formData.projectId) &&
                      (!categoryId ||
                        !item.details?.categoryId ||
                        item.details.categoryId === categoryId) &&
                      (!subCategoryId ||
                        !item.details?.subCategoryId ||
                        item.details.subCategoryId === subCategoryId),
                  )
                  .map((i) => (
                    <option key={i.uuid} value={i.uuid}>
                      {i.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Work Order Items Table */}
          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  <th className="py-3 px-3">Item Name</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Unit</th>
                  <th className="py-3 px-3">Quantity</th>
                  <th className="py-3 px-3">Rate</th>
                  <th className="py-3 px-3">Image</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orderItems.map((item, index) => (
                  <tr key={item.id}>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) =>
                          setOrderItems(
                            orderItems.map((row, i) =>
                              i === index
                                ? { ...row, itemName: e.target.value }
                                : row,
                            ),
                          )
                        }
                        className="w-full border rounded px-2 py-1"
                        placeholder="Name"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          setOrderItems(
                            orderItems.map((row, i) =>
                              i === index
                                ? { ...row, description: e.target.value }
                                : row,
                            ),
                          )
                        }
                        className="w-full border rounded px-2 py-1"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={item.unit}
                        onChange={(e) =>
                          setOrderItems(
                            orderItems.map((row, i) =>
                              i === index
                                ? { ...row, unit: e.target.value }
                                : row,
                            ),
                          )
                        }
                        className="w-full border rounded px-2 py-1"
                      >
                        <option>Nos</option>
                        <option>Pcs</option>
                        <option>Kg</option>
                        <option>Set</option>
                        <option>Job</option>
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const quantity = Number(e.target.value);
                          setOrderItems(
                            orderItems.map((row, i) =>
                              i === index
                                ? {
                                    ...row,
                                    quantity,
                                    amount: quantity * row.rate,
                                  }
                                : row,
                            ),
                          );
                        }}
                        className="w-full border rounded px-2 py-1"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => {
                          const rate = Number(e.target.value);
                          setOrderItems(
                            orderItems.map((row, i) =>
                              i === index
                                ? { ...row, rate, amount: row.quantity * rate }
                                : row,
                            ),
                          );
                        }}
                        className="w-full border rounded px-2 py-1"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="file"
                        className="w-full text-slate-500"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () =>
                              setOrderItems(
                                orderItems.map((row, i) =>
                                  i === index
                                    ? { ...row, image: String(reader.result) }
                                    : row,
                                ),
                              );
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-semibold">
                      {Number(item.amount || 0).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() =>
                          setOrderItems(
                            orderItems.filter((_, i) => i !== index),
                          )
                        }
                        className="text-rose-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {orderItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-slate-400">
                      No items added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals & Payment */}
          <div className="flex justify-end mt-4">
            <div className="w-full md:w-1/2 space-y-2 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded border">
                <span className="font-semibold text-slate-700">Subtotal:</span>
                <span className="w-32 bg-white border rounded px-2 py-1 text-right">
                  {subtotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-2 rounded border">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Vat(%):</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.vatInclude}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vatInclude: e.target.checked,
                        })
                      }
                    />{" "}
                    If Include
                  </label>
                </div>
                <input
                  type="number"
                  value={formData.vatPercent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vatPercent: Number(e.target.value),
                    })
                  }
                  className="w-32 bg-white border rounded px-2 py-1"
                />
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-2 rounded border">
                <span className="font-semibold text-slate-700">
                  Vat(Amount):
                </span>
                <span className="w-32 bg-slate-100 border rounded px-2 py-1 text-right">
                  {vatAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-2 rounded border">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">AIT(%):</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.aitInclude}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          aitInclude: e.target.checked,
                        })
                      }
                    />{" "}
                    If Include
                  </label>
                </div>
                <input
                  type="number"
                  value={formData.aitPercent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      aitPercent: Number(e.target.value),
                    })
                  }
                  className="w-32 bg-white border rounded px-2 py-1"
                />
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-2 rounded border">
                <span className="font-semibold text-slate-700">
                  AIT(Amount):
                </span>
                <span className="w-32 bg-slate-100 border rounded px-2 py-1 text-right">
                  {aitAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center bg-emerald-600 p-2 rounded border border-emerald-700 text-white font-bold">
                <span>Grand Total:</span>
                <span className="w-32 text-right">{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              onClick={handleSaveOrder}
              disabled={loading}
              className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                editingOrderUuid ? "Update" : "Submit"
              )}
            </button>
          </div>
        </div>
      )}

      {/* ==================== MODAL: NEW ITEM ==================== */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center bg-slate-50 px-5 py-3 border-b">
              <h3 className="font-bold text-slate-800">New Item</h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select className="w-full border rounded px-2 py-1.5">
                  <option>Select Category</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Sub Category</label>
                <select className="w-full border rounded px-2 py-1.5">
                  <option>Select Sub Category</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1">Item Name</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Brand</label>
                <select className="w-full border rounded px-2 py-1.5">
                  <option>Select Brand</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Unit</label>
                <select className="w-full border rounded px-2 py-1.5">
                  <option>Select Unit</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Purchase Price
                </label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Sale Price</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t flex justify-end gap-2">
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={handleAddItemToTable}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CUSTOMER ADD ==================== */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex justify-between items-center bg-slate-50 px-5 py-3 border-b">
              <h3 className="font-bold text-slate-800">Customer Add</h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Code</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1.5 bg-slate-50"
                  readOnly
                  value={`CUS${Math.floor(100000 + Math.random() * 900000)}`}
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Name</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Buyer Reference
                </label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1">Address</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Credit Limit</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Due Date</label>
                <input
                  type="date"
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Opening Balance
                </label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Chart Of Groups
                </label>
                <select className="w-full border rounded px-2 py-1.5">
                  <option>Select One Option</option>
                </select>
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t flex justify-end gap-2">
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
