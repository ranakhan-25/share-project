/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// ---------- Types ----------
interface ProjectDetails {
  uuid?: string;
  uid: string;
  areaOfLand: string;
  nameOfLandOwner: string;
  landOwnerDeveloperRatio: string;
  valueOfLand: string;
  buildArea: string;
  totalNoOfBuilding: number | string;
  totalFloorOfBuilding: number | string;
  noOfFlatInEachFloor: number | string;
  totalFlatInTheBuilding: number | string;
  flatSize: string;
  totalNoOfCarParking: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export default function DetailsPage() {
  const { uuid } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const [form, setForm] = useState<ProjectDetails>({
    uid: "string",
    areaOfLand: "",
    nameOfLandOwner: "",
    landOwnerDeveloperRatio: "",
    valueOfLand: "",
    buildArea: "",
    totalNoOfBuilding: 0,
    totalFloorOfBuilding: 0,
    noOfFlatInEachFloor: 0,
    totalFlatInTheBuilding: 0,
    flatSize: "",
    totalNoOfCarParking: "",
  });

  // ====================== FETCH DETAILS ======================
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/realbizpro/api/v1/details?projectId=${uuid}`);
        const json = await res.json();

        if (json.success && json.data.data && json.data.data.length > 0) {
          const existingData = json.data.data[0];
          setDetailsId(existingData.uuid);
          setForm({
            uid: existingData.uid || "string",
            areaOfLand: existingData.areaOfLand || "",
            nameOfLandOwner: existingData.nameOfLandOwner || "",
            landOwnerDeveloperRatio: existingData.landOwnerDeveloperRatio || "",
            valueOfLand: existingData.valueOfLand || "",
            buildArea: existingData.buildArea || "",
            totalNoOfBuilding: existingData.totalNoOfBuilding || 0,
            totalFloorOfBuilding: existingData.totalFloorOfBuilding || 0,
            noOfFlatInEachFloor: existingData.noOfFlatInEachFloor || 0,
            totalFlatInTheBuilding: existingData.totalFlatInTheBuilding || 0,
            flatSize: existingData.flatSize || "",
            totalNoOfCarParking: existingData.totalNoOfCarParking || "",
          });
        }
      } catch (err) {
        console.error("Error fetching details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (uuid) fetchDetails();
  }, [uuid]);

  // ====================== SUBMIT (POST / PUT) ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // ✅ projectId বাদ দেওয়া হলো
    const payload = {
      uid: form.uid,
      areaOfLand: form.areaOfLand,
      nameOfLandOwner: form.nameOfLandOwner,
      landOwnerDeveloperRatio: form.landOwnerDeveloperRatio,
      valueOfLand: form.valueOfLand,
      buildArea: form.buildArea,
      totalNoOfBuilding: Number(form.totalNoOfBuilding),
      totalFloorOfBuilding: Number(form.totalFloorOfBuilding),
      noOfFlatInEachFloor: Number(form.noOfFlatInEachFloor),
      totalFlatInTheBuilding: Number(form.totalFlatInTheBuilding),
      flatSize: form.flatSize,
      totalNoOfCarParking: form.totalNoOfCarParking,
    };

    try {
      const isUpdate = !!detailsId;
      const url = isUpdate
        ? `${API_BASE}/realbizpro/api/v1/details/${detailsId}`
        : `${API_BASE}/realbizpro/api/v1/details`;

      const method = isUpdate ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok || json.success) {
        toast.success(isUpdate ? "Details updated successfully!" : "Details saved successfully!");
        if (!isUpdate && json.data?.uuid) {
          setDetailsId(json.data.uuid);
        }
      } else {
        toast.error(json.message || "Failed to save details");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Network Error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 flex justify-center">
      <div className="bg-white p-6 rounded-lg shadow-sm border w-full max-w-4xl">
        <h2 className="text-lg font-bold mb-6 text-gray-800">Add/Edit Project Details</h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Area Of Land</label>
              <input
                type="text"
                placeholder="Enter Land Area"
                value={form.areaOfLand}
                onChange={(e) => setForm({ ...form, areaOfLand: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Name Of Land Owner</label>
              <input
                type="text"
                placeholder="Enter Land Owner Name"
                value={form.nameOfLandOwner}
                onChange={(e) => setForm({ ...form, nameOfLandOwner: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Land Owner/Developer Ratio</label>
              <input
                type="text"
                placeholder="Enter Ratio"
                value={form.landOwnerDeveloperRatio}
                onChange={(e) => setForm({ ...form, landOwnerDeveloperRatio: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Value Of Land</label>
              <input
                type="text"
                placeholder="Enter Ratio"
                value={form.valueOfLand}
                onChange={(e) => setForm({ ...form, valueOfLand: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Build Area</label>
              <input
                type="text"
                placeholder="Enter Ratio"
                value={form.buildArea}
                onChange={(e) => setForm({ ...form, buildArea: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Total No. Of Building</label>
              <input
                type="number"
                placeholder="Enter Ratio"
                value={form.totalNoOfBuilding}
                onChange={(e) => setForm({ ...form, totalNoOfBuilding: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Total floor Of building</label>
              <input
                type="number"
                placeholder="Enter Ratio"
                value={form.totalFloorOfBuilding}
                onChange={(e) => setForm({ ...form, totalFloorOfBuilding: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">No. of flat in each floor</label>
              <input
                type="number"
                placeholder="Enter Ratio"
                value={form.noOfFlatInEachFloor}
                onChange={(e) => setForm({ ...form, noOfFlatInEachFloor: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Total Flat in the building</label>
              <input
                type="number"
                placeholder="Total Flat of the building"
                value={form.totalFlatInTheBuilding}
                onChange={(e) => setForm({ ...form, totalFlatInTheBuilding: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Flat Size</label>
              <input
                type="text"
                placeholder="Flat Size"
                value={form.flatSize}
                onChange={(e) => setForm({ ...form, flatSize: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Total No. of car parking</label>
              <input
                type="text"
                placeholder="Total No. of car parking"
                value={form.totalNoOfCarParking}
                onChange={(e) => setForm({ ...form, totalNoOfCarParking: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded text-sm font-medium disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}