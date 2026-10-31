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
  Calculator,
} from "lucide-react";

// ==================== TYPES ====================

export interface RequisitionItem {
  id: string;
  uuid?: string;
  select: boolean;

  requisitionDate: string;
  requisitionCode: string;

  projectType: string;
  targetProjectId: string;
  titleOrWorkNameId: string;
  taskSubcategory: string;
  constructionSiteId: string;

  subtotalAmount: number;
  grandTotalPayable: number;

  supportingAttachment: string | null;

  addedById: string;

  createdBy: string;
  updatedBy: string;

  status: string;

  items?: ServiceWorkItem[];
}

export interface ServiceWorkItem {
  id?: string;
  uuid?: string;
  serviceWorkRequisitionId?: string;

  date: string;
  code: string;
  serviceItemName: string;
  unitType: string;
  qtyDays: number;
  rate: number;
  scopeDetailsOrRemarks: string;
  amount: number;

  createdBy?: string;
  updatedBy?: string;
}

interface RelatedOption {
  uuid: string;
  id?: string;
  name: string;
  projectId?: string;
  categoryId?: string;
}

// ==================== API CONFIG ====================

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";

const API_PREFIX = "/realbizpro/api/v1";

const REQUISITION_API = `${API_BASE_URL}${API_PREFIX}/service-work-requisition`;
const ITEM_API = `${API_BASE_URL}${API_PREFIX}/service-work-requisition-item`;

const PROJECT_API = `${API_BASE_URL}${API_PREFIX}/project`; // 👈 Screenshot onujayi correct
const PROJECT_TYPE_API = `${API_BASE_URL}${API_PREFIX}/project-type`;
const WORK_ORDER_API = `${API_BASE_URL}${API_PREFIX}/project-billing/service-work-names`; // 👈 Title/Name of Work
const SITE_API = `${API_BASE_URL}${API_PREFIX}/project-sites`;
const SUB_CATEGORY_API = `${API_BASE_URL}${API_PREFIX}/billing-sub-category`;

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
  `SWR-${new Date().getFullYear()}-${String(
    Math.floor(1000 + Math.random() * 9000),
  ).padStart(4, "0")}`;

const generateItemCode = () =>
  `SVC-${new Date().getFullYear()}-${String(
    Math.floor(1000 + Math.random() * 9000),
  ).padStart(4, "0")}`;

// ==================== GENERIC OPTIONS FETCHER (FIXED) ====================

async function fetchRelatedOptions(
  endpoint: string,
  label: string,
): Promise<RelatedOption[]> {
  try {
    const query = new URLSearchParams({ page: "1", limit: "100" });
    const res = await fetch(`${endpoint}?${query}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`❌ ${label} fetch failed: ${res.status}`);
      return [];
    }

    const json = await res.json();

    // Response theke list ber kora
    const rows =
      json?.data?.data ??
      (Array.isArray(json?.data) ? json.data : null) ??
      json?.rows ??
      json?.items ??
      [];

    console.log(`📥 ${label} raw:`, rows);

    if (!Array.isArray(rows)) return [];

    return rows
      .filter((row: any) => row?.uuid || row?.id) // ✅ UUID ba ID thakle nibe
      .map((row: any) => ({
        uuid: String(row.uuid || row.id),
        id: row.id != null ? String(row.id) : undefined,
        // ✅ Project e 'projectName' o check kora hoyeche
        name: String(
          row.name ||
            row.projectName ||
            row.title ||
            row.workOrderName ||
            row.taskName ||
            row.titleName ||
            row.typeName ||
            row.siteName ||
            row.categoryName ||
            row.subCategoryName ||
            row.code ||
            "Unnamed",
        ),
        projectId: row.projectId ? String(row.projectId) : undefined,
        categoryId: row.details?.categoryId || row.categoryId || undefined,
      }));
  } catch (err) {
    console.error(`❌ ${label} error:`, err);
    return [];
  }
}

// ==================== API FUNCTIONS ====================

async function fetchRequisitions(params?: {
  page?: number;
  limit?: number;
}): Promise<{ data: RequisitionItem[]; meta: any }> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 100;

  const url = `${REQUISITION_API}?page=${page}&limit=${limit}&skip=0&sortBy=createdAt&sortOrder=DESC&withDeleted=false`;

  const res = await fetch(url, {
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

  const mapped: RequisitionItem[] = rawData.map((item: any) => ({
    id: String(item.id ?? item.uuid),
    uuid: item.uuid,
    select: false,

    requisitionDate: formatDisplayDate(item.requisitionDate),
    requisitionCode: item.requisitionCode || "",

    projectType: item.projectType || "",
    targetProjectId: item.targetProjectId || "",
    titleOrWorkNameId: item.titleOrWorkNameId || "",
    taskSubcategory: item.taskSubcategory || "",
    constructionSiteId: item.constructionSiteId || "",

    subtotalAmount: Number(item.subtotalAmount || 0),
    grandTotalPayable: Number(item.grandTotalPayable || 0),

    supportingAttachment: item.supportingAttachment || null,
    addedById: item.addedById || "",
    createdBy: item.createdBy || "",
    updatedBy: item.updatedBy || "",
    status: item.status || "pending",

    items: Array.isArray(item.items)
      ? item.items.map((child: any) => ({
          id: child.id,
          uuid: child.uuid,
          serviceWorkRequisitionId: child.serviceWorkRequisitionId,
          date: child.date || "",
          code: child.code || "",
          serviceItemName: child.serviceItemName || "",
          unitType: child.unitType || "",
          qtyDays: Number(child.qtyDays || 0),
          rate: Number(child.rate || 0),
          scopeDetailsOrRemarks: child.scopeDetailsOrRemarks || "",
          amount: Number(child.amount || 0),
          createdBy: child.createdBy || "",
          updatedBy: child.updatedBy || "",
        }))
      : [],
  }));

  return { data: mapped, meta: json?.data?.meta || {} };
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

async function fetchRequisitionItemByUuid(uuid: string) {
  const res = await fetch(`${ITEM_API}/${encodeURIComponent(uuid)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.message || `Failed to fetch requisition item ${uuid}: ${res.status}`,
    );
  }
  return res.json();
}

async function fetchRequisitionItems(serviceWorkRequisitionId?: string) {
  const query = new URLSearchParams({
    page: "1",
    limit: "100",
    skip: "0",
    sortBy: "createdAt",
    sortOrder: "DESC",
    withDeleted: "false",
  });
  if (serviceWorkRequisitionId) {
    query.set("serviceWorkRequisitionId", serviceWorkRequisitionId);
  }
  const res = await fetch(`${ITEM_API}?${query.toString()}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.message || `Failed to fetch requisition items: ${res.status}`,
    );
  }
  const json = await res.json();
  const rows = json?.data?.data ?? json?.data ?? json?.items ?? [];
  return Array.isArray(rows) ? rows : [];
}

async function createRequisitionItem(payload: Record<string, any>) {
  const res = await fetch(ITEM_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Create requisition item failed");
  }
  return res.json();
}

async function updateRequisitionItem(
  uuid: string,
  payload: Record<string, any>,
) {
  const res = await fetch(`${ITEM_API}/${encodeURIComponent(uuid)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.message || `Update requisition item failed: ${res.status}`,
    );
  }
  return res.json();
}

async function deleteRequisitionItem(uuid: string) {
  const res = await fetch(`${ITEM_API}/${encodeURIComponent(uuid)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.message || `Delete requisition item failed: ${res.status}`,
    );
  }
  return res.json().catch(() => ({}));
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

export default function ServiceRequisitionPage() {
  const [requisitions, setRequisitions] = useState<RequisitionItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [selectAll, setSelectAll] = useState(false);

  const [dateFilter, setDateFilter] = useState(
    "1 October, 2026 - 31 October, 2026",
  );
  const [projectTypeFilter, setProjectTypeFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<RequisitionItem | null>(
    null,
  );

  // ==================== OPTIONS STATES ====================
  const [projectOptions, setProjectOptions] = useState<RelatedOption[]>([]);
  const [projectTypeOptions, setProjectTypeOptions] = useState<RelatedOption[]>(
    [],
  );
  const [workOrderOptions, setWorkOrderOptions] = useState<RelatedOption[]>([]);
  const [siteOptions, setSiteOptions] = useState<RelatedOption[]>([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState<RelatedOption[]>(
    [],
  );

  // ==================== FORM DATA ====================
  const [formData, setFormData] = useState({
    requisitionDate: new Date().toISOString().slice(0, 10),
    requisitionCode: generateCode(),
    projectType: "",
    targetProjectId: "",
    titleOrWorkNameId: "",
    taskSubcategory: "",
    constructionSiteId: "",
    supportingAttachment: "",
    addedById: "USER-001",
    createdBy: "Admin",
    updatedBy: "Admin",
  });

  // ==================== BOQ ITEMS ====================
  const [boqItems, setBoqItems] = useState<ServiceWorkItem[]>([
    {
      date: new Date().toISOString().slice(0, 10),
      code: generateItemCode(),
      serviceItemName: "",
      unitType: "Day",
      qtyDays: 1,
      rate: 0,
      scopeDetailsOrRemarks: "",
      amount: 0,
    },
  ]);

  // ==================== LOAD DATA ====================
  const loadRequisitions = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await fetchRequisitions({ page: 1, limit: 100 });
      setRequisitions(data);
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : "Failed to load service work requisitions";
      console.error(e);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequisitions();

    fetchRelatedOptions(PROJECT_TYPE_API, "project types")
      .then(setProjectTypeOptions)
      .catch((e) => console.error("project types:", e));

    fetchRelatedOptions(PROJECT_API, "projects")
      .then(setProjectOptions)
      .catch((e) => console.error("projects:", e));

    fetchRelatedOptions(WORK_ORDER_API, "work orders")
      .then(setWorkOrderOptions)
      .catch((e) => console.error("work orders:", e));

    fetchRelatedOptions(SITE_API, "sites")
      .then(setSiteOptions)
      .catch((e) => console.error("sites:", e));

    fetchRelatedOptions(SUB_CATEGORY_API, "sub categories")
      .then(setSubCategoryOptions)
      .catch((e) => console.error("sub categories:", e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==================== CALCULATIONS ====================
  const calculateItemAmount = (item: ServiceWorkItem) => {
    return Number(item.qtyDays || 0) * Number(item.rate || 0);
  };

  const subtotalAmount = boqItems.reduce(
    (total, item) => total + calculateItemAmount(item),
    0,
  );

  const grandTotalPayable = subtotalAmount;

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
      item.requisitionCode.toLowerCase().includes(q) ||
      item.projectType.toLowerCase().includes(q) ||
      item.targetProjectId.toLowerCase().includes(q) ||
      item.titleOrWorkNameId.toLowerCase().includes(q) ||
      item.taskSubcategory.toLowerCase().includes(q) ||
      item.constructionSiteId.toLowerCase().includes(q) ||
      item.addedById.toLowerCase().includes(q);

    const matchesProjectType = projectTypeFilter
      ? item.projectType === projectTypeFilter
      : true;
    const matchesProject = projectFilter
      ? item.targetProjectId === projectFilter
      : true;
    const matchesTitle = titleFilter
      ? item.titleOrWorkNameId.toLowerCase().includes(titleFilter.toLowerCase())
      : true;
    const matchesStatus = statusFilter ? item.status === statusFilter : true;

    return (
      matchesSearch &&
      matchesProjectType &&
      matchesProject &&
      matchesTitle &&
      matchesStatus
    );
  });

  // ==================== RESET FORM ====================
  const resetForm = () => {
    setFormData({
      requisitionDate: new Date().toISOString().slice(0, 10),
      requisitionCode: generateCode(),
      projectType: "",
      targetProjectId: "",
      titleOrWorkNameId: "",
      taskSubcategory: "",
      constructionSiteId: "",
      supportingAttachment: "",
      addedById: "USER-001",
      createdBy: "Admin",
      updatedBy: "Admin",
    });

    setBoqItems([
      {
        date: new Date().toISOString().slice(0, 10),
        code: generateItemCode(),
        serviceItemName: "",
        unitType: "Day",
        qtyDays: 1,
        rate: 0,
        scopeDetailsOrRemarks: "",
        amount: 0,
      },
    ]);
  };

  // ==================== ADD BOQ ROW ====================
  const addBoqItem = () => {
    setBoqItems((prev) => [
      ...prev,
      {
        date: formData.requisitionDate || new Date().toISOString().slice(0, 10),
        code: generateItemCode(),
        serviceItemName: "",
        unitType: "Day",
        qtyDays: 1,
        rate: 0,
        scopeDetailsOrRemarks: "",
        amount: 0,
      },
    ]);
  };

  const removeBoqItem = (index: number) => {
    if (boqItems.length === 1) return;
    setBoqItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateBoqItem = (
    index: number,
    field: keyof ServiceWorkItem,
    value: any,
  ) => {
    setBoqItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === "qtyDays" || field === "rate") {
          updated.amount = calculateItemAmount(updated);
        }
        return updated;
      }),
    );
  };

  // ==================== CREATE ====================
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);

      const parentPayload = {
        requisitionDate: toYMD(formData.requisitionDate),
        requisitionCode: formData.requisitionCode,
        projectType: formData.projectType,
        targetProjectId: formData.targetProjectId,
        titleOrWorkNameId:
          workOrderOptions.find(
            (option) => option.uuid === formData.titleOrWorkNameId,
          )?.categoryId || formData.titleOrWorkNameId,
        taskSubcategory: formData.taskSubcategory,
        constructionSiteId: formData.constructionSiteId,
        subtotalAmount,
        grandTotalPayable,
        supportingAttachment: formData.supportingAttachment.trim() || null,
        addedById: formData.addedById,
        createdBy: formData.createdBy,
        status: "pending",
      };

      const parentResult = await createRequisition(parentPayload);
      const createdParent =
        parentResult?.data?.data || parentResult?.data || parentResult;
      const parentUuid =
        createdParent?.uuid || createdParent?.id || parentResult?.data?.uuid;

      if (!parentUuid) {
        throw new Error(
          "Requisition created but parent UUID was not returned by API.",
        );
      }

      for (const item of boqItems) {
        const itemPayload = {
          serviceWorkRequisitionId: parentUuid,
          date: toYMD(item.date),
          code: item.code,
          serviceItemName: item.serviceItemName,
          unitType: item.unitType,
          qtyDays: Number(item.qtyDays),
          rate: Number(item.rate),
          scopeDetailsOrRemarks: item.scopeDetailsOrRemarks,
          amount: Number(calculateItemAmount(item)),
          createdBy: formData.createdBy,
        };
        await createRequisitionItem(itemPayload);
      }

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
  const openEditModal = async (item: RequisitionItem) => {
    try {
      if (!item.uuid) throw new Error("Requisition UUID not found.");
      setActionLoading(true);
      setActiveDropdown(null);

      const result = await fetchRequisitionById(item.uuid);
      const data = result?.data?.data ?? result?.data ?? result;
      const fullData = { ...item, ...data };

      let childRows: any[] = Array.isArray(data.items)
        ? data.items
        : Array.isArray(item.items)
          ? item.items
          : [];

      if (childRows.length === 0) {
        const allChildren = await fetchRequisitionItems(String(item.uuid));
        childRows = allChildren.filter(
          (child: any) =>
            String(
              child.serviceWorkRequisitionId ??
                child.serviceWorkRequisitionUuid ??
                child.requisitionUuid ??
                "",
            ) === String(item.uuid),
        );
      }

      const childrenWithDetails = await Promise.all(
        childRows.map(async (child: any) => {
          const childUuid = child?.uuid;
          if (!childUuid) return child;
          const childResult = await fetchRequisitionItemByUuid(
            String(childUuid),
          );
          return childResult?.data?.data ?? childResult?.data ?? childResult;
        }),
      );

      setSelectedItem({
        ...fullData,
        uuid: data.uuid || item.uuid,
        items: childrenWithDetails,
      });

      setFormData({
        requisitionDate:
          toYMD(data.requisitionDate || item.requisitionDate) ||
          new Date().toISOString().slice(0, 10),
        requisitionCode: data.requisitionCode || item.requisitionCode || "",
        projectType: data.projectType || item.projectType || "",
        targetProjectId: data.targetProjectId || item.targetProjectId || "",
        titleOrWorkNameId:
          data.titleOrWorkNameId || item.titleOrWorkNameId || "",
        taskSubcategory: data.taskSubcategory || item.taskSubcategory || "",
        constructionSiteId:
          data.constructionSiteId || item.constructionSiteId || "",
        supportingAttachment:
          data.supportingAttachment || item.supportingAttachment || "",
        addedById: data.addedById || item.addedById || "",
        createdBy: data.createdBy || item.createdBy || "",
        updatedBy: data.updatedBy || "Admin",
      });

      if (childrenWithDetails.length > 0) {
        setBoqItems(
          childrenWithDetails.map((child: any) => ({
            id: child.id,
            uuid: child.uuid,
            serviceWorkRequisitionId:
              child.serviceWorkRequisitionId || item.uuid,
            date:
              toYMD(child.date) ||
              toYMD(data.requisitionDate || item.requisitionDate) ||
              new Date().toISOString().slice(0, 10),
            code: child.code || "",
            serviceItemName: child.serviceItemName || "",
            unitType: child.unitType || "Day",
            qtyDays: Number(child.qtyDays ?? 0),
            rate: Number(child.rate ?? 0),
            scopeDetailsOrRemarks: child.scopeDetailsOrRemarks || "",
            amount: Number(
              child.amount ??
                Number(child.qtyDays ?? 0) * Number(child.rate ?? 0),
            ),
            createdBy: child.createdBy || "",
            updatedBy: child.updatedBy || "",
          })),
        );
      } else {
        setBoqItems([
          {
            date:
              toYMD(data.requisitionDate || item.requisitionDate) ||
              new Date().toISOString().slice(0, 10),
            code: generateItemCode(),
            serviceItemName: "",
            unitType: "Day",
            qtyDays: 1,
            rate: 0,
            scopeDetailsOrRemarks: "",
            amount: 0,
          },
        ]);
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

      const parentPayload = {
        requisitionDate: toYMD(formData.requisitionDate),
        requisitionCode: formData.requisitionCode,
        projectType: formData.projectType,
        targetProjectId: formData.targetProjectId,
        titleOrWorkNameId:
          workOrderOptions.find(
            (option) => option.uuid === formData.titleOrWorkNameId,
          )?.categoryId || formData.titleOrWorkNameId,
        taskSubcategory: formData.taskSubcategory,
        constructionSiteId: formData.constructionSiteId,
        subtotalAmount,
        grandTotalPayable,
        supportingAttachment: formData.supportingAttachment.trim() || null,
        addedById: formData.addedById,
        updatedBy: formData.updatedBy,
      };

      await updateRequisition(selectedItem.uuid, parentPayload);

      const originalChildren: ServiceWorkItem[] = Array.isArray(
        selectedItem.items,
      )
        ? selectedItem.items
        : [];
      const currentChildUuids = new Set(
        boqItems
          .map((child) => child.uuid)
          .filter((uuid): uuid is string => Boolean(uuid)),
      );

      for (const oldChild of originalChildren) {
        if (oldChild.uuid && !currentChildUuids.has(oldChild.uuid)) {
          await deleteRequisitionItem(oldChild.uuid);
        }
      }

      for (const child of boqItems) {
        const itemPayload = {
          serviceWorkRequisitionId: selectedItem.uuid,
          date: toYMD(child.date),
          code: child.code,
          serviceItemName: child.serviceItemName,
          unitType: child.unitType,
          qtyDays: Number(child.qtyDays),
          rate: Number(child.rate),
          scopeDetailsOrRemarks: child.scopeDetailsOrRemarks,
          amount: Number(calculateItemAmount(child)),
          updatedBy: formData.updatedBy,
        };

        if (child.uuid) {
          await updateRequisitionItem(child.uuid, itemPayload);
        } else {
          await createRequisitionItem({
            ...itemPayload,
            createdBy: formData.createdBy,
          });
        }
      }

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
  const handleDelete = async (item: RequisitionItem) => {
    if (!item.uuid) {
      alert("Requisition UUID not found.");
      return;
    }
    if (!confirm(`Delete requisition "${item.requisitionCode}"?`)) return;
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

  // ==================== OPEN VIEW ====================
  const openViewModal = async (item: RequisitionItem) => {
    try {
      setActionLoading(true);
      if (!item.uuid) throw new Error("Requisition UUID not found.");

      const result = await fetchRequisitionById(item.uuid);
      const data = result?.data?.data || result?.data || result;

      setSelectedItem({
        ...item,
        ...data,
        requisitionDate: formatDisplayDate(
          data.requisitionDate || item.requisitionDate,
        ),
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
            Service Work Requisition List
          </span>
        </div>

        {/* HEADER */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Service Work Requisition Dashboard
            </h1>
            <p className="text-[11px] text-slate-500">
              Manage, create, update, and track all service work requisitions.
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
              <Plus className="w-3.5 h-3.5" />
              +New Service Work Requisition
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
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
              Project Type
            </label>
            <select
              value={projectTypeFilter}
              onChange={(e) => setProjectTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Project Types</option>
              {projectTypeOptions.map((pt) => (
                <option key={pt.uuid} value={pt.name}>
                  {pt.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">
              Target Project
            </label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Projects</option>
              {projectOptions.map((p) => (
                <option key={p.uuid} value={p.uuid}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block font-semibold text-slate-600 mb-1">
              Title / Name of Work
            </label>
            <select
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Titles</option>
              {workOrderOptions.map((wo) => (
                <option key={wo.uuid} value={wo.uuid}>
                  {wo.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SEARCH */}
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

        {/* LOADING */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading service work requisitions...
          </div>
        )}

        {/* ERROR */}
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
                    <th className="py-3 px-3">REQUISITION DATE</th>
                    <th className="py-3 px-3">CODE</th>
                    <th className="py-3 px-3">PROJECT TYPE</th>
                    <th className="py-3 px-3">TARGET PROJECT</th>
                    <th className="py-3 px-3">TITLE / WORK</th>
                    <th className="py-3 px-3">SUBCATEGORY</th>
                    <th className="py-3 px-3">SITE</th>
                    <th className="py-3 px-3 text-right">SUBTOTAL</th>
                    <th className="py-3 px-3 text-right">GRAND TOTAL</th>
                    <th className="py-3 px-3">ADDED BY</th>
                    <th className="py-3 px-3">STATUS</th>
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
                        <td className="py-3 px-3 text-slate-600">
                          {item.requisitionDate}
                        </td>
                        <td className="py-3 px-3 font-mono text-indigo-700 font-semibold">
                          {item.requisitionCode}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700">
                          {item.projectType}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {item.targetProjectId}
                        </td>
                        <td className="py-3 px-3 text-slate-600 italic">
                          {item.titleOrWorkNameId || "N/A"}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {item.taskSubcategory || "N/A"}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {item.constructionSiteId || "N/A"}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-slate-700">
                          {item.subtotalAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-indigo-700">
                          {item.grandTotalPayable.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700">
                          {item.addedById || "—"}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                              item.status === "approved"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : item.status === "rejected"
                                  ? "bg-rose-50 text-rose-600 border border-rose-100"
                                  : "bg-amber-50 text-amber-600 border border-amber-100"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {item.supportingAttachment ? (
                            <a
                              href={item.supportingAttachment}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center p-1 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100 hover:bg-indigo-100"
                              title={item.supportingAttachment}
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center relative">
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveDropdown(
                                  activeDropdown === item.id ? null : item.id,
                                )
                              }
                              className="inline-flex items-center gap-1 bg-[#5949d6] hover:bg-[#4d3ec2] text-white text-[11px] font-semibold px-3 py-1.5 rounded shadow-2xs transition-colors cursor-pointer"
                            >
                              Action
                              <ChevronDown className="w-3 h-3" />
                            </button>

                            {activeDropdown === item.id && (
                              <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-xl z-20 py-1 text-left text-xs">
                                <button
                                  type="button"
                                  onClick={() => openViewModal(item)}
                                  className="w-full px-3 py-1.5 text-slate-700 hover:bg-indigo-50 flex items-center gap-2 cursor-pointer font-medium"
                                >
                                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                  View Details
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(item)}
                                  disabled={actionLoading}
                                  className="w-full px-3 py-1.5 text-slate-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer font-medium disabled:opacity-50"
                                >
                                  <Edit className="w-3.5 h-3.5 text-amber-600" />
                                  Edit Record
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(item)}
                                  disabled={actionLoading}
                                  className="w-full px-3 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-medium disabled:opacity-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={15}
                        className="text-center py-12 text-slate-400 font-medium"
                      >
                        No service work requisition data available in table
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-3 border-t border-slate-200 bg-white gap-2 text-xs text-slate-500 font-medium">
              <div>
                Showing 1 to {Math.min(entriesPerPage, filteredData.length)} of{" "}
                {filteredData.length} entries
              </div>
              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  disabled
                  className="px-3 py-1 rounded border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="px-3 py-1 rounded border border-[#5949d6] bg-[#5949d6] text-white font-semibold"
                >
                  1
                </button>
                <button
                  type="button"
                  disabled
                  className="px-3 py-1 rounded border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= ADD MODAL ================= */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden border border-slate-200">
            <div className="bg-[#5949d6] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create New Service Work Requisition
              </h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleAddSubmit}
              className="p-6 space-y-5 text-xs overflow-y-auto max-h-[calc(95vh-70px)]"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Requisition Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.requisitionDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requisitionDate: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Requisition Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.requisitionCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requisitionCode: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Project Type *
                  </label>
                  <select
                    required
                    value={formData.projectType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        projectType: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Select Project Type</option>
                    {projectTypeOptions.length === 0 ? (
                      <option value="" disabled>
                        Loading project types...
                      </option>
                    ) : (
                      projectTypeOptions.map((pt) => (
                        <option key={pt.uuid} value={pt.name}>
                          {pt.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Target Project *
                  </label>
                  <select
                    required
                    value={formData.targetProjectId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetProjectId: e.target.value,
                        constructionSiteId: "",
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Select Project</option>
                    {projectOptions.length === 0 ? (
                      <option value="" disabled>
                        Loading projects...
                      </option>
                    ) : (
                      projectOptions.map((p) => (
                        <option key={p.uuid} value={p.uuid}>
                          {p.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Title / Name of Work — DROPDOWN */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Title / Name of Work *
                  </label>
                  <select
                    required
                    value={formData.titleOrWorkNameId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        titleOrWorkNameId: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Select Title/Name of Work</option>
                    {workOrderOptions.length === 0 ? (
                      <option value="" disabled>
                        Loading work orders...
                      </option>
                    ) : (
                      workOrderOptions.map((wo) => (
                        <option key={wo.uuid} value={wo.uuid}>
                          {wo.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Task Subcategory — DYNAMIC DROPDOWN */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Task Subcategory *
                  </label>
                  <select
                    required
                    value={formData.taskSubcategory}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        taskSubcategory: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Select Subcategory</option>
                    {subCategoryOptions.length === 0 ? (
                      <option value="" disabled>
                        Loading subcategories...
                      </option>
                    ) : (
                      subCategoryOptions.map((sc) => (
                        <option key={sc.uuid} value={sc.uuid}>
                          {sc.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Construction Site *
                  </label>
                  <select
                    required
                    value={formData.constructionSiteId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        constructionSiteId: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Select Site</option>
                    {siteOptions.length === 0 ? (
                      <option value="" disabled>
                        Loading sites...
                      </option>
                    ) : (
                      siteOptions
                        .filter(
                          (site) =>
                            !site.projectId ||
                            !formData.targetProjectId ||
                            site.projectId === formData.targetProjectId,
                        )
                        .map((site) => (
                          <option key={site.uuid} value={site.uuid}>
                            {site.name}
                          </option>
                        ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Added By ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.addedById}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        addedById: e.target.value,
                      })
                    }
                    placeholder="USER-001"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Supporting Attachment
                  </label>
                  <input
                    type="text"
                    value={formData.supportingAttachment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        supportingAttachment: e.target.value,
                      })
                    }
                    placeholder="document.pdf"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* BOQ */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-bold text-slate-800">
                      Service / Work Items
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={addBoqItem}
                    className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px] text-xs">
                    <thead>
                      <tr className="bg-[#5949d6] text-white">
                        <th className="px-3 py-2 text-left">DATE</th>
                        <th className="px-3 py-2 text-left">CODE</th>
                        <th className="px-3 py-2 text-left">SERVICE ITEM</th>
                        <th className="px-3 py-2 text-left">UNIT</th>
                        <th className="px-3 py-2 text-right">QTY/DAYS</th>
                        <th className="px-3 py-2 text-right">RATE</th>
                        <th className="px-3 py-2 text-right">AMOUNT</th>
                        <th className="px-3 py-2 text-left">REMARKS</th>
                        <th className="px-3 py-2 text-center">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {boqItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-2 py-2">
                            <input
                              type="date"
                              value={item.date}
                              onChange={(e) =>
                                updateBoqItem(index, "date", e.target.value)
                              }
                              className="w-32 border border-slate-300 rounded px-2 py-1.5"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={item.code}
                              onChange={(e) =>
                                updateBoqItem(index, "code", e.target.value)
                              }
                              className="w-32 border border-slate-300 rounded px-2 py-1.5 font-mono"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              required
                              value={item.serviceItemName}
                              onChange={(e) =>
                                updateBoqItem(
                                  index,
                                  "serviceItemName",
                                  e.target.value,
                                )
                              }
                              placeholder="Electrical Installation"
                              className="w-48 border border-slate-300 rounded px-2 py-1.5"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={item.unitType}
                              onChange={(e) =>
                                updateBoqItem(index, "unitType", e.target.value)
                              }
                              className="w-24 border border-slate-300 rounded px-2 py-1.5"
                            >
                              <option value="Day">Day</option>
                              <option value="Hour">Hour</option>
                              <option value="Job">Job</option>
                              <option value="Unit">Unit</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              value={item.qtyDays}
                              onChange={(e) =>
                                updateBoqItem(
                                  index,
                                  "qtyDays",
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
                              value={item.rate}
                              onChange={(e) =>
                                updateBoqItem(
                                  index,
                                  "rate",
                                  Number(e.target.value),
                                )
                              }
                              className="w-28 border border-slate-300 rounded px-2 py-1.5 text-right"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-indigo-700">
                            {calculateItemAmount(item).toLocaleString()}
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={item.scopeDetailsOrRemarks}
                              onChange={(e) =>
                                updateBoqItem(
                                  index,
                                  "scopeDetailsOrRemarks",
                                  e.target.value,
                                )
                              }
                              placeholder="Work details..."
                              className="w-56 border border-slate-300 rounded px-2 py-1.5"
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

                <div className="bg-slate-50 border-t border-slate-200 px-4 py-4">
                  <div className="flex justify-end">
                    <div className="w-full sm:w-80 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-600">
                          Subtotal:
                        </span>
                        <span className="font-bold text-slate-800">
                          {subtotalAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-300 pt-2">
                        <span className="font-bold text-slate-800">
                          Grand Total Payable:
                        </span>
                        <span className="font-bold text-indigo-700 text-sm">
                          {grandTotalPayable.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#5949d6] hover:bg-[#4d3ec2] text-white rounded-lg shadow-sm cursor-pointer font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {isEditOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden border border-slate-200">
            <div className="bg-[#5949d6] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit Service Work Requisition — {selectedItem.requisitionCode}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Requisition Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.requisitionDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requisitionDate: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Requisition Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.requisitionCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requisitionCode: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Project Type *
                  </label>
                  <select
                    required
                    value={formData.projectType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        projectType: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="">Select Project Type</option>
                    {projectTypeOptions.map((pt) => (
                      <option key={pt.uuid} value={pt.name}>
                        {pt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Target Project *
                  </label>
                  <select
                    required
                    value={formData.targetProjectId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetProjectId: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="">Select Project</option>
                    {projectOptions.map((p) => (
                      <option key={p.uuid} value={p.uuid}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Title / Name of Work *
                  </label>
                  <select
                    required
                    value={formData.titleOrWorkNameId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        titleOrWorkNameId: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="">Select Title/Name of Work</option>
                    {workOrderOptions.map((wo) => (
                      <option key={wo.uuid} value={wo.uuid}>
                        {wo.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Task Subcategory — DYNAMIC DROPDOWN */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Task Subcategory *
                  </label>
                  <select
                    required
                    value={formData.taskSubcategory}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        taskSubcategory: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="">Select Subcategory</option>
                    {subCategoryOptions.map((sc) => (
                      <option key={sc.uuid} value={sc.uuid}>
                        {sc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Construction Site *
                  </label>
                  <select
                    required
                    value={formData.constructionSiteId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        constructionSiteId: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="">Select Site</option>
                    {siteOptions
                      .filter(
                        (site) =>
                          !site.projectId ||
                          !formData.targetProjectId ||
                          site.projectId === formData.targetProjectId,
                      )
                      .map((site) => (
                        <option key={site.uuid} value={site.uuid}>
                          {site.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Added By ID
                  </label>
                  <input
                    type="text"
                    value={formData.addedById}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        addedById: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Supporting Attachment
                  </label>
                  <input
                    type="text"
                    value={formData.supportingAttachment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        supportingAttachment: e.target.value,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-bold text-slate-800">
                      Service / Work Items
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={addBoqItem}
                    className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px] text-xs">
                    <thead>
                      <tr className="bg-[#5949d6] text-white">
                        <th className="px-3 py-2 text-left">DATE</th>
                        <th className="px-3 py-2 text-left">CODE</th>
                        <th className="px-3 py-2 text-left">SERVICE ITEM</th>
                        <th className="px-3 py-2 text-left">UNIT</th>
                        <th className="px-3 py-2 text-right">QTY/DAYS</th>
                        <th className="px-3 py-2 text-right">RATE</th>
                        <th className="px-3 py-2 text-right">AMOUNT</th>
                        <th className="px-3 py-2 text-left">REMARKS</th>
                        <th className="px-3 py-2 text-center">ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {boqItems.map((item, index) => (
                        <tr key={item.uuid || item.id || index}>
                          <td className="px-2 py-2">
                            <input
                              type="date"
                              value={item.date}
                              onChange={(e) =>
                                updateBoqItem(index, "date", e.target.value)
                              }
                              className="w-32 border border-slate-300 rounded px-2 py-1.5"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={item.code}
                              onChange={(e) =>
                                updateBoqItem(index, "code", e.target.value)
                              }
                              className="w-32 border border-slate-300 rounded px-2 py-1.5 font-mono"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={item.serviceItemName}
                              onChange={(e) =>
                                updateBoqItem(
                                  index,
                                  "serviceItemName",
                                  e.target.value,
                                )
                              }
                              className="w-48 border border-slate-300 rounded px-2 py-1.5"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={item.unitType}
                              onChange={(e) =>
                                updateBoqItem(index, "unitType", e.target.value)
                              }
                              className="w-24 border border-slate-300 rounded px-2 py-1.5"
                            >
                              <option value="Day">Day</option>
                              <option value="Hour">Hour</option>
                              <option value="Job">Job</option>
                              <option value="Unit">Unit</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              value={item.qtyDays}
                              onChange={(e) =>
                                updateBoqItem(
                                  index,
                                  "qtyDays",
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
                              value={item.rate}
                              onChange={(e) =>
                                updateBoqItem(
                                  index,
                                  "rate",
                                  Number(e.target.value),
                                )
                              }
                              className="w-28 border border-slate-300 rounded px-2 py-1.5 text-right"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-indigo-700">
                            {calculateItemAmount(item).toLocaleString()}
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={item.scopeDetailsOrRemarks}
                              onChange={(e) =>
                                updateBoqItem(
                                  index,
                                  "scopeDetailsOrRemarks",
                                  e.target.value,
                                )
                              }
                              className="w-56 border border-slate-300 rounded px-2 py-1.5"
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

                <div className="bg-slate-50 border-t border-slate-200 px-4 py-4">
                  <div className="flex justify-end">
                    <div className="w-80 space-y-2">
                      <div className="flex justify-between">
                        <span className="font-semibold">Subtotal:</span>
                        <span className="font-bold">
                          {subtotalAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-300 pt-2">
                        <span className="font-bold">Grand Total Payable:</span>
                        <span className="font-bold text-indigo-700">
                          {grandTotalPayable.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
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
                  Update Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= VIEW MODAL ================= */}
      {isViewModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" />
                Requisition Details: {selectedItem.requisitionCode}
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
                  <span className="text-slate-500 font-medium">
                    Requisition Date
                  </span>
                  <p className="font-bold text-slate-800">
                    {selectedItem.requisitionDate}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">
                    Requisition Code
                  </span>
                  <p className="font-mono font-bold text-indigo-700">
                    {selectedItem.requisitionCode}
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
                  <span className="text-slate-500 font-medium">
                    Target Project
                  </span>
                  <p className="font-bold text-slate-800">
                    {selectedItem.targetProjectId}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">
                    Title / Work
                  </span>
                  <p className="font-bold text-slate-800">
                    {selectedItem.titleOrWorkNameId}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">
                    Task Subcategory
                  </span>
                  <p className="font-bold text-slate-800">
                    {selectedItem.taskSubcategory}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">
                    Construction Site
                  </span>
                  <p className="font-bold text-slate-800">
                    {selectedItem.constructionSiteId}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Added By</span>
                  <p className="font-bold text-slate-800">
                    {selectedItem.addedById}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Status</span>
                  <p className="font-bold text-amber-600 uppercase">
                    {selectedItem.status}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Attachment</span>
                  <p className="font-bold">
                    {selectedItem.supportingAttachment ? (
                      <a
                        href={selectedItem.supportingAttachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 underline inline-flex items-center gap-1"
                      >
                        <Paperclip className="w-3 h-3" />
                        View Attachment
                      </a>
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <h4 className="font-bold text-slate-800">
                    Service / Work Items
                  </h4>
                </div>

                {selectedItem.items && selectedItem.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#5949d6] text-white">
                          <th className="px-3 py-2 text-left">DATE</th>
                          <th className="px-3 py-2 text-left">CODE</th>
                          <th className="px-3 py-2 text-left">SERVICE ITEM</th>
                          <th className="px-3 py-2 text-left">UNIT</th>
                          <th className="px-3 py-2 text-right">QTY</th>
                          <th className="px-3 py-2 text-right">RATE</th>
                          <th className="px-3 py-2 text-right">AMOUNT</th>
                          <th className="px-3 py-2 text-left">REMARKS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedItem.items.map((child, index) => (
                          <tr key={child.uuid || index}>
                            <td className="px-3 py-2">
                              {formatDisplayDate(child.date)}
                            </td>
                            <td className="px-3 py-2 font-mono text-indigo-700">
                              {child.code}
                            </td>
                            <td className="px-3 py-2 font-semibold">
                              {child.serviceItemName}
                            </td>
                            <td className="px-3 py-2">{child.unitType}</td>
                            <td className="px-3 py-2 text-right">
                              {child.qtyDays}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {Number(child.rate).toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-indigo-700">
                              {Number(child.amount).toLocaleString()}
                            </td>
                            <td className="px-3 py-2">
                              {child.scopeDetailsOrRemarks}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400">
                    No service/work items found.
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <div className="w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-600">
                      Subtotal
                    </span>
                    <span className="font-bold">
                      {Number(selectedItem.subtotalAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-2">
                    <span className="font-bold text-slate-800">
                      Grand Total Payable
                    </span>
                    <span className="font-bold text-indigo-700">
                      {Number(selectedItem.grandTotalPayable).toLocaleString()}
                    </span>
                  </div>
                </div>
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
