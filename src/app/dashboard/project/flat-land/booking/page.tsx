/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Loader2, Edit3, Trash2, ArrowLeft, Search, FileSpreadsheet, FileText, Calendar } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PATH = `${API_BASE}/realbizpro/api/v1`;

// ====================== TYPES ======================
interface Installment {
  id: string;
  date: string;
  type: string;
  amount: number;
}

interface Booking {
  id: string;
  uuid: string;
  code: string;
  date: string;
  projectId: string;
  customerId: string;
  customerName: string;
  flatLandNo: string;
  propertyType: string;
  projectType: string;
  siteName: string;
  salesBy: string;
  collectionOfficer: string;
  attachment: string;
  totalAmount: number;
  paid: number;
  due: number;
  status: string;
  installments: Installment[];
  paymentMethod?: string;
  chequeNo?: string;
  bookingMoney?: number;
  termsAndConditions?: string;
  project?: { name: string; uuid: string };
}

export default function FlatLandShareBookingPage() {
  // Main List State
  const [dataList, setDataList] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // View States (1 = List, 2 = Step 1 Form, 3 = Step 2 Form)
  const [viewMode, setViewMode] = useState<1 | 2 | 3>(1);
  const [, setEditingItem] = useState<Booking | null>(null);

  // Dropdown Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [projectTypes, setProjectTypes] = useState<any[]>([]);
  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [collectionOfficers, setCollectionOfficers] = useState<any[]>([]);

  // Customer Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCustomerSubmitting, setIsCustomerSubmitting] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ 
    customerCode: `CUS${Date.now().toString().slice(-6)}`, 
    customerName: "", 
    mobileNo: "", 
    email: "",
    nidOrPassport: "",
    address: "",
    businessName: "",
    chartOfGroups: "",
    nominees: [{ name: "", nid: "", relation: "", percentage: "" }]
  });

  // Form Data (Step 1 & Step 2)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    bookingNo: `Booking-${Math.floor(10000000 + Math.random() * 90000000)}`,
    projectId: "",
    customerId: "",
    customerName: "",
    flatLandNo: "",
    projectType: "",
    siteName: "",
    salesBy: "",
    collectionOfficer: "",
    attachment: "",
    // Property Info
    rate: 0,
    parkingCost: 0,
    otherCost: 0,
    utilityCharge: 0,
    discount: 0,
    subtotal: 0,
    grandTotal: 0,
    dueAmount: 0,
    // Payment Info
    bookingMoney: 0,
    paymentMethod: "",
    chequeNo: "",
    termsAndConditions: "",
    // Installments
    installments: [] as Installment[],
  });

  // ====================== FETCH INITIAL DATA ======================
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_PATH}/flat-land-offers`);
      const json = await res.json();
      if (json.success) {
        setDataList((json.data.data || []).filter((item: any) => !item.deletedAt));
      }
    } catch (err) {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const resCus = await fetch(`${API_PATH}/customer-account?status=active`);
      const jsonCus = await resCus.json();
      if (jsonCus.success) setCustomers(jsonCus.data.data || jsonCus.data || []);

      const resProj = await fetch(`${API_PATH}/project`);
      const jsonProj = await resProj.json();
      if (jsonProj.success) setProjects(jsonProj.data.data || jsonProj.data || []);

      const resSite = await fetch(`${API_PATH}/project-sites`);
      const jsonSite = await resSite.json();
      if (jsonSite.success) setSites(jsonSite.data.data || jsonSite.data || []);

      const resType = await fetch(`${API_PATH}/project-type`);
      const jsonType = await resType.json();
      if (jsonType.success) setProjectTypes(jsonType.data.data || jsonType.data || []);

      setSalesPersons([{ uuid: "1", name: "Md.Nayon" }, { uuid: "2", name: "Md.Kawsar" }]);
      setCollectionOfficers([
        { uuid: "c1", name: "Ujjal Howlader" },
        { uuid: "c2", name: "Md.Nayon" },
        { uuid: "c3", name: "Md.Yeamin Sarder" },
        { uuid: "c4", name: "Sheikh Moseddek Ahmed" },
        { uuid: "c5", name: "Md.Arizul" }
      ]);
    } catch (err) {
      console.error("Error fetching dropdowns:", err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchDropdowns();
  }, []);

  // ====================== CALCULATIONS (STEP 2) ======================
  useEffect(() => {
    const sub = Number(formData.rate) + Number(formData.parkingCost) + Number(formData.otherCost);
    const grand = sub + Number(formData.utilityCharge) - Number(formData.discount);
    setFormData(prev => ({ ...prev, subtotal: sub, grandTotal: grand, dueAmount: grand - prev.bookingMoney }));
  }, [formData.rate, formData.parkingCost, formData.otherCost, formData.utilityCharge, formData.discount, formData.bookingMoney]);

  // ====================== STEP 1 SAVE & NEXT ======================
  const handleSaveAndNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId || !formData.customerId) {
      toast.error("Project and Customer are required");
      return;
    }
    setViewMode(3);
  };

  // ====================== FINAL SUBMIT (STEP 2) ======================
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      projectId: formData.projectId,
      title: `Booking for ${formData.flatLandNo}`,
      code: formData.bookingNo,
      recordDate: formData.date,
      amount: formData.grandTotal,
      status: "active",
      description: formData.termsAndConditions || "",
      details: {
        customerId: formData.customerId,
        customerName: formData.customerName,
        flatLandNo: formData.flatLandNo,
        projectType: formData.projectType,
        siteName: formData.siteName,
        salesBy: formData.salesBy,
        collectionOfficer: formData.collectionOfficer,
        attachment: formData.attachment,
        rate: formData.rate,
        parkingCost: formData.parkingCost,
        otherCost: formData.otherCost,
        utilityCharge: formData.utilityCharge,
        discount: formData.discount,
        subtotal: formData.subtotal,
        grandTotal: formData.grandTotal,
        dueAmount: formData.dueAmount,
        bookingMoney: formData.bookingMoney,
        paymentMethod: formData.paymentMethod,
        chequeNo: formData.chequeNo,
        installments: formData.installments,
      }
    };

    try {
      const res = await fetch(`${API_PATH}/flat-land-offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("Booking Created Successfully!");
        setViewMode(1);
        setEditingItem(null);
        fetchBookings();
      } else {
        toast.error("Failed to create booking");
      }
    } catch (err) {
      toast.error("Network Error");
    }
  };

  // ====================== INSTALLMENT HANDLERS ======================
  const addInstallment = () => {
    setFormData(prev => ({
      ...prev,
      installments: [...prev.installments, { id: Date.now().toString(), date: "", type: "Installment", amount: 0 }]
    }));
  };

  const updateInstallment = (id: string, field: keyof Installment, value: any) => {
    setFormData(prev => ({
      ...prev,
      installments: prev.installments.map(ins => ins.id === id ? { ...ins, [field]: value } : ins)
    }));
  };

  const removeInstallment = (id: string) => {
    setFormData(prev => ({
      ...prev,
      installments: prev.installments.filter(ins => ins.id !== id)
    }));
  };

  // ====================== CUSTOMER MODAL HANDLERS ======================
  const handleAddNominee = () => {
    setNewCustomer(prev => ({
      ...prev,
      nominees: [...prev.nominees, { name: "", nid: "", relation: "", percentage: "" }]
    }));
  };

  const updateNominee = (index: number, field: string, value: string) => {
    const updated = [...newCustomer.nominees];
    updated[index] = { ...updated[index], [field]: value };
    setNewCustomer(prev => ({ ...prev, nominees: updated }));
  };

  const removeNominee = (index: number) => {
    setNewCustomer(prev => ({ ...prev, nominees: prev.nominees.filter((_, i) => i !== index) }));
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCustomerSubmitting(true);
    try {
      const payload = {
        customerCode: newCustomer.customerCode,
        customerName: newCustomer.customerName,
        mobileNo: newCustomer.mobileNo,
        email: newCustomer.email,
        businessName: newCustomer.businessName,
        nidOrPassport: newCustomer.nidOrPassport,
        address: newCustomer.address,
        underGroup: newCustomer.chartOfGroups,
        status: "active",
        nominees: newCustomer.nominees
      };
      const res = await fetch(`${API_PATH}/customer-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    } finally {
      setIsCustomerSubmitting(false);
    }
  };

  // ====================== RENDER VIEWS ======================
  
  // 1. LIST VIEW
  if (viewMode === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 p-4 sm:p-6 font-sans text-slate-800">
        <div className="mx-auto max-w-7xl space-y-5">
          
          {/* Top Header */}
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span>Home</span>
                <span>/</span>
                <span>Flat/Land/Share</span>
                <span>/</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Booking List
                </span>
              </nav>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Booking List
              </h1>
            </div>
            <button 
              onClick={() => { setViewMode(2); setEditingItem(null); }} 
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-100 transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg active:scale-95"
            >
              <Plus className="w-4 h-4" /> 
              <span>New Booking</span>
            </button>
          </header>

          {/* Filters Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Date</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="1 October, 2026 - 31 October, 2026" 
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                />
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sales By</label>
              <select className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100">
                <option value="">Select value</option>
                {salesPersons.map(s => <option key={s.uuid} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Team</label>
              <select className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100">
                <option value="">Select value</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project</label>
              <select className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100">
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.uuid} value={p.uuid}>{p.name}</option>)}
              </select>
            </div>
          </div>

          {/* Table Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
            {/* Table Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button 
                  type="button" 
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span className="text-xs font-medium">Loading bookings...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white font-bold uppercase tracking-wider">
                    <tr>
                      {["ID", "DATE", "CODE", "PROJECT", "FLAT/PLOT/SHARE NO", "CUSTOMER NAME", "RATE", "PARKING", "UTILITY CHARGE", "GRAND TOTAL", "PAID", "DUE", "SALES BY", "ACTION"].map(h => (
                        <th key={h} className="px-3.5 py-3.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dataList.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="text-center py-12 text-slate-500 text-xs font-medium">
                          No data available in table
                        </td>
                      </tr>
                    ) : (
                      dataList.map((item, index) => (
                        <tr key={item.uuid} className="hover:bg-indigo-50/40 transition-colors">
                          <td className="px-3.5 py-3 text-center font-medium text-slate-500">{index + 1}</td>
                          <td className="px-3.5 py-3 text-slate-600">{item.date}</td>
                          <td className="px-3.5 py-3 font-semibold text-slate-800">{item.code}</td>
                          <td className="px-3.5 py-3 font-medium text-slate-700">{item.project?.name || "N/A"}</td>
                          <td className="px-3.5 py-3 font-semibold text-indigo-600">{item.flatLandNo}</td>
                          <td className="px-3.5 py-3 font-medium text-slate-900">{item.customerName}</td>
                          <td className="px-3.5 py-3 text-slate-700">{item.totalAmount}</td>
                          <td className="px-3.5 py-3 text-slate-700">{item.paid}</td>
                          <td className="px-3.5 py-3 text-slate-700">{item.due}</td>
                          <td className="px-3.5 py-3 font-bold text-slate-900">{item.totalAmount}</td>
                          <td className="px-3.5 py-3 text-emerald-600 font-semibold">{item.paid}</td>
                          <td className="px-3.5 py-3 text-rose-600 font-semibold">{item.due}</td>
                          <td className="px-3.5 py-3 text-slate-600">{item.salesBy}</td>
                          <td className="px-3.5 py-3 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button 
                                className="rounded-lg p-1.5 text-teal-600 hover:bg-teal-50 transition-colors"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
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
          </div>
        </div>
      </div>
    );
  }

  // 2. STEP 1 FORM
  if (viewMode === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 p-4 sm:p-6 font-sans text-slate-800">
        <div className="mx-auto max-w-7xl space-y-5">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span>Home</span>
                <span>/</span>
                <span>Flat/Land/Share</span>
                <span>/</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  New Booking
                </span>
              </nav>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Booking Information
              </h1>
            </div>
            <button 
              onClick={() => setViewMode(1)} 
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Booking List</span>
            </button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <form onSubmit={handleSaveAndNext} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                    <input 
                      type="date" 
                      value={formData.date} 
                      onChange={e => setFormData({ ...formData, date: e.target.value })} 
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Booking No.</label>
                    <input 
                      type="text" 
                      value={formData.bookingNo} 
                      readOnly 
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 text-xs text-slate-600" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Project <span className="text-rose-500">*</span>
                    </label>
                    <select 
                      required 
                      value={formData.projectId} 
                      onChange={e => setFormData({ ...formData, projectId: e.target.value })} 
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">Select Project</option>
                      {projects.map(p => <option key={p.uuid} value={p.uuid}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Customer <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-1.5">
                      <select 
                        required 
                        value={formData.customerId} 
                        onChange={e => {
                          const cus = customers.find(c => c.uuid === e.target.value);
                          setFormData({ ...formData, customerId: e.target.value, customerName: cus?.customerName || "" });
                        }} 
                        className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="">Select One Option</option>
                        {customers.map(c => <option key={c.uuid} value={c.uuid}>{c.customerName}</option>)}
                      </select>
                      <button 
                        type="button" 
                        onClick={() => setIsCustomerModalOpen(true)} 
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-bold"
                        title="Add Customer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Flat/Land/Share No</label>
                    <input 
                      type="text" 
                      value={formData.flatLandNo} 
                      onChange={e => setFormData({ ...formData, flatLandNo: e.target.value })} 
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                      placeholder="Select Flat/Land/Share No" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Project Type</label>
                    <select 
                      value={formData.projectType} 
                      onChange={e => setFormData({ ...formData, projectType: e.target.value })} 
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">Select Project Type</option>
                      {projectTypes.map(p => <option key={p.uuid} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Site</label>
                    <select 
                      value={formData.siteName} 
                      onChange={e => setFormData({ ...formData, siteName: e.target.value })} 
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">Select Site</option>
                      {sites.map(s => <option key={s.uuid} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sales By</label>
                    <select 
                      value={formData.salesBy} 
                      onChange={e => setFormData({ ...formData, salesBy: e.target.value })} 
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">Select Sales Person</option>
                      {salesPersons.map(s => <option key={s.uuid} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Collection Officer</label>
                    <select 
                      value={formData.collectionOfficer} 
                      onChange={e => setFormData({ ...formData, collectionOfficer: e.target.value })} 
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">Select Collection Officer</option>
                      {collectionOfficers.map(s => <option key={s.uuid} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Attachment</label>
                    <input 
                      type="file" 
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" 
                      onChange={e => setFormData({ ...formData, attachment: e.target.files?.[0]?.name || "" })} 
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button 
                    type="submit" 
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-100 transition-all hover:from-indigo-700 hover:to-purple-700"
                  >
                    <span>Save & Next</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right Side Property Details */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm h-fit space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Property Details
              </h3>
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between"><span className="font-medium text-slate-500">Flat No:</span><span className="font-semibold text-slate-800">{formData.flatLandNo || "—"}</span></div>
                <div className="flex justify-between"><span className="font-medium text-slate-500">Flat Size:</span><span className="font-semibold text-slate-800">—</span></div>
                <div className="flex justify-between"><span className="font-medium text-slate-500">Bedroom:</span><span className="font-semibold text-slate-800">—</span></div>
                <div className="flex justify-between"><span className="font-medium text-slate-500">Bathroom:</span><span className="font-semibold text-slate-800">—</span></div>
                <div className="flex justify-between"><span className="font-medium text-slate-500">Drawing:</span><span className="font-semibold text-slate-800">—</span></div>
                <div className="flex justify-between"><span className="font-medium text-slate-500">Dining:</span><span className="font-semibold text-slate-800">—</span></div>
                <div className="flex justify-between"><span className="font-medium text-slate-500">Kitchen:</span><span className="font-semibold text-slate-800">—</span></div>
                <div className="flex justify-between"><span className="font-medium text-slate-500">Balcony:</span><span className="font-semibold text-slate-800">—</span></div>
                <div className="flex justify-between"><span className="font-medium text-slate-500">Parking:</span><span className="font-semibold text-slate-800">—</span></div>
                <div className="flex justify-between"><span className="font-medium text-slate-500">Facing:</span><span className="font-semibold text-slate-800">—</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. STEP 2 FORM (Installments & Payment)
  if (viewMode === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 p-4 sm:p-6 font-sans text-slate-800">
        <div className="mx-auto max-w-7xl space-y-5">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button 
              onClick={() => setViewMode(2)} 
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> 
              <span>Previous</span>
            </button>
            <button 
              onClick={() => setViewMode(1)} 
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm"
            >
              <span>Booking List</span>
            </button>
          </header>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">Booking & Property Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="font-semibold text-slate-500">Customer:</p>
                <p className="font-bold text-slate-900">{formData.customerName || "—"}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-500">Project:</p>
                <p className="font-bold text-slate-900">{projects.find(p => p.uuid === formData.projectId)?.name || "—"}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-500">Flat No:</p>
                <p className="font-bold text-indigo-600">{formData.flatLandNo || "—"}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-500">Site:</p>
                <p className="font-bold text-slate-900">{formData.siteName || "—"}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Installments Table */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Payment Schedule</h3>
                <button 
                  type="button" 
                  onClick={addInstallment} 
                  className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Installment</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2 w-12 text-center">SL</th>
                      <th className="px-3 py-2">DATE</th>
                      <th className="px-3 py-2">TYPE</th>
                      <th className="px-3 py-2">AMOUNT</th>
                      <th className="px-3 py-2 text-center w-16">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formData.installments.map((ins, idx) => (
                      <tr key={ins.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 text-center text-slate-500">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <input 
                            type="date" 
                            value={ins.date} 
                            onChange={e => updateInstallment(ins.id, "date", e.target.value)} 
                            className="h-8 w-full rounded-lg border border-slate-200 px-2 text-xs" 
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select 
                            value={ins.type} 
                            onChange={e => updateInstallment(ins.id, "type", e.target.value)} 
                            className="h-8 w-full rounded-lg border border-slate-200 px-2 text-xs"
                          >
                            <option>DownPayment</option>
                            <option>Installment</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input 
                            type="number" 
                            value={ins.amount} 
                            onChange={e => updateInstallment(ins.id, "amount", Number(e.target.value))} 
                            className="h-8 w-full rounded-lg border border-slate-200 px-2 text-xs" 
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button 
                            type="button" 
                            onClick={() => removeInstallment(ins.id)} 
                            className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                      <td colSpan={3} className="text-right px-3 py-2">Total Amount:</td>
                      <td className="px-3 py-2 text-indigo-600">
                        {formData.installments.reduce((acc, row) => acc + Number(row.amount), 0).toFixed(2)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Pricing & Payment Info */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4 h-fit">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Pricing Breakdown</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Rate:</span>
                  <input type="number" value={formData.rate} onChange={e => setFormData({...formData, rate: Number(e.target.value)})} className="h-8 w-32 rounded-lg border border-slate-200 px-2 text-right" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Parking Cost:</span>
                  <input type="number" value={formData.parkingCost} onChange={e => setFormData({...formData, parkingCost: Number(e.target.value)})} className="h-8 w-32 rounded-lg border border-slate-200 px-2 text-right" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Other Cost:</span>
                  <input type="number" value={formData.otherCost} onChange={e => setFormData({...formData, otherCost: Number(e.target.value)})} className="h-8 w-32 rounded-lg border border-slate-200 px-2 text-right" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Utility Charge:</span>
                  <input type="number" value={formData.utilityCharge} onChange={e => setFormData({...formData, utilityCharge: Number(e.target.value)})} className="h-8 w-32 rounded-lg border border-slate-200 px-2 text-right" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Discount:</span>
                  <input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: Number(e.target.value)})} className="h-8 w-32 rounded-lg border border-slate-200 px-2 text-right" />
                </div>
                <div className="flex justify-between items-center font-bold pt-2 border-t border-slate-100 text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-sm text-indigo-600">{formData.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 pt-2">Payment Details</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Booking Money:</span>
                  <input type="number" value={formData.bookingMoney} onChange={e => setFormData({...formData, bookingMoney: Number(e.target.value)})} className="h-8 w-32 rounded-lg border border-slate-200 px-2 text-right" placeholder="0.00" />
                </div>
                <div className="flex justify-between items-center font-bold text-rose-600">
                  <span>Due Amount:</span>
                  <span>{formData.dueAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={handleFinalSubmit} 
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:from-emerald-700 hover:to-teal-700"
                >
                  <span>Submit Booking</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CUSTOMER MODAL
  return (
    <div>
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-4xl my-8 rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Customer Add</h2>
              <button 
                onClick={() => setIsCustomerModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreateCustomer} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Code <span className="text-rose-500">*</span></label>
                    <input type="text" value={newCustomer.customerCode} readOnly className="h-10 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 text-xs text-slate-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Name <span className="text-rose-500">*</span></label>
                    <input type="text" value={newCustomer.customerName} onChange={e => setNewCustomer({...newCustomer, customerName: e.target.value})} required className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" placeholder="Name" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile <span className="text-rose-500">*</span></label>
                    <input type="text" value={newCustomer.mobileNo} onChange={e => setNewCustomer({...newCustomer, mobileNo: e.target.value})} required className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" placeholder="Mobile" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                    <input type="email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" placeholder="E-mail" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Close</button>
                  <button type="submit" disabled={isCustomerSubmitting} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2 text-xs font-semibold text-white shadow-md">
                    {isCustomerSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Submit</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
