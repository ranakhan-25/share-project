"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { monotonePath } from "./utils";

export function Sparkline({ values, color, width = 120, height = 44 }: { values: number[]; color: string; width?: number; height?: number }) {
  const id = useId().replace(/:/g, "");
  if (values.length === 0) {
    return (
      <svg width={width} height={height} aria-hidden>
        <path d={`M0 ${height - 4} L${width} ${height - 4}`} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" opacity={0.35} />
      </svg>
    );
  }
  const min = Math.min(...values), max = Math.max(...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * width, 4 + (1 - (v - min) / (max - min || 1)) * (height - 8)] as [number, number]);
  const d = monotonePath(pts);
  return (
    <svg width={width} height={height} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".25" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d}L${width},${height}L0,${height}Z`} fill={`url(#${id})`} />
      <motion.path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3.5} fill={color} stroke="#fff" strokeWidth={2} />
    </svg>
  );
}
