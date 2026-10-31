"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Eye } from "lucide-react";

interface Tab {
  label: string;
  href: string;
}

const rifatBasePath = "/dashboard/project/dashboard/rifat";

const tabs: Tab[] = [
  { label: "Dashboard", href: rifatBasePath },
  { label: "BOQ", href: `${rifatBasePath}/boq` },
  { label: "Task", href: `${rifatBasePath}/task` },
  { label: "Users", href: `${rifatBasePath}/users` },
  { label: "Details", href: `${rifatBasePath}/details` },
  { label: "Flat/Land", href: `${rifatBasePath}/flat-land` },
  { label: "BOQ Comparison", href: `${rifatBasePath}/boq-comparison` },
  { label: "Quotation", href: `${rifatBasePath}/quotation` },
];

export default function RifatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // ===================== DYNAMIC TIMER =====================
  // Target date set করো (যে তারিখ পর্যন্ত countdown চলবে)
  // এখানে উদাহরণ হিসেবে ১ বছর পরের তারিখ দেওয়া হলো
  const TARGET_DATE = new Date("2027-10-08T00:00:00").getTime();

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = TARGET_DATE - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor(
        (difference % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer(); // immediate call
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  // ========================================================

  const isActive = (href: string) => {
    if (href === rifatBasePath) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-900">
      {/* Top Header Bar */}
      <div className="relative flex h-[57px] items-center justify-center border-b border-slate-200 bg-white">
        {/* Dynamic Timer */}
        <div className="absolute left-5 top-[13px] flex items-center gap-1 rounded-full border border-amber-200 bg-[#fffdf5] px-4 py-1.5 text-[11px] font-semibold shadow-sm">
          <span className="text-red-600">{timeLeft.days}</span>
          <span>Day :</span>
          <span>{String(timeLeft.hours).padStart(2, "0")}</span>
          <span>Hour :</span>
          <span>{String(timeLeft.minutes).padStart(2, "0")}</span>
          <span>Min :</span>
          <span>{String(timeLeft.seconds).padStart(2, "0")}</span>
          <span>Sec</span>
        </div>

        {/* Project Name */}
        <h1 className="text-[19px] font-semibold">Rifat Eyecon City</h1>

        {/* Right Buttons */}
        <div className="absolute right-5 flex items-center gap-3">
          <Link
            href={`${rifatBasePath}/overview`}
            className="flex h-[34px] w-[40px] items-center justify-center rounded-lg bg-cyan-400 text-white shadow-sm hover:bg-cyan-500 transition-colors"
            title="View Overview Report"
          >
            <Eye size={18} />
          </Link>

          <button className="h-[34px] rounded-lg border border-slate-200 bg-white px-4 text-[12px] font-semibold shadow-sm hover:bg-slate-50 transition-colors">
            Overall Report
          </button>
        </div>
      </div>

      {/* Project Tabs */}
      <nav className="flex h-[44px] items-end border-b border-slate-200 px-5 bg-white overflow-x-auto">
        {tabs.map((tab) => {
          const active = isActive(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                flex h-full items-center border-b-2 px-4 whitespace-nowrap
                text-[13px] font-medium transition
                ${
                  active
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-800 hover:border-slate-300 hover:text-blue-600"
                }
              `}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Current Page Content */}
      <div className="min-h-[calc(100vh-165px)]">{children}</div>
    </div>
  );
}