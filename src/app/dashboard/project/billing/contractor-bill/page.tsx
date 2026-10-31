/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  ArrowLeft,
  Save,
  X,
  Loader2,
  Trash2,
  Eye,
  Printer,
  Mail,
  Edit,
} from "lucide-react";

// ==================== API CONFIG ====================
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PREFIX = "/realbizpro/api/v1";

export default function ContractorSupplierBillPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingBillUuid, setEditingBillUuid] = useState<string | null>(null);

  // Dropdown Data
  const [contractors, setContractors] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectTypes, setProjectTypes] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [workNames, setWorkNames] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    code: `VB${Math.floor(10000 + Math.random() * 90000)}`,
    contractorId: "",
    contractorType: "",
    ledgerId: "",
    projectTypeId: "",
    projectId: "",
    workNameId: "",
    workOrderId: "",
    siteId: "",
    poNo: "",
    taskId: "",
    categoryId: "",
    itemId: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentAmount: 0,
  });

  const [billItems, setBillItems] = useState<any[]>([]);
  const subtotal = billItems.reduce((sum, row) => sum + Number(row.quantity || 0) * Number(row.rate || 0), 0);
  const paidAmount = Number(formData.paymentAmount || 0);
  const [newItemData, setNewItemData] = useState({
    code: `ITEM-${Math.floor(1000 + Math.random() * 9000)}`,
    name: "",
    categoryId: "",
    brandId: "",
    unitId: "",
    purchasePrice: 0,
    salePrice: 0,
  });
  const [newWorker, setNewWorker] = useState({
    code: `LWB-${Date.now().toString().slice(-6)}`,
    name: "",
    phone: "",
    address: "",
    openingBalance: 0,
    creditLimit: 0,
    dueDate: "",
    underGroup: "",
  });

  // 👇 Action Dropdown State
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // ==================== FETCHERS ====================
  const fetchOptions = async (endpoint: string) => {
    try {
      const res = await fetch(
        `${API_BASE}${API_PREFIX}${endpoint}?page=1&limit=100`,
      );
      if (!res.ok) return [];
      const json = await res.json();
      const rows = Array.isArray(json?.data?.data)
        ? json.data.data
        : Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
            ? json
            : [];
      return rows.map((r: any) => ({
        uuid: r.uuid || r.id,
        id: r.id || r.uuid,
        raw: r,
        name:
          r.supplierName ||
          r.customerName ||
          r.name ||
          r.projectName ||
          r.title ||
          r.itemName ||
          r.item_code ||
          r.code ||
          "Unnamed",
      }));
    } catch (err) {
      return [];
    }
  };

  const loadDropdowns = useCallback(async () => {
    const [contractorsList, supplierList, workers, proj, types, itms, workList, siteList, taskList, cats] = await Promise.all([
      fetchOptions("/contractor"),
      fetchOptions("/supplier-accounts"),
      fetchOptions("/labour-work-bank"),
      fetchOptions("/project"),
      fetchOptions("/project-type"),
      fetchOptions("/project-billing/bill-items"),
      fetchOptions("/project-billing/service-work-names"),
      fetchOptions("/project-sites"),
      fetchOptions("/task"),
      fetchOptions("/category"),
    ]);
    setSuppliers(supplierList.map((item: any) => ({ ...item, accountType: "supplier" })));
    setContractors([
      ...contractorsList.map((item: any) => ({ ...item, accountType: "contractor" })),
      ...workers.map((item: any) => ({ ...item, accountType: "labour" })),
    ]);
    setProjects(proj);
    setProjectTypes(types);
    setItems(itms.map((item: any) => ({ ...item, name: item.raw?.title || item.name, unit: item.raw?.details?.unit || "Nos", rate: Number(item.raw?.details?.salePrice || item.raw?.amount || 0) })));
    setWorkNames(workList);
    setSites(siteList);
    setTasks(taskList);
    setCategories(cats);
  }, []);

  const loadBills = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `${API_BASE}${API_PREFIX}/project-billing/contractor-bills?page=1&limit=100`,
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to load bills");
      }
      const json = await res.json();
      const rows = json?.data?.data || json?.data || [];
      setBills(rows.map((record: any) => ({
        ...record,
        ...(record.details || {}),
        uuid: record.uuid,
        code: record.code,
        date: record.recordDate,
        grandTotal: Number(record.amount || 0),
        projectName: record.project?.name || record.details?.projectName,
        title: record.title || record.details?.workName,
        contractorName: record.details?.contractorName,
        ledgerName: record.details?.ledgerName,
        paid: Number(record.details?.paymentAmount || 0),
        due: Number(record.details?.dueAmount ?? (Number(record.amount || 0) - Number(record.details?.paymentAmount || 0))),
      })));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBills();
    loadDropdowns();
  }, [loadBills, loadDropdowns]);

  // ==================== ACTION HANDLERS ====================
  const handleView = (bill: any) => {
    console.log("View:", bill);
    setActiveDropdown(null);
    alert(`Viewing Bill: ${bill.code}`);
  };

  const handlePrint = (bill: any) => {
    console.log("Print:", bill);
    setActiveDropdown(null);
    window.print(); // Simple print functionality
  };

  const handleSendMail = (bill: any) => {
    console.log("Send Mail:", bill);
    setActiveDropdown(null);
    alert(`Send Mail to: ${bill.contractorName || "Contractor"}`);
  };

  const handleEdit = (bill: any) => {
    setActiveDropdown(null);
    setEditingBillUuid(bill.uuid);
    const details = bill.details || bill;
    setIsAddOpen(true);
    setFormData((prev) => ({
      ...prev,
      ...details,
      code: bill.code || "",
      date: bill.recordDate || bill.date || prev.date,
      paymentAmount: Number(details.paymentAmount || 0),
    }));
    setBillItems(Array.isArray(details.items) ? details.items : []);
  };

  const handleDelete = async (bill: any) => {
    if (!confirm(`Are you sure you want to delete bill ${bill.code}?`)) return;
    try {
      setActiveDropdown(null);
      const res = await fetch(`${API_BASE}${API_PREFIX}/project-billing/contractor-bills/${bill.uuid}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete bill");
      await loadBills();
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  };

  const submitBill = async () => {
    const project = projects.find((row) => row.uuid === formData.projectId);
    const contractor = [...contractors, ...suppliers].find((row) => row.uuid === formData.contractorId);
    const projectType = projectTypes.find((row) => row.uuid === formData.projectTypeId);
    const workName = workNames.find((row) => row.uuid === formData.workNameId);
    if (!project || !formData.contractorId) {
      setError("Project and Contractor/Supplier are required.");
      return;
    }
    const details = {
      ...formData,
      contractorName: contractor?.name || "",
      contractorType: contractor?.accountType || formData.contractorType,
      projectName: project.name,
      projectTypeName: projectType?.name || "",
      ledgerName: "500-001-002-001-Contractor Bill Expense",
      workName: workName?.name || "",
      items: billItems,
      subtotal,
      grandTotal: subtotal,
      paymentAmount: paidAmount,
      dueAmount: Math.max(subtotal - paidAmount, 0),
    };
    const payload = {
      projectId: project.uuid,
      title: details.workName || `${contractor?.name || "Contractor"} Bill ${formData.code}`,
      code: formData.code,
      recordDate: formData.date,
      amount: subtotal,
      status: "active",
      description: formData.poNo || "",
      details,
    };
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}${API_PREFIX}/project-billing/contractor-bills${editingBillUuid ? `/${editingBillUuid}` : ""}`, {
        method: editingBillUuid ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || "Could not save contractor bill");
      setIsAddOpen(false);
      setEditingBillUuid(null);
      setBillItems([]);
      await loadBills();
    } catch (err: any) {
      setError(err.message || "Could not save contractor bill");
    } finally {
      setLoading(false);
    }
  };

  const addSelectedItem = () => {
    const item = items.find((row) => row.uuid === formData.itemId);
    if (!item) return;
    setBillItems((rows) => [...rows, { itemId: item.uuid, name: item.name, description: "", unit: item.unit || "Nos", quantity: 1, rate: item.rate || 0 }]);
  };

  const createBillItem = async () => {
    if (!formData.projectId || !newItemData.name.trim()) {
      setError("Select a project and enter an item name first.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE}${API_PREFIX}/project-billing/bill-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: formData.projectId,
          title: newItemData.name.trim(),
          code: newItemData.code,
          amount: Number(newItemData.salePrice || 0),
          details: {
            categoryId: newItemData.categoryId,
            brand: newItemData.brandId,
            unit: newItemData.unitId,
            purchasePrice: Number(newItemData.purchasePrice || 0),
            salePrice: Number(newItemData.salePrice || 0),
          },
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || "Could not create billing item");
      await loadDropdowns();
      const created = body?.data?.data || body?.data || body;
      setFormData((previous) => ({ ...previous, itemId: created.uuid || created.data?.uuid || previous.itemId }));
      setIsItemModalOpen(false);
      setNewItemData({ code: `ITEM-${Math.floor(1000 + Math.random() * 9000)}`, name: "", categoryId: "", brandId: "", unitId: "", purchasePrice: 0, salePrice: 0 });
    } catch (err: any) {
      setError(err.message || "Could not create billing item");
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 font-sans text-slate-900">
      {/* ==================== LIST VIEW ==================== */}
      {!isAddOpen && (
        <div className="max-w-[1500px] mx-auto space-y-4">
          <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 mb-1">
                Home / Billing / Contractor/Supplier Bill List
              </div>
              <h1 className="text-xl font-bold">
                Contractor/Supplier Bill List
              </h1>
            </div>
            <button
              onClick={() => { setEditingBillUuid(null); setError(null); setBillItems([]); setFormData({ date: new Date().toISOString().slice(0, 10), code: `VB${Math.floor(10000 + Math.random() * 90000)}`, contractorId: "", contractorType: "", ledgerId: "", projectTypeId: "", projectId: "", workNameId: "", workOrderId: "", siteId: "", poNo: "", taskId: "", categoryId: "", itemId: "", paymentDate: new Date().toISOString().slice(0, 10), paymentAmount: 0 }); setIsAddOpen(true); }}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> +New Contractor/Supplier Bill
            </button>
          </div>
          {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

          {/* Filters */}
          <div className="bg-white p-3 rounded-xl border grid grid-cols-1 md:grid-cols-4 gap-3 text-xs shadow-sm">
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
              <label className="block font-semibold mb-1">
                Contractor/Supplier
              </label>
              <select className="w-full border rounded-lg px-3 py-2">
                <option value="">Select One Option</option>
                {[...contractors, ...suppliers].map((row) => <option key={row.uuid} value={row.uuid}>{row.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Ledger</label>
              <select className="w-full border rounded-lg px-3 py-2">
                <option value="">Select Chart Of Account</option><option value="500-001-002-001">500-001-002-001-Contractor Bill Expense</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Select Project</label>
              <select className="w-full border rounded-lg px-3 py-2">
                <option>Select Project</option>
                {projects.map((row) => <option key={row.uuid} value={row.uuid}>{row.name}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
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
              <input
                type="text"
                placeholder="Search..."
                className="border px-3 py-1.5 rounded-lg text-sm w-64"
              />
            </div>

            <div className="overflow-x-auto min-h-[350px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-indigo-600 text-white uppercase tracking-wider">
                  <tr>
                    <th className="py-2 px-3">ID</th>
                    <th className="py-2 px-3">Project Type</th>
                    <th className="py-2 px-3">Project</th>
                    <th className="py-2 px-3">Title / Work</th>
                    <th className="py-2 px-3">Contractor Name</th>
                    <th className="py-2 px-3">Dr. Ledger</th>
                    <th className="py-2 px-3">Code</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3 text-right">Grand Total</th>
                    <th className="py-2 px-3 text-right">Paid</th>
                    <th className="py-2 px-3 text-right">Due</th>
                    <th className="py-2 px-3">Added By</th>
                    <th className="py-2 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bills.map((bill, index) => (
                    <tr key={bill.uuid || index}>
                      <td className="py-2 px-3">{index + 1}</td>
                      <td className="py-2 px-3">
                        {bill.projectTypeName || "-"}
                      </td>
                      <td className="py-2 px-3">{bill.projectName || "-"}</td>
                      <td className="py-2 px-3 text-indigo-600 underline">
                        {bill.title || "-"}
                      </td>
                      <td className="py-2 px-3 text-indigo-600 underline">
                        {bill.contractorName || "-"}
                      </td>
                      <td className="py-2 px-3">{bill.ledgerName || "-"}</td>
                      <td className="py-2 px-3">{bill.code || "-"}</td>
                      <td className="py-2 px-3">{bill.date || "-"}</td>
                      <td className="py-2 px-3 text-right font-semibold">
                        {Number(bill.grandTotal).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {Number(bill.paid).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {Number(bill.due).toFixed(2)}
                      </td>
                      <td className="py-2 px-3">{bill.addedBy || "-"}</td>
                      <td className="py-2 px-3 text-center relative">
                        {/* 👇 Action Button with Dropdown */}
                        <button
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === (bill.uuid || String(index))
                                ? null
                                : bill.uuid || String(index),
                            )
                          }
                          className="bg-indigo-600 text-white text-[11px] font-semibold px-3 py-1.5 rounded inline-flex items-center gap-1"
                        >
                          Action
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            ></path>
                          </svg>
                        </button>

                        {/* 👇 Dropdown Menu */}
                        {activeDropdown === (bill.uuid || String(index)) && (
                          <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-2 px-1 text-left text-xs">
                            {/* View */}
                            <button
                              onClick={() => handleView(bill)}
                              className="w-full px-3 py-2 text-white bg-[#6c5ce7] hover:bg-[#5f4dd0] rounded-md flex items-center justify-center gap-2 font-semibold mb-1"
                            >
                              <Eye className="w-4 h-4" /> View
                            </button>

                            {/* Print */}
                            <button
                              onClick={() => handlePrint(bill)}
                              className="w-full px-3 py-2 text-white bg-[#6c5ce7] hover:bg-[#5f4dd0] rounded-md flex items-center justify-center gap-2 font-semibold mb-1"
                            >
                              <Printer className="w-4 h-4" /> Print
                            </button>

                            {/* Send Mail */}
                            <button
                              onClick={() => handleSendMail(bill)}
                              className="w-full px-3 py-2 text-white bg-[#6c5ce7] hover:bg-[#5f4dd0] rounded-md flex items-center justify-center gap-2 font-semibold mb-1"
                            >
                              <Mail className="w-4 h-4" /> Send Mail
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleEdit(bill)}
                              className="w-full px-3 py-2 text-white bg-[#00d2d3] hover:bg-[#00b8b9] rounded-md flex items-center justify-center gap-2 font-semibold mb-1"
                            >
                              <Edit className="w-4 h-4" /> Edit
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(bill)}
                              className="w-full px-3 py-2 text-white bg-[#ff6b6b] hover:bg-[#ee5253] rounded-md flex items-center justify-center gap-2 font-semibold"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {bills.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={13}
                        className="text-center py-10 text-slate-400"
                      >
                        No data available
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
        <div className="max-w-[1500px] mx-auto bg-white border border-slate-200 rounded-xl shadow-lg p-6 space-y-6">
          {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
          <div className="flex justify-between items-center border-b pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <h2 className="text-lg font-bold text-slate-800">
                Contractor/Supplier Bill Add
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsItemModalOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold"
              >
                Item Add
              </button>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold"
              >
                Labour/Worker Add
              </button>
              <button
                onClick={() => setIsAddOpen(false)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold"
              >
                Contractor Bill List
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
                Contractor/Supplier
              </label>
              <select value={formData.contractorId} onChange={(e) => setFormData({...formData, contractorId: e.target.value})} className="w-full border rounded-lg px-3 py-2">
                <option>Select One Option</option>
                {[...contractors, ...suppliers].map((c) => (
                  <option key={c.uuid} value={c.uuid}>{c.name} ({c.accountType})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Ledger
              </label>
              <select value={formData.ledgerId} onChange={(e) => setFormData({...formData, ledgerId: e.target.value})} className="w-full border rounded-lg px-3 py-2">
                <option value="">Select Chart Of Account</option><option value="500-001-002-001">500-001-002-001-Contractor Bill Expense</option>
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
              <select value={formData.projectTypeId} onChange={(e) => setFormData({...formData, projectTypeId: e.target.value})} className="w-full border rounded-lg px-3 py-2">
                <option>Select value</option>
                {projectTypes.map((t) => (
                  <option key={t.uuid} value={t.uuid}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Project
              </label>
              <select value={formData.projectId} onChange={(e) => setFormData({...formData, projectId: e.target.value, workNameId: "", siteId: ""})} className="w-full border rounded-lg px-3 py-2">
                <option>Select Project</option>
                {projects.map((p) => (
                  <option key={p.uuid} value={p.uuid}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Title/Name of Work
              </label>
              <select value={formData.workNameId} onChange={(e) => setFormData({...formData, workNameId: e.target.value})} className="w-full border rounded-lg px-3 py-2">
                <option>Select Title/Name of Work</option>
                {workNames.filter((row) => !row.raw?.projectId || row.raw.projectId === formData.projectId).map((row) => <option key={row.uuid} value={row.uuid}>{row.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Site
              </label>
              <select value={formData.siteId} onChange={(e) => setFormData({...formData, siteId: e.target.value})} className="w-full border rounded-lg px-3 py-2">
                <option>Select Site</option>
                {sites.filter((row) => !row.raw?.projectId || row.raw.projectId === formData.projectId).map((row) => <option key={row.uuid} value={row.uuid}>{row.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Ref WO No.
              </label>
              <input
                type="text"
                value={formData.poNo}
                onChange={(e) => setFormData({...formData, poNo: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                If Task
              </label>
              <select value={formData.taskId} onChange={(e) => setFormData({...formData, taskId: e.target.value})} className="w-full border rounded-lg px-3 py-2">
                <option>Select Task</option>
                {tasks.map((row) => <option key={row.uuid} value={row.uuid}>{row.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Category
              </label>
              <select value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})} className="w-full border rounded-lg px-3 py-2">
                <option>Select Category</option>
                {categories.map((row) => <option key={row.uuid} value={row.uuid}>{row.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Select Item
              </label>
              <select value={formData.itemId} onChange={(e) => setFormData({...formData, itemId: e.target.value})} className="w-full border rounded-lg px-3 py-2">
                <option>Select Item</option>
                {items.map((i) => (
                  <option key={i.uuid} value={i.uuid}>{i.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bill Items Table */}
          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  <th className="py-3 px-3">Item Name</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Unit</th>
                  <th className="py-3 px-3">Quantity</th>
                  <th className="py-3 px-3">Rate</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billItems.map((row, rowIndex) => <tr key={`${row.itemId || row.name}-${rowIndex}`}>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={row.name || ""}
                      onChange={(e) => setBillItems((rows) => rows.map((item, i) => i === rowIndex ? {...item, name: e.target.value} : item))}
                      className="w-full border rounded px-2 py-1"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={row.description || ""}
                      onChange={(e) => setBillItems((rows) => rows.map((item, i) => i === rowIndex ? {...item, description: e.target.value} : item))}
                      className="w-full border rounded px-2 py-1"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <select className="w-full border rounded px-2 py-1">
                      <option>{row.unit || "Nos"}</option>
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min="0"
                      value={row.quantity}
                      onChange={(e) => setBillItems((rows) => rows.map((item, i) => i === rowIndex ? {...item, quantity: Number(e.target.value)} : item))}
                      className="w-full border rounded px-2 py-1"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min="0"
                      value={row.rate}
                      onChange={(e) => setBillItems((rows) => rows.map((item, i) => i === rowIndex ? {...item, rate: Number(e.target.value)} : item))}
                      className="w-full border rounded px-2 py-1"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-semibold">{(Number(row.quantity || 0) * Number(row.rate || 0)).toFixed(2)}</td>
                  <td className="py-2 px-3 text-center">
                    <button onClick={() => setBillItems((rows) => rows.filter((_, i) => i !== rowIndex))} className="bg-rose-600 text-white p-1 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>)}
                {billItems.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-slate-500">Select an item above and add it to this bill.</td></tr>}
                <tr><td colSpan={7} className="p-2 text-right"><button type="button" onClick={addSelectedItem} disabled={!formData.itemId} className="bg-emerald-600 text-white px-3 py-1 rounded">Add selected item</button></td></tr>
              </tbody>
            </table>
          </div>

          {/* Totals & Payment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mt-4">
            <div className="md:col-span-2 space-y-2">
              <div className="flex justify-between border-b pb-1">
                <span>Subtotal:</span>
                <span>{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b pb-1 font-bold text-indigo-700">
                <span>Grand Total:</span>
                <span>{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Due:</span>
                <span>{Math.max(subtotal - paidAmount, 0).toFixed(2)}</span>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border space-y-2">
              <label className="block font-semibold text-slate-700">
                Payment Method
              </label>
              <div className="flex gap-2">
                <button className="bg-white border rounded px-2 py-1">
                  Cash
                </button>
              </div>
              <label className="block font-semibold text-slate-700 mt-2">
                Payment Date
              </label>
              <input type="date" value={formData.paymentDate} onChange={(e) => setFormData({...formData, paymentDate: e.target.value})} className="w-full border rounded px-2 py-1" />
              <label className="block font-semibold text-slate-700 mt-2">
                Amount
              </label>
              <input
                type="number"
                min="0"
                value={formData.paymentAmount}
                onChange={(e) => setFormData({...formData, paymentAmount: Number(e.target.value)})}
                className="w-full border rounded px-2 py-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button onClick={() => { setIsAddOpen(false); setEditingBillUuid(null); setError(null); }} className="px-5 py-2 border rounded-lg hover:bg-slate-50 font-semibold">
              Cancel
            </button>
            <button onClick={submitBill} disabled={loading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold disabled:opacity-60">
              {loading ? "Saving..." : editingBillUuid ? "Update" : "Submit"}
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
                <select value={newItemData.categoryId} onChange={(e) => setNewItemData({...newItemData, categoryId: e.target.value})} className="w-full border rounded px-2 py-1.5">
                  <option value="">Select Category</option>
                  {categories.map((row) => <option key={row.uuid} value={row.uuid}>{row.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Brand</label>
                <input value={newItemData.brandId} onChange={(e) => setNewItemData({...newItemData, brandId: e.target.value})} placeholder="Brand" className="w-full border rounded px-2 py-1.5" />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1">Item Name</label>
                <input
                  type="text"
                  value={newItemData.name}
                  onChange={(e) => setNewItemData({...newItemData, name: e.target.value})}
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Unit</label>
                <input value={newItemData.unitId} onChange={(e) => setNewItemData({...newItemData, unitId: e.target.value})} placeholder="Unit" className="w-full border rounded px-2 py-1.5" />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Purchase Price
                </label>
                <input
                  type="number"
                  value={newItemData.purchasePrice}
                  onChange={(e) => setNewItemData({...newItemData, purchasePrice: Number(e.target.value)})}
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Sale Price</label>
                <input
                  type="number"
                  value={newItemData.salePrice}
                  onChange={(e) => setNewItemData({...newItemData, salePrice: Number(e.target.value)})}
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
              <button onClick={createBillItem} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: LABOUR/WORKER ADD ==================== */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex justify-between items-center bg-slate-50 px-5 py-3 border-b">
              <h3 className="font-bold text-slate-800">
                Labour/Worker/Contractor
              </h3>
              <button
                onClick={() => setIsContactModalOpen(false)}
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
                <label className="block font-semibold mb-1">Phone/Mobile</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Address</label>
                <input
                  type="text"
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
                <label className="block font-semibold mb-1">Under</label>
                <select className="w-full border rounded px-2 py-1.5">
                  <option>Select One Option</option>
                </select>
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t flex justify-end gap-2">
              <button
                onClick={() => setIsContactModalOpen(false)}
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
