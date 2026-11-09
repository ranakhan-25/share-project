"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, X, ChevronsLeft, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface AccountItem {
  id: string;
  accountId: string;
  account: string;
  amount: number;
  note: string;
}

export default function ExpenseAddPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editUuid = searchParams.get("uuid");
  const API_BASE = "/api/backend";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Array<{ uuid?: string; id?: string; name?: string }>>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Main Form States
  const [projectType, setProjectType] = useState("");
  const [project, setProject] = useState("");
  const [titleOfWork, setTitleOfWork] = useState("");
  const [task, setTask] = useState("");
  const [site, setSite] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [voucherNo, setVoucherNo] = useState("EXP00003");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");

  // Table Items State
  const [items, setItems] = useState<AccountItem[]>([]);

  // Additional Form States
  const [contact, setContact] = useState("");
  const [cashBank, setCashBank] = useState("");
  const [chequeNo, setChequeNo] = useState("");
  const [comment, setComment] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  // Modal Form States
  const [modalChartGroup, setModalChartGroup] = useState("");
  const [modalAccountCode, setModalAccountCode] = useState("");
  const [modalAccountName, setModalAccountName] = useState("");
  const [modalDefaultModule, setModalDefaultModule] = useState("");

  useEffect(() => {
    const loadAccounts = async () => {
      setIsLoadingAccounts(true);
      try {
        const response = await fetch(`${API_BASE}/chart-of-accounts`, {
          headers: { accept: "application/json" },
        });
        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.message || "Chart of accounts could not be loaded.");
        }
        const findArray = (value: unknown): unknown[] | null => {
          if (Array.isArray(value)) return value;
          if (!value || typeof value !== "object") return null;
          for (const nested of Object.values(value)) {
            const found = findArray(nested);
            if (found) return found;
          }
          return null;
        };
        const payload = findArray(result) ?? [];
        if (Array.isArray(payload)) {
          setAccounts(payload.filter(
            (account): account is { uuid?: string; id?: string; name?: string } =>
              Boolean(account) && typeof account === "object",
          ));
        }
      } catch (error) {
        console.error("Failed to load chart of accounts", error);
        setAccounts([]);
        toast.error(error instanceof Error ? error.message : "Chart of accounts could not be loaded.");
      } finally {
        setIsLoadingAccounts(false);
      }
    };
    loadAccounts();
  }, []);

  useEffect(() => {
    if (!editUuid) return;
    const loadExpense = async () => {
      try {
        const response = await fetch(`${API_BASE}/expenses/${editUuid}`);
        const result = await response.json();
        const expense = result.data?.data ?? result.data ?? {};
        setProjectType(expense.projectType ?? "");
        setProject(expense.project ?? "");
        setTitleOfWork(expense.titleOfWork ?? "");
        setTask(expense.task ?? "");
        setSite(expense.site ?? "");
        setDate(expense.date?.slice(0, 10) ?? "");
        setVoucherNo(expense.voucherNo ?? "");
        setContact(expense.contact ?? "");
        setCashBank(expense.cashOrBank ?? "");
        setChequeNo(expense.chequeNo ?? "");
        setComment(expense.comment ?? "");
        setItems((expense.items ?? []).map((item: { accountId?: string; amount?: number | string; note?: string }, index: number) => ({
          id: String(item.accountId ?? index),
          accountId: String(item.accountId ?? ""),
          account: String(item.accountId ?? ""),
          amount: Number(item.amount ?? 0),
          note: item.note ?? "",
        })));
      } catch (error) {
        console.error("Failed to load expense", error);
      }
    };
    loadExpense();
  }, [editUuid]);

  // Add Item to Table
  const handleAddItem = () => {
    if (amount.trim() === "" || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount greater than zero.");
      return;
    }
    if (!selectedAccount.trim()) {
      toast.error("Please select a chart of account.");
      return;
    }

    const selectedAccountData = accounts.find(
      (account) => String(account.uuid ?? account.id ?? "") === selectedAccount,
    );
    const newItem: AccountItem = {
      id: `TXN-${Date.now().toString().slice(-4)}`,
      accountId: selectedAccount,
      account: selectedAccountData?.name ?? selectedAccount,
      amount: parseFloat(amount),
      note: note || "-",
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedAccount("");
    setAmount("");
    setNote("");
    toast.success("Account item added.");
  };

  // Remove Item from Table
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculate Total Amount
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  // Handle Main Submit
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) {
      toast.error("Please add at least one account item.");
      return;
    }

    const payload = {
      projectType,
      project,
      titleOfWork,
      task,
      site,
      date,
      voucherNo,
      contact,
      cashOrBank: cashBank,
      chequeNo,
      totalAmount,
      comment,
      attachmentUrl: attachment?.name ?? "",
      items: items.map((item) => ({
        accountId: item.accountId,
        amount: item.amount,
        note: item.note === "-" ? "" : item.note,
      })),
      addedBy: "Admin",
      addedById: "admin",
    };

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/expenses${editUuid ? `/${editUuid}` : ""}`, {
        method: editUuid ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Expense could not be saved.");
      }
      toast.success(editUuid ? "Expense updated successfully!" : "Expense added successfully!");
      router.push("/dashboard/accounts/voucher/expense");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Expense could not be saved.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Modal Submit
  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Chart of Account Added:", {
      modalChartGroup,
      modalAccountCode,
      modalAccountName,
      modalDefaultModule,
    });
    toast.success("New Account Added Successfully!");
    setIsModalOpen(false);

    // Reset Modal Form
    setModalChartGroup("");
    setModalAccountCode("");
    setModalAccountName("");
    setModalDefaultModule("");
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 dark:bg-slate-950 p-4 font-sans text-slate-700 dark:text-slate-200">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-row items-center justify-between gap-2 mb-4">
        <nav className="text-xs md:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
          <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
            Home
          </span>
          <span>&gt;</span>
          <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
            Accounts Module
          </span>
          <span>&gt;</span>
          <span className="text-slate-400 dark:text-slate-500 font-normal">
            Expense
          </span>
        </nav>

        <button
          type="button"
          onClick={() => router.push("/dashboard/accounts/voucher/expense")}
          className="flex items-center gap-1 px-3 py-1.5 text-xs md:text-sm font-semibold rounded-md bg-[#635BFF] hover:bg-indigo-700 text-white transition-all shadow-sm cursor-pointer"
        >
          <ChevronsLeft className="w-4 h-4" />
          Expense List
        </button>
      </div>

      {/* Main Content Container */}
      <form
        onSubmit={handleSubmitExpense}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-5"
      >
        {/* Row 1: Project & Work Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Project Type
            </label>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select Project Type</option>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Project
            </label>
            <select
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select Project</option>
              <option value="Rifat Eyecon City">Rifat Eyecon City</option>
              <option value="Skyline Tower">Skyline Tower</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Title/Name of Work
            </label>
            <select
              value={titleOfWork}
              onChange={(e) => setTitleOfWork(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select Title/Name of Work</option>
              <option value="Foundation Work">Foundation Work</option>
              <option value="Electrical Wiring">Electrical Wiring</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              If Task
            </label>
            <select
              value={task}
              onChange={(e) => setTask(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select Task</option>
              <option value="Task 1">Task 1</option>
              <option value="Task 2">Task 2</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Site
            </label>
            <select
              value={site}
              onChange={(e) => setSite(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select Site</option>
              <option value="Site A">Site A</option>
              <option value="Site B">Site B</option>
            </select>
          </div>
        </div>

        {/* Row 2: Date, Voucher, Accounts Selection & Add */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Date
            </label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Vouchar No
            </label>
            <input
              type="text"
              value={voucherNo}
              onChange={(e) => setVoucherNo(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Select Accounts + Modal Trigger Button */}
          <div className="lg:col-span-5">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Select Accounts<span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">
                  {isLoadingAccounts ? "Loading accounts..." : "Select Chart Of Account"}
                </option>
                {accounts.map((account, index) => (
                  <option
                    key={String(account.uuid ?? account.id ?? index)}
                    value={String(account.uuid ?? account.id ?? "")}
                  >
                    {account.name ?? `Account ${index + 1}`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                title="Add New Chart of Account"
                className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition-colors flex-shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Amount & Add Button */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Amount<span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="mt-5 px-4 py-1.5 bg-[#635BFF] hover:bg-indigo-700 text-white text-xs md:text-sm font-semibold rounded-md transition-colors cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>

        {/* Dynamic Items Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead className="bg-[#635BFF] text-white font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-3 py-2.5 w-[15%]">TXN ID</th>
                <th className="px-3 py-2.5 w-[35%]">ACCOUNTS</th>
                <th className="px-3 py-2.5 w-[20%]">AMOUNT</th>
                <th className="px-3 py-2.5 w-[20%]">NOTE</th>
                <th className="px-3 py-2.5 w-[10%] text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-3 py-2.5 text-indigo-600 font-medium">{item.id}</td>
                    <td className="px-3 py-2.5">{item.account}</td>
                    <td className="px-3 py-2.5 font-medium">{item.amount.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-slate-500">{item.note}</td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                    No items added yet. Fill above details and click "Add".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Row 3: Contact, Payment Method & Total Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Contact<span className="text-red-500">*</span>
            </label>
            <select
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select From Contact</option>
              <option value="John Doe">John Doe</option>
              <option value="Rahim Ali">Rahim Ali</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Cash/Bank<span className="text-red-500">*</span>
            </label>
            <select
              value={cashBank}
              onChange={(e) => setCashBank(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select One Option</option>
              <option value="Petty Cash">Petty Cash</option>
              <option value="Main Bank Account">Main Bank Account</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Cheque/Receipt No
            </label>
            <select
              value={chequeNo}
              onChange={(e) => setChequeNo(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select or type cheque number</option>
              <option value="CHK-9988">CHK-9988</option>
              <option value="RCT-1122">RCT-1122</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Total Amount<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              readOnly
              value={totalAmount.toFixed(2)}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
            />
          </div>
        </div>

        {/* Row 4: Comment & File Attachment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Comment
            </label>
            <input
              type="text"
              placeholder="Enter Comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Attachment
            </label>
            <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden bg-slate-50 dark:bg-slate-950">
              <label className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-xs md:text-sm text-slate-700 dark:text-slate-200 cursor-pointer border-r border-slate-300 dark:border-slate-700 hover:bg-slate-300 transition-colors">
                Choose File
                <input
                  type="file"
                  onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              <span className="px-3 text-xs md:text-sm text-slate-400 truncate">
                {attachment ? attachment.name : "No file chosen"}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            {isSubmitting ? "Saving..." : editUuid ? "Update Expense" : "Submit Expense"}
          </button>
        </div>
      </form>

      {/* Chart Of Account Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                Chart Of Account Add
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleModalSubmit} className="p-5 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200/60 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Chart of Group
                    </label>
                    <select
                      value={modalChartGroup}
                      onChange={(e) => setModalChartGroup(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">Select value</option>
                      <option value="Assets">Assets</option>
                      <option value="Liabilities">Liabilities</option>
                      <option value="Expenses">Expenses</option>
                      <option value="Income">Income</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Chart of Accounts Code
                    </label>
                    <input
                      type="text"
                      placeholder="Chart of Accounts Code"
                      value={modalAccountCode}
                      onChange={(e) => setModalAccountCode(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Chart of Accounts Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Chart of Accounts Name"
                      value={modalAccountName}
                      onChange={(e) => setModalAccountName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Set Accounts Default Module
                    </label>
                    <select
                      value={modalDefaultModule}
                      onChange={(e) => setModalDefaultModule(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">Select Status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-400 hover:bg-slate-500 text-white font-medium text-xs md:text-sm rounded-md transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#635BFF] hover:bg-indigo-700 text-white font-medium text-xs md:text-sm rounded-md transition-colors cursor-pointer"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-4 mt-2">
        <div>2026 © Somikoron IT LTD</div>
        <div>Design &amp; Developed by Somikoron IT LTD</div>
      </footer>
    </div>
  );
}