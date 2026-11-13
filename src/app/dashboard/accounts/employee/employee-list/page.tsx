/* eslint-disable prettier/prettier */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, Download, Eye, AlignLeft, Heart, Edit3, Trash2, Loader2, X, Save, ChevronRight } from "lucide-react";
import { API_BASE, formatDate, SearchableSelect, loadDropdown, EmployeeFormModal } from "../_shared";
import { useRouter } from "next/navigation";

// ---------- Types ----------
interface DropdownOption { uuid: string; name: string; code?: string; }
interface Employee {
  uuid: string; name: string; employeeCode: string; image?: string;
  status: string; joiningDate?: string; grossSalary?: number | string; cv?: string;
  sectionId?: string; departmentId?: string; designationId?: string; shiftId?: string; employeeTypeId?: string;
  department?: { name: string }; designation?: { name: string }; salaryGrade?: { name: string }; under?: { name: string };
}

interface AttendanceApiRecord {
  uuid: string;
  date: string;
  inTime?: string;
  outTime?: string;
  note?: string;
}

interface AttendanceRow {
  date: string;
  day: string;
  inTime: string;
  outTime: string;
  comment: string;
  uuid?: string;
}

interface MonthYearItem {
  uuid: string;
  month: string;
  year: number;
}

// ---------- Attendance Modal Component ----------
function AttendanceModal({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const [month, setMonth] = useState("October");
  const [year, setYear] = useState(2026);
  const [monthYearId, setMonthYearId] = useState("");
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const getMonthDays = (y: number, m: string) => {
    const idx = MONTHS.indexOf(m);
    if (idx === -1) return [];
    const days = new Date(y, idx + 1, 0).getDate();
    const out: string[] = [];
    for (let d = 1; d <= days; d++) out.push(`${y}-${String(idx + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    return out;
  };

  const getDayName = (dateStr: string) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date(dateStr + "T00:00:00").getDay()];
  };

  useEffect(() => {
    fetch(`${API_BASE}/realbizpro/api/v1/month-year?page=1&limit=100&sortOrder=DESC&withDeleted=false`, { cache: "no-store" })
      .then(res => res.json())
      .then((json: { data?: { data?: MonthYearItem[] } }) => {
        const list = json?.data?.data || [];
        const found = list.find(m => m.month.toLowerCase() === month.toLowerCase() && m.year === year);
        setMonthYearId(found?.uuid || "");
      })
      .catch((err: unknown) => console.error("MonthYear load error", err));
  }, [month, year]);

  useEffect(() => {
    const days = getMonthDays(year, month);
    (async () => {
      let existing: AttendanceApiRecord[] = [];
      if (employee.uuid && monthYearId) {
        const res = await fetch(`${API_BASE}/realbizpro/api/v1/attendance?employeeId=${employee.uuid}&monthYearId=${monthYearId}&page=1&limit=500&withDeleted=false`);
        const json = await res.json().catch(() => ({})) as { data?: { data?: AttendanceApiRecord[] } };
        existing = json?.data?.data || [];
      }
      setRows(days.map(date => {
        const found = existing.find(a => (a.date || "").startsWith(date));
        return {
          date,
          day: getDayName(date),
          inTime: found?.inTime ? found.inTime.slice(0, 5) : "",
          outTime: found?.outTime ? found.outTime.slice(0, 5) : "",
          comment: found?.note || "",
          uuid: found?.uuid,
        };
      }));
      setLoading(false);
    })();
  }, [month, year, employee.uuid, monthYearId]);

  const updateRow = (date: string, patch: Partial<AttendanceRow>) => {
    setRows(prev => prev.map(r => r.date === date ? { ...r, ...patch } : r));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let currentMonthYearId = monthYearId;

      if (!currentMonthYearId) {
        const checkRes = await fetch(
          `${API_BASE}/realbizpro/api/v1/month-year?page=1&limit=100&withDeleted=false`,
          { cache: "no-store" }
        );
        const checkJson = await checkRes.json().catch(() => ({}));
        const existingList = checkJson?.data?.data || [];
        
        const found = existingList.find(
          (m: { month: string; year: number }) =>
            m.month.toLowerCase() === month.toLowerCase() && m.year === year
        );

        if (found) {
          currentMonthYearId = found.uuid;
          setMonthYearId(found.uuid);
        } else {
          const createRes = await fetch(`${API_BASE}/realbizpro/api/v1/month-year`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ month, year: Number(year) }),
          });
          const createJson = await createRes.json().catch(() => ({}));
          if (!createRes.ok) {
            throw new Error(createJson?.message || "Month-Year তৈরি করতে সমস্যা হচ্ছে");
          }
          currentMonthYearId = createJson?.data?.uuid;
          setMonthYearId(currentMonthYearId);
        }
      }

      const rowsToSave = rows.filter(r => r.inTime || r.outTime || r.comment);

      if (rowsToSave.length === 0) {
        setSaving(false);
        return alert("কোনো ডেটা দেওয়া হয়নি। অন্তত একটি দিনের টাইম বা কমেন্ট দিন।");
      }

      for (const row of rowsToSave) {
        const payload = {
          employeeId: employee.uuid,
          monthYearId: currentMonthYearId,
          date: row.date,
          day: row.day,
          inTime: row.inTime ? `${row.inTime}:00` : "00:00:00",
          outTime: row.outTime ? `${row.outTime}:00` : "00:00:00",
          note: row.comment || "",
          type: "workday",
        };

        const url = row.uuid
          ? `${API_BASE}/realbizpro/api/v1/attendance/${row.uuid}`
          : `${API_BASE}/realbizpro/api/v1/attendance`;
        const method = row.uuid ? "PATCH" : "POST";
        
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorJson = await res.json().catch(() => ({}));
          throw new Error(errorJson?.message || `ডেটা সেভ করতে সমস্যা হয়েছে (${res.status})`);
        }
      }

      alert("সফলভাবে Attendance সেভ হয়েছে!");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "সেভ করতে সমস্যা হয়েছে";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white w-full max-w-5xl rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b bg-slate-50">
          <div>
            <h2 className="font-bold text-lg">Attendance - {employee.name}</h2>
            <p className="text-xs text-slate-500">Code: {employee.employeeCode}</p>
          </div>
          <button onClick={onClose} className="p-1.5 bg-rose-500 text-white rounded hover:bg-rose-600"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          <div className="flex gap-4 mb-4">
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="border p-2 rounded text-sm w-40">
              {MONTHS.map(m => <option key={m}>{m}</option>)}
            </select>
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="border p-2 rounded text-sm w-24" />
          </div>

          {loading ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-slate-400" /></div> : (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-indigo-500 text-white uppercase text-[10px]">
                  <tr>
                    <th className="p-2">SL</th><th className="p-2">Date</th><th className="p-2">Day</th>
                    <th className="p-2">From Time</th><th className="p-2">To Time</th><th className="p-2">Comment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, i) => (
                    <tr key={row.date} className="hover:bg-slate-50/80">
                      <td className="p-2 text-slate-600">{i + 1}</td>
                      <td className="p-2 text-slate-700">{row.date}</td>
                      <td className="p-2 text-slate-700">{row.day}</td>
                      <td className="p-2"><input type="time" value={row.inTime} onChange={(e) => updateRow(row.date, { inTime: e.target.value })} className="border rounded px-2 py-1 text-xs w-24" /></td>
                      <td className="p-2"><input type="time" value={row.outTime} onChange={(e) => updateRow(row.date, { outTime: e.target.value })} className="border rounded px-2 py-1 text-xs w-24" /></td>
                      <td className="p-2"><input value={row.comment} onChange={(e) => updateRow(row.date, { comment: e.target.value })} placeholder="Weekend" className="border rounded px-2 py-1 text-xs w-full" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-slate-50 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-6 py-2 rounded-md disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Attendance
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Main Page ----------
export default function EmployeeListPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sections, setSections] = useState<DropdownOption[]>([]);
  const [departments, setDepartments] = useState<DropdownOption[]>([]);
  const [designations, setDesignations] = useState<DropdownOption[]>([]);
  const [shifts, setShifts] = useState<DropdownOption[]>([]);
  const [employeeTypes, setEmployeeTypes] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterSection, setFilterSection] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterDesignation, setFilterDesignation] = useState("");
  const [filterShift, setFilterShift] = useState("");
  const [filterEmployeeType, setFilterEmployeeType] = useState("");
  const [search, setSearch] = useState("");
  const router = useRouter();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingAttendance, setViewingAttendance] = useState<Employee | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [empRes, sec, dep, des, sh, et] = await Promise.all([
        fetch(`${API_BASE}/realbizpro/api/v1/employee-list?page=1&limit=100&status=active&sortBy=createdAt&sortOrder=DESC&withDeleted=false`, { cache: "no-store" }),
        loadDropdown("section"), loadDropdown("department"), loadDropdown("designation"), loadDropdown("shift"), loadDropdown("employee-type"),
      ]);
      const empJ = await empRes.json().catch(() => ({}));
      setEmployees(empJ?.data?.data || []);
      setSections(sec as DropdownOption[]); setDepartments(dep as DropdownOption[]); setDesignations(des as DropdownOption[]); setShifts(sh as DropdownOption[]); setEmployeeTypes(et as DropdownOption[]);
    } catch (error: unknown) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter((it) => {
      if (filterSection && it.sectionId !== filterSection) return false;
      if (filterDepartment && it.departmentId !== filterDepartment) return false;
      if (filterDesignation && it.designationId !== filterDesignation) return false;
      if (filterShift && it.shiftId !== filterShift) return false;
      if (filterEmployeeType && it.employeeTypeId !== filterEmployeeType) return false;
      if (!q) return true;
      return (it.name || "").toLowerCase().includes(q) || (it.employeeCode || "").toLowerCase().includes(q);
    });
  }, [employees, search, filterSection, filterDepartment, filterDesignation, filterShift, filterEmployeeType]);

  const handleDelete = async (emp: Employee) => {
    if (!confirm(`Delete ${emp.name}?`)) return;
    try {
      await fetch(`${API_BASE}/realbizpro/api/v1/employee-list/${emp.uuid}`, { method: "DELETE" });
      setEmployees((prev) => prev.filter((x) => x.uuid !== emp.uuid));
    } catch (error: unknown) { alert("Delete failed"); }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 font-sans text-slate-800">
      <div className="mx-auto max-w-[1600px] space-y-5">
        
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <nav className="flex items-center text-xs sm:text-sm text-slate-500 gap-1.5 sm:gap-2 mb-1">
              <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Home</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="hover:text-emerald-700 cursor-pointer font-medium transition">Employee</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                Employee List
              </span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Employee Management
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsAddModalOpen(true)} 
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 hover:shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" /> 
              <span>Employee Add</span>
            </button>
            <button 
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-700 hover:shadow-sm active:scale-95"
            >
              <Download className="w-4 h-4" /> 
              <span>Employee Import</span>
            </button>
          </div>
        </div>

        {/* Filter Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Section</label>
              <SearchableSelect options={sections} value={filterSection} onChange={setFilterSection} placeholder="Select Section" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Department</label>
              <SearchableSelect options={departments} value={filterDepartment} onChange={setFilterDepartment} placeholder="Select Department" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Designation</label>
              <SearchableSelect options={designations} value={filterDesignation} onChange={setFilterDesignation} placeholder="Select Designation" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Shift</label>
              <SearchableSelect options={shifts} value={filterShift} onChange={setFilterShift} placeholder="Select Shift" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Employee Type</label>
              <SearchableSelect options={employeeTypes} value={filterEmployeeType} onChange={setFilterEmployeeType} placeholder="Select Employee Type" />
            </div>
          </div>
        </div>

        {/* List Table Container */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center text-xs sm:text-sm text-slate-600 space-x-2">
              <span>Show</span>
              <select className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
              <span>entries</span>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search..." 
                className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10" 
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-xs sm:text-sm text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white text-xs font-bold uppercase tracking-wider">
                    <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">SL</th>
                    <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">IMAGE</th>
                    <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">EMPLOYEE CODE</th>
                    <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">NAME</th>
                    <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">DEPARTMENT</th>
                    <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">DESIGNATION</th>
                    <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">JOINING DATE</th>
                    <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">STATUS</th>
                    <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">SALARY GRADE</th>
                    <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">GROSS SALARY</th>
                    <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">CV</th>
                    <th className="px-4 py-3.5 font-semibold text-white text-left tracking-wide">UNDER</th>
                    <th className="px-4 py-3.5 font-semibold text-white text-center tracking-wide">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700 font-medium">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="text-center py-16 text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <p className="text-sm font-medium">No data found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((emp, i) => (
                      <tr key={emp.uuid} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700 overflow-hidden shadow-2xs">
                            {emp.image ? <img src={`${API_BASE}${emp.image}`} className="w-full h-full object-cover" alt="" /> : (emp.name || "?").charAt(0).toUpperCase()}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-600">{emp.employeeCode || "—"}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{emp.name || "—"}</td>
                        <td className="px-4 py-3 text-slate-700">{emp.department?.name || "—"}</td>
                        <td className="px-4 py-3 text-slate-700">{emp.designation?.name || "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(emp.joiningDate) || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            (emp.status || "").toLowerCase() === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : "bg-slate-100 text-slate-600 border border-slate-200/60"
                          }`}>
                            {emp.status || "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{emp.salaryGrade?.name || "—"}</td>
                        <td className="px-4 py-3 font-bold text-emerald-600">{emp.grossSalary ? Number(emp.grossSalary).toLocaleString() : "0"}</td>
                        <td className="px-4 py-3">
                          {emp.cv ? (
                            <a href={`${API_BASE}${emp.cv}`} target="_blank" className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition" rel="noreferrer">
                              <Download className="w-3.5 h-3.5" /> CV
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{emp.under?.name || "—"}</td>
                        
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => window.location.href = `/dashboard/hrm/employee/salary-structure?employeeId=${emp.uuid}`} 
                              className="rounded-lg bg-sky-50 p-1.5 text-sky-600 transition hover:bg-sky-100 active:scale-95" 
                              title="Salary Structure"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            
                            <button 
                              onClick={() => alert(`Downloading profile for: ${emp.name}`)} 
                              className="rounded-lg bg-slate-100 p-1.5 text-slate-600 transition hover:bg-slate-200 active:scale-95" 
                              title="Download Profile"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            
                            <button 
                              onClick={() => setViewingAttendance(emp)} 
                              className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600 transition hover:bg-indigo-100 active:scale-95" 
                              title="Attendance"
                            >
                              <AlignLeft className="w-3.5 h-3.5" />
                            </button>
                            
                            <button 
                              onClick={() => alert(`${emp.name} added to favourites`)} 
                              className="rounded-lg bg-rose-50 p-1.5 text-rose-600 transition hover:bg-rose-100 active:scale-95" 
                              title="Favourite"
                            >
                              <Heart className="w-3.5 h-3.5" />
                            </button>
                            
                            <button 
                              onClick={() => setEditingEmployee(emp)} 
                              className="rounded-lg bg-teal-50 p-1.5 text-teal-600 transition hover:bg-teal-100 active:scale-95" 
                              title="Edit Employee"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            
                            <button 
                              onClick={() => handleDelete(emp)} 
                              className="rounded-lg bg-rose-50 p-1.5 text-rose-600 transition hover:bg-rose-100 active:scale-95" 
                              title="Delete Employee"
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
              Showing {filtered.length > 0 ? 1 : 0} to {filtered.length} of {filtered.length} entries
            </div>
            <div className="flex items-center gap-1.5">
              <button disabled className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed">
                Previous
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold shadow-2xs">
                1
              </button>
              <button disabled className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <EmployeeFormModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={loadAll} />
      <EmployeeFormModal isOpen={!!editingEmployee} onClose={() => setEditingEmployee(null)} onSuccess={loadAll} initialData={editingEmployee} />
      
      {viewingAttendance && (
        <AttendanceModal employee={viewingAttendance} onClose={() => setViewingAttendance(null)} />
      )}
    </div>
  );
}