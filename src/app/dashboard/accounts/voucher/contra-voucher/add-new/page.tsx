"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowLeft,
  Plus,
  X,
  ChevronDown,
  Trash2,
  CheckCircle2,
} from "lucide-react";

// Types
export interface TableRowItem {
  id: string;
  accountUuid?: string;
  accountName: string;
  debit: number;
  credit: number;
  chqReceipt: string;
  note: string;
}

export interface ChartOfAccountOption {
  id: string;
  code: string;
  name: string;
  group: string;
}

export default function ContraVoucherCreatePage() {
  const router = useRouter();
  const [editingUuid, setEditingUuid] = useState("");
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingVoucher, setLoadingVoucher] = useState(false);
  // --- Form Header State ---
  const [headerState, setHeaderState] = useState({
    voucherNo: "CON00001",
    date: "13/09/2026",
    projectType: "",
    titleOfWork: "",
    project: "",
    site: "",
    task: "",
  });

  // --- Dynamic Chart of Accounts Options State ---
  const [accountOptions, setAccountOptions] = useState<ChartOfAccountOption[]>([
    { id: "1", code: "1001", name: "Cash in Hand", group: "Assets" },
    { id: "2", code: "1002", name: "Bank Account (DBBL)", group: "Assets" },
    { id: "3", code: "1003", name: "Petty Cash", group: "Assets" },
    { id: "4", code: "2001", name: "Sundry Creditors", group: "Liabilities" },
  ]);

  // --- Entry Form Inputs State ---
  const [entryType, setEntryType] = useState<"DEBIT" | "CREDIT">("DEBIT");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [amountInput, setAmountInput] = useState<string>("");
  const [chqReceiptInput, setChqReceiptInput] = useState<string>("");
  const [noteInput, setNoteInput] = useState<string>("");

  // --- Dynamic Table Rows State ---
  const [rows, setRows] = useState<TableRowItem[]>([]);

  // --- Bottom Section State ---
  const [comment, setComment] = useState<string>("");
  const [attachment, setAttachment] = useState<File | null>(null);

  // --- Modal Open State ---
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalData, setModalData] = useState({
    group: "",
    code: "",
    name: "",
    status: "",
  });

  // Dynamic Calculated Totals
  const totalDebit = rows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredit = rows.reduce((sum, r) => sum + r.credit, 0);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/backend/chart-of-accounts", { cache: "no-store" });
        const result = await response.json();
        const records = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.data?.data)
            ? result.data.data
            : [];
        if (response.ok && records.length > 0) {
          setAccountOptions(records.map((account: Record<string, unknown>) => ({
            id: String(account.uuid ?? account.id),
            code: String(account.code ?? ""),
            name: String(account.name ?? account.accountName ?? ""),
            group: String(account.group ?? account.under ?? ""),
          })));
        }
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  useEffect(() => {
    const uuid = new URLSearchParams(window.location.search).get("uuid");
    if (!uuid) return;
    setEditingUuid(uuid);
    setIsReadOnly(new URLSearchParams(window.location.search).get("mode") === "view");
    setLoadingVoucher(true);
    void (async () => {
      try {
        const response = await fetch(`/api/backend/contra-vouchers/${encodeURIComponent(uuid)}`, { cache: "no-store" });
        const result = await response.json();
        if (!response.ok || result.success === false) throw new Error(result.message || "Contra voucher could not be loaded.");
        const record = (result.data?.data ?? result.data ?? result) as Record<string, unknown>;
        setHeaderState({
          voucherNo: String(record.voucherNo ?? record.code ?? ""),
          date: String(record.date ?? record.voucherDate ?? "").slice(0, 10),
          projectType: String(record.projectType ?? ""),
          titleOfWork: String(record.titleOfWork ?? ""),
          project: String(record.project ?? ""),
          site: String(record.site ?? ""),
          task: String(record.task ?? ""),
        });
        setComment(String(record.comment ?? record.note ?? ""));
        const details = Array.isArray(record.items) ? record.items
          : Array.isArray(record.details) ? record.details
            : Array.isArray(record.contraVoucherDetails) ? record.contraVoucherDetails
              : [];
        setRows(details.map((detail, index) => {
          const item = detail as Record<string, unknown>;
          const account = typeof item.chartOfAccount === "object" && item.chartOfAccount
            ? item.chartOfAccount as Record<string, unknown>
            : item.account as Record<string, unknown> | undefined;
          return {
            id: String(item.uuid ?? item.id ?? index),
            accountUuid: String(
              item.accountId ??
              item.accountUuid ??
              item.chartOfAccountUuid ??
              item.chartOfAccountId ??
              account?.uuid ??
              account?.id ??
              "",
            ),
            accountName: String(account?.name ?? item.accountName ?? item.name ?? "Account"),
            debit: Number(item.debit ?? 0),
            credit: Number(item.credit ?? 0),
            chqReceipt: String(item.chqReceipt ?? item.chequeReceipt ?? item.receiptNo ?? "—"),
            note: String(item.note ?? item.description ?? "—"),
          };
        }));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Contra voucher could not be loaded.");
      } finally {
        setLoadingVoucher(false);
      }
    })();
  }, []);

  // Add Item to Table Handler
  const handleAddRow = () => {
    if (!selectedAccountId) {
      toast.error("Please select a Chart of Account!");
      return;
    }
    const numericAmount = parseFloat(amountInput);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error("Please enter a valid amount!");
      return;
    }

    const selectedAcc = accountOptions.find((a) => a.id === selectedAccountId);
    const newRow: TableRowItem = {
      id: Date.now().toString(),
      accountUuid: selectedAcc?.id,
      accountName: selectedAcc
        ? `${selectedAcc.name} (${selectedAcc.code})`
        : "Account",
      debit: entryType === "DEBIT" ? numericAmount : 0,
      credit: entryType === "CREDIT" ? numericAmount : 0,
      chqReceipt: chqReceiptInput || "—",
      note: noteInput || "—",
    };

    setRows((prev) => [...prev, newRow]);

    // Reset Entry Inputs
    setSelectedAccountId("");
    setAmountInput("");
    setChqReceiptInput("");
    setNoteInput("");
  };

  // Delete Row Handler
  const handleDeleteRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Modal Submit (Add New Chart of Account)
  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalData.name || !modalData.code) {
      toast.error("Please fill in the account code and name.");
      return;
    }

    const newOption: ChartOfAccountOption = {
      id: Date.now().toString(),
      code: modalData.code,
      name: modalData.name,
      group: modalData.group || "General",
    };

    setAccountOptions((prev) => [...prev, newOption]);
    setSelectedAccountId(newOption.id); // Auto select created account
    setIsModalOpen(false);
    setModalData({ group: "", code: "", name: "", status: "" });
  };

  // Main Voucher Submit Handler (API Payload Ready)
  const handleMainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rows.length === 0) {
      toast.error("Please add at least one account entry to the table!");
      return;
    }
    const resolvedRows = rows.map((row) => {
      const accountUuid = row.accountUuid?.trim() ?? "";
      const matchedOption = accountUuid
        ? accountOptions.find((option) => option.id === accountUuid)
        : undefined;
      const nameMatchedOption = matchedOption ?? accountOptions.find((option) =>
        row.accountName === option.name ||
        row.accountName === `${option.name} (${option.code})` ||
        row.accountName.startsWith(`${option.name} `),
      );

      return {
        ...row,
        accountUuid: matchedOption?.id ?? nameMatchedOption?.id ?? accountUuid,
      };
    });
    if (resolvedRows.some((row) =>
      !row.accountUuid &&
      (!row.accountName || row.accountName === "Account"),
    )) {
      toast.error("Please select an account for every voucher entry!");
      return;
    }
    const payload = {
      ...headerState,
      voucherNo: headerState.voucherNo,
      date: /^\d{4}-\d{2}-\d{2}$/.test(headerState.date)
        ? headerState.date
        : headerState.date.includes("/")
          ? headerState.date.split("/").reverse().join("-")
          : headerState.date,
      items: resolvedRows.map((row) => ({
        entryType: row.debit > 0 ? "DEBIT" : "CREDIT",
        accountId: row.accountUuid,
        accountName: row.accountName,
        debit: row.debit,
        credit: row.credit,
        chequeReceiptNo: row.chqReceipt === "—" ? "" : row.chqReceipt,
        note: row.note === "—" ? "" : row.note,
      })),
      totalDebit,
      totalCredit,
      comment,
      attachmentUrl: attachment?.name ?? "",
    };

    setIsSubmitting(true);
    try {
      const url = editingUuid
        ? `/api/backend/contra-vouchers/${encodeURIComponent(editingUuid)}`
        : "/api/backend/contra-vouchers";
      let response = await fetch(url, {
        method: editingUuid ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (editingUuid && !response.ok) {
        response = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) {
        throw new Error(result.message || result.error || "Contra voucher could not be saved.");
      }
      toast.success(editingUuid ? "Contra voucher updated successfully." : "Contra voucher created successfully.");
      router.push("/dashboard/accounts/voucher/contra-voucher");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Contra voucher could not be saved.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 p-2.5 text-xs flex flex-col justify-between">
      <Toaster position="top-right" />
      {/* Top Header Navigation */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2 w-full">
          <nav className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium truncate">
            <Link
              href="/"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Home
            </Link>
            <span>&gt;</span>
            <span className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer">
              Accounts Module <ChevronDown className="w-3 h-3" />
            </span>
            <span>&gt;</span>
            <span className="text-slate-400 font-normal truncate">
              Contra Voucher
            </span>
          </nav>

          <Link
            href="/dashboard/accounts/voucher/contra-voucher"
            className="flex items-center gap-1 px-3 py-1 text-[11px] font-semibold rounded bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to previous
          </Link>
        </div>

        {/* Header Inputs Section */}
        <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 p-3 mb-2 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            {/* Left Column */}
            <div className="space-y-2">
              <div className="flex items-center">
                <label className="w-32 text-right pr-3 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Voucher No
                </label>
                <input
                  type="text"
                  readOnly
                  value={headerState.voucherNo}
                  className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1 text-slate-700 dark:text-slate-200 outline-none font-medium"
                />
              </div>

              <div className="flex items-center">
                <label className="w-32 text-right pr-3 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Date
                </label>
                <input
                  type="text"
                  value={headerState.date}
                  onChange={(e) =>
                    setHeaderState({ ...headerState, date: e.target.value })
                  }
                  className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center">
                <label className="w-32 text-right pr-3 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Project Type
                </label>
                <select
                  value={headerState.projectType}
                  onChange={(e) =>
                    setHeaderState({
                      ...headerState,
                      projectType: e.target.value,
                    })
                  }
                  className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="">Select Project Type</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Residential">Residential</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="w-32 text-right pr-3 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Title/Name of Work
                </label>
                <select
                  value={headerState.titleOfWork}
                  onChange={(e) =>
                    setHeaderState({
                      ...headerState,
                      titleOfWork: e.target.value,
                    })
                  }
                  className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="">Select Title/Name of Work</option>
                  <option value="Cash Transfer">Cash Transfer</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-2">
              <div className="flex items-center">
                <label className="w-24 text-right pr-3 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Project
                </label>
                <select
                  value={headerState.project}
                  onChange={(e) =>
                    setHeaderState({ ...headerState, project: e.target.value })
                  }
                  className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="">Select Project</option>
                  <option value="Project Alpha">Project Alpha</option>
                  <option value="Project Beta">Project Beta</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="w-24 text-right pr-3 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Site
                </label>
                <select
                  value={headerState.site}
                  onChange={(e) =>
                    setHeaderState({ ...headerState, site: e.target.value })
                  }
                  className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="">Select Site</option>
                  <option value="Main Branch">Main Branch</option>
                  <option value="Site Office">Site Office</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="w-24 text-right pr-3 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  If Task
                </label>
                <select
                  value={headerState.task}
                  onChange={(e) =>
                    setHeaderState({ ...headerState, task: e.target.value })
                  }
                  className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="">Select Task</option>
                  <option value="Fund Allocation">Fund Allocation</option>
                  <option value="Inter-account Transfer">
                    Inter-account Transfer
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Entry Inputs Section */}
        <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 p-2.5 mb-3 shadow-xs">
          <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
            <select
              value={entryType}
              onChange={(e) =>
                setEntryType(e.target.value as "DEBIT" | "CREDIT")
              }
              className="w-full md:w-44 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 font-medium"
            >
              <option value="DEBIT">Debit</option>
              <option value="CREDIT">Credit</option>
            </select>

            {/* Account Selector + PLUS BUTTON TO OPEN MODAL */}
            <div className="flex-1 flex items-center gap-1 min-w-[220px]">
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
              >
                <option value="">Select Chart Of Account</option>
                {accountOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name} ({opt.code})
                  </option>
                ))}
              </select>

              {/* GREEN PLUS BUTTON (MODAL TRIGGER) */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="p-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white shrink-0 transition-colors cursor-pointer"
                title="Add New Chart of Account"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <input
              type="number"
              placeholder="Amount"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full md:w-36 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
            />

            <input
              type="text"
              placeholder="Chq/Receipt No"
              value={chqReceiptInput}
              onChange={(e) => setChqReceiptInput(e.target.value)}
              className="w-full md:w-36 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
            />

            <input
              type="text"
              placeholder="Note"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              className="w-full md:w-44 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
            />

            <button
              type="button"
              onClick={handleAddRow}
              className="w-full md:w-auto px-5 py-1.5 bg-[#635BFF] hover:bg-indigo-700 text-white font-semibold rounded transition-colors shrink-0 cursor-pointer shadow-xs"
            >
              Add
            </button>
          </div>
        </div>

        {/* Entry Table Section */}
        <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 overflow-hidden mb-3 shadow-xs">
          <table className="w-full table-fixed text-left border-collapse text-xs">
            <thead className="bg-[#635BFF] text-white font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="w-[30%] px-3 py-2">ACCOUNTS</th>
                <th className="w-[14%] px-3 py-2">DEBIT</th>
                <th className="w-[14%] px-3 py-2">CREDIT</th>
                <th className="w-[18%] px-3 py-2">CHQ/RECEIPT</th>
                <th className="w-[18%] px-3 py-2">NOTE</th>
                <th className="w-[6%] px-2 py-2 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {rows.length > 0 ? (
                rows.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100 truncate">
                      {r.accountName}
                    </td>
                    <td className="px-3 py-2 font-medium text-emerald-600 dark:text-emerald-400 truncate">
                      {r.debit > 0 ? r.debit.toFixed(2) : "0.00"}
                    </td>
                    <td className="px-3 py-2 font-medium text-indigo-600 dark:text-indigo-400 truncate">
                      {r.credit > 0 ? r.credit.toFixed(2) : "0.00"}
                    </td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400 truncate">
                      {r.chqReceipt}
                    </td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400 truncate">
                      {r.note}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(r.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-4 text-center text-slate-400 italic"
                  >
                    No entries added yet. Select Type &amp; Account above to add
                    entries.
                  </td>
                </tr>
              )}
            </tbody>
            {/* Table Footer with Dynamic Totals */}
            <tfoot className="bg-slate-50 dark:bg-slate-950 font-bold border-t border-slate-200 dark:border-slate-800 text-xs">
              <tr>
                <td className="px-3 py-2 text-right">TOTAL:</td>
                <td className="px-3 py-2 text-emerald-600 dark:text-emerald-400">
                  {totalDebit.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-indigo-600 dark:text-indigo-400">
                  {totalCredit.toFixed(2)}
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Comment & Attachment Section */}
        <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 p-3 mb-3 shadow-xs">
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            {/* Comment Area */}
            <div className="flex items-start gap-3 w-full md:w-1/2">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 pt-1 shrink-0">
                Comment
              </label>
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter comments..."
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 resize-none text-xs"
              />
            </div>

            {/* Attachment File Input */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 shrink-0">
                Attachment
              </label>
              <input
                type="file"
                onChange={(e) =>
                  setAttachment(e.target.files ? e.target.files[0] : null)
                }
                className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 dark:file:bg-slate-800 dark:file:text-slate-300 hover:file:bg-slate-300 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Center Submit Button */}
        <div className="flex justify-center mb-4">
          {!isReadOnly && (
            <button
              type="button"
              onClick={handleMainSubmit}
              disabled={isSubmitting || loadingVoucher}
              className="px-8 py-2 bg-[#635BFF] hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-md shadow-md transition-colors cursor-pointer text-sm"
            >
              {isSubmitting ? "Saving..." : editingUuid ? "Update" : "Submit"}
            </button>
          )}
        </div>
      </div>

      {/* CHART OF ACCOUNT ADD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-medium text-slate-800 dark:text-slate-100 text-xs">
                Chart Of Account Add
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleModalSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Chart of Group
                </label>
                <select
                  value={modalData.group}
                  onChange={(e) =>
                    setModalData({ ...modalData, group: e.target.value })
                  }
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="">Select value</option>
                  <option value="Assets">Assets</option>
                  <option value="Liabilities">Liabilities</option>
                  <option value="Expenses">Expenses</option>
                  <option value="Income">Income</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Chart of Accounts Code
                </label>
                <input
                  type="text"
                  placeholder="Chart of Accounts Code"
                  value={modalData.code}
                  onChange={(e) =>
                    setModalData({ ...modalData, code: e.target.value })
                  }
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Chart of Accounts Name
                </label>
                <input
                  type="text"
                  placeholder="Enter Chart of Accounts Name"
                  value={modalData.name}
                  onChange={(e) =>
                    setModalData({ ...modalData, name: e.target.value })
                  }
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Set Accounts Default Module
                </label>
                <select
                  value={modalData.status}
                  onChange={(e) =>
                    setModalData({ ...modalData, status: e.target.value })
                  }
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="">Select Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 rounded bg-slate-400 hover:bg-slate-500 text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="flex items-center justify-between text-[9px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800 mt-auto">
        <div>2026 © Somikoron IT LTD</div>
        <div>Design &amp; Developed by Somikoron IT LTD</div>
      </footer>
    </div>
  );
}
