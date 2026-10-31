"use client";

import React, { useState, useEffect } from "react";
import { Trash2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

// =====================================================
// Types
// =====================================================
interface ProjectDetailsForm {
  uuid?: string;
  areaOfLand: string;
  nameOfLandOwner: string;
  landOwnerDeveloperRatio: string;
  valueOfLand: string;
  buildArea: string;
  totalNoOfBuilding: string;
  totalFloorOfBuilding: string;
  noOfFlatInEachFloor: string;
  totalFlatInTheBuilding: string;
  flatSize: string;
  totalNoOfCarParking: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";

export default function DetailsPage() {
  const [formData, setFormData] = useState<ProjectDetailsForm>({
    areaOfLand: "",
    nameOfLandOwner: "",
    landOwnerDeveloperRatio: "",
    valueOfLand: "",
    buildArea: "",
    totalNoOfBuilding: "",
    totalFloorOfBuilding: "",
    noOfFlatInEachFloor: "",
    totalFlatInTheBuilding: "",
    flatSize: "",
    totalNoOfCarParking: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false); // soft-deleted state

  // =====================================================
  // Fetch Details
  // =====================================================
  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/realbizpro/api/v1/details`);
      if (!res.ok) throw new Error("Failed to fetch details");

      const data = await res.json();

      // Robust extraction
      let item: any = null;
      if (Array.isArray(data)) {
        item = data[0];
      } else if (Array.isArray(data?.data)) {
        item = data.data[0];
      } else if (Array.isArray(data?.data?.data)) {
        item = data.data.data[0];
      } else if (data?.data && typeof data.data === "object") {
        item = data.data;
      } else if (data && typeof data === "object" && (data.uuid || data.id)) {
        item = data;
      }

      if (item) {
        setFormData({
          uuid: item.uuid || item.id,
          areaOfLand: item.areaOfLand || item.area_of_land || "",
          nameOfLandOwner: item.nameOfLandOwner || item.name_of_land_owner || "",
          landOwnerDeveloperRatio:
            item.landOwnerDeveloperRatio || item.land_owner_developer_ratio || "",
          valueOfLand: item.valueOfLand || item.value_of_land || "",
          buildArea: item.buildArea || item.build_area || "",
          totalNoOfBuilding: item.totalNoOfBuilding || item.total_no_of_building || "",
          totalFloorOfBuilding:
            item.totalFloorOfBuilding || item.total_floor_of_building || "",
          noOfFlatInEachFloor:
            item.noOfFlatInEachFloor || item.no_of_flat_in_each_floor || "",
          totalFlatInTheBuilding:
            item.totalFlatInTheBuilding || item.total_flat_in_the_building || "",
          flatSize: item.flatSize || item.flat_size || "",
          totalNoOfCarParking:
            item.totalNoOfCarParking || item.total_no_of_car_parking || "",
        });

        // soft-delete check (common field names)
        const status = (item.status || "").toLowerCase();
        setIsDeleted(status === "deleted" || status === "inactive" || item.deletedAt);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  // =====================================================
  // Handle Input Change
  // =====================================================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // =====================================================
  // Create / Update
  // =====================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Only send the form fields (no extra properties)
    const payload = {
      areaOfLand: formData.areaOfLand,
      nameOfLandOwner: formData.nameOfLandOwner,
      landOwnerDeveloperRatio: formData.landOwnerDeveloperRatio,
      valueOfLand: formData.valueOfLand,
      buildArea: formData.buildArea,
      totalNoOfBuilding: formData.totalNoOfBuilding,
      totalFloorOfBuilding: formData.totalFloorOfBuilding,
      noOfFlatInEachFloor: formData.noOfFlatInEachFloor,
      totalFlatInTheBuilding: formData.totalFlatInTheBuilding,
      flatSize: formData.flatSize,
      totalNoOfCarParking: formData.totalNoOfCarParking,
    };

    try {
      let res: Response;

      if (formData.uuid) {
        // UPDATE
        res = await fetch(`${API_BASE}/realbizpro/api/v1/details/${formData.uuid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // CREATE
        res = await fetch(`${API_BASE}/realbizpro/api/v1/details`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || JSON.stringify(err) || "Failed to save details");
      }

      await fetchDetails(); // refresh
      toast.success(
        formData.uuid
          ? "Project details updated successfully"
          : "Project details created successfully"
      );
    } catch (error) {
      console.error("Error saving details:", error);
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // Soft Delete
  // =====================================================
  const handleDelete = async () => {
    if (!formData.uuid) return;
    if (!confirm("Are you sure you want to soft-delete these details?")) return;

    try {
      const res = await fetch(`${API_BASE}/realbizpro/api/v1/details/${formData.uuid}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");
      setIsDeleted(true);
      toast.success("Project details soft-deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to delete details");
    }
  };

  // =====================================================
  // Restore
  // =====================================================
  const handleRestore = async () => {
    if (!formData.uuid) return;

    try {
      const res = await fetch(
        `${API_BASE}/realbizpro/api/v1/details/${formData.uuid}/restore`,
        {
          method: "POST", // according to your API docs
        }
      );

      if (!res.ok) throw new Error("Failed to restore");
      setIsDeleted(false);
      toast.success("Project details restored successfully");
      await fetchDetails();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to restore details");
    }
  };

  // =====================================================
  // Render
  // =====================================================
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-400 text-sm">
          Loading project details...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-800">
            {formData.uuid ? "Edit Project Details" : "Add Project Details"}
          </h2>

          {formData.uuid && (
            <div className="flex items-center gap-2">
              {isDeleted ? (
                <button
                  type="button"
                  onClick={handleRestore}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                >
                  <RotateCcw size={14} /> Restore
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                >
                  <Trash2 size={14} /> Soft Delete
                </button>
              )}
            </div>
          )}
        </div>

        {isDeleted && (
          <div className="mb-5 px-4 py-2.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg">
            These details are currently soft-deleted. You can restore them.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Area Of Land */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Area Of Land</label>
              <input
                type="text"
                name="areaOfLand"
                value={formData.areaOfLand}
                onChange={handleChange}
                placeholder="Enter Land Area"
                disabled={isDeleted}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            {/* Name Of Land Owner */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Name Of Land Owner</label>
              <input
                type="text"
                name="nameOfLandOwner"
                value={formData.nameOfLandOwner}
                onChange={handleChange}
                placeholder="Enter Land Owner Name"
                disabled={isDeleted}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            {/* Land Owner/Developer Ratio */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Land Owner/Developer Ratio</label>
              <input
                type="text"
                name="landOwnerDeveloperRatio"
                value={formData.landOwnerDeveloperRatio}
                onChange={handleChange}
                placeholder="Enter Ratio"
                disabled={isDeleted}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            {/* Value Of Land */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Value Of Land</label>
              <input
                type="text"
                name="valueOfLand"
                value={formData.valueOfLand}
                onChange={handleChange}
                placeholder="Enter Value"
                disabled={isDeleted}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            {/* Build Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Build Area</label>
              <input
                type="text"
                name="buildArea"
                value={formData.buildArea}
                onChange={handleChange}
                placeholder="Enter Build Area"
                disabled={isDeleted}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            {/* Total No. Of Building */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Total No. Of Building</label>
              <input
                type="text"
                name="totalNoOfBuilding"
                value={formData.totalNoOfBuilding}
                onChange={handleChange}
                placeholder="Enter Total Buildings"
                disabled={isDeleted}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            {/* Total floor Of building */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Total floor Of building</label>
              <input
                type="text"
                name="totalFloorOfBuilding"
                value={formData.totalFloorOfBuilding}
                onChange={handleChange}
                placeholder="Enter Total Floors"
                disabled={isDeleted}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            {/* No. of flat in each floor */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">No. of flat in each floor</label>
              <input
                type="text"
                name="noOfFlatInEachFloor"
                value={formData.noOfFlatInEachFloor}
                onChange={handleChange}
                placeholder="Enter Flats per Floor"
                disabled={isDeleted}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            {/* Total Flat in the building */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Total Flat in the building</label>
              <input
                type="text"
                name="totalFlatInTheBuilding"
                value={formData.totalFlatInTheBuilding}
                onChange={handleChange}
                placeholder="Total Flat of the building"
                disabled={isDeleted}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            {/* Flat Size */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Flat Size</label>
              <input
                type="text"
                name="flatSize"
                value={formData.flatSize}
                onChange={handleChange}
                placeholder="Flat Size"
                disabled={isDeleted}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            {/* Total No. of car parking */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Total No. of car parking</label>
              <input
                type="text"
                name="totalNoOfCarParking"
                value={formData.totalNoOfCarParking}
                onChange={handleChange}
                placeholder="Total No. of car parking"
                disabled={isDeleted}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
          </div>

          {/* Submit Button */}
          {!isDeleted && (
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#655bea] text-white text-xs font-bold rounded-lg hover:bg-[#534ac7] transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? "Saving..." : formData.uuid ? "Update Details" : "Submit"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}