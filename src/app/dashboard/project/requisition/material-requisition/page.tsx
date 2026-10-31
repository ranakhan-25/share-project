/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prettier/prettier */
"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  ChevronRight,
  Home,
  X,
  Save,
  FileSpreadsheet,
  FileText,
  ArrowRightLeft,
  Layers,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  Paperclip,
  Calendar,
  Loader2,
} from "lucide-react";

// ==================== TYPES ====================
export interface MaterialRequisitionItem {
  id: string;
  uuid?: string;
  projectId?: string;
  select: boolean;
  date: string;
  demandDate: string;
  code: string;
  ref: string;
  projectType: string;
  project: string;
  titleNameOfWork: string;
  ifTask: string;
  site: string;
  siteId?: string;
  category: string;
  categoryId?: string;
  note: string;
  addedBy: string;
  approvalLayer: string;
  attachment: string | null;
  createdBy: string;
  updatedBy: string;
  status: string;
  items?: MaterialBoqItem[];
}

export interface MaterialBoqItem {
  id?: string;
  uuid?: string;
  materialRequisitionId?: string;
  itemCode: string;
  itemName: string;
  details: string;
  unit: string;
  budgetQty: number;
  alreadyPurchaseQty: number;
  availableQty: number;
  demandQty: number;
  stock: number;
  createdBy?: string;
  updatedBy?: string;
}

interface ProjectOption {
  uuid: string;
  name: string;
}

interface RelatedOption {
  uuid: string;
  name: string;
  projectId?: string;
}

// ==================== API CONFIG ====================
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"}/realbizpro/api/v1`
).replace(/\/+$/, "");

const REQUISITION_API = `${API_BASE_URL}/material-requisition`;
const PROJECT_API = `${API_BASE_URL}/project`;
const SITE_API = `${API_BASE_URL}/project-sites`;
const CATEGORY_API = `${API_BASE_URL}/category`;
const PROJECT_TYPE_API = `${API_BASE_URL}/project-type`;
const WORK_ORDER_API = `${API_BASE_URL}/project-billing/service-work-names`;
const TASK_API = `${API_BASE_URL}/task`;

// ==================== HELPERS ====================
const formatDisplayDate = (d: string | null | undefined) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

const toYMD = (val?: string | null) => {
  if (!val) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  try {
    const date = new Date(val);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

const generateCode = () =>
  `REC${String(Math.floor(10000 + Math.random() * 90000)).padStart(5, "0")}`;

let boqIdCounter = 0;
const generateRowId = () => {
  boqIdCounter += 1;
  return `boq_${Date.now()}_${boqIdCounter}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const emptyBoqRow = (): MaterialBoqItem => ({
  id: generateRowId(),
  itemCode: "",
  itemName: "",
  details: "",
  unit: "Nos",
  budgetQty: 0,
  alreadyPurchaseQty: 0,
  availableQty: 0,
  demandQty: 0,
  stock: 0,
});

// ==================== GENERIC OPTIONS FETCHER ====================
async function fetchRelatedOptions(
  endpoint: string,
  label: string,
): Promise<RelatedOption[]> {
  const query = new URLSearchParams({ page: "1", limit: "100" });
  const res = await fetch(`${endpoint}?${query}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `Failed to fetch ${label}: ${res.status}`);
  }
  const json = await res.json();
  const rows =
    json?.data?.data ??
    (Array.isArray(json?.data) ? json.data : null) ??
    json?.rows ??
    json?.items ??
    [];
  return Array.isArray(rows)
    ? rows
        .filter((row: any) => row?.uuid)
        .map((row: any) => ({
          uuid: String(row.uuid),
          name: String(
            row.name ||
              row.title ||
              row.workOrderName ||
              row.taskName ||
              row.titleName ||
              row.typeName ||
              row.siteName ||
              row.categoryName ||
              row.code ||
              "Unnamed",
          ),
          projectId: row.projectId ? String(row.projectId) : undefined,
        }))
    : [];
}

// ==================== API FUNCTIONS ====================
async function fetchRequisitions(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ data: MaterialRequisitionItem[]; meta: any }> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 100;
  const search = params?.search ?? "";

  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) query.append("search", search);

  const res = await fetch(`${REQUISITION_API}?${query}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.message || `Failed to fetch requisitions: ${res.status}`,
    );
  }

  const json = await res.json();
  const rawData = json?.data?.data || json?.data || [];

  const mapped: MaterialRequisitionItem[] = rawData.map((item: any) => ({
    id: String(item.id ?? item.uuid),
    uuid: item.uuid,
    projectId: item.projectId || item.project?.uuid || "",
    select: false,
    date: formatDisplayDate(item.date),
    demandDate: formatDisplayDate(item.demandDate),
    code: item.code || "",
    ref: item.ref || "",
    projectType: item.projectType || "",
    project: item.project?.name || item.project || "",
    titleNameOfWork: item.titleNameOfWork || "",
    ifTask: item.ifTask || "",
    site: item.site?.name || item.site || "",
    siteId: item.siteId || item.site?.uuid || "",
    category: item.category?.name || item.category || "",
    categoryId: item.categoryId || item.category?.uuid || "",
    note: item.note || "",
    addedBy: item.addedBy || item.createdBy || "Admin",
    approvalLayer: item.approvalLayer || "Pending",
    attachment: item.attachment || null,
    createdBy: item.createdBy || "",
    updatedBy: item.updatedBy || "",
    status: item.status || "pending",
    items: Array.isArray(item.items)
      ? item.items.map((child: any) => ({
          id: child.id || generateRowId(),
          uuid: child.uuid,
          materialRequisitionId: child.materialRequisitionId,
          itemCode: child.itemCode || "",
          itemName: child.itemName || "",
          details: child.details || "",
          unit: child.unit || "",
          budgetQty: Number(child.budgetQty || 0),
          alreadyPurchaseQty: Number(child.alreadyPurchaseQty || 0),
          availableQty: Number(child.availableQty || 0),
          demandQty: Number(child.demandQty || 0),
          stock: Number(child.stock || 0),
          createdBy: child.createdBy || "",
          updatedBy: child.updatedBy || "",
        }))
      : [],
  }));

  return { data: mapped, meta: json?.data?.meta || {} };
}

async function fetchProjects(): Promise<ProjectOption[]> {
  const query = new URLSearchParams({ page: "1", limit: "100" });
  const res = await fetch(`${PROJECT_API}?${query}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `Failed to fetch projects: ${res.status}`);
  }

  const json = await res.json();
  const rows = json?.data?.data ?? json?.data ?? [];
  return Array.isArray(rows)
    ? rows
        .filter((project: any) => project?.uuid && project?.name)
        .map((project: any) => ({
          uuid: String(project.uuid),
          name: String(project.name),
        }))
    : [];
}

async function fetchRequisitionById(uuid: string) {
  const res = await fetch(`${REQUISITION_API}/${uuid}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.message || `Failed to fetch requisition: ${res.status}`,
    );
  }
  return res.json();
}

async function createRequisition(payload: Record<string, any>) {
  const res = await fetch(REQUISITION_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Create requisition failed");
  }
  return res.json();
}

async function updateRequisition(uuid: string, payload: Record<string, any>) {
  const res = await fetch(`${REQUISITION_API}/${uuid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Update requisition failed");
  }
  return res.json();
}

async function softDeleteRequisition(uuid: string) {
  const res = await fetch(`${REQUISITION_API}/${uuid}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Delete requisition failed");
  }
  return res.json();
}

// ==================== MAIN PAGE ====================
export default function MaterialRequisitionPage() {
  const [requisitions, setRequisitions] = useState<MaterialRequisitionItem[]>(
    [],
  );
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [sites, setSites] = useState<RelatedOption[]>([]);
  const [sitesError, setSitesError] = useState<string | null>(null);
  const [categories, setCategories] = useState<RelatedOption[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [projectTypes, setProjectTypes] = useState<RelatedOption[]>([]);
  const [projectTypesError, setProjectTypesError] = useState<string | null>(
    null,
  );
  const [workOrders, setWorkOrders] = useState<RelatedOption[]>([]);
  const [workOrdersError, setWorkOrdersError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<RelatedOption[]>([]);
  const [tasksError, setTasksError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [selectAll, setSelectAll] = useState(false);

  const [dateFilter, setDateFilter] = useState(
    "1 October, 2026 - 31 October, 2026",
  );
  const [companyFilter, setCompanyFilter] = useState("Somikoron IT Ltd");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [titleFilter, setTitleFilter] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] =
    useState<MaterialRequisitionItem | null>(null);

  // ==================== FORM DATA ====================
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    demandDate: "",
    code: generateCode(),
    ref: "",
    projectType: "",
    project: "",
    titleNameOfWork: "",
    ifTask: "",
    site: "",
    category: "",
    note: "",
    addedBy: "Admin",
    createdBy: "Admin",
    updatedBy: "Admin",
    attachment: "",
  });

  // ==================== BOQ ITEMS ====================
  const [boqItems, setBoqItems] = useState<MaterialBoqItem[]>([emptyBoqRow()]);

  // ==================== LOAD DATA ====================
  const loadRequisitions = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await fetchRequisitions({
        page: 1,
        limit: 100,
        search: searchQuery || undefined,
      });
      setRequisitions(data);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to load material requisitions";
      console.error(e);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequisitions();
    fetchProjects()
      .then(setProjects)
      .catch((e: unknown) => {
        setProjectsError(
          e instanceof Error ? e.message : "Failed to load projects",
        );
      });
    fetchRelatedOptions(SITE_API, "project sites")
      .then(setSites)
      .catch((e: unknown) => {
        setSitesError(
          e instanceof Error ? e.message : "Failed to load project sites",
        );
      });
    fetchRelatedOptions(CATEGORY_API, "categories")
      .then(setCategories)
      .catch((e: unknown) => {
        setCategoriesError(
          e instanceof Error ? e.message : "Failed to load categories",
        );
      });
    fetchRelatedOptions(PROJECT_TYPE_API, "project types")
      .then(setProjectTypes)
      .catch((e: unknown) => {
        setProjectTypesError(
          e instanceof Error ? e.message : "Failed to load project types",
        );
      });
    fetchRelatedOptions(WORK_ORDER_API, "work orders")
      .then(setWorkOrders)
      .catch((e: unknown) => {
        setWorkOrdersError(
          e instanceof Error ? e.message : "Failed to load work orders",
        );
      });
    fetchRelatedOptions(TASK_API, "tasks")
      .then(setTasks)
      .catch((e: unknown) => {
        setTasksError(e instanceof Error ? e.message : "Failed to load tasks");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==================== SELECT ====================
  const handleSelectAll = () => {
    const updated = !selectAll;
    setSelectAll(updated);
    setRequisitions(requisitions.map((item) => ({ ...item, select: updated })));
  };

  const handleRowSelect = (id: string) => {
    setRequisitions(
      requisitions.map((item) =>
        item.id === id ? { ...item, select: !item.select } : item,
      ),
    );
  };

  // ==================== FILTER ====================
  const filteredData = requisitions.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.code.toLowerCase().includes(q) ||
      item.project.toLowerCase().includes(q) ||
      item.titleNameOfWork.toLowerCase().includes(q) ||
      item.projectType.toLowerCase().includes(q) ||
      item.addedBy.toLowerCase().includes(q) ||
      (item.note || "").toLowerCase().includes(q);
    const matchesProject = projectFilter
      ? item.project.toLowerCase().includes(projectFilter.toLowerCase())
      : true;
    const matchesTitle = titleFilter
      ? item.titleNameOfWork.toLowerCase().includes(titleFilter.toLowerCase())
      : true;
    return matchesSearch && matchesProject && matchesTitle;
  });

  // ==================== RESET FORM ====================
  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      demandDate: "",
      code: generateCode(),
      ref: "",
      projectType: "",
      project: "",
      titleNameOfWork: "",
      ifTask: "",
      site: "",
      category: "",
      note: "",
      addedBy: "Admin",
      createdBy: "Admin",
      updatedBy: "Admin",
      attachment: "",
    });
    setBoqItems([emptyBoqRow()]);
  };

  // ==================== BOQ HELPERS ====================
  const addBoqItem = () => {
    const newRow = emptyBoqRow();
    console.log("✅ addBoqItem called — new row id:", newRow.id);
    setBoqItems((prev) => [...prev, newRow]);
  };

  const removeBoqItem = (index: number) => {
    if (boqItems.length === 1) return;
    setBoqItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateBoqItem = (
    index: number,
    field: keyof MaterialBoqItem,
    value: any,
  ) => {
    setBoqItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return { ...item, [field]: value };
      }),
    );
  };

  const totalDemandQty = boqItems.reduce(
    (sum, item) => sum + Number(item.demandQty || 0),
    0,
  );

  // ==================== CREATE ====================
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const enteredItems = boqItems.filter(
        (item) => item.itemCode.trim() || item.itemName.trim(),
      );
      if (
        enteredItems.some(
          (item) => !item.itemCode.trim() || !item.itemName.trim(),
        )
      ) {
        throw new Error("Every BOQ item needs both an item code and a name.");
      }

      const parentPayload = {
        date: toYMD(formData.date),
        demandDate: toYMD(formData.demandDate) || null,
        code: formData.code,
        ref: formData.ref || null,
        projectType: formData.projectType,
        projectId: formData.project || null,
        titleNameOfWork: formData.titleNameOfWork,
        ifTask: formData.ifTask || null,
        siteId: formData.site || null,
        categoryId: formData.category || null,
        note: formData.note || null,
        attachment: formData.attachment.trim() || null,
        total: totalDemandQty,
        status: "pending",
        approvalLayer: "pending",
        items: enteredItems.map((item) => ({
          itemCode: item.itemCode,
          itemName: item.itemName,
          details: item.details,
          unit: item.unit,
          budgetQty: Number(item.budgetQty),
          alreadyPurchaseQty: Number(item.alreadyPurchaseQty),
          availableQty: Number(item.availableQty),
          demandQty: Number(item.demandQty),
          stock: Number(item.stock),
        })),
      };

      await createRequisition(parentPayload);
      await loadRequisitions();
      setIsAddOpen(false);
      resetForm();
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Create failed. Please try again.";
      console.error(e);
      alert(message);
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== EDIT ====================
  const openEditModal = async (item: MaterialRequisitionItem) => {
    try {
      if (!item.uuid) throw new Error("Requisition UUID not found.");
      setActionLoading(true);
      setActiveDropdown(null);

      const result = await fetchRequisitionById(item.uuid);
      const data = result?.data?.data ?? result?.data ?? result;
      const fullData = { ...item, ...data };
      const childRows: any[] = Array.isArray(data.items)
        ? data.items
        : Array.isArray(item.items)
          ? item.items
          : [];

      setSelectedItem({
        ...fullData,
        uuid: data.uuid || item.uuid,
        items: childRows,
      });

      setFormData({
        date:
          toYMD(data.date || item.date) ||
          new Date().toISOString().slice(0, 10),
        demandDate: toYMD(data.demandDate || item.demandDate) || "",
        code: data.code || item.code || "",
        ref: data.ref || item.ref || "",
        projectType: data.projectType || item.projectType || "",
        project: data.projectId || data.project?.uuid || item.projectId || "",
        titleNameOfWork: data.titleNameOfWork || item.titleNameOfWork || "",
        ifTask: data.ifTask || item.ifTask || "",
        site: data.siteId || data.site?.uuid || item.siteId || "",
        category:
          data.categoryId || data.category?.uuid || item.categoryId || "",
        note: data.note || item.note || "",
        addedBy: data.addedBy || item.addedBy || "Admin",
        createdBy: data.createdBy || item.createdBy || "Admin",
        updatedBy: data.updatedBy || "Admin",
        attachment: data.attachment || item.attachment || "",
      });

      if (childRows.length > 0) {
        setBoqItems(
          childRows.map((child: any) => ({
            id: child.id || generateRowId(),
            uuid: child.uuid,
            materialRequisitionId: child.materialRequisitionId || item.uuid,
            itemCode: child.itemCode || "",
            itemName: child.itemName || "",
            details: child.details || "",
            unit: child.unit || "Nos",
            budgetQty: Number(child.budgetQty ?? 0),
            alreadyPurchaseQty: Number(child.alreadyPurchaseQty ?? 0),
            availableQty: Number(child.availableQty ?? 0),
            demandQty: Number(child.demandQty ?? 0),
            stock: Number(child.stock ?? 0),
            createdBy: child.createdBy || "",
            updatedBy: child.updatedBy || "",
          })),
        );
      } else {
        setBoqItems([emptyBoqRow()]);
      }

      setIsEditOpen(true);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to load requisition details.";
      console.error("openEditModal error:", e);
      alert(message);
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== UPDATE ====================
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem?.uuid) {
      alert("Requisition UUID not found.");
      return;
    }
    try {
      setActionLoading(true);
      const enteredItems = boqItems.filter(
        (item) => item.itemCode.trim() || item.itemName.trim(),
      );
      if (
        enteredItems.some(
          (item) => !item.itemCode.trim() || !item.itemName.trim(),
        )
      ) {
        throw new Error("Every BOQ item needs both an item code and a name.");
      }
      const parentPayload = {
        date: toYMD(formData.date),
        demandDate: toYMD(formData.demandDate) || null,
        code: formData.code,
        ref: formData.ref || null,
        projectType: formData.projectType,
        projectId: formData.project || null,
        titleNameOfWork: formData.titleNameOfWork,
        ifTask: formData.ifTask || null,
        siteId: formData.site || null,
        categoryId: formData.category || null,
        note: formData.note || null,
        attachment: formData.attachment.trim() || null,
        total: totalDemandQty,
        items: enteredItems.map((item) => ({
          itemCode: item.itemCode,
          itemName: item.itemName,
          details: item.details,
          unit: item.unit,
          budgetQty: Number(item.budgetQty),
          alreadyPurchaseQty: Number(item.alreadyPurchaseQty),
          availableQty: Number(item.availableQty),
          demandQty: Number(item.demandQty),
          stock: Number(item.stock),
        })),
      };
      await updateRequisition(selectedItem.uuid, parentPayload);
      await loadRequisitions();
      setIsEditOpen(false);
      setSelectedItem(null);
      resetForm();
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Update failed. Please try again.";
      console.error("handleEditSubmit error:", e);
      alert(message);
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== DELETE ====================
  const handleDelete = async (item: MaterialRequisitionItem) => {
    if (!item.uuid) {
      alert("Requisition UUID not found.");
      return;
    }
    if (!confirm(`Delete requisition "${item.code}"?`)) return;
    try {
      setActionLoading(true);
      await softDeleteRequisition(item.uuid);
      setRequisitions((prev) => prev.filter((r) => r.id !== item.id));
      setActiveDropdown(null);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Delete failed. Please try again.";
      console.error(e);
      alert(message);
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== VIEW ====================
  const openViewModal = async (item: MaterialRequisitionItem) => {
    try {
      setActionLoading(true);
      if (!item.uuid) throw new Error("Requisition UUID not found.");
      const result = await fetchRequisitionById(item.uuid);
      const data = result?.data?.data || result?.data || result;
      setSelectedItem({
        ...item,
        ...data,
        projectType:
          typeof data.projectType === "object"
            ? data.projectType?.name || item.projectType
            : data.projectType || item.projectType,
        project:
          typeof data.project === "object"
            ? data.project?.name || item.project
            : data.project || item.project,
        site:
          typeof data.site === "object"
            ? data.site?.name || item.site
            : data.site || item.site,
        category:
          typeof data.category === "object"
            ? data.category?.name || item.category
            : data.category || item.category,
        date: formatDisplayDate(data.date || item.date),
        demandDate: formatDisplayDate(data.demandDate || item.demandDate),
        items: Array.isArray(data.items) ? data.items : item.items || [],
      });
      setIsViewModalOpen(true);
      setActiveDropdown(null);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to load requisition details.";
      console.error(e);
      alert(message);
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== RETURN ====================
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between p-4 sm:p-6 font-sans">
      <div className="space-y-4">
        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium pb-1">
          <div className="flex items-center gap-1 hover:text-indigo-600 cursor-pointer transition-colors">
            <Home className="w-3.5 h-3.5" />
            Home
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600">Requisition</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-indigo-600 font-semibold">
            Material Requisition List
          </span>
        </div>

        {/* HEADER */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Material Requisition Dashboard
            </h1>
            <p className="text-[11px] text-slate-500">
              Manage, create, update, and track all material requisitions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1 bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-semibold px-3 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Multiple PO Convert
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold px-3 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Multiple RFQ Convert
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-3 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Multiple Purchase Convert
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsAddOpen(true);
              }}
              className="inline-flex items-center gap-1.5 bg-[#5949d6] hover:bg-[#4d3ec2] text-white text-[11px] font-semibold px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />+ New Material Requisition
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">
              Select Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">
              Company
            </label>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Somikoron IT Ltd">Somikoron IT Ltd</option>
              <option value="Other Company">Other Company</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">
              Supplier
            </label>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select an option</option>
              <option value="Supplier A">Supplier A</option>
              <option value="Supplier B">Supplier B</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">
              Project
            </label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select value</option>
              {projects.map((project) => (
                <option key={project.uuid} value={project.name}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">
              Title/Name of Work
            </label>
            <select
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Title/Name of Work</option>
              {workOrders.map((wo) => (
                <option key={wo.uuid} value={wo.name}>
                  {wo.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SEARCH + ENTRIES */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="border border-slate-300 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-600 font-medium">Search:</span>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search code, project, title..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* LOADING / ERROR */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading material requisitions...
          </div>
        )}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={loadRequisitions}
              className="underline text-xs font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* TABLE */}
        {!loading && !error && (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
            <div className="overflow-x-auto min-h-[350px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#5949d6] text-white font-semibold tracking-wide">
                    <th className="py-3 px-3 w-12">ID</th>
                    <th className="py-3 px-3 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="rounded border-white/40 cursor-pointer accent-indigo-700 w-3.5 h-3.5"
                      />
                    </th>
                    <th className="py-3 px-3">PROJECT TYPE</th>
                    <th className="py-3 px-3">PROJECT</th>
                    <th className="py-3 px-3">TITLE/NAME OF WORK</th>
                    <th className="py-3 px-3">CODE</th>
                    <th className="py-3 px-3">REF</th>
                    <th className="py-3 px-3">DATE</th>
                    <th className="py-3 px-3">DEMAND DATE</th>
                    <th className="py-3 px-3">NOTE</th>
                    <th className="py-3 px-3">ADDED BY</th>
                    <th className="py-3 px-3">APPROVAL LAYER</th>
                    <th className="py-3 px-3 text-center">ATTACHMENT</th>
                    <th className="py-3 px-3 text-center w-28">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.length > 0 ? (
                    filteredData.slice(0, entriesPerPage).map((item, index) => (
                      <tr
                        key={item.uuid || item.id}
                        className="hover:bg-indigo-50/30 transition-colors"
                      >
                        <td className="py-3 px-3 font-mono font-bold text-slate-600">
                          {index + 1}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.select}
                            onChange={() => handleRowSelect(item.id)}
                            className="rounded border-slate-300 cursor-pointer accent-indigo-600 w-3.5 h-3.5"
                          />
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700">
                          {item.projectType}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {item.project}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {item.titleNameOfWork || "N/A"}
                        </td>
                        <td className="py-3 px-3 font-mono text-indigo-700 font-semibold">
                          {item.code}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {item.ref || "—"}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {item.date}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {item.demandDate || "—"}
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-[120px] truncate">
                          {item.note || "—"}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700">
                          {item.addedBy}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                              item.approvalLayer
                                ?.toLowerCase()
                                .includes("completed")
                                ? "text-emerald-600"
                                : "text-slate-700"
                            }`}
                          >
                            {item.approvalLayer
                              ?.toLowerCase()
                              .includes("completed") && (
                              <span className="text-emerald-500">✓</span>
                            )}
                            {item.approvalLayer}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {item.attachment ? (
                            <Paperclip className="w-3.5 h-3.5 text-indigo-600 mx-auto" />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3 px-3 text-center relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveDropdown(
                                activeDropdown === item.id ? null : item.id,
                              )
                            }
                            className="inline-flex items-center gap-1 bg-[#5949d6] hover:bg-[#4d3ec2] text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-md"
                          >
                            Action
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          {activeDropdown === item.id && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 text-left">
                              <button
                                type="button"
                                onClick={() => openViewModal(item)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 text-slate-700"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 text-slate-700"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(item)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-rose-50 text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={14}
                        className="py-16 text-center text-slate-400"
                      >
                        No material requisitions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>
                Showing 1 to {Math.min(entriesPerPage, filteredData.length)} of{" "}
                {filteredData.length} entries
              </span>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 border rounded text-slate-400 cursor-not-allowed">
                  Previous
                </button>
                <span className="px-2 py-1 bg-[#5949d6] text-white rounded">
                  1
                </span>
                <button className="px-2 py-1 border rounded hover:bg-slate-50">
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== ADD MODAL ==================== */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden border border-slate-200">
            <div className="bg-[#5949d6] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Material Requisition
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddOpen(false);
                  resetForm();
                }}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleAddSubmit}
              className="p-6 space-y-5 text-xs overflow-y-auto max-h-[calc(95vh-70px)]"
            >
              {/* FORM FIELDS — exactly table column onujayi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Demand Date */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Demand Date
                  </label>
                  <input
                    type="date"
                    value={formData.demandDate}
                    onChange={(e) =>
                      setFormData({ ...formData, demandDate: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Code */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Ref */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ref
                  </label>
                  <input
                    type="text"
                    value={formData.ref}
                    onChange={(e) =>
                      setFormData({ ...formData, ref: e.target.value })
                    }
                    placeholder="Ref"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Project Type */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Project Type
                  </label>
                  <select
                    value={formData.projectType}
                    onChange={(e) =>
                      setFormData({ ...formData, projectType: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Select Project Type</option>
                    {projectTypes.map((pt) => (
                      <option key={pt.uuid} value={pt.name}>
                        {pt.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Project
                  </label>
                  <select
                    value={formData.project}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        project: e.target.value,
                        site: "",
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Select Project</option>
                    {projects.map((project) => (
                      <option key={project.uuid} value={project.uuid}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title/Name of Work */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Title/Name of Work
                  </label>
                  <select
                    value={formData.titleNameOfWork}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        titleNameOfWork: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Select Title/Name of Work</option>
                    {workOrders.map((wo) => (
                      <option key={wo.uuid} value={wo.name}>
                        {wo.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* If Task */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    If Task
                  </label>
                  <select
                    value={formData.ifTask}
                    onChange={(e) =>
                      setFormData({ ...formData, ifTask: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Select Task</option>
                    {tasks.map((task) => (
                      <option key={task.uuid} value={task.name}>
                        {task.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Site */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Site
                  </label>
                  <select
                    value={formData.site}
                    onChange={(e) =>
                      setFormData({ ...formData, site: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Select Site</option>
                    {sites
                      .filter(
                        (site) =>
                          !site.projectId ||
                          !formData.project ||
                          site.projectId === formData.project,
                      )
                      .map((site) => (
                        <option key={site.uuid} value={site.uuid}>
                          {site.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.uuid} value={category.uuid}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Attachment */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Attachment
                  </label>
                  <input
                    type="text"
                    value={formData.attachment}
                    onChange={(e) =>
                      setFormData({ ...formData, attachment: e.target.value })
                    }
                    placeholder="Attachment URL / file name"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Note */}
                <div className="lg:col-span-4">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Note
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) =>
                      setFormData({ ...formData, note: e.target.value })
                    }
                    rows={2}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* ==================== BOQ ITEMS ==================== */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-[#5949d6] text-white px-4 py-2.5 font-semibold flex items-center justify-between">
                  <span>BOQ ITEMS</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addBoqItem();
                    }}
                    className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] text-xs">
                    <thead>
                      <tr className="bg-[#5949d6]/90 text-white">
                        <th className="px-3 py-2 text-left">ITEM CODE</th>
                        <th className="px-3 py-2 text-left">ITEM NAME</th>
                        <th className="px-3 py-2 text-left">DETAILS</th>
                        <th className="px-3 py-2 text-left">UNIT</th>
                        <th className="px-3 py-2 text-right">BUDGET QTY</th>
                        <th className="px-3 py-2 text-right">
                          ALREADY PURCHASE QTY
                        </th>
                        <th className="px-3 py-2 text-right">AVAILABLE QTY</th>
                        <th className="px-3 py-2 text-right">DEMAND QTY</th>
                        <th className="px-3 py-2 text-right">STOCK</th>
                        <th className="px-3 py-2 text-center">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {boqItems.map((item, index) => (
                        <tr key={String(item.id || `boq-row-${index}`)}>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={item.itemCode}
                              onChange={(e) =>
                                updateBoqItem(index, "itemCode", e.target.value)
                              }
                              className="w-28 border border-slate-300 rounded px-2 py-1.5 font-mono"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={item.itemName}
                              onChange={(e) =>
                                updateBoqItem(index, "itemName", e.target.value)
                              }
                              placeholder="Item name"
                              className="w-40 border border-slate-300 rounded px-2 py-1.5"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={item.details}
                              onChange={(e) =>
                                updateBoqItem(index, "details", e.target.value)
                              }
                              className="w-36 border border-slate-300 rounded px-2 py-1.5"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={item.unit}
                              onChange={(e) =>
                                updateBoqItem(index, "unit", e.target.value)
                              }
                              className="w-20 border border-slate-300 rounded px-2 py-1.5"
                            >
                              <option value="Nos">Nos</option>
                              <option value="Kg">Kg</option>
                              <option value="Cft">Cft</option>
                              <option value="Bag">Bag</option>
                              <option value="Pcs">Pcs</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              value={item.budgetQty}
                              onChange={(e) =>
                                updateBoqItem(
                                  index,
                                  "budgetQty",
                                  Number(e.target.value),
                                )
                              }
                              className="w-24 border border-slate-300 rounded px-2 py-1.5 text-right"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              value={item.alreadyPurchaseQty}
                              onChange={(e) =>
                                updateBoqItem(
                                  index,
                                  "alreadyPurchaseQty",
                                  Number(e.target.value),
                                )
                              }
                              className="w-24 border border-slate-300 rounded px-2 py-1.5 text-right"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              value={item.availableQty}
                              onChange={(e) =>
                                updateBoqItem(
                                  index,
                                  "availableQty",
                                  Number(e.target.value),
                                )
                              }
                              className="w-24 border border-slate-300 rounded px-2 py-1.5 text-right"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              value={item.demandQty}
                              onChange={(e) =>
                                updateBoqItem(
                                  index,
                                  "demandQty",
                                  Number(e.target.value),
                                )
                              }
                              className="w-24 border border-slate-300 rounded px-2 py-1.5 text-right"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              value={item.stock}
                              onChange={(e) =>
                                updateBoqItem(
                                  index,
                                  "stock",
                                  Number(e.target.value),
                                )
                              }
                              className="w-20 border border-slate-300 rounded px-2 py-1.5 text-right"
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeBoqItem(index)}
                              disabled={boqItems.length === 1}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded disabled:opacity-40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* FOOTER — shudhu 1 ta Submit button */}
                <div className="bg-slate-50 border-t border-slate-200 px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm font-semibold text-slate-700">
                    Total :{" "}
                    <span className="text-indigo-700">{totalDemandQty}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddOpen(false);
                        resetForm();
                      }}
                      disabled={actionLoading}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 bg-[#5949d6] hover:bg-[#4d3ec2] text-white rounded-lg shadow-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EDIT MODAL ==================== */}
      {isEditOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden border border-slate-200">
            <div className="bg-[#5949d6] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit Material Requisition — {selectedItem.code}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditOpen(false);
                  setSelectedItem(null);
                  resetForm();
                }}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleEditSubmit}
              className="p-6 space-y-5 text-xs overflow-y-auto max-h-[calc(95vh-70px)]"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Demand Date
                  </label>
                  <input
                    type="date"
                    value={formData.demandDate}
                    onChange={(e) =>
                      setFormData({ ...formData, demandDate: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ref
                  </label>
                  <input
                    type="text"
                    value={formData.ref}
                    onChange={(e) =>
                      setFormData({ ...formData, ref: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Project Type
                  </label>
                  <select
                    value={formData.projectType}
                    onChange={(e) =>
                      setFormData({ ...formData, projectType: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="">Select Project Type</option>
                    {projectTypes.map((pt) => (
                      <option key={pt.uuid} value={pt.name}>
                        {pt.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Project
                  </label>
                  <select
                    value={formData.project}
                    onChange={(e) =>
                      setFormData({ ...formData, project: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="">Select Project</option>
                    {projects.map((project) => (
                      <option key={project.uuid} value={project.uuid}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Title/Name of Work
                  </label>
                  <select
                    value={formData.titleNameOfWork}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        titleNameOfWork: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="">Select Title/Name of Work</option>
                    {workOrders.map((wo) => (
                      <option key={wo.uuid} value={wo.name}>
                        {wo.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    If Task
                  </label>
                  <select
                    value={formData.ifTask}
                    onChange={(e) =>
                      setFormData({ ...formData, ifTask: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="">Select Task</option>
                    {tasks.map((task) => (
                      <option key={task.uuid} value={task.name}>
                        {task.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Site
                  </label>
                  <select
                    value={formData.site}
                    onChange={(e) =>
                      setFormData({ ...formData, site: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="">Select Site</option>
                    {sites.map((site) => (
                      <option key={site.uuid} value={site.uuid}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.uuid} value={category.uuid}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Attachment
                  </label>
                  <input
                    type="text"
                    value={formData.attachment}
                    onChange={(e) =>
                      setFormData({ ...formData, attachment: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div className="lg:col-span-4">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Note
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) =>
                      setFormData({ ...formData, note: e.target.value })
                    }
                    rows={2}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-[#5949d6] text-white px-4 py-2.5 font-semibold flex items-center justify-between">
                  <span>BOQ ITEMS</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addBoqItem();
                    }}
                    className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] text-xs">
                    <thead>
                      <tr className="bg-[#5949d6]/90 text-white">
                        <th className="px-3 py-2 text-left">ITEM CODE</th>
                        <th className="px-3 py-2 text-left">ITEM NAME</th>
                        <th className="px-3 py-2 text-left">DETAILS</th>
                        <th className="px-3 py-2 text-left">UNIT</th>
                        <th className="px-3 py-2 text-right">BUDGET QTY</th>
                        <th className="px-3 py-2 text-right">
                          ALREADY PURCHASE QTY
                        </th>
                        <th className="px-3 py-2 text-right">AVAILABLE QTY</th>
                        <th className="px-3 py-2 text-right">DEMAND QTY</th>
                        <th className="px-3 py-2 text-right">STOCK</th>
                        <th className="px-3 py-2 text-center">ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {boqItems.map((item, index) => (
                        <tr
                          key={String(
                            item.id || item.uuid || `boq-row-${index}`,
                          )}
                        >
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={item.itemCode}
                              onChange={(e) =>
                                updateBoqItem(index, "itemCode", e.target.value)
                              }
                              className="w-28 border border-slate-300 rounded px-2 py-1.5 font-mono"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={item.itemName}
                              onChange={(e) =>
                                updateBoqItem(index, "itemName", e.target.value)
                              }
                              className="w-40 border border-slate-300 rounded px-2 py-1.5"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={item.details}
                              onChange={(e) =>
                                updateBoqItem(index, "details", e.target.value)
                              }
                              className="w-36 border border-slate-300 rounded px-2 py-1.5"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={item.unit}
                              onChange={(e) =>
                                updateBoqItem(index, "unit", e.target.value)
                              }
                              className="w-20 border border-slate-300 rounded px-2 py-1.5"
                            >
                              <option value="Nos">Nos</option>
                              <option value="Kg">Kg</option>
                              <option value="Cft">Cft</option>
                              <option value="Bag">Bag</option>
                              <option value="Pcs">Pcs</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              value={item.budgetQty}
                              onChange={(e) =>
                                updateBoqItem(
                                  index,
                                  "budgetQty",
                                  Number(e.target.value),
                                )
                              }
                              className="w-24 border border-slate-300 rounded px-2 py-1.5 text-right"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              value={item.alreadyPurchaseQty}
                              onChange={(e) =>
                                updateBoqItem(
                                  index,
                                  "alreadyPurchaseQty",
                                  Number(e.target.value),
                                )
                              }
                              className="w-24 border border-slate-300 rounded px-2 py-1.5 text-right"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              value={item.availableQty}
                              onChange={(e) =>
                                updateBoqItem(
                                  index,
                                  "availableQty",
                                  Number(e.target.value),
                                )
                              }
                              className="w-24 border border-slate-300 rounded px-2 py-1.5 text-right"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              value={item.demandQty}
                              onChange={(e) =>
                                updateBoqItem(
                                  index,
                                  "demandQty",
                                  Number(e.target.value),
                                )
                              }
                              className="w-24 border border-slate-300 rounded px-2 py-1.5 text-right"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              value={item.stock}
                              onChange={(e) =>
                                updateBoqItem(
                                  index,
                                  "stock",
                                  Number(e.target.value),
                                )
                              }
                              className="w-20 border border-slate-300 rounded px-2 py-1.5 text-right"
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeBoqItem(index)}
                              disabled={boqItems.length === 1}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded disabled:opacity-40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 border-t border-slate-200 px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm font-semibold text-slate-700">
                    Total :{" "}
                    <span className="text-indigo-700">{totalDemandQty}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditOpen(false);
                        setSelectedItem(null);
                        resetForm();
                      }}
                      disabled={actionLoading}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 bg-[#5949d6] hover:bg-[#4d3ec2] text-white rounded-lg shadow-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== VIEW MODAL ==================== */}
      {isViewModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" />
                Material Requisition Details: {selectedItem.code}
              </h3>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs overflow-y-auto max-h-[calc(90vh-65px)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 font-medium">Date</span>
                  <p className="font-bold text-slate-800">
                    {selectedItem.date}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">
                    Demand Date
                  </span>
                  <p className="font-bold text-slate-800">
                    {selectedItem.demandDate || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Code</span>
                  <p className="font-mono font-bold text-indigo-700">
                    {selectedItem.code}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Ref</span>
                  <p className="font-bold text-slate-800">
                    {selectedItem.ref || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">
                    Project Type
                  </span>
                  <p className="font-bold text-slate-800">
                    {selectedItem.projectType}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Project</span>
                  <p className="font-bold text-slate-800">
                    {selectedItem.project}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">
                    Title / Name of Work
                  </span>
                  <p className="font-bold text-slate-800">
                    {selectedItem.titleNameOfWork}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Site</span>
                  <p className="font-bold text-slate-800">
                    {selectedItem.site || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Category</span>
                  <p className="font-bold text-slate-800">
                    {selectedItem.category || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Added By</span>
                  <p className="font-bold text-slate-800">
                    {selectedItem.addedBy}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">
                    Approval Layer
                  </span>
                  <p className="font-bold text-emerald-600">
                    {selectedItem.approvalLayer}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Note</span>
                  <p className="font-bold text-slate-800">
                    {selectedItem.note || "—"}
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <h4 className="font-bold text-slate-800">BOQ Items</h4>
                </div>
                {selectedItem.items && selectedItem.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#5949d6] text-white">
                          <th className="px-3 py-2 text-left">ITEM CODE</th>
                          <th className="px-3 py-2 text-left">ITEM NAME</th>
                          <th className="px-3 py-2 text-left">DETAILS</th>
                          <th className="px-3 py-2 text-left">UNIT</th>
                          <th className="px-3 py-2 text-right">BUDGET QTY</th>
                          <th className="px-3 py-2 text-right">
                            ALREADY PURCHASE
                          </th>
                          <th className="px-3 py-2 text-right">AVAILABLE</th>
                          <th className="px-3 py-2 text-right">DEMAND QTY</th>
                          <th className="px-3 py-2 text-right">STOCK</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedItem.items.map((child, index) => (
                          <tr key={child.uuid || index}>
                            <td className="px-3 py-2 font-mono text-indigo-700">
                              {child.itemCode}
                            </td>
                            <td className="px-3 py-2 font-semibold">
                              {child.itemName}
                            </td>
                            <td className="px-3 py-2">{child.details}</td>
                            <td className="px-3 py-2">{child.unit}</td>
                            <td className="px-3 py-2 text-right">
                              {child.budgetQty}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {child.alreadyPurchaseQty}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {child.availableQty}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-indigo-700">
                              {child.demandQty}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {child.stock}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400">
                    No BOQ items found.
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
