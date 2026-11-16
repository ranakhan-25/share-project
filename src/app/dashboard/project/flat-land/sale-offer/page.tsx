/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Loader2,
  Save,
  Plus,
  Edit3,
  Trash2,
  X,
  FileSpreadsheet,
  Building2,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import { getStoredAccessToken, getStoredUser } from "@/lib/admin-auth/adminAuthStorage";
import PredictiveSearchSelect from "@/components/ui/PredictiveSearchSelect";
import PredictiveSearchInput from "@/components/ui/PredictiveSearchInput";

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

  // Filters
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    salesBy: "",
    team: "",
    project: "",
  });

  // Dropdown States
  const [projects, setProjects] = useState<any[]>([]);
  const [projectTypes, setProjectTypes] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [salesUsers, setSalesUsers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  // Form State
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

  // Current logged in user
  const [storedUser, setStoredUser] = useState<any>(null);

  useEffect(() => {
    setStoredUser(getStoredUser());
  }, []);

  const userEmail = (storedUser?.email || "").toLowerCase().trim();

  // ====================== FETCH ALL DATA ======================
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = getStoredAccessToken();
      const currentUser = getStoredUser();
      const email = (currentUser?.email || userEmail || "").toLowerCase().trim();
      let userProjects: any[] = [];
      const headers: Record<string, string> = {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const [resOffers, resProj, resType, resSite, resFlat, resUsers, resCust, resTeams, resParties] =
        await Promise.all([
          fetch(`${API_PATH}/flat-land-offers?page=1&limit=100`, { headers }).then((r) => r.json()).catch(() => ({})),
          fetch(`${API_PATH}/project?page=1&limit=100`, { headers }).then((r) => r.json()).catch(() => ({})),
          fetch(`${API_PATH}/project-type?page=1&limit=100`, { headers }).then((r) => r.json()).catch(() => ({})),
          fetch(`${API_PATH}/project-sites?page=1&limit=100`, { headers }).then((r) => r.json()).catch(() => ({})),
          fetch(`${API_PATH}/flat-land/flats?page=1&limit=100`, { headers }).then((r) => r.json()).catch(() => ({})),
          fetch(`${API_PATH}/crm/configuration/teams/dropdown/users`, { headers }).then((r) => r.json()).catch(() => ({})),
          fetch(`${API_PATH}/customer-account?page=1&limit=100`, { headers }).then((r) => r.json()).catch(() => ({})),
          fetch(`${API_PATH}/crm/configuration/teams/dropdown`, { headers }).then((r) => r.json()).catch(() => ({})),
          fetch(`${API_PATH}/project-parties?page=1&limit=100`, { headers }).then((r) => r.json()).catch(() => ({})),
        ]);

      if (resOffers?.success || resOffers?.data) {
        const rawOffers = Array.isArray(resOffers.data?.data)
          ? resOffers.data.data
          : Array.isArray(resOffers.data)
          ? resOffers.data
          : [];

        const validOffers = rawOffers.filter((item: any) => !item.deletedAt);

        // Strict isolation by logged-in user email
        const userScoped = email ? validOffers.filter((item: any) => {
              const creator = String(item.createdBy || "").toLowerCase().trim();
              const custEmail = String(item.clientEmail || item.customerEmail || item.email || "").toLowerCase().trim();
              const sBy = String(item.salesBy || "").toLowerCase().trim();
              return (
                creator === email ||
                custEmail === email ||
                sBy === email ||
                creator === String(storedUser?.id) ||
                (storedUser?.username && creator === storedUser.username.toLowerCase())
              );
            })
          : [];

        setDataList(userScoped);
      }

      if (resProj?.data) {
        const rawP = Array.isArray(resProj.data?.data) ? resProj.data.data : Array.isArray(resProj.data) ? resProj.data : [];
        userProjects = email ? rawP.filter((p: any) => {
          const creator = String(p.createdBy || p.clientEmail || p.email || p.userEmail || p.projectManager || '').toLowerCase().trim();
          return creator === email || creator === String(storedUser?.id);
        }) : [];
        setProjects(userProjects);
      }
      if (resType?.data) setProjectTypes(Array.isArray(resType.data?.data) ? resType.data.data : Array.isArray(resType.data) ? resType.data : []);
      if (resSite?.data) setSites(Array.isArray(resSite.data?.data) ? resSite.data.data : Array.isArray(resSite.data) ? resSite.data : []);
      if (resFlat?.data) {
        const rawF = Array.isArray(resFlat.data?.data) ? resFlat.data.data : Array.isArray(resFlat.data) ? resFlat.data : [];
        const userProjUuids = new Set(userProjects.map((p: any) => p.uuid));
        const userFlats = rawF.filter((f: any) => userProjUuids.has(f.projectId) || String(f.createdBy || '').toLowerCase().trim() === email);
        setFlats(userFlats);
      }
      if (resUsers?.data) {
        const u = resUsers.data?.users || resUsers.data?.data || resUsers.data || [];
        setSalesUsers(Array.isArray(u) ? u : []);
      }
      const rawC = resCust?.data?.data || resCust?.data || [];
      const rawParties = resParties?.data?.data || resParties?.data || (Array.isArray(resParties) ? resParties : []);
      const partyCust = rawParties.map((p: any) => ({ name: p.name, customerName: p.name, email: p.email, phone: p.phone }));
      const combined = [...(Array.isArray(rawC) ? rawC : []), ...partyCust];
      setCustomers(combined.length > 0 ? combined : [{ name: 'Apex Capital Partners', customerName: 'Apex Capital Partners' }]);
      if (resTeams?.data) setTeams(Array.isArray(resTeams.data) ? resTeams.data : []);
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Failed to load sale offer data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userEmail]);

  // ====================== SUBMIT (POST / PUT) ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const subtotal = Number(form.rate) + Number(form.parking) + Number(form.utilityCharge) + Number(form.otherCost);
    const grandTotal = subtotal - Number(form.discount);
    const due = grandTotal - Number(form.paid);

    const payload = {
      offerDate: form.date,
      code: form.code,
      projectId: form.projectId || undefined,
      flatLandId: form.flatLandId || undefined,
      customerName: form.customerName || "Apex Capital Partners",
      salesBy: form.salesBy || "Md.Nayon",
      rate: Number(form.rate),
      otherCost: Number(form.otherCost),
      parking: Number(form.parking),
      utilityCharge: Number(form.utilityCharge),
      discount: Number(form.discount),
      subtotal,
      grandTotal,
      paid: Number(form.paid),
      due,
      approvalStatus: "Pending",
      createdBy: userEmail || storedUser?.username || "user",
    };

    try {
      const token = getStoredAccessToken();
      const url = editingItem
        ? `${API_PATH}/flat-land-offers/${editingItem.uuid}`
        : `${API_PATH}/flat-land-offers`;
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && (json.success || json.data)) {
        toast.success(editingItem ? "Updated successfully!" : "Created successfully!");
        setShowForm(false);
        setEditingItem(null);
        fetchData();
      } else {
        toast.error(json.message || "Operation failed");
      }
    } catch (err) {
      console.error("Submit Error:", err);
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setForm({
      date: item.offerDate || item.date || "",
      code: item.code || "",
      projectId: item.projectId || "",
      projectType: item.projectType || "",
      site: item.site || "",
      flatLandId: item.flatLandId || "",
      customerName: item.customerName || "",
      salesBy: item.salesBy || "",
      rate: item.rate || 0,
      otherCost: item.otherCost || 0,
      parking: item.parking || 0,
      utilityCharge: item.utilityCharge || 0,
      discount: item.discount || 0,
      paid: item.paid || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    try {
      const token = getStoredAccessToken();
      const res = await fetch(`${API_PATH}/flat-land-offers/${uuid}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        toast.success("Deleted successfully!");
        setDataList((prev) => prev.filter((item) => item.uuid !== uuid));
      } else {
        toast.error("Failed to delete");
      }
    } catch (err) {
      console.error("Delete Error:", err);
      toast.error("Failed to delete");
    }
  };

  // Predictive Suggestions
  const predictiveSuggestions = useMemo(() => {
    const list: string[] = [];
    dataList.forEach((item) => {
      if (item.code) list.push(item.code);
      if (item.customerName) list.push(item.customerName);
      if (item.project?.name) list.push(item.project.name);
      if (item.salesBy) list.push(item.salesBy);
    });
    return Array.from(new Set(list));
  }, [dataList]);

  // Client-side filtering
  const filteredData = useMemo(() => {
    return dataList.filter((item) => {
      const matchesSearch =
        search === "" ||
        (item.code && item.code.toLowerCase().includes(search.toLowerCase())) ||
        (item.customerName && item.customerName.toLowerCase().includes(search.toLowerCase())) ||
        (item.project?.name && item.project.name.toLowerCase().includes(search.toLowerCase())) ||
        (item.salesBy && item.salesBy.toLowerCase().includes(search.toLowerCase()));

      const matchesSalesBy = !filters.salesBy || item.salesBy === filters.salesBy;
      const matchesProject = !filters.project || item.projectId === filters.project;

      return matchesSearch && matchesSalesBy && matchesProject;
    });
  }, [dataList, search, filters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/20 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>Project</span>
            <span>/</span>
            <span>Flat & Land</span>
            <span>/</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              Sale Offer
            </span>
          </nav>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Sale Offer Management
          </h1>
          {userEmail && (
            <p className="text-xs text-slate-500 mt-0.5">
              Filtered for account: <strong className="text-emerald-700">{userEmail}</strong>
            </p>
          )}
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setForm({
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
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-100 hover:from-emerald-700 hover:to-teal-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Sale Offer</span>
        </button>
      </div>

      {/* Filter Card with Predictive Search Dropdowns */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 border-b pb-2">
          <Filter className="h-4 w-4 text-emerald-600" />
          <span>Search & Filters with Predictive Hints</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Predictive Table Search
            </label>
            <PredictiveSearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search code, customer, project..."
              suggestions={predictiveSuggestions}
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Filter by Project
            </label>
            <PredictiveSearchSelect
              value={filters.project}
              onChange={(val) => setFilters({ ...filters, project: val })}
              placeholder="All Projects"
              options={projects.map((p) => ({ value: p.uuid || p.id, label: p.name }))}
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Filter by Sales Person
            </label>
            <PredictiveSearchSelect
              value={filters.salesBy}
              onChange={(val) => setFilters({ ...filters, salesBy: val })}
              placeholder="All Sales Persons"
              options={salesUsers.map((u) => ({
                value: u.name,
                label: u.name,
                subLabel: u.email,
              }))}
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Filter by Team
            </label>
            <PredictiveSearchSelect
              value={filters.team}
              onChange={(val) => setFilters({ ...filters, team: val })}
              placeholder="All Teams"
              options={teams.map((t) => ({ value: t.name, label: t.name }))}
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-emerald-600 text-white uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Rate</th>
                <th className="px-4 py-3">Grand Total</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Sales By</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Loading sale offers...</span>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No sale offers found</p>
                    {userEmail && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Only records associated with {userEmail} are shown.
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={item.uuid} className="hover:bg-emerald-50/40 transition">
                    <td className="px-4 py-3 font-medium text-slate-600">{idx + 1}</td>
                    <td className="px-4 py-3 text-slate-700">{item.offerDate || item.date || "—"}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">{item.code}</td>
                    <td className="px-4 py-3 text-slate-800">{item.project?.name || "—"}</td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{item.customerName || "—"}</td>
                    <td className="px-4 py-3 text-slate-700 font-mono">৳{Number(item.rate || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-emerald-700 font-bold font-mono">৳{Number(item.grandTotal || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-700 font-mono">৳{Number(item.paid || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-rose-600 font-mono font-medium">৳{Number(item.due || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-700">{item.salesBy || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.approvalStatus || "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleEdit(item)}
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.uuid)}
                          className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal with Predictive Search Dropdowns */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden space-y-4 p-6 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">
                {editingItem ? "Edit Sale Offer" : "New Sale Offer"}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Offer Date *
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Offer Code *
                </label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project * (Predictive Select)
                </label>
                <PredictiveSearchSelect
                  value={form.projectId}
                  onChange={(val) => setForm({ ...form, projectId: val })}
                  placeholder="Select Project"
                  options={projects.map((p) => ({ value: p.uuid || p.id, label: p.name }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer (Predictive Select)
                </label>
                <PredictiveSearchSelect
                  value={form.customerName}
                  onChange={(val) => setForm({ ...form, customerName: val })}
                  placeholder="Select or Search Customer"
                  options={customers.map((c) => ({
                    value: c.name || c.customerName,
                    label: c.name || c.customerName,
                    subLabel: c.phone || c.email,
                  }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Flat / Land
                </label>
                <PredictiveSearchSelect
                  value={form.flatLandId}
                  onChange={(val) => setForm({ ...form, flatLandId: val })}
                  placeholder="Select Flat / Unit"
                  options={flats.map((f) => ({
                    value: f.uuid || f.id,
                    label: f.flatLandNo || f.name || f.code,
                  }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sales Person (Predictive Select)
                </label>
                <PredictiveSearchSelect
                  value={form.salesBy}
                  onChange={(val) => setForm({ ...form, salesBy: val })}
                  placeholder="Select Sales Person"
                  options={salesUsers.map((u) => ({
                    value: u.name,
                    label: u.name,
                    subLabel: u.email,
                  }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rate (৳)
                </label>
                <input
                  type="number"
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parking (৳)
                </label>
                <input
                  type="number"
                  value={form.parking}
                  onChange={(e) => setForm({ ...form, parking: Number(e.target.value) })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Utility Charge (৳)
                </label>
                <input
                  type="number"
                  value={form.utilityCharge}
                  onChange={(e) => setForm({ ...form, utilityCharge: Number(e.target.value) })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discount (৳)
                </label>
                <input
                  type="number"
                  value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Paid Amount (৳)
                </label>
                <input
                  type="number"
                  value={form.paid}
                  onChange={(e) => setForm({ ...form, paid: Number(e.target.value) })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-100 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                <span>{submitting ? "Saving..." : "Save Offer"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
