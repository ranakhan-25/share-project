/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { X, Loader2, ChevronDown } from "lucide-react";

import PredictiveSearchSelect from "@/components/ui/PredictiveSearchSelect";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";

export const getAuthHeaders = () => {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('share-project:access-token')
    : '';
  return {
    'Content-Type': 'application/json',
    accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

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
    const res = await fetch(`${API_BASE}/realbizpro/api/v1/${apiPath}?page=1&limit=100&status=active&withDeleted=false`, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    const list = Array.isArray(json?.data?.data) ? json.data.data : Array.isArray(json?.data) ? json.data : [];
    return list.map((e: any) => ({ uuid: e.uuid || String(e.id || ""), name: e.name || e.code || "Unnamed" }));
  } catch { return []; }
}

// ------------------ Searchable Select ------------------
export function SearchableSelect({ options = [], value, onChange, placeholder = "Select One Option" }: any) {
  const formattedOptions = useMemo(() => {
    return (options || []).map((o: any) => ({
      value: o.uuid || String(o.id || ""),
      label: o.name || o.code || "Option",
    }));
  }, [options]);

  return (
    <PredictiveSearchSelect
      options={formattedOptions}
      value={value || ""}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full"
    />
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
    name: "", phone: "", email: "", birthDate: "", employeeCode: "", grossSalary: "50000", nid: "",
    joiningDate: "", leaveDate: "", status: "active", maritalStatus: "single",
    unitId: "", sectionId: "", departmentId: "", designationId: "", salaryGradeId: "", shiftId: "", employeeTypeId: "", underId: "",
    hasOtherInformation: true, hasNomineeInformation: true, hasBankInformation: true,
    fatherName: "", motherName: "", spouseName: "", religion: "Islam", gender: "male", bloodGroup: "B+",
    presentAddress: "House 12, Road 5, Dhanmondi, Dhaka", permanentAddress: "House 12, Road 5, Dhanmondi, Dhaka",
    nomineeName: "", nomineePhone: "", nomineeNid: "",
    bankName: "Islami Bank Bangladesh Ltd", accountHolderName: "", accountNo: "2050123456789", branchName: "Dhanmondi Branch", swiftCode: "IBBLBDDH"
  });

  useEffect(() => {
    if (isOpen && initialData) {
      setForm((prev) => ({
        ...prev, ...initialData,
        grossSalary: initialData.grossSalary?.toString() || "50000",
        unitId: initialData.unitId || "", sectionId: initialData.sectionId || "",
        departmentId: initialData.departmentId || "", designationId: initialData.designationId || "",
        salaryGradeId: initialData.salaryGradeId || "", shiftId: initialData.shiftId || "",
        employeeTypeId: initialData.employeeTypeId || "", underId: initialData.underId || "",
      }));
    } else if (isOpen && !initialData) {
      const randCode = "EMP-" + Math.floor(1000 + Math.random() * 9000);
      const randNid = "1995" + Math.floor(100000000 + Math.random() * 900000000);
      setForm({
        name: "", phone: "", email: "", birthDate: "1995-05-15", employeeCode: randCode, grossSalary: "50000", nid: randNid,
        joiningDate: new Date().toISOString().slice(0, 10), leaveDate: "", status: "active", maritalStatus: "single",
        unitId: "", sectionId: "", departmentId: "", designationId: "", salaryGradeId: "", shiftId: "", employeeTypeId: "", underId: "",
        hasOtherInformation: true, hasNomineeInformation: true, hasBankInformation: true,
        fatherName: "Md. Rafiqul Islam", motherName: "Rokeya Begum", spouseName: "", religion: "Islam", gender: "male", bloodGroup: "B+",
        presentAddress: "House 12, Road 5, Dhanmondi, Dhaka", permanentAddress: "House 12, Road 5, Dhanmondi, Dhaka",
        nomineeName: "Rokeya Begum", nomineePhone: "01711223344", nomineeNid: "1970123456789",
        bankName: "Islami Bank Bangladesh Ltd", accountHolderName: "", accountNo: "2050123456789", branchName: "Dhanmondi Branch", swiftCode: "IBBLBDDH"
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
      if (!initialData) {
        setForm(prev => ({
          ...prev,
          unitId: prev.unitId || (u[0]?.uuid || ""),
          sectionId: prev.sectionId || (s[0]?.uuid || ""),
          departmentId: prev.departmentId || (d[0]?.uuid || ""),
          designationId: prev.designationId || (des[0]?.uuid || ""),
          shiftId: prev.shiftId || (sh[0]?.uuid || ""),
          employeeTypeId: prev.employeeTypeId || (et[0]?.uuid || ""),
          underId: prev.underId || (un[0]?.uuid || ""),
        }));
      }
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
      const effEmployeeCode = form.employeeCode?.trim() || ("EMP-" + Math.floor(1000 + Math.random() * 9000));
      const effNid = form.nid?.trim() || ("1995" + Math.floor(100000000 + Math.random() * 900000000));
      const effBirthDate = form.birthDate || "1995-05-15";
      const effJoiningDate = form.joiningDate || new Date().toISOString().slice(0, 10);
      const effDepartmentId = form.departmentId || departments[0]?.uuid;
      const effDesignationId = form.designationId || designations[0]?.uuid;
      const effShiftId = form.shiftId || shifts[0]?.uuid;
      const effEmployeeTypeId = form.employeeTypeId || employeeTypes[0]?.uuid;
      const effUnderId = form.underId || unders[0]?.uuid;

      if (!effDepartmentId || !effDesignationId || !effShiftId || !effEmployeeTypeId || !effUnderId) {
        throw new Error("Department, Designation, Shift, Employee Type and Under are required.");
      }

      const payload: Record<string, any> = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        birthDate: effBirthDate,
        employeeCode: effEmployeeCode,
        grossSalary: Number(form.grossSalary) || 0,
        nid: effNid,
        joiningDate: effJoiningDate,
        leaveDate: form.leaveDate || undefined,
        maritalStatus: form.maritalStatus || "single",
        status: form.status || "active",
        
        unitId: form.unitId || undefined,
        sectionId: form.sectionId || undefined,
        departmentId: effDepartmentId,
        designationId: effDesignationId,
        salaryGradeId: form.salaryGradeId || undefined,
        shiftId: effShiftId,
        employeeTypeId: effEmployeeTypeId,
        underId: effUnderId,

        hasOtherInformation: !!form.hasOtherInformation,
        hasNomineeInformation: !!form.hasNomineeInformation,
        hasBankInformation: !!form.hasBankInformation,
      };

      if (form.hasNomineeInformation) {
        payload.nomineeName = form.nomineeName || form.name + " Nominee";
        payload.nomineePhone = form.nomineePhone || form.phone;
        payload.nomineeNid = form.nomineeNid || effNid;
      }

      if (form.hasBankInformation) {
        payload.bankName = form.bankName || "Islami Bank";
        payload.accountHolderName = form.accountHolderName || form.name;
        payload.accountNo = form.accountNo || "2050123456789";
        payload.branchName = form.branchName || "Dhanmondi";
        payload.swiftCode = form.swiftCode || "IBBLBDDH";
      }

      const url = initialData?.uuid 
        ? `${API_BASE}/realbizpro/api/v1/employee-list/${initialData.uuid}` 
        : `${API_BASE}/realbizpro/api/v1/employee-list`;
      const method = initialData?.uuid ? "PATCH" : "POST";

      const res = await fetch(url, { 
        method, 
        headers: getAuthHeaders(), 
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
            <div><label className="block text-xs font-medium mb-1">Code</label><input value={form.employeeCode} onChange={e => handleChange("employeeCode", e.target.value)} placeholder="EMP-001" className="w-full border p-2 rounded" /></div>
            <div><label className="block text-xs font-medium mb-1">Name <span className="text-rose-500">*</span></label><input value={form.name} onChange={e => handleChange("name", e.target.value)} placeholder="Enter Name" className="w-full border p-2 rounded" required /></div>
            <div><label className="block text-xs font-medium mb-1">Phone <span className="text-rose-500">*</span></label><input value={form.phone} onChange={e => handleChange("phone", e.target.value)} placeholder="Enter Phone" className="w-full border p-2 rounded" required /></div>
            <div><label className="block text-xs font-medium mb-1">Email <span className="text-rose-500">*</span></label><input type="email" value={form.email} onChange={e => handleChange("email", e.target.value)} placeholder="Enter Email" className="w-full border p-2 rounded" required /></div>
            <div><label className="block text-xs font-medium mb-1">Birth Date <span className="text-rose-500">*</span></label><input type="date" value={form.birthDate} onChange={e => handleChange("birthDate", e.target.value)} className="w-full border p-2 rounded" /></div>
            <div><label className="block text-xs font-medium mb-1">Department <span className="text-rose-500">*</span></label><SearchableSelect options={departments} value={form.departmentId} onChange={(v: string) => handleChange("departmentId", v)} /></div>
            <div><label className="block text-xs font-medium mb-1">Designation <span className="text-rose-500">*</span></label><SearchableSelect options={designations} value={form.designationId} onChange={(v: string) => handleChange("designationId", v)} /></div>
            <div><label className="block text-xs font-medium mb-1">Salary Grade</label><SearchableSelect options={salaryGrades} value={form.salaryGradeId} onChange={(v: string) => handleChange("salaryGradeId", v)} /></div>
            <div><label className="block text-xs font-medium mb-1">Gross Salary <span className="text-rose-500">*</span></label><input type="number" value={form.grossSalary} onChange={e => handleChange("grossSalary", e.target.value)} placeholder="Gross Salary" className="w-full border p-2 rounded" /></div>
            <div><label className="block text-xs font-medium mb-1">NID</label><input value={form.nid} onChange={e => handleChange("nid", e.target.value)} placeholder="NID" className="w-full border p-2 rounded" /></div>
            <div><label className="block text-xs font-medium mb-1">Joining Date <span className="text-rose-500">*</span></label><input type="date" value={form.joiningDate} onChange={e => handleChange("joiningDate", e.target.value)} className="w-full border p-2 rounded" /></div>
            <div><label className="block text-xs font-medium mb-1">Leave Date</label><input type="date" value={form.leaveDate} onChange={e => handleChange("leaveDate", e.target.value)} className="w-full border p-2 rounded" /></div>
            <div>
              <label className="block text-xs font-medium mb-1">Status</label>
              <PredictiveSearchSelect
                options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]}
                value={form.status}
                onChange={(v: string) => handleChange("status", v)}
                className="w-full"
              />
            </div>
            <div><label className="block text-xs font-medium mb-1">Shift <span className="text-rose-500">*</span></label><SearchableSelect options={shifts} value={form.shiftId} onChange={(v: string) => handleChange("shiftId", v)} /></div>
          </div>

          {/* UI-তে চেকবক্সগুলো */}
          <div className="flex flex-wrap items-center gap-4 border-t pt-4">
            <label className="flex items-center gap-2 cursor-pointer bg-blue-50 px-3 py-1.5 rounded-full"><input type="checkbox" checked={form.hasOtherInformation} onChange={e => handleChange("hasOtherInformation", e.target.checked)} /> Other Information</label>
            <label className="flex items-center gap-2 cursor-pointer bg-blue-50 px-3 py-1.5 rounded-full"><input type="checkbox" checked={form.hasNomineeInformation} onChange={e => handleChange("hasNomineeInformation", e.target.checked)} /> Nominee Information</label>
            <label className="flex items-center gap-2 cursor-pointer bg-blue-50 px-3 py-1.5 rounded-full"><input type="checkbox" checked={form.hasBankInformation} onChange={e => handleChange("hasBankInformation", e.target.checked)} /> Bank Information</label>
          </div>

          {form.hasOtherInformation && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t pt-4 bg-slate-50 p-4 rounded">
              <div><label className="block text-xs font-medium mb-1">Father Name</label><input value={form.fatherName} onChange={e => handleChange("fatherName", e.target.value)} className="w-full border p-2 rounded" /></div>
              <div><label className="block text-xs font-medium mb-1">Mother Name</label><input value={form.motherName} onChange={e => handleChange("motherName", e.target.value)} className="w-full border p-2 rounded" /></div>
              <div><label className="block text-xs font-medium mb-1">Spouse Name</label><input value={form.spouseName} onChange={e => handleChange("spouseName", e.target.value)} className="w-full border p-2 rounded" /></div>
              <div><label className="block text-xs font-medium mb-1">Religion</label><input value={form.religion} onChange={e => handleChange("religion", e.target.value)} className="w-full border p-2 rounded" /></div>
              <div>
                <label className="block text-xs font-medium mb-1">Gender</label>
                <PredictiveSearchSelect
                  options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }]}
                  value={form.gender}
                  onChange={(v: string) => handleChange("gender", v)}
                  className="w-full"
                />
              </div>
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