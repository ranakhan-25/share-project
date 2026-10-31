"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Edit3, Trash2, X, RotateCcw } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// =====================================================
// Types
// =====================================================
type FlatLandStatus = "Available" | "Sold" | "Booked" | "Deleted";
type ApiFlatLandStatus = Exclude<FlatLandStatus, "Deleted">;

interface FlatLandItem {
  uuid: string;
  project: string;
  site: string;
  flatLandNo: string;
  unit: string;
  bedroom: number;
  bathroom: number;
  size: string;
  price: number;
  subtotal: number;
  parkingCost: number;
  utilityCharge: number;
  grandTotal: number;
  customer: string;
  status: FlatLandStatus;
}

interface FlatLandFormData {
  project: string;
  site: string;
  flatLandNo: string;
  unit: string;
  bedroom: number;
  bathroom: number;
  size: string;
  price: number;
  parkingCost: number;
  utilityCharge: number;
  customer: string;
  status: ApiFlatLandStatus;
}

interface ApiFlatLand {
  uuid?: string;
  id?: string | number;
  _id?: string;
  projectName?: string;
  project_name?: string;
  project?: string;
  siteBlock?: string;
  site_block?: string;
  site?: string;
  flatLandNo?: string;
  flat_land_no?: string;
  unit?: string;
  bedroom?: number | string | null;
  bathroom?: number | string | null;
  size?: string | number | null;
  pricePerUnit?: number | string | null;
  price_per_unit?: number | string | null;
  price?: number | string | null;
  parkingCost?: number | string | null;
  parking_cost?: number | string | null;
  utilityCharge?: number | string | null;
  utility_charge?: number | string | null;
  customerName?: string;
  customer_name?: string;
  customer?: string;
  status?: ApiFlatLandStatus;
  subtotal?: number | string | null;
  grandTotal?: number | string | null;
  grand_total?: number | string | null;
}

interface ApiResponse {
  data?: unknown;
  result?: unknown;
  message?: string | string[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";

export default function FlatLandPage() {
  const [items, setItems] = useState<FlatLandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUuid, setCurrentUuid] = useState<string | null>(null);

  // Form
  const [formData, setFormData] = useState<FlatLandFormData>({
    project: "",
    site: "",
    flatLandNo: "",
    unit: "",
    bedroom: 0,
    bathroom: 0,
    size: "",
    price: 0,
    parkingCost: 0,
    utilityCharge: 0,
    customer: "",
    status: "Available" as "Available" | "Sold" | "Booked",
  });

  // =====================================================
  // Fetch All
  // =====================================================
  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/realbizpro/api/v1/flat-land`);
      if (!res.ok) throw new Error("Failed to fetch flat/land data");

      const data = await res.json();

      const response = data as ApiResponse & { data?: unknown };
      let list: ApiFlatLand[] = [];

      if (Array.isArray(data)) {
        list = data as ApiFlatLand[];
      } else if (Array.isArray(response.data)) {
        list = response.data as ApiFlatLand[];
      } else if (
        response.data &&
        typeof response.data === "object" &&
        Array.isArray((response.data as { data?: unknown }).data)
      ) {
        list = (response.data as { data: ApiFlatLand[] }).data;
      } else if (Array.isArray(response.result)) {
        list = response.result as ApiFlatLand[];
      }

      const mapped: FlatLandItem[] = list.map((item) => {
        const price = Number(item.pricePerUnit ?? item.price_per_unit ?? item.price ?? 0);
        const parkingCost = Number(item.parkingCost ?? item.parking_cost ?? 0);
        const utilityCharge = Number(item.utilityCharge ?? item.utility_charge ?? 0);
        const numericSize = parseFloat(String(item.size ?? 0)) || 0;
        const subtotal = Number(item.subtotal ?? price * numericSize);
        const grandTotal = Number(item.grandTotal ?? item.grand_total ?? subtotal + parkingCost + utilityCharge);

        return {
          uuid: String(item.uuid ?? item.id ?? item._id ?? ""),
          project: item.projectName ?? item.project_name ?? item.project ?? "",
          site: item.siteBlock ?? item.site_block ?? item.site ?? "",
          flatLandNo: item.flatLandNo || item.flat_land_no || "",
          unit: item.unit || "",
          bedroom: Number(item.bedroom ?? 0),
          bathroom: Number(item.bathroom ?? 0),
          size: String(item.size ?? ""),
          price,
          subtotal,
          parkingCost,
          utilityCharge,
          grandTotal,
          customer: item.customerName ?? item.customer_name ?? item.customer ?? "N/A",
          status: (item.status || "Available") as FlatLandStatus,
        };
      });

      setItems(mapped);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load Flat/Land data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // =====================================================
  // Input Change
  // =====================================================
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const numericFields = [
      "bedroom",
      "bathroom",
      "price",
      "parkingCost",
      "utilityCharge",
    ];

    setFormData((previous) => {
      if (numericFields.includes(name)) {
        const numericValue = value === "" ? 0 : Number(value);

        switch (name) {
          case "bedroom":
            return { ...previous, bedroom: numericValue };
          case "bathroom":
            return { ...previous, bathroom: numericValue };
          case "price":
            return { ...previous, price: numericValue };
          case "parkingCost":
            return { ...previous, parkingCost: numericValue };
          case "utilityCharge":
            return { ...previous, utilityCharge: numericValue };
          default:
            return previous;
        }
      }

      switch (name) {
        case "project":
          return { ...previous, project: value };
        case "site":
          return { ...previous, site: value };
        case "flatLandNo":
          return { ...previous, flatLandNo: value };
        case "unit":
          return { ...previous, unit: value };
        case "size":
          return { ...previous, size: value };
        case "customer":
          return { ...previous, customer: value };
        case "status":
          return {
            ...previous,
            status: value as ApiFlatLandStatus,
          };
        default:
          return previous;
      }
    });
  };

  // =====================================================
  // Open Add Modal
  // =====================================================
  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setCurrentUuid(null);
    setFormData({
      project: "",
      site: "",
      flatLandNo: "",
      unit: "",
      bedroom: 0,
      bathroom: 0,
      size: "",
      price: 0,
      parkingCost: 0,
      utilityCharge: 0,
      customer: "",
      status: "Available",
    });
    setIsModalOpen(true);
  };

  // =====================================================
  // Open Edit Modal
  // =====================================================
  const handleEdit = (item: FlatLandItem) => {
    setIsEditMode(true);
    setCurrentUuid(item.uuid);
    setFormData({
      project: item.project,
      site: item.site,
      flatLandNo: item.flatLandNo,
      unit: item.unit,
      bedroom: item.bedroom,
      bathroom: item.bathroom,
      size: item.size,
      price: item.price,
      parkingCost: item.parkingCost,
      utilityCharge: item.utilityCharge,
      customer: item.customer === "N/A" ? "" : item.customer,
      status: item.status as any,
    });
    setIsModalOpen(true);
  };

  // =====================================================
  // Soft Delete
  // =====================================================
  const handleDelete = async (uuid: string) => {
    if (!confirm("Are you sure you want to soft-delete this item?")) return;

    try {
      const res = await fetch(`${API_BASE}/realbizpro/api/v1/flat-land/${uuid}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      toast.success("Item soft-deleted successfully");
      await fetchItems();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete item");
    }
  };

  // =====================================================
  // Restore
  // =====================================================
  const handleRestore = async (uuid: string) => {
    try {
      const res = await fetch(`${API_BASE}/realbizpro/api/v1/flat-land/${uuid}/restore`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Restore failed");

      toast.success("Item restored successfully");
      await fetchItems();
    } catch (err) {
      console.error(err);
      toast.error("Failed to restore item");
    }
  };

  // =====================================================
  // Submit (Create / Update)
  // =====================================================
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project.trim() || !formData.flatLandNo.trim()) {
      toast.error("Project Name and Flat/Land No are required");
      return;
    }

    setSaving(true);

    const numericSize = parseFloat(formData.size) || 0;
    const subtotal = formData.price * numericSize;
    const grandTotal = subtotal + formData.parkingCost + formData.utilityCharge;

    // Match the backend CreateFlatLandDto field names exactly.
    // subtotal and grandTotal are calculated for display only because
    // the current FlatLand model/DTO does not define those database fields.
    const payload = {
      projectName: formData.project.trim(),
      siteBlock: formData.site.trim() || undefined,
      flatLandNo: formData.flatLandNo.trim(),
      unit: formData.unit.trim() || undefined,
      bedroom: Number(formData.bedroom),
      bathroom: Number(formData.bathroom),
      size: formData.size.trim() || undefined,
      pricePerUnit: Number(formData.price),
      parkingCost: Number(formData.parkingCost),
      utilityCharge: Number(formData.utilityCharge),
      customerName: formData.customer.trim() || "N/A",
      status: formData.status,
    };

    try {
      let res: Response;

      if (isEditMode && currentUuid) {
        res = await fetch(`${API_BASE}/realbizpro/api/v1/flat-land/${currentUuid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/realbizpro/api/v1/flat-land`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errorBody = (await res.json().catch(() => ({}))) as ApiResponse;
        const message = Array.isArray(errorBody.message)
          ? errorBody.message.join(", ")
          : errorBody.message || "Failed to save";
        throw new Error(message);
      }

      toast.success(isEditMode ? "Updated successfully!" : "Created successfully!");
      setIsModalOpen(false);
      await fetchItems();
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // Search Filter
  // =====================================================
  const filteredItems = items.filter(
    (item) =>
      item.flatLandNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Simple client-side pagination
  const displayedItems = filteredItems.slice(0, entriesPerPage);

  return (
    <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Toast Container */}
      <Toaster position="top-right" reverseOrder={false} />

      {/* Top Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => setEntriesPerPage(Number(e.target.value))}
            className="border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs w-full md:w-64 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            />
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1 px-4 py-2 bg-[#655bea] text-white text-xs font-bold rounded-lg hover:bg-[#534ac7] transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />Flat/Land Add
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#655bea] text-white font-bold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">SL</th>
                <th className="px-3.5 py-3">Project</th>
                <th className="px-3.5 py-3">Site</th>
                <th className="px-3.5 py-3">Flat/Land No</th>
                <th className="px-3.5 py-3">Unit</th>
                <th className="px-3.5 py-3">Bedroom</th>
                <th className="px-3.5 py-3">Bathroom</th>
                <th className="px-3.5 py-3">Size</th>
                <th className="px-3.5 py-3">Price</th>
                <th className="px-3.5 py-3">Subtotal</th>
                <th className="px-3.5 py-3">Parking Cost</th>
                <th className="px-3.5 py-3">Utility Charge</th>
                <th className="px-3.5 py-3">Grand Total</th>
                <th className="px-3.5 py-3">Customer</th>
                <th className="px-3.5 py-3">Status</th>
                <th className="px-3.5 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={16} className="px-4 py-10 text-center text-slate-400">
                    Loading data...
                  </td>
                </tr>
              ) : displayedItems.length > 0 ? (
                displayedItems.map((item, index) => (
                  <tr key={item.uuid} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3.5 py-3 text-slate-500 font-semibold">{index + 1}</td>
                    <td className="px-3.5 py-3 font-semibold text-slate-900">{item.project}</td>
                    <td className="px-3.5 py-3">{item.site}</td>
                    <td className="px-3.5 py-3 font-bold text-indigo-600">{item.flatLandNo}</td>
                    <td className="px-3.5 py-3">{item.unit}</td>
                    <td className="px-3.5 py-3">{item.bedroom}</td>
                    <td className="px-3.5 py-3">{item.bathroom}</td>
                    <td className="px-3.5 py-3">{item.size}</td>
                    <td className="px-3.5 py-3">{item.price.toLocaleString()}</td>
                    <td className="px-3.5 py-3">{item.subtotal.toLocaleString()}</td>
                    <td className="px-3.5 py-3">{item.parkingCost.toLocaleString()}</td>
                    <td className="px-3.5 py-3">{item.utilityCharge.toLocaleString()}</td>
                    <td className="px-3.5 py-3 font-bold text-slate-900">
                      {item.grandTotal.toLocaleString()}
                    </td>
                    <td className="px-3.5 py-3">{item.customer}</td>
                    <td className="px-3.5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === "Available"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.status === "Booked"
                            ? "bg-amber-100 text-amber-700"
                            : item.status === "Sold"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        {item.status === "Deleted" ? (
                          <button
                            onClick={() => handleRestore(item.uuid)}
                            className="p-1 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded transition-colors"
                            title="Restore"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDelete(item.uuid)}
                            className="p-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded transition-colors"
                            title="Soft Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={16} className="px-4 py-8 text-center text-slate-400">
                    No data available in table
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing 1 to {displayedItems.length} of {filteredItems.length} entries
          </div>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50">
              Previous
            </button>
            <button className="px-3 py-1.5 border border-slate-200 rounded bg-white hover:bg-slate-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 my-8">
            <div className="px-6 py-4 bg-[#655bea] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {isEditMode ? "Edit Flat / Land" : "Add New Flat / Land"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:bg-white/20 p-1 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Project Name</label>
                  <input
                    type="text"
                    name="project"
                    required
                    value={formData.project}
                    onChange={handleInputChange}
                    placeholder="e.g. Rifat Eyecon City"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Site / Block</label>
                  <input
                    type="text"
                    name="site"
                    required
                    value={formData.site}
                    onChange={handleInputChange}
                    placeholder="e.g. Block A"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Flat/Land No</label>
                  <input
                    type="text"
                    name="flatLandNo"
                    required
                    value={formData.flatLandNo}
                    onChange={handleInputChange}
                    placeholder="e.g. FL-302"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Unit</label>
                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    placeholder="e.g. B-3"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Bedroom</label>
                  <input
                    type="number"
                    name="bedroom"
                    value={formData.bedroom}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Bathroom</label>
                  <input
                    type="number"
                    name="bathroom"
                    value={formData.bathroom}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Size</label>
                  <input
                    type="text"
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    placeholder="e.g. 1450 Sqft"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Price (per unit)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Parking Cost</label>
                  <input
                    type="number"
                    name="parkingCost"
                    value={formData.parkingCost}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Utility Charge</label>
                  <input
                    type="number"
                    name="utilityCharge"
                    value={formData.utilityCharge}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Customer Name</label>
                  <input
                    type="text"
                    name="customer"
                    value={formData.customer}
                    onChange={handleInputChange}
                    placeholder="Customer Name or N/A"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Available">Available</option>
                    <option value="Booked">Booked</option>
                    <option value="Sold">Sold</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#655bea] text-white rounded-lg text-xs font-bold hover:bg-[#534ac7] transition-colors shadow-sm disabled:opacity-60"
                >
                  {saving ? "Saving..." : isEditMode ? "Update Changeses" : "Save Flat/Land"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}