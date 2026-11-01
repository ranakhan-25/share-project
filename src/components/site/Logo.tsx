"use client";

import Link from "next/link";
import { useId } from "react";

export function LogoMark({ size = 40 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`lg-${id}`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill={`url(#lg-${id})`} />
      <path d="M19 10.5a10.5 10.5 0 1 0 10.5 10.5H19V10.5z" fill="#fff" fillOpacity=".96" />
      <path d="M22 7.6A10.5 10.5 0 0 1 32.4 18H22V7.6z" fill="#fde68a" />
    </svg>
  );
}

export function Logo({
  href = "/",
  tone = "light",
  className = "",
}: {
  href?: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <Link href={href} className={`group inline-flex items-center gap-2.5 ${className}`}>
      <span className="transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-105">
        <LogoMark />
      </span>
      <span
        className={`text-[19px] font-bold tracking-tight ${
          tone === "light" ? " text-slate-900" : "text-white"
        }`}
      >
        Share<span className="text-emerald-400"> Project</span>
      </span>
    </Link>
  );
}
