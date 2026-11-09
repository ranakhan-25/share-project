/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { X, Loader2, ChevronDown } from "lucide-react";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";

export async function handleRes(res: Response, action: string) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || json?.error || `Failed to ${action}`);
  return json;
}

export function formatDate(v?: string) {
  if (!v) return "";
  const d = new Date(v + (String(v).length === 10 ? "T00:00:00" : ""));
  if (isNaN(d.getTime())) return v;
  return `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleString("en-US", { month: "short" })} ${d.getFullYear()}`;
}

export async function loadDropdown(apiPath: string) {
  try {
    const res = await fetch(`${API_BASE}/realbizpro/api/v1/${apiPath}?page=1&limit=100&status=active&withDeleted=false`, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    return (json?.data?.data || []).map((e: any) => ({ uuid: e.uuid, name: e.name || "Unnamed" }));
  } catch { return []; }
}

// ------------------ Searchable Select ------------------
export function SearchableSelect({ options, value, onChange, placeholder = "Select One Option" }: any) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = React.useRef<HTMLDivElement>(null);
  const selected = options.find((o: any) => o.uuid === value);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return options.filter((o: any) => o.name.toLowerCase().includes(q) || (o.code || "").toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative w-full" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-left focus:ring-2 focus:ring-indigo-500 flex items-center justify-between">
        <span className={selected ? "text-slate-800" : "text-slate-400"}>{selected ? selected.name : placeholder}</span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input autoFocus type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none" />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length > 0 ? filtered.map((o: any) => (
              <button key={o.uuid} type="button" onClick={() => { onChange(o.uuid); setOpen(false); setQuery(""); }} className={`w-full text-left px-3 py-2 text-sm ${value === o.uuid ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-700 hover:bg-slate-50"}`}>
                {o.name}
              </button>
            )) : <div className="px-3 py-2 text-xs text-slate-400 text-center">No options found</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------ Employee Add/Edit Modal ------------------
export function EmployeeFormModal({ isOpen, onClose, onSuccess, initialData }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; initialData?: any }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [units, setUnits] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [salaryGrades, setSalaryGrades] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [employeeTypes, setEmployeeTypes] = useState<any[]>([]);
  const [unders, setUnders] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "", phone: "", email: "", birthDate: "", employeeCode: "", grossSalary: "", nid: "",
    joiningDate: "", leaveDate: "", status: "active", maritalStatus: "single",
    unitId: "", sectionId: "", departmentId: "", designationId: "", salaryGradeId: "", shiftId: "", employeeTypeId: "", underId: "",
    hasOtherInformation: false, hasNomineeInformation: false, hasBankInformation: false,
    fatherName: "", motherName: "", spouseName: "", religion: "", gender: "male", bloodGroup: "",
    presentAddress: "", permanentAddress: "", nomineeName: "", nomineePhone: "", nomineeNid: "",
    bankName: "", accountHolderName: "", accountNo: "", branchName: "", swiftCode: ""
  });

  useEffect(() => {
    if (isOpen && initialData) {
      setForm((prev) => ({
        ...prev, ...initialData,
        grossSalary: initialData.grossSalary?.toString() || "",
        unitId: initialData.unitId || "", sectionId: initialData.sectionId || "",
        departmentId: initialData.departmentId || "", designationId: initialData.designationId || "",
        salaryGradeId: initialData.salaryGradeId || "", shiftId: initialData.shiftId || "",
        employeeTypeId: initialData.employeeTypeId || "", underId: initialData.underId || "",
      }));
    } else if (isOpen && !initialData) {
      setForm({
        name: "", phone: "", email: "", birthDate: "", employeeCode: "", grossSalary: "", nid: "",
        joiningDate: "", leaveDate: "", status: "active", maritalStatus: "single",
        unitId: "", sectionId: "", departmentId: "", designationId: "", salaryGradeId: "", shiftId: "", employeeTypeId: "", underId: "",
        hasOtherInformation: false, hasNomineeInformation: false, hasBankInformation: false,
        fatherName: "", motherName: "", spouseName: "", religion: "", gender: "male", bloodGroup: "",
        presentAddress: "", permanentAddress: "", nomineeName: "", nomineePhone: "", nomineeNid: "",
        bankName: "", accountHolderName: "", accountNo: "", branchName: "", swiftCode: ""
      });
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    Promise.all([
      loadDropdown("unit"), loadDropdown("section"), loadDropdown("department"), loadDropdown("designation"),
      loadDropdown("salary-grade"), loadDropdown("shift"), loadDropdown("employee-type"), loadDropdown("under")
    ]).then(([u, s, d, des, sg, sh, et, un]) => {
      setUnits(u); setSections(s); setDepartments(d); setDesignations(des); setSalaryGrades(sg); setShifts(sh); setEmployeeTypes(et); setUnders(un);
    }).finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      setError("Name, Email and Phone are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // ✅ শুধুমাত্র সাপোর্টেড ফিল্ডগুলো পাঠানো হচ্ছে
      const payload: Record<string, any> = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        birthDate: form.birthDate || undefined,
        employeeCode: form.employeeCode || undefined,
        grossSalary: Number(form.grossSalary) || 0,
        nid: form.nid || undefined,
        joiningDate: form.joiningDate || undefined,
        leaveDate: form.leaveDate || undefined,
        maritalStatus: form.maritalStatus || "single",
        status: form.status || "active",
        
        unitId: form.unitId || undefined,
        sectionId: form.sectionId || undefined,
        departmentId: form.departmentId || undefined,
        designationId: form.designationId || undefined,
        salaryGradeId: form.salaryGradeId || undefined,
        shiftId: form.shiftId || undefined,
        employeeTypeId: form.employeeTypeId || undefined,
        underId: form.underId || undefined,

        hasOtherInformation: form.hasOtherInformation,
        hasNomineeInformation: form.hasNomineeInformation,
        hasBankInformation: form.hasBankInformation,
      };

      // ❌ fatherName, motherName, gender, religion, bloodGroup, presentAddress, permanentAddress বাদ দেওয়া হয়েছে

      if (form.hasNomineeInformation) {
        payload.nomineeName = form.nomineeName || undefined;
        payload.nomineePhone = form.nomineePhone || undefined;
        payload.nomineeNid = form.nomineeNid || undefined;
      }

      if (form.hasBankInformation) {
        payload.bankName = form.bankName || undefined;
        payload.accountHolderName = form.accountHolderName || undefined;
        payload.accountNo = form.accountNo || undefined;
        payload.branchName = form.branchName || undefined;
        payload.swiftCode = form.swiftCode || undefined;
      }

      const url = initialData?.uuid 
        ? `${API_BASE}/realbizpro/api/v1/employee-list/${initialData.uuid}` 
        : `${API_BASE}/realbizpro/api/v1/employee-list`;
      const method = initialData?.uuid ? "PATCH" : "POST";

      const res = await fetch(url, { 
        method, 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload) 
      });
      
      await handleRes(res, initialData?.uuid ? "update employee" : "create employee");
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Loader2 className="w-8 h-8 animate-spin text-white" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-6xl rounded-lg shadow-2xl my-8">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-slate-800">{initialData ? "Edit Employee" : "Add Employee"}</h2>
          <button onClick={onClose} className="p-1 bg-rose-500 text-white rounded hover:bg-rose-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div><label className="block text-xs font-medium mb-1">Unit</label><SearchableSelect options={units} value={form.unitId} onChange={(v: string) => handleChange("unitId", v)} /></div>
            <div><label className="block text-xs font-medium mb-1">Section</label><SearchableSelect options={sections} value={form.sectionId} onChange={(v: string) => handleChange("sectionId", v)} /></div>
            <div><label className="block text-xs font-medium mb-1">Code</label><input value={form.employeeCode} onChange={e => handleChange("employeeCode", e.target.value)} placeholder="ST1198941" className="w-full border p-2 rounded" /></div>
            <div><label className="block text-xs font-medium mb-1">Name <span className="text-rose-500">*</span></label><input value={form.name} onChange={e => handleChange("name", e.target.value)} placeholder="Enter Name" className="w-full border p-2 rounded" required /></div>
            <div><label className="block text-xs font-medium mb-1">Phone <span className="text-rose-500">*</span></label><input value={form.phone} onChange={e => handleChange("phone", e.target.value)} placeholder="Enter Phone" className="w-full border p-2 rounded" /></div>
            <div><label className="block text-xs font-medium mb-1">Email <span className="text-rose-500">*</span></label><input type="email" value={form.email} onChange={e => handleChange("email", e.target.value)} placeholder="Enter Email" className="w-full border p-2 rounded" required /></div>
            <div><label className="block text-xs font-medium mb-1">Birth Date <span className="text-rose-500">*</span></label><input type="date" value={form.birthDate} onChange={e => handleChange("birthDate", e.target.value)} className="w-full border p-2 rounded" /></div>
            <div><label className="block text-xs font-medium mb-1">Department <span className="text-rose-500">*</span></label><SearchableSelect options={departments} value={form.departmentId} onChange={(v: string) => handleChange("departmentId", v)} /></div>
            <div><label className="block text-xs font-medium mb-1">Designation <span className="text-rose-500">*</span></label><SearchableSelect options={designations} value={form.designationId} onChange={(v: string) => handleChange("designationId", v)} /></div>
            <div><label className="block text-xs font-medium mb-1">Salary Grade</label><SearchableSelect options={salaryGrades} value={form.salaryGradeId} onChange={(v: string) => handleChange("salaryGradeId", v)} /></div>
            <div><label className="block text-xs font-medium mb-1">Gross Salary <span className="text-rose-500">*</span></label><input type="number" value={form.grossSalary} onChange={e => handleChange("grossSalary", e.target.value)} placeholder="Gross Salary" className="w-full border p-2 rounded" /></div>
            <div><label className="block text-xs font-medium mb-1">NID</label><input value={form.nid} onChange={e => handleChange("nid", e.target.value)} placeholder="NID" className="w-full border p-2 rounded" /></div>
            <div><label className="block text-xs font-medium mb-1">Joining Date <span className="text-rose-500">*</span></label><input type="date" value={form.joiningDate} onChange={e => handleChange("joiningDate", e.target.value)} className="w-full border p-2 rounded" /></div>
            <div><label className="block text-xs font-medium mb-1">Leave Date</label><input type="date" value={form.leaveDate} onChange={e => handleChange("leaveDate", e.target.value)} className="w-full border p-2 rounded" /></div>
            <div><label className="block text-xs font-medium mb-1">Status</label><select value={form.status} onChange={e => handleChange("status", e.target.value)} className="w-full border p-2 rounded"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
            <div><label className="block text-xs font-medium mb-1">Shift <span className="text-rose-500">*</span></label><SearchableSelect options={shifts} value={form.shiftId} onChange={(v: string) => handleChange("shiftId", v)} /></div>
          </div>

          {/* UI-তে চেকবক্সগুলো থাকবে, কিন্তু পেলোডে যাবে না */}
          <div className="flex flex-wrap items-center gap-4 border-t pt-4">
            <label className="flex items-center gap-2 cursor-pointer bg-blue-50 px-3 py-1.5 rounded-full"><input type="checkbox" checked={form.hasOtherInformation} onChange={e => handleChange("hasOtherInformation", e.target.checked)} /> Other Information</label>
            <label className="flex items-center gap-2 cursor-pointer bg-blue-50 px-3 py-1.5 rounded-full"><input type="checkbox" checked={form.hasNomineeInformation} onChange={e => handleChange("hasNomineeInformation", e.target.checked)} /> Nominee Information</label>
            <label className="flex items-center gap-2 cursor-pointer bg-blue-50 px-3 py-1.5 rounded-full"><input type="checkbox" checked={form.hasBankInformation} onChange={e => handleChange("hasBankInformation", e.target.checked)} /> Bank Information</label>
          </div>

          {/* শুধু UI দেখানোর জন্য, সাবমিটে যাবে না */}
          {form.hasOtherInformation && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t pt-4 bg-slate-50 p-4 rounded">
              <div><label className="block text-xs font-medium mb-1">Father Name</label><input value={form.fatherName} onChange={e => handleChange("fatherName", e.target.value)} className="w-full border p-2 rounded" /></div>
              <div><label className="block text-xs font-medium mb-1">Mother Name</label><input value={form.motherName} onChange={e => handleChange("motherName", e.target.value)} className="w-full border p-2 rounded" /></div>
              <div><label className="block text-xs font-medium mb-1">Spouse Name</label><input value={form.spouseName} onChange={e => handleChange("spouseName", e.target.value)} className="w-full border p-2 rounded" /></div>
              <div><label className="block text-xs font-medium mb-1">Religion</label><input value={form.religion} onChange={e => handleChange("religion", e.target.value)} className="w-full border p-2 rounded" /></div>
              <div><label className="block text-xs font-medium mb-1">Gender</label><select value={form.gender} onChange={e => handleChange("gender", e.target.value)} className="w-full border p-2 rounded"><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
              <div><label className="block text-xs font-medium mb-1">Blood Group</label><input value={form.bloodGroup} onChange={e => handleChange("bloodGroup", e.target.value)} className="w-full border p-2 rounded" /></div>
              <div><label className="block text-xs font-medium mb-1">Present Address</label><input value={form.presentAddress} onChange={e => handleChange("presentAddress", e.target.value)} className="w-full border p-2 rounded" /></div>
              <div><label className="block text-xs font-medium mb-1">Permanent Address</label><input value={form.permanentAddress} onChange={e => handleChange("permanentAddress", e.target.value)} className="w-full border p-2 rounded" /></div>
            </div>
          )}

          {form.hasNomineeInformation && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4 bg-slate-50 p-4 rounded">
              <div><label className="block text-xs font-medium mb-1">Nominee Name</label><input value={form.nomineeName} onChange={e => handleChange("nomineeName", e.target.value)} className="w-full border p-2 rounded" /></div>
              <div><label className="block text-xs font-medium mb-1">Nominee Phone</label><input value={form.nomineePhone} onChange={e => handleChange("nomineePhone", e.target.value)} className="w-full border p-2 rounded" /></div>
              <div><label className="block text-xs font-medium mb-1">Nominee NID</label><input value={form.nomineeNid} onChange={e => handleChange("nomineeNid", e.target.value)} className="w-full border p-2 rounded" /></div>
            </div>
          )}

          {form.hasBankInformation && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t pt-4 bg-slate-50 p-4 rounded">
              <div><label className="block text-xs font-medium mb-1">Bank Name</label><input value={form.bankName} onChange={e => handleChange("bankName", e.target.value)} className="w-full border p-2 rounded" /></div>
              <div><label className="block text-xs font-medium mb-1">Account Holder</label><input value={form.accountHolderName} onChange={e => handleChange("accountHolderName", e.target.value)} className="w-full border p-2 rounded" /></div>
              <div><label className="block text-xs font-medium mb-1">Account No</label><input value={form.accountNo} onChange={e => handleChange("accountNo", e.target.value)} className="w-full border p-2 rounded" /></div>
              <div><label className="block text-xs font-medium mb-1">Branch Name</label><input value={form.branchName} onChange={e => handleChange("branchName", e.target.value)} className="w-full border p-2 rounded" /></div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
            <div><label className="block text-xs font-medium mb-1">Under <span className="text-rose-500">*</span></label><SearchableSelect options={unders} value={form.underId} onChange={(v: string) => handleChange("underId", v)} /></div>
            <div><label className="block text-xs font-medium mb-1">Employee Type <span className="text-rose-500">*</span></label><SearchableSelect options={employeeTypes} value={form.employeeTypeId} onChange={(v: string) => handleChange("employeeTypeId", v)} /></div>
          </div>

          {error && <div className="bg-rose-50 text-rose-600 p-3 rounded text-xs border border-rose-200">{error}</div>}

          <div className="flex justify-end gap-3 border-t pt-4">
            <button type="button" onClick={onClose} className="px-5 py-2 bg-slate-400 text-white rounded font-medium hover:bg-slate-500">Close</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}