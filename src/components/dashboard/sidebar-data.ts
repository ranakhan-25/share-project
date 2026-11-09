import {
  Banknote,
  Building2,
  FileText,
  HandCoins,
  Home,
  Landmark,
  LayoutDashboard,
  PieChart,
  ReceiptText,
  ScrollText,
  WalletCards,
  UserRound,
  FolderKanban,
  Calculator,
  Users,
  PhoneCall,
  CalendarCheck,
  TrendingUp,
  FileSpreadsheet,
  Settings,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import type { Bi } from "@/lib/i18n";

export type MenuItem = {
  label: Bi;
  href?: string;
  icon: LucideIcon;
  badge?: string;
  children?: { label: Bi; href: string }[];
};

export type MenuGroup = { title: Bi; items: MenuItem[] };

const P = "/dashboard/project";
const A = "/dashboard/accounts";
const C = "/dashboard/crm";

export const sidebarMenu: MenuGroup[] = [
  {
    title: { bn: "ওভারভিউ", en: "Overview" },
    items: [{ label: { bn: "ড্যাশবোর্ড", en: "Dashboard" }, href: "/dashboard", icon: LayoutDashboard }],
  },

  /* ----------------------------------------------------
   * ACCOUNTS MODULE
   * ---------------------------------------------------- */
  {
    title: { bn: "অ্যাকাউন্টস", en: "Accounts" },
    items: [
      {
        label: { bn: "অ্যাকাউন্টস ড্যাশবোর্ড", en: "Accounts Dashboard" },
        href: A,
        icon: Calculator,
      },
      {
        label: { bn: "ভাউচার", en: "Vouchers" },
        icon: ReceiptText,
        children: [
          { label: { bn: "এক্সপেন্স ভাউচার", en: "Expense Voucher" }, href: `${A}/voucher/expense` },
          { label: { bn: "রিসিপ্ট ভাউচার", en: "Receipt Voucher" }, href: `${A}/voucher/receipt-voucher` },
          { label: { bn: "পেমেন্ট ভাউচার", en: "Payment Voucher" }, href: `${A}/voucher/payment-voucher` },
          { label: { bn: "জার্নাল ভাউচার", en: "Journal Voucher" }, href: `${A}/voucher/journal-voucher` },
          { label: { bn: "কন্ট্রা ভাউচার", en: "Contra Voucher" }, href: `${A}/voucher/contra-voucher` },
        ],
      },
      {
        label: { bn: "ব্যাংক রিকনসিলিয়েশন", en: "Bank Reconciliation" },
        icon: Landmark,
        children: [
          { label: { bn: "রিকনসিলিয়েশন স্টেটমেন্ট", en: "Reconciliation Statement" }, href: `${A}/bank-reconciliation/bank-reconciliation-statement` },
          { label: { bn: "চেক তালিকা", en: "List of Cheques" }, href: `${A}/bank-reconciliation/list-of-cheque` },
          { label: { bn: "চেক রেঞ্জ তালিকা", en: "Cheque Range List" }, href: `${A}/bank-reconciliation/list-of-cheque-range` },
        ],
      },
      {
        label: { bn: "অ্যাকাউন্টস রিপোর্ট", en: "Accounts Reports" },
        icon: FileSpreadsheet,
        children: [
          { label: { bn: "জেনারেল লেজার", en: "General Ledger" }, href: `${A}/reports/general-ledger` },
          { label: { bn: "ব্যালেন্স শিট", en: "Balance Sheet Summary" }, href: `${A}/reports/balance_sheet_summary` },
          { label: { bn: "ইনকাম স্টেটমেন্ট", en: "Income Statement" }, href: `${A}/reports/income_statement` },
          { label: { bn: "ট্রায়াল ব্যালেন্স", en: "Trial Balance Summary" }, href: `${A}/reports/trial_balance_summary` },
          { label: { bn: "ক্যাশ ও ব্যাংক বুক", en: "Cash & Bank Books" }, href: `${A}/reports/cash-bank-books` },
          { label: { bn: "ক্যাশ ফ্লো স্টেটমেন্ট", en: "Cash Flow Statement" }, href: `${A}/reports/cash-flow-statement` },
          { label: { bn: "ডে বুক", en: "Day Book" }, href: `${A}/reports/day-book` },
          { label: { bn: "পেয়েবল রিপোর্ট", en: "Payable Report" }, href: `${A}/reports/payable-report` },
          { label: { bn: "রিসিভেবল রিপোর্ট", en: "Receivable Report" }, href: `${A}/reports/receivable-report` },
          { label: { bn: "রিসিপ্ট রিপোর্ট", en: "Receipt Report" }, href: `${A}/reports/receipt-report` },
          { label: { bn: "এক্সপেন্স রিপোর্ট", en: "Expense Report" }, href: `${A}/reports/expense-report` },
          { label: { bn: "বাজেট বনাম খরচ", en: "Budget vs Actual Expenses" }, href: `${A}/reports/budget-vs-actual-expenses-vs-collection-report` },
        ],
      },
      {
        label: { bn: "চুক্তি ও পার্টি", en: "Contract & Parties" },
        icon: ScrollText,
        children: [
          { label: { bn: "কাস্টমার অ্যাকাউন্ট", en: "Customer Account" }, href: `${A}/contract/customer-account` },
          { label: { bn: "সাপ্লায়ার অ্যাকাউন্ট", en: "Supplier Account" }, href: `${A}/contract/supplier-account` },
          { label: { bn: "লেবার কন্ট্রাক্টর", en: "Labour Contractor" }, href: `${A}/contract/labour-worker-contractor` },
        ],
      },
      {
        label: { bn: "বিলিং ও ইনভয়েস", en: "Billing & Invoices" },
        icon: Banknote,
        children: [
          { label: { bn: "বিল ইনভয়েস", en: "Bill Invoice" }, href: `${A}/billing/bill-invoice` },
          { label: { bn: "কন্ট্রাক্টর বিল", en: "Contractor Bill" }, href: `${A}/billing/contractor-bill` },
          { label: { bn: "ওয়ার্ক অর্ডার", en: "Work Order" }, href: `${A}/billing/work-order` },
          { label: { bn: "কন্ট্রাক্টর ওয়ার্ক অর্ডার", en: "Contractor Work Order" }, href: `${A}/billing/contractor-work-order` },
          { label: { bn: "পিরিয়ড বিলিং", en: "Period Billing" }, href: `${A}/billing/period-billing` },
          { label: { bn: "অ্যাডজাস্টমেন্ট বিলিং", en: "Adjustment Billing" }, href: `${A}/billing/adjustment-billing` },
          { label: { bn: "কোটেশন", en: "Quote" }, href: `${A}/billing/quote` },
        ],
      },
      {
        label: { bn: "কনফিগারেশন", en: "Configuration" },
        icon: Settings,
        children: [
          { label: { bn: "চার্ট অফ অ্যাকাউন্টস", en: "Chart of Accounts" }, href: `${A}/configuration/chart-of-accounts` },
          { label: { bn: "চার্ট অফ গ্রুপ", en: "Chart of Group" }, href: `${A}/configuration/chart-of-group` },
        ],
      },
      {
        label: { bn: "অ্যাসেট", en: "Assets" },
        icon: Briefcase,
        children: [
          { label: { bn: "অ্যাসেট তালিকা", en: "Asset List" }, href: `${A}/assets/asset-list` },
          { label: { bn: "আইটেম তালিকা", en: "Item Empty" }, href: `${A}/assets/item-empty` },
        ],
      },
      {
        label: { bn: "এইচআর ও কর্মচারী", en: "HR & Employee" },
        icon: Users,
        children: [
          { label: { bn: "কর্মচারী তালিকা", en: "Employee List" }, href: `${A}/employee/employee-list` },
          { label: { bn: "ডিপার্টমেন্ট", en: "Department" }, href: `${A}/employee/department` },
          { label: { bn: "ডেজিগনেশন", en: "Designation" }, href: `${A}/employee/designation` },
          { label: { bn: "হায়ারার্কি", en: "Employee Hierarchy" }, href: `${A}/employee/employee-hierarchy` },
          { label: { bn: "সেকশন", en: "Section" }, href: `${A}/employee/section` },
          { label: { bn: "শিফট", en: "Shift" }, href: `${A}/employee/shift` },
          { label: { bn: "ইউনিট", en: "Unit" }, href: `${A}/employee/unit` },
        ],
      },
    ],
  },

  /* ----------------------------------------------------
   * PROJECT MODULE
   * ---------------------------------------------------- */
  {
    title: { bn: "প্রজেক্ট", en: "Project" },
    items: [
      {
        label: { bn: "প্রজেক্ট কোর", en: "Project Core" },
        icon: Building2,
        children: [
          { label: { bn: "প্রজেক্ট তালিকা", en: "Project List" }, href: `${P}/projects/project` },
          { label: { bn: "প্রজেক্ট টাইপ", en: "Project Type" }, href: `${P}/projects/project-type` },
          { label: { bn: "সাইট", en: "Site" }, href: `${P}/projects/site` },
          { label: { bn: "বিল্ডিং", en: "Building" }, href: `${P}/projects/building` },
          { label: { bn: "ফ্লোর", en: "Floor" }, href: `${P}/projects/floor` },
          { label: { bn: "ইউনিট / প্লট", en: "Unit / Plot" }, href: `${P}/projects/unit-plot` },
          { label: { bn: "টাস্ক", en: "Tasks" }, href: `${P}/projects/project-task` },
          { label: { bn: "মাইলস্টোন", en: "Milestones" }, href: `${P}/projects/project-milestone` },
          { label: { bn: "বাজেট", en: "Budget" }, href: `${P}/projects/project-budget` },
          { label: { bn: "খরচ (Cost)", en: "Cost" }, href: `${P}/projects/project-cost` },
          { label: { bn: "এগ্রিমেন্ট", en: "Agreement" }, href: `${P}/projects/project-agreement` },
          { label: { bn: "অগ্রগতি", en: "Progress" }, href: `${P}/projects/project-progress` },
          { label: { bn: "কন্ট্রোল", en: "Control" }, href: `${P}/projects/project-control` },
        ],
      },
      {
        label: { bn: "ফ্ল্যাট ও ল্যান্ড", en: "Flat & Land" },
        icon: Home,
        children: [
          { label: { bn: "ফ্ল্যাট", en: "Flat" }, href: `${P}/flat-land/flat` },
          { label: { bn: "বুকিং", en: "Booking" }, href: `${P}/flat-land/booking` },
          { label: { bn: "সেল অফার", en: "Sale Offer" }, href: `${P}/flat-land/sale-offer` },
          { label: { bn: "বিক্রয়", en: "Sale" }, href: `${P}/flat-land/flat-land-sale` },
          { label: { bn: "বিক্রয় রিপোর্ট", en: "Sale Report" }, href: `${P}/flat-land/flat-land-sale-report` },
          { label: { bn: "কালেকশন রিপোর্ট", en: "Collection Report" }, href: `${P}/flat-land/sale-collection-report` },
          { label: { bn: "রোড", en: "Road" }, href: `${P}/flat-land/land/road` },
          { label: { bn: "ব্লক", en: "Block" }, href: `${P}/flat-land/land/block` },
          { label: { bn: "ল্যান্ড বিবরণ", en: "Land Details" }, href: `${P}/flat-land/land/land-details` },
        ],
      },
      {
        label: { bn: "রিকুইজিশন", en: "Requisition" },
        icon: HandCoins,
        children: [
          { label: { bn: "ম্যাটেরিয়াল", en: "Material Requisition" }, href: `${P}/requisition/material-requisition` },
          { label: { bn: "সার্ভিস ওয়ার্ক", en: "Service Work Requisition" }, href: `${P}/requisition/service-work-requisition` },
          { label: { bn: "ফান্ড", en: "Fund Requisition" }, href: `${P}/requisition/fund-requisition` },
          { label: { bn: "ফান্ড রিপোর্ট", en: "Fund Requisition Report" }, href: `${P}/requisition/fund-requisition-report` },
        ],
      },
      {
        label: { bn: "বিলিং ও চুক্তি", en: "Billing & Contract" },
        icon: ReceiptText,
        children: [
          { label: { bn: "বিল ইনভয়েস", en: "Bill Invoice" }, href: `${P}/billing/bill-invoice` },
          { label: { bn: "কন্ট্রাক্টর বিল", en: "Contractor Bill" }, href: `${P}/billing/contractor-bill` },
          { label: { bn: "ওয়ার্ক অর্ডার", en: "Work Order" }, href: `${P}/billing/work-order` },
          { label: { bn: "কোটেশন", en: "Quote" }, href: `${P}/billing/quote` },
          { label: { bn: "ঠিকাদার", en: "Contractor" }, href: `${P}/contract/contractor` },
          { label: { bn: "কাস্টমার অ্যাকাউন্ট", en: "Customer Accounts" }, href: `${P}/contract/customer-accounts` },
          { label: { bn: "সাপ্লায়ার অ্যাকাউন্ট", en: "Supplier Accounts" }, href: `${P}/contract/supplier-accounts` },
        ],
      },
      {
        label: { bn: "প্রজেক্ট রিপোর্ট", en: "Project Reports" },
        icon: FileSpreadsheet,
        children: [
          { label: { bn: "প্রজেক্ট সারাংশ", en: "Project Summary" }, href: `${P}/projects/report/project-summary-report` },
          { label: { bn: "এক নজরে সারাংশ", en: "At a Glance Summary" }, href: `${P}/projects/report/at_a_glance_project_summary_report` },
          { label: { bn: "আর্থিক রিপোর্ট", en: "Financial Report" }, href: `${P}/projects/report/project-financial-report` },
          { label: { bn: "অগ্রগতি রিপোর্ট", en: "Progress Report" }, href: `${P}/projects/report/project-progress-report` },
          { label: { bn: "প্রজেক্ট ইনকাম স্টেটমেন্ট", en: "Project Wise Income Statement" }, href: `${P}/projects/report/project-wise-income-statement` },
          { label: { bn: "সাইট ইনকাম স্টেটমেন্ট", en: "Site Wise Income Statement" }, href: `${P}/projects/report/site-wise-income-statement` },
        ],
      },
      {
        label: { bn: "শেয়ার প্রজেক্ট", en: "Share Project" },
        icon: PieChart,
        children: [
          { label: { bn: "শেয়ার অ্যাসাইন", en: "Assign Share" }, href: `${P}/share-project/assign-share` },
          { label: { bn: "শেয়ার কনফিগারেশন", en: "Share Configuration" }, href: `${P}/share-project/project-share-configuration` },
          { label: { bn: "শেয়ার রিপোর্ট", en: "Share Report" }, href: `${P}/share-project/share-report` },
          { label: { bn: "কালেকশন রিপোর্ট", en: "Collection Report" }, href: `${P}/share-project/share-collection-report` },
          { label: { bn: "পেনাল্টি রিপোর্ট", en: "Penalty Report" }, href: `${P}/share-project/penalty-report` },
          { label: { bn: "হোল্ডার পয়েন্ট", en: "Holders Point" }, href: `${P}/share-project/share-holders-point-report` },
        ],
      },
    ],
  },

  /* ----------------------------------------------------
   * CRM MODULE
   * ---------------------------------------------------- */
  {
    title: { bn: "সিআরএম", en: "CRM" },
    items: [
      {
        label: { bn: "সিআরএম ড্যাশবোর্ড", en: "CRM Dashboard" },
        href: `${C}/dashboard`,
        icon: LayoutDashboard,
      },
      {
        label: { bn: "লিডস ম্যানেজমেন্ট", en: "Leads Management" },
        icon: Users,
        children: [
          { label: { bn: "লিড তালিকা", en: "Lead List" }, href: `${C}/lead/lead-list` },
          { label: { bn: "পাইপলাইন", en: "Pipeline" }, href: `${C}/lead/pipeline` },
          { label: { bn: "পার্টিস", en: "Parties" }, href: `${C}/lead/parties` },
          { label: { bn: "জাঙ্ক লিড", en: "Junk Leads" }, href: `${C}/lead/junk-lead` },
          { label: { bn: "ট্রান্সফার ইতিহাস", en: "Transfer History" }, href: `${C}/lead/transfer-history` },
        ],
      },
      {
        label: { bn: "কল সেন্টার", en: "Call Center" },
        icon: PhoneCall,
        children: [
          { label: { bn: "ফলো-আপ", en: "Follow-up" }, href: `${C}/call-center/follow-up` },
          { label: { bn: "ফলো-আপ তালিকা", en: "Followups List" }, href: `${C}/call-center/followups` },
          { label: { bn: "কল রিপোর্ট", en: "Call Report" }, href: `${C}/call-center/call-report` },
          { label: { bn: "কল রিপোর্ট বিবরণ", en: "Call Report Details" }, href: `${C}/call-center/call-report-details` },
          { label: { bn: "কল অ্যাসাইন ইতিহাস", en: "Call Assign History" }, href: `${C}/call-center/call-assign-history` },
        ],
      },
      {
        label: { bn: "টাস্ক ও ভিজিট", en: "Task & Visits" },
        icon: CalendarCheck,
        children: [
          { label: { bn: "ভিজিট তালিকা", en: "Visits" }, href: `${C}/task-visit/visits` },
          { label: { bn: "টাস্ক ও ভিজিট লিস্ট", en: "Task & Visit List" }, href: `${C}/task-visit/task-visit-list` },
          { label: { bn: "ডিল নেগোসিয়েশন", en: "Deal Negotiation" }, href: `${C}/task-visit/deal-negotiation-activity` },
          { label: { bn: "ভিজিট সারাংশ রিপোর্ট", en: "Task Visit Summary" }, href: `${C}/task-visit/task-visit-summary-report` },
          { label: { bn: "ভিজিট বিবরণ রিপোর্ট", en: "Task Visit Details" }, href: `${C}/task-visit/task-visit-details-report` },
        ],
      },
      {
        label: { bn: "প্রোপার্টি ও অফার", en: "Property & Offers" },
        icon: Home,
        children: [
          { label: { bn: "ফ্ল্যাট", en: "Flat" }, href: `${C}/property/flat` },
          { label: { bn: "ল্যান্ড", en: "Land" }, href: `${C}/property/land` },
          { label: { bn: "বুকিং", en: "Booking" }, href: `${C}/property/booking` },
          { label: { bn: "সেল অফার", en: "Sale Offer" }, href: `${C}/property/sale-offer` },
          { label: { bn: "অফারসমূহ", en: "Offers" }, href: `${C}/property/offers` },
          { label: { bn: "কোটেশন", en: "Quotations" }, href: `${C}/property/quotations` },
        ],
      },
      {
        label: { bn: "কেপিআই ও পারফরম্যান্স", en: "KPI & Performance" },
        icon: TrendingUp,
        children: [
          { label: { bn: "কেপিআই সেটিংস", en: "Employee KPI Settings" }, href: `${C}/kpi/employee-kpi-setting` },
          { label: { bn: "এমপ্লয়ি কল রিপোর্ট", en: "Employee Call Report" }, href: `${C}/kpi/reports/employee-call-report` },
          { label: { bn: "টিম কল রিপোর্ট", en: "Team Call Report" }, href: `${C}/kpi/reports/team-call-report` },
        ],
      },
      {
        label: { bn: "সিআরএম কনফিগারেশন", en: "CRM Configuration" },
        icon: Settings,
        children: [
          { label: { bn: "লিড স্টেজ", en: "Lead Stage" }, href: `${C}/configuration/lead-stage` },
          { label: { bn: "লিড সোর্স", en: "Lead Source" }, href: `${C}/configuration/lead-source` },
          { label: { bn: "লিড ক্যাটাগরি", en: "Lead Category" }, href: `${C}/configuration/lead-category` },
          { label: { bn: "ক্যাম্পেইন", en: "Campaign" }, href: `${C}/configuration/campaign` },
          { label: { bn: "টিমস", en: "Teams" }, href: `${C}/configuration/teams` },
          { label: { bn: "কমিউনিকেশন স্ট্যাটাস", en: "Communication Status" }, href: `${C}/configuration/communication-status` },
          { label: { bn: "টাস্ক টাইপ", en: "Task Type" }, href: `${C}/configuration/task-type` },
          { label: { bn: "এরিয়া", en: "Area" }, href: `${C}/configuration/area` },
          { label: { bn: "অফারসমূহ", en: "Offers" }, href: `${C}/configuration/offers` },
        ],
      },
      {
        label: { bn: "সিআরএম রিপোর্টস", en: "CRM Reports" },
        icon: FileSpreadsheet,
        children: [
          { label: { bn: "পাইপলাইন ফানেল রিপোর্ট", en: "Pipeline Funnel Report" }, href: `${C}/reports/sales-pipeline-funnel-report` },
          { label: { bn: "কল লগ রিপোর্ট", en: "Call Log Report" }, href: `${C}/reports/call-log-report` },
          { label: { bn: "ইউজার ভিত্তিক রিপোর্ট", en: "User Wise Report" }, href: `${C}/reports/user-wise-report` },
          { label: { bn: "টিম রিপোর্ট", en: "Team Reports" }, href: `${C}/reports/team-reports` },
          { label: { bn: "সেলস প্রবাবিলিটি", en: "Sales Probability" }, href: `${C}/reports/sales-probability` },
          { label: { bn: "ফ্ল্যাট ল্যান্ড সেল রিপোর্ট", en: "Flat Land Sale Report" }, href: `${C}/reports/flat-land-sale-report` },
          { label: { bn: "ডিল নেগোসিয়েশন রিপোর্ট", en: "Deal Negotiation Reports" }, href: `${C}/reports/deal-negotiation-reports` },
        ],
      },
    ],
  },

  /* ----------------------------------------------------
   * INVESTMENT & INVESTOR PORTAL
   * ---------------------------------------------------- */
  {
    title: { bn: "ইনভেস্টমেন্ট", en: "Investment" },
    items: [{
      label: { bn: "ইনভেস্টমেন্ট সেন্টার", en: "Investment center" },
      icon: Landmark,
      children: [
        { label: { bn: "প্রজেক্টে বিনিয়োগ", en: "Invest in projects" }, href: "/projects" },
        { label: { bn: "আমার বিনিয়োগ", en: "My investments" }, href: "/dashboard/investments" },
        { label: { bn: "আমার শেয়ার", en: "My shares" }, href: "/dashboard/shares" },
        { label: { bn: "লাভ ও ডিভিডেন্ড", en: "Profit & dividend" }, href: "/dashboard/profits" },
        { label: { bn: "পেমেন্ট ইতিহাস", en: "Payment history" }, href: "/dashboard/payments" },
        { label: { bn: "স্টেটমেন্ট ও রিপোর্ট", en: "Statements & reports" }, href: "/dashboard/reports" },
      ],
    }],
  },
  {
    title: { bn: "ইনভেস্টর", en: "Investor" },
    items: [
      {
        label: { bn: "আমার অ্যাকাউন্ট", en: "My Account" },
        icon: UserRound,
        children: [
          { label: { bn: "প্রোফাইল", en: "Profile" }, href: "/dashboard/profile" },
          { label: { bn: "KYC যাচাই", en: "KYC Verification" }, href: "/dashboard/kyc" },
        ],
      },
      {
        label: { bn: "বিনিয়োগ", en: "Investments" },
        icon: Landmark,
        children: [
          { label: { bn: "আমার বিনিয়োগ", en: "My Investments" }, href: "/dashboard/investments" },
          { label: { bn: "শেয়ারসমূহ", en: "My Shares" }, href: "/dashboard/shares" },
          { label: { bn: "লাভ ও ডিভিডেন্ড", en: "Profit & Dividend" }, href: "/dashboard/profits" },
        ],
      },
      {
        label: { bn: "পেমেন্ট ও রিপোর্ট", en: "Payments & Reports" },
        icon: WalletCards,
        children: [
          { label: { bn: "পেমেন্ট ইতিহাস", en: "Payment History" }, href: "/dashboard/payments" },
          { label: { bn: "স্টেটমেন্ট ও রিপোর্ট", en: "Statements & Reports" }, href: "/dashboard/reports" },
          { label: { bn: "নোটিফিকেশন", en: "Notifications" }, href: "/dashboard/notifications" },
        ],
      },
    ],
  },
  {
    title: { bn: "প্রজেক্ট মালিক", en: "Project Owner" },
    items: [
      {
        label: { bn: "প্রজেক্ট মালিক পোর্টাল", en: "Owner Portal" },
        icon: FolderKanban,
        children: [
          { label: { bn: "ওনার ড্যাশবোর্ড", en: "Owner Dashboard" }, href: "/dashboard/owner" },
          { label: { bn: "আমার প্রজেক্ট", en: "My Projects" }, href: "/dashboard/owner/projects" },
          { label: { bn: "নতুন প্রজেক্ট", en: "Create Project" }, href: "/dashboard/owner/projects/create" },
          { label: { bn: "ড্রাফট প্রজেক্ট", en: "Draft Projects" }, href: "/dashboard/owner/status/draft" },
          { label: { bn: "পেন্ডিং প্রজেক্ট", en: "Pending Projects" }, href: "/dashboard/owner/status/pending" },
          { label: { bn: "অ্যাপ্রুভড প্রজেক্ট", en: "Approved Projects" }, href: "/dashboard/owner/status/approved" },
          { label: { bn: "বর্জিত প্রজেক্ট", en: "Rejected Projects" }, href: "/dashboard/owner/status/rejected" },
          { label: { bn: "পাবলিশড প্রজেক্ট", en: "Published Projects" }, href: "/dashboard/owner/status/published" },
          { label: { bn: "সাবমিশন ইতিহাস", en: "Submission History" }, href: "/dashboard/owner/submission-history" },
          { label: { bn: "প্রোফাইল সেটিংস", en: "Profile Settings" }, href: "/dashboard/owner/profile" },
        ],
      },
    ],
  },
];

/** Flatten all links so the topbar can show the current page title. */
export function findTitle(pathname: string): Bi | null {
  for (const g of sidebarMenu)
    for (const it of g.items) {
      if (it.href === pathname) return it.label;
      const child = it.children?.find((c) => c.href === pathname);
      if (child) return child.label;
    }
  return null;
}
