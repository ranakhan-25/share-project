"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { PALETTE } from "./utils";

export type Slice = { name: string; value: number };

function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M${x0},${y0}A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1},${y1}`;
}

export function DonutChart({ data, centerLabel }: { data: Slice[]; centerLabel: string }) {
  const { taka, num } = useLang();
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const size = 220, r = 82, gap = 0.05;
  let acc = -Math.PI / 2;
  const arcs = data.map((d) => {
    const span = (d.value / total) * Math.PI * 2;
    const a0 = acc + gap / 2, a1 = acc + span - gap / 2;
    acc += span;
    return { a0, a1 };
  });
  const active = hover !== null ? data[hover] : null;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label="Donut chart">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={22} />
          {arcs.map((a, i) => (
            <motion.path
              key={i}
              d={arc(size / 2, size / 2, r, a.a0, a.a1)}
              fill="none"
              stroke={PALETTE[i]}
              strokeLinecap="round"
              animate={{ strokeWidth: hover === i ? 28 : 22, opacity: hover === null || hover === i ? 1 : 0.35 }}
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ pathLength: { duration: 1.1, delay: i * 0.12, ease: "easeOut" }, strokeWidth: { duration: 0.2 }, opacity: { duration: 0.2 } }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{active ? active.name : centerLabel}</p>
          <p className="mt-0.5 text-2xl font-bold text-slate-900">{taka(active ? active.value : total, true)}</p>
          {active && <p className="text-xs font-semibold text-slate-500">{num(active.value / total, { style: "percent", maximumFractionDigits: 1 })}</p>}
        </div>
      </div>
      <ul className="w-full space-y-1.5">
        {data.map((d, i) => (
          <li
            key={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className={`flex cursor-default items-center justify-between rounded-xl px-3 py-2 text-sm transition ${hover === i ? "bg-slate-100" : ""}`}
          >
            <span className="flex items-center gap-2.5 text-slate-600"><span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i] }} />{d.name}</span>
            <span className="font-semibold text-slate-900">{num(d.value / total, { style: "percent", maximumFractionDigits: 0 })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
