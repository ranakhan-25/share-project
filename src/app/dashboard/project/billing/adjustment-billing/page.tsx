/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Loader2, Edit3, Trash2, ChevronRight, Search } from "lucide-react";
import toast from "react-hot-toast";
import PredictiveSearchSelect from "@/components/ui/PredictiveSearchSelect";
import { getStoredUser, getStoredAccessToken } from "@/lib/admin-auth/adminAuthStorage";

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

// ====================== TYPES ======================
interface BudgetRow {
  id: string;
  itemName: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  image: string;
  amount: number;
}

interface InvoiceBill {
  id: string;
  uuid: string;
  code: string;
  title: string;
  recordDate: string;
  amount: string | number;
  status: string;
  description: string;
  createdBy?: string;
  project?: { name: string; uuid: string };
  details?: {
    customerId?: string;
    customerName?: string;
    ledger?: string;
    site?: string;
    projectType?: string;
    refWoNo?: string;
    contentBody?: string;
    proposedBudget?: BudgetRow[];
    adjustmentBudget?: BudgetRow[];
    subtotal?: number;
    vatPercent?: number;
    vatAmount?: number;
    aitPercent?: number;
    aitAmount?: number;
    interestRate?: number;
    interestAmount?: number;
    grandTotal?: number;
    paid?: number;
    due?: number;
    attachment?: string;
    createdBy?: string;
  };
}

export default function AdjustmentBillingPage() {
  const [storedUser, setStoredUser] = useState<any>(null);
  useEffect(() => {
    setStoredUser(getStoredUser());
  }, []);
  const userEmail = (storedUser?.email || "").toLowerCase().trim();

  const [dataList, setDataList] = useState<InvoiceBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InvoiceBill | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isItemSubmitting, setIsItemSubmitting] = useState(false);

  // Dropdown Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [projectTypes, setProjectTypes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const ledgers = [
    { uuid: "1", name: "Interest Income" },
    { uuid: "2", name: "Sales" },
    { uuid: "3", name: "Direct Income" },
    { uuid: "4", name: "Adjustment Account" }
  ];

  // Invoice Form Data
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    customerId: "",
    customerName: "",
    ledger: "Sales",
    code: `ADJ${Math.floor(1000 + Math.random() * 9000)}`,
    projectType: "",
    projectId: "",
    site: "",
    refWoNo: "",
    contentBody: "",
    proposedBudget: [] as BudgetRow[],
    adjustmentBudget: [] as BudgetRow[],
    vatPercent: 0,
    aitPercent: 0,
    interestRate: 0,
    paid: 0,
    attachment: "",
  });

  // New Customer Form
  const [newCustomer, setNewCustomer] = useState({ 
    customerCode: `CUS${Date.now().toString().slice(-6)}`, 
    customerName: "", 
    mobileNo: "", 
    businessName: "", 
    address: "" 
  });

  // New Item Form
  const [newItem, setNewItem] = useState({
    itemName: "",
    categoryId: "", 
    subCategoryId: "", 
    brand: "", 
    unit: "",
    purchasePrice: 0,
    salePrice: 0,
    image: "string",
  });

  // ====================== FETCH LISTS ======================
  const fetchAdjustmentBills = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const currentUser = getStoredUser();
      const activeEmail = (currentUser?.email || userEmail || "").toLowerCase().trim();

      const res = await fetch(`${API_PATH}/project-billing/adjustment-billings?limit=100`, { headers });
      const json = await res.json();
      if (json.success) {
        const rows = json.data.data || json.data || [];
        const userProjUuids = new Set(projects.map((p) => p.uuid));
        const filtered = rows
          .filter((item: any) => !item.deletedAt)
          .filter((item: any) => {
            if (!activeEmail) return true;
            const belongsToProj = item.projectId && userProjUuids.has(item.projectId);
            const creator = String(item.createdBy || item.details?.createdBy || "").toLowerCase().trim();
            return belongsToProj || creator === activeEmail;
          });
        setDataList(filtered);
      }
    } catch (err) {
      toast.error("Failed to load adjustment bills");
    } finally {
      setLoading(false);
    }
  };

  // ====================== FETCH DROPDOWNS ======================
  const fetchDropdowns = async () => {
    try {
      const headers = getAuthHeaders();
      const currentUser = getStoredUser();
      const activeEmail = (currentUser?.email || userEmail || "").toLowerCase().trim();
      const activeId = String(currentUser?.id || storedUser?.id || "");

      const resCus = await fetch(`${API_PATH}/customer-account?page=1&limit=100`, { headers });
      const jsonCus = await resCus.json();
      if (jsonCus.success) {
        const cusData = jsonCus.data.data || jsonCus.data || [];
        setCustomers(
          cusData.map((c: any) => ({
            ...c,
            uuid: c.uuid || c.id,
            name: c.name || c.customerName || c.clientName || "Customer",
            customerName: c.customerName || c.name || c.clientName || "Customer",
          }))
        );
      }

      const resProj = await fetch(`${API_PATH}/project?page=1&limit=100`, { headers });
      const jsonProj = await resProj.json();
      if (jsonProj.success) {
        const allProj = jsonProj.data.data || jsonProj.data || [];
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
          : [];
        setProjects(
          userProjects.map((p: any) => ({
            ...p,
            uuid: p.uuid || p.id,
            name: p.name || p.projectName || "Unnamed Project",
          }))
        );
      }

      const resSite = await fetch(`${API_PATH}/project-sites?page=1&limit=100`, { headers });
      const jsonSite = await resSite.json();
      if (jsonSite.success) setSites(jsonSite.data.data || jsonSite.data || []);

      const resType = await fetch(`${API_PATH}/project-type?page=1&limit=100`, { headers });
      const jsonType = await resType.json();
      if (jsonType.success) setProjectTypes(jsonType.data.data || jsonType.data || []);

      const resCat = await fetch(`${API_PATH}/category?page=1&limit=100`, { headers });
      const jsonCat = await resCat.json();
      if (jsonCat.success) setCategories(jsonCat.data.data || jsonCat.data || []);

      const resBrand = await fetch(`${API_PATH}/procurement/brand?page=1&limit=100`, { headers });
      const jsonBrand = await resBrand.json();
      if (jsonBrand.success) setBrands(jsonBrand.data.data || jsonBrand.data || []);
      
    } catch (err) {
      console.error("Error fetching dropdowns:", err);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchAdjustmentBills();
  }, [projects.length, userEmail]);

  // ====================== BUDGET HANDLERS ======================
  const addBudgetRow = (type: "proposed" | "adjustment") => {
    const newRow: BudgetRow = {
      id: Date.now().toString(),
      itemName: "",
      description: "",
      unit: "Nos",
      quantity: 1,
      rate: 0,
      image: "",
      amount: 0,
    };
    if (type === "proposed") {
      setFormData(prev => ({ ...prev, proposedBudget: [...prev.proposedBudget, newRow] }));
    } else {
      setFormData(prev => ({ ...prev, adjustmentBudget: [...prev.adjustmentBudget, newRow] }));
    }
  };

  const updateBudgetRow = (type: "proposed" | "adjustment", id: string, field: keyof BudgetRow, value: any) => {
    setFormData((prev) => {
      const list = type === "proposed" ? [...prev.proposedBudget] : [...prev.adjustmentBudget];
      const index = list.findIndex(r => r.id === id);
      if (index > -1) {
        list[index] = { ...list[index], [field]: value };
        if (field === "quantity" || field === "rate") {
          list[index].amount = Number(list[index].quantity || 0) * Number(list[index].rate || 0);
        }
        return type === "proposed"
          ? { ...prev, proposedBudget: list }
          : { ...prev, adjustmentBudget: list };
      }
      return prev;
    });
  };

  const removeBudgetRow = (type: "proposed" | "adjustment", id: string) => {
    if (type === "proposed") {
      setFormData(prev => ({ ...prev, proposedBudget: prev.proposedBudget.filter(r => r.id !== id) }));
    } else {
      setFormData(prev => ({ ...prev, adjustmentBudget: prev.adjustmentBudget.filter(r => r.id !== id) }));
    }
  };

  // ====================== CALCULATIONS ======================
  const proposedTotal = formData.proposedBudget.reduce((acc, row) => acc + (Number(row.quantity || 0) * Number(row.rate || 0)), 0);
  const adjustmentTotal = formData.adjustmentBudget.reduce((acc, row) => acc + (Number(row.quantity || 0) * Number(row.rate || 0)), 0);
  
  const subtotal = proposedTotal + adjustmentTotal;
  const vatAmount = (subtotal * Number(formData.vatPercent || 0)) / 100;
  const aitAmount = (subtotal * Number(formData.aitPercent || 0)) / 100;
  const interestAmount = (subtotal * Number(formData.interestRate || 0)) / 100;
  const grandTotal = subtotal + vatAmount + aitAmount + interestAmount;
  const due = grandTotal - Number(formData.paid || 0);

  // ====================== SUBMIT INVOICE ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId) {
      toast.error("Please select a project");
      return;
    }
    setSubmitting(true);

    const currentUser = getStoredUser();
    const activeEmail = currentUser?.email || userEmail || "sharetest@realbiz.com";

    const payload = {
      projectId: formData.projectId,
      title: formData.contentBody ? formData.contentBody.substring(0, 50) : `Adjustment Bill ${formData.code}`,
      code: formData.code,
      recordDate: formData.date,
      amount: grandTotal,
      status: "active",
      description: "",
      createdBy: activeEmail,
      details: {
        customerId: formData.customerId,
        customerName: formData.customerName,
        ledger: formData.ledger,
        projectType: formData.projectType,
        site: formData.site,
        refWoNo: formData.refWoNo,
        contentBody: formData.contentBody,
        proposedBudget: formData.proposedBudget,
        adjustmentBudget: formData.adjustmentBudget,
        subtotal,
        vatPercent: formData.vatPercent,
        vatAmount,
        aitPercent: formData.aitPercent,
        aitAmount,
        interestRate: formData.interestRate,
        interestAmount,
        grandTotal,
        paid: formData.paid,
        due,
        attachment: formData.attachment,
        createdBy: activeEmail,
      },
    };

    try {
      const isEdit = !!editingItem;
      const url = isEdit
        ? `${API_PATH}/project-billing/adjustment-billings/${editingItem!.uuid}`
        : `${API_PATH}/project-billing/adjustment-billings`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok || json.success) {
        toast.success(isEdit ? "Updated successfully!" : "Created successfully!");
        setIsModalOpen(false);
        setEditingItem(null);
        fetchAdjustmentBills();
      } else {
        toast.error(json.message || "Failed to save");
      }
    } catch (err: any) {
      toast.error("Network Error");
    } finally {
      setSubmitting(false);
    }
  };

  // ====================== DELETE INVOICE ======================
  const handleDelete = async (item: InvoiceBill) => {
    if (!window.confirm(`Delete "${item.code}"?`)) return;
    try {
      const res = await fetch(`${API_PATH}/project-billing/adjustment-billings/${item.uuid}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        toast.success("Deleted successfully!");
        setDataList((prev) => prev.filter((row) => row.uuid !== item.uuid));
      } else {
        toast.error("Failed to delete");
      }
    } catch (err) {
      toast.error("Error deleting");
    }
  };

  // ====================== CREATE CUSTOMER ======================
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_PATH}/customer-account`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...newCustomer, status: "active" }),
      });
      if (res.ok) {
        toast.success("Customer Created!");
        setIsCustomerModalOpen(false);
        fetchDropdowns();
      } else {
        toast.error("Failed to create customer");
      }
    } catch (err) {
      toast.error("Error creating customer");
    }
  };

  // ====================== CREATE ITEM ======================
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.categoryId || !newItem.brand) {
      toast.error("Please select Category and Brand properly");
      return;
    }

    setIsItemSubmitting(true);
    const payload = {
      ...newItem,
      subCategoryId: newItem.subCategoryId || "855450dc-27ae-477f-9cf5-6ce3323946d8"
    };

    try {
      const res = await fetch(`${API_PATH}/item`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      
      if (res.ok || json.success) {
        toast.success("Item Created!");
        setIsItemModalOpen(false);
        setNewItem({ 
          itemName: "", categoryId: "", subCategoryId: "", brand: "", unit: "", purchasePrice: 0, salePrice: 0, image: "string" 
        });
      } else {
        toast.error(json.message || "Failed to create item");
      }
    } catch (err) {
      toast.error("Error creating item");
    } finally {
      setIsItemSubmitting(false);
    }
  };

  // ====================== OPEN MODALS ======================
  const handleCreate = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      customerId: customers[0]?.uuid || "",
      customerName: customers[0]?.customerName || "",
      ledger: "Sales",
      code: `ADJ${Math.floor(1000 + Math.random() * 9000)}`,
      projectType: projectTypes[0]?.name || "",
      projectId: projects[0]?.uuid || "",
      site: "",
      refWoNo: "",
      contentBody: "",
      proposedBudget: [
        {
          id: Date.now().toString(),
          itemName: "Electrical Wiring Adjustment",
          description: "Extra cable & conduits",
          unit: "Nos",
          quantity: 2,
          rate: 2500,
          image: "",
          amount: 5000,
        }
      ],
      adjustmentBudget: [],
      vatPercent: 0,
      aitPercent: 0,
      interestRate: 0,
      paid: 0,
      attachment: "",
    });
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: InvoiceBill) => {
    setEditingItem(item);
    setFormData({
      date: item.recordDate,
      customerId: item.details?.customerId || "",
      customerName: item.details?.customerName || "",
      ledger: item.details?.ledger || "Sales",
      code: item.code,
      projectType: item.details?.projectType || "",
      projectId: item.project?.uuid || (item as any).projectId || "",
      site: item.details?.site || "",
      refWoNo: item.details?.refWoNo || "",
      contentBody: item.details?.contentBody || "",
      proposedBudget: item.details?.proposedBudget || [],
      adjustmentBudget: item.details?.adjustmentBudget || [],
      vatPercent: item.details?.vatPercent || 0,
      aitPercent: item.details?.aitPercent || 0,
      interestRate: item.details?.interestRate || 0,
      paid: item.details?.paid || 0,
      attachment: item.details?.attachment || "",
    });
    setIsModalOpen(true);
  };

  const filteredData = dataList.filter((item) =>
    item.code?.toLowerCase().includes(search.toLowerCase()) ||
    item.project?.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.details?.customerName?.toLowerCase().includes(search.toLowerCase())
  );

  // Filtering sites based on selected projectId
  const filteredSites = formData.projectId 
    ? sites.filter(s => String(s.projectId).toLowerCase() === String(formData.projectId).toLowerCase()) 
    : sites;

  // Options for PredictiveSearchSelect
  const customerOptions = customers.map(c => ({
    value: c.uuid,
    label: `${c.customerName || c.name || "Customer"}${c.customerCode ? ` (${c.customerCode})` : ""}`,
  }));

  const ledgerOptions = ledgers.map(l => ({
    value: l.name,
    label: l.name,
  }));

  const projectTypeOptions = projectTypes.map(p => ({
    value: p.name,
    label: p.name,
  }));

  const projectOptions = projects.map(p => ({
    value: p.uuid,
    label: p.name,
  }));

  const siteOptions = filteredSites.map(s => ({
    value: s.name,
    label: s.name,
  }));

  const categoryOptions = categories.map(c => ({
    value: c.uuid,
    label: c.name,
  }));

  const brandOptions = brands.map(b => ({
    value: b.name,
    label: b.name,
  }));

  // ====================== RENDER ======================
  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      <div className="mx-auto max-w-[1600px] space-y-5">
        
        {/* Top Header */}
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
                Adjustment Billing
              </span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Adjustment Billing / অ্যাডজাস্টমেন্ট বিলিং
            </h1>
          </div>
          <button 
            onClick={handleCreate} 
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 hover:shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> 
            <span>+ New Adjustment Bill</span>
          </button>
        </div>

        {/* List Table Container */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-700 active:scale-95">
                Excel
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-rose-700 active:scale-95">
                PDF
              </button>
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
                    {["ID", "PROJECT TYPE", "PROJECT", "CUSTOMER NAME", "CODE", "REF", "DATE", "GRAND TOTAL", "ADDED BY", "ACTION"].map(h => (
                      <th key={h} className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700 font-medium">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-16 text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <p className="text-sm font-medium">No adjustment billing records available</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item, idx) => (
                      <tr key={item.uuid || idx} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">{idx + 1}</td>
                        <td className="px-4 py-3">{item.details?.projectType || "-"}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{item.project?.name || "Share Tower 1"}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{item.details?.customerName || "N/A"}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{item.code}</td>
                        <td className="px-4 py-3 text-slate-500">{item.details?.refWoNo || "-"}</td>
                        <td className="px-4 py-3 text-slate-600">{item.recordDate}</td>
                        <td className="px-4 py-3 font-bold text-emerald-600">৳{Number(item.amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-500">{item.createdBy || userEmail}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => handleEdit(item)} 
                              className="rounded-lg bg-teal-50 p-1.5 text-teal-600 transition hover:bg-teal-100 active:scale-95" 
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(item)} 
                              className="rounded-lg bg-rose-50 p-1.5 text-rose-600 transition hover:bg-rose-100 active:scale-95" 
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer / Pagination */}
          <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
            <div>
              Showing {filteredData.length > 0 ? 1 : 0} to {filteredData.length} of {filteredData.length} entries
            </div>
            <div className="flex items-center gap-1">
              <button disabled className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed">
                Previous
              </button>
              <button className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold">
                1
              </button>
              <button disabled className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ====================== ADD/EDIT MODAL ====================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-7xl my-8 shadow-2xl border border-slate-100 overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">{editingItem ? "Edit Adjustment Bill" : "New Adjustment Bill"}</h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setIsItemModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">Item Add</button>
                <button type="button" onClick={() => setIsCustomerModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">Customer Add</button>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 transition"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              
              {/* Row 1 Fields */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm bg-white" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer</label>
                  <PredictiveSearchSelect
                    options={customerOptions}
                    value={formData.customerId}
                    onChange={(val) => {
                      const cus = customers.find(c => c.uuid === val);
                      setFormData(prev => ({ ...prev, customerId: val, customerName: cus?.customerName || cus?.name || "" }));
                    }}
                    placeholder="Select Customer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ledger</label>
                  <PredictiveSearchSelect
                    options={ledgerOptions}
                    value={formData.ledger}
                    onChange={(val) => setFormData(prev => ({ ...prev, ledger: val }))}
                    placeholder="Select Ledger"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bill Code</label>
                  <input type="text" value={formData.code} readOnly className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 font-mono text-slate-600" />
                </div>
              </div>

              {/* Row 2 Fields */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project Type</label>
                  <PredictiveSearchSelect
                    options={projectTypeOptions}
                    value={formData.projectType}
                    onChange={(val) => setFormData(prev => ({ ...prev, projectType: val }))}
                    placeholder="Select Project Type"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project *</label>
                  <PredictiveSearchSelect
                    options={projectOptions}
                    value={formData.projectId}
                    onChange={(val) => setFormData(prev => ({ ...prev, projectId: val, site: "" }))}
                    placeholder="Select Project"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Site</label>
                  <PredictiveSearchSelect
                    options={siteOptions}
                    value={formData.site}
                    onChange={(val) => setFormData(prev => ({ ...prev, site: val }))}
                    placeholder="Select Site"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ref W/O No.</label>
                  <input type="text" value={formData.refWoNo} onChange={(e) => setFormData(prev => ({ ...prev, refWoNo: e.target.value }))} placeholder="PO / Ref No." className="w-full border rounded-xl px-3 py-2 text-sm bg-white" />
                </div>
              </div>

              {/* Content Body */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Content Body / Description</label>
                <textarea 
                  value={formData.contentBody} 
                  onChange={(e) => setFormData(prev => ({ ...prev, contentBody: e.target.value }))} 
                  className="w-full h-20 p-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                  placeholder="Adjustment billing details or notes..."
                />
              </div>

              {/* PROPOSED BUDGET */}
              <div className="mt-4">
                <div className="bg-amber-500 text-white text-center py-1.5 font-bold rounded-t-xl text-xs uppercase tracking-wider">PROPOSED BUDGET</div>
                <div className="border border-slate-200 rounded-b-xl overflow-x-auto bg-white">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 border-b">
                      <tr>
                        {["ITEM NAME", "DESCRIPTION", "UNIT", "QUANTITY", "RATE", "IMAGE", "AMOUNT", "ACTION"].map(h => (
                          <th key={h} className="px-3 py-2 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.proposedBudget.map((row) => (
                        <tr key={row.id}>
                          <td className="px-2 py-1.5"><input type="text" value={row.itemName} onChange={e => updateBudgetRow("proposed", row.id, "itemName", e.target.value)} className="w-full border rounded-lg px-2 py-1 text-xs" /></td>
                          <td className="px-2 py-1.5"><input type="text" value={row.description} onChange={e => updateBudgetRow("proposed", row.id, "description", e.target.value)} className="w-full border rounded-lg px-2 py-1 text-xs" /></td>
                          <td className="px-2 py-1.5"><input type="text" value={row.unit} onChange={e => updateBudgetRow("proposed", row.id, "unit", e.target.value)} className="w-16 border rounded-lg px-2 py-1 text-xs" /></td>
                          <td className="px-2 py-1.5"><input type="number" value={row.quantity} onChange={e => updateBudgetRow("proposed", row.id, "quantity", Number(e.target.value))} className="w-20 border rounded-lg px-2 py-1 text-xs" /></td>
                          <td className="px-2 py-1.5"><input type="number" value={row.rate} onChange={e => updateBudgetRow("proposed", row.id, "rate", Number(e.target.value))} className="w-24 border rounded-lg px-2 py-1 text-xs" /></td>
                          <td className="px-2 py-1.5"><input type="text" value={row.image} onChange={e => updateBudgetRow("proposed", row.id, "image", e.target.value)} className="w-20 border rounded-lg px-2 py-1 text-xs" placeholder="URL" /></td>
                          <td className="px-2 py-1.5 font-bold text-slate-900">৳{Number(row.amount || 0).toFixed(2)}</td>
                          <td className="px-2 py-1.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button type="button" onClick={() => addBudgetRow("proposed")} className="bg-emerald-600 text-white w-6 h-6 rounded-lg text-xs font-bold hover:bg-emerald-700">+</button>
                              <button type="button" onClick={() => removeBudgetRow("proposed", row.id)} className="bg-rose-500 text-white w-6 h-6 rounded-lg text-xs font-bold hover:bg-rose-600">×</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {formData.proposedBudget.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-3 text-slate-400">
                            No proposed budget rows. <button type="button" onClick={() => addBudgetRow("proposed")} className="text-indigo-600 font-semibold underline ml-1">Add row</button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ADJUSTMENT BUDGET */}
              <div className="mt-4">
                <div className="bg-indigo-600 text-white text-center py-1.5 font-bold rounded-t-xl text-xs uppercase tracking-wider">ADJUSTMENT BUDGET</div>
                <div className="border border-slate-200 rounded-b-xl overflow-x-auto bg-white">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 border-b">
                      <tr>
                        {["ITEM NAME", "DESCRIPTION", "UNIT", "QUANTITY", "RATE", "IMAGE", "AMOUNT", "ACTION"].map(h => (
                          <th key={h} className="px-3 py-2 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.adjustmentBudget.map((row) => (
                        <tr key={row.id}>
                          <td className="px-2 py-1.5"><input type="text" value={row.itemName} onChange={e => updateBudgetRow("adjustment", row.id, "itemName", e.target.value)} className="w-full border rounded-lg px-2 py-1 text-xs" /></td>
                          <td className="px-2 py-1.5"><input type="text" value={row.description} onChange={e => updateBudgetRow("adjustment", row.id, "description", e.target.value)} className="w-full border rounded-lg px-2 py-1 text-xs" /></td>
                          <td className="px-2 py-1.5"><input type="text" value={row.unit} onChange={e => updateBudgetRow("adjustment", row.id, "unit", e.target.value)} className="w-16 border rounded-lg px-2 py-1 text-xs" /></td>
                          <td className="px-2 py-1.5"><input type="number" value={row.quantity} onChange={e => updateBudgetRow("adjustment", row.id, "quantity", Number(e.target.value))} className="w-20 border rounded-lg px-2 py-1 text-xs" /></td>
                          <td className="px-2 py-1.5"><input type="number" value={row.rate} onChange={e => updateBudgetRow("adjustment", row.id, "rate", Number(e.target.value))} className="w-24 border rounded-lg px-2 py-1 text-xs" /></td>
                          <td className="px-2 py-1.5"><input type="text" value={row.image} onChange={e => updateBudgetRow("adjustment", row.id, "image", e.target.value)} className="w-20 border rounded-lg px-2 py-1 text-xs" placeholder="URL" /></td>
                          <td className="px-2 py-1.5 font-bold text-slate-900">৳{Number(row.amount || 0).toFixed(2)}</td>
                          <td className="px-2 py-1.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button type="button" onClick={() => addBudgetRow("adjustment")} className="bg-emerald-600 text-white w-6 h-6 rounded-lg text-xs font-bold hover:bg-emerald-700">+</button>
                              <button type="button" onClick={() => removeBudgetRow("adjustment", row.id)} className="bg-rose-500 text-white w-6 h-6 rounded-lg text-xs font-bold hover:bg-rose-600">×</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {formData.adjustmentBudget.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-3 text-slate-400">
                            No adjustment budget rows. <button type="button" onClick={() => addBudgetRow("adjustment")} className="text-indigo-600 font-semibold underline ml-1">Add row</button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CALCULATION FOOTER */}
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">Subtotal</label>
                    <input type="text" value={subtotal.toFixed(2)} readOnly className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-100 font-bold text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">VAT (%)</label>
                    <input type="number" value={formData.vatPercent} onChange={e => setFormData(prev => ({...prev, vatPercent: Number(e.target.value)}))} className="w-full border rounded-lg px-2.5 py-1.5 bg-white" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">VAT Amt</label>
                    <input type="text" value={vatAmount.toFixed(2)} readOnly className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-100 text-slate-700" />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">AIT (%)</label>
                    <input type="number" value={formData.aitPercent} onChange={e => setFormData(prev => ({...prev, aitPercent: Number(e.target.value)}))} className="w-full border rounded-lg px-2.5 py-1.5 bg-white" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">AIT Amt</label>
                    <input type="text" value={aitAmount.toFixed(2)} readOnly className="w-full border rounded-lg px-2.5 py-1.5 bg-slate-100 text-slate-700" />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">Grand Total</label>
                    <input type="text" value={grandTotal.toFixed(2)} readOnly className="w-full border rounded-lg px-2.5 py-1.5 bg-emerald-50 text-emerald-700 font-bold" />
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-2 rounded-xl text-xs font-semibold transition">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5">
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================== ITEM ADD MODAL ====================== */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-slate-900">New Item</h2>
              <button type="button" onClick={() => setIsItemModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleCreateItem} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <PredictiveSearchSelect
                    options={categoryOptions}
                    value={newItem.categoryId}
                    onChange={(val) => setNewItem(prev => ({...prev, categoryId: val}))}
                    placeholder="Select Category"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand *</label>
                  <PredictiveSearchSelect
                    options={brandOptions}
                    value={newItem.brand}
                    onChange={(val) => setNewItem(prev => ({...prev, brand: val}))}
                    placeholder="Select Brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name *</label>
                  <input required type="text" value={newItem.itemName} onChange={(e) => setNewItem(prev => ({...prev, itemName: e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-xs" placeholder="Item Name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit *</label>
                  <input required type="text" value={newItem.unit} onChange={(e) => setNewItem(prev => ({...prev, unit: e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-xs" placeholder="Nos" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Price</label>
                  <input required type="number" value={newItem.purchasePrice} onChange={(e) => setNewItem(prev => ({...prev, purchasePrice: Number(e.target.value)}))} className="w-full border rounded-xl px-3 py-2 text-xs" placeholder="100" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sale Price</label>
                  <input required type="number" value={newItem.salePrice} onChange={(e) => setNewItem(prev => ({...prev, salePrice: Number(e.target.value)}))} className="w-full border rounded-xl px-3 py-2 text-xs" placeholder="150" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold">Close</button>
                <button type="submit" disabled={isItemSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                  {isItemSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================== CUSTOMER ADD MODAL ====================== */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-slate-900">Customer Add</h2>
              <button onClick={() => setIsCustomerModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Code</label>
                  <input type="text" value={newCustomer.customerCode} readOnly className="w-full border rounded-xl px-3 py-2 text-xs bg-slate-50 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Name *</label>
                  <input type="text" value={newCustomer.customerName} onChange={e => setNewCustomer(prev => ({...prev, customerName: e.target.value}))} required className="w-full border rounded-xl px-3 py-2 text-xs" placeholder="Enter Name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
                  <input type="text" value={newCustomer.mobileNo} onChange={e => setNewCustomer(prev => ({...prev, mobileNo: e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-xs" placeholder="Enter Mobile" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Buyer Reference</label>
                  <input type="text" value={newCustomer.businessName} onChange={e => setNewCustomer(prev => ({...prev, businessName: e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-xs" placeholder="Enter Business Name" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                  <input type="text" value={newCustomer.address} onChange={e => setNewCustomer(prev => ({...prev, address: e.target.value}))} className="w-full border rounded-xl px-3 py-2 text-xs" placeholder="Enter Address" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold">Close</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-semibold">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
