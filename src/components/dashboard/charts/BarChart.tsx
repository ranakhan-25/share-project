"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { PALETTE, niceMax, useMeasure } from "./utils";

export function BarChart({ labels, actual, target, names, height = 280 }: { labels: string[]; actual: number[]; target: number[]; names: [string, string]; height?: number }) {
  const { taka } = useLang();
  const [ref, width] = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const m = { t: 12, r: 8, b: 28, l: 54 };
  const w = Math.max(width - m.l - m.r, 10);
  const h = height - m.t - m.b;
  const max = niceMax(Math.max(...actual, ...target) * 1.05);
  const band = w / labels.length;
  const bw = Math.min(18, band * 0.28);
  const y = (v: number) => m.t + h - (v / max) * h;

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="Bar chart" onMouseLeave={() => setHover(null)}>
          {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
            <g key={i}>
              <line x1={m.l} x2={m.l + w} y1={y(f * max)} y2={y(f * max)} stroke="#e2e8f0" strokeDasharray={i === 0 ? undefined : "3 5"} />
              <text x={m.l - 10} y={y(f * max) + 4} textAnchor="end" className="fill-slate-400 text-[11px]">{taka(f * max, true)}</text>
            </g>
          ))}
          {labels.map((l, i) => {
            const cx = m.l + band * i + band / 2;
            const vals = [actual[i], target[i]];
            return (
              <g key={i} onMouseEnter={() => setHover(i)}>
                <rect x={m.l + band * i} y={m.t} width={band} height={h} fill={hover === i ? "#f1f5f9" : "transparent"} rx={8} />
                {vals.map((v, k) => {
                  const bh = (v / max) * h;
                  const bx = cx + (k === 0 ? -bw - 1 : 1);
                  return (
                    <motion.rect
                      key={`${k}-${width}`}
                      x={bx}
                      width={bw}
                      rx={4}
                      fill={PALETTE[k === 0 ? 0 : 1]}
                      opacity={k === 1 ? 0.55 : 1}
                      initial={{ y: m.t + h, height: 0 }}
                      whileInView={{ y: m.t + h - bh, height: bh }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: i * 0.05 + k * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    />
                  );
                })}
                <text x={cx} y={height - 8} textAnchor="middle" className="fill-slate-400 text-[11px]">{l}</text>
              </g>
            );
          })}
        </svg>
      )}
      {hover !== null && width > 0 && (
        <div className="pointer-events-none absolute z-10 min-w-[150px] rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-xl backdrop-blur" style={{ left: Math.min(Math.max(m.l + band * hover + band / 2 - 75, 0), width - 160), top: 0 }}>
          <p className="mb-1.5 font-semibold text-slate-900">{labels[hover]}</p>
          {[actual[hover], target[hover]].map((v, k) => (
            <p key={k} className="flex items-center justify-between gap-4 text-slate-600">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: PALETTE[k] }} />{names[k]}</span>
              <b className="text-slate-900">{taka(v, true)}</b>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
