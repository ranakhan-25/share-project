/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, X, Loader2, Eye, Printer, Edit3, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002";
const API_PATH = `${API_BASE}/realbizpro/api/v1`;

// ✅ Default Units List
const DEFAULT_UNITS = [
  "Kg", "Bag", "Cft", "Litre", "Pcs", "Sft", "Feet", "Lit.", "Tk.", "Goj.", "Drum", "Gallon", "Job", "Nos", "Rft", "RMT", "Pkt"
];

// ====================== TYPES ======================
interface QuoteItem {
  id: string;
  itemName: string;
  unit: string;
  quantity: number;
  rate: number;
  details: string;
  image: string;
  amount: number;
}

interface Quote {
  id: string;
  uuid: string;
  code: string;
  title: string;
  recordDate: string;
  amount: string;
  status: string;
  description: string;
  project?: { name: string; uuid: string };
  details?: {
    customerId?: string;
    customerName?: string;
    projectType?: string;
    site?: string;
    contentBody?: string;
    contentFooter?: string;
    items?: QuoteItem[];
    subtotal?: number;
    vatPercent?: number;
    vatAmount?: number;
    deliveryCharge?: number;
    discountPercent?: number;
    discountAmount?: number;
    grandTotal?: number;
    attachment?: string;
    isApproved?: boolean;
  };
}

// ====================== PRINT COMPONENT ======================
const QuotePrintTemplate = React.forwardRef<HTMLDivElement, { quote: Quote | null }>(({ quote }, ref) => {
  if (!quote) return null;

  const subtotal = quote.details?.subtotal || 0;
  const grandTotal = Number(quote.amount) || 0;

  return (
    <div ref={ref} className="p-8 bg-white text-gray-800" style={{ fontFamily: "Arial, sans-serif" }}>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-900 mb-2">QUOTE</h1>
          <div className="text-sm">
            <p className="font-bold">TO,</p>
            <p className="font-bold">Director General</p>
            <p><span className="font-bold">Name:</span> {quote.details?.customerName || "N/A"}</p>
            <p><span className="font-bold">Mobile:</span> {quote.details?.site || "N/A"}</p>
            <p><span className="font-bold">Address:</span> Dhaka, Bangladesh</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end mb-4">
             <div className="text-2xl font-bold text-blue-900">API</div>
             <div className="text-xs font-bold text-gray-500">ENGINEERING™<br/>www.apiengineering.ltd</div>
          </div>
          <div className="text-sm">
            <p><span className="font-bold">Quote No:</span> {quote.code}</p>
            <p><span className="font-bold">Date:</span> {quote.recordDate}</p>
            <p><span className="font-bold">Project:</span> {quote.project?.name || "N/A"}</p>
            <p><span className="font-bold">Prepared By:</span> Admin</p>
            <p><span className="font-bold">Print Time:</span> {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="mb-4 text-sm">{quote.details?.contentBody || ""}</div>

      <table className="w-full border-collapse border border-gray-300 text-sm mb-4">
        <thead>
          <tr className="bg-gray-700 text-white">
            <th className="border border-gray-300 px-2 py-1 text-center w-12">SL</th>
            <th className="border border-gray-300 px-2 py-1 text-left">Description</th>
            <th className="border border-gray-300 px-2 py-1 text-center w-16">Unit</th>
            <th className="border border-gray-300 px-2 py-1 text-center w-16">Qty</th>
            <th className="border border-gray-300 px-2 py-1 text-right w-24">Rate</th>
            <th className="border border-gray-300 px-2 py-1 text-right w-24">Total</th>
          </tr>
        </thead>
        <tbody>
          {quote.details?.items?.map((item, idx) => (
            <tr key={idx}>
              <td className="border border-gray-300 px-2 py-1 text-center">{idx + 1}</td>
              <td className="border border-gray-300 px-2 py-1">{item.itemName}</td>
              <td className="border border-gray-300 px-2 py-1 text-center">{item.unit}</td>
              <td className="border border-gray-300 px-2 py-1 text-center">{item.quantity}</td>
              <td className="border border-gray-300 px-2 py-1 text-right">{Number(item.rate).toFixed(2)}</td>
              <td className="border border-gray-300 px-2 py-1 text-right">{Number(item.amount).toFixed(2)}</td>
            </tr>
          ))}
          {(!quote.details?.items || quote.details.items.length === 0) && (
            <tr><td colSpan={6} className="border border-gray-300 px-2 py-4 text-center">No items found</td></tr>
          )}
        </tbody>
      </table>

      <div className="flex justify-end mb-6">
        <div className="w-1/2">
          <div className="flex justify-between border-b border-gray-300 py-1">
            <span className="font-bold">Subtotal :</span>
            <span>{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between bg-gray-700 text-white py-1 px-2 font-bold">
            <span>Grand Total :</span>
            <span>{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-gray-100 p-2 mb-8">
          <span className="font-bold">In Words:</span> Taka Only
        </div>
        <div className="text-sm">
          <p className="font-bold underline">Tazmul Reza</p>
          <p>Somikoron IT Ltd</p>
          <p>Mob: 01323202709</p>
          <p>Office: Hasan Holdings, New Eskaton Road, Banglamotor, Dhaka</p>
        </div>
      </div>
    </div>
  );
});
QuotePrintTemplate.displayName = "QuotePrintTemplate";


export default function QuotePage() {
  const [dataList, setDataList] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Quote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Print functionality
  const [printData, setPrintData] = useState<Quote | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Quote-${printData?.code || "Document"}`,
    pageStyle: `
      @page { size: A4; margin: 0; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  // Modals States
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false); 
  
  const [isCustomerSubmitting, setIsCustomerSubmitting] = useState(false);
  const [isItemSubmitting, setIsItemSubmitting] = useState(false);
  const [isBrandSubmitting, setIsBrandSubmitting] = useState(false);
  const [isUnitSubmitting, setIsUnitSubmitting] = useState(false); 

  // Dropdown Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [projectTypes, setProjectTypes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [unitsList, setUnitsList] = useState<any[]>([]); 
  
  // Filter States
  const [filterProject, setFilterProject] = useState("");
  const [filterProjectType, setFilterProjectType] = useState("");

  // Form Data
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    customerId: "",
    customerName: "",
    code: `QUO${Math.floor(1000 + Math.random() * 9000)}`,
    projectType: "",
    projectId: "",
    site: "",
    attachment: "",
    contentBody: "",
    contentFooter: "",
    items: [] as QuoteItem[],
    vatPercent: 0,
    deliveryCharge: 0,
    discountPercent: 0,
  });

  // Selected Category & Subcategory
  const [selectedCat, setSelectedCat] = useState("");
  const [selectedSubCat, setSelectedSubCat] = useState("");

  // New Customer Form
  const [newCustomer, setNewCustomer] = useState({ 
    customerCode: `CUS${Date.now().toString().slice(-6)}`, 
    customerName: "", 
    mobileNo: "", 
    businessName: "", 
    address: "",
    dueDate: "",
    chartOfGroups: ""
  });

  // New Item Form
  const [newItemForm, setNewItemForm] = useState({
    categoryId: "",
    subCategoryId: "",
    brand: "",
    itemName: "",
    unit: "",
    purchasePrice: 0,
    salePrice: 0,
  });

  // New Brand & Unit Form
  const [newBrandName, setNewBrandName] = useState("");
  const [newUnitName, setNewUnitName] = useState(""); 

  // ====================== FETCH LISTS ======================
  const fetchQuotes = async (page = 1) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_PATH}/project-billing/quotes?page=${page}&limit=${limit}`);
      const json = await res.json();
      if (json.success) {
        setDataList((json.data.data || []).filter((item: any) => !item.deletedAt));
        if (json.data.meta) {
           setTotalPages(json.data.meta.totalPages || 1);
           setCurrentPage(json.data.meta.page || 1);
        }
      }
    } catch (err) {
      toast.error("Failed to load quotes");
    } finally {
      setLoading(false);
    }
  };

  // ====================== FETCH DROPDOWNS ======================
  const fetchDropdowns = async () => {
    try {
      const resCus = await fetch(`${API_PATH}/customer-account?status=active`);
      const jsonCus = await resCus.json();
      if (jsonCus.success) setCustomers(jsonCus.data.data || jsonCus.data || []);

      const resProj = await fetch(`${API_PATH}/project`);
      const jsonProj = await resProj.json();
      if (jsonProj.success) setProjects(jsonProj.data.data || jsonProj.data || []);

      const resSite = await fetch(`${API_PATH}/project-sites`);
      const jsonSite = await resSite.json();
      if (jsonSite.success) setSites(jsonSite.data.data || jsonSite.data || []);

      const resType = await fetch(`${API_PATH}/project-type`);
      const jsonType = await resType.json();
      if (jsonType.success) setProjectTypes(jsonType.data.data || jsonType.data || []);

      const resCat = await fetch(`${API_PATH}/category`);
      const jsonCat = await resCat.json();
      if (jsonCat.success) setCategories(jsonCat.data.data || jsonCat.data || []);

      const resSubCat = await fetch(`${API_PATH}/billing-sub-category`);
      const jsonSubCat = await resSubCat.json();
      if (jsonSubCat.success) setSubCategories(jsonSubCat.data.data || jsonSubCat.data || []);

      const resItem = await fetch(`${API_PATH}/item`);
      const jsonItem = await resItem.json();
      if (jsonItem.success) setItemsList(jsonItem.data.data || jsonItem.data || []);

      const resBrand = await fetch(`${API_PATH}/procurement/brand`); 
      const jsonBrand = await resBrand.json();
      if (jsonBrand.success) setBrands(jsonBrand.data.data || jsonBrand.data || []);

      const resUnit = await fetch(`${API_PATH}/unit`);
      const jsonUnit = await resUnit.json();
      if (jsonUnit.success) setUnitsList(jsonUnit.data.data || jsonUnit.data || []);

    } catch (err) {
      console.error("Error fetching dropdowns:", err);
      toast.error("Failed to load some dropdown data");
    }
  };

  useEffect(() => {
    fetchQuotes(currentPage);
    fetchDropdowns();
  }, [currentPage]);

  // Filters
  const filteredSubCats = selectedCat 
    ? subCategories.filter(sc => sc.categoryId === selectedCat) 
    : subCategories;

  const filteredItems = selectedSubCat 
    ? itemsList.filter(item => item.subCategoryId === selectedSubCat) 
    : itemsList;

  const filteredSites = formData.projectId 
    ? sites.filter(s => String(s.projectId).toLowerCase() === String(formData.projectId).toLowerCase()) 
    : sites;

  // ====================== ITEM HANDLERS ======================
  const addEmptyRow = () => {
    const newItem: QuoteItem = {
      id: Date.now().toString(),
      itemName: "",
      unit: "",
      quantity: 0,
      rate: 0,
      details: "",
      image: "",
      amount: 0,
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const updateRow = (id: string, field: keyof QuoteItem, value: any) => {
    const updatedItems = formData.items.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };
        
        if (field === "itemName") {
          const itemData = itemsList.find(i => i.itemName === value);
          if (itemData) {
            updatedRow.rate = Number(itemData.salePrice) || 0;
            updatedRow.unit = itemData.unit || "";
            updatedRow.amount = Number(updatedRow.quantity) * updatedRow.rate;
          }
        }

        if (field === "quantity" || field === "rate") {
          updatedRow.amount = Number(updatedRow.quantity) * Number(updatedRow.rate);
        }
        return updatedRow;
      }
      return row;
    });
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const removeRow = (id: string) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter(r => r.id !== id) }));
  };

  // ====================== CALCULATIONS ======================
  const subtotal = formData.items.reduce((acc, row) => acc + (Number(row.quantity) * Number(row.rate)), 0);
  const vatAmount = (subtotal * formData.vatPercent) / 100;
  const discountAmount = (subtotal * formData.discountPercent) / 100;
  const grandTotal = subtotal + vatAmount + Number(formData.deliveryCharge) - discountAmount;

  // ====================== SUBMIT QUOTE ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      projectId: formData.projectId,
      title: formData.contentBody ? formData.contentBody.substring(0, 50) : "Quote Title",
      code: formData.code,
      recordDate: formData.date,
      amount: grandTotal,
      status: "active",
      description: formData.contentBody || "",
      details: {
        customerId: formData.customerId,
        customerName: formData.customerName,
        projectType: formData.projectType,
        site: formData.site,
        contentBody: formData.contentBody,
        contentFooter: formData.contentFooter,
        items: formData.items,
        subtotal,
        vatPercent: formData.vatPercent,
        vatAmount,
        deliveryCharge: formData.deliveryCharge,
        discountPercent: formData.discountPercent,
        discountAmount,
        grandTotal,
        attachment: formData.attachment,
      },
    };

    try {
      const isEdit = !!editingItem;
      const url = isEdit
        ? `${API_PATH}/project-billing/quotes/${editingItem!.uuid}`
        : `${API_PATH}/project-billing/quotes`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok || json.success) {
        toast.success(isEdit ? "Updated successfully!" : "Created successfully!");
        setIsModalOpen(false);
        setEditingItem(null);
        fetchQuotes(currentPage);
      } else {
        toast.error(json.message || "Failed to save quote");
      }
    } catch (err: any) {
      toast.error("Network Error");
    } finally {
      setSubmitting(false);
    }
  };

  // ====================== CREATE NEW ITEM ======================
  const handleCreateNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.categoryId) {
      toast.error("Category is required");
      return;
    }
    setIsItemSubmitting(true);

    const payload = {
      itemName: newItemForm.itemName,
      categoryId: newItemForm.categoryId,
      subCategoryId: newItemForm.subCategoryId || null,
      brand: newItemForm.brand,
      unit: newItemForm.unit,
      purchasePrice: Number(newItemForm.purchasePrice),
      salePrice: Number(newItemForm.salePrice),
      image: "string",
    };

    try {
      const res = await fetch(`${API_PATH}/item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok || json.success) {
        toast.success("New Item Created!");
        setIsNewItemModalOpen(false);
        setNewItemForm({ categoryId: "", subCategoryId: "", brand: "", itemName: "", unit: "", purchasePrice: 0, salePrice: 0 });
        fetchDropdowns();
      } else {
        toast.error(json.message || "Failed to create item");
      }
    } catch (err) {
      toast.error("Error creating item");
    } finally {
      setIsItemSubmitting(false);
    }
  };

  // ====================== CREATE BRAND ======================
  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName) return;
    setIsBrandSubmitting(true);

    try {
      const res = await fetch(`${API_PATH}/procurement/brand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBrandName }),
      });
      const json = await res.json();
      if (res.ok || json.success) {
        toast.success("Brand Created!");
        setIsBrandModalOpen(false);
        setNewBrandName("");
        fetchDropdowns();
      } else {
        toast.error(json.message || "Failed to create brand");
      }
    } catch (err) {
      toast.error("Error creating brand");
    } finally {
      setIsBrandSubmitting(false);
    }
  };

  // ====================== CREATE UNIT ======================
  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName) return;
    setIsUnitSubmitting(true);

    try {
      const res = await fetch(`${API_PATH}/unit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newUnitName, status: "active" }),
      });
      const json = await res.json();
      if (res.ok || json.success) {
        toast.success("Unit Created!");
        setIsUnitModalOpen(false);
        setNewUnitName("");
        fetchDropdowns();
      } else {
        toast.error(json.message || "Failed to create unit");
      }
    } catch (err) {
      toast.error("Error creating unit");
    } finally {
      setIsUnitSubmitting(false);
    }
  };

  // ====================== CREATE CUSTOMER ======================
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCustomerSubmitting(true);
    
    const payload = {
      customerCode: newCustomer.customerCode,
      customerName: newCustomer.customerName,
      mobileNo: newCustomer.mobileNo || "",
      email: "", 
      businessName: newCustomer.businessName || "",
      nidOrPassport: "",
      underGroup: newCustomer.chartOfGroups || "Default", 
      address: newCustomer.address || "",
      addedById: "user-uuid",
      status: "active"
    };

    try {
      const res = await fetch(`${API_PATH}/customer-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const json = await res.json();
      
      if (res.ok || json.success) {
        toast.success("Customer Created Successfully!");
        setIsCustomerModalOpen(false);
        setNewCustomer({ 
          customerCode: `CUS${Date.now().toString().slice(-6)}`, 
          customerName: "", 
          mobileNo: "", 
          businessName: "", 
          address: "",
          dueDate: "",
          chartOfGroups: ""
        });
        fetchDropdowns();
      } else {
        toast.error(json.message || "Failed to create customer");
      }
    } catch (err) {
      toast.error("Error connecting to server");
    } finally {
      setIsCustomerSubmitting(false);
    }
  };

  // ====================== DELETE ======================
  const handleDelete = async (item: Quote) => {
    if (!window.confirm(`Delete "${item.code}"?`)) return;
    try {
      const res = await fetch(`${API_PATH}/project-billing/quotes/${item.uuid}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Deleted successfully!");
        fetchQuotes(currentPage); 
      } else {
        toast.error("Failed to delete");
      }
    } catch (err) {
      toast.error("Error deleting");
    }
  };

  // ====================== OPEN MODALS ======================
  const handleCreate = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      customerId: "",
      customerName: "",
      code: `QUO${Math.floor(1000 + Math.random() * 9000)}`,
      projectType: "",
      projectId: "",
      site: "",
      attachment: "",
      contentBody: "",
      contentFooter: "",
      items: [],
      vatPercent: 0,
      deliveryCharge: 0,
      discountPercent: 0,
    });
    setSelectedCat("");
    setSelectedSubCat("");
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Quote) => {
    setEditingItem(item);
    setFormData({
      date: item.recordDate,
      customerId: item.details?.customerId || "",
      customerName: item.details?.customerName || "",
      code: item.code,
      projectType: item.details?.projectType || "",
      projectId: item.project?.uuid || "",
      site: item.details?.site || "",
      attachment: item.details?.attachment || "",
      contentBody: item.details?.contentBody || "",
      contentFooter: item.details?.contentFooter || "",
      items: item.details?.items || [],
      vatPercent: item.details?.vatPercent || 0,
      deliveryCharge: item.details?.deliveryCharge || 0,
      discountPercent: item.details?.discountPercent || 0,
    });
    setIsModalOpen(true);
  };

  // ====================== VIEW & PRINT HANDLERS ======================
  const handleView = (item: Quote) => {
    toast.success(`Viewing Quote: ${item.code}`);
  };

  const handlePrintClick = (item: Quote) => {
    setPrintData(item);
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  const filteredData = dataList.filter((item) => {
    const matchSearch = item.code?.toLowerCase().includes(search.toLowerCase()) || 
                        item.project?.name?.toLowerCase().includes(search.toLowerCase());
    const matchProject = filterProject ? item.project?.uuid === filterProject : true;
    const matchType = filterProjectType ? item.details?.projectType === filterProjectType : true;
    return matchSearch && matchProject && matchType;
  });

  // ====================== RENDER ======================
  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      
      <div style={{ display: "none" }}>
        <QuotePrintTemplate ref={printRef} quote={printData} />
      </div>

      {/* Top Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">Home &gt; Billing &gt; Quote List</div>
        <button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm flex items-center gap-1">
          <Plus className="w-4 h-4" /> New Quote
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 border rounded shadow-sm mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Select Date</label>
          <input type="text" placeholder="1 October, 2026 - 31 October, 2026" className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Project</label>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.uuid} value={p.uuid}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Project Type</label>
          <select value={filterProjectType} onChange={e => setFilterProjectType(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
            <option value="">All Project Types</option>
            {projectTypes.map(p => <option key={p.uuid} value={p.name}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* List Table */}
      <div className="bg-white p-4 border rounded shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <button className="bg-green-600 text-white px-3 py-1 rounded text-xs">Excel</button>
            <button className="bg-red-600 text-white px-3 py-1 rounded text-xs">PDF</button>
          </div>
          <div className="flex gap-2 items-center text-sm">
            <span>Search:</span>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded px-2 py-1" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  {["ID", "ORDER CODE", "DATE", "PROJECT TYPE", "PROJECT", "CUSTOMER NAME", "GRAND TOTAL", "ADDED BY", "APPROVE", "ATTACHMENT", "ACTION"].map(h => (
                    <th key={h} className="px-3 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.length === 0 ? (
                  <tr><td colSpan={11} className="text-center py-8 text-gray-500">No data available in table</td></tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.uuid} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{item.id}</td>
                      <td className="px-3 py-2">{item.code}</td>
                      <td className="px-3 py-2">{item.recordDate}</td>
                      <td className="px-3 py-2">{item.details?.projectType || "N/A"}</td>
                      <td className="px-3 py-2 font-medium">{item.project?.name || "Unknown"}</td>
                      <td className="px-3 py-2">{item.details?.customerName || "N/A"}</td>
                      <td className="px-3 py-2 font-bold text-green-700">{item.amount}</td>
                      <td className="px-3 py-2">Admin</td>
                      
                      <td className="px-3 py-2 text-center">
                        <div className="flex justify-center">
                          <input 
                            type="checkbox" 
                            checked={item.status === "approved" || item.details?.isApproved === true} 
                            readOnly 
                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </div>
                      </td>

                      <td className="px-3 py-2">
                        {item.details?.attachment ? (
                          <a href={item.details.attachment} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                            View File
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      <td className="px-3 py-2 flex gap-1">
                        <button onClick={() => handleView(item)} className="bg-indigo-500 text-white p-1.5 rounded hover:bg-indigo-600" title="View"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handlePrintClick(item)} className="bg-indigo-500 text-white p-1.5 rounded hover:bg-indigo-600" title="Print"><Printer className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleEdit(item)} className="bg-indigo-500 text-white p-1.5 rounded hover:bg-indigo-600" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(item)} className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Section */}
        <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
          <div>
            Showing page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            
            <button className="px-3 py-1 border rounded bg-indigo-600 text-white">
              {currentPage}
            </button>

            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ====================== ADD/EDIT MODAL (QUOTE ADD/OFFER) ====================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm overflow-y-auto">
          {/* ✅ max-h-[90vh] এবং flex-col ব্যবহার করা হয়েছে যাতে হেডার ফিক্সড থাকে এবং বডি স্ক্রল হয় */}
          <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] flex flex-col shadow-2xl relative my-auto">
            
            {/* Modal Header (Fixed) */}
            <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg shrink-0">
              <h2 className="text-lg font-bold text-gray-800">{editingItem ? "Edit Quote" : "Quote Add/Offer"}</h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setIsNewItemModalOpen(true)} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700">Item Add</button>
                <button type="button" onClick={() => setIsCustomerModalOpen(true)} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700">Contacts Add</button>
                <button type="button" onClick={() => { setIsModalOpen(false); }} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700">Quote List</button>
                <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full"><X className="w-5 h-5 text-gray-600" /></button>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto p-4 flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Date</label>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Customer</label>
                    <select value={formData.customerId} onChange={(e) => {
                      const cus = customers.find(c => c.uuid === e.target.value);
                      setFormData({ ...formData, customerId: e.target.value, customerName: cus?.customerName || "" });
                    }} className="w-full border rounded px-3 py-1.5 text-sm" required>
                      <option value="">Select value</option>
                      {customers.map(c => <option key={c.uuid} value={c.uuid}>{c.customerName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Code</label>
                    <input type="text" value={formData.code} readOnly className="w-full border rounded px-3 py-1.5 text-sm bg-gray-100" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Project Type</label>
                    <select value={formData.projectType} onChange={(e) => setFormData({ ...formData, projectType: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm">
                      <option value="">Select value</option>
                      {projectTypes.map(p => <option key={p.uuid} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Project</label>
                    <select value={formData.projectId} onChange={(e) => setFormData({ ...formData, projectId: e.target.value, site: "" })} className="w-full border rounded px-3 py-1.5 text-sm" required>
                      <option value="">Select Project</option>
                      {projects.map(p => <option key={p.uuid} value={p.uuid}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Site</label>
                    <select value={formData.site} onChange={(e) => setFormData({ ...formData, site: e.target.value })} className="w-full border rounded px-3 py-1.5 text-sm">
                      <option value="">Select Site</option>
                      {filteredSites.map(s => <option key={s.uuid} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Attachment</label>
                    <input type="file" onChange={(e) => setFormData({ ...formData, attachment: e.target.files?.[0]?.name || "" })} className="w-full border rounded px-3 py-1 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-indigo-50 file:text-indigo-700" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1 font-bold">Content Body</label>
                  <div className="border rounded bg-white">
                    <div className="p-2 border-b flex gap-3 text-sm text-gray-700 bg-gray-50"><span>File</span><span>Edit</span><span>View</span><span>Insert</span><span>Format</span><span>Tools</span><span>Table</span></div>
                    <textarea value={formData.contentBody} onChange={(e) => setFormData({ ...formData, contentBody: e.target.value })} className="w-full h-24 p-3 text-sm focus:outline-none resize-none" placeholder="Content Body..."></textarea>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-3 rounded border">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Category</label>
                    <select value={selectedCat} onChange={(e) => { setSelectedCat(e.target.value); setSelectedSubCat(""); }} className="w-full border rounded px-3 py-1.5 text-sm">
                      <option value="">All Categories</option>
                      {categories.map(c => <option key={c.uuid} value={c.uuid}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Sub Category</label>
                    <select value={selectedSubCat} onChange={(e) => setSelectedSubCat(e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm">
                      <option value="">All Sub Categories</option>
                      {filteredSubCats.map(sc => <option key={sc.uuid} value={sc.uuid}>{sc.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Select Item (Product / Material) *</label>
                    <select onChange={(e) => {
                      if(e.target.value) {
                        addEmptyRow();
                        setTimeout(() => {
                           const lastRowId = formData.items[formData.items.length - 1]?.id;
                           if(lastRowId) updateRow(lastRowId, "itemName", e.target.value);
                        }, 0);
                      }
                      e.target.value = ""; 
                    }} className="w-full border rounded px-3 py-1.5 text-sm">
                      <option value="">Search Item / Product / Material...</option>
                      {filteredItems.map(i => <option key={i.uuid} value={i.itemName}>{i.itemName}</option>)}
                    </select>
                  </div>
                </div>

                {/* DYNAMIC ITEMS TABLE */}
                <div className="overflow-x-auto border rounded">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-indigo-600 text-white">
                      <tr>
                        {["ITEM NAME", "UNIT", "QUANTITY", "RATE", "DETAILS", "IMAGE", "AMOUNT", "ACTION"].map(h => (
                          <th key={h} className="px-2 py-2 font-medium text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((row) => (
                        <tr key={row.id} className="border-b">
                          <td className="px-2 py-1">
                            <select value={row.itemName} onChange={e => updateRow(row.id, "itemName", e.target.value)} className="w-40 border rounded px-2 py-1">
                              <option value="">Select Item</option>
                              {itemsList.map(i => <option key={i.uuid} value={i.itemName}>{i.itemName}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-1">
                            <select value={row.unit} onChange={e => updateRow(row.id, "unit", e.target.value)} className="w-24 border rounded px-2 py-1">
                              <option value="">Select</option>
                              {unitsList.length > 0 ? (
                                 unitsList.map(u => <option key={u.uuid} value={u.name}>{u.name}</option>)
                              ) : (
                                 DEFAULT_UNITS.map((u, i) => <option key={i} value={u}>{u}</option>)
                              )}
                            </select>
                          </td>
                          <td className="px-2 py-1"><input type="number" value={row.quantity} onChange={e => updateRow(row.id, "quantity", e.target.value)} className="w-20 border rounded px-2 py-1" /></td>
                          <td className="px-2 py-1"><input type="number" value={row.rate} onChange={e => updateRow(row.id, "rate", e.target.value)} className="w-24 border rounded px-2 py-1" /></td>
                          <td className="px-2 py-1"><textarea value={row.details} onChange={e => updateRow(row.id, "details", e.target.value)} className="w-full border rounded px-2 py-1 text-xs" rows={1} placeholder="Description"></textarea></td>
                          <td className="px-2 py-1"><input type="file" className="w-32 text-xs" onChange={(e) => updateRow(row.id, "image", e.target.files?.[0]?.name || "")} /></td>
                          <td className="px-2 py-1 font-medium">{row.amount.toFixed(2)}</td>
                          <td className="px-2 py-1 text-center">
                            <button type="button" onClick={() => removeRow(row.id)} className="bg-red-500 text-white w-6 h-6 rounded text-xs hover:bg-red-600 flex items-center justify-center"><Trash2 className="w-3 h-3"/></button>
                          </td>
                        </tr>
                      ))}
                      {formData.items.length === 0 && (
                        <tr><td colSpan={8} className="text-center py-2 text-gray-500">Click + to add item</td></tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={8} className="p-2 text-right bg-gray-50 border-t">
                          <button type="button" onClick={addEmptyRow} className="bg-green-500 text-white w-8 h-8 rounded shadow hover:bg-green-600 flex items-center justify-center ml-auto">
                            <Plus className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1 font-bold">Content Footer</label>
                    <div className="border rounded bg-white h-full flex flex-col">
                      <div className="p-2 border-b flex gap-3 text-sm text-gray-700 bg-gray-50"><span>File</span><span>Edit</span><span>View</span><span>Insert</span><span>Format</span><span>Tools</span><span>Table</span></div>
                      <textarea value={formData.contentFooter} onChange={(e) => setFormData({ ...formData, contentFooter: e.target.value })} className="w-full flex-1 p-3 text-sm focus:outline-none resize-none" placeholder="Notes..."></textarea>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="w-1/2 bg-gray-50 px-3 py-1.5 border rounded-l">Subtotal :</span>
                      <input type="text" value={subtotal.toFixed(2)} readOnly className="w-1/2 px-3 py-1.5 border rounded-r text-right bg-gray-100 font-semibold outline-none" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="w-1/2 bg-gray-50 px-3 py-1.5 border rounded-l">Vat(%) :</span>
                      <input type="number" value={formData.vatPercent} onChange={e => setFormData({...formData, vatPercent: Number(e.target.value)})} className="w-1/2 px-3 py-1.5 border rounded-r text-right outline-none" placeholder="Vat(%)" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="w-1/2 bg-gray-50 px-3 py-1.5 border rounded-l">Vat(Amount) :</span>
                      <input type="text" value={vatAmount.toFixed(2)} readOnly className="w-1/2 px-3 py-1.5 border rounded-r text-right bg-gray-100 outline-none" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="w-1/2 bg-gray-50 px-3 py-1.5 border rounded-l">Delivery/Shipping Charge :</span>
                      <input type="number" value={formData.deliveryCharge} onChange={e => setFormData({...formData, deliveryCharge: Number(e.target.value)})} className="w-1/2 px-3 py-1.5 border rounded-r text-right outline-none" placeholder="Delivery Charge" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="w-1/2 bg-gray-50 px-3 py-1.5 border rounded-l">Discount(%) :</span>
                      <input type="number" value={formData.discountPercent} onChange={e => setFormData({...formData, discountPercent: Number(e.target.value)})} className="w-1/2 px-3 py-1.5 border rounded-r text-right outline-none" placeholder="Discount(%)" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="w-1/2 bg-gray-50 px-3 py-1.5 border rounded-l">Discount(Amount) :</span>
                      <input type="text" value={discountAmount.toFixed(2)} readOnly className="w-1/2 px-3 py-1.5 border rounded-r text-right bg-gray-100 outline-none" />
                    </div>
                    <div className="flex justify-between items-center font-bold text-green-700">
                      <span className="w-1/2 bg-green-50 px-3 py-1.5 border border-green-200 rounded-l">Grand Total :</span>
                      <input type="text" value={grandTotal.toFixed(2)} readOnly className="w-1/2 px-3 py-1.5 border border-green-200 rounded-r text-right bg-green-50 outline-none" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-400 text-white px-6 py-2 rounded text-sm">Close</button>
                  <button type="submit" disabled={submitting} className="bg-indigo-600 text-white px-8 py-2 rounded text-sm flex items-center gap-2">
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ====================== NEW ITEM MODAL ====================== */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h2 className="text-lg font-bold">New Item</h2>
              <button onClick={() => setIsNewItemModalOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleCreateNewItem} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Category</label>
                  <select required value={newItemForm.categoryId} onChange={e => setNewItemForm({...newItemForm, categoryId: e.target.value, subCategoryId: ""})} className="w-full border rounded px-2 py-1.5 text-sm">
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.uuid} value={c.uuid}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Sub Category</label>
                  <select value={newItemForm.subCategoryId} onChange={e => setNewItemForm({...newItemForm, subCategoryId: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" disabled={!newItemForm.categoryId}>
                    <option value="">Select Sub Category</option>
                    {subCategories.filter(sc => sc.categoryId === newItemForm.categoryId).map(sc => (
                      <option key={sc.uuid} value={sc.uuid}>{sc.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Brand</label>
                  <div className="flex gap-1">
                    <select value={newItemForm.brand} onChange={e => setNewItemForm({...newItemForm, brand: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm">
                      <option value="">Select Brand</option>
                      {brands.map(b => <option key={b.uuid} value={b.name}>{b.name}</option>)}
                    </select>
                    <button type="button" onClick={() => setIsBrandModalOpen(true)} className="bg-indigo-600 text-white px-2 rounded hover:bg-indigo-700">+</button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Unit</label>
                  <div className="flex gap-1">
                    <select required value={newItemForm.unit} onChange={e => setNewItemForm({...newItemForm, unit: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm">
                      <option value="">Select Unit</option>
                      {unitsList.length > 0 ? (
                         unitsList.map(u => <option key={u.uuid} value={u.name}>{u.name}</option>)
                      ) : (
                         DEFAULT_UNITS.map((u, i) => <option key={i} value={u}>{u}</option>)
                      )}
                    </select>
                    <button type="button" onClick={() => setIsUnitModalOpen(true)} className="bg-indigo-600 text-white px-2 rounded hover:bg-indigo-700">+</button>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Item Name</label>
                  <input required type="text" value={newItemForm.itemName} onChange={e => setNewItemForm({...newItemForm, itemName: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="Item Name" />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Purchase Price</label>
                  <input required type="number" value={newItemForm.purchasePrice} onChange={e => setNewItemForm({...newItemForm, purchasePrice: Number(e.target.value)})} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="Purchase" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Sale Price</label>
                  <input required type="number" value={newItemForm.salePrice} onChange={e => setNewItemForm({...newItemForm, salePrice: Number(e.target.value)})} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="Sale" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsNewItemModalOpen(false)} className="bg-gray-400 text-white px-4 py-1.5 rounded text-sm">Close</button>
                <button type="submit" disabled={isItemSubmitting} className="bg-indigo-600 text-white px-6 py-1.5 rounded text-sm flex items-center gap-2">
                  {isItemSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================== BRAND ADD MODAL ====================== */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4">
          <div className="bg-white rounded-lg w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h2 className="text-lg font-bold">Brand Add</h2>
              <button onClick={() => setIsBrandModalOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleCreateBrand} className="p-4 space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Name</label>
                <input required type="text" value={newBrandName} onChange={e => setNewBrandName(e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Enter Name" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsBrandModalOpen(false)} className="bg-gray-400 text-white px-4 py-1.5 rounded text-sm">Close</button>
                <button type="submit" disabled={isBrandSubmitting} className="bg-indigo-600 text-white px-6 py-1.5 rounded text-sm flex items-center gap-2">
                  {isBrandSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================== UNIT ADD MODAL ====================== */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4">
          <div className="bg-white rounded-lg w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h2 className="text-lg font-bold">Unit Add</h2>
              <button onClick={() => setIsUnitModalOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleCreateUnit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Unit Name</label>
                <input required type="text" value={newUnitName} onChange={e => setNewUnitName(e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="e.g. Kg, Nos, Ton" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsUnitModalOpen(false)} className="bg-gray-400 text-white px-4 py-1.5 rounded text-sm">Close</button>
                <button type="submit" disabled={isUnitSubmitting} className="bg-indigo-600 text-white px-6 py-1.5 rounded text-sm flex items-center gap-2">
                  {isUnitSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================== CUSTOMER ADD MODAL ====================== */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-full max-w-xl shadow-xl">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h2 className="text-lg font-bold">Customer Add</h2>
              <button onClick={() => setIsCustomerModalOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleCreateCustomer} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Code</label>
                  <input type="text" value={newCustomer.customerCode} readOnly className="w-full border rounded px-2 py-1.5 text-sm bg-gray-100" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Name <span className="text-red-500">*</span></label>
                  <input type="text" value={newCustomer.customerName} onChange={e => setNewCustomer({...newCustomer, customerName: e.target.value})} required className="w-full border rounded px-2 py-1.5 text-sm" placeholder="Enter Name" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Mobile Number</label>
                  <input type="text" value={newCustomer.mobileNo} onChange={e => setNewCustomer({...newCustomer, mobileNo: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="Enter Mobile" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Buyer Reference</label>
                  <input type="text" value={newCustomer.businessName} onChange={e => setNewCustomer({...newCustomer, businessName: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="Enter Business Name" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Address</label>
                  <input type="text" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="Enter Address" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Due Date</label>
                  <input type="date" value={newCustomer.dueDate} onChange={e => setNewCustomer({...newCustomer, dueDate: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Chart Of Groups <span className="text-red-500">*</span></label>
                  <input type="text" value={newCustomer.chartOfGroups} onChange={e => setNewCustomer({...newCustomer, chartOfGroups: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="Select One Option" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 mt-2">
                <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="bg-gray-400 text-white px-4 py-1.5 rounded text-sm">Close</button>
                <button type="submit" disabled={isCustomerSubmitting} className="bg-indigo-600 text-white px-6 py-1.5 rounded text-sm flex items-center gap-2">
                  {isCustomerSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}