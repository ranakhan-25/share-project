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

// ---------- Types ----------
export interface TableRowItem {
  id: string;
  accountUuid: string;
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

// ---------- Helpers ----------
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidUuid = (v: string | undefined | null): boolean =>
  typeof v === "string" && UUID_REGEX.test(v.trim());

const parseAmount = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const normalized = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(normalized) ? normalized : 0;
};

const normalizeDate = (input: string): string => {
  const trimmed = (input ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split("/");
    return `${y}-${m}-${d}`;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return trimmed;
};

// ---------- Component ----------
export default function JournalVoucherCreatePage() {
  const router = useRouter();
  const [editingUuid, setEditingUuid] = useState("");
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Header state
  const [headerState, setHeaderState] = useState({
    voucherNo: "P00005",
    date: "2026-11-03",
    projectType: "",
    titleOfWork: "",
    project: "",
    site: "",
    task: "",
  });

  // Chart of accounts
  const [accountOptions, setAccountOptions] = useState<ChartOfAccountOption[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Entry input state
  const [entryType, setEntryType] = useState<"DEBIT" | "CREDIT">("DEBIT");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [amountInput, setAmountInput] = useState<string>("");
  const [chqReceiptInput, setChqReceiptInput] = useState<string>("");
  const [noteInput, setNoteInput] = useState<string>("");

  // Rows
  const [rows, setRows] = useState<TableRowItem[]>([]);
  const [loadingVoucher, setLoadingVoucher] = useState(false);

  // Bottom
  const [comment, setComment] = useState<string>("");
  const [attachment, setAttachment] = useState<File | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalData, setModalData] = useState({
    group: "",
    code: "",
    name: "",
    status: "",
  });

  // Totals
  const totalDebit =
    Math.round(rows.reduce((s, r) => s + r.debit, 0) * 100) / 100;
  const totalCredit =
    Math.round(rows.reduce((s, r) => s + r.credit, 0) * 100) / 100;
  const isBalanced = Math.abs(totalDebit - totalCredit) <= 0.005;

  // ---------- Load chart of accounts ----------
  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/backend/chart-of-accounts", {
          cache: "no-store",
        });
        const result = await response.json();
        const data = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.data?.data)
            ? result.data.data
            : [];

        const mapped: ChartOfAccountOption[] = data
          .map((account: Record<string, unknown>) => ({
            id: String(account.uuid ?? account.id ?? "").trim(),
            code: String(account.code ?? "").trim(),
            name: String(account.name ?? account.accountName ?? "").trim(),
            group: String(account.group ?? account.under ?? "").trim(),
          }))
          .filter((a: ChartOfAccountOption) => isValidUuid(a.id));

        setAccountOptions(mapped);

        if (mapped.length === 0 && data.length > 0) {
          toast.error(
            "Chart of accounts loaded but none has a valid UUID. Check backend response.",
          );
        }
      } catch (error) {
        console.error(error);
        toast.error("Chart of accounts could not be loaded.");
      } finally {
        setLoadingAccounts(false);
      }
    })();
  }, []);

  // ---------- Load existing voucher (edit / view) ----------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uuid = params.get("uuid");
    if (!uuid) return;

    setEditingUuid(uuid);
    setIsReadOnly(params.get("mode") === "view");
    setLoadingVoucher(true);

    void (async () => {
      try {
        const response = await fetch(
          `/api/backend/journal-vouchers/${encodeURIComponent(uuid)}`,
          { cache: "no-store" },
        );
        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.message || "Voucher could not be loaded.");
        }
        const record = (result.data?.data ?? result.data ?? result) as Record<
          string,
          unknown
        >;

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

        const details = Array.isArray(record.items)
          ? record.items
          : Array.isArray(record.details)
            ? record.details
            : Array.isArray(record.journalVoucherDetails)
              ? record.journalVoucherDetails
              : [];

        setRows(
          details.map((detail, index) => {
            const item = detail as Record<string, unknown>;
            const account =
              typeof item.chartOfAccount === "object" && item.chartOfAccount
                ? (item.chartOfAccount as Record<string, unknown>)
                : typeof item.account === "object" && item.account
                  ? (item.account as Record<string, unknown>)
                  : undefined;

            const accountUuid = String(
              item.chartOfAccountUuid ??
                item.chartOfAccountId ??
                item.accountUuid ??
                item.accountId ??
                item.chart_of_account_uuid ??
                item.chart_of_account_id ??
                item.account_uuid ??
                item.account_id ??
                account?.uuid ??
                account?.id ??
                "",
            ).trim();

            return {
              id: String(item.uuid ?? item.id ?? index),
              accountUuid: isValidUuid(accountUuid) ? accountUuid : "",
              accountName: String(
                account?.name ??
                  account?.accountName ??
                  item.accountName ??
                  item.account_name ??
                  item.name ??
                  "Account",
              ),
              debit: parseAmount(item.debit ?? item.debitAmount ?? item.dr ?? 0),
              credit: parseAmount(
                item.credit ?? item.creditAmount ?? item.cr ?? 0,
              ),
              chqReceipt: String(
                item.chqReceipt ??
                  item.chequeReceiptNo ??
                  item.chequeReceipt ??
                  item.receiptNo ??
                  "—",
              ),
              note: String(item.note ?? item.description ?? "—"),
            };
          }),
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Voucher could not be loaded.",
        );
      } finally {
        setLoadingVoucher(false);
      }
    })();
  }, []);

  // ---------- Add row ----------
  const handleAddRow = () => {
    if (!selectedAccountId) {
      alert("Please select a Chart of Account!");
      return;
    }
    if (!isValidUuid(selectedAccountId)) {
      alert(
        "Selected account is invalid (missing UUID). Please reload the page.",
      );
      return;
    }
    const numericAmount =
      Math.round((parseFloat(amountInput) + Number.EPSILON) * 100) / 100;
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert("Please enter a valid amount!");
      return;
    }

    const selectedAcc = accountOptions.find((a) => a.id === selectedAccountId);
    if (!selectedAcc) {
      alert("Selected account not found. Please reload the page.");
      return;
    }

    const newRow: TableRowItem = {
      id: Date.now().toString(),
      accountUuid: selectedAcc.id,
      accountName: `${selectedAcc.name} (${selectedAcc.code})`,
      debit: entryType === "DEBIT" ? numericAmount : 0,
      credit: entryType === "CREDIT" ? numericAmount : 0,
      chqReceipt: chqReceiptInput.trim() || "—",
      note: noteInput.trim() || "—",
    };

    setRows((prev) => [...prev, newRow]);
    setSelectedAccountId("");
    setAmountInput("");
    setChqReceiptInput("");
    setNoteInput("");
  };

  // ---------- Delete row ----------
  const handleDeleteRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // ---------- Modal submit (add new chart of account) ----------
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalData.name.trim() || !modalData.code.trim()) {
      alert("Please fill in the account code and name.");
      return;
    }

    try {
      const response = await fetch("/api/backend/chart-of-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: modalData.code.trim(),
          name: modalData.name.trim(),
          group: modalData.group || "General",
          status: modalData.status || "Active",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Chart of account could not be created.",
        );
      }
      const created = (result.data?.data ?? result.data ?? result) as Record<
        string,
        unknown
      >;
      const newUuid = String(created.uuid ?? created.id ?? "").trim();

      if (!isValidUuid(newUuid)) {
        throw new Error(
          "Backend did not return a valid UUID for the new account.",
        );
      }

      const newOption: ChartOfAccountOption = {
        id: newUuid,
        code: String(created.code ?? modalData.code),
        name: String(created.name ?? modalData.name),
        group: String(created.group ?? modalData.group ?? "General"),
      };

      setAccountOptions((prev) => [...prev, newOption]);
      setSelectedAccountId(newOption.id);
      setIsModalOpen(false);
      setModalData({ group: "", code: "", name: "", status: "" });
      toast.success("Chart of account created.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Chart of account could not be created.",
      );
    }
  };

  // ---------- Main submit ----------
  const handleMainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1) কমপক্ষে একটি entry
    if (rows.length === 0) {
      toast.error("Please add at least one account entry to the table!");
      return;
    }

    // 2) প্রতিটি row-এ valid UUID accountId
    const invalidRows = rows.filter((row) => !isValidUuid(row.accountUuid));
    if (invalidRows.length > 0) {
      toast.error(
        `Please select a valid Chart of Account for ${invalidRows.length} entry(ies).`,
      );
      return;
    }

    // 3) Debit == Credit কঠোরভাবে
    if (!isBalanced) {
      toast.error(
        `Debit (${totalDebit.toFixed(2)}) and Credit (${totalCredit.toFixed(
          2,
        )}) must be equal. Difference: ${(totalDebit - totalCredit).toFixed(2)}`,
      );
      return;
    }

    // 4) Date valid format
    const normalizedDate = normalizeDate(headerState.date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
      toast.error("Please enter a valid date (YYYY-MM-DD).");
      return;
    }

    // 5) Payload তৈরি
    const basePayload = {
      voucherNo: headerState.voucherNo,
      date: normalizedDate,
      projectType: headerState.projectType || undefined,
      titleOfWork: headerState.titleOfWork || undefined,
      project: headerState.project || undefined,
      site: headerState.site || undefined,
      task: headerState.task || undefined,
      comment: comment || undefined,
      totalDebit,
      totalCredit,
      items: rows.map((row) => ({
        entryType: row.debit > 0 ? ("DEBIT" as const) : ("CREDIT" as const),
        accountId: row.accountUuid, // guaranteed valid UUID
        accountName: row.accountName,
        debit: row.debit,
        credit: row.credit,
        chequeReceiptNo: row.chqReceipt === "—" ? "" : row.chqReceipt,
        note: row.note === "—" ? "" : row.note,
      })),
    };

    // ✅ CREATE: শুধু addedBy
    // ✅ UPDATE: শুধু updatedBy
    const payload = editingUuid
      ? { ...basePayload, updatedBy: "Admin" }
      : { ...basePayload, addedBy: "Admin" };

    setIsSubmitting(true);
    try {
      const url = editingUuid
        ? `/api/backend/journal-vouchers/${encodeURIComponent(editingUuid)}`
        : "/api/backend/journal-vouchers";

      // Create = POST, Update = PATCH, fail হলে PUT
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
        const validationErrors =
          Array.isArray(result.errors) && result.errors.length > 0
            ? result.errors
                .map(
                  (e: { field?: string; errors?: string[] }) =>
                    `${e.field ?? ""}: ${
                      Array.isArray(e.errors) ? e.errors.join(", ") : ""
                    }`,
                )
                .join("; ")
            : "";

        const msg =
          result.message ||
          result.error ||
          validationErrors ||
          `Save failed (${response.status}).`;
        throw new Error(msg);
      }

      toast.success(
        editingUuid
          ? "Journal voucher updated successfully."
          : "Journal voucher created successfully.",
      );
      router.push("/dashboard/accounts/voucher/journal-voucher");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Journal voucher could not be saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- Render ----------
  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 p-2.5 text-xs flex flex-col justify-between">
      <Toaster position="top-right" />

      <div>
        {/* Header nav */}
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
              Journal Voucher
            </span>
          </nav>

          <Link
            href="/dashboard/accounts/voucher/journal-voucher"
            className="flex items-center gap-1 px-3 py-1 text-[11px] font-semibold rounded bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to previous
          </Link>
        </div>

        {/* Header inputs */}
        <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 p-3 mb-2 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            <div className="space-y-2">
              <div className="flex items-center">
                <label className="w-32 text-right pr-3 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Voucher No
                </label>
                <input
                  type="text"
                  readOnly
                  value={headerState.voucherNo}
                  className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1 text-slate-700 dark:text-slate-200 outline-none"
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
                  <option value="Civil Work">Civil Work</option>
                  <option value="Electrical Work">Electrical Work</option>
                </select>
              </div>
            </div>

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
                  <option value="Tower A">Tower A</option>
                  <option value="Plaza B">Plaza B</option>
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
                  <option value="Dhaka Site">Dhaka Site</option>
                  <option value="Chittagong Site">Chittagong Site</option>
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
                  <option value="Foundation">Foundation</option>
                  <option value="Finishing">Finishing</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Entry creator bar */}
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

            <div className="flex-1 flex items-center gap-1 min-w-[220px]">
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                disabled={loadingAccounts}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
              >
                <option value="">
                  {loadingAccounts
                    ? "Loading accounts..."
                    : "Select Chart Of Account"}
                </option>
                {accountOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name} ({opt.code})
                  </option>
                ))}
              </select>

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

        {/* Table */}
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
                        title="Delete Row"
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
                    No account entries added yet. Use the inputs above to add
                    entries.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-950 font-bold border-t border-slate-200 dark:border-slate-800 text-xs">
              <tr>
                <td className="px-3 py-2 text-right">TOTAL:</td>
                <td className="px-3 py-2 text-emerald-600 dark:text-emerald-400">
                  {totalDebit.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-indigo-600 dark:text-indigo-400">
                  {totalCredit.toFixed(2)}
                </td>
                <td colSpan={3} className="px-3 py-2">
                  {isBalanced ? (
                    <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">
                      ✓ Balanced
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400 text-[10px]">
                      ✗ Unbalanced by{" "}
                      {(totalDebit - totalCredit).toFixed(2)}
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Comment + attachment */}
        <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 p-3 mb-3 shadow-xs">
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
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

        {/* Submit */}
        <div className="flex justify-center mb-4">
          {!isReadOnly && (
            <button
              type="button"
              onClick={handleMainSubmit}
              disabled={
                isSubmitting || loadingVoucher || loadingAccounts || !isBalanced
              }
              className="px-8 py-2 bg-[#635BFF] hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-md shadow-md transition-colors cursor-pointer text-sm"
            >
              {isSubmitting ? "Saving..." : editingUuid ? "Update" : "Submit"}
            </button>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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

      <footer className="flex items-center justify-between text-[9px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800 mt-auto">
        <div>2026 © Somikoron IT LTD</div>
        <div>Design &amp; Developed by Somikoron IT LTD</div>
      </footer>
    </div>
  );
}