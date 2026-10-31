/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Loader2, Edit3, Trash2, Eye, Printer, ArrowLeft } from "lucide-react";
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
  const [editingItem, setEditingItem] = useState<Booking | null>(null);

  // Dropdown Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [projectTypes, setProjectTypes] = useState<any[]>([]);
  const [salesPersons, setSalesPersons] = useState<any[]>([]); // Assuming API exists or default list
  const [collectionOfficers, setCollectionOfficers] = useState<any[]>([]); // Assuming API exists or default list
  const [flatsOrLands, setFlatsOrLands] = useState<any[]>([]);

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
      // Note: Assuming API endpoint is /flat-land-offers
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

      // Mocking Sales & Collection Officers based on screenshot
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
    setViewMode(3); // Go to Step 2
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
      <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-500">Home &gt; Flat/Land/Share &gt; Booking List</div>
          <button onClick={() => { setViewMode(2); setEditingItem(null); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> New Booking
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 border rounded shadow-sm mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Select Date</label>
            <input type="text" placeholder="1 October, 2026 - 31 October, 2026" className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Sales By</label>
            <select className="w-full border rounded px-3 py-2 text-sm">
              <option>Select value</option>
              {salesPersons.map(s => <option key={s.uuid} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Team</label>
            <select className="w-full border rounded px-3 py-2 text-sm">
              <option>Select value</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Project</label>
            <select className="w-full border rounded px-3 py-2 text-sm">
              <option>Select Project</option>
              {projects.map(p => <option key={p.uuid} value={p.uuid}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white p-4 border rounded shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <button className="bg-green-600 text-white px-3 py-1 rounded text-xs">Excel</button>
              <button className="bg-red-600 text-white px-3 py-1 rounded text-xs">PDF</button>
            </div>
            <div className="flex gap-2 items-center text-sm">
              <span>Search:</span>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded px-2 py-1" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-indigo-600 text-white">
                  <tr>
                    {["ID", "DATE", "CODE", "PROJECT", "FLAT/PLOT/SHARE NO", "CUSTOMER NAME", "RATE", "PARKING", "UTILITY CHARGE", "GRAND TOTAL", "PAID", "DUE", "SALES BY", "ACTION"].map(h => (
                      <th key={h} className="px-3 py-2 font-medium text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dataList.length === 0 ? (
                    <tr><td colSpan={14} className="text-center py-8 text-gray-500">No data available in table</td></tr>
                  ) : (
                    dataList.map((item, index) => (
                      <tr key={item.uuid} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{index + 1}</td>
                        <td className="px-3 py-2">{item.date}</td>
                        <td className="px-3 py-2">{item.code}</td>
                        <td className="px-3 py-2">{item.project?.name || "N/A"}</td>
                        <td className="px-3 py-2 text-indigo-600">{item.flatLandNo}</td>
                        <td className="px-3 py-2 text-indigo-600">{item.customerName}</td>
                        <td className="px-3 py-2">{item.totalAmount}</td>
                        <td className="px-3 py-2">{item.paid}</td>
                        <td className="px-3 py-2">{item.due}</td>
                        <td className="px-3 py-2">{item.salesBy}</td>
                        <td className="px-3 py-2 flex gap-1">
                          <button className="bg-teal-400 text-white p-1.5 rounded hover:bg-teal-500"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
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
    );
  }

  // 2. STEP 1 FORM
  if (viewMode === 2) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-500">Home &gt; Flat/Land/Share &gt; Flat/Land/Share Booking</div>
          <button onClick={() => setViewMode(1)} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm">Flat/Land/Share Booking list</button>
        </div>

        <div className="flex gap-6">
          <div className="flex-1 bg-white p-6 rounded shadow-sm border">
            <form onSubmit={handleSaveAndNext} className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <label className="w-1/3 text-right text-sm">Date</label>
                    <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-2/3 border rounded px-3 py-1.5 text-sm" />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="w-1/3 text-right text-sm">Booking No.</label>
                    <input type="text" value={formData.bookingNo} readOnly className="w-2/3 border rounded px-3 py-1.5 text-sm bg-gray-100" />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="w-1/3 text-right text-sm">Project</label>
                    <select required value={formData.projectId} onChange={e => setFormData({ ...formData, projectId: e.target.value })} className="w-2/3 border rounded px-3 py-1.5 text-sm">
                      <option value="">Select Project</option>
                      {projects.map(p => <option key={p.uuid} value={p.uuid}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="w-1/3 text-right text-sm">Flat/Land/Share No</label>
                    <input type="text" value={formData.flatLandNo} onChange={e => setFormData({ ...formData, flatLandNo: e.target.value })} className="w-2/3 border rounded px-3 py-1.5 text-sm" placeholder="Select Flat/Land/Share No" />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="w-1/3 text-right text-sm">Attachment</label>
                    <input type="file" className="w-2/3 border rounded px-3 py-1 text-sm" onChange={e => setFormData({ ...formData, attachment: e.target.files?.[0]?.name || "" })} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <label className="w-1/3 text-right text-sm">Customer</label>
                    <div className="w-2/3 flex gap-1">
                      <select required value={formData.customerId} onChange={e => {
                        const cus = customers.find(c => c.uuid === e.target.value);
                        setFormData({ ...formData, customerId: e.target.value, customerName: cus?.customerName || "" });
                      }} className="w-full border rounded px-3 py-1.5 text-sm">
                        <option value="">Select One Option</option>
                        {customers.map(c => <option key={c.uuid} value={c.uuid}>{c.customerName}</option>)}
                      </select>
                      <button type="button" onClick={() => setIsCustomerModalOpen(true)} className="bg-indigo-500 text-white px-2 rounded">+</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="w-1/3 text-right text-sm">Project Type</label>
                    <select value={formData.projectType} onChange={e => setFormData({ ...formData, projectType: e.target.value })} className="w-2/3 border rounded px-3 py-1.5 text-sm">
                      <option value="">Select Project Type</option>
                      {projectTypes.map(p => <option key={p.uuid} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="w-1/3 text-right text-sm">Site</label>
                    <select value={formData.siteName} onChange={e => setFormData({ ...formData, siteName: e.target.value })} className="w-2/3 border rounded px-3 py-1.5 text-sm">
                      <option value="">Select Site</option>
                      {sites.map(s => <option key={s.uuid} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="w-1/3 text-right text-sm">Sales By</label>
                    <select value={formData.salesBy} onChange={e => setFormData({ ...formData, salesBy: e.target.value })} className="w-2/3 border rounded px-3 py-1.5 text-sm">
                      <option value="">Select Sales Person</option>
                      {salesPersons.map(s => <option key={s.uuid} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="w-1/3 text-right text-sm">Collection Officer</label>
                    <select value={formData.collectionOfficer} onChange={e => setFormData({ ...formData, collectionOfficer: e.target.value })} className="w-2/3 border rounded px-3 py-1.5 text-sm">
                      <option value="">Collection Officer</option>
                      {collectionOfficers.map(s => <option key={s.uuid} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <button type="submit" className="bg-indigo-600 text-white px-8 py-2 rounded shadow hover:bg-indigo-700">Save & Next</button>
              </div>
            </form>
          </div>

          {/* Right Side Property Details */}
          <div className="w-1/3 bg-white p-6 rounded shadow-sm border h-fit">
            <h3 className="text-lg font-bold mb-4 border-b pb-2">Property Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex"><span className="w-1/2 text-gray-600">Flat No</span><span className="w-1/2 font-semibold">: {formData.flatLandNo || "-"}</span></div>
              <div className="flex"><span className="w-1/2 text-gray-600">Flat Size</span><span className="w-1/2 font-semibold">: -</span></div>
              <div className="flex"><span className="w-1/2 text-gray-600">Bedroom</span><span className="w-1/2 font-semibold">: -</span></div>
              <div className="flex"><span className="w-1/2 text-gray-600">Bathroom</span><span className="w-1/2 font-semibold">: -</span></div>
              <div className="flex"><span className="w-1/2 text-gray-600">Drawing</span><span className="w-1/2 font-semibold">: -</span></div>
              <div className="flex"><span className="w-1/2 text-gray-600">Dining</span><span className="w-1/2 font-semibold">: -</span></div>
              <div className="flex"><span className="w-1/2 text-gray-600">Kitchen</span><span className="w-1/2 font-semibold">: -</span></div>
              <div className="flex"><span className="w-1/2 text-gray-600">Balcony</span><span className="w-1/2 font-semibold">: -</span></div>
              <div className="flex"><span className="w-1/2 text-gray-600">Parking</span><span className="w-1/2 font-semibold">: -</span></div>
              <div className="flex"><span className="w-1/2 text-gray-600">Basement</span><span className="w-1/2 font-semibold">: -</span></div>
              <div className="flex"><span className="w-1/2 text-gray-600">Facing</span><span className="w-1/2 font-semibold">: -</span></div>
              <div className="flex"><span className="w-1/2 text-gray-600">Amenities</span><span className="w-1/2 font-semibold">: -</span></div>
              <div className="flex"><span className="w-1/2 text-gray-600">Unit</span><span className="w-1/2 font-semibold">: -</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. STEP 2 FORM (Installments & Payment)
  if (viewMode === 3) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setViewMode(2)} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm flex items-center gap-1"><ArrowLeft className="w-4 h-4"/> Previous</button>
          <button onClick={() => setViewMode(1)} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm">Flat/Land/Share Booking list</button>
        </div>

        <div className="bg-white p-6 rounded shadow-sm border mb-6">
          <h2 className="text-center text-xl font-bold mb-6">Booking & Property Info</h2>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-bold">Customer:</p><p className="text-gray-600">{formData.customerName}</p>
              <p className="font-bold mt-2">Kitchen:</p><p className="text-gray-600">N/A</p>
              <p className="font-bold mt-2">Drawing:</p><p className="text-gray-600">N/A</p>
            </div>
            <div>
              <p className="font-bold">Project Name:</p><p className="text-gray-600">{projects.find(p => p.uuid === formData.projectId)?.name}</p>
              <p className="font-bold mt-2">Balcony:</p><p className="text-gray-600">N/A</p>
              <p className="font-bold mt-2">Dining:</p><p className="text-gray-600">N/A</p>
            </div>
            <div>
              <p className="font-bold">Flat No:</p><p className="text-gray-600">{formData.flatLandNo}</p>
              <p className="font-bold mt-2">Parking:</p><p className="text-gray-600">N/A</p>
            </div>
            <div>
              <p className="font-bold">Flat Size:</p><p className="text-gray-600">2100 sq.ft</p>
              <p className="font-bold mt-2">Basement:</p><p className="text-gray-600">N/A</p>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Left Column: Installments */}
          <div className="flex-1 bg-white p-4 rounded shadow-sm border">
            <div className="flex gap-4 items-center mb-4">
              <label className="text-sm">Payment Schedule</label>
              <input type="number" defaultValue={3} className="border rounded px-2 py-1 w-20 text-sm" />
              <button className="bg-indigo-600 text-white px-2 py-1 rounded">+</button>
              <div className="flex items-center gap-1 ml-4"><input type="checkbox" /> <span className="text-sm">Manual</span></div>
            </div>
            <div className="flex gap-4 items-center mb-6">
              <label className="text-sm">Start Date</label>
              <input type="date" className="border rounded px-2 py-1 text-sm" />
              <span className="text-sm ml-4">Set Installment Schedule</span>
              <input type="text" value="Monthly" readOnly className="border rounded px-2 py-1 w-32 text-sm bg-gray-50" />
            </div>

            <table className="w-full text-sm text-left border">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  <th className="px-2 py-1">SL</th>
                  <th className="px-2 py-1">DATE</th>
                  <th className="px-2 py-1">TYPE</th>
                  <th className="px-2 py-1">AMOUNT</th>
                  <th className="px-2 py-1 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {formData.installments.map((ins, idx) => (
                  <tr key={ins.id} className="border-b">
                    <td className="px-2 py-1">{idx + 1}</td>
                    <td className="px-2 py-1"><input type="date" value={ins.date} onChange={e => updateInstallment(ins.id, "date", e.target.value)} className="border rounded px-2 py-1 w-full" /></td>
                    <td className="px-2 py-1">
                      <select value={ins.type} onChange={e => updateInstallment(ins.id, "type", e.target.value)} className="border rounded px-2 py-1 w-full">
                        <option>DownPayment</option>
                        <option>Installment</option>
                      </select>
                    </td>
                    <td className="px-2 py-1"><input type="number" value={ins.amount} onChange={e => updateInstallment(ins.id, "amount", Number(e.target.value))} className="border rounded px-2 py-1 w-full" /></td>
                    <td className="px-2 py-1 text-center"><button onClick={() => removeInstallment(ins.id)} className="bg-red-500 text-white p-1 rounded"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="text-right px-2 py-1 font-bold">Total</td>
                  <td className="px-2 py-1 font-bold">
                    {formData.installments.reduce((acc, row) => acc + Number(row.amount), 0).toFixed(2)}
                  </td>
                  <td className="text-center p-1"><button onClick={addInstallment} className="bg-indigo-600 text-white p-1 rounded"><Plus className="w-4 h-4" /></button></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Right Column: Payment Info */}
          <div className="w-1/3 bg-white p-4 rounded shadow-sm border">
            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between items-center"><span>Rate</span><input type="number" value={formData.rate} onChange={e => setFormData({...formData, rate: Number(e.target.value)})} className="border rounded px-2 py-1 w-1/2 text-right" /></div>
              <div className="flex justify-between items-center"><span>Parking</span><input type="number" value={formData.parkingCost} onChange={e => setFormData({...formData, parkingCost: Number(e.target.value)})} className="border rounded px-2 py-1 w-1/2 text-right" /></div>
              <div className="flex justify-between items-center"><span>Other Cost</span><input type="number" value={formData.otherCost} onChange={e => setFormData({...formData, otherCost: Number(e.target.value)})} className="border rounded px-2 py-1 w-1/2 text-right" /></div>
              <div className="flex justify-between items-center"><span>Subtotal</span><input type="number" value={formData.subtotal} readOnly className="border rounded px-2 py-1 w-1/2 text-right bg-gray-50" /></div>
              <div className="flex justify-between items-center"><span>Utility Charge</span><input type="number" value={formData.utilityCharge} onChange={e => setFormData({...formData, utilityCharge: Number(e.target.value)})} className="border rounded px-2 py-1 w-1/2 text-right" /></div>
              <div className="flex justify-between items-center"><span>Discount</span><input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: Number(e.target.value)})} className="border rounded px-2 py-1 w-1/2 text-right" /></div>
              <div className="flex justify-between items-center font-bold"><span>Grand Total</span><input type="number" value={formData.grandTotal} readOnly className="border rounded px-2 py-1 w-1/2 text-right bg-gray-50" /></div>
              <div className="flex justify-between items-center"><span>Due Amount</span><input type="number" value={formData.dueAmount} readOnly className="border rounded px-2 py-1 w-1/2 text-right bg-gray-50" /></div>
            </div>

            <h3 className="font-bold text-center border-b pb-2 mb-3">Payment Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center"><span>Booking Money</span><input type="number" value={formData.bookingMoney} onChange={e => setFormData({...formData, bookingMoney: Number(e.target.value)})} className="border rounded px-2 py-1 w-1/2 text-right" placeholder="0.00" /></div>
              <div className="flex flex-col"><label className="mb-1">Payment Method <span className="text-red-500">*</span></label><select className="border rounded px-2 py-1 w-full"><option>Select Payment Method</option></select></div>
              <div className="flex flex-col"><label className="mb-1">Cheque/Receipt No</label><input type="text" className="border rounded px-2 py-1 w-full" /></div>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="bg-white p-4 rounded shadow-sm border mt-6">
          <h3 className="font-bold mb-2">Terms & Conditions</h3>
          <div className="border rounded bg-white">
            <div className="p-2 border-b flex gap-3 text-sm text-gray-700 bg-gray-50"><span>File</span><span>Edit</span><span>View</span><span>Insert</span><span>Format</span><span>Tools</span><span>Table</span></div>
            <textarea value={formData.termsAndConditions} onChange={e => setFormData({...formData, termsAndConditions: e.target.value})} className="w-full h-32 p-3 text-sm focus:outline-none resize-none" placeholder="Terms & Conditions..."></textarea>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <button onClick={handleFinalSubmit} className="bg-green-500 text-white px-8 py-2 rounded shadow hover:bg-green-600">Submit</button>
        </div>
      </div>
    );
  }

  // CUSTOMER MODAL
  return (
    <div>
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h2 className="text-lg font-bold">Customer Add</h2>
              <button onClick={() => setIsCustomerModalOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <form onSubmit={handleCreateCustomer} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Code <span className="text-red-500">*</span></label>
                    <input type="text" value={newCustomer.customerCode} readOnly className="w-full border rounded px-3 py-1.5 text-sm bg-gray-100" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Name <span className="text-red-500">*</span></label>
                    <input type="text" value={newCustomer.customerName} onChange={e => setNewCustomer({...newCustomer, customerName: e.target.value})} required className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Name" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Mobile <span className="text-red-500">*</span></label>
                    <input type="text" value={newCustomer.mobileNo} onChange={e => setNewCustomer({...newCustomer, mobileNo: e.target.value})} required className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Mobile" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">E-mail</label>
                    <input type="email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="E-mail" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">NID</label>
                    <input type="text" value={newCustomer.nidOrPassport} onChange={e => setNewCustomer({...newCustomer, nidOrPassport: e.target.value})} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="NID" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Address</label>
                    <input type="text" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Address" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Buyer Reference</label>
                    <input type="text" className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Buyer Reference" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Credit Limit</label>
                    <input type="text" className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Credit Limit" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Due Date</label>
                    <input type="date" className="w-full border rounded px-3 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Opening Balance</label>
                    <input type="text" className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Opening Balance" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Image</label>
                    <input type="file" className="w-full border rounded px-3 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Chart Of Groups*</label>
                    <input type="text" value={newCustomer.chartOfGroups} onChange={e => setNewCustomer({...newCustomer, chartOfGroups: e.target.value})} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Select One Option" />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <input type="checkbox" />
                  <label className="text-sm">Create User</label>
                </div>

                {/* Nominee Details */}
                <div className="mt-6">
                  <div className="bg-indigo-500 text-white px-3 py-1 font-bold rounded-t">Nominee Details</div>
                  <div className="border border-t-0 p-3 rounded-b bg-gray-50">
                    {newCustomer.nominees.map((nom, idx) => (
                      <div key={idx} className="grid grid-cols-5 gap-2 mb-2 items-end">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Nominee Name</label>
                          <input type="text" value={nom.name} onChange={e => updateNominee(idx, "name", e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Nominee Name" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Nominee NID</label>
                          <input type="text" value={nom.nid} onChange={e => updateNominee(idx, "nid", e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Nominee NID" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Relation</label>
                          <input type="text" value={nom.relation} onChange={e => updateNominee(idx, "relation", e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Relation" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Percentage</label>
                          <input type="text" value={nom.percentage} onChange={e => updateNominee(idx, "percentage", e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Percentage" />
                        </div>
                        <button type="button" onClick={() => removeNominee(idx)} className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600 h-[32px] flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <button type="button" onClick={handleAddNominee} className="bg-indigo-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1 mt-2"><Plus className="w-4 h-4"/> Add Nominee</button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
                  <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="bg-gray-400 text-white px-6 py-2 rounded text-sm">Close</button>
                  <button type="submit" disabled={isCustomerSubmitting} className="bg-indigo-600 text-white px-6 py-2 rounded text-sm flex items-center gap-2">
                    {isCustomerSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit
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