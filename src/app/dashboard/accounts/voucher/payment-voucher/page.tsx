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
  Trash2,
  Copy,
  Mail,
  Printer,
  CheckCircle2,
  Pencil,
} from "lucide-react";

interface PaymentVoucherRow {
  id: number;
  uuid: string;
  sl: number;
  date: string;
  project: string;
  titleOfWork: string;
  code: string;
  debit: string;
  credit: string;
  total: number;
  comment: string;
  chequeReceipt: string;
  addedBy: string;
  editedBy: string;
  approval: string[];
  attachment: number;
  status: string;
}

type ActionKey = "view" | "print" | "mail" | "edit" | "delete" | "duplicate";

const actionMenuItems: { key: ActionKey; label: string; icon: React.ElementType; color: string }[] = [
  { key: "view", label: "View Voucher", icon: Eye, color: "bg-indigo-500 hover:bg-indigo-600" },
  { key: "print", label: "Print Voucher", icon: Printer, color: "bg-violet-500 hover:bg-violet-600" },
  { key: "mail", label: "Send Mail", icon: Mail, color: "bg-cyan-500 hover:bg-cyan-600" },
  { key: "edit", label: "Edit Voucher", icon: Pencil, color: "bg-amber-500 hover:bg-amber-600" },
  { key: "delete", label: "Delete", icon: Trash2, color: "bg-red-500 hover:bg-red-600" },
  { key: "duplicate", label: "Duplicate", icon: Copy, color: "bg-teal-500 hover:bg-teal-600" },
];

export default function PaymentVoucherPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewVoucher, setViewVoucher] = useState<Record<string, unknown> | null>(null);
  const [editUuid, setEditUuid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Array<{ id?: string | number; uuid?: string; name?: string }>>([]);

  // Form States
  const [projectType, setProjectType] = useState("");
  const [project, setProject] = useState("");
  const [titleOfWork, setTitleOfWork] = useState("");
  const [ifTask, setIfTask] = useState("");
  const [site, setSite] = useState("");
  const [date, setDate] = useState("13/09/2026");
  const [voucherNo, setVoucherNo] = useState("P00005");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isCheque, setIsCheque] = useState(false);
  const [chequeNo, setChequeNo] = useState("");
  const [comment, setComment] = useState("");
  const [amount, setAmount] = useState("");
  const [selectInvoice, setSelectInvoice] = useState("");
  const [selectItem, setSelectItem] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  // Modal Form States
  const [modalGroup, setModalGroup] = useState("");
  const [modalCode, setModalCode] = useState("");
  const [modalName, setModalName] = useState("");
  const [modalDefaultModule, setModalDefaultModule] = useState("");

  // Table Data & Filter States
  const [vouchers, setVouchers] = useState<PaymentVoucherRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState({
    dateRange: "1 Sept, 2026 - 30 Sept, 2026",
    debitAccount: "",
    creditAccount: "",
    project: "",
    titleOfWork: "",
    site: "",
    task: "",
  });

  // Action Dropdown State
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
      const response = await fetch("/api/backend/payment-vouchers", { headers: { accept: "application/json" } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Payment vouchers could not be loaded.");
      const rows = normalizeArray(result.data);
      setVouchers(rows.map((voucher, index) => ({
        id: Number(voucher.id ?? index + 1),
        uuid: String(voucher.uuid ?? ""),
        sl: index + 1,
        date: String(voucher.date ?? "").slice(0, 10),
        project: String(voucher.projectId ?? ""),
        titleOfWork: String(voucher.workId ?? ""),
        code: String(voucher.voucherNo ?? ""),
        debit: String(voucher.accountId ?? normalizeArray(voucher.entries)[0]?.debitAccount ?? ""),
        credit: String(voucher.paymentMethod ?? ""),
        total: Number(voucher.amount ?? 0),
        comment: String(voucher.comment ?? "—"),
        chequeReceipt: String(voucher.chequeNo ?? "—"),
        addedBy: "Admin",
        editedBy: "—",
        approval: [String(voucher.status ?? "Pending")],
        attachment: voucher.attachmentUrl ? 1 : 0,
        status: String(voucher.status ?? "Pending"),
      })));
    } catch (error) {
      console.error("Failed to load payment vouchers", error);
      toast.error(error instanceof Error ? error.message : "Payment vouchers could not be loaded.");
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
      const menuWidth = 130;
      setDropdownPos({
        top: rect.bottom + window.scrollY + 2,
        left: Math.max(10, rect.right - menuWidth),
      });
      setOpenActionId(id);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount.trim() || !paymentMethod.trim() || !amount.trim()) {
      toast.error("Please fill in required fields (*)");
      return;
    }
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error("Please enter a valid amount greater than zero.");
      return;
    }
    const payload = {
      date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : date.includes("/") ? date.split("/").reverse().join("-") : date,
      projectType,
      projectId: project,
      workId: titleOfWork,
      taskId: ifTask,
      siteId: site,
      accountId: selectedAccount,
      paymentMethod,
      isCheque,
      chequeNo,
      comment,
      amount: numericAmount,
      invoiceId: selectInvoice,
      itemId: selectItem,
      attachmentUrl: attachment?.name ?? "",
      entries: [{
        projectId: project,
        titleId: titleOfWork,
        code: voucherNo,
        debitAccount: selectedAccount,
        creditAccount: paymentMethod,
        total: numericAmount,
        comment,
        cheque: chequeNo,
        addedBy: "Admin",
        editedBy: "Admin",
      }],
    };

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/backend/payment-vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Payment voucher could not be saved.");
      }
      toast.success(editUuid ? "Payment voucher replacement created successfully." : "Payment voucher created successfully.");
      if (editUuid) {
        const deleteResponse = await fetch(`/api/backend/payment-vouchers/${encodeURIComponent(editUuid)}`, { method: "DELETE" });
        if (!deleteResponse.ok) {
          toast.error("New voucher created, but the old voucher could not be deleted.");
        }
      }
      setIsEditModalOpen(false);
      setEditUuid("");
      setAmount("");
      setComment("");
      setChequeNo("");
      await fetchVouchers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment voucher could not be saved.");
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

  const handleAction = async (key: ActionKey, row: PaymentVoucherRow) => {
    setOpenActionId(null);
    if (key === "delete") {
      toast((notification) => (
        <div className="flex items-center gap-3">
          <span>Delete voucher {row.code}?</span>
          <button type="button" onClick={async () => {
            toast.dismiss(notification.id);
            const loadingToast = toast.loading("Deleting voucher...");
            try {
              const response = await fetch(`/api/backend/payment-vouchers/${encodeURIComponent(row.uuid)}`, { method: "DELETE" });
              if (!response.ok) throw new Error("Payment voucher could not be deleted.");
              toast.success("Payment voucher deleted successfully.", { id: loadingToast });
              await fetchVouchers();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Payment voucher could not be deleted.", { id: loadingToast });
            }
          }} className="rounded bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600">Delete</button>
          <button type="button" onClick={() => toast.dismiss(notification.id)} className="rounded bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-white">Cancel</button>
        </div>
      ), { duration: 8000 });
    } else if (key === "view" && row.uuid) {
      try {
        const response = await fetch(`/api/backend/payment-vouchers/${encodeURIComponent(row.uuid)}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Payment voucher could not be loaded.");
        const detail = result.data?.data ?? result.data ?? result;
        setViewVoucher(detail && typeof detail === "object" ? detail as Record<string, unknown> : null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Payment voucher could not be loaded.");
      }
    } else if (key === "print") {
      setViewVoucher({
        Voucher: row.code,
        Date: row.date,
        Project: row.project,
        Title: row.titleOfWork,
        Debit: row.debit,
        Credit: row.credit,
        Amount: row.total,
        Comment: row.comment,
      });
      window.setTimeout(() => window.print(), 100);
    } else if (key === "mail") {
      window.location.href = `mailto:?subject=${encodeURIComponent(`Payment Voucher ${row.code}`)}&body=${encodeURIComponent(`Voucher: ${row.code}\nAmount: ${row.total}\nProject: ${row.project}\nComment: ${row.comment}`)}`;
      toast.success("Mail application opened.");
    } else if (key === "edit" && row.uuid) {
      try {
        const response = await fetch(`/api/backend/payment-vouchers/${encodeURIComponent(row.uuid)}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Payment voucher could not be loaded.");
        const detail = result.data?.data ?? result.data ?? result;
        if (!detail || typeof detail !== "object") throw new Error("Payment voucher details were invalid.");
        const voucher = detail as Record<string, unknown>;
        setEditUuid(row.uuid);
        setDate(String(voucher.date ?? "").slice(0, 10));
        setProjectType(String(voucher.projectType ?? ""));
        setProject(String(voucher.projectId ?? ""));
        setTitleOfWork(String(voucher.workId ?? ""));
        setIfTask(String(voucher.taskId ?? ""));
        setSite(String(voucher.siteId ?? ""));
        setSelectedAccount(String(voucher.accountId ?? ""));
        setPaymentMethod(String(voucher.paymentMethod ?? ""));
        setIsCheque(Boolean(voucher.isCheque));
        setChequeNo(String(voucher.chequeNo ?? ""));
        setComment(String(voucher.comment ?? ""));
        setAmount(String(voucher.amount ?? ""));
        setSelectInvoice(String(voucher.invoiceId ?? ""));
        setSelectItem(String(voucher.itemId ?? ""));
        setIsEditModalOpen(true);
        toast.success("Voucher loaded for editing.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Payment voucher could not be loaded for editing.");
      }
    } else if (key === "duplicate" && row.uuid) {
      try {
        const response = await fetch(`/api/backend/payment-vouchers/${encodeURIComponent(row.uuid)}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Payment voucher could not be loaded.");
        const detail = result.data?.data ?? result.data?.data?.data ?? result.data ?? result;
        if (!detail || typeof detail !== "object") throw new Error("Payment voucher details were invalid.");
        const voucher = detail as Record<string, unknown>;
        const entries = Array.isArray(voucher.entries) ? voucher.entries : [];
        const createResponse = await fetch("/api/backend/payment-vouchers", {
          method: "POST",
          headers: { "Content-Type": "application/json", accept: "application/json" },
          body: JSON.stringify({
            date: String(voucher.date ?? "").slice(0, 10),
            projectType: voucher.projectType ?? "",
            projectId: voucher.projectId ?? "",
            workId: voucher.workId ?? "",
            taskId: voucher.taskId ?? "",
            siteId: voucher.siteId ?? "",
            accountId: voucher.accountId ?? "",
            paymentMethod: voucher.paymentMethod ?? "",
            isCheque: Boolean(voucher.isCheque),
            chequeNo: voucher.chequeNo ?? "",
            comment: `Copy of ${voucher.comment ?? row.comment}`,
            amount: Number(voucher.amount ?? row.total),
            invoiceId: voucher.invoiceId ?? "",
            itemId: voucher.itemId ?? "",
            attachmentUrl: voucher.attachmentUrl ?? "",
            entries,
          }),
        });
        const createResult = await createResponse.json();
        if (!createResponse.ok || createResult.success === false) {
          throw new Error(createResult.message || "Payment voucher could not be duplicated.");
        }
        toast.success("Payment voucher duplicated successfully.");
        await fetchVouchers();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Payment voucher could not be duplicated.");
      }
    } else {
      toast(`${key.toUpperCase()} action is ready for voucher ${row.code}`);
    }
  };

  const filteredRows = vouchers.filter((r) =>
    search.trim()
      ? [r.project, r.code, r.debit, r.credit, r.comment, r.titleOfWork].some((field) =>
          field.toLowerCase().includes(search.trim().toLowerCase())
        )
      : true
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / entriesPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * entriesPerPage;
  const visibleRows = filteredRows.slice(startIdx, startIdx + entriesPerPage);

  const exportFilteredRows = () => {
    const header = ["Voucher No", "Date", "Project", "Title", "Debit Account", "Payment Method", "Amount", "Comment", "Status"];
    const escapeCsv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const lines = filteredRows.map((row) => [
      row.code, row.date, row.project, row.titleOfWork, row.debit, row.credit, row.total, row.comment, row.status,
    ].map(escapeCsv).join(","));
    const blob = new Blob([[header.map(escapeCsv).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payment-vouchers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Payment voucher Excel-compatible CSV downloaded.");
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 p-2 text-xs">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 mb-2 w-full">
        <nav className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium truncate">
          <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">Home</span>
          <span>&gt;</span>
          <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-0.5">
            Accounts <ChevronDown className="w-3 h-3" />
          </span>
          <span>&gt;</span>
          <span className="text-slate-400 font-normal truncate">Payment Voucher</span>
        </nav>

        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-[#E55353] hover:bg-rose-600 text-white transition-colors cursor-pointer shrink-0 shadow-xs"
        >
          <ArrowLeft className="w-3 h-3" />
          Back
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full flex flex-col gap-2">
        {/* Payment Voucher Input Form */}
        <form
          onSubmit={handleFormSubmit}
          className="bg-white dark:bg-slate-900 rounded shadow-xs border border-slate-200 dark:border-slate-800 p-2.5 space-y-2 w-full"
        >
          {/* Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full">
            <div>
              <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Project Type</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Project Type</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Project</label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Project</option>
                <option value="Rifat Eyecon City">Rifat Eyecon City</option>
                <option value="Sheba Eyecon Tower">Sheba Eyecon Tower</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Title/Name of Work</label>
              <select
                value={titleOfWork}
                onChange={(e) => setTitleOfWork(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Title/Name of Work</option>
                <option value="Material Purchase">Material Purchase</option>
                <option value="Labor Bill">Labor Bill</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">If Task</label>
              <select
                value={ifTask}
                onChange={(e) => setIfTask(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Task</option>
                <option value="Foundation">Foundation</option>
                <option value="Casting">Casting</option>
              </select>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full">
            <div>
              <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Site</label>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Site</option>
                <option value="Site A">Site A</option>
                <option value="Site B">Site B</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Date</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Voucher No</label>
              <input
                type="text"
                value={voucherNo}
                onChange={(e) => setVoucherNo(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                Select Accounts<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500 truncate"
                >
                  <option value="">Select Chart Of Account_id</option>
                  {accounts.map((account) => {
                    const accountId = String(account.uuid ?? account.id ?? "");
                    return (
                      <option key={accountId} value={accountId}>
                        {account.name ?? accountId}
                      </option>
                    );
                  })}
                </select>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="p-1 bg-[#10B981] hover:bg-emerald-600 text-white rounded transition-colors cursor-pointer shrink-0"
                  title="Add Chart of Account"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                  Payment Method<span className="text-red-500">*</span>
                </label>
                <label className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 cursor-pointer">
                  <span>if Cheque</span>
                  <input
                    type="checkbox"
                    checked={isCheque}
                    onChange={(e) => setIsCheque(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </label>
              </div>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                required
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Payment Method</option>
                <option value="Cash">Cash</option>
                <option value="Bank Check">Bank Check</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Cheque/Receipt No</label>
              <select
                value={chequeNo}
                onChange={(e) => setChequeNo(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select / type cheque number</option>
                <option value="CHQ-88231">CHQ-88231</option>
                <option value="CHQ-99201">CHQ-99201</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Comment/Narration</label>
              <input
                type="text"
                placeholder="Enter Comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                Amount<span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
            <div>
              <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Select Invoice</label>
              <select
                value={selectInvoice}
                onChange={(e) => setSelectInvoice(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Invoice</option>
                <option value="INV-001">INV-001</option>
                <option value="INV-002">INV-002</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Select Item</label>
              <select
                value={selectItem}
                onChange={(e) => setSelectItem(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Item</option>
                <option value="Cement">Cement</option>
                <option value="Steel Rod">Steel Rod</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Attachment</label>
              <div className="flex items-center border border-slate-300 dark:border-slate-800 rounded overflow-hidden bg-white dark:bg-slate-950">
                <label className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-[11px] cursor-pointer border-r border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0 text-slate-700 dark:text-slate-200">
                  Choose File
                  <input
                    type="file"
                    onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                <span className="px-2 text-[10px] text-slate-400 truncate">
                  {attachment ? attachment.name : "No file chosen"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-0.5 flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-1 bg-[#635BFF] hover:bg-indigo-700 text-white font-semibold text-xs rounded transition-colors cursor-pointer shadow-xs"
            >
              {isSubmitting ? (editUuid ? "Replacing..." : "Saving...") : editUuid ? "Save Edited Voucher" : "Submit"}
            </button>
          </div>
        </form>

        {/* Filters & Data Table Box */}
        <div className="bg-white dark:bg-slate-900 rounded shadow-xs border border-slate-200 dark:border-slate-800 p-2 flex flex-col w-full overflow-x-hidden">
          {/* Filter Rows */}
          <div className="space-y-1 mb-1.5 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 w-full">
              <div>
                <label className="block text-[9px] text-slate-500 dark:text-slate-400">Select Date</label>
                <input
                  type="text"
                  readOnly
                  value={filters.dateRange}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-1.5 py-0.5 text-[10px] truncate"
                />
              </div>

              <div>
                <label className="block text-[9px] text-slate-500 dark:text-slate-400">Debit Accounts</label>
                <select
                  value={filters.debitAccount}
                  onChange={(e) => setFilters({ ...filters, debitAccount: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-1.5 py-0.5 text-[10px]"
                >
                  <option value="">Select Chart Of Account</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] text-slate-500 dark:text-slate-400">Credit Accounts</label>
                <select
                  value={filters.creditAccount}
                  onChange={(e) => setFilters({ ...filters, creditAccount: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-1.5 py-0.5 text-[10px]"
                >
                  <option value="">Select Chart Of Account</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] text-slate-500 dark:text-slate-400">Select Project</label>
                <select
                  value={filters.project}
                  onChange={(e) => setFilters({ ...filters, project: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-1.5 py-0.5 text-[10px]"
                >
                  <option value="">Select Project</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-12 gap-1.5 w-full items-end">
              <div className="lg:col-span-4">
                <label className="block text-[9px] text-slate-500 dark:text-slate-400">Title/Name of Work</label>
                <select
                  value={filters.titleOfWork}
                  onChange={(e) => setFilters({ ...filters, titleOfWork: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-1.5 py-0.5 text-[10px]"
                >
                  <option value="">Select Title/Name of Work</option>
                </select>
              </div>

              <div className="lg:col-span-4">
                <label className="block text-[9px] text-slate-500 dark:text-slate-400">Site</label>
                <select
                  value={filters.site}
                  onChange={(e) => setFilters({ ...filters, site: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-1.5 py-0.5 text-[10px]"
                >
                  <option value="">Select Site</option>
                </select>
              </div>

              <div className="lg:col-span-4 flex items-end gap-1">
                <div className="flex-1">
                  <label className="block text-[9px] text-slate-500 dark:text-slate-400">Task</label>
                  <select
                    value={filters.task}
                    onChange={(e) => setFilters({ ...filters, task: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-1.5 py-0.5 text-[10px]"
                  >
                    <option value="">Select Task</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2 py-0.5 bg-[#E55353] hover:bg-rose-600 text-white rounded text-[10px] font-bold shrink-0 flex items-center gap-0.5 cursor-pointer"
                >
                  <FileText className="w-3 h-3" /> PDF
                </button>
                <button
                  type="button"
                  onClick={exportFilteredRows}
                  className="px-2 py-0.5 bg-[#2EB85C] hover:bg-emerald-600 text-white rounded text-[10px] font-bold shrink-0 flex items-center gap-0.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3 h-3" /> Excel
                </button>
              </div>
            </div>
          </div>

          {/* Table Controls */}
          <div className="flex items-center justify-between gap-2 mb-1 text-[10px] w-full">
            <div className="flex items-center gap-1">
              <span>Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-1 py-0.5"
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
                className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-1.5 py-0.5 text-[10px] focus:outline-none"
              />
            </div>
          </div>

          {/* Table Container - Auto fit on LG without horizontal scrollbar */}
          <div className="w-full overflow-x-auto lg:overflow-x-visible border border-slate-200 dark:border-slate-800 rounded">
            <table className="w-full table-fixed text-left border-collapse text-[9px] lg:text-[10px]">
              <thead className="bg-[#635BFF] text-white font-semibold uppercase tracking-wider text-[9px]">
                <tr>
                  <th className="w-[3%] px-1 py-1">SL</th>
                  <th className="w-[8%] px-1 py-1">DATE</th>
                  <th className="w-[9%] px-1 py-1">PROJECT</th>
                  <th className="w-[9%] px-1 py-1">TITLE</th>
                  <th className="w-[6%] px-1 py-1">CODE</th>
                  <th className="w-[9%] px-1 py-1">DEBIT</th>
                  <th className="w-[6%] px-1 py-1">CREDIT</th>
                  <th className="w-[6%] px-1 py-1">TOTAL</th>
                  <th className="w-[8%] px-1 py-1">COMMENT</th>
                  <th className="w-[5%] px-1 py-1">CHEQUE</th>
                  <th className="w-[6%] px-1 py-1">ADDED</th>
                  <th className="w-[5%] px-1 py-1">EDITED</th>
                  <th className="w-[7%] px-1 py-1">APPROVE</th>
                  <th className="w-[4%] px-1 py-1 text-center">ATT</th>
                  <th className="w-[5%] px-1 py-1">STATUS</th>
                  <th className="w-[5%] px-1 py-1 text-right pr-1">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {isLoading ? (
                  <tr>
                    <td colSpan={16} className="px-3 py-6 text-center text-slate-500">
                      Loading payment vouchers...
                    </td>
                  </tr>
                ) : visibleRows.length > 0 ? (
                  visibleRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-1 py-1 truncate">{row.sl}</td>
                      <td className="px-1 py-1 truncate">{row.date}</td>
                      <td className="px-1 py-1 font-medium truncate">{row.project}</td>
                      <td className="px-1 py-1 truncate">{row.titleOfWork}</td>
                      <td className="px-1 py-1 font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {row.code}
                      </td>
                      <td className="px-1 py-1 text-indigo-600 dark:text-indigo-400 font-medium truncate">
                        {row.debit}
                      </td>
                      <td className="px-1 py-1 text-indigo-600 dark:text-indigo-400 font-medium truncate">
                        {row.credit}
                      </td>
                      <td className="px-1 py-1 font-semibold truncate">
                        {row.total.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                      </td>
                      <td className="px-1 py-1 text-slate-500 truncate">{row.comment}</td>
                      <td className="px-1 py-1 text-slate-500 truncate">{row.chequeReceipt}</td>
                      <td className="px-1 py-1 truncate">{row.addedBy}</td>
                      <td className="px-1 py-1 truncate">{row.editedBy}</td>
                      <td className="px-1 py-1 truncate">
                        <div className="space-y-0.5">
                          {row.approval.map((app) => (
                            <span key={app} className="text-emerald-600 dark:text-emerald-400 font-medium block text-[9px] truncate">
                              ✓ {app}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-1 py-1 text-center truncate">{row.attachment}</td>
                      <td className="px-1 py-1 truncate">
                        <span className="px-1 py-0.5 text-[9px] rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium">
                          {row.status}
                        </span>
                      </td>
                      <td className="px-1 py-1 text-right pr-1">
                        <button
                          type="button"
                          onClick={(e) => toggleActionMenu(e, row.id)}
                          className="px-1.5 py-0.5 rounded bg-[#635BFF] hover:bg-indigo-700 text-white font-medium text-[9px] inline-flex items-center gap-0.5 transition-colors cursor-pointer"
                        >
                          Action
                          <ChevronDown className="w-2.5 h-2.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={16} className="px-2 py-3 text-center text-slate-400">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-2 mt-1 pt-0.5 text-[10px] text-slate-500 dark:text-slate-400 w-full">
            <div>
              Showing {filteredRows.length === 0 ? 0 : startIdx + 1} to{" "}
              {startIdx + visibleRows.length} of {filteredRows.length} entries
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={safePage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-800 disabled:opacity-40 cursor-pointer"
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-1.5 py-0.5 rounded ${
                    p === safePage
                      ? "bg-[#635BFF] text-white"
                      : "border border-slate-300 dark:border-slate-800"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-800 disabled:opacity-40 cursor-pointer"
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
            className="fixed z-50 w-32 bg-white dark:bg-slate-800 rounded shadow-lg border border-slate-200 dark:border-slate-700 p-1 space-y-0.5"
          >
            {actionMenuItems.map(({ key, label, icon: Icon, color }) => {
              const targetRow = vouchers.find((r) => r.id === openActionId);
              return (
                <button
                  key={key}
                  onClick={() => targetRow && handleAction(key, targetRow)}
                  className={`w-full flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-medium text-white transition-colors cursor-pointer ${color}`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Modal: Chart Of Account Add */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                Chart Of Account Add
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-0.5 bg-[#E55353] hover:bg-rose-600 text-white rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-3 space-y-2.5">
              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Chart of Group</label>
                    <select
                      value={modalGroup}
                      onChange={(e) => setModalGroup(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-[11px]"
                    >
                      <option value="">Select value</option>
                      <option value="Assets">Assets</option>
                      <option value="Expenses">Expenses</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Chart of Accounts Code</label>
                    <input
                      type="text"
                      placeholder="Accounts Code"
                      value={modalCode}
                      onChange={(e) => setModalCode(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-[11px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Chart of Accounts Name</label>
                    <input
                      type="text"
                      placeholder="Accounts Name"
                      value={modalName}
                      onChange={(e) => setModalName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">Default Module</label>
                    <select
                      value={modalDefaultModule}
                      onChange={(e) => setModalDefaultModule(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-[11px]"
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
                  className="px-3 py-1 bg-slate-400 hover:bg-slate-500 text-white text-xs rounded cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-[#635BFF] hover:bg-indigo-700 text-white text-xs rounded cursor-pointer"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3">
          <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">Payment Voucher Details</h3>
              <button
                type="button"
                onClick={() => setViewVoucher(null)}
                className="rounded bg-[#E55353] p-0.5 text-white hover:bg-rose-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid max-h-[70vh] grid-cols-2 gap-x-3 gap-y-2 overflow-y-auto p-3 text-[11px]">
              {Object.entries(viewVoucher).map(([key, value]) => (
                <div key={key} className="border-b border-slate-100 pb-1 dark:border-slate-800">
                  <div className="font-medium text-slate-500">{key}</div>
                  <div className="break-words text-slate-800 dark:text-slate-100">
                    {value === null || value === undefined ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Edit Payment Voucher</h3>
              <button
                type="button"
                onClick={() => { setIsEditModalOpen(false); setEditUuid(""); }}
                className="rounded bg-[#E55353] p-1 text-white hover:bg-rose-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
              <label className="space-y-1 text-[11px]">Date
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="space-y-1 text-[11px]">Project
                <input required value={project} onChange={(e) => setProject(e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="space-y-1 text-[11px]">Title of work
                <input value={titleOfWork} onChange={(e) => setTitleOfWork(e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="space-y-1 text-[11px]">Account
                <select required value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950">
                  <option value="">Select account</option>
                  {accounts.map((account) => <option key={String(account.uuid ?? account.id)} value={String(account.uuid ?? account.id)}>{account.name ?? account.uuid ?? account.id}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-[11px]">Payment method
                <select required value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950">
                  <option value="">Select payment method</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Check">Bank Check</option>
                </select>
              </label>
              <label className="space-y-1 text-[11px]">Amount
                <input type="number" min="0.01" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="space-y-1 text-[11px]">Cheque number
                <input value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="space-y-1 text-[11px] sm:col-span-2">Comment
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="w-full rounded border border-slate-300 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditUuid(""); }} className="rounded bg-slate-400 px-4 py-1.5 text-xs text-white">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="rounded bg-[#635BFF] px-4 py-1.5 text-xs text-white disabled:opacity-50">
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="flex items-center justify-between text-[9px] text-slate-400 mt-2 pt-1 border-t border-slate-200 dark:border-slate-800">
        <div>2026 © Somikoron IT LTD</div>
        <div>Design &amp; Developed by Somikoron IT LTD</div>
      </footer>
    </div>
  );
}