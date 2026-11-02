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
  type LucideIcon,
} from "lucide-react";
import type { Bi } from "@/lib/i18n";

/**
 * ───────────────────────────────────────────────
 *  SIDEBAR MENU DATA  — edit this file freely.
 *  Each group has a title and a list of items.
 *  An item can have `children` for a collapsible sub-menu.
 * ───────────────────────────────────────────────
 */
export type MenuItem = {
  label: Bi;
  href?: string;
  icon: LucideIcon;
  badge?: string;
  children?: { label: Bi; href: string }[];
};

export type MenuGroup = { title: Bi; items: MenuItem[] };

const P = "/dashboard/project";

export const sidebarMenu: MenuGroup[] = [
  {
    title: { bn: "ওভারভিউ", en: "Overview" },
    items: [{ label: { bn: "ড্যাশবোর্ড", en: "Dashboard" }, href: "/dashboard", icon: LayoutDashboard }],
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
    title: { bn: "শেয়ার", en: "Share" },
    items: [
      {
        label: { bn: "শেয়ার প্রজেক্ট", en: "Share Project" },
        icon: PieChart,
        badge: "New",
        children: [
          { label: { bn: "শেয়ার অ্যাসাইন", en: "Assign Share" }, href: `${P}/share-project/assign-share` },
          { label: { bn: "শেয়ার কনফিগারেশন", en: "Share Configuration" }, href: `${P}/share-project/project-share-configuration` },
          { label: { bn: "শেয়ার রিপোর্ট", en: "Share Report" }, href: `${P}/share-project/share-report` },
          { label: { bn: "কালেকশন রিপোর্ট", en: "Collection Report" }, href: `${P}/share-project/share-collection-report` },
          { label: { bn: "পেনাল্টি রিপোর্ট", en: "Penalty Report" }, href: `${P}/share-project/penalty-report` },
          { label: { bn: "হোল্ডার পয়েন্ট", en: "Holders Point" }, href: `${P}/share-project/share-holders-point-report` },
        ],
      },
      {
        label: { bn: "বিনিয়োগ", en: "Investments" },
        icon: Landmark,
        children: [
          { label: { bn: "বিনিয়োগকারী", en: "Investor" }, href: `${P}/investments/investor` },
          { label: { bn: "কনফিগারেশন", en: "Configuration" }, href: `${P}/investments/configuration` },
        ],
      },
    ],
  },
  {
    title: { bn: "প্রজেক্ট", en: "Projects" },
    items: [
      {
        label: { bn: "প্রজেক্ট", en: "Projects" },
        icon: Building2,
        children: [
          { label: { bn: "প্রজেক্ট তালিকা", en: "Project List" }, href: `${P}/projects/project` },
          { label: { bn: "প্রজেক্ট টাইপ", en: "Project Type" }, href: `${P}/projects/project-type` },
          { label: { bn: "টাস্ক", en: "Tasks" }, href: `${P}/projects/project-task` },
          { label: { bn: "মাইলস্টোন", en: "Milestones" }, href: `${P}/projects/project-milestone` },
          { label: { bn: "বাজেট", en: "Budget" }, href: `${P}/projects/project-budget` },
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
        ],
      },
    ],
  },
  {
    title: { bn: "অর্থ ও চুক্তি", en: "Finance & Contract" },
    items: [
      {
        label: { bn: "বিলিং", en: "Billing" },
        icon: ReceiptText,
        children: [
          { label: { bn: "কোটেশন", en: "Quote" }, href: `${P}/billing/quote` },
          { label: { bn: "ওয়ার্ক অর্ডার", en: "Work Order" }, href: `${P}/billing/work-order` },
          { label: { bn: "বিল ইনভয়েস", en: "Bill Invoice" }, href: `${P}/billing/bill-invoice` },
          { label: { bn: "পিরিয়ড বিলিং", en: "Period Billing" }, href: `${P}/billing/period-billing` },
        ],
      },
      {
        label: { bn: "রিকুইজিশন", en: "Requisition" },
        icon: HandCoins,
        children: [
          { label: { bn: "ম্যাটেরিয়াল", en: "Material" }, href: `${P}/requisition/material-requisition` },
          { label: { bn: "ফান্ড", en: "Fund" }, href: `${P}/requisition/fund-requisition` },
          { label: { bn: "সার্ভিস ওয়ার্ক", en: "Service Work" }, href: `${P}/requisition/service-work-requisition` },
        ],
      },
      {
        label: { bn: "চুক্তি", en: "Contract" },
        icon: ScrollText,
        children: [
          { label: { bn: "ঠিকাদার", en: "Contractor" }, href: `${P}/contract/contractor` },
          { label: { bn: "কাস্টমার অ্যাকাউন্ট", en: "Customer Accounts" }, href: `${P}/contract/customer-accounts` },
          { label: { bn: "সাপ্লায়ার অ্যাকাউন্ট", en: "Supplier Accounts" }, href: `${P}/contract/supplier-accounts` },
        ],
      },
    ],
  },
  {
    title: { bn: "অন্যান্য", en: "Other" },
    items: [
      { label: { bn: "ডকুমেন্ট", en: "Documents" }, href: `${P}/document`, icon: FileText },
      { label: { bn: "পেমেন্ট", en: "Payments" }, href: "/dashboard/payments", icon: Banknote },
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
