/* eslint-disable prettier/prettier */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, Download, Eye, AlignLeft, Heart, Edit3, Trash2, Loader2, X, Save } from "lucide-react";
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
    <div className="min-h-screen bg-white p-4 sm:p-6 space-y-4">
      <div className="flex justify-between items-center border-b pb-3">
        <div>
          <div className="text-xs text-slate-500 mb-1">Home / Employee / Employee List</div>
          <h1 className="text-xl font-bold">Employee Management</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm transition-colors">
            <Plus className="w-4 h-4" /> Employee Add
          </button>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm transition-colors">
            <Download className="w-4 h-4" /> Employee Import
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div><label className="text-xs font-medium mb-1 block">Section</label><SearchableSelect options={sections} value={filterSection} onChange={setFilterSection} placeholder="Select Section" /></div>
        <div><label className="text-xs font-medium mb-1 block">Department</label><SearchableSelect options={departments} value={filterDepartment} onChange={setFilterDepartment} placeholder="Select Department" /></div>
        <div><label className="text-xs font-medium mb-1 block">Designation</label><SearchableSelect options={designations} value={filterDesignation} onChange={setFilterDesignation} placeholder="Select Designation" /></div>
        <div><label className="text-xs font-medium mb-1 block">Shift</label><SearchableSelect options={shifts} value={filterShift} onChange={setFilterShift} placeholder="Select Shift" /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div><label className="text-xs font-medium mb-1 block">Employee Type</label><SearchableSelect options={employeeTypes} value={filterEmployeeType} onChange={setFilterEmployeeType} placeholder="Select Employee Type" /></div>
      </div>

      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md border">
        <div className="text-sm flex items-center gap-2">Show <select className="border p-1 rounded"><option>10</option></select> entries</div>
        <div className="flex items-center gap-2 text-sm">Search: <div className="relative"><Search className="absolute left-2 top-2 w-4 h-4 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} className="border pl-8 p-1.5 rounded w-64" /></div></div>
      </div>

      {loading ? <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-slate-400" /></div> : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-indigo-500 text-white uppercase text-[10px]">
              <tr>
                <th className="p-2">SL</th><th className="p-2">Image</th><th className="p-2">Employee Code</th><th className="p-2">Name</th><th className="p-2">Department</th><th className="p-2">Designation</th><th className="p-2">Joining Date</th><th className="p-2">Status</th><th className="p-2">Salary Grade</th><th className="p-2">Gross Salary</th><th className="p-2">CV</th><th className="p-2">Under</th><th className="p-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => (
                <tr key={emp.uuid} className="border-t hover:bg-slate-50">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] overflow-hidden">
                      {emp.image ? <img src={`${API_BASE}${emp.image}`} className="w-full h-full object-cover" alt="" /> : (emp.name || "?").charAt(0)}
                    </div>
                  </td>
                  <td className="p-2 text-indigo-600 font-medium">{emp.employeeCode || "—"}</td>
                  <td className="p-2 text-indigo-600 font-medium">{emp.name || "—"}</td>
                  <td className="p-2">{emp.department?.name || ""}</td>
                  <td className="p-2">{emp.designation?.name || ""}</td>
                  <td className="p-2">{formatDate(emp.joiningDate)}</td>
                  <td className="p-2">{emp.status || "—"}</td>
                  <td className="p-2">{emp.salaryGrade?.name || ""}</td>
                  <td className="p-2">{emp.grossSalary || "0"}</td>
                  <td className="p-2">{emp.cv ? <a href={`${API_BASE}${emp.cv}`} target="_blank" className="text-rose-500 flex justify-center" rel="noreferrer"><Download className="w-3 h-3" /></a> : null}</td>
                  <td className="p-2">{emp.under?.name || ""}</td>
                  
                  <td className="p-2">
                    <div className="flex justify-center gap-1">
                      <button 
                        onClick={() => window.location.href = `/dashboard/hrm/employee/salary-structure?employeeId=${emp.uuid}`} 
                        className="p-1.5 bg-cyan-400 text-white rounded hover:bg-cyan-500" 
                        title="Salary Structure"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      
                      <button onClick={() => alert(`Downloading profile for: ${emp.name}`)} className="p-1.5 bg-slate-400 text-white rounded hover:bg-slate-500" title="Download">
                        <Download className="w-3 h-3" />
                      </button>
                      
                      <button 
                        onClick={() => setViewingAttendance(emp)} 
                        className="p-1.5 bg-indigo-500 text-white rounded hover:bg-indigo-600" 
                        title="Attendance"
                      >
                        <AlignLeft className="w-3 h-3" />
                      </button>
                      
                      <button onClick={() => alert(`${emp.name} added to favourites`)} className="p-1.5 bg-rose-400 text-white rounded hover:bg-rose-500" title="Favourite">
                        <Heart className="w-3 h-3" />
                      </button>
                      
                      <button onClick={() => setEditingEmployee(emp)} className="p-1.5 bg-cyan-400 text-white rounded hover:bg-cyan-500" title="Edit">
                        <Edit3 className="w-3 h-3" />
                      </button>
                      
                      <button onClick={() => handleDelete(emp)} className="p-1.5 bg-rose-500 text-white rounded hover:bg-rose-600" title="Delete">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={13} className="p-10 text-center text-slate-400">No data found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <EmployeeFormModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={loadAll} />
      <EmployeeFormModal isOpen={!!editingEmployee} onClose={() => setEditingEmployee(null)} onSuccess={loadAll} initialData={editingEmployee} />
      
      {viewingAttendance && (
        <AttendanceModal employee={viewingAttendance} onClose={() => setViewingAttendance(null)} />
      )}
    </div>
  );
}