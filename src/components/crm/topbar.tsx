"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  UserCog,
  CircleUserRound,
  Settings as SettingsIcon,
  Building2,
  CalendarRange,
  Coins,
  CreditCard,
  Layers,
  Keyboard,
  ShieldCheck,
  FileText,
  FileBarChart2,
  MessageSquare,
  Mail,
  Activity,
  SlidersHorizontal,
  Puzzle,
  BellRing,
  ScrollText,
} from "lucide-react";
import { FaFacebook } from "react-icons/fa";
import clsx from "clsx";
import { useTheme } from "@/lib/theme-provider";

type MenuId = "settings" | "notifications" | "profile" | null;

const SETTINGS_ITEMS = [
  { label: "Company", href: "/crm-module/settings/company", icon: Building2 },
  { label: "Financial Year", href: "/crm-module/settings/financial-year", icon: CalendarRange },
  { label: "Currency", href: "/crm-module/settings/currency", icon: Coins },
  { label: "Installment Plan", href: "/crm-module/settings/installment-plan", icon: CreditCard },
  { label: "Approval Layer", href: "/crm-module/settings/approval-layer", icon: Layers },
  { label: "Keyboard Shortcut", href: "/crm-module/settings/keyboard-shortcut", icon: Keyboard },
  { label: "User Management", href: "/crm-module/settings/user-management", icon: UserCog },
  { label: "User Role", href: "/crm-module/settings/user-role", icon: ShieldCheck },
  { label: "Invoice Setting", href: "/crm-module/settings/invoice", icon: FileText },
  { label: "Report Setting", href: "/crm-module/settings/report", icon: FileBarChart2 },
  { label: "SMS Setting", href: "/crm-module/settings/sms", icon: MessageSquare },
  { label: "Email Setting", href: "/crm-module/settings/email", icon: Mail },
  { label: "User Activity", href: "/crm-module/settings/user-activity", icon: Activity },
  {
    label: "Company Setting",
    href: "/crm-module/settings/company-setting",
    icon: SlidersHorizontal,
  },
  { label: "Facebook Api Setting", href: "/crm-module/settings/facebook-api", icon: FaFacebook },
  { label: "Add-ons", href: "/crm-module/settings/add-ons", icon: Puzzle },
  {
    label: "Bulk Push Notification",
    href: "/crm-module/settings/bulk-push-notification",
    icon: BellRing,
  },
  { label: "Cheque Template", href: "/crm-module/settings/cheque-template", icon: ScrollText },
] as const;

export function Topbar() {
  const { theme, toggleTheme } = useTheme();
  const [openMenu, setOpenMenu] = useState<MenuId>(null);

  const settingsRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      const refs = [settingsRef, notificationsRef, profileRef];
      const clickedInside = refs.some((ref) => ref.current?.contains(target));
      if (!clickedInside) setOpenMenu(null);
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMenu(null);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openMenu]);

  const toggleMenu = (menu: MenuId) => setOpenMenu((prev) => (prev === menu ? null : menu));

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-4 border-b border-border bg-surface/90 backdrop-blur px-4 md:px-6">
      <div className="relative flex-1 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          type="text"
          placeholder="Search modules..."
          className="w-full rounded-md border border-border bg-canvas pl-9 pr-3 py-2 text-[13px] text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-soft"
        />
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="h-9 w-9 flex items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* Settings */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => toggleMenu("settings")}
            aria-label="Settings"
            className={clsx(
              "h-9 w-9 flex items-center justify-center rounded-md transition-colors",
              openMenu === "settings"
                ? "text-accent-strong bg-accent-soft"
                : "text-ink-muted hover:text-ink hover:bg-canvas",
            )}
          >
            <SettingsIcon size={16} />
          </button>

          {openMenu === "settings" && (
            <div className="absolute right-0 mt-2 w-72 rounded-lg border border-border bg-surface shadow-lg shadow-black/5 z-20 overflow-hidden animate-[dropdown-in_0.15s_ease-out]">
              <div className="px-3.5 py-3 border-b border-border">
                <p className="text-[13px] font-medium text-ink">Settings</p>
              </div>
              <nav className="py-1 max-h-100 overflow-y-auto">
                {SETTINGS_ITEMS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpenMenu(null)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
                  >
                    <item.icon size={15} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => toggleMenu("notifications")}
            aria-label="Notifications"
            className={clsx(
              "relative h-9 w-9 flex items-center justify-center rounded-md transition-colors",
              openMenu === "notifications"
                ? "text-accent-strong bg-accent-soft"
                : "text-ink-muted hover:text-ink hover:bg-canvas",
            )}
          >
            <Bell size={16} />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-danger" />
          </button>

          {openMenu === "notifications" && (
            <div className="absolute right-0 mt-2 w-72 rounded-lg border border-border bg-surface shadow-lg shadow-black/5 z-20 overflow-hidden animate-[dropdown-in_0.15s_ease-out]">
              <div className="px-3.5 py-3 border-b border-border">
                <p className="text-[13px] font-medium text-ink">Notifications</p>
              </div>
              <div className="px-3.5 py-8 text-center text-[12.5px] text-ink-faint">
                No new notifications
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => toggleMenu("profile")}
            className="h-9 w-9 rounded-full bg-accent-soft flex items-center justify-center text-accent-strong hover:opacity-90 transition-opacity"
          >
            <CircleUserRound size={19} />
          </button>

          {openMenu === "profile" && (
            <div className="absolute right-0 mt-2 w-52 rounded-lg border border-border bg-surface shadow-lg shadow-black/5 z-20 overflow-hidden animate-[dropdown-in_0.15s_ease-out]">
              <div className="px-3.5 py-3 border-b border-border">
                <p className="text-[13px] font-medium text-ink">Admin</p>
                <p className="text-[12px] text-ink-faint">RealBiz Pro Ltd</p>
              </div>
              <nav className="py-1">
                {[
                  { icon: CircleUserRound, label: "My Profile" },
                  { icon: UserCog, label: "User Management" },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
                  >
                    <item.icon size={15} />
                    {item.label}
                  </button>
                ))}
                <button className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-danger hover:bg-danger-soft transition-colors">
                  <LogOut size={15} />
                  Log Out
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
