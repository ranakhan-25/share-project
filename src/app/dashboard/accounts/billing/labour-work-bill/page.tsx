/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, ArrowLeft, X, Eye, Printer, Mail, Edit, Trash2, Search, Loader2, Save } from "lucide-react";

// ==================== API CONFIG ====================
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PREFIX = "/realbizpro/api/v1";

export default function LabourWorkerBillPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editingBillUuid, setEditingBillUuid] = useState<string | null>(null);

  // Dropdown Data (API theke asbe)
  const [contractors, setContractors] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectTypes, setProjectTypes] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [workNames, setWorkNames] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({ workerId: "", workerName: "", description: "", unit: "Day", qtyDays: 1, rate: 0, security: 0 });

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

  const [billItems, setBillItems] = useState<any[]>([]);

  // ==================== API CALLS ====================
  const fetchOptions = async (endpoint: string) => {
    try {
      const res = await fetch(`${API_BASE}${API_PREFIX}${endpoint}?page=1&limit=100`);
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
    const [cust, proj, types, itms, workerList, workList, siteList, taskList, cats] = await Promise.all([
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
    setContractors(cust);
    setProjects(proj);
    setProjectTypes(types);
    setItems(itms);
    setWorkers(workerList);
    setWorkNames(workList);
    setSites(siteList);
    setTasks(taskList);
    setCategories(cats);
  }, []);

  const loadBills = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // ⚠️ API endpoint ta apnar backend onujayi change korun
      const res = await fetch(`${API_BASE}${API_PREFIX}/project-billing/labour-work-bills?page=1&limit=100`);
      if (!res.ok) throw new Error("Failed to load labour work bills");
      const json = await res.json();
      const rows = json?.data?.data || json?.data || [];
      setBills(rows.map((row: any) => ({ ...row, ...(row.details || {}), uuid: row.uuid, code: row.code, date: row.recordDate, grandTotal: Number(row.amount || 0), projectName: row.project?.name || row.details?.projectName, workerName: row.details?.workerName || row.details?.items?.map((item: any) => item.workerName).filter(Boolean).join(", ") || row.details?.contractorName })));
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

  // ==================== CREATE ====================
  const handleCreateBill = async () => {
    try {
      const project = projects.find((row) => row.uuid === formData.projectId);
      const contractor = contractors.find((row) => row.uuid === formData.contractorId);
      if (!project || !formData.contractorId) throw new Error("Project and Contractor are required.");
      if (!billItems.length) throw new Error("Add at least one labour/worker row.");
      setLoading(true);
      setError(null);
      const total = billItems.reduce((sum, row) => sum + Number(row.netPayable || 0), 0);
      const details = { ...formData, projectName: project.name, contractorName: contractor?.name || "", projectTypeName: projectTypes.find((row) => row.uuid === formData.projectTypeId)?.name || "", workName: workNames.find((row) => row.uuid === formData.titleOfWork)?.name || "", siteName: sites.find((row) => row.uuid === formData.site)?.name || "", items: billItems, grandTotal: total, paidAmount: Number(formData.paidAmount || 0), dueAmount: Math.max(total - Number(formData.paidAmount || 0), 0) };
      const payload = {
        projectId: project.uuid,
        title: details.workName || `Labour Work Bill ${formData.code}`,
        code: formData.code,
        recordDate: formData.date,
        amount: total,
        status: "active",
        description: formData.refWoNo || "",
        details,
      };
      const res = await fetch(`${API_BASE}${API_PREFIX}/project-billing/labour-work-bills${editingBillUuid ? `/${editingBillUuid}` : ""}`, {
        method: editingBillUuid ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.message || "Failed to save labour work bill"); }
      setIsAddOpen(false);
      setEditingBillUuid(null);
      setBillItems([]);
      await loadBills();
    } catch (err: any) {
      setError(err.message || "Failed to save bill");
    } finally {
      setLoading(false);
    }
  };

  // ==================== ADD ITEM LOGIC ====================
  const handleAddItem = () => {
    const worker = workers.find((row) => row.uuid === newItem.workerId);
    const gross = Number(newItem.qtyDays || 0) * Number(newItem.rate || 0);
    setBillItems((rows) => [...rows, { ...newItem, id: String(Date.now()), workerName: worker?.name || newItem.workerName, gross, netPayable: Math.max(gross - Number(newItem.security || 0), 0) }]);
    setNewItem({ workerId: "", workerName: "", description: "", unit: "Day", qtyDays: 1, rate: 0, security: 0 });
    setIsItemModalOpen(false);
  };

  // ==================== ACTION DROPDOWN HANDLERS ====================
  const handleView = (bill: any) => { console.log("View:", bill); setActiveDropdown(null); };
  const handlePrint = (bill: any) => { console.log("Print:", bill); setActiveDropdown(null); window.print(); };
  const handleSendMail = (bill: any) => { console.log("Mail:", bill); setActiveDropdown(null); alert("Mail sent"); };
  const handleEdit = (bill: any) => { setActiveDropdown(null); setEditingBillUuid(bill.uuid); setIsAddOpen(true); setError(null); setFormData((previous) => ({ ...previous, ...(bill.details || bill), date: bill.recordDate || bill.date || previous.date, code: bill.code || previous.code })); setBillItems(Array.isArray(bill.details?.items) ? bill.details.items : Array.isArray(bill.items) ? bill.items : []); };
  const handleDelete = async (bill: any) => {
    if (!confirm("Are you sure?")) return;
    setActiveDropdown(null);
    try { const res = await fetch(`${API_BASE}${API_PREFIX}/project-billing/labour-work-bills/${bill.uuid}`, { method: "DELETE" }); if (!res.ok) throw new Error("Failed to delete bill"); await loadBills(); } catch (err: any) { setError(err.message || "Failed to delete bill"); }
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 font-sans">

      {/* ==================== LIST VIEW ==================== */}
      {!isAddOpen && (
        <div className="max-w-[1600px] mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 mb-1">Home / Labour/Worker / Labour/Worker Bill List</div>
              <h1 className="text-xl font-bold">Labour/Worker Bill List</h1>
            </div>
            <button onClick={() => { setEditingBillUuid(null); setError(null); setBillItems([]); setFormData({ date: new Date().toISOString().slice(0, 10), code: `LW000${Math.floor(10 + Math.random() * 90)}`, contractorId: "", projectId: "", projectTypeId: "", titleOfWork: "", site: "", refWoNo: "", taskId: "", categoryId: "", itemId: "", paymentMethod: "Cash", paidAmount: 0 }); setIsAddOpen(true); }} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm">
              <Plus className="w-4 h-4" /> +New Labour/Worker Bill
            </button>
          </div>

          {loading && <div className="text-center py-10"><Loader2 className="animate-spin inline mr-2"/>Loading...</div>}
          {error && <div className="bg-rose-50 text-rose-600 p-3 rounded-lg">{error}</div>}

          <div className="bg-white border rounded-xl shadow-sm overflow-visible">
            <div className="p-3 bg-slate-50 border-b flex justify-between items-center">
               <div className="flex gap-2">
                 <button className="bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-semibold">Excel</button>
                 <button className="bg-rose-600 text-white px-3 py-1.5 rounded text-xs font-semibold">PDF</button>
               </div>
               <div className="relative w-64">
                 <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                 <input type="text" placeholder="Search..." className="border pl-9 pr-3 py-1.5 rounded-lg text-sm w-full" />
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-indigo-600 text-white uppercase tracking-wider">
                  <tr>
                    <th className="py-2 px-3">ID</th>
                    <th className="py-2 px-3">Project</th>
                    <th className="py-2 px-3">Worker</th>
                    <th className="py-2 px-3">Code</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3 text-right">Grand Total</th>
                    <th className="py-2 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bills.map((bill, index) => (
                    <tr key={bill.uuid || index}>
                      <td className="py-2 px-3">{index + 1}</td>
                      <td className="py-2 px-3">{bill.project?.name || bill.projectName || "-"}</td>
                      <td className="py-2 px-3">{bill.workerName || bill.contractorName || "-"}</td>
                      <td className="py-2 px-3">{bill.code || "-"}</td>
                      <td className="py-2 px-3">{bill.date || "-"}</td>
                      <td className="py-2 px-3 text-right">{Number(bill.grandTotal || 0).toFixed(2)}</td>
                      <td className="py-2 px-3 text-center relative">
                        <button onClick={() => setActiveDropdown(activeDropdown === (bill.uuid || String(index)) ? null : (bill.uuid || String(index)))} className="bg-indigo-600 text-white text-[11px] px-3 py-1.5 rounded inline-flex items-center gap-1">
                          Action <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>

                        {activeDropdown === (bill.uuid || String(index)) && (
                          <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-2 px-1 text-left text-xs">
                            <button onClick={() => handleView(bill)} className="w-full px-3 py-2 text-white bg-[#6c5ce7] hover:bg-[#5f4dd0] rounded-md flex items-center justify-center gap-2 font-semibold mb-1"><Eye className="w-4 h-4" /> View</button>
                            <button onClick={() => handlePrint(bill)} className="w-full px-3 py-2 text-white bg-[#6c5ce7] hover:bg-[#5f4dd0] rounded-md flex items-center justify-center gap-2 font-semibold mb-1"><Printer className="w-4 h-4" /> Print</button>
                            <button onClick={() => handleSendMail(bill)} className="w-full px-3 py-2 text-white bg-[#6c5ce7] hover:bg-[#5f4dd0] rounded-md flex items-center justify-center gap-2 font-semibold mb-1"><Mail className="w-4 h-4" /> Send Mail</button>
                            <button onClick={() => handleEdit(bill)} className="w-full px-3 py-2 text-white bg-[#00d2d3] hover:bg-[#00b8b9] rounded-md flex items-center justify-center gap-2 font-semibold mb-1"><Edit className="w-4 h-4" /> Edit</button>
                            <button onClick={() => handleDelete(bill)} className="w-full px-3 py-2 text-white bg-[#ff6b6b] hover:bg-[#ee5253] rounded-md flex items-center justify-center gap-2 font-semibold"><Trash2 className="w-4 h-4" /> Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {bills.length === 0 && !loading && (
                    <tr><td colSpan={7} className="text-center py-10 text-slate-400">No data available</td></tr>
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
              <button onClick={() => setIsAddOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><ArrowLeft className="w-5 h-5 text-slate-700" /></button>
              <h2 className="text-lg font-bold text-slate-800">Labour/Worker Bill Add</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsItemModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold">Item Add</button>
              <button onClick={() => setIsAddOpen(false)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold">Labour/Worker Bill List</button>
            </div>
          </div>

          {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Date</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Contractor</label>
              <select value={formData.contractorId} onChange={(e) => setFormData({...formData, contractorId: e.target.value})} className="w-full border rounded-lg px-3 py-2">
                <option value="">Select One Option</option>
                {contractors.map(c => <option key={c.uuid} value={c.uuid}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Project</label>
              <select value={formData.projectId} onChange={(e) => setFormData({...formData, projectId: e.target.value})} className="w-full border rounded-lg px-3 py-2">
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.uuid} value={p.uuid}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <label className="font-semibold text-slate-600">Project Type<select value={formData.projectTypeId} onChange={(e) => setFormData({...formData, projectTypeId: e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2 font-normal"><option value="">Select Project Type</option>{projectTypes.map((row) => <option key={row.uuid} value={row.uuid}>{row.name}</option>)}</select></label>
            <label className="font-semibold text-slate-600">Title/Name of Work<select value={formData.titleOfWork} onChange={(e) => setFormData({...formData, titleOfWork: e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2 font-normal"><option value="">Select Work</option>{workNames.filter((row) => !row.projectId || row.projectId === formData.projectId).map((row) => <option key={row.uuid} value={row.uuid}>{row.name}</option>)}</select></label>
            <label className="font-semibold text-slate-600">Site<select value={formData.site} onChange={(e) => setFormData({...formData, site: e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2 font-normal"><option value="">Select Site</option>{sites.filter((row) => !row.projectId || row.projectId === formData.projectId).map((row) => <option key={row.uuid} value={row.uuid}>{row.name}</option>)}</select></label>
            <label className="font-semibold text-slate-600">Ref WO No.<input value={formData.refWoNo} onChange={(e) => setFormData({...formData, refWoNo: e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2 font-normal" /></label>
            <label className="font-semibold text-slate-600">If Task<select value={formData.taskId} onChange={(e) => setFormData({...formData, taskId: e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2 font-normal"><option value="">Select Task</option>{tasks.map((row) => <option key={row.uuid} value={row.uuid}>{row.name}</option>)}</select></label>
            <label className="font-semibold text-slate-600">Category<select value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2 font-normal"><option value="">Select Category</option>{categories.map((row) => <option key={row.uuid} value={row.uuid}>{row.name}</option>)}</select></label>
            <label className="font-semibold text-slate-600">Select Item<select value={formData.itemId} onChange={(e) => setFormData({...formData, itemId: e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2 font-normal"><option value="">Select Item</option>{items.map((row) => <option key={row.uuid} value={row.uuid}>{row.name}</option>)}</select></label>
          </div>

          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  <th className="py-3 px-3">Labour/Worker</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Unit</th>
                  <th className="py-3 px-3">Qty/Days</th>
                  <th className="py-3 px-3 text-right">Rate</th>
                  <th className="py-3 px-3 text-right">Gross</th>
                  <th className="py-3 px-3 text-right">Security</th>
                  <th className="py-3 px-3 text-right">Net Payable</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billItems.map((item, index) => (
                  <tr key={item.id}>
                    <td className="py-2 px-3"><select value={item.workerId || ""} onChange={(e) => { const worker = workers.find((row) => row.uuid === e.target.value); setBillItems((rows) => rows.map((r, i) => i === index ? {...r, workerId: e.target.value, workerName: worker?.name || ""} : r)); }} className="w-full border rounded px-2 py-1"><option value="">Select Worker</option>{workers.map((worker) => <option key={worker.uuid} value={worker.uuid}>{worker.name}</option>)}</select></td>
                    <td className="py-2 px-3"><input value={item.description || ""} onChange={(e) => setBillItems((rows) => rows.map((r, i) => i === index ? {...r, description: e.target.value} : r))} type="text" className="w-full border rounded px-2 py-1" /></td>
                    <td className="py-2 px-3"><select value={item.unit || "Day"} onChange={(e) => setBillItems((rows) => rows.map((r, i) => i === index ? {...r, unit: e.target.value} : r))} className="w-full border rounded px-2 py-1"><option>Day</option><option>Hour</option><option>Shift</option><option>Piece</option></select></td>
                    <td className="py-2 px-3"><input value={item.qtyDays ?? 1} min="0" type="number" onChange={(e) => setBillItems((rows) => rows.map((r, i) => { if (i !== index) return r; const qtyDays = Number(e.target.value); const gross = qtyDays * Number(r.rate || 0); return {...r, qtyDays, gross, netPayable: Math.max(gross - Number(r.security || 0), 0)}; }))} className="w-full border rounded px-2 py-1" /></td>
                    <td className="py-2 px-3 text-right"><input value={item.rate ?? 0} min="0" type="number" onChange={(e) => setBillItems((rows) => rows.map((r, i) => { if (i !== index) return r; const rate = Number(e.target.value); const gross = Number(r.qtyDays || 0) * rate; return {...r, rate, gross, netPayable: Math.max(gross - Number(r.security || 0), 0)}; }))} className="w-full border rounded px-2 py-1" /></td>
                    <td className="py-2 px-3 text-right">{Number(item.gross || 0).toFixed(2)}</td>
                    <td className="py-2 px-3"><input value={item.security ?? 0} min="0" type="number" onChange={(e) => setBillItems((rows) => rows.map((r, i) => { if (i !== index) return r; const security = Number(e.target.value); return {...r, security, netPayable: Math.max(Number(r.gross || 0) - security, 0)}; }))} className="w-full border rounded px-2 py-1" /></td>
                    <td className="py-2 px-3 text-right">{Number(item.netPayable || 0).toFixed(2)}</td>
                    <td className="py-2 px-3 text-center"><button onClick={() => setBillItems((rows) => rows.filter((_, i) => i !== index))} className="text-rose-600"><X className="w-4 h-4"/></button></td>
                  </tr>
                ))}
                {billItems.length === 0 && <tr><td colSpan={9} className="text-center py-6 text-slate-400">No items added yet.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-2 space-y-2">
              <div className="flex justify-between border-b pb-1"><span>Gross Total:</span><span>{billItems.reduce((sum, row) => sum + Number(row.gross || 0), 0).toFixed(2)}</span></div>
              <div className="flex justify-between border-b pb-1"><span>Security:</span><span>{billItems.reduce((sum, row) => sum + Number(row.security || 0), 0).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-indigo-700"><span>Grand Total / Net Payable:</span><span>{billItems.reduce((sum, row) => sum + Number(row.netPayable || 0), 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Due:</span><span>{Math.max(billItems.reduce((sum, row) => sum + Number(row.netPayable || 0), 0) - Number(formData.paidAmount || 0), 0).toFixed(2)}</span></div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border space-y-2">
              <label className="block font-semibold">Payment Method</label>
              <select value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} className="w-full border rounded px-2 py-1"><option>Cash</option><option>Bank</option><option>Cheque</option><option>Mobile Banking</option></select>
              <label className="block font-semibold">Paid Amount</label>
              <input type="number" min="0" value={formData.paidAmount} onChange={(e) => setFormData({...formData, paidAmount: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
          </div>

          <div className="flex justify-center pt-4">
             <button onClick={handleCreateBill} disabled={loading} className="px-8 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm flex items-center gap-2">
               {loading ? <Loader2 className="animate-spin w-4 h-4"/> : <Save className="w-4 h-4"/>}
               Submit
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
              <button onClick={() => setIsItemModalOpen(false)} className="text-slate-500 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2"><label className="block font-semibold mb-1">Worker Name</label><select value={newItem.workerId} onChange={(e) => setNewItem({...newItem, workerId: e.target.value})} className="w-full border rounded px-2 py-1.5"><option value="">Select Worker</option>{workers.map((worker) => <option key={worker.uuid} value={worker.uuid}>{worker.name}</option>)}</select></div>
              <div className="sm:col-span-2"><label className="block font-semibold mb-1">Description</label><input value={newItem.description} onChange={(e) => setNewItem({...newItem, description: e.target.value})} className="w-full border rounded px-2 py-1.5" /></div>
              <div><label className="block font-semibold mb-1">Unit</label><select value={newItem.unit} onChange={(e) => setNewItem({...newItem, unit: e.target.value})} className="w-full border rounded px-2 py-1.5"><option>Day</option><option>Hour</option><option>Shift</option><option>Piece</option></select></div>
              <div><label className="block font-semibold mb-1">Qty/Days</label><input type="number" min="0" value={newItem.qtyDays} onChange={(e) => setNewItem({...newItem, qtyDays: Number(e.target.value)})} className="w-full border rounded px-2 py-1.5" /></div>
              <div><label className="block font-semibold mb-1">Rate</label><input type="number" min="0" value={newItem.rate} onChange={(e) => setNewItem({...newItem, rate: Number(e.target.value)})} className="w-full border rounded px-2 py-1.5" /></div>
              <div><label className="block font-semibold mb-1">Security</label><input type="number" min="0" value={newItem.security} onChange={(e) => setNewItem({...newItem, security: Number(e.target.value)})} className="w-full border rounded px-2 py-1.5" /></div>
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t flex justify-end gap-2">
              <button onClick={() => setIsItemModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs font-semibold">Close</button>
              <button onClick={handleAddItem} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold">Add to Table</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
