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
  Edit2,
  Calendar,
  FileSpreadsheet,
  FileText,
  ChevronRight,
  ChevronDown,
  Building2,
  Receipt,
  UserPlus,
  PackagePlus,
  Layers,
  CreditCard,
  CheckCircle2
} from "lucide-react";

// ==================== API CONFIG ====================
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PREFIX = "/realbizpro/api/v1";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return { "Content-Type": "application/json" };
  }
  const token =
    localStorage.getItem("share-project:access-token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function ContractorSupplierBillPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter States for list view
  const [filterContractor, setFilterContractor] = useState("");
  const [filterLedger, setFilterLedger] = useState("");
  const [filterProject, setFilterProject] = useState("");

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

  // Action Dropdown State
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // ==================== FETCHERS ====================
  const fetchOptions = async (endpoint: string) => {
    try {
      const res = await fetch(
        `${API_BASE}${API_PREFIX}${endpoint}?page=1&limit=100`,
        { headers: getAuthHeaders() },
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
        { headers: getAuthHeaders() },
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

  // Filter bills
  const filteredBills = bills.filter((b) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      b.code?.toLowerCase().includes(q) ||
      b.contractorName?.toLowerCase().includes(q) ||
      b.projectName?.toLowerCase().includes(q) ||
      b.title?.toLowerCase().includes(q) ||
      b.date?.toLowerCase().includes(q);

    const matchContractor = !filterContractor || b.contractorId === filterContractor;
    const matchProject = !filterProject || b.projectId === filterProject;

    return matchSearch && matchContractor && matchProject;
  });

  // ==================== ACTION HANDLERS ====================
  const handleView = (bill: any) => {
    setActiveDropdown(null);
    alert(`Viewing Bill: ${bill.code}`);
  };

  const handlePrint = (bill: any) => {
    setActiveDropdown(null);
    window.print();
  };

  const handleSendMail = (bill: any) => {
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
      const res = await fetch(`${API_BASE}${API_PREFIX}/project-billing/contractor-bills/${bill.uuid}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
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
        headers: getAuthHeaders(),
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
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      
      {/* ==================== LIST VIEW ==================== */}
      {!isAddOpen && (
        <div className="mx-auto max-w-[1600px] space-y-5">
          {/* Top Breadcrumb & Actions Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <nav className="flex items-center text-xs sm:text-sm text-slate-500 gap-1.5 sm:gap-2 mb-1">
                <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Home</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Billing</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                  Contractor/Supplier Bill List
                </span>
              </nav>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                <Receipt className="w-6 h-6 text-indigo-600" />
                Contractor/Supplier Bill List
              </h1>
            </div>

            <button
              onClick={() => {
                setEditingBillUuid(null);
                setError(null);
                setBillItems([]);
                setFormData({
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
                setIsAddOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 hover:shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+New Contractor/Supplier Bill</span>
            </button>
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs sm:text-sm font-semibold text-rose-700">
              {error}
            </div>
          )}

          {/* Filters Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Select Date */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Select Date
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value="1 October, 2026 - 31 October, 2026"
                    readOnly
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-3.5 pr-9 text-xs sm:text-sm text-slate-700 outline-none"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Contractor/Supplier */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Contractor/Supplier
                </label>
                <div className="relative">
                  <select 
                    value={filterContractor}
                    onChange={(e) => setFilterContractor(e.target.value)}
                    className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/60 pl-3.5 pr-8 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                  >
                    <option value="">Select One Option</option>
                    {[...contractors, ...suppliers].map((row) => (
                      <option key={row.uuid} value={row.uuid}>{row.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Ledger */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Ledger
                </label>
                <div className="relative">
                  <select 
                    value={filterLedger}
                    onChange={(e) => setFilterLedger(e.target.value)}
                    className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/60 pl-3.5 pr-8 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                  >
                    <option value="">Select Chart Of Account</option>
                    <option value="500-001-002-001">500-001-002-001-Contractor Bill Expense</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Select Project */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Select Project
                </label>
                <div className="relative">
                  <select 
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/60 pl-3.5 pr-8 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                  >
                    <option value="">Select Project</option>
                    {projects.map((row) => (
                      <option key={row.uuid} value={row.uuid}>{row.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-visible">
            {/* Table Action Bar */}
            <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => alert("Exporting Excel...")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-700 active:scale-95"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button 
                  onClick={() => alert("Exporting PDF...")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-rose-700 active:scale-95"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto min-h-[350px]">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-3 text-center w-12">ID</th>
                    <th className="py-3 px-3 whitespace-nowrap">PROJECT TYPE</th>
                    <th className="py-3 px-3 whitespace-nowrap">PROJECT</th>
                    <th className="py-3 px-3 whitespace-nowrap">TITLE / WORK</th>
                    <th className="py-3 px-3 whitespace-nowrap">CONTRACTOR NAME</th>
                    <th className="py-3 px-3 whitespace-nowrap">DR. LEDGER</th>
                    <th className="py-3 px-3 whitespace-nowrap">CODE</th>
                    <th className="py-3 px-3 whitespace-nowrap">DATE</th>
                    <th className="py-3 px-3 text-right whitespace-nowrap">GRAND TOTAL</th>
                    <th className="py-3 px-3 text-right whitespace-nowrap">PAID</th>
                    <th className="py-3 px-3 text-right whitespace-nowrap">DUE</th>
                    <th className="py-3 px-3 whitespace-nowrap">ADDED BY</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap w-24">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredBills.map((bill, index) => (
                    <tr key={bill.uuid || index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center font-medium text-slate-500">{index + 1}</td>
                      <td className="py-3 px-3 text-slate-600">{bill.projectTypeName || "—"}</td>
                      <td className="py-3 px-3 font-medium text-slate-900">{bill.projectName || "—"}</td>
                      <td className="py-3 px-3 font-semibold text-indigo-600">
                        {bill.title || "—"}
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-medium">
                        {bill.contractorName || "—"}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-xs">{bill.ledgerName || "—"}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                          {bill.code || "—"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{bill.date || "—"}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ৳{Number(bill.grandTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                        ৳{Number(bill.paid).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                        ৳{Number(bill.due).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{bill.addedBy || "—"}</td>
                      <td className="py-3 px-3 text-center relative">
                        {/* Action Button with Dropdown */}
                        <button
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === (bill.uuid || String(index))
                                ? null
                                : bill.uuid || String(index),
                            )
                          }
                          className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-2xs transition"
                        >
                          <span>Action</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeDropdown === (bill.uuid || String(index)) && (
                          <div className="absolute right-2 mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 px-1.5 text-left text-xs space-y-1">
                            <button
                              onClick={() => handleView(bill)}
                              className="w-full px-2.5 py-1.5 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 font-medium transition"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-500" /> View
                            </button>

                            <button
                              onClick={() => handlePrint(bill)}
                              className="w-full px-2.5 py-1.5 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 font-medium transition"
                            >
                              <Printer className="w-3.5 h-3.5 text-indigo-500" /> Print
                            </button>

                            <button
                              onClick={() => handleSendMail(bill)}
                              className="w-full px-2.5 py-1.5 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 font-medium transition"
                            >
                              <Mail className="w-3.5 h-3.5 text-indigo-500" /> Send Mail
                            </button>

                            <button
                              onClick={() => handleEdit(bill)}
                              className="w-full px-2.5 py-1.5 text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg flex items-center gap-2 font-medium transition border-t border-slate-100"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-emerald-500" /> Edit
                            </button>

                            <button
                              onClick={() => handleDelete(bill)}
                              className="w-full px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 font-medium transition"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredBills.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={13}
                        className="text-center py-12 text-slate-400 italic bg-slate-50/50 text-sm"
                      >
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3.5 bg-slate-50/70 border-t border-slate-200/80 text-xs text-slate-500 flex justify-between items-center">
              <span>Showing {filteredBills.length} entries</span>
              <span className="font-semibold text-slate-700">
                Total Amount: ৳{filteredBills.reduce((acc, curr) => acc + (Number(curr.grandTotal) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADD / EDIT VIEW ==================== */}
      {isAddOpen && (
        <div className="mx-auto max-w-[1500px] bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs sm:text-sm font-semibold text-rose-700">{error}</div>}
          
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-5 gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAddOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  {editingBillUuid ? "Edit Contractor/Supplier Bill" : "Contractor/Supplier Bill Add"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Record contractor or supplier work order and billing information.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsItemModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-800 shadow-2xs hover:bg-indigo-100 transition"
              >
                <PackagePlus className="w-3.5 h-3.5" />
                <span>Item Add</span>
              </button>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Labour/Worker Add</span>
              </button>
              <button
                onClick={() => setIsAddOpen(false)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
              >
                <span>Contractor Bill List</span>
              </button>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Contractor/Supplier <span className="text-rose-500">*</span>
              </label>
              <select 
                value={formData.contractorId} 
                onChange={(e) => setFormData({...formData, contractorId: e.target.value})} 
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
              >
                <option value="">Select One Option</option>
                {[...contractors, ...suppliers].map((c) => (
                  <option key={c.uuid} value={c.uuid}>{c.name} ({c.accountType})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Ledger
              </label>
              <select 
                value={formData.ledgerId} 
                onChange={(e) => setFormData({...formData, ledgerId: e.target.value})} 
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
              >
                <option value="">Select Chart Of Account</option>
                <option value="500-001-002-001">500-001-002-001-Contractor Bill Expense</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Code
              </label>
              <input
                type="text"
                value={formData.code}
                readOnly
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3 font-mono text-xs sm:text-sm font-bold text-slate-700 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Project Type
              </label>
              <select 
                value={formData.projectTypeId} 
                onChange={(e) => setFormData({...formData, projectTypeId: e.target.value})} 
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
              >
                <option value="">Select value</option>
                {projectTypes.map((t) => (
                  <option key={t.uuid} value={t.uuid}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Project <span className="text-rose-500">*</span>
              </label>
              <select 
                value={formData.projectId} 
                onChange={(e) => setFormData({...formData, projectId: e.target.value, workNameId: "", siteId: ""})} 
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p.uuid} value={p.uuid}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Title/Name of Work
              </label>
              <select 
                value={formData.workNameId} 
                onChange={(e) => setFormData({...formData, workNameId: e.target.value})} 
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
              >
                <option value="">Select Title/Name of Work</option>
                {workNames.filter((row) => !row.raw?.projectId || row.raw.projectId === formData.projectId).map((row) => (
                  <option key={row.uuid} value={row.uuid}>{row.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Site
              </label>
              <select 
                value={formData.siteId} 
                onChange={(e) => setFormData({...formData, siteId: e.target.value})} 
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
              >
                <option value="">Select Site</option>
                {sites.filter((row) => !row.raw?.projectId || row.raw.projectId === formData.projectId).map((row) => (
                  <option key={row.uuid} value={row.uuid}>{row.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Ref WO No.
              </label>
              <input
                type="text"
                value={formData.poNo}
                onChange={(e) => setFormData({...formData, poNo: e.target.value})}
                placeholder="Work Order Ref No"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                If Task
              </label>
              <select 
                value={formData.taskId} 
                onChange={(e) => setFormData({...formData, taskId: e.target.value})} 
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
              >
                <option value="">Select Task</option>
                {tasks.map((row) => <option key={row.uuid} value={row.uuid}>{row.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Category
              </label>
              <select 
                value={formData.categoryId} 
                onChange={(e) => setFormData({...formData, categoryId: e.target.value})} 
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
              >
                <option value="">Select Category</option>
                {categories.map((row) => <option key={row.uuid} value={row.uuid}>{row.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Select Item
              </label>
              <div className="flex gap-2">
                <select 
                  value={formData.itemId} 
                  onChange={(e) => setFormData({...formData, itemId: e.target.value})} 
                  className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                >
                  <option value="">Select Item</option>
                  {items.map((i) => (
                    <option key={i.uuid} value={i.uuid}>{i.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addSelectedItem}
                  disabled={!formData.itemId}
                  className="h-10 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition disabled:opacity-40 shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Bill Items Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 w-28">Unit</th>
                  <th className="py-3 px-4 w-28">Quantity</th>
                  <th className="py-3 px-4 w-28 text-right">Rate</th>
                  <th className="py-3 px-4 text-right w-32">Amount</th>
                  <th className="py-3 px-4 text-center w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {billItems.map((row, rowIndex) => (
                  <tr key={`${row.itemId || row.name}-${rowIndex}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      <input
                        type="text"
                        value={row.name || ""}
                        onChange={(e) => setBillItems((rows) => rows.map((item, i) => i === rowIndex ? {...item, name: e.target.value} : item))}
                        className="h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs text-slate-800 outline-none focus:border-indigo-600"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-xs">
                      <input
                        type="text"
                        value={row.description || ""}
                        onChange={(e) => setBillItems((rows) => rows.map((item, i) => i === rowIndex ? {...item, description: e.target.value} : item))}
                        className="h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs text-slate-800 outline-none focus:border-indigo-600"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      <select className="h-8 w-full rounded-lg border border-slate-200 px-2 text-xs text-slate-800 outline-none">
                        <option>{row.unit || "Nos"}</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="number"
                        min="0"
                        value={row.quantity}
                        onChange={(e) => setBillItems((rows) => rows.map((item, i) => i === rowIndex ? {...item, quantity: Number(e.target.value)} : item))}
                        className="h-8 w-full rounded-lg border border-slate-200 px-2.5 font-mono text-xs text-slate-800 outline-none focus:border-indigo-600"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <input
                        type="number"
                        min="0"
                        value={row.rate}
                        onChange={(e) => setBillItems((rows) => rows.map((item, i) => i === rowIndex ? {...item, rate: Number(e.target.value)} : item))}
                        className="h-8 w-full rounded-lg border border-slate-200 px-2.5 font-mono text-xs text-slate-800 outline-none text-right focus:border-indigo-600"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      ৳{(Number(row.quantity || 0) * Number(row.rate || 0)).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button 
                        onClick={() => setBillItems((rows) => rows.filter((_, i) => i !== rowIndex))} 
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {billItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 italic bg-slate-50/50">
                      Select an item above and click &quot;Add&quot; to include it in this bill.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals & Payment Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* Payment Method Details */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                Payment Record
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Payment Method
                  </label>
                  <div className="flex">
                    <span className="h-10 px-4 rounded-xl border border-slate-200 bg-white inline-flex items-center text-xs font-bold text-slate-800 shadow-2xs">
                      Cash
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Payment Date
                  </label>
                  <input 
                    type="date" 
                    value={formData.paymentDate} 
                    onChange={(e) => setFormData({...formData, paymentDate: e.target.value})} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-800 outline-none focus:border-indigo-600" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Payment Amount (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.paymentAmount}
                    onChange={(e) => setFormData({...formData, paymentAmount: Number(e.target.value)})}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>

            {/* Subtotal, Grand Total, Due Card */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-3 shadow-2xs">
              <div className="flex justify-between items-center text-xs sm:text-sm text-slate-600 border-b border-slate-100 pb-2">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold text-slate-800">৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm sm:text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                <span>Grand Total:</span>
                <span className="font-mono text-indigo-600">৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm font-semibold pt-1">
                <span className="text-slate-500">Amount Due:</span>
                <span className={`font-mono font-extrabold ${Math.max(subtotal - paidAmount, 0) > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                  ৳{Math.max(subtotal - paidAmount, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              onClick={() => { setIsAddOpen(false); setEditingBillUuid(null); setError(null); }} 
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button 
              onClick={submitBill} 
              disabled={loading} 
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition active:scale-95 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{editingBillUuid ? "Update Bill" : "Submit Bill"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================== MODAL: NEW ITEM ==================== */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center bg-slate-50/80 px-5 py-4 border-b border-slate-100">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <PackagePlus className="w-4 h-4 text-indigo-600" />
                Add New Billing Item
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Category</label>
                <select 
                  value={newItemData.categoryId} 
                  onChange={(e) => setNewItemData({...newItemData, categoryId: e.target.value})} 
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-indigo-600"
                >
                  <option value="">Select Category</option>
                  {categories.map((row) => <option key={row.uuid} value={row.uuid}>{row.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Brand</label>
                <input 
                  value={newItemData.brandId} 
                  onChange={(e) => setNewItemData({...newItemData, brandId: e.target.value})} 
                  placeholder="Brand" 
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-indigo-600" 
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-600 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={newItemData.name}
                  onChange={(e) => setNewItemData({...newItemData, name: e.target.value})}
                  placeholder="e.g. Labour Service / Electrical Fitting"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Unit</label>
                <input 
                  value={newItemData.unitId} 
                  onChange={(e) => setNewItemData({...newItemData, unitId: e.target.value})} 
                  placeholder="e.g. Nos / Cft / Day" 
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-indigo-600" 
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Purchase Price</label>
                <input
                  type="number"
                  value={newItemData.purchasePrice}
                  onChange={(e) => setNewItemData({...newItemData, purchasePrice: Number(e.target.value)})}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 font-mono outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Sale Price</label>
                <input
                  type="number"
                  value={newItemData.salePrice}
                  onChange={(e) => setNewItemData({...newItemData, salePrice: Number(e.target.value)})}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 font-mono outline-none focus:border-indigo-600"
                />
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white"
              >
                Close
              </button>
              <button 
                onClick={createBillItem} 
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-2xs"
              >
                Save Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: LABOUR/WORKER ADD ==================== */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center bg-slate-50/80 px-5 py-4 border-b border-slate-100">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                Labour / Worker / Contractor Add
              </h3>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Code</label>
                <input
                  type="text"
                  defaultValue={newWorker.code}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 font-mono text-slate-500 cursor-not-allowed"
                  readOnly
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Name *</label>
                <input
                  type="text"
                  placeholder="Worker or Contractor Name"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Phone / Mobile</label>
                <input
                  type="text"
                  placeholder="01XXXXXXXXX"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Current Address"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Opening Balance (৳)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 font-mono outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Credit Limit (৳)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 font-mono outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Due Date</label>
                <input
                  type="date"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Under</label>
                <select className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-indigo-600">
                  <option>Select One Option</option>
                </select>
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  alert("Worker/Contractor recorded");
                  setIsContactModalOpen(false);
                }} 
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-2xs"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
