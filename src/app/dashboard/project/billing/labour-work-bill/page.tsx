/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, ArrowLeft, X, Edit3, Trash2, Search, Loader2, Save, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import PredictiveSearchSelect from "@/components/ui/PredictiveSearchSelect";
import { getStoredUser, getStoredAccessToken } from "@/lib/admin-auth/adminAuthStorage";

// ==================== API CONFIG ====================
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PATH = `${API_BASE}/realbizpro/api/v1`;

function getAuthHeaders(): Record<string, string> {
  const token =
    getStoredAccessToken() ||
    (typeof window !== "undefined"
      ? localStorage.getItem("share-project:access-token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken")
      : null);
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function LabourWorkerBillPage() {
  const [storedUser, setStoredUser] = useState<any>(null);
  useEffect(() => {
    setStoredUser(getStoredUser());
  }, []);
  const userEmail = (storedUser?.email || "").toLowerCase().trim();

  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingBillUuid, setEditingBillUuid] = useState<string | null>(null);

  // Dropdown Data
  const [contractors, setContractors] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectTypes, setProjectTypes] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [workNames, setWorkNames] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({ workerId: "", workerName: "", description: "", unit: "Day", qtyDays: 1, rate: 800, security: 0 });

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    code: `LW000${Math.floor(10 + Math.random() * 90)}`,
    contractorId: "",
    projectId: "",
    projectTypeId: "",
    titleOfWork: "",
    site: "",
    refWoNo: "",
    taskId: "",
    categoryId: "",
    itemId: "",
    paymentMethod: "Cash",
    paidAmount: 0,
  });

  const [billItems, setBillItems] = useState<any[]>([
    {
      id: "1",
      workerId: "",
      workerName: "Masons Group 1",
      description: "Bricklaying & Plastering work",
      unit: "Day",
      qtyDays: 5,
      rate: 900,
      gross: 4500,
      security: 200,
      netPayable: 4300,
    }
  ]);

  // ==================== API CALLS ====================
  const fetchOptions = async (endpoint: string) => {
    try {
      const res = await fetch(`${API_PATH}${endpoint}?page=1&limit=100`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return [];
      const json = await res.json();
      const rows = Array.isArray(json?.data?.data) ? json.data.data : Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      return rows.map((r: any) => ({
        ...r,
        uuid: r.uuid || r.id,
        name: r.name || r.workerName || r.projectName || r.title || r.itemName || r.code || "Unnamed",
      }));
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      return [];
    }
  };

  const loadDropdowns = useCallback(async () => {
    const headers = getAuthHeaders();
    const currentUser = getStoredUser();
    const activeEmail = (currentUser?.email || userEmail || "").toLowerCase().trim();
    const activeId = String(currentUser?.id || storedUser?.id || "");

    const [cust, allProj, types, itms, workerList, workList, siteList, taskList, cats] = await Promise.all([
      fetchOptions("/contractor"),
      fetchOptions("/project"),
      fetchOptions("/project-type"),
      fetchOptions("/project-billing/bill-items"),
      fetchOptions("/labour-work-bank"),
      fetchOptions("/project-billing/service-work-names"),
      fetchOptions("/project-sites"),
      fetchOptions("/task"),
      fetchOptions("/category"),
    ]);

    const userProjects = activeEmail
      ? allProj.filter((p: any) => {
          const raw = p.raw || p || {};
          const creator = String(
            raw.createdBy ||
              raw.clientEmail ||
              raw.email ||
              raw.userEmail ||
              raw.projectManager ||
              ""
          )
            .toLowerCase()
            .trim();
          return creator === activeEmail || (activeId && creator === activeId);
        })
      : allProj;

    setContractors(cust);
    setProjects(userProjects);
    setProjectTypes(types);
    setItems(itms);
    setWorkers(workerList);
    setWorkNames(workList);
    setSites(siteList);
    setTasks(taskList);
    setCategories(cats);
  }, [userEmail, storedUser?.id]);

  const loadBills = useCallback(async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const currentUser = getStoredUser();
      const activeEmail = (currentUser?.email || userEmail || "").toLowerCase().trim();

      const res = await fetch(`${API_PATH}/project-billing/labour-work-bills?page=1&limit=100`, {
        headers,
      });
      if (!res.ok) throw new Error("Failed to load labour work bills");
      const json = await res.json();
      const rows = json?.data?.data || json?.data || [];
      const userProjUuids = new Set(projects.map((p) => p.uuid));

      const filtered = rows
        .filter((row: any) => !row.deletedAt)
        .filter((row: any) => {
          if (!activeEmail) return true;
          const belongsToProj = row.projectId && userProjUuids.has(row.projectId);
          const creator = String(row.createdBy || row.details?.createdBy || "").toLowerCase().trim();
          return belongsToProj || creator === activeEmail;
        })
        .map((row: any) => ({
          ...row,
          ...(row.details || {}),
          uuid: row.uuid,
          code: row.code,
          date: row.recordDate || row.date,
          grandTotal: Number(row.amount || row.details?.grandTotal || 0),
          projectName: row.project?.name || row.details?.projectName || "Share Tower 1",
          workerName: row.details?.workerName || row.details?.items?.map((item: any) => item.workerName).filter(Boolean).join(", ") || row.details?.contractorName || "Contractor Team",
          createdBy: row.createdBy || row.details?.createdBy || activeEmail,
        }));

      setBills(filtered);
    } catch (err: any) {
      toast.error(err.message || "Failed to load bills");
    } finally {
      setLoading(false);
    }
  }, [projects, userEmail]);

  useEffect(() => {
    loadDropdowns();
  }, [loadDropdowns]);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  // ==================== CREATE / UPDATE ====================
  const handleCreateBill = async () => {
    try {
      const project = projects.find((row) => row.uuid === formData.projectId) || projects[0];
      const contractor = contractors.find((row) => row.uuid === formData.contractorId) || contractors[0];
      
      const projectId = formData.projectId || project?.uuid;
      const contractorId = formData.contractorId || contractor?.uuid;

      if (!projectId) {
        toast.error("Please select a project");
        return;
      }
      if (!contractorId) {
        toast.error("Please select a contractor");
        return;
      }
      if (!billItems.length) {
        toast.error("Add at least one labour/worker row.");
        return;
      }

      setLoading(true);
      const currentUser = getStoredUser();
      const activeEmail = currentUser?.email || userEmail || "sharetest@realbiz.com";

      const total = billItems.reduce((sum, row) => sum + Number(row.netPayable || 0), 0);
      const details = { 
        ...formData, 
        projectId,
        contractorId,
        projectName: project?.name || "Share Tower 1", 
        contractorName: contractor?.name || "Contractor", 
        projectTypeName: projectTypes.find((row) => row.uuid === formData.projectTypeId)?.name || "", 
        workName: workNames.find((row) => row.uuid === formData.titleOfWork)?.name || "", 
        siteName: sites.find((row) => row.uuid === formData.site)?.name || "", 
        items: billItems, 
        grandTotal: total, 
        paidAmount: Number(formData.paidAmount || 0), 
        dueAmount: Math.max(total - Number(formData.paidAmount || 0), 0),
        createdBy: activeEmail,
      };

      const payload = {
        projectId,
        title: details.workName || `Labour Work Bill ${formData.code}`,
        code: formData.code,
        recordDate: formData.date,
        amount: total,
        status: "active",
        description: formData.refWoNo || "",
        createdBy: activeEmail,
        details,
      };

      const res = await fetch(`${API_PATH}/project-billing/labour-work-bills${editingBillUuid ? `/${editingBillUuid}` : ""}`, {
        method: editingBillUuid ? "PATCH" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) { 
        const body = await res.json().catch(() => ({})); 
        throw new Error(body.message || "Failed to save labour work bill"); 
      }
      toast.success(editingBillUuid ? "Updated successfully!" : "Created successfully!");
      setIsAddOpen(false);
      setEditingBillUuid(null);
      await loadBills();
    } catch (err: any) {
      toast.error(err.message || "Failed to save bill");
    } finally {
      setLoading(false);
    }
  };

  // ==================== ADD ITEM LOGIC ====================
  const handleAddItem = () => {
    const worker = workers.find((row) => row.uuid === newItem.workerId);
    const gross = Number(newItem.qtyDays || 0) * Number(newItem.rate || 0);
    setBillItems((rows) => [
      ...rows, 
      { 
        ...newItem, 
        id: String(Date.now()), 
        workerName: worker?.name || newItem.workerName || "Worker", 
        gross, 
        netPayable: Math.max(gross - Number(newItem.security || 0), 0) 
      }
    ]);
    setNewItem({ workerId: "", workerName: "", description: "", unit: "Day", qtyDays: 1, rate: 800, security: 0 });
    setIsItemModalOpen(false);
  };

  // ==================== EDIT & DELETE ====================
  const handleEdit = (bill: any) => { 
    setEditingBillUuid(bill.uuid); 
    setIsAddOpen(true); 
    setFormData((previous) => ({ 
      ...previous, 
      ...(bill.details || bill), 
      date: bill.recordDate || bill.date || previous.date, 
      code: bill.code || previous.code,
      projectId: bill.projectId || bill.details?.projectId || previous.projectId,
      contractorId: bill.details?.contractorId || previous.contractorId,
    })); 
    setBillItems(Array.isArray(bill.details?.items) && bill.details.items.length > 0 ? bill.details.items : Array.isArray(bill.items) && bill.items.length > 0 ? bill.items : [
      {
        id: "1",
        workerId: "",
        workerName: bill.workerName || "Worker Team",
        description: "Labour work",
        unit: "Day",
        qtyDays: 3,
        rate: 800,
        gross: 2400,
        security: 100,
        netPayable: 2300,
      }
    ]); 
  };

  const handleDelete = async (bill: any) => {
    if (!window.confirm(`Delete "${bill.code}"?`)) return;
    try { 
      const res = await fetch(`${API_PATH}/project-billing/labour-work-bills/${bill.uuid}`, { 
        method: "DELETE",
        headers: getAuthHeaders(),
      }); 
      if (!res.ok) throw new Error("Failed to delete bill"); 
      toast.success("Deleted successfully!");
      setBills(prev => prev.filter(b => b.uuid !== bill.uuid));
    } catch (err: any) { 
      toast.error(err.message || "Failed to delete bill"); 
    }
  };

  const handleCreate = () => {
    setEditingBillUuid(null);
    setBillItems([
      {
        id: "1",
        workerId: workers[0]?.uuid || "",
        workerName: workers[0]?.name || "Labour Team Alpha",
        description: "Bricklaying & Plastering work",
        unit: "Day",
        qtyDays: 5,
        rate: 900,
        gross: 4500,
        security: 200,
        netPayable: 4300,
      }
    ]);
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      code: `LW000${Math.floor(10 + Math.random() * 90)}`,
      contractorId: contractors[0]?.uuid || "",
      projectId: projects[0]?.uuid || "",
      projectTypeId: projectTypes[0]?.uuid || "",
      titleOfWork: workNames[0]?.uuid || "",
      site: sites[0]?.uuid || "",
      refWoNo: "",
      taskId: tasks[0]?.uuid || "",
      categoryId: categories[0]?.uuid || "",
      itemId: items[0]?.uuid || "",
      paymentMethod: "Cash",
      paidAmount: 2000,
    });
    setIsAddOpen(true);
  };

  // Filtered list
  const filteredBills = bills.filter(b => 
    b.code?.toLowerCase().includes(search.toLowerCase()) ||
    b.projectName?.toLowerCase().includes(search.toLowerCase()) ||
    b.workerName?.toLowerCase().includes(search.toLowerCase())
  );

  // Options for PredictiveSearchSelect
  const contractorOptions = contractors.map(c => ({ value: c.uuid, label: c.name }));
  const projectOptions = projects.map(p => ({ value: p.uuid, label: p.name }));
  const projectTypeOptions = projectTypes.map(p => ({ value: p.uuid, label: p.name }));
  const workOptions = workNames.map(w => ({ value: w.uuid, label: w.name }));
  const siteOptions = sites.map(s => ({ value: s.uuid, label: s.name }));
  const taskOptions = tasks.map(t => ({ value: t.uuid, label: t.name }));
  const categoryOptions = categories.map(c => ({ value: c.uuid, label: c.name }));
  const itemOptions = items.map(i => ({ value: i.uuid, label: i.name }));
  const workerOptions = workers.map(w => ({ value: w.uuid, label: w.name }));
  const paymentMethodOptions = [
    { value: "Cash", label: "Cash" },
    { value: "Bank", label: "Bank" },
    { value: "Cheque", label: "Cheque" },
    { value: "Mobile Banking", label: "Mobile Banking" },
  ];
  const unitOptions = [
    { value: "Day", label: "Day" },
    { value: "Hour", label: "Hour" },
    { value: "Shift", label: "Shift" },
    { value: "Piece", label: "Piece" },
  ];

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 font-sans text-slate-800">

      {/* ==================== LIST VIEW ==================== */}
      {!isAddOpen && (
        <div className="max-w-[1600px] mx-auto space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <nav className="flex items-center text-xs sm:text-sm text-slate-500 gap-1.5 sm:gap-2 mb-1">
                <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Project</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Billing</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                  Labour Work Bill
                </span>
              </nav>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                Labour/Worker Bill List / লেবার ওয়ার্ক বিল
              </h1>
            </div>
            <button 
              onClick={handleCreate} 
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 hover:shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" /> + New Labour/Worker Bill
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
               <div className="flex gap-2">
                 <button className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-700 active:scale-95">Excel</button>
                 <button className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-rose-700 active:scale-95">PDF</button>
               </div>
               <div className="relative w-full sm:w-72">
                 <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                 <input 
                   type="text" 
                   value={search} 
                   onChange={(e) => setSearch(e.target.value)} 
                   placeholder="Search..." 
                   className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10" 
                 />
               </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : (
              <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-xs sm:text-sm text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white text-xs font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4 font-semibold text-white text-left tracking-wide">ID</th>
                      <th className="py-3.5 px-4 font-semibold text-white text-left tracking-wide">Project</th>
                      <th className="py-3.5 px-4 font-semibold text-white text-left tracking-wide">Worker / Contractor</th>
                      <th className="py-3.5 px-4 font-semibold text-white text-left tracking-wide">Code</th>
                      <th className="py-3.5 px-4 font-semibold text-white text-left tracking-wide">Date</th>
                      <th className="py-3.5 px-4 font-semibold text-white text-right tracking-wide">Grand Total</th>
                      <th className="py-3.5 px-4 font-semibold text-white text-left tracking-wide">Added By</th>
                      <th className="py-3.5 px-4 font-semibold text-white text-center tracking-wide">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-700 font-medium">
                    {filteredBills.map((bill, index) => (
                      <tr key={bill.uuid || index} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">{index + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{bill.projectName || "-"}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{bill.workerName || "-"}</td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-xs">{bill.code || "-"}</td>
                        <td className="py-3 px-4 text-slate-600">{bill.date || "-"}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">৳{Number(bill.grandTotal || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-slate-500">{bill.createdBy || userEmail}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => handleEdit(bill)} 
                              className="rounded-lg bg-teal-50 p-1.5 text-teal-600 transition hover:bg-teal-100 active:scale-95" 
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(bill)} 
                              className="rounded-lg bg-rose-50 p-1.5 text-rose-600 transition hover:bg-rose-100 active:scale-95" 
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredBills.length === 0 && (
                      <tr><td colSpan={8} className="text-center py-16 text-slate-400">No labour work bill records available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
              <div>
                Showing {filteredBills.length > 0 ? 1 : 0} to {filteredBills.length} of {filteredBills.length} entries
              </div>
              <div className="flex items-center gap-1">
                <button disabled className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed">Previous</button>
                <button className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold">1</button>
                <button disabled className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed">Next</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADD / EDIT VIEW ==================== */}
      {isAddOpen && (
        <div className="max-w-[1600px] mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsAddOpen(false)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition"><ArrowLeft className="w-5 h-5 text-slate-700" /></button>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{editingBillUuid ? "Edit Labour/Worker Bill" : "New Labour/Worker Bill"}</h2>
                <p className="text-xs text-slate-500">Bill Code: <span className="font-mono text-indigo-600 font-bold">{formData.code}</span></p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsItemModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition">+ Item Add</button>
              <button onClick={() => setIsAddOpen(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition">Back to List</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-xs bg-white" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contractor *</label>
              <PredictiveSearchSelect
                options={contractorOptions}
                value={formData.contractorId}
                onChange={(val) => setFormData(prev => ({ ...prev, contractorId: val }))}
                placeholder="Select Contractor"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Project *</label>
              <PredictiveSearchSelect
                options={projectOptions}
                value={formData.projectId}
                onChange={(val) => setFormData(prev => ({ ...prev, projectId: val, site: "" }))}
                placeholder="Select Project"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Project Type</label>
              <PredictiveSearchSelect
                options={projectTypeOptions}
                value={formData.projectTypeId}
                onChange={(val) => setFormData(prev => ({ ...prev, projectTypeId: val }))}
                placeholder="Select Project Type"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Title/Name of Work</label>
              <PredictiveSearchSelect
                options={workOptions}
                value={formData.titleOfWork}
                onChange={(val) => setFormData(prev => ({ ...prev, titleOfWork: val }))}
                placeholder="Select Work Name"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Site</label>
              <PredictiveSearchSelect
                options={siteOptions}
                value={formData.site}
                onChange={(val) => setFormData(prev => ({ ...prev, site: val }))}
                placeholder="Select Site"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ref WO No.</label>
              <input value={formData.refWoNo} onChange={(e) => setFormData(prev => ({ ...prev, refWoNo: e.target.value }))} placeholder="Ref W/O No." className="w-full border rounded-xl px-3 py-2 text-xs bg-white" />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 border-b">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Labour/Worker</th>
                  <th className="py-2.5 px-3 font-semibold">Description</th>
                  <th className="py-2.5 px-3 font-semibold">Unit</th>
                  <th className="py-2.5 px-3 font-semibold">Qty/Days</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Rate</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Gross</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Security</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Net Payable</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billItems.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="py-2 px-3">
                      <input 
                        value={item.workerName || ""} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setBillItems(rows => rows.map((r, i) => i === index ? { ...r, workerName: val } : r));
                        }} 
                        className="w-full border rounded-lg px-2 py-1 text-xs" 
                        placeholder="Worker / Team"
                      />
                    </td>
                    <td className="py-2 px-3"><input value={item.description || ""} onChange={(e) => setBillItems((rows) => rows.map((r, i) => i === index ? {...r, description: e.target.value} : r))} type="text" className="w-full border rounded-lg px-2 py-1 text-xs" /></td>
                    <td className="py-2 px-3">
                      <div className="w-24">
                        <PredictiveSearchSelect
                          options={unitOptions}
                          value={item.unit || "Day"}
                          onChange={(val) => setBillItems(rows => rows.map((r, i) => i === index ? { ...r, unit: val } : r))}
                          placeholder="Unit"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-3"><input value={item.qtyDays ?? 1} min="0" type="number" onChange={(e) => setBillItems((rows) => rows.map((r, i) => { if (i !== index) return r; const qtyDays = Number(e.target.value); const gross = qtyDays * Number(r.rate || 0); return {...r, qtyDays, gross, netPayable: Math.max(gross - Number(r.security || 0), 0)}; }))} className="w-20 border rounded-lg px-2 py-1 text-xs" /></td>
                    <td className="py-2 px-3 text-right"><input value={item.rate ?? 0} min="0" type="number" onChange={(e) => setBillItems((rows) => rows.map((r, i) => { if (i !== index) return r; const rate = Number(e.target.value); const gross = Number(r.qtyDays || 0) * rate; return {...r, rate, gross, netPayable: Math.max(gross - Number(r.security || 0), 0)}; }))} className="w-24 border rounded-lg px-2 py-1 text-xs text-right" /></td>
                    <td className="py-2 px-3 text-right font-medium">৳{Number(item.gross || 0).toFixed(2)}</td>
                    <td className="py-2 px-3"><input value={item.security ?? 0} min="0" type="number" onChange={(e) => setBillItems((rows) => rows.map((r, i) => { if (i !== index) return r; const security = Number(e.target.value); return {...r, security, netPayable: Math.max(Number(r.gross || 0) - security, 0)}; }))} className="w-20 border rounded-lg px-2 py-1 text-xs text-right" /></td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-600">৳{Number(item.netPayable || 0).toFixed(2)}</td>
                    <td className="py-2 px-3 text-center"><button type="button" onClick={() => setBillItems((rows) => rows.filter((_, i) => i !== index))} className="text-rose-500 hover:text-rose-700"><X className="w-4 h-4"/></button></td>
                  </tr>
                ))}
                {billItems.length === 0 && <tr><td colSpan={9} className="text-center py-6 text-slate-400">No items added yet. Click &quot;Item Add&quot; above.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-2 space-y-2 bg-slate-50 p-4 rounded-xl border">
              <div className="flex justify-between border-b pb-1 text-slate-600"><span>Gross Total:</span><span>৳{billItems.reduce((sum, row) => sum + Number(row.gross || 0), 0).toFixed(2)}</span></div>
              <div className="flex justify-between border-b pb-1 text-slate-600"><span>Security Deducted:</span><span>৳{billItems.reduce((sum, row) => sum + Number(row.security || 0), 0).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-indigo-700 text-sm"><span>Grand Total / Net Payable:</span><span>৳{billItems.reduce((sum, row) => sum + Number(row.netPayable || 0), 0).toFixed(2)}</span></div>
              <div className="flex justify-between text-rose-600 font-semibold"><span>Due:</span><span>৳{Math.max(billItems.reduce((sum, row) => sum + Number(row.netPayable || 0), 0) - Number(formData.paidAmount || 0), 0).toFixed(2)}</span></div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <PredictiveSearchSelect
                  options={paymentMethodOptions}
                  value={formData.paymentMethod}
                  onChange={(val) => setFormData(prev => ({ ...prev, paymentMethod: val }))}
                  placeholder="Select Method"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Paid Amount (৳)</label>
                <input type="number" min="0" value={formData.paidAmount} onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: Number(e.target.value) }))} className="w-full border rounded-xl px-3 py-2 text-xs bg-white font-semibold" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
             <button type="button" onClick={() => setIsAddOpen(false)} className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition">Cancel</button>
             <button type="button" onClick={handleCreateBill} disabled={loading} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition shadow-sm flex items-center gap-1.5">
               {loading ? <Loader2 className="animate-spin w-3.5 h-3.5"/> : <Save className="w-3.5 h-3.5"/>}
               Save Bill
             </button>
          </div>
        </div>
      )}

      {/* ==================== MODAL: NEW ITEM ==================== */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="flex justify-between items-center bg-slate-50 px-5 py-3 border-b">
              <h3 className="font-bold text-slate-800 text-sm">New Labour Item</h3>
              <button onClick={() => setIsItemModalOpen(false)} className="text-slate-500 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1 text-slate-700">Worker / Team Name</label>
                <PredictiveSearchSelect
                  options={workerOptions.length > 0 ? workerOptions : [{ value: "w1", label: "General Labour Team" }]}
                  value={newItem.workerId}
                  onChange={(val) => {
                    const w = workers.find(row => row.uuid === val);
                    setNewItem(prev => ({ ...prev, workerId: val, workerName: w?.name || "General Labour Team" }));
                  }}
                  placeholder="Select Worker / Team"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1 text-slate-700">Description</label>
                <input value={newItem.description} onChange={(e) => setNewItem(prev => ({...prev, description: e.target.value}))} placeholder="Work description" className="w-full border rounded-xl px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Unit</label>
                <PredictiveSearchSelect
                  options={unitOptions}
                  value={newItem.unit}
                  onChange={(val) => setNewItem(prev => ({ ...prev, unit: val }))}
                  placeholder="Unit"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Qty/Days</label>
                <input type="number" min="0" value={newItem.qtyDays} onChange={(e) => setNewItem(prev => ({...prev, qtyDays: Number(e.target.value)}))} className="w-full border rounded-xl px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Rate</label>
                <input type="number" min="0" value={newItem.rate} onChange={(e) => setNewItem(prev => ({...prev, rate: Number(e.target.value)}))} className="w-full border rounded-xl px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Security</label>
                <input type="number" min="0" value={newItem.security} onChange={(e) => setNewItem(prev => ({...prev, security: Number(e.target.value)}))} className="w-full border rounded-xl px-3 py-2 text-xs" />
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t flex justify-end gap-2">
              <button onClick={() => setIsItemModalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold">Close</button>
              <button onClick={handleAddItem} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold">Add to Table</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
