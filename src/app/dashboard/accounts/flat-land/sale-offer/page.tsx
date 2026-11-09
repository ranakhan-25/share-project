/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Loader2, Save, Plus, Edit3, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PATH = `${API_BASE}/realbizpro/api/v1`;

export default function SaleOfferPage() {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<any>(null);

  // ====================== LIST STATE ======================
  const [dataList, setDataList] = useState<any[]>([]);

  // ✅ ফিল্টার স্টেট
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    salesBy: "",
    team: "",
    project: "",
  });

  // ====================== DROPDOWN STATE ======================
  const [projects, setProjects] = useState<any[]>([]);
  const [projectTypes, setProjectTypes] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [salesUsers, setSalesUsers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  // ====================== FORM STATE ======================
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    code: `SaleOffer-${Math.floor(100000 + Math.random() * 900000)}`,
    projectId: "",
    projectType: "",
    site: "",
    flatLandId: "",
    customerName: "",
    salesBy: "",
    rate: 0,
    otherCost: 0,
    parking: 0,
    utilityCharge: 0,
    discount: 0,
    paid: 0,
  });

  // ====================== FETCH ALL DATA ======================
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const headers = { Authorization: `Bearer ${token}` };

      // ১. লিস্ট ডাটা (সব ডাটা একবারে নিয়ে আসছি, ক্লায়েন্ট সাইডে ফিল্টার করব)
      const resOffers = await fetch(`${API_PATH}/flat-land-offers?page=1&limit=100`, { headers });
      const jsonOffers = await resOffers.json();
      if (jsonOffers.success) {
        setDataList((jsonOffers.data.data || []).filter((item: any) => !item.deletedAt));
      }

      // ২. প্রজেক্ট
      const resProj = await fetch(`${API_PATH}/project`, { headers });
      const jsonProj = await resProj.json();
      if (jsonProj.success) setProjects(jsonProj.data?.data || jsonProj.data || []);

      // ৩. প্রজেক্ট টাইপ
      const resType = await fetch(`${API_PATH}/project-type`, { headers });
      const jsonType = await resType.json();
      if (jsonType.success) setProjectTypes(jsonType.data?.data || jsonType.data || []);

      // ৪. সাইট
      const resSite = await fetch(`${API_PATH}/project-sites`, { headers });
      const jsonSite = await resSite.json();
      if (jsonSite.success) setSites(jsonSite.data?.data || jsonSite.data || []);

      // ৫. ফ্ল্যাট লিস্ট
      const resFlat = await fetch(`${API_PATH}/flat-land/flats?page=1&limit=100`, { headers });
      const jsonFlat = await resFlat.json();
      if (jsonFlat.success) {
        const flatData = jsonFlat.data?.data || jsonFlat.data || [];
        setFlats(Array.isArray(flatData) ? flatData : []);
      }

      // ৬. সেলস পারসন
      const resUsers = await fetch(`${API_PATH}/crm/configuration/teams/dropdown/users`, { headers });
      const jsonUsers = await resUsers.json();
      if (jsonUsers.success) {
        const userData = jsonUsers.data?.users || jsonUsers.data?.data || jsonUsers.data || [];
        setSalesUsers(Array.isArray(userData) ? userData : []);
      }

      // ৭. কাস্টমার
      const resCust = await fetch(`${API_PATH}/customer-account?page=1&limit=100`, { headers });
      const jsonCust = await resCust.json();
      if (jsonCust.success) {
        const custData = jsonCust.data?.data || jsonCust.data || [];
        setCustomers(Array.isArray(custData) ? custData : []);
      }

      // ৮. টিম
      const resTeams = await fetch(`${API_PATH}/crm/configuration/teams/dropdown`, { headers });
      const jsonTeams = await resTeams.json();
      if (jsonTeams.success) setTeams(jsonTeams.data || []);

    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ====================== SUBMIT (POST / PUT) ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const subtotal = Number(form.rate) + Number(form.parking) + Number(form.utilityCharge) + Number(form.otherCost);
    const grandTotal = subtotal - Number(form.discount);
    const due = grandTotal - Number(form.paid);

    const payload = {
      projectId: form.projectId || null,
      flatLandId: form.flatLandId,
      code: form.code,
      offerDate: form.date,
      customerName: form.customerName,
      salesBy: form.salesBy,
      rate: Number(form.rate),
      otherCost: Number(form.otherCost),
      parking: Number(form.parking),
      utilityCharge: Number(form.utilityCharge),
      discount: Number(form.discount),
      subtotal: subtotal,
      grandTotal: grandTotal,
      paid: Number(form.paid),
      due: due,
      approvalStatus: "Pending",
    };

    try {
      const token = localStorage.getItem("accessToken");
      const isEdit = !!editingItem;
      const url = isEdit 
        ? `${API_PATH}/flat-land-offers/${editingItem.uuid}` 
        : `${API_PATH}/flat-land-offers`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok || json.success) {
        toast.success(isEdit ? "Sale offer updated successfully!" : "Sale offer created successfully!");
        setShowForm(false);
        setEditingItem(null);
        fetchData(); 
        // ফর্ম রিসেট
        setForm({
          ...form,
          code: `SaleOffer-${Math.floor(100000 + Math.random() * 900000)}`,
          projectId: "",
          flatLandId: "",
          customerName: "",
          salesBy: "",
          rate: 0,
          otherCost: 0,
          parking: 0,
          utilityCharge: 0,
          discount: 0,
          paid: 0,
        });
      } else {
        toast.error(json.message || "Failed to save offer");
      }
    } catch (err: any) {
      toast.error("Network Error");
    } finally {
      setSubmitting(false);
    }
  };

  // ====================== DELETE ======================
  const handleDelete = async (uuid: string) => {
    if (!window.confirm("Are you sure you want to delete this sale offer?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_PATH}/flat-land-offers/${uuid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (res.ok || json.success) {
        toast.success("Deleted successfully!");
        setDataList((prev) => prev.filter((item) => item.uuid !== uuid));
      } else {
        toast.error(json.message || "Failed to delete");
      }
    } catch (err) {
      toast.error("Network Error");
    }
  };

  // ====================== OPEN EDIT ======================
  const handleEdit = (item: any) => {
    setEditingItem(item);
    setForm({
      date: item.offerDate,
      code: item.code,
      projectId: item.projectId || "",
      projectType: item.project?.projectType || "",
      site: item.project?.sites?.[0]?.uuid || "",
      flatLandId: item.flatLandId || "",
      customerName: item.customerName || "",
      salesBy: item.salesBy || "",
      rate: Number(item.rate) || 0,
      otherCost: Number(item.otherCost) || 0,
      parking: Number(item.parking) || 0,
      utilityCharge: Number(item.utilityCharge) || 0,
      discount: Number(item.discount) || 0,
      paid: Number(item.paid) || 0,
    });
    setShowForm(true);
  };

  // ====================== CLIENT-SIDE FILTERING ======================
  const filteredData = useMemo(() => {
    return dataList.filter((item) => {
      // ১. সার্চ ফিল্টার (Customer Name বা Code)
      const matchesSearch =
        !search ||
        item.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        item.code?.toLowerCase().includes(search.toLowerCase());

      // ২. Sales By ফিল্টার
      const matchesSalesBy = !filters.salesBy || item.salesBy === filters.salesBy;

      // ৩. Project ফিল্টার
      const matchesProject = !filters.project || item.projectId === filters.project;

      // ৪. Date Range ফিল্টার (offerDate এর সাথে তুলনা)
      let matchesDate = true;
      if (filters.startDate || filters.endDate) {
        const itemDate = new Date(item.offerDate).getTime();
        if (filters.startDate) {
          const startDate = new Date(filters.startDate).getTime();
          if (itemDate < startDate) matchesDate = false;
        }
        if (filters.endDate) {
          const endDate = new Date(filters.endDate).getTime();
          if (itemDate > endDate) matchesDate = false;
        }
      }

      // ৫. Team ফিল্টার (যদি API-তে team ফিল্ড থাকে, তবে এখানে সেটি চেক করবেন)
      // এখানে আপাতত বাদ রাখা হলো, কারণ item-এ team ফিল্ড নেই

      return matchesSearch && matchesSalesBy && matchesProject && matchesDate;
    });
  }, [dataList, search, filters]);

  // ====================== RENDER ======================
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  // ====================== FORM VIEW ======================
  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-500">
            {editingItem ? "Edit Sale Offer" : "Flat/Land/Share > Sale Offer"}
          </div>
          <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm">
            Flat/Land/Share Sale Offer List
          </button>
        </div>

        <div className="bg-white border rounded shadow-sm p-6 max-w-4xl">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Offer No.</label>
                  <input type="text" value={form.code} readOnly className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Project</label>
                  <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="">Select Project</option>
                    {projects.map(p => <option key={p.uuid} value={p.uuid}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Flat/Land/Share No</label>
                  <select value={form.flatLandId} onChange={(e) => setForm({ ...form, flatLandId: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="">Select Flat/Land/Share No</option>
                    {flats.map(f => (
                      <option key={f.uuid} value={f.uuid}>{f.flatLandNo}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Attachment</label>
                  <input type="file" className="w-full border rounded px-3 py-1.5 text-sm" />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Customer</label>
                  <select value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="">Select One Option</option>
                    {customers.map(c => <option key={c.uuid} value={c.customerName}>{c.customerName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Project Type</label>
                  <select value={form.projectType} onChange={(e) => setForm({ ...form, projectType: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="">Select Project Type</option>
                    {projectTypes.map(p => <option key={p.uuid} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Site</label>
                  <select value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="">Select Site</option>
                    {sites.map(s => <option key={s.uuid} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Sales By</label>
                  <select value={form.salesBy} onChange={(e) => setForm({ ...form, salesBy: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="">Select Sales Person</option>
                    {salesUsers.map(u => <option key={u.uuid} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Collection Officer</label>
                  <input type="text" placeholder="Collection Officer" className="w-full border rounded px-3 py-2 text-sm" />
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {editingItem ? "Update" : "Save & Next"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ====================== LIST VIEW ======================
  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">Home &gt; Flat/Land &gt; Flat/Land Sale Offer List</div>
        <button onClick={() => { setEditingItem(null); setShowForm(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm flex items-center gap-1">
          <Plus className="w-4 h-4" /> New Sale Offer
        </button>
      </div>

      {/* ✅ Filters with Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white p-4 border rounded mb-4 shadow-sm">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Select Start Date</label>
          <input 
            type="date" 
            value={filters.startDate} 
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} 
            className="w-full border rounded px-3 py-2 text-sm" 
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Select End Date</label>
          <input 
            type="date" 
            value={filters.endDate} 
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} 
            className="w-full border rounded px-3 py-2 text-sm" 
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Sales By</label>
          <select 
            value={filters.salesBy} 
            onChange={(e) => setFilters({ ...filters, salesBy: e.target.value })} 
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="">Select value</option>
            {salesUsers.map(u => <option key={u.uuid} value={u.name}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Team</label>
          <select 
            value={filters.team} 
            onChange={(e) => setFilters({ ...filters, team: e.target.value })} 
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="">Select value</option>
            {teams.map(t => <option key={t.uuid} value={t.name}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Project</label>
          <select 
            value={filters.project} 
            onChange={(e) => setFilters({ ...filters, project: e.target.value })} 
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="">Select Project</option>
            {projects.map(p => <option key={p.uuid} value={p.uuid}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded shadow-sm">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2 text-sm">
            <span>Show</span>
            <select className="border rounded px-2 py-1"><option>10</option><option>50</option></select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>Search:</span>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded px-2 py-1" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-indigo-600 text-white">
              <tr>
                {["ID", "DATE", "CODE", "PROJECT", "FLAT/PLOT NO", "CUSTOMER NAME", "RATE", "OTHER COST", "PARKING", "UTILITY CHARGE", "DISCOUNT", "SUBTOTAL", "GRAND TOTAL", "PAID", "DUE", "SALES BY", "ATTACHMENT", "APPROVE", "ACTION"].map(h => (
                  <th key={h} className="px-3 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr><td colSpan={19} className="text-center py-8 text-gray-500">No data available in table</td></tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={item.uuid} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{idx + 1}</td>
                    <td className="px-3 py-2">{item.offerDate}</td>
                    <td className="px-3 py-2 text-indigo-600 font-medium">{item.code}</td>
                    <td className="px-3 py-2">{item.project?.name || "-"}</td>
                    <td className="px-3 py-2">{item.flatLand?.flatLandNo || "-"}</td>
                    <td className="px-3 py-2">{item.customerName || "-"}</td>
                    <td className="px-3 py-2">{item.rate}</td>
                    <td className="px-3 py-2">{item.otherCost}</td>
                    <td className="px-3 py-2">{item.parking}</td>
                    <td className="px-3 py-2">{item.utilityCharge}</td>
                    <td className="px-3 py-2">{item.discount}</td>
                    <td className="px-3 py-2">{item.subtotal}</td>
                    <td className="px-3 py-2 font-bold">{item.grandTotal}</td>
                    <td className="px-3 py-2">{item.paid}</td>
                    <td className="px-3 py-2">{item.due}</td>
                    <td className="px-3 py-2">{item.salesBy || "-"}</td>
                    <td className="px-3 py-2">-</td>
                    <td className="px-3 py-2">{item.approvalStatus || "-"}</td>
                    <td className="px-3 py-2 flex gap-1">
                      <button onClick={() => handleEdit(item)} className="bg-teal-500 text-white p-1.5 rounded hover:bg-teal-600"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(item.uuid)} className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}