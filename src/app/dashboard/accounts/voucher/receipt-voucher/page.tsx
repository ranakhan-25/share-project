"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  X,
  ArrowLeft,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Eye,
  Pencil,
  Trash2,
  Copy,
  Mail,
  Printer,
  CheckCircle2,
} from "lucide-react";

interface VoucherRow {
  id: number;
  uuid: string;
  sl: number;
  date: string;
  project: string;
  code: string;
  credit: string;
  debit: string;
  total: number;
  ref: string;
  chequeReceipt: string;
  comment: string;
  addedBy: string;
  editedBy: string;
  approval: string[];
  attachment: number;
  status: string;
}

type ActionKey = "mail" | "view" | "print" | "edit" | "delete" | "duplicate";

const actionMenuItems: { key: ActionKey; label: string; icon: React.ElementType; color: string }[] = [
  { key: "mail", label: "Send Mail", icon: Mail, color: "bg-cyan-500 hover:bg-cyan-600" },
  { key: "view", label: "View Voucher", icon: Eye, color: "bg-emerald-500 hover:bg-emerald-600" },
  { key: "print", label: "Print Voucher", icon: Printer, color: "bg-violet-500 hover:bg-violet-600" },
  { key: "edit", label: "Edit Voucher", icon: Pencil, color: "bg-indigo-500 hover:bg-indigo-600" },
  { key: "delete", label: "Delete", icon: Trash2, color: "bg-red-500 hover:bg-red-600" },
  { key: "duplicate", label: "Duplicate", icon: Copy, color: "bg-teal-500 hover:bg-teal-600" },
];

export default function ReceiptVoucherPage() {
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewVoucher, setViewVoucher] = useState<Record<string, unknown> | null>(null);
  const [editUuid, setEditUuid] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form Entry States
  const [projectType, setProjectType] = useState("");
  const [project, setProject] = useState("");
  const [titleOfWork, setTitleOfWork] = useState("");
  const [date, setDate] = useState("13/09/2026");
  const [voucherNo, setVoucherNo] = useState("R00015");

  const [selectedAccount, setSelectedAccount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [chequeNo, setChequeNo] = useState("");
  const [amount, setAmount] = useState("");

  const [comment, setComment] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  // Modal Form States
  const [modalGroup, setModalGroup] = useState("");
  const [modalCode, setModalCode] = useState("");
  const [modalName, setModalName] = useState("");
  const [modalDefaultModule, setModalDefaultModule] = useState("");

  // Table Data & Filter States
  const [vouchers, setVouchers] = useState<VoucherRow[]>([]);
  const [accounts, setAccounts] = useState<Array<{ id?: string | number; uuid?: string; name?: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState({
    dateRange: "1 Sept, 2026 - 30 Sept, 2026",
    creditAccount: "",
    debitAccount: "",
    project: "",
    titleOfWork: "",
    site: "",
    task: "",
  });

  // Action Dropdown Menu Positioning
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const handleClose = () => setOpenActionId(null);
    window.addEventListener("resize", handleClose);
    window.addEventListener("scroll", handleClose, true);
    return () => {
      window.removeEventListener("resize", handleClose);
      window.removeEventListener("scroll", handleClose, true);
    };
  }, []);

  const normalizeArray = (value: unknown): Record<string, unknown>[] => {
    if (Array.isArray(value)) return value as Record<string, unknown>[];
    if (!value || typeof value !== "object") return [];
    for (const nested of Object.values(value)) {
      const found = normalizeArray(nested);
      if (found.length) return found;
    }
    return [];
  };

  const fetchVouchers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/backend/vouchers", { headers: { accept: "application/json" } });
      const result = await response.json();
      const rows = normalizeArray(result.data);
      setVouchers(rows.map((voucher, index) => ({
        id: Number(voucher.id ?? index + 1),
        uuid: String(voucher.uuid ?? ""),
        sl: index + 1,
        date: String(voucher.date ?? "").slice(0, 10),
        project: String(voucher.projectId ?? ""),
        code: String(voucher.voucherNo ?? ""),
        credit: String(voucher.accountId ?? ""),
        debit: String(voucher.paymentMethod ?? ""),
        total: Number(voucher.amount ?? 0),
        ref: "N/A",
        chequeReceipt: String(voucher.chequeNo ?? "—"),
        comment: String(voucher.comment ?? "—"),
        addedBy: "Admin",
        editedBy: "—",
        approval: [String(voucher.status ?? "Draft")],
        attachment: voucher.attachmentUrl ? 1 : 0,
        status: String(voucher.status ?? "Draft"),
      })));
    } catch (error) {
      console.error("Failed to load receipt vouchers", error);
      toast.error("Receipt vouchers could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
    const fetchAccounts = async () => {
      try {
        const response = await fetch("/api/backend/chart-of-accounts", { headers: { accept: "application/json" } });
        const result = await response.json();
        setAccounts(normalizeArray(result.data) as Array<{ id?: string | number; uuid?: string; name?: string }>);
      } catch (error) {
        console.error("Failed to load accounts", error);
      }
    };
    fetchAccounts();
  }, []);

  const toggleActionMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    e.stopPropagation();
    if (openActionId === id) {
      setOpenActionId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuWidth = 150;
      setDropdownPos({
        top: rect.bottom + window.scrollY + 2,
        left: Math.max(10, rect.right - menuWidth),
      });
      setOpenActionId(id);
    }
  };

  const handleVoucherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount.trim()) {
      toast.error("Please select a chart of account.");
      return;
    }
    if (!paymentMethod.trim()) {
      toast.error("Please select a payment method.");
      return;
    }
    if (!amount.trim()) {
      toast.error("Please enter an amount.");
      return;
    }
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error("Please enter a valid amount greater than zero.");
      return;
    }
    const account = accounts.find((item) => String(item.uuid ?? item.id ?? "") === selectedAccount);
    const payload = {
      date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : date.split("/").reverse().join("-"),
      projectType,
      projectId: project,
      workId: titleOfWork,
      accountId: selectedAccount,
      paymentMethod,
      chequeNo,
      amount: numericAmount,
      comment,
      attachmentUrl: attachment?.name ?? "",
      entries: [{
        projectId: project,
        code: voucherNo,
        accountName: account?.name ?? selectedAccount,
        credit: numericAmount,
        debit: 0,
        total: numericAmount,
        ref: chequeNo || "N/A",
        chequeReceipt: chequeNo,
        comment,
        addedBy: "Admin",
      }],
    };

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/backend/vouchers${editUuid ? `/${encodeURIComponent(editUuid)}` : ""}`, {
        method: editUuid ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Receipt voucher could not be created.");
      }
      toast.success(editUuid ? "Receipt voucher updated successfully." : "Receipt voucher created successfully.");
      if (editUuid) setIsEditModalOpen(false);
      setAmount("");
      setComment("");
      setChequeNo("");
      setEditUuid("");
      await fetchVouchers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Receipt voucher could not be saved.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Account "${modalName}" added successfully.`);
    setIsModalOpen(false);
    setModalGroup("");
    setModalCode("");
    setModalName("");
    setModalDefaultModule("");
  };

  const handleAction = async (key: ActionKey, row: VoucherRow) => {
    setOpenActionId(null);
    if (key === "delete") {
      toast(
        (notification) => (
          <div className="flex items-center gap-3">
            <span>Delete voucher {row.code}?</span>
            <button
              type="button"
              onClick={async () => {
                toast.dismiss(notification.id);
                const loadingToast = toast.loading("Deleting voucher...");
                try {
                  const response = await fetch(`/api/backend/vouchers/${encodeURIComponent(row.uuid)}`, {
                    method: "DELETE",
                  });
                  if (!response.ok) throw new Error("Voucher could not be deleted.");
                  toast.success("Voucher deleted successfully.", { id: loadingToast });
                  await fetchVouchers();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Voucher could not be deleted.", {
                    id: loadingToast,
                  });
                }
              }}
              className="rounded bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => toast.dismiss(notification.id)}
              className="rounded bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-white"
            >
              Cancel
            </button>
          </div>
        ),
        { duration: 8000 },
      );
    } else if (key === "view" && row.uuid) {
      try {
        const response = await fetch(`/api/backend/vouchers/${encodeURIComponent(row.uuid)}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Voucher could not be loaded.");
        const detail = result.data?.data ?? result.data ?? result;
        setViewVoucher(detail && typeof detail === "object" ? detail as Record<string, unknown> : null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Voucher could not be loaded.");
      }
    } else if (key === "edit" && row.uuid) {
      try {
        const response = await fetch(`/api/backend/vouchers/${encodeURIComponent(row.uuid)}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Voucher could not be loaded.");
        const detail = result.data?.data ?? result.data ?? result;
        if (!detail || typeof detail !== "object") throw new Error("Voucher details were invalid.");
        const voucher = detail as Record<string, unknown>;
        setEditUuid(row.uuid);
        setDate(String(voucher.date ?? "").slice(0, 10));
        setProjectType(String(voucher.projectType ?? ""));
        setProject(String(voucher.projectId ?? ""));
        setTitleOfWork(String(voucher.workId ?? ""));
        setSelectedAccount(String(voucher.accountId ?? ""));
        setPaymentMethod(String(voucher.paymentMethod ?? ""));
        setChequeNo(String(voucher.chequeNo ?? ""));
        setAmount(String(voucher.amount ?? ""));
        setComment(String(voucher.comment ?? ""));
        setIsEditModalOpen(true);
        toast.success("Voucher loaded for editing.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Voucher could not be loaded for editing.");
      }
    } else {
      toast(`${key.toUpperCase()} action is ready for voucher ${row.code}`);
    }
  };

  const filteredRows = vouchers.filter((r) =>
    search.trim()
      ? [r.project, r.code, r.credit, r.debit, r.comment, r.ref].some((field) =>
          field.toLowerCase().includes(search.trim().toLowerCase())
        )
      : true
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / entriesPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * entriesPerPage;
  const visibleRows = filteredRows.slice(startIdx, startIdx + entriesPerPage);

  return (
    <div className="w-full h-full max-w-full flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-200 p-2 border-box">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between gap-2 mb-1.5 shrink-0 min-w-0">
        <nav className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium truncate">
          <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
            Home
          </span>
          <span>&gt;</span>
          <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-0.5">
            Accounts Module <ChevronDown className="w-3 h-3" />
          </span>
          <span>&gt;</span>
          <span className="text-slate-400 font-normal truncate">Receipt Voucher</span>
        </nav>

        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer shrink-0 shadow-xs"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to previous
        </button>
      </div>

      {/* Main Single Page Content Wrapper */}
      <div className="flex-1 min-h-0 min-w-0 w-full flex flex-col gap-1.5 overflow-hidden">
        {/* Expanded 2-Row Form Container */}
        <form
          onSubmit={handleVoucherSubmit}
          className="bg-white dark:bg-slate-900 rounded-md shadow-xs border border-slate-200 dark:border-slate-800 p-2 shrink-0 min-w-0 space-y-1.5"
        >
          {/* Row 1: 2 Columns Layout (Voucher Info + Payment Info) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 min-w-0">
            {/* Box 1: Voucher Information */}
            <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded p-2 min-w-0">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 border-b pb-1 border-slate-200 dark:border-slate-800 mb-1.5">
                Voucher Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Project Type</label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs"
                  >
                    <option value="">Select Project Type</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Project</label>
                  <select
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs"
                  >
                    <option value="">Select Project</option>
                    <option value="Sheba Eyecon Tower">Sheba Eyecon Tower</option>
                    <option value="Lake Garden">Lake Garden</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Title/Name of Work</label>
                  <select
                    value={titleOfWork}
                    onChange={(e) => setTitleOfWork(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs"
                  >
                    <option value="">Select Title/Name of Work</option>
                    <option value="Booking Money">Booking Money</option>
                    <option value="Installment">Installment</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Date</label>
                    <input
                      type="text"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Vouchar No</label>
                    <input
                      type="text"
                      value={voucherNo}
                      onChange={(e) => setVoucherNo(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Box 2: Payment Information */}
            <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded p-2 min-w-0">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 border-b pb-1 border-slate-200 dark:border-slate-800 mb-1.5">
                Payment Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-0.5">
                    Select Accounts<span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <select
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs"
                    >
                      <option value="">Select Chart Of Account</option>
                      {accounts.map((account, index) => (
                        <option key={String(account.uuid ?? account.id ?? index)} value={String(account.uuid ?? account.id ?? "")}>
                          {account.name ?? `Account ${index + 1}`}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded transition-colors cursor-pointer shrink-0"
                      title="Add Chart of Account"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-0.5">
                    Payment Method<span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs"
                  >
                    <option value="">Select Payment Method</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Check">Bank Check</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Cheque/Receipt No</label>
                  <input
                    type="text"
                    placeholder="Enter Cheque/Receipt No"
                    value={chequeNo}
                    onChange={(e) => setChequeNo(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-0.5">
                    Amount<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Reference & Additional (Spans 2 columns width) */}
          <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded p-2 min-w-0">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 border-b pb-1 border-slate-200 dark:border-slate-800 mb-1.5">
              Reference &amp; Additional
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
              <div className="md:col-span-5">
                <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Comment</label>
                <input
                  type="text"
                  placeholder="Enter Comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs"
                />
              </div>
              <div className="md:col-span-5">
                <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Attachment</label>
                <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded overflow-hidden bg-white dark:bg-slate-900">
                  <label className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-xs cursor-pointer border-r border-slate-300 dark:border-slate-700 hover:bg-slate-300 shrink-0">
                    Choose File
                    <input
                      type="file"
                      onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  <span className="px-2 text-[11px] text-slate-400 truncate">
                    {attachment ? attachment.name : "No file chosen"}
                  </span>
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-5 py-1 bg-[#635BFF] hover:bg-indigo-700 text-white font-semibold text-xs rounded transition-colors cursor-pointer shadow-xs"
                >
                  {isSubmitting ? "Saving..." : editUuid ? "Update Voucher" : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Filters & Dynamic Data Table Container */}
        <div className="flex-1 min-h-0 min-w-0 bg-white dark:bg-slate-900 rounded-md shadow-xs border border-slate-200 dark:border-slate-800 p-2 flex flex-col overflow-hidden">
          {/* Filters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1 shrink-0 mb-1 min-w-0">
            <div>
              <label className="block text-[9px] text-slate-400">Select Date</label>
              <input
                type="text"
                readOnly
                value={filters.dateRange}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1 py-0.5 text-[10px] truncate"
              />
            </div>
            <div>
              <label className="block text-[9px] text-slate-400">Credit Accounts</label>
              <select
                value={filters.creditAccount}
                onChange={(e) => setFilters({ ...filters, creditAccount: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1 py-0.5 text-[10px]"
              >
                <option value="">Chart Of Account</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] text-slate-400">Debit Accounts</label>
              <select
                value={filters.debitAccount}
                onChange={(e) => setFilters({ ...filters, debitAccount: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1 py-0.5 text-[10px]"
              >
                <option value="">Chart Of Account</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] text-slate-400">Select Project</label>
              <select
                value={filters.project}
                onChange={(e) => setFilters({ ...filters, project: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1 py-0.5 text-[10px]"
              >
                <option value="">Select Project</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] text-slate-400">Title/Name of Work</label>
              <select
                value={filters.titleOfWork}
                onChange={(e) => setFilters({ ...filters, titleOfWork: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1 py-0.5 text-[10px]"
              >
                <option value="">Select Work</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] text-slate-400">Site</label>
              <select
                value={filters.site}
                onChange={(e) => setFilters({ ...filters, site: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1 py-0.5 text-[10px]"
              >
                <option value="">Select Site</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] text-slate-400">Task</label>
              <div className="flex items-center gap-1">
                <select
                  value={filters.task}
                  onChange={(e) => setFilters({ ...filters, task: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1 py-0.5 text-[10px]"
                >
                  <option value="">Task</option>
                </select>
                <button
                  type="button"
                  onClick={() => toast("PDF export is not connected yet.")}
                  className="px-1 py-0.5 bg-rose-500 text-white rounded text-[9px] font-bold shrink-0 flex items-center"
                >
                  <FileText className="w-2.5 h-2.5" /> PDF
                </button>
                <button
                  type="button"
                  onClick={() => toast("Excel export is not connected yet.")}
                  className="px-1 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-bold shrink-0 flex items-center"
                >
                  <FileSpreadsheet className="w-2.5 h-2.5" /> Excel
                </button>
              </div>
            </div>
          </div>

          {/* Entries & Search Controls */}
          <div className="flex items-center justify-between gap-2 mb-1 shrink-0 text-[10px] min-w-0">
            <div className="flex items-center gap-1">
              <span>Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1 py-0.5"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Search:</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 min-h-0 min-w-0 w-full overflow-auto border border-slate-200 dark:border-slate-800 rounded">
            <table className="w-full min-w-[1000px] text-left border-collapse text-[10px]">
              <thead className="sticky top-0 z-10 bg-[#635BFF] text-white font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-1.5 py-1">SL</th>
                  <th className="px-1.5 py-1">DATE</th>
                  <th className="px-1.5 py-1">PROJECT</th>
                  <th className="px-1.5 py-1">CODE</th>
                  <th className="px-1.5 py-1">CREDIT</th>
                  <th className="px-1.5 py-1">DEBIT</th>
                  <th className="px-1.5 py-1">TOTAL</th>
                  <th className="px-1.5 py-1">REF</th>
                  <th className="px-1.5 py-1">CHEQUE/RECEIPT</th>
                  <th className="px-1.5 py-1">COMMENT</th>
                  <th className="px-1.5 py-1">ADDED BY</th>
                  <th className="px-1.5 py-1">APPROVE</th>
                  <th className="px-1.5 py-1">ATTACHMENT</th>
                  <th className="px-1.5 py-1 text-right pr-3">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {visibleRows.length > 0 ? (
                  visibleRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-1.5 py-1">{row.sl}</td>
                      <td className="px-1.5 py-1 whitespace-nowrap">{row.date}</td>
                      <td className="px-1.5 py-1 font-medium">{row.project}</td>
                      <td className="px-1.5 py-1 text-indigo-600 font-medium">{row.code}</td>
                      <td className="px-1.5 py-1 text-indigo-600 font-medium">{row.credit}</td>
                      <td className="px-1.5 py-1 text-indigo-600 font-medium">{row.debit}</td>
                      <td className="px-1.5 py-1 font-semibold">{row.total.toLocaleString()}</td>
                      <td className="px-1.5 py-1 text-slate-500">{row.ref}</td>
                      <td className="px-1.5 py-1 text-slate-500">{row.chequeReceipt}</td>
                      <td className="px-1.5 py-1 max-w-[120px] truncate">{row.comment}</td>
                      <td className="px-1.5 py-1">{row.addedBy}</td>
                      <td className="px-1.5 py-1">
                        {row.approval.map((app) => (
                          <span key={app} className="text-emerald-600 font-medium flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5 inline" /> {app}
                          </span>
                        ))}
                      </td>
                      <td className="px-1.5 py-1 text-center">{row.attachment}</td>
                      <td className="px-1.5 py-1 text-right pr-3">
                        <button
                          type="button"
                          onClick={(e) => toggleActionMenu(e, row.id)}
                          className="px-2 py-0.5 rounded bg-[#635BFF] hover:bg-indigo-700 text-white font-medium text-[10px] inline-flex items-center gap-0.5 transition-colors cursor-pointer"
                        >
                          Action
                          <ChevronDown className="w-2.5 h-2.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={14} className="px-3 py-3 text-center text-slate-400">
                      {isLoading ? "Loading receipt vouchers..." : "No records found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination */}
          <div className="flex items-center justify-between gap-2 mt-1 pt-0.5 text-[10px] text-slate-500 shrink-0 min-w-0">
            <div>
              Showing {filteredRows.length === 0 ? 0 : startIdx + 1} to{" "}
              {startIdx + visibleRows.length} of {filteredRows.length} entries
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={safePage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-1.5 py-0.5 rounded ${
                    p === safePage ? "bg-[#635BFF] text-white" : "border border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Dropdown Menu */}
      {openActionId !== null && dropdownPos && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpenActionId(null)} />
          <div
            style={{ top: `${dropdownPos.top}px`, left: `${dropdownPos.left}px` }}
            className="fixed z-50 w-36 bg-white dark:bg-slate-800 rounded shadow-lg border border-slate-100 dark:border-slate-700 p-1 space-y-0.5"
          >
            {actionMenuItems.map(({ key, label, icon: Icon, color }) => {
              const targetRow = vouchers.find((r) => r.id === openActionId);
              return (
                <button
                  key={key}
                  onClick={() => targetRow && handleAction(key, targetRow)}
                  className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium text-white transition-colors ${color}`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {viewVoucher && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3">
          <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <h3 className="text-sm font-semibold">Receipt Voucher Details</h3>
              <button
                type="button"
                onClick={() => setViewVoucher(null)}
                className="rounded bg-rose-500 p-1 text-white hover:bg-rose-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
              {[
                ["Voucher No", viewVoucher.voucherNo],
                ["Type", viewVoucher.voucherType],
                ["Date", viewVoucher.date],
                ["Project", viewVoucher.projectId],
                ["Work", viewVoucher.workId],
                ["Account", viewVoucher.accountId],
                ["Payment Method", viewVoucher.paymentMethod],
                ["Cheque/Receipt", viewVoucher.chequeNo],
                ["Amount", viewVoucher.amount],
                ["Status", viewVoucher.status],
                ["Comment", viewVoucher.comment],
              ].map(([label, value]) => (
                <div key={String(label)} className={String(label) === "Comment" ? "sm:col-span-2" : ""}>
                  <div className="text-[10px] font-medium uppercase text-slate-400">{String(label)}</div>
                  <div className="mt-0.5 break-words rounded border border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950">
                    {String(value ?? "—")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-xs">
          <form
            onSubmit={handleVoucherSubmit}
            className="w-full max-w-xl rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <h3 className="text-sm font-semibold">Edit Receipt Voucher</h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditUuid("");
                }}
                className="rounded bg-slate-400 p-1 text-white hover:bg-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
              <label className="text-[11px] font-medium">
                Date
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="text-[11px] font-medium">
                Payment Method
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950">
                  <option value="">Select Payment Method</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Check">Bank Check</option>
                </select>
              </label>
              <label className="text-[11px] font-medium sm:col-span-2">
                Chart of Account
                <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950">
                  <option value="">Select Chart Of Account</option>
                  {accounts.map((account, index) => (
                    <option key={String(account.uuid ?? account.id ?? index)} value={String(account.uuid ?? account.id ?? "")}>
                      {account.name ?? `Account ${index + 1}`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] font-medium">
                Cheque/Receipt No
                <input value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="text-[11px] font-medium">
                Amount
                <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="text-[11px] font-medium sm:col-span-2">
                Comment
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950" />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-700">
              <button type="button" onClick={() => { setIsEditModalOpen(false); setEditUuid(""); }} className="rounded bg-slate-400 px-4 py-1.5 text-white">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="rounded bg-indigo-600 px-4 py-1.5 text-white disabled:opacity-50">
                {isSubmitting ? "Updating..." : "Update Voucher"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Chart Of Account Add */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                Chart Of Account Add
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-0.5 bg-rose-500 hover:bg-rose-600 text-white rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-3 space-y-2">
              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded border border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                      Chart of Group
                    </label>
                    <select
                      value={modalGroup}
                      onChange={(e) => setModalGroup(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-[11px]"
                    >
                      <option value="">Select value</option>
                      <option value="Assets">Assets</option>
                      <option value="Expenses">Expenses</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                      Chart of Accounts Code
                    </label>
                    <input
                      type="text"
                      placeholder="Chart of Accounts Code"
                      value={modalCode}
                      onChange={(e) => setModalCode(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-[11px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                      Chart of Accounts Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Chart of Accounts Name"
                      value={modalName}
                      onChange={(e) => setModalName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                      Set Accounts Default Module
                    </label>
                    <select
                      value={modalDefaultModule}
                      onChange={(e) => setModalDefaultModule(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-[11px]"
                    >
                      <option value="">Select Status</option>
                      <option value="Active">Active</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-2.5 py-0.5 bg-slate-400 hover:bg-slate-500 text-white font-medium text-[11px] rounded transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-3 py-0.5 bg-[#635BFF] hover:bg-indigo-700 text-white font-medium text-[11px] rounded transition-colors"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="flex items-center justify-between text-[9px] text-slate-400 shrink-0 pt-0.5 border-t border-slate-200 dark:border-slate-800">
        <div>2026 © Somikoron IT LTD</div>
        <div>Design &amp; Developed by Somikoron IT LTD</div>
      </footer>
    </div>
  );
}