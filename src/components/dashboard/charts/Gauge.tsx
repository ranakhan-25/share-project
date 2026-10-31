"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { useLang } from "@/lib/i18n";

/** Semi-circle progress gauge. value: 0..1 */
export function Gauge({ value, label }: { value: number; label: string }) {
  const id = useId().replace(/:/g, "");
  const { num } = useLang();
  const d = "M 20 120 A 90 90 0 0 1 200 120";
  return (
    <div className="relative mx-auto w-full max-w-[280px]">
      <svg viewBox="0 0 220 135" className="w-full" role="img" aria-label={`${Math.round(value * 100)}%`}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#059669" />
            <stop offset="1" stopColor="#0284c7" />
          </linearGradient>
        </defs>
        <path d={d} fill="none" stroke="#f1f5f9" strokeWidth={18} strokeLinecap="round" />
        <motion.path d={d} fill="none" stroke={`url(#${id})`} strokeWidth={18} strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: value }} viewport={{ once: true }} transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }} />
      </svg>
      <div className="absolute inset-x-0 bottom-1 text-center">
        <p className="text-3xl font-extrabold tracking-tight text-slate-900">{num(value, { style: "percent", maximumFractionDigits: 0 })}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
